import { z } from "zod";
import { ExuluTool, ExuluDefaultAgents, ExuluUtils, ExuluVariables } from "@exulu/backend";
import FirecrawlApp from '@mendable/firecrawl-js';
import { Stagehand, ConstructorParams } from "@browserbasehq/stagehand";

export async function processPromisesBatch(
    items: string[],
    limit: number,
    fn: (item: any) => Promise<any>,
    minTimeInSecondsBetweenBatches: number = 0
): Promise<any> {
    let results: any[] = [];
    let lastBatchTime = 0;

    for (let start = 0; start < items.length; start += limit) {
        const currentTime = Date.now();
        const timeSinceLastBatch = currentTime - lastBatchTime;
        console.log("timeSinceLastBatch", timeSinceLastBatch)
        if (timeSinceLastBatch < minTimeInSecondsBetweenBatches * 1000) {
            console.log("Waiting for", minTimeInSecondsBetweenBatches - timeSinceLastBatch, "seconds")
            await new Promise(resolve => setTimeout(resolve, minTimeInSecondsBetweenBatches * 1000 - timeSinceLastBatch));
        }
        lastBatchTime = Date.now();
        const end = start + limit > items.length ? items.length : start + limit;
        const slicedResults = await Promise.all(items.slice(start, end).map(fn));
        results = [
            ...results,
            ...slicedResults,
        ]
    }

    return results;
}

const fileExtensions = [
    ".pdf",
    ".jpg",
    ".png",
    ".jpeg",
    ".gif",
    ".svg",
    ".ico",
    ".webp",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".zip",
    ".rar",
    ".7z",
    ".xml",
    ".tar",
    ".gz",
    ".bz2",
    ".xz",
    ".mp3",
    ".mp4",
    ".avi",
    ".mov",
    ".wmv",
    ".flv",
    ".mkv",
    ".webm",
    ".mpg",
    ".mpeg",
    ".m4v",
    ".m4a",
    ".m4b",
    ".m4p",
    ".m4v",
]

const scrape = new ExuluTool({
    id: `firecrawl_scraping`,
    type: "function",
    name: "Firecrawl scraping.",
    inputSchema: z.object({
        urls: z.array(z.string()).describe("The urls of the web pages to scrape.")
    }),
    config: [
        {
            name: "apiKey",
            description: "The API key for the Firecrawl app."
        }
    ],
    description: `Takes each url and scrapes the page, returning the data in markdown format.`,
    execute: async ({ urls, config }: any) => {

        console.log("[EXULU] Firecrawl config", config)

        console.log("[EXULU] Firecrawl urls", urls)

        if (urls?.length > 20) {
            // slice the urls to 20
            console.log("[EXULU] Max number of urls exceeded, slicing to 20.")
            urls = urls.slice(0, 20);
        }

        if (!config.apiKey) {
            throw new Error("Firecrawl API key not set in the config.")
        }

        const app = new FirecrawlApp({ apiKey: config.apiKey });

        const promises = urls.map(async (url: string) => {
            try {
                const scrapeResult = await app.scrape(url, {
                    formats: ['markdown'], location: {
                        country: "DE",
                        languages: ["de-DE"]
                    }
                });
                return scrapeResult;
            } catch (error) {
                console.error("[EXULU] Error scraping url", url, error)
                return null;
            }
        })

        const results = await Promise.all(promises);

        return {
            result: JSON.stringify(results),
        };
    }
})

const getSiteMap = async (firecrawl: FirecrawlApp, url: string): Promise<{
    pages: string[];
}> => {
    const mapResult = await firecrawl.map(url, {
        limit: 1000,
        sitemap: 'include'
    });
    if (!mapResult.links) {
        throw new Error("No links found in site map for " + url);
    }
    let links = mapResult.links.map((l: any) => l.url);
    const pages = links.filter((l: any) => !fileExtensions.some((ext: string) => l.endsWith(ext)));
    return {
        pages,
    };
}

const setupStagehand = async ({
    browserbaseApiKey,
    browserbaseProjectId,
}: {
    browserbaseApiKey: string;
    browserbaseProjectId: string;
}): Promise<Stagehand> => {
    const config: ConstructorParams = {
        env: "BROWSERBASE", // or "LOCAL"
        apiKey: browserbaseApiKey,
        projectId: browserbaseProjectId,
        modelClientOptions: {
            apiKey: "",
        },
        verbose: 0,
        browserbaseSessionCreateParams: {
            projectId: browserbaseProjectId,
            browserSettings: {
                blockAds: true,
                viewport: {
                    width: 1024,
                    height: 768,
                },
            },
        },
    };
    const stagehand = new Stagehand(config);
    await stagehand.init();
    return stagehand;
}

const getPageContent = async (url: string, browserbaseApiKey: string, browserbaseProjectId: string): Promise<{
    url: string;
    pages: string[];
    files: string[];
    images: string[];
    text: string;
}> => {
    try {
        return await ExuluUtils.retry({
            retries: 3,
            delays: [1000, 5000, 10000],
            fn: async () => {
                const stagehand = await setupStagehand({
                    browserbaseApiKey,
                    browserbaseProjectId
                });

                console.log("Getting links for: ", url);
                const protocol = new URL(url).protocol;
                const domain = new URL(url).hostname;
                const page = stagehand.page;
                await page.goto(url);

                let links = await page.evaluate(() => {
                    // @ts-ignore
                    const links = document.querySelectorAll('a');
                    return Array.from(links).map((link: any) => link.getAttribute('href'));
                });

                links = links.filter((l: any) => typeof l === "string");

                // add domain to relative urls
                links = links.map((l: any) => {
                    if (l.startsWith("/")) {
                        console.log("Relative url, adding domain: ", protocol + "//" + domain + l)
                        return protocol + "//" + domain + l;
                    }
                    return l;
                });

                const exclusions = [
                    "mailto:",
                    "tel:",
                ]

                // Filter out exclusions
                links = links.filter((l: any) => !exclusions.some((e: string) => l.includes(e)));

                const pages = links.filter((l: any) => !fileExtensions.some((ext: string) => l.endsWith(ext)));
                const files = links.filter((l: any) => fileExtensions.some((ext: string) => l.endsWith(ext)));

                const images = await page.evaluate(() => {
                    // @ts-ignore
                    const images = document.querySelectorAll('img');
                    return Array.from(images).map((image: any) => image.getAttribute('src'));
                });

                const text = await page.evaluate(() => {
                    // @ts-ignore
                    const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, li, div, td, th, label, button, a');
                    return Array.from(textElements)
                        .map((element: any) => element.textContent?.trim())
                        .filter(text => text && text.length > 0)
                        .join(' ');
                });
                await stagehand.close();
                return {
                    url,
                    text,
                    pages,
                    files,
                    images,
                };
            }
        })
    } catch (error) {
        console.error("[EXULU] Error getting page content", error)
        return {
            url,
            pages: [],
            files: [],
            images: [],
            text: "",
        };
    }

}

const sitemap = new ExuluTool({
    id: `firecrawl_sitemap_analysis`,
    type: "function",
    name: "Firecrawl sitemap.",
    description: `Takes a url and generates a complete list of all the pages on a site.`,
    inputSchema: z.object({
        url: z.string().describe("The url of the website to generate a sitemap for."),
        exclude: z.array(z.string()).describe("Optional list of paths or full url's to exclude from the sitemap, for example /blog /contact etc...").optional(),
    }),
    config: [
        {
            name: "firecrawlApiKey",
            description: "The API key for the Firecrawl app."
        },
        {
            name: "browserbaseApiKey",
            description: "The API key for your Browserbase account."
        },
        {
            name: "browserbaseProjectId",
            description: "The project id for your Browserbase account."
        }
    ],
    execute: async ({ url, exclude, config, upload }: any) => {

        const {
            browserbaseProjectId, browserbaseApiKey, firecrawlApiKey
        } = config;

        if (!firecrawlApiKey) {
            throw new Error("Firecrawl API key not set in the config.")
        }

        const firecrawl = new FirecrawlApp({ apiKey: firecrawlApiKey });

        const domain = new URL(url).hostname;

        let {
            pages: siteMapPages,
        } = await getSiteMap(firecrawl, url);

        // Make sure we only keep pages that are on the same domain
        siteMapPages = siteMapPages.filter((l: any) => l.includes(domain))
        // Remove duplicates
        siteMapPages = [...new Set(siteMapPages)];

        if (exclude) {
            siteMapPages = siteMapPages.filter((l: any) => !exclude.some((e: string) => l.includes(e)));
        }

        if (siteMapPages?.length > 50) {
            console.log("[EXULU] Max number of site map pages exceeded, slicing to 50.")
            siteMapPages = siteMapPages.slice(0, 50);
        }

        console.log("Site map pages: ", siteMapPages?.length);

        let mainResultsArray: {
            url,
            pages,
            files,
            images,
            text,
            // todo replace with ExuluUtils.batch
        }[][] = await processPromisesBatch(siteMapPages, 5, (url: string) => getPageContent(url, browserbaseApiKey, browserbaseProjectId), 3);

        let mainResults = mainResultsArray.flat();
        // Now lets get for all the links we found by analysing the pages
        // which did not exist in the site map.
        let subpageLinks = mainResults.map(l => l.pages).flat();
        console.log("Subpage links before filtering: ", subpageLinks);
        // filter out null values
        subpageLinks = subpageLinks.filter((l: any) => typeof l === "string");
        // Filter out subpages that were already part of site map
        subpageLinks = subpageLinks.filter((l: any) => !siteMapPages.includes(l));
        console.log("Subpage links after filtering: ", subpageLinks);
        // Only keep subpages that are on the same domain / internal links
        subpageLinks = subpageLinks.filter((l: any) => l.includes(domain))
        subpageLinks = subpageLinks.map(l => {
            const url = new URL(l);
            const clean = url.protocol + "//" + url.hostname + url.pathname;
            // remove trailing slash
            return clean.replace(/\/$/, "");
        })

        // Remove duplicates
        subpageLinks = [...new Set(subpageLinks)];

        if (exclude) {
            subpageLinks = subpageLinks.filter((l: any) => !exclude.some((e: string) => l.includes(e)));
        }

        console.log("Subpages: ", subpageLinks?.length);

        if (subpageLinks?.length > 50) {
            console.log("[EXULU] Max number of subpage links exceeded, slicing to 20.")
            subpageLinks = subpageLinks.slice(0, 50);
        }

        let subpageResultsArray: {
            url,
            pages,
            files,
            images,
            text,
            // todo replace with ExuluUtils.batch
        }[][] = await processPromisesBatch(subpageLinks, 5, (url: string) => getPageContent(url, browserbaseApiKey, browserbaseProjectId), 3);

        let subpageResults = subpageResultsArray.flat();

        let allLinks: string[] = [
            ...mainResults.map(l => l.pages).flat(),
            ...subpageResults.map(l => l.pages).flat(),
        ]

        // Remove duplicates
        allLinks = [...new Set(allLinks)];
        console.log("All links: ", allLinks?.length);

        let allResults = [
            ...mainResults,
            ...subpageResults,
        ]

        const item = await upload({
            name: "Firecrawl sitemap for: " + url,
            data: JSON.stringify(allResults),
            type: ".json",
            tags: [`firecrawl, sitemap, ${url}`]
        })

        return {
            result: "",
            items: [item]
        };
    }
})

const llmsText = new ExuluTool({
    id: `generate_llm_txt`,
    type: "function",
    name: "Generate llm.txt file.",
    description: `Takes a file that contains the crawling output of a website and generates a llm.txt file.`,
    inputSchema: z.object({
        file: z.string().describe("The url of the file that contains the crawling output of a website."),
        prompt: z.string().describe("A prompt the user can provide that is used to guide the generation of the llm.txt file."),
    }),
    config: [
        {
            name: "firecrawlApiKey",
            description: "The API key for the Firecrawl app."
        }
    ],
    execute: async ({ file, prompt, config, user, contexts }: any) => {

        // todo change it so the sitemap function only returns the url's, and we do the scraping here on demand

        // fetch file content (json)
        console.log("[EXULU] Fetching file content", file)
        const content = await fetch(file);
        const json = await content.json();
        console.log("[EXULU] File content", json)

        let llmstxt = ""
        let llmfulltxt = ""

        if (!Array.isArray(json) || !json[0].text) {
            throw new Error("Invalid file content.")
        }

        let i = 0;
        const results: {
            url: string;
            description: string;
            title: string;
            tags: string[];
            markdown: string;
        }[] = await Promise.all(json.map(async (item: {
            url: string;
            text: string;
        }) => {

            if (!item.url.includes("open.de")) {
                return {
                    url: item.url,
                    description: "",
                    title: "",
                    tags: [],
                    markdown: "",
                }
            }
            console.log("[EXULU] Processing item nr:", i, "of", json.length)
            i++;
            const text = item.text.slice(0, 50000);
            const result: any = await ExuluDefaultAgents.openai.gpt5Mini.generateSync({
                session: undefined,
                message: undefined,
                toolConfigs: undefined,
                contexts: undefined,
                exuluConfig: undefined,
                filesContext: undefined,
                instructions: undefined,
                prompt: `Generate a 9-10 word description, a 3-4 word title, a set of tags to group the pages into logical sections (homepage, services, blog, announcements, misc), and the markdown of the entire 
    page based on ALL the content one will find on the page, if the page is too long, summarize it to 3.000 words or less and make sure the markdown does not include 
    elements from html like "CTA", or Navigation Menu listings.
    This will help in a user finding the page for its intended purpose. Make sure all content is in english but do not change any urls as they would then no longer work.
    
    Page content:
    ${text}
    `,
                user,
                statistics: {
                    label: "generate_llm_txt",
                    trigger: "tool"
                },
                providerapikey: await ExuluVariables.get("OPENAI_API_KEY"),
                outputSchema: z.object({
                    description: z.string().describe("The description of the page."),
                    markdown: z.string().describe("The markdown of the page."),
                    title: z.string().describe("The title of the page."),
                    tags: z.array(z.string()).describe("The tags of the page so we can group them later. Tags can be homepage, services, blog, announcements or misc (misc pages are for example the contact page, legal pages, etc.)."),
                })
            })
            llmstxt += " - [" + result.title + "](" + item.url + "): " + result.description + "\n";
            return {
                url: item.url,
                description: result.description,
                markdown: result.markdown,
                tags: result.tags,
                title: result.title
            }
        }))

        console.log("[EXULU] Results", results)

        // Add content to llmsfulltxt, but grouped by tags, with the homepage first, then services, then blog posts, etc.

        const homepages = results.filter((result: any) => result.tags.includes("homepage"));
        const services = results.filter((result: any) => result.tags.includes("services"));
        const blog = results.filter((result: any) => result.tags.includes("blog"));
        const announcements = results.filter((result: any) => result.tags.includes("announcements"));
        const misc = results.filter((result: any) => result.tags.includes("misc"));

        if (homepages.length > 0) {
            for (const homepage of homepages) {
                llmfulltxt += "<|page-" + homepage.url + "-lllmstxt|>\n## " + homepage.title + "\n" + homepage.markdown + "\n\n";
            }
        }
        if (services.length > 0) {
            for (const service of services) {
                llmfulltxt += "<|page-" + service.url + "-lllmstxt|>\n## " + service.title + "\n" + service.markdown + "\n\n";
            }
        }
        if (blog.length > 0) {
            for (const blogpost of blog) {
                llmfulltxt += "<|page-" + blogpost.url + "-lllmstxt|>\n## " + blogpost.title + "\n" + blogpost.markdown + "\n\n";
            }
        }
        if (misc.length > 0) {
            for (const miscpage of misc) {
                llmfulltxt += "<|page-" + miscpage.url + "-lllmstxt|>\n## " + miscpage.title + "\n" + miscpage.markdown + "\n\n";
            }
        }
        if (announcements.length > 0) {
            for (const announcement of announcements) {
                llmfulltxt += "<|page-" + announcement.url + "-lllmstxt|>\n## " + announcement.title + "\n" + announcement.markdown + "\n\n";
            }
        }

        const result: any = await ExuluDefaultAgents.openai.gpt5Mini.generateSync({
            session: undefined,
            message: undefined,
            toolConfigs: undefined,
            contexts: undefined,
            exuluConfig: undefined,
            filesContext: undefined,
            outputSchema: undefined,
            instructions: undefined,
            prompt: `Here is a draft llm.txt file, containing the description and title of each page. I would like
            you to improve it by grouping it into logical sections (general pages first, services, blog posts, etc. after that), and adding an introduction at the top that describes
            the company and its services. Make sure all content is in english but do not change the url's themselves.
Page content:
${llmstxt}
`,
            user,
            statistics: {
                label: "generate_llm_txt",
                trigger: "tool"
            },
            providerapikey: await ExuluVariables.get("OPENAI_API_KEY"),
        })

        llmstxt = result;

        // Save to item
        const item = await contexts["llms_txt"].createItem({
            name: "Llm.txt outputs for: " + file,
            full: llmfulltxt,
            summary: llmstxt,
            tags: [`firecrawl, llm, txt, ${file}`],
        })

        return {
            result: "Test ran successfully",
            job: undefined,
            items: [item]
        };
    }
})

const extract = new ExuluTool({
    id: `firecrawl_extract`,
    type: "function",
    name: "Firecrawl extract.",
    inputSchema: z.object({
        urls: z.array(z.string()).describe("The urls of the web pages to scrape."),
        schema: z.string().describe(`A valid JSON array of field names and descriptions to extract. Should follow this format:
        [
            {
                "name": "field_name",
                "description": "field_description"
            }
        ]
`)
    }),
    config: [
        {
            name: "apiKey",
            description: "The API key for the Firecrawl app."
        }
    ],
    description: `Takes each url and extracts the data from the page.`,
    execute: async ({ urls, schema, config }: any) => {

        const json = JSON.parse(schema);

        if (!json) {
            throw new Error("Invalid schema.")
        }

        const zod = z.object({});
        json.forEach((item) => {
            zod.extend({
                [item.name]: z.string().describe(item.description)
            })
        });

        console.log("[EXULU] Zod schema", zod)

        console.log("[EXULU] Firecrawl config", config)

        if (!config.apiKey) {
            throw new Error("Firecrawl API key not set in the config.")
        }

        const app = new FirecrawlApp({ apiKey: config.apiKey });

        const scrapeResult = await app.extract({
            urls,
            schema: zod,
        });

        if (!scrapeResult.success) {
            throw new Error(`Failed to scrape: ${scrapeResult.error}`)
        }

        return {
            result: JSON.stringify(scrapeResult.data)
        }
    }
})

export { sitemap, scrape, llmsText, extract };