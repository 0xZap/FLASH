/* 
TEST BROWSER USE API TOOLS

1. Missing API KEY Handle
2. Functions
3. API Calls - Handle API Errors
4. Wrong request params handle
*/

import { 
  RunTaskAction 
} from "../../../actions/webdata/browser_use/run_task";
import {
  StopTaskAction,
  PauseTaskAction,
  ResumeTaskAction
} from "../../../actions/webdata/browser_use/control_task";
import {
  GetTaskAction,
  GetTaskStatusAction,
  GetTaskMediaAction
} from "../../../actions/webdata/browser_use/get_task";
import { ListTasksAction } from "../../../actions/webdata/browser_use/list_tasks";
import {
  CheckBalanceAction,
  GetUserInfoAction,
  PingAction
} from "../../../actions/webdata/browser_use/utils_endpoints";
import { BrowserUseConfig } from "../../../config/browser_use_config";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// Store original axios methods for restoration
const originalAxiosPost = axios.post;
const originalAxiosGet = axios.get;
const originalAxiosPut = axios.put;

// Set up mock responses for testing
function mockAxiosResponses() {
  // Mock axios.post
  axios.post = async () => {
    throw {
      response: {
        data: { error: "Invalid task description" },
        status: 400,
      },
    };
  };
  
  // Mock axios.get
  axios.get = async () => {
    throw {
      response: {
        data: { error: "Task not found" },
        status: 404,
      },
    };
  };
  
  // Mock axios.put
  axios.put = async () => {
    throw {
      response: {
        data: { error: "Cannot stop task in current state" },
        status: 400,
      },
    };
  };
}

// Restore original axios methods
function restoreAxios() {
  axios.post = originalAxiosPost;
  axios.get = originalAxiosGet;
  axios.put = originalAxiosPut;
}

// Initialize these variables outside the test functions
let runTaskAction: RunTaskAction;
let stopTaskAction: StopTaskAction;
let getTaskAction: GetTaskAction;
let listTasksAction: ListTasksAction;
let checkBalanceAction: CheckBalanceAction;
let browserUseConfig: BrowserUseConfig;

async function testMissingApiKey() {
  console.log("Testing missing API key handling...");
  
  try {
    // Reset config and ensure no API key
    BrowserUseConfig.resetInstance();
    delete process.env.BROWSER_USE_API_KEY;
    browserUseConfig = BrowserUseConfig.getInstance();
    
    runTaskAction = new RunTaskAction();
    
    const result = await runTaskAction.func({
      task: "Navigate to example.com"
    });
    console.error("Failed - Should have thrown an error for missing API key");
  } catch (error) {
    console.log("Passed - Successfully caught missing API key error");
  }
}

async function testInvalidParams() {
  console.log("Testing invalid parameter handling...");
  
  // Set up with a fake API key
  BrowserUseConfig.resetInstance();
  browserUseConfig = BrowserUseConfig.getInstance({ apiKey: "fake-api-key" });
  
  // Test RunTaskAction with invalid params
  try {
    runTaskAction = new RunTaskAction();
    // @ts-ignore - intentionally passing wrong params for testing
    const result = await runTaskAction.func({
      invalid_param: "value",
      // Missing required 'task' parameter
    });
    console.error("Failed - Should have thrown an error for invalid RunTaskAction params");
  } catch (error) {
    console.log("Passed - Successfully caught invalid RunTaskAction params error");
  }
  
  // Test GetTaskAction with invalid params
  try {
    getTaskAction = new GetTaskAction();
    // @ts-ignore - intentionally passing wrong params for testing
    const result = await getTaskAction.func({
      task_id: "", // Empty task_id
    });
    console.error("Failed - Should have thrown an error for invalid GetTaskAction params");
  } catch (error) {
    console.log("Passed - Successfully caught invalid GetTaskAction params error");
  }
  
  // Test ListTasksAction with invalid params
  try {
    listTasksAction = new ListTasksAction();
    // @ts-ignore - intentionally passing wrong params for testing
    const result = await listTasksAction.func({
      limit: -1, // Invalid negative limit
      status: "invalid-status", // Invalid status
    });
    console.error("Failed - Should have thrown an error for invalid ListTasksAction params");
  } catch (error) {
    console.log("Passed - Successfully caught invalid ListTasksAction params error");
  }
}

async function testApiErrorHandling() {
  console.log("Testing API error handling...");
  
  // Set up with a fake API key
  BrowserUseConfig.resetInstance();
  browserUseConfig = BrowserUseConfig.getInstance({ apiKey: "fake-api-key" });
  
  // Set up mock responses
  mockAxiosResponses();
  
  // Test RunTaskAction with API error
  try {
    runTaskAction = new RunTaskAction();
    const result = await runTaskAction.func({
      task: "Invalid task that will cause an error"
    });
    console.error("Failed - Should have thrown an error for RunTaskAction API error");
  } catch (error) {
    console.log("Passed - Successfully caught RunTaskAction API error");
  }
  
  // Test GetTaskAction with API error
  try {
    getTaskAction = new GetTaskAction();
    const result = await getTaskAction.func({
      task_id: "non-existent-task"
    });
    console.error("Failed - Should have thrown an error for GetTaskAction API error");
  } catch (error) {
    console.log("Passed - Successfully caught GetTaskAction API error");
  }
  
  // Test StopTaskAction with API error
  try {
    stopTaskAction = new StopTaskAction();
    const result = await stopTaskAction.func({
      task_id: "task-in-wrong-state"
    });
    console.error("Failed - Should have thrown an error for StopTaskAction API error");
  } catch (error) {
    console.log("Passed - Successfully caught StopTaskAction API error");
  }
  
  // Restore original axios methods
  restoreAxios();
}

async function testLiveApiCalls() {
  if (process.env.RUN_INTEGRATION_TESTS === "true" && process.env.BROWSER_USE_API_KEY) {
    console.log("Testing live API calls...");
    
    // Use the real API key from environment variables
    BrowserUseConfig.resetInstance();
    browserUseConfig = BrowserUseConfig.getInstance({
      apiKey: process.env.BROWSER_USE_API_KEY
    });
    
    try {
      // Test ping to verify connectivity
      const pingAction = new PingAction();
      const pingResult = await pingAction.func();
      console.log("Ping test result:", pingResult);
      
      // Test running a simple task
      runTaskAction = new RunTaskAction();
      const taskResult = await runTaskAction.func({
        task: "Go to example.com and return the title",
        save_browser_data: true
      });
      console.log("Run task result:", taskResult);
      
      // Extract task ID from the result
      const taskIdMatch = taskResult.match(/Task ID: ([a-zA-Z0-9-]+)/);
      if (taskIdMatch && taskIdMatch[1]) {
        const taskId = taskIdMatch[1];
        
        // Get task status
        const taskStatusAction = new GetTaskStatusAction();
        const statusResult = await taskStatusAction.func({
          task_id: taskId
        });
        console.log("Task status result:", statusResult);
      }
      
      console.log("Live API tests completed successfully");
    } catch (error) {
      console.error("Live API test failed:", error);
    }
  } else {
    console.log("Live API tests skipped - Integration testing disabled or API key not available");
  }
}

// Run all the tests
export async function runBrowserUseTests() {
  console.log("=== BROWSER USE API TESTS ===");
  await testMissingApiKey();
  await testInvalidParams();
  await testApiErrorHandling();
  await testLiveApiCalls();
  console.log("=== TESTS COMPLETED ===");
}