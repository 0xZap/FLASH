import { z } from "zod";

export const SPEECH_TO_TEXT_ACTION_NAME = "speech_to_text";

export const SpeechToTextSchema = z
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


export const SPEECH_TO_TEXT_PROMPT = `
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