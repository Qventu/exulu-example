import { ExuluChunkers, ExuluContext, ExuluDocumentProcessor, ExuluItem, ExuluQueues } from "@exulu/backend";
import { FileType } from "../types/file-type";
import { s3PathInfo } from "../utils";

const embeddingQueue = ExuluQueues.register("embedding_queue", {
    worker: 20,
    queue: 20,
}, 4, 100).use();

const processingQueue = ExuluQueues.register("processing_queue", {
    worker: 20,
    queue: 20,
}, 4, 100).use();

export const createChunker = async () => {
    return new ExuluChunkers.markdown()
}

const exampleTicketsContext = new ExuluContext({
    id: "example_tickets_context",
    name: "Example Tickets Context",
    description: "Example Tickets Context, includes example tickets for the IMP application.",
    embedder: {
        model: "gemini-embedding-001",
        queue: embeddingQueue,
    },
    chunker: async (inputs, maxChunkSize, utils) => {

        if (!inputs.description) {
            console.error("No description found in item", inputs);
            return {
                item: inputs,
                chunks: []
            }
        }

        const chunker = await createChunker();

        const chunks = await chunker.chunk(inputs.description, maxChunkSize, prefix, {
            pageBreakTags: false
        });

        return {
            item: inputs,
            chunks: chunks.map((chunk, index) => ({
                content: chunk.text,
                index: index
            }))
        }
    },
    active: true,
    queryRewriter: undefined,
    resultReranker: undefined,
    sources: [],
    configuration: {
        calculateVectors: "always",
        maxRetrievalResults: 20
    },
    fields: []
})

const exampleDocumentsContext = new ExuluContext({
    id: "example_documents_context",
    name: "Example Documents Context",
    description: "Example Documents Context, includes example documents for the IMP application.",
    embedder: {
        model: "gemini-embedding-001",
        queue: embeddingQueue,
    },
    chunker: async (inputs, maxChunkSize, utils) => {

        if (!inputs.markdown_s3key) {
            console.error("No markdown_s3key found in item", inputs);
            return {
                item: inputs,
                chunks: []
            }
        }

        const key = inputs.markdown_s3key;
        const url = await utils.storage.getPresignedUrl(key);
        const response = await fetch(url);
        const text = await response.text();

        // The processor for the document_s3key generates
        // a JSON array that is split by page of the pdf.
        const json: {
            page: number,
            content: string
        }[] = JSON.parse(text);

        const documentName = inputs.name || inputs.external_id || inputs.document_s3key || ""
        const prefix = `
        --- Document (Exulu ID: ${inputs.id}) ---
        Document Name: ${documentName}
        -------------------------`

        const chunker = await createChunker();

        const content = `${json.map(
            (page) => `${page.content} <page_break page=${page.page}>`).join("\n\n")}`

        const chunks = await chunker.chunk(content, maxChunkSize, prefix, {
            pageBreakTags: true
        });

        return {
            item: inputs,
            chunks: chunks.map((chunk, index) => ({
                content: chunk.text,
                index: index,
                metadata: {
                    page: chunk.page,
                    pdf: inputs.document_s3key,
                    markdown: inputs.markdown_s3key
                }
            }))
        }
    },
    active: true,
    queryRewriter: undefined,
    resultReranker: undefined,
    sources: [],
    configuration: {
        calculateVectors: "manual",
        maxRetrievalResults: 20
    },
    processor: {
        name: "Document Processor",
        description: "Takes PDF files and converts them to markdown, stores the markdown file in the item on the markdown field so it can be used for embedding.",
        config: {
            trigger: "always",
            queue: processingQueue,
            timeoutInSeconds: 60 * 40, // 40 minutes, some documents are 200 pages, so this is a reasonable timeout
            generateEmbeddings: true // means embeddings will be generated after the processor has finished
        },
        filter: async ({ item, user, role, exuluConfig, utils }) => {
            return item;
        },
        execute: async ({ item, user, utils }: {
            item: ExuluItem,
            user?: number,
            role?: string,
            exuluConfig: any,
            utils: any,
        }) => {

            if (!item.document_s3key) {
                console.error("No document_s3key found in item", item);
                return item;
            }

            const pathInfo = s3PathInfo(item.document_s3key);
            if (!pathInfo) {
                console.error("Invalid document_s3key", item.document_s3key);
                return item;
            }

            const sourceFileBucket = pathInfo.bucket;
            const sourceFileObject = pathInfo.object;
            const sourceFileExt = pathInfo.ext;
            const sourceFileKey = `${sourceFileObject}.${sourceFileExt}`;

            const key = item.document_s3key;
            const url = await utils.storage.getPresignedUrl(key);
            const array = await fetch(url).then(res => res.arrayBuffer());
            const buffer: Buffer = Buffer.from(array);
            const jsonFileKey = `${sourceFileObject}.json`;

            const result = await ExuluDocumentProcessor.process({
                file: buffer,
                name: item.document_s3key,
                config: {
                    processor: {
                        name: 'mistral',
                        model: 'vertex-ocr'
                    },
                    vlm: {
                        model: "vertex-gemini-2.5-flash",
                        concurrency: 40
                    }
                }
            })

            const uploadedKey = await utils.storage.uploadFile(
                Buffer.from(JSON.stringify(result)),
                jsonFileKey,
                FileType.json.toString(),
                user,
                {
                    sourceFile: sourceFileKey,
                    bucket: sourceFileBucket
                }
            );

            // The return payload
            // will be used to update
            // the item in the context.

            const object = {
                ...item,
                markdown_s3key: uploadedKey
            }

            return object;
        }
    },
    fields: [
        {
            name: "document",
            type: "file",
            allowedFileTypes: [".pdf"]
        },
        {
            name: "markdown",
            type: "file",
            allowedFileTypes: [".md"],
            editable: false,
            calculated: true
        }
    ]
})

export { exampleDocumentsContext, exampleTicketsContext };