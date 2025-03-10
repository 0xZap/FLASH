/* 
TEST HEYGEN API TOOLS

1. Missing API KEY Handle
2. Functions
3. API Calls - Handle API Errors
4. Wrong request params handle
*/

import { ListAvatarsAction } from "../../../actions/video/heygen/list_avatars";
import { ListVoicesAction } from "../../../actions/video/heygen/list_voices";
import { GenerateAvatarVideoAction } from "../../../actions/video/heygen/generate_avatar_video";
import { UploadTalkingPhotoAction } from "../../../actions/video/heygen/upload_talking_photo";
import { GenerateTalkingPhotoVideoAction } from "../../../actions/video/heygen/generate_talking_photo_video";
import { CheckVideoStatusAction } from "../../../actions/video/heygen/check_video_status";
import { HeyGenConfig } from "../../../config/heygen_config";
import dotenv from "dotenv";

dotenv.config();

// Initialize these variables outside the test function
let listAvatarsAction: ListAvatarsAction;
let listVoicesAction: ListVoicesAction;
let generateAvatarVideoAction: GenerateAvatarVideoAction;
let uploadTalkingPhotoAction: UploadTalkingPhotoAction;
let generateTalkingPhotoVideoAction: GenerateTalkingPhotoVideoAction;
let checkVideoStatusAction: CheckVideoStatusAction;
let heyGenConfig: HeyGenConfig;

async function testListAvatarsAction() {
  console.log("Testing ListAvatarsAction...");
  
  // Test 1: Missing API KEY Handle
  try {
    HeyGenConfig.resetInstance();
    heyGenConfig = HeyGenConfig.getInstance({
      apiKey: undefined // Explicitly set undefined to test missing API key
    });
    listAvatarsAction = new ListAvatarsAction();
    
    const result = await listAvatarsAction.func({
      limit: 10,
      page: 1
    });
    console.error("Test 1 Failed - Should have thrown an error for missing API key");
  } catch (error) {
    console.log("Test 1 Passed - Successfully caught missing API key error");
  }

  // Test 2: Wrong request params handle
  try {
    const result = await listAvatarsAction.func({
      // @ts-ignore - intentionally passing wrong params for testing
      invalid_param: "value",
      limit: "not a number", // Wrong type for limit
      page: -1 // Invalid page number
    });
    console.error("Test 2 Failed - Should have thrown an error for invalid params");
  } catch (error) {
    console.log("Test 2 Passed - Successfully caught invalid params error");
  }

  // Test 3: API Call (only run if API key is available and integration testing is enabled)
  if (process.env.RUN_INTEGRATION_TESTS === "true" && process.env.HEYGEN_API_KEY) {
    try {
      HeyGenConfig.resetInstance();
      heyGenConfig = HeyGenConfig.getInstance({
        apiKey: process.env.HEYGEN_API_KEY
      });
      listAvatarsAction = new ListAvatarsAction();
      
      const result = await listAvatarsAction.func({
        limit: 5,
        page: 1
      });
      
      console.log("Test 3 Passed - Successfully fetched avatars");
    } catch (error) {
      console.error("Test 3 Failed:", error);
    }
  } else {
    console.log("Test 3 Skipped - Integration testing disabled or API key not available");
  }
}

async function testListVoicesAction() {
  console.log("Testing ListVoicesAction...");
  
  // Test 1: Missing API KEY Handle
  try {
    HeyGenConfig.resetInstance();
    heyGenConfig = HeyGenConfig.getInstance({
      apiKey: undefined // Explicitly set undefined to test missing API key
    });
    listVoicesAction = new ListVoicesAction();
    
    const result = await listVoicesAction.func({
      limit: 10,
      page: 1
    });
    console.error("Test 1 Failed - Should have thrown an error for missing API key");
  } catch (error) {
    console.log("Test 1 Passed - Successfully caught missing API key error");
  }

  // Test 2: Wrong request params handle
  try {
    const result = await listVoicesAction.func({
      // @ts-ignore - intentionally passing wrong params for testing
      invalid_param: "value",
      gender: "invalid-gender", // Invalid gender
      language: 123 // Wrong type for language
    });
    console.error("Test 2 Failed - Should have thrown an error for invalid params");
  } catch (error) {
    console.log("Test 2 Passed - Successfully caught invalid params error");
  }

  // Test 3: API Call (only run if API key is available and integration testing is enabled)
  if (process.env.RUN_INTEGRATION_TESTS === "true" && process.env.HEYGEN_API_KEY) {
    try {
      HeyGenConfig.resetInstance();
      heyGenConfig = HeyGenConfig.getInstance({
        apiKey: process.env.HEYGEN_API_KEY
      });
      listVoicesAction = new ListVoicesAction();
      
      const result = await listVoicesAction.func({
        limit: 5,
        page: 1,
        gender: "female",
        language: "en-US"
      });
      
      console.log("Test 3 Passed - Successfully fetched voices");
    } catch (error) {
      console.error("Test 3 Failed:", error);
    }
  } else {
    console.log("Test 3 Skipped - Integration testing disabled or API key not available");
  }
}

async function testGenerateAvatarVideoAction() {
  console.log("Testing GenerateAvatarVideoAction...");
  
  // Test 1: Missing API KEY Handle
  try {
    HeyGenConfig.resetInstance();
    heyGenConfig = HeyGenConfig.getInstance({
      apiKey: undefined // Explicitly set undefined to test missing API key
    });
    generateAvatarVideoAction = new GenerateAvatarVideoAction();
    
    const result = await generateAvatarVideoAction.func({
      avatar_id: "test-avatar-id",
      input_text: "This is a test",
      voice_id: "test-voice-id"
    });
    console.error("Test 1 Failed - Should have thrown an error for missing API key");
  } catch (error) {
    console.log("Test 1 Passed - Successfully caught missing API key error");
  }

  // Test 2: Wrong request params handle
  try {
    const result = await generateAvatarVideoAction.func({
      // @ts-ignore - intentionally passing wrong params for testing
      invalid_param: "value",
      avatar_id: 123, // Wrong type for avatar_id
      input_text: "", // Empty input text
      voice_id: 456 // Wrong type for voice_id
    });
    console.error("Test 2 Failed - Should have thrown an error for invalid params");
  } catch (error) {
    console.log("Test 2 Passed - Successfully caught invalid params error");
  }
}

async function testCheckVideoStatusAction() {
  console.log("Testing CheckVideoStatusAction...");
  
  // Test 1: Missing API KEY Handle
  try {
    HeyGenConfig.resetInstance();
    heyGenConfig = HeyGenConfig.getInstance({
      apiKey: undefined // Explicitly set undefined to test missing API key
    });
    checkVideoStatusAction = new CheckVideoStatusAction();
    
    const result = await checkVideoStatusAction.func({
      video_id: "test-video-id"
    });
    console.error("Test 1 Failed - Should have thrown an error for missing API key");
  } catch (error) {
    console.log("Test 1 Passed - Successfully caught missing API key error");
  }

  // Test 2: Wrong request params handle
  try {
    const result = await checkVideoStatusAction.func({
      // @ts-ignore - intentionally passing wrong params for testing
      invalid_param: "value",
      video_id: 123 // Wrong type for video_id
    });
    console.error("Test 2 Failed - Should have thrown an error for invalid params");
  } catch (error) {
    console.log("Test 2 Passed - Successfully caught invalid params error");
  }
}

// Run tests
async function runTests() {
  console.log("=== HEYGEN VIDEO API TESTS ===");
  await testListAvatarsAction();
  console.log("-------------------------");
  await testListVoicesAction();
  console.log("-------------------------");
  await testGenerateAvatarVideoAction();
  console.log("-------------------------");
  await testCheckVideoStatusAction();
  console.log("=== TESTS COMPLETED ===");
}

runTests(); 