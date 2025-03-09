/* 
TEST PYTHON CODE EXECUTION TOOLS

1. Basic Functionality
2. Error Handling
3. Timeout Handling
4. Package Installation
5. Plotting Capabilities
*/

import { ExecutePythonAction } from "../../../actions/code/python/execute_code";
import dotenv from "dotenv";

dotenv.config();

// Initialize these variables outside the test function
let executePythonAction: ExecutePythonAction;

async function testExecutePythonAction() {
  console.log("Testing ExecutePythonAction...");
  
  executePythonAction = new ExecutePythonAction();

  // Test 1: Basic functionality
  try {
    const result = await executePythonAction.func({
      code: "x = 5\ny = 10\nresult = x + y\nresult",
      timeout: 5
    });
    
    if (result.includes("15")) {
      console.log("Test 1 Passed - Successfully executed basic Python code");
    } else {
      console.error("Test 1 Failed - Did not get the expected result");
      console.log("Result:", result);
    }
  } catch (error) {
    console.error("Test 1 Failed:", error);
  }

  // Test 2: Error handling
  try {
    const result = await executePythonAction.func({
      code: "x = 5 / 0",
      timeout: 5
    });
    
    if (result.includes("Error") && result.includes("division by zero")) {
      console.log("Test 2 Passed - Successfully caught Python error");
    } else {
      console.error("Test 2 Failed - Did not catch the expected error");
      console.log("Result:", result);
    }
  } catch (error) {
    console.error("Test 2 Failed:", error);
  }

  // Test 3: Timeout handling (skipped in CI)
  if (process.env.RUN_LONG_TESTS === "true") {
    try {
      const result = await executePythonAction.func({
        code: "import time\nfor i in range(10):\n    time.sleep(1)\n    print(i)",
        timeout: 2
      });
      
      if (result.includes("timed out")) {
        console.log("Test 3 Passed - Successfully handled timeout");
      } else {
        console.error("Test 3 Failed - Did not timeout as expected");
        console.log("Result:", result);
      }
    } catch (error) {
      console.error("Test 3 Failed:", error);
    }
  } else {
    console.log("Test 3 Skipped - Timeout test disabled (set RUN_LONG_TESTS=true to enable)");
  }

  // Test 4: Package installation (skipped in CI)
  if (process.env.RUN_LONG_TESTS === "true") {
    try {
      const result = await executePythonAction.func({
        code: "import numpy as np\narr = np.array([1, 2, 3, 4, 5])\nprint(f'Mean: {np.mean(arr)}')",
        timeout: 30,
        packages: ["numpy"]
      });
      
      if (result.includes("Mean: 3.0")) {
        console.log("Test 4 Passed - Successfully installed and used numpy");
      } else {
        console.error("Test 4 Failed - Could not install or use numpy");
        console.log("Result:", result);
      }
    } catch (error) {
      console.error("Test 4 Failed:", error);
    }
  } else {
    console.log("Test 4 Skipped - Package installation test disabled (set RUN_LONG_TESTS=true to enable)");
  }

  // Test 5: Wrong request params handle
  try {
    const result = await executePythonAction.func({
      // @ts-ignore - intentionally passing wrong params for testing
      invalid_param: "value",
      code: 12345, // Wrong type for code
      timeout: "not a number" // Wrong type for timeout
    });
    console.error("Test 5 Failed - Should have thrown an error for invalid params");
  } catch (error) {
    console.log("Test 5 Passed - Successfully caught invalid params error");
  }
}

// Run tests
async function runTests() {
  console.log("=== PYTHON CODE EXECUTION TESTS ===");
  await testExecutePythonAction();
  console.log("=== TESTS COMPLETED ===");
}

runTests(); 