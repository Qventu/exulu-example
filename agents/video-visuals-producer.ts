import { ExuluWorkflow, ExuluChunkers, ExuluLogger, type ExuluJob } from "@exulu/backend";
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { generateText, generateObject, experimental_generateImage } from 'ai';
import { z } from "zod";
import { GiphyFetch } from '@giphy/js-fetch-api'
import fs from "node:fs/promises";
import path from "node:path";

const styleGuide = `
This is our company's style guide:

Overall Aesthetic:
Core Concept: Openness fuels creativity and innovation.
Style: Clean and geometric, yet expressive.
Tone: thoughtful, modern.
Purpose: Effective for communicating abstract ideas such as balance, collaboration, 
growth, and structure through visuals balanced between corporate professionalism and creative freedom.

🎨 Color Palette
Name	Description	Hex Code (approx.)
OPEN Lime	Neon yellow-lime accent	#ECFF64
OPEN Olive	Muted olive green	#5C5B36
OPEN Olive Bright	Lightened olive tone	#D0D79A
OPEN Purple	Soft lavender for contrast elements	#C2A9F6
OPEN Red	Warm coral red	#FF5F57
OPEN Pitchblack	Deep black for strong contrast	#000000
OPEN Black	True black	#1A1A1A
OPEN Dark Grey	Neutral dark grey	#333333
OPEN Light Grey	Clean and soft neutral	#E0E0E0
White	Pure white	#FFFFFF

OPEN Lime is the signature pop color and should be used prominently in highlights or backgrounds.
OPEN Purple is commonly used in pattern accents and dot-based animations.
Black tones anchor the typography and layouts.
Olives and reds are supporting or thematic colors, often used in text, illustrations, or data visualizations.

Contrast: Created primarily through black or dark line work over light backgrounds.

🧩 Typography
Headline Font: Serif, elegant, editorial in tone (likely based on a modern Didone or transitional serif)
Body Font: Clean sans-serif, balanced and minimal

Styling Traits:
Headlines often use large sizes with generous tracking
High contrast between serif and sans-serif elements
Use of quotes, split lines, and emphasis on openness via layout spacing

Line Art:
Line Style: professional but slightly imperfect.
Line Weight: Medium thickness with consistent weight, but with a natural and casual feel (not overly precise).

Shapes and Forms
Geometry:
Use of basic geometric and organic forms: circles, rectangles, simple lines.
Negative Space: Generous use of blank space to allow each form to “breathe” and guide visual focus.

Composition
Layout:

Balanced and centered, with elements arranged to imply flow, connection, or stability.

Often features a vertical or triangular alignment.

Visual Rhythm: Achieved through repetition, symmetry, and thoughtful placement of visual elements.

Focus: Clear central focal point; surrounding elements support and guide the viewer’s eye without clutter.

Thematic Qualities
Abstract Representation: Elements are symbolic, not literal; used to evoke ideas rather than depict real objects.

🔲 Layouts & Motifs
Recurring Layout Patterns:
Grid-based structures, with spacing informed by geometric ratios
Use of dot matrices and radial symmetry (as seen in hero visuals)
Strong alignment, modular blocks, and overlapping layers

`;


const gf = new GiphyFetch('0FpAHhsUKx9jmvIjwZIk8826IbdYwE6V')


const step1InputSchema = z.object({
    script: z.string(),
})

const step1OutputSchema = z.object({
    visuals: z.array(z.object({
        sentence: z.string(),
        type: z.string(),
        idea: z.string(),
        urls: z.array(z.string()).nullable(),
    }))
})

type Step1InputType = z.infer<typeof step1InputSchema>;
type Step1OutputType = z.infer<typeof step1OutputSchema>;

const flowId = "326d5d90-4e60-4c8c-a9e6-15d8623eaf77";
export const videoVisualsProducerFlow = new ExuluWorkflow({
    id: flowId,
    name: "Video visuals producer",
    queue: undefined,
    description: "Generates a list of visuals for a video based on a provided script.",
    steps: [{
        id: "analyze-visuals",
        name: "Analyze visuals",
        inputSchema: step1InputSchema,
        description: "Generates a list of visuals for a video based on a provided script.",
        fn: async ({ inputs, job, user, logger }: { inputs: Step1InputType, job?: ExuluJob, user?: string, logger: ExuluLogger }) => {

            console.log("inputs step 1", inputs)

            const {
                script,
            } = inputs;

            const { object: visuals } = await generateObject({

                model: google("gemini-2.0-flash"),
                schema: step1OutputSchema,
                prompt: `You are a video editor. Your director has provided the following script for the video:

        Go through the script, and for every line in the script spoken by the human host called "Daniel" come up with an idea for a visual or visuals to show. These can be of the following categories:

        1. Image
        2. Chart
        3. Diagram
        4. Logo(s)
        5. Gif

        Your output should be a JSON array of objects with the following properties:

        sentence: <the sentence in the script you are referring to>
        type: <the type of the visual>
        idea: a description of your idea.

        For example a response could look like this:
        [
            {
                "sentence": "Company XYZ is making great progress with something...",
                "type": "logo",
                "idea": "A logo of the company XYZ"
            }
        ]

        Make sure to switch between the different types of visuals to keep it interesting, if a company is mentioned, make sure to use a logo of the company.
        If some kind of data is mentioned, make sure to use a chart show it, be specific if it should be a bar chart, line chart, pie chart, etc.
        If a diagram would be helpful, make sure to describe the diagram in detail, which elements are shown and how they are connected, and if any icons should be used for specific elements.
        If a gif would be helpful, make sure to describe your idea with a few keywords (no more than 3) so we can use it for searching on the giphy platform.
        If a logo is needed, make sure to use the company name as the idea.
        Make sure to use a mix of visuals throughout the video.

        <script>
        ${script}
        </script>
        `
            })

            return visuals;
        }
    },
    {
        id: "find-visuals",
        name: "Find visuals",
        inputSchema: step1OutputSchema,
        description: "Finds visuals for the video",
        fn: async ({ inputs, job, user, logger }: { inputs: Step1OutputType, job?: ExuluJob, user?: string, logger: ExuluLogger }) => {

            console.log("inputs step 2", inputs)

            const {
                visuals,
            } = inputs;

            let i = 0;
            for (const visual of visuals) {
                if (i > 10) break; // todo remove this
                i++;
                console.log("processing visual number ", i, "of", visuals.length)
                if (visual.type.toLowerCase().includes("gif")) {
                    let query = visual.idea;
                    if (query.length > 40) {
                        const { text } = await generateText({
                            model: openai("gpt-4o"),
                            prompt: `Can you shorten the following query to a maximum of 40 characters: ${query} so we can use it for searching on the giphy platform?`,
                        })
                        query = text;
                    }
                    console.log("finding gif", query)
                    const { data } = await gf.search(query, { limit: 5 })
                    visual.urls = data.map(x => x.embed_url)
                    console.log("found gifs", visual.urls)
                } else if (visual.type.toLowerCase().includes("logo")) {
                    const { object } = await generateObject({
                        model: openai("gpt-4o"),
                        prompt: `Can you find and return the url of a logo for the following company: ${visual.idea}. If you can't find a logo, return null.`,
                        schema: z.object({
                            url: z.string().nullable(),
                        }),
                    })
                    visual.urls = object.url ? [object.url] : null;
                    console.log("logo", visual.urls)
                } else {

                    console.log("generating image", visual.idea)
                    const { images } = await experimental_generateImage({
                        model: openai.image("gpt-image-1"),
                        prompt: `Generate a ${visual.type} for the following idea: ${visual.idea}. Use the following style: 
                ${styleGuide}
                `,
                        n: 1, // gpt-image-1 currently supports 1
                        aspectRatio: "16:9",
                        providerOptions: {
                            openai: { quality: 'high' },
                        }
                    });

                    const fileName = `ai_image_${Date.now()}.png`;
                    const filePath = path.join(process.cwd(), 'images', fileName);
                    await fs.writeFile(
                        filePath,
                        Buffer.from(images[0]?.base64 || "", "base64"),
                    );

                    console.log("image generated", filePath)
                    visual.urls = [filePath];
                }

            }

            return {
                visuals: visuals,
            };
        }
    }],
    // queue: ExuluQueues.use("transcription"),
    enable_batch: false
})

export default videoVisualsProducerFlow;