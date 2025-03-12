import { z } from "zod";

export const TEXT_TO_SPEECH_ACTION_NAME = "text_to_speech";

// Define a schema for the model ID
export const ModelIdSchema = z.enum([
    "eleven_monolingual_v1",
    "eleven_multilingual_v1",
    "eleven_multilingual_v2",
    "eleven_turbo_v2",
  ]);
  
  // Define a schema for the output format
  export const OutputFormatSchema = z.enum([
    "mp3_44100_128",
    "mp3_44100_192",
    "pcm_16000",
    "pcm_22050",
    "pcm_24000",
    "pcm_44100",
  ]);

export const VoiceSettingsSchema = z.object({
    stability: z.number().min(0).max(1).optional().describe("Stability for the voice (0-1)"),
    similarity_boost: z.number().min(0).max(1).optional().describe("Similarity boost for the voice (0-1)"),
    style: z.number().min(0).max(1).optional().describe("Style exaggeration for the voice (0-1)"),
    use_speaker_boost: z.boolean().optional().describe("Whether to use speaker boost"),
  });


export const TEXT_TO_SPEECH_PROMPT = `
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


export const TextToSpeechSchema = z
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