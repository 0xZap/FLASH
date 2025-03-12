import { z } from "zod";
import { ZapAction } from "../../zap_action";
import { ElevenLabsConfig } from "../../../config/elevenlabs_config";
import { TextToSpeechSchema, TEXT_TO_SPEECH_PROMPT, TEXT_TO_SPEECH_ACTION_NAME } from "../../../actions_schemas/audio/elevenlabs/text_to_speech";

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
  public name = TEXT_TO_SPEECH_ACTION_NAME;
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