/* 
TEST PERPLEXITY API TOOLS

1. Missing API KEY Handle
2. Functions
3. API Calls - Handle API Errors
4. Wrong request params handle
*/

import { PerplexityChatAction } from "../../../actions/webdata/perplexity/chat_completions";
import { PerplexityConfig } from "../../../config/perplexity_config";
import dotenv from "dotenv";

dotenv.config();

// Initialize these variables outside the test function so we can recreate them
let perplexityChatAction: PerplexityChatAction;
let perplexityConfig: PerplexityConfig;

async function testPerplexityChatAction() {
  console.log("Testing PerplexityChatAction...");
  
  // Test 1: Missing API KEY Handle
  try {
    PerplexityConfig.resetInstance();
    perplexityConfig = PerplexityConfig.getInstance({
      apiKey: undefined // Explicitly set undefined to test missing API key
    });
    perplexityChatAction = new PerplexityChatAction();
    
    const result = await perplexityChatAction.func({
      messages: [
        { role: "user", content: "Hello, how are you?" }
      ]
    });
    console.error("Test 1 Failed - Should have thrown an error for missing API key");
  } catch (error) {
    console.log("Test 1 Passed - Successfully caught missing API key error");
  }

  // Test 2: Wrong request params handle
  try {
    const result = await perplexityChatAction.func({
      // @ts-ignore - intentionally passing wrong params for testing
      invalid_param: "value",
      model: "invalid-model", // Invalid model
      messages: "not an array", // Wrong type for messages
      temperature: 3 // Out of range
    });
    console.error("Test 2 Failed - Should have thrown an error for invalid params");
  } catch (error) {
    console.log("Test 2 Passed - Successfully caught invalid params error");
  }

  // Test 3: API Call (only run if API key is available and integration testing is enabled)
  if (process.env.RUN_INTEGRATION_TESTS === "true" && process.env.PERPLEXITY_API_KEY) {
    try {
      PerplexityConfig.resetInstance();
      perplexityConfig = PerplexityConfig.getInstance({
        apiKey: process.env.PERPLEXITY_API_KEY
      });
      perplexityChatAction = new PerplexityChatAction();
      
      const result = await perplexityChatAction.func({
        model: "sonar",
        messages: [
          { role: "system", content: "Be precise and concise." },
          { role: "user", content: "What is the capital of France?" }
        ],
        temperature: 0.2,
        max_tokens: 50
      });
      
      if (result.length > 0) {
        console.log("Test 3 Passed - Successfully made API call");
        console.log("Response snippet:", result.substring(0, 100) + "...");
      } else {
        console.error("Test 3 Failed - Received empty response");
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
  console.log("=== PERPLEXITY API TESTS ===");
  await testPerplexityChatAction();
  console.log("=== TESTS COMPLETED ===");
}

runTests(); 