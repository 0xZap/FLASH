import { z } from "zod";
import { ZapAction } from "../../zap_action";
import { ElevenLabsConfig } from "../../../config/elevenlabs_config";
import { SpeechToTextSchema, SPEECH_TO_TEXT_PROMPT, SPEECH_TO_TEXT_ACTION_NAME } from "../../../actions_schemas/audio/elevenlabs/speech_to_text";

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
  public name = SPEECH_TO_TEXT_ACTION_NAME;
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