import { ExuluWorkflow, ExuluChunkers, ExuluLogger, type ExuluJob } from "@exulu/backend";
import { google } from '@ai-sdk/google';
import { generateText, generateObject } from 'ai';
import { z } from "zod";

const inputSchema = z.object({
    questions: z.array(z.object({
        question: z.string(),
    })),
    newsHighlights: z.array(z.object({
        title: z.string(),
        url: z.string(),
    })),
    companyInfo: z.string(),
    videoSeriesInfo: z.string(),
    videoInfo: z.string(),
    texts: z.array(z.object({
        text: z.string(),
        source: z.string()
    })),
    videoSegments: z.array(z.object({
        title: z.string(),
        description: z.string(),
        length: z.string()
    })),
})

type InputType = z.infer<typeof inputSchema>;

const flowId = "e968525d-1e2c-4209-95b9-7c3928df9654";
export const videoScriptProducerFlow = new ExuluWorkflow({
    id: flowId,
    queue: undefined,
    name: "Video producer",
    description: "Generates a video script based on a provided video series, company info, a provided outline of video segments as well as provided research texts, and a list of questions which is uses to research the internet.",
    steps: [{
        id: "script",
        name: "Script",
        inputSchema: inputSchema,
        description: "Generates a video script based on a provided video series, company info, a provided outline of video segments as well as provided research texts, and a list of questions which is uses to research the internet.",
        fn: async ({ inputs, job, user, logger }: { inputs: InputType, job?: ExuluJob, user?: string, logger: ExuluLogger }) => {

            console.log("inputs", inputs)

            const {
                questions,
                companyInfo,
                videoSeriesInfo,
                videoInfo,
                newsHighlights,
            } = inputs;

            const texts = inputs?.texts || [];

            const videoSegments: {
                title: string;
                description: string;
                length: string; // minutes
                research?: string;
                script?: string;
            }[] = inputs?.videoSegments || [];

            await logger.write(`Starting workflow with job inputs. ${JSON.stringify(inputs)}`, "INFO");

            let research: {
                text: string;
                sources: string[]
            }[] = [];

            if (questions.length > 0) {
                for (const { question } of questions) {
                    await logger.write(`Researching question: ${question}`, "INFO");

                    const { text, sources, providerMetadata } = await generateText({
                        model: google('gemini-2.0-flash', {
                            useSearchGrounding: true,
                        }),
                        prompt:
                            `You are a research assistant looking for information for a video script. The video will be about "${videoInfo}". Research 
                    the following question: "${question}" Try to answer it by using atleast 5 different sources. Make sure the sources are from 
                    well known and respected websites. Focus on the most important information specifically when relevant to the video. Don't make 
                    any assumptions, do not be creative, only use the information you find in the sources.`
                    });

                    await logger.write(`Research result: ${JSON.stringify(text)}`, "INFO");

                    research.push({
                        text: text,
                        sources: sources.map((source) => source.url)
                    })
                }
            }

            const highlights: {
                title: string;
                url: string;
                research: {
                    text: string;
                    sources: string[];
                }[];
            }[] = [];

            if (newsHighlights.length > 0) {
                for (const { title, url } of newsHighlights) {
                    await logger.write(`Researching highlight: ${title}`, "INFO");

                    const { text, sources, providerMetadata } = await generateText({
                        model: google('gemini-2.0-flash', {
                            useSearchGrounding: true,
                        }),
                        prompt:
                            `You are a research assistant looking for information for a video script. The video will be about "${videoInfo}". We do 
                            a section in the video regarding this weeks news in AI. Here is a highlight from this week: "${title}" Try to find information from atleast 3 different sources
                            but make sure to also review this site "${url}". Make sure the sources are from 
                    well known and respected websites. Focus on the most important information specifically when relevant to the video. Don't make 
                    any assumptions, do not be creative, only use the information you find in the sources.`
                    });

                    await logger.write(`Research result: ${JSON.stringify(text)}`, "INFO");

                    highlights.push({
                        title: title,
                        url: url,
                        research: [{
                            text: text,
                            sources: sources.map((source) => source.url)
                        }]
                    })
                }
            }

            let corpus: { text: string, sources: string[] }[] = [
                ...texts.map((text) => ({ text: text.text, sources: [text.source] })),
                ...research
            ];

            // go through the video segments and analyse the corpus of research 
            // information chunk by chunk to see if there is relevant
            // information. If so, add it to the video segment's "research 
            // information" property.

            const { text: highlightsScript } = await generateText({
                model: google("gemini-2.0-flash"),
                prompt: `You are a script writer, and you are writing a script for a video. Here is the description of the video series this video is part of:
        
        <video_series_description>
        ${videoSeriesInfo}
        </video_series_description>

        Here is a bit more information about our company:

        You are working on a segment of the video that is called "This weeks highlights" which talks about the most important news in AI this week.
        Below is a list of highlights we found this week and some research information we found for each highlight.

        <highlights>
        ${highlights.map((highlight) => `- ${highlight.title} (${highlight.url})
        ${highlight.research.map((research) => `- ${research.text}`).join("\n")}
        `).join("\n")}
        </highlights>

        Write a script for the segment, in the style of a news segment, using the information we found for the highlights.
        Make sure to write the segments where Daniel is speaking in a way that he conveys his opinion and insights into the news.
        Dedicate a maximum of 1 minute to each highlight.
        The script should be written in a way that is easy to understand and easy to follow from a teleprompter.
        `
            })

            const { text: banterScript } = await generateText({
                model: google("gemini-2.0-flash"),
                prompt: `You are a script writer for a weekly video where we try to demistify AI for businesses. You are writing a part of the script for this video. Here is the description of the video:
        
        <video_info>
        ${videoInfo}
        </video_info>

        You are working on a segment of the video that we call "bantering with AI" which is a short segment at the start
        of the video where me (Daniel the main host) and my co-host (Max who is actually an AI), have an authentic and playfull exchange.
        It starts with me asking an interesting question to Max, and then Max answers it. The question doesn't need to be business related,
        its more about establishing a connection and a rapport between me and Max, perhaps provoking Max to feel a bit more human or get the audience to
        think about what an AI is and can do. Write it in a style that is easy to understand and easy to follow from a teleprompter. For example:

        <daniel>
        Max how are you feeling today?
        </daniel>
        <max>
        That's a weird question to ask Daniel, I'm a computer program, I don't have feelings, but I'm doing my best to make you feel like I'm a real person.
        </max>
        `
            })

            for (const segment of videoSegments) {
                segment.research = "Proposed information to use in the segment:\n\n";

                for (const information of corpus) {

                    // We chunk the text because it could be very long, and we want to have a high
                    // level of granularity / recall.
                    const chunker = await ExuluChunkers.sentence.create({
                        tokenizer: "Xenova/gpt2", // Supports string identifiers or Tokenizer instance
                        chunkSize: 15000,            // Maximum tokens per chunk
                        chunkOverlap: 3000,         // Overlap between chunks
                        minSentencesPerChunk: 10    // Minimum sentences per chunk
                    });

                    await logger.write(`Chunking information: ${information.text}`, "INFO");

                    const chunks = await chunker.chunk(information.text);

                    await logger.write(`Chunks count: ${chunks.length}`, "INFO");

                    for (const chunk of chunks) {
                        const { text } = await generateText({
                            model: google("gemini-2.0-flash"),
                            prompt: `You are an assistant video producer, researching content for creating a script. Below is a piece of information that we previously found on the internet
                    that is relevant to our video. Our video is split up into segments, and we are currently working on segment ${segment.title}.
                    The segment description is: ${segment.description}.
                    The information we found is:
                    ${chunk.text}.

                    Please analyse the information and see if it is relevant to the segment. If it is return a brief proposal about how we could use it in this segment, don't worry about
                    the length of the segment yet, just return a specific, fact based proposal, clearly indicating the information we found and how it relates to the segment. If the
                    information is not highly relevant, return an empty string.
                    `
                        })

                        await logger.write(`Proposal: ${text}`, "INFO");

                        if (text.includes("NOT RELEVANT")) {
                            continue;
                        }

                        segment.research += `\n\n${text}\n\nSources: ${information.sources.join("- \n\n")}\n\n----\n\n`;
                    }
                }
            }

            for (const segment of videoSegments) {
                const { text } = await generateText({
                    model: google("gemini-2.0-flash"),
                    prompt: `You are a script writer, and you are writing a script for a video. The video is part of a video series we are producing. Here is the description of the video series:
            
            <video_series_description>
            ${videoSeriesInfo}
            </video_series_description>

            Here is a bit more information about our company:

            <company_info>
            ${companyInfo}
            </company_info>

            Below is a list of segments that we have come up with.

            <segment_list>
            ${videoSegments.map((segment) => `- ${segment.title} (max. ${segment.length} minutes long)`).join("\n")}
            </segment_list>

            Right now we are working on the segment called: ${segment.title}.
            The segment description is: 

            <segment_description>
            ${segment.description}
            </segment_description>

            The relevant and verified information we found for this segment is:

            <research_information>
            ${segment.research}
            </research_information>

            Write a script for the segment, using the information we found. Style the script as a script for a video, with a clear structure and a clear flow.
            The script should be written in a way that is easy to understand and easy to follow from a teleprompter.
            `
                })

                segment.script = text;
            }

            videoSegments.unshift({
                title: "This weeks highlights",
                description: "This weeks highlights",
                length: "1",
                research: highlights.map((highlight) => highlight.research.map((research) => research.text).join("\n")).join("\n"),
                script: highlightsScript
            });

            videoSegments.unshift({
                title: "Bantering with AI",
                description: "Bantering with AI",
                length: "1",
                research: "",
                script: banterScript
            });

            videoSegments.unshift({
                title: "Intro",
                description: "Intro to the video",
                length: "1",
                research: "",
                script: `
                <daniel>
                Welcome back to AI demistified by OPEN Digital group, the show where we discuss the latest in AI topics. For those who don't know us, with 250+ Tech Experts across
                7 locations in Germany, we are a leading provider of digital services and solutions across systems like Shopify, Hubspot, Zendesk, Shopware as well as complex 
                software development and customized AI Solutions.
                I'm your host Daniel, and together with my co-host Max, who is actually an AI, we try to offer guidance and insights into how AI works, and how it is relevant to your business.
                </daniel>
                <max>
                Hii!
                </max>
                <daniel>
                Who actually is an AI!
                </daniel>
                <max>
                That's true :)
                </max>
                <daniel>
                We try to offer guidance and insights into how AI works, and how it is relevant to your business.
                We start each video with a segment about the most important news in AI this week, which Max has kindly prepared for us. Let's get started.
                </daniel>
                `
            })

            const { text: summary } = await generateText({
                model: google("gemini-2.0-flash"),
                prompt: `Based on the below proposed script write a summary of the video:

        <script>
        ${videoSegments.map((segment) => segment.script).join("\n")}
        </script>
        `
            })

            const { text: title } = await generateText({
                model: google("gemini-2.0-flash"),
                prompt: `Based on the below proposed script write a great, provocative youtube title for the video:

        <script>
        ${videoSegments.map((segment) => segment.script).join("\n")}
        </script>
        `
            })
            // generate images:
            // - entity relationship diagrams
            // - mind maps
            // - charts
            // - logos (from a database?)
            // - memes?

            const { text: english } = await generateText({
                model: google("gemini-2.0-flash"),
                prompt: `
                You are a script writer, you have prepared a draft script below. Clean it up so we can use it 
                in a teleprompter. Make sure to use Markdown formatting. Make sure to clearly indicate if 
                the AI moderator (who is called "Max"), or human host (who is called "Daniel") is speaking and when a segment starts and ends.

        <draft_script>
        ${videoSegments.map((segment) => `
            START_SEGMENT
            ${segment.script}
            END_SEGMENT
        `).join("\n")}
        </draft_script>
        `
            })

            const { text: german } = await generateText({

                model: google("gemini-2.0-flash"),
                prompt: `You are a script writer, you have prepared a draft script below. Translate the script to informal German, keep the formatting tone and structure the same.

        <english_script>
        ${english}
        </english_script>
        `
            })

            return {
                title: title,
                summary: summary,
                script: {
                    english,
                    german
                }
            };
        }
    }],
    // queue: ExuluQueues.use("transcription"),
    enable_batch: false
})

export default videoScriptProducerFlow;