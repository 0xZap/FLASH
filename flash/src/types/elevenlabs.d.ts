declare module 'elevenlabs' {
  export interface ElevenLabsOptions {
    apiKey?: string;
  }

  export interface TextToSpeechOptions {
    text: string;
    model_id?: string;
    output_format?: string;
    voice_settings?: {
      stability?: number;
      similarity_boost?: number;
      style?: number;
      use_speaker_boost?: boolean;
    };
  }

  export interface SpeechToTextOptions {
    file: Blob;
    model_id?: string;
    include_timestamps?: boolean;
    include_confidence?: boolean;
  }

  export class ElevenLabsClient {
    constructor(options?: ElevenLabsOptions);
    
    textToSpeech: {
      convert(voiceId: string, options: TextToSpeechOptions): Promise<ArrayBuffer>;
    };
    
    speechToText: {
      convert(options: SpeechToTextOptions): Promise<string | {
        text: string;
        words?: Array<{
          text: string;
          start: number;
          end: number;
          confidence?: number;
        }>;
      }>;
    };
  }

  export function play(audio: ArrayBuffer): Promise<void>;
} 