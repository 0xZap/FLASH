/* 
TEST ELEVENLABS API TOOLS

1. Missing API KEY Handle
2. Functions
3. API Calls - Handle API Errors
4. Wrong request params handle
*/

import { TextToSpeechAction } from "../../../actions/audio/elevenlabs/text_to_speech";
import { SpeechToTextAction } from "../../../actions/audio/elevenlabs/speech_to_text";
import { ElevenLabsConfig } from "../../../config/elevenlabs_config";
import dotenv from "dotenv";

dotenv.config();

// Initialize these variables outside the test function so we can recreate them
let textToSpeechAction: TextToSpeechAction;
let speechToTextAction: SpeechToTextAction;
let elevenLabsConfig: ElevenLabsConfig;

async function testTextToSpeechAction() {
  console.log("Testing TextToSpeechAction...");
  
  // Test 1: Missing API KEY Handle
  try {
    ElevenLabsConfig.resetInstance();
    elevenLabsConfig = ElevenLabsConfig.getInstance({
      apiKey: undefined // Explicitly set undefined to test missing API key
    });
    textToSpeechAction = new TextToSpeechAction();
    
    const result = await textToSpeechAction.func({
      text: "Hello, this is a test.",
      voice_id: "JBFqnCBsd6RMkjVDRZzb"
    });
    console.error("Test 1 Failed - Should have thrown an error for missing API key");
  } catch (error) {
    console.log("Test 1 Passed - Successfully caught missing API key error");
  }

  // Test 2: Wrong request params handle
  try {
    const result = await textToSpeechAction.func({
      // @ts-ignore - intentionally passing wrong params for testing
      invalid_param: "value",
      text: 12345, // Wrong type for text
      model_id: "invalid-model", // Invalid model ID
      voice_id: "" // Empty string
    });
    console.error("Test 2 Failed - Should have thrown an error for invalid params");
  } catch (error) {
    console.log("Test 2 Passed - Successfully caught invalid params error");
  }

  // Test 3: API Call (only run if API key is available and integration testing is enabled)
  if (process.env.RUN_INTEGRATION_TESTS === "true" && process.env.ELEVENLABS_API_KEY) {
    try {
      ElevenLabsConfig.resetInstance();
      elevenLabsConfig = ElevenLabsConfig.getInstance({
        apiKey: process.env.ELEVENLABS_API_KEY
      });
      textToSpeechAction = new TextToSpeechAction();
      
      const result = await textToSpeechAction.func({
        text: "Hello, this is a test of the ElevenLabs API integration.",
        voice_id: "JBFqnCBsd6RMkjVDRZzb", // Using Scarlett voice
        model_id: "eleven_multilingual_v2",
        output_format: "mp3_44100_128",
        return_url: false // Return base64 instead of URL for testing
      });
      
      if (result.includes("Successfully converted text to speech")) {
        console.log("Test 3 Passed - Successfully made API call to convert text to speech");
      } else {
        console.error("Test 3 Failed - Unexpected response format");
      }
    } catch (error) {
      console.error("Test 3 Failed:", error);
    }
  } else {
    console.log("Test 3 Skipped - Integration testing disabled or API key not available");
  }
}

async function testSpeechToTextAction() {
  console.log("Testing SpeechToTextAction...");
  
  // Test 1: Missing API KEY Handle
  try {
    ElevenLabsConfig.resetInstance();
    elevenLabsConfig = ElevenLabsConfig.getInstance({
      apiKey: undefined // Explicitly set undefined to test missing API key
    });
    speechToTextAction = new SpeechToTextAction();
    
    const result = await speechToTextAction.func({
      audio_url: "https://storage.googleapis.com/eleven-public-cdn/audio/marketing/nicole.mp3"
    });
    console.error("Test 1 Failed - Should have thrown an error for missing API key");
  } catch (error) {
    console.log("Test 1 Passed - Successfully caught missing API key error");
  }

  // Test 2: Wrong request params handle
  try {
    const result = await speechToTextAction.func({
      // @ts-ignore - intentionally passing wrong params for testing
      invalid_param: "value",
      audio_url: "not-a-url", // Invalid URL
      model_id: "invalid-model", // Invalid model ID
      content_type: "invalid-content-type" // Invalid content type
    });
    console.error("Test 2 Failed - Should have thrown an error for invalid params");
  } catch (error) {
    console.log("Test 2 Passed - Successfully caught invalid params error");
  }

  // Test 3: API Call (only run if API key is available and integration testing is enabled)
  if (process.env.RUN_INTEGRATION_TESTS === "true" && process.env.ELEVENLABS_API_KEY) {
    try {
      ElevenLabsConfig.resetInstance();
      elevenLabsConfig = ElevenLabsConfig.getInstance({
        apiKey: process.env.ELEVENLABS_API_KEY
      });
      speechToTextAction = new SpeechToTextAction();
      
      const result = await speechToTextAction.func({
        audio_url: "https://storage.googleapis.com/eleven-public-cdn/audio/marketing/nicole.mp3",
        model_id: "scribe_v1",
        include_timestamps: true
      });
      
      if (result.includes("Transcription:")) {
        console.log("Test 3 Passed - Successfully made API call to convert speech to text");
      } else {
        console.error("Test 3 Failed - Unexpected response format");
      }
    } catch (error) {
      console.error("Test 3 Failed:", error);
    }
  } else {
    console.log("Test 3 Skipped - Integration testing disabled or API key not available");
  }
}

// Run tests
async function runTests() {
  console.log("=== ELEVENLABS AUDIO API TESTS ===");
  await testTextToSpeechAction();
  console.log("-------------------------");
  await testSpeechToTextAction();
  console.log("=== TESTS COMPLETED ===");
}

runTests(); 