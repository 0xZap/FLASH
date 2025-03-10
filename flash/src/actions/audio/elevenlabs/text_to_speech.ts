import { z } from "zod";
import { ZapAction } from "../../zap_action";
import { ElevenLabsConfig } from "../../../config/elevenlabs_config";

// Define a schema for the model ID
const ModelIdSchema = z.enum([
  "eleven_monolingual_v1",
  "eleven_multilingual_v1",
  "eleven_multilingual_v2",
  "eleven_turbo_v2",
]);

// Define a schema for the output format
const OutputFormatSchema = z.enum([
  "mp3_44100_128",
  "mp3_44100_192",
  "pcm_16000",
  "pcm_22050",
  "pcm_24000",
  "pcm_44100",
]);

// Define a schema for voice settings
const VoiceSettingsSchema = z.object({
  stability: z.number().min(0).max(1).optional().describe("Stability for the voice (0-1)"),
  similarity_boost: z.number().min(0).max(1).optional().describe("Similarity boost for the voice (0-1)"),
  style: z.number().min(0).max(1).optional().describe("Style exaggeration for the voice (0-1)"),
  use_speaker_boost: z.boolean().optional().describe("Whether to use speaker boost"),
});

// Input schema for text-to-speech conversion
const TextToSpeechSchema = z
  .object({
    text: z
      .string()
      .min(1)
      .max(5000)
      .describe("The text to convert to speech (1-5000 characters)"),
    
    voice_id: z
      .string()
      .describe("The ID of the voice to use for the conversion"),
    
    model_id: ModelIdSchema
      .default("eleven_multilingual_v2")
      .describe("The ID of the model to use"),
    
    output_format: OutputFormatSchema
      .default("mp3_44100_128")
      .describe("The format of the output audio"),
    
    voice_settings: VoiceSettingsSchema
      .optional()
      .describe("Optional settings to adjust the voice"),
    
    return_url: z
      .boolean()
      .default(true)
      .describe("Whether to return a temporary URL to the audio file"),
  })
  .strict();

const TEXT_TO_SPEECH_PROMPT = `
This tool converts text into natural-sounding speech using ElevenLabs' API.

Required inputs:
- text: The text to convert to speech (1-5000 characters)
- voice_id: The ID of the voice to use (e.g., "JBFqnCBsd6RMkjVDRZzb" for Scarlett)

Optional inputs:
- model_id: The model to use (default: "eleven_multilingual_v2")
  Options: "eleven_monolingual_v1", "eleven_multilingual_v1", "eleven_multilingual_v2", "eleven_turbo_v2"
- output_format: Audio format (default: "mp3_44100_128")
  Options: "mp3_44100_128", "mp3_44100_192", "pcm_16000", "pcm_22050", "pcm_24000", "pcm_44100"
- voice_settings: Object with stability, similarity_boost, style, and use_speaker_boost
- return_url: Whether to return a temporary URL to access the audio (default: true)

Example usage:
\`\`\`
{
  "text": "The quick brown fox jumps over the lazy dog.",
  "voice_id": "JBFqnCBsd6RMkjVDRZzb",
  "model_id": "eleven_multilingual_v2",
  "output_format": "mp3_44100_128"
}
\`\`\`

Common voice_id values:
- "JBFqnCBsd6RMkjVDRZzb" - Scarlett (Female)
- "XB0fDUnXU5powFXDhCwa" - Thomas (Male)
- "5Q0t7uMcjvnUHvh9bOFU" - Daniel (Male)
- "AZnzlk1XvdvUeBnXmlld" - Freya (Female)
- "MF3mGyEYCl7XYWbV9V6O" - Elli (Female)
- "g5CIjZEefAph4nQFvHAz" - Josh (Male)
`;

/**
 * Converts text to speech using ElevenLabs API.
 * @param params The parameters for the text-to-speech conversion
 * @returns A message with the status and URL or base64 audio data
 */
export async function textToSpeech(params: z.infer<typeof TextToSpeechSchema>): Promise<string> {
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

    // Prepare request options
    const options: any = {
      text: params.text,
      model_id: params.model_id,
      output_format: params.output_format,
    };

    // Add voice settings if provided
    if (params.voice_settings) {
      options.voice_settings = params.voice_settings;
    }

    // Convert text to speech
    const audio = await client.textToSpeech.convert(params.voice_id, options);
    
    let result = "";
    if (params.return_url) {
      // Create a temporary URL for the audio blob
      const audioBlob = new Blob([audio as any], { 
        type: `audio/${params.output_format.startsWith("mp3") ? "mp3" : "wav"}` 
      });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      result = `Successfully converted text to speech. Access your audio at this temporary URL (valid for this session only):\n${audioUrl}\n\nVoice ID: ${params.voice_id}\nModel: ${params.model_id}\nFormat: ${params.output_format}`;
    } else {
      // Convert to base64
      const base64Audio = Buffer.from(audio as any).toString("base64");
      result = `Successfully converted text to speech. Audio data in base64 format:\n\nVoice ID: ${params.voice_id}\nModel: ${params.model_id}\nFormat: ${params.output_format}\n\n${base64Audio}`;
    }
    
    return result;
  } catch (error: any) {
    throw new Error(`Failed to convert text to speech: ${error.message}`);
  }
}

/**
 * Action to convert text to speech using ElevenLabs.
 */
export class TextToSpeechAction implements ZapAction<typeof TextToSpeechSchema> {
  public name = "text_to_speech";
  public description = TEXT_TO_SPEECH_PROMPT;
  public schema = TextToSpeechSchema;

  public func = (args: { [key: string]: any }): Promise<string> => {
    return textToSpeech({
      text: args.text,
      voice_id: args.voice_id,
      model_id: args.model_id || "eleven_multilingual_v2",
      output_format: args.output_format || "mp3_44100_128",
      voice_settings: args.voice_settings,
      return_url: args.return_url !== undefined ? args.return_url : true,
    });
  };
} 