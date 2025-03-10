import { z } from "zod";
import { ZapAction } from "../../zap_action";
import { ElevenLabsConfig } from "../../../config/elevenlabs_config";

// Input schema for speech-to-text conversion
const SpeechToTextSchema = z
  .object({
    audio_url: z
      .string()
      .url()
      .describe("URL to the audio file to transcribe"),
    
    model_id: z
      .enum(["scribe_v1", "scribe_streaming_v1"])
      .default("scribe_v1")
      .describe("The ID of the model to use for transcription"),
    
    content_type: z
      .enum(["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/vnd.wav", "audio/webm"])
      .default("audio/mp3")
      .describe("Content type of the audio file"),
    
    include_timestamps: z
      .boolean()
      .default(false)
      .describe("Whether to include word-level timestamps in the results"),
    
    include_confidence: z
      .boolean()
      .default(false)
      .describe("Whether to include confidence scores in the results"),
  })
  .strict();

const SPEECH_TO_TEXT_PROMPT = `
This tool converts spoken audio into text using ElevenLabs' speech-to-text API.

Required inputs:
- audio_url: URL to the audio file to transcribe

Optional inputs:
- model_id: The model to use (default: "scribe_v1")
  Options: "scribe_v1", "scribe_streaming_v1"
- content_type: MIME type of the audio file (default: "audio/mp3")
  Options: "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/vnd.wav", "audio/webm"
- include_timestamps: Include word-level timestamps in the results (default: false)
- include_confidence: Include confidence scores for transcription (default: false)

Example usage:
\`\`\`
{
  "audio_url": "https://storage.googleapis.com/eleven-public-cdn/audio/marketing/nicole.mp3",
  "model_id": "scribe_v1",
  "include_timestamps": true
}
\`\`\`
`;

/**
 * Converts speech to text using ElevenLabs API.
 * @param params The parameters for the speech-to-text conversion
 * @returns The transcribed text
 */
export async function speechToText(params: z.infer<typeof SpeechToTextSchema>): Promise<string> {
  const config = ElevenLabsConfig.getInstance();
  const apiKey = config.getApiKey();

  if (!apiKey) {
    throw new Error("ElevenLabs API key not found. Please set it in your configuration or as ELEVENLABS_API_KEY environment variable.");
  }

  try {
    // Dynamically import to avoid Node.js/browser compatibility issues
    const { ElevenLabsClient } = await import("elevenlabs");
    
    // Create the client
    const client = new ElevenLabsClient({
      apiKey: apiKey,
    });

    // Fetch the audio file
    const response = await fetch(params.audio_url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch audio from URL: ${response.status} ${response.statusText}`);
    }
    
    // Create audio blob
    const audioBlob = new Blob([await response.arrayBuffer()], { type: params.content_type });
    
    // Prepare request options
    const options: any = {
      audio_url: params.audio_url,
      model_id: params.model_id,
    };

    // Convert speech to text
    const transcription = await client.speechToText.convert(options);
    
    // Format the result
    let result = "";
    
    if (typeof transcription === 'string') {
      // Simple transcription without timestamps
      result = `Transcription:\n${transcription}`;
    } else {
      // Detailed transcription with metadata
      result = `Transcription:\n${transcription.text}\n\n`;
      
      if (params.include_timestamps && transcription.words) {
        result += "Word timestamps:\n";
        transcription.words.forEach((word: any) => {
          result += `${word.text} (${word.start.toFixed(2)}s - ${word.end.toFixed(2)}s)`;
          if (params.include_confidence && word.confidence) {
            result += ` [Confidence: ${(word.confidence * 100).toFixed(1)}%]`;
          }
          result += "\n";
        });
      }
    }
    
    return result;
  } catch (error: any) {
    throw new Error(`Failed to convert speech to text: ${error.message}`);
  }
}

/**
 * Action to convert speech to text using ElevenLabs.
 */
export class SpeechToTextAction implements ZapAction<typeof SpeechToTextSchema> {
  public name = "speech_to_text";
  public description = SPEECH_TO_TEXT_PROMPT;
  public schema = SpeechToTextSchema;

  public func = (args: { [key: string]: any }): Promise<string> => {
    return speechToText({
      audio_url: args.audio_url,
      model_id: args.model_id || "scribe_v1",
      content_type: args.content_type || "audio/mp3",
      include_timestamps: args.include_timestamps !== undefined ? args.include_timestamps : false,
      include_confidence: args.include_confidence !== undefined ? args.include_confidence : false,
    });
  };
} 