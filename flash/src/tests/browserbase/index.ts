/* 
TEST BROWSERBASE TOOLS 

1. Missing API KEY Handle
2. Functions
3. API Calls - Handle API Errors
4. Wrong request params handle
*/

import { ConnectBrowserbaseAction } from "../../actions/browserbase/connect_browser";
import { NavigateBrowserAction } from "../../actions/browserbase/navigate_browser";
import { StagehandBrowseAction } from "../../actions/browserbase/stagehand_browse";
import { PuppeteerConnectAction } from "../../actions/browserbase/puppeteer_connect";
import { BrowserbaseConfig } from "../../actions/browserbase/connect_browser";
import dotenv from "dotenv";

dotenv.config();

// Initialize these variables outside the test function so we can recreate them
let connectBrowserbaseAction: ConnectBrowserbaseAction;
let navigateBrowserAction: NavigateBrowserAction;
let stagehandBrowseAction: StagehandBrowseAction;
let puppeteerConnectAction: PuppeteerConnectAction;
let browserbaseConfig: BrowserbaseConfig;

async function testConnectBrowserbaseAction() {
  console.log("Testing ConnectBrowserbaseAction...");
  
  // Test 1: Missing API KEY Handle
  try {
    BrowserbaseConfig.resetInstance();
    browserbaseConfig = BrowserbaseConfig.getInstance({
      apiKey: undefined, // Explicitly set undefined to test missing API key
      projectId: process.env.BROWSERBASE_PROJECT_ID
    });
    connectBrowserbaseAction = new ConnectBrowserbaseAction();
    
    const result = await connectBrowserbaseAction.func({
      session_name: "Test Session",
      timeout: 30000
    });
    console.error("Test 1 Failed - Should have thrown an error for missing API key");
  } catch (error) {
    console.log("Test 1 Passed - Successfully caught missing API key error");
  }

  // Test 2: Missing Project ID Handle
  try {
    BrowserbaseConfig.resetInstance();
    browserbaseConfig = BrowserbaseConfig.getInstance({
      apiKey: process.env.BROWSERBASE_API_KEY,
      projectId: undefined // Explicitly set undefined to test missing project ID
    });
    connectBrowserbaseAction = new ConnectBrowserbaseAction();
    
    const result = await connectBrowserbaseAction.func({
      session_name: "Test Session",
      timeout: 30000
    });
    console.error("Test 2 Failed - Should have thrown an error for missing project ID");
  } catch (error) {
    console.log("Test 2 Passed - Successfully caught missing project ID error");
  }

  // Test 3: Function with Proper Configuration
  // Skip actual API call in tests unless in integration testing mode
  if (process.env.RUN_INTEGRATION_TESTS === "true" && process.env.BROWSERBASE_API_KEY) {
    try {
      BrowserbaseConfig.resetInstance();
      browserbaseConfig = BrowserbaseConfig.getInstance({
        apiKey: process.env.BROWSERBASE_API_KEY,
        projectId: process.env.BROWSERBASE_PROJECT_ID
      });
      connectBrowserbaseAction = new ConnectBrowserbaseAction();
      
      const result = await connectBrowserbaseAction.func({
        session_name: "Test Session",
        timeout: 30000
      });
      
      if (result.includes("Successfully connected to Browserbase")) {
        console.log("Test 3 Passed - Successfully connected to Browserbase");
        // Extract session ID for navigate test
        const sessionIdMatch = result.match(/Session ID: (.*)/);
        if (sessionIdMatch && sessionIdMatch[1]) {
          process.env.TEST_SESSION_ID = sessionIdMatch[1];
        }
      } else {
        console.error("Test 3 Failed - Did not connect successfully");
      }
    } catch (error) {
      console.error("Test 3 Failed:", error);
    }
  } else {
    console.log("Test 3 Skipped - Integration testing disabled or API key not available");
  }

  // Test 4: Wrong request params handle
  try {
    const result = await connectBrowserbaseAction.func({
      // @ts-ignore - intentionally passing wrong params for testing
      invalid_param: "value",
      project_id: 12345, // Wrong type for project_id
      timeout: "not a number" // Wrong type for timeout
    });
    console.error("Test 4 Failed - Should have thrown an error for invalid params");
  } catch (error) {
    console.log("Test 4 Passed - Successfully caught invalid params error");
  }
}

async function testNavigateBrowserAction() {
  console.log("Testing NavigateBrowserAction...");
  
  // Test 1: Missing API KEY Handle
  try {
    BrowserbaseConfig.resetInstance();
    browserbaseConfig = BrowserbaseConfig.getInstance({
      apiKey: undefined, // Explicitly set undefined to test missing API key
    });
    navigateBrowserAction = new NavigateBrowserAction();
    
    const result = await navigateBrowserAction.func({
      session_id: "fake_session_id",
      url: "https://www.example.com"
    });
    console.error("Test 1 Failed - Should have thrown an error for missing API key");
  } catch (error) {
    console.log("Test 1 Passed - Successfully caught missing API key error");
  }

  // Test 2: Function with Proper Configuration but Invalid Session ID
  try {
    BrowserbaseConfig.resetInstance();
    browserbaseConfig = BrowserbaseConfig.getInstance({
      apiKey: process.env.BROWSERBASE_API_KEY
    });
    navigateBrowserAction = new NavigateBrowserAction();
    
    const result = await navigateBrowserAction.func({
      session_id: "fake_session_id",
      url: "https://www.example.com"
    });
    console.error("Test 2 Failed - Should have thrown an error for invalid session ID");
  } catch (error) {
    console.log("Test 2 Passed - Successfully caught invalid session ID error");
  }

  // Test 3: Function with Proper Configuration and Valid Session ID
  // Skip actual API call in tests unless in integration testing mode and we have a session ID
  if (process.env.RUN_INTEGRATION_TESTS === "true" && process.env.BROWSERBASE_API_KEY && process.env.TEST_SESSION_ID) {
    try {
      navigateBrowserAction = new NavigateBrowserAction();
      
      const result = await navigateBrowserAction.func({
        session_id: process.env.TEST_SESSION_ID,
        url: "https://www.example.com",
        wait_for_load: true,
        wait_time: 5000,
        take_screenshot: false
      });
      
      if (result.includes("Successfully navigated browser")) {
        console.log("Test 3 Passed - Successfully navigated to URL");
      } else {
        console.error("Test 3 Failed - Did not navigate successfully");
      }
    } catch (error) {
      console.error("Test 3 Failed:", error);
    }
  } else {
    console.log("Test 3 Skipped - Integration testing disabled or session ID not available");
  }

  // Test 4: Wrong request params handle
  try {
    const result = await navigateBrowserAction.func({
      // @ts-ignore - intentionally passing wrong params for testing
      session_id: 12345, // Wrong type for session_id
      url: "not-a-valid-url", // Invalid URL format
      wait_for_load: "not a boolean", // Wrong type for wait_for_load
      wait_time: "not a number" // Wrong type for wait_time
    });
    console.error("Test 4 Failed - Should have thrown an error for invalid params");
  } catch (error) {
    console.log("Test 4 Passed - Successfully caught invalid params error");
  }
}

async function testStagehandBrowseAction() {
  console.log("Testing StagehandBrowseAction...");
  
  // Test 1: Missing API KEY Handle
  try {
    BrowserbaseConfig.resetInstance();
    browserbaseConfig = BrowserbaseConfig.getInstance({
      apiKey: undefined, // Explicitly set undefined to test missing API key
    });
    stagehandBrowseAction = new StagehandBrowseAction();
    
    const result = await stagehandBrowseAction.func({
      url: "https://www.example.com",
      instruction: "Find the about page"
    });
    console.error("Test 1 Failed - Should have thrown an error for missing API key");
  } catch (error) {
    console.log("Test 1 Passed - Successfully caught missing API key error");
  }

  // Test 2: Missing Project ID Handle
  try {
    BrowserbaseConfig.resetInstance();
    browserbaseConfig = BrowserbaseConfig.getInstance({
      apiKey: process.env.BROWSERBASE_API_KEY,
      projectId: undefined // Explicitly set undefined to test missing project ID
    });
    stagehandBrowseAction = new StagehandBrowseAction();
    
    const result = await stagehandBrowseAction.func({
      url: "https://www.example.com",
      instruction: "Find the about page"
    });
    console.error("Test 2 Failed - Should have thrown an error for missing project ID");
  } catch (error) {
    console.log("Test 2 Passed - Successfully caught missing project ID error");
  }

  // Test 3: Missing OpenAI API Key
  try {
    BrowserbaseConfig.resetInstance();
    browserbaseConfig = BrowserbaseConfig.getInstance({
      apiKey: process.env.BROWSERBASE_API_KEY,
      projectId: process.env.BROWSERBASE_PROJECT_ID
    });
    stagehandBrowseAction = new StagehandBrowseAction();
    
    // Save original env variable
    const originalOpenAiKey = process.env.OPENAI_API_KEY;
    // Delete env variable for testing
    delete process.env.OPENAI_API_KEY;
    
    const result = await stagehandBrowseAction.func({
      url: "https://www.example.com",
      instruction: "Find the about page",
      model_name: "gpt-4o"
    });
    
    // Restore original env variable
    process.env.OPENAI_API_KEY = originalOpenAiKey;
    
    console.error("Test 3 Failed - Should have thrown an error for missing OpenAI API key");
  } catch (error) {
    // Restore original env variable if it was set
    if (process.env.OPENAI_API_KEY_ORIGINAL) {
      process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY_ORIGINAL;
      delete process.env.OPENAI_API_KEY_ORIGINAL;
    }
    
    console.log("Test 3 Passed - Successfully caught missing OpenAI API key error");
  }

  // Test 4: Wrong request params handle
  try {
    const result = await stagehandBrowseAction.func({
      // @ts-ignore - intentionally passing wrong params for testing
      url: "not-a-valid-url", // Invalid URL format
      model_name: "invalid-model", // Invalid model name
      instruction: 123 // Wrong type for instruction
    });
    console.error("Test 4 Failed - Should have thrown an error for invalid params");
  } catch (error) {
    console.log("Test 4 Passed - Successfully caught invalid params error");
  }
}

async function testPuppeteerConnectAction() {
  console.log("Testing PuppeteerConnectAction...");
  
  // Test 1: Missing API KEY Handle
  try {
    BrowserbaseConfig.resetInstance();
    browserbaseConfig = BrowserbaseConfig.getInstance({
      apiKey: undefined, // Explicitly set undefined to test missing API key
    });
    puppeteerConnectAction = new PuppeteerConnectAction();
    
    const result = await puppeteerConnectAction.func({
      session_name: "Test Session"
    });
    console.error("Test 1 Failed - Should have thrown an error for missing API key");
  } catch (error) {
    console.log("Test 1 Passed - Successfully caught missing API key error");
  }

  // Test 2: Missing Project ID Handle
  try {
    BrowserbaseConfig.resetInstance();
    browserbaseConfig = BrowserbaseConfig.getInstance({
      apiKey: process.env.BROWSERBASE_API_KEY,
      projectId: undefined // Explicitly set undefined to test missing project ID
    });
    puppeteerConnectAction = new PuppeteerConnectAction();
    
    const result = await puppeteerConnectAction.func({
      session_name: "Test Session"
    });
    console.error("Test 2 Failed - Should have thrown an error for missing project ID");
  } catch (error) {
    console.log("Test 2 Passed - Successfully caught missing project ID error");
  }

  // Test 3: Function with Proper Configuration
  // Skip actual API call in tests unless in integration testing mode
  if (process.env.RUN_INTEGRATION_TESTS === "true" && process.env.BROWSERBASE_API_KEY) {
    try {
      BrowserbaseConfig.resetInstance();
      browserbaseConfig = BrowserbaseConfig.getInstance({
        apiKey: process.env.BROWSERBASE_API_KEY,
        projectId: process.env.BROWSERBASE_PROJECT_ID
      });
      puppeteerConnectAction = new PuppeteerConnectAction();
      
      const result = await puppeteerConnectAction.func({
        session_name: "Test Puppeteer Session",
        return_connect_url: true
      });
      
      if (result.includes("Successfully created Browserbase session for Puppeteer")) {
        console.log("Test 3 Passed - Successfully created Puppeteer session");
        if (result.includes("Connect URL:")) {
          console.log("Test 3.1 Passed - Successfully returned connect URL");
        } else {
          console.error("Test 3.1 Failed - Did not return connect URL");
        }
      } else {
        console.error("Test 3 Failed - Did not create session successfully");
      }
    } catch (error) {
      console.error("Test 3 Failed:", error);
    }
  } else {
    console.log("Test 3 Skipped - Integration testing disabled or API key not available");
  }

  // Test 4: Wrong request params handle
  try {
    const result = await puppeteerConnectAction.func({
      // @ts-ignore - intentionally passing wrong params for testing
      invalid_param: "value",
      project_id: 12345, // Wrong type for project_id
      return_connect_url: "not a boolean" // Wrong type for return_connect_url
    });
    console.error("Test 4 Failed - Should have thrown an error for invalid params");
  } catch (error) {
    console.log("Test 4 Passed - Successfully caught invalid params error");
  }
}

// Run tests
async function runTests() {
  console.log("=== BROWSERBASE TESTS ===");
  await testConnectBrowserbaseAction();
  console.log("-------------------------");
  await testNavigateBrowserAction();
  console.log("-------------------------");
  await testStagehandBrowseAction();
  console.log("-------------------------");
  await testPuppeteerConnectAction();
  console.log("=== TESTS COMPLETED ===");
}

runTests(); 