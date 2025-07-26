import { ExuluLogger, ExuluWorkflow, ExuluZodFileType } from "@exulu/backend";
import Groq from "groq-sdk";
import { z } from "zod";
import { contexts } from "@EXULU_CONTEXTS";

function formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
}

interface TranscriptionSegment {
    id: number;
    start: number;
    end: number;
    text: string;
}

function jsonToSrt(transcriptionJson: TranscriptionSegment[]): string {
    const srtLines: string[] = transcriptionJson.map(segment => {
        const startTime = formatTime(segment.start);
        const endTime = formatTime(segment.end);
        return `${segment.id + 1}\n${startTime} --> ${endTime}\n${segment.text}\n`;
    });
    return srtLines.join('\n');
}

const inputSchema = ExuluZodFileType({
    name: "audio",
    label: "Audio file",
    description: "An m4a file.",
    allowedFileTypes: [".m4a"]
})

type InputType = z.infer<typeof inputSchema>;

const flowId = "9876-5432-1098-7654";
export const transcriberFlow = new ExuluWorkflow({
    id: flowId,
    name: "transcriberFlow",
    queue: undefined,
    description: "Generates an srt transcription file, closed caption file, and a blog article based on a provided video.",
    steps: [
        {
            id: "transcribe",
            name: "Transcribe",
            description: "Transcribes the audio file.",
            inputSchema: inputSchema,
            fn: async ({ inputs, job, user, logger }: { inputs: InputType, job?: ExuluJob, user?: string, logger: ExuluLogger }) => {
                
                if (!inputs.audio) {
                    throw new Error("No audio file provided.");
                }

                await logger.write(`Starting workflow with job inputs. ${JSON.stringify(inputs)}`, "INFO");

                const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

                // We need to convert the audio file to a file object
                // because in dev mode, the file url is localhost
                // and groq cannot access it.
                // https://console.groq.com/docs/speech-to-text
                const url = inputs.audio;
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const blob = new Blob([buffer]);
                const file = new File([blob], 'audio.m4a', { type: 'audio/m4a' });

                const transcription: any = await groq.audio.transcriptions.create({
                    file: file,
                    model: "whisper-large-v3",
                    // prompt: "Prompt to guide the model's style or specify how to spell unfamiliar words. (limited to 224 tokens).",
                    response_format: "verbose_json",
                    timestamp_granularities: ["word", "segment"],
                    language: "de",
                    temperature: 0.0,
                });

                const srt = jsonToSrt(transcription.segments);

                await logger.write(`Transcript generated. ${JSON.stringify(transcription)}`, "INFO");

                const formatted = await groq.chat.completions.create({
                    messages: [
                        {
                            role: "system",
                            content: "Du bist ein Tool zur Aufbereitung von medizinischen Fachtexten, bekannte Begriffe lauten IAS IASMEIN.",
                        },
                        {
                            role: "user",
                            content: "Formatiere den folgenden Text in saubere Abschnitte und korrigiere Rechtschreibfehler. Erzeuge passende Überschriften ohne den Paragrafen zu verändern. Füge keine Statusmeldungen hinzu.",
                        },
                        {
                            role: "user",
                            content: transcription.text
                        }
                    ],
                    model: "llama-3.3-70b-versatile",
                });

                const summary = await groq.chat.completions.create({
                    messages: [
                        {
                            role: "system",
                            content: "Du bist ein Tool zur Aufbereitung von medizinischen Fachtexten, bekannte Begriffe lauten IAS IASMEIN.",
                        },
                        {
                            role: "user",
                            content: "Erstelle einen kurzen Summary des folgenden Textes.",
                        },
                        {
                            role: "user",
                            content: transcription.text
                        }
                    ],
                    model: "llama-3.3-70b-versatile",
                });

                const linkedin = await groq.chat.completions.create({
                    messages: [
                        {
                            role: "system",
                            content: "Agiere als Social Media Experte. Erstelle einen LinkedIn Post zum Thema des folgenden Textes. Erzähle das so, wie ich es selbst tue und der Welt davon erzählen möchte. Verwende bitte entsprechende Emojis. Versuche auch, das Publikum in den Beitrag einzubeziehen und versuche, dass andere Nutzer den Beitrag kommentieren wollen. Versuche, die Zeilen kurz und ansprechend zu halten. Denke auch an LinkedIn SEO und versuche, alle Anforderungen zu erfüllen. Achte darauf, dass der Inhalt zu 100 % originell und frei von Plagiaten ist. Gib außerdem 5 verwandte Hashtags für LinkedIn an.",
                        },
                        {
                            role: "user",
                            content: transcription.text
                        }
                    ],
                    model: "llama-3.3-70b-versatile",
                });

                const title = await groq.chat.completions.create({
                    messages: [
                        {
                            role: "system",
                            content: "Generiere einen passenden Titel für den folgenden Text.",
                        },
                        {
                            role: "user",
                            content: transcription.text
                        }
                    ],
                    model: "llama-3.3-70b-versatile",
                });

                return {
                    name: title.choices[0]?.message.content || "",
                    text: transcription.text,
                    formatted: formatted.choices[0]?.message.content || "",
                    summary: summary.choices[0]?.message.content || "",
                    linkedin: linkedin.choices[0]?.message.content || "",
                    audio: inputs.audio,
                    textLength: transcription.text.length,
                    srt: srt,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    archived: false,
                };
            }
        }
    ],
    // queue: ExuluQueues.use("transcription"),
    enable_batch: true
})

export default transcriberFlow;