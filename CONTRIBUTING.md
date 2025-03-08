# FLASH Contributing Guidelines

Thank you for your interest in contributing to FLASH (Framework-agnostic Library for Agentic System Hubs)! We welcome all contributions, whether they're big or small. Here are some ways you can contribute:

- Adding new tools and integrations
- Creating new framework extensions (Vercel AI SDK, CrewAI, etc.)
- Improving documentation and adding examples
- Writing tests and fixing bugs
- Optimizing performance

## Development Setup

### Prerequisites
- Node.js 23 or higher
- pnpm for package management
- Git

### Getting Started

1. Clone the repository:
```bash
git clone git@github.com:0xZap/flash.git
cd flash
```

2. Install dependencies:
```bash
pnpm install
```

### Building the Project

To build all packages in the monorepo:
```bash
pnpm build
```

### Development Tools

#### Linting & Formatting
```bash
# Check for lint errors
pnpm lint

# Fix lint errors
pnpm lint:fix

# Format code
pnpm format

# Check formatting
pnpm format:check
```

#### Testing
```bash
# Run all tests
pnpm test

# Type checking
pnpm test:types
```

#### Documentation
```bash
pnpm docs
```

## Project Structure

The FLASH project is organized as a monorepo using pnpm workspaces:

```
flash/
├── flash/              # Core package
├── flash-langchain/    # LangChain integration
├── docs/              # Documentation
└── examples/          # Usage examples
```

## Adding New Tools

FLASH tools are the core building blocks that provide functionality for agent builders. Each tool follows a specific pattern to ensure consistency and reliability.

### Tool Organization

Tools are organized by category in the core package under `packages/flash/src/tools/`:

```
tools/
├── ai/                # AI/ML related tools
├── productivity/      # Productivity tools
├── socials/           # Social media and communication tools
├── web3/              # Blockchain and Web3 tools
└── ...                # Other categories
```

### Creating a New Tool

Follow these steps to add a new tool to FLASH:

1. **Choose the right category**: Place your tool in the appropriate category directory, or create a new category if needed.

2. **Create a new file**: Name it descriptively (e.g., `get_available_gpus.ts` for a GPU availability checker).

3. **Implement the tool**: Each tool consists of:
   - Input schema (using Zod)
   - Tool function
   - Tool action class

4. **Add tests**: Create tests in the corresponding test directory.

5. **Update exports**: Add your tool to the appropriate index.ts file.

6. **Document your tool**: Add JSDoc comments and update documentation as needed.

### Tool Implementation Guide

Every FLASH tool follows this general structure:

1. **Input Schema**: Define what inputs your tool accepts using Zod.
2. **Tool Prompt**: Create a clear description of what your tool does.
3. **Tool Function**: Implement the core functionality that performs the task.
4. **Tool Action Class**: Wrap everything in a ZapAction class for registration.

#### Example Tool Implementation (Step by Step)

Let's walk through creating a simple calculator tool that can perform basic arithmetic operations:

##### Step 1: Define the Input Schema
First, create a Zod schema that defines what inputs your tool will accept. This serves as both documentation and runtime validation.

For our calculator tool, we need:
- An operation type (add, subtract, multiply, or divide)
- Two numbers to operate on

```typescript
import { z } from "zod";
import { ZapAction } from "../zap_action";

// Define input schema
const CalculateSchema = z.object({
  operation: z.enum(["add", "subtract", "multiply", "divide"]).describe("The operation to perform"),
  num1: z.number().describe("First number"),
  num2: z.number().describe("Second number"),
}).strict();
```

##### Step 2: Create the Tool Prompt
Next, write a clear description that explains what your tool does, what inputs it takes, and how to use it. This is what the AI will see when deciding whether to use your tool.

Include:
- A brief description of the tool's purpose
- Required and optional inputs
- Example usage
- Any important notes or limitations

```typescript
// Create tool prompt
const CALCULATE_PROMPT = `
This tool performs basic arithmetic operations on two numbers.

Inputs:
- operation: The operation to perform, one of: "add", "subtract", "multiply", "divide"
- num1: First number
- num2: Second number

Examples:
- To add 5 and 3: { "operation": "add", "num1": 5, "num2": 3 }
- To divide 10 by 2: { "operation": "divide", "num1": 10, "num2": 2 }

Note: Division by zero will return an error.
`;
```

##### Step 3: Implement the Tool Function
Now, write the actual function that performs the task. This function should:
- Accept inputs that match your schema
- Include proper error handling
- Return results in a user-friendly format

```typescript
/**
 * Performs basic arithmetic calculations.
 * @param inputs The calculation inputs
 * @returns The calculation result
 */
export async function calculate(inputs: z.infer<typeof CalculateSchema>) {
  const { operation, num1, num2 } = inputs;
  
  // Handle different operations
  switch (operation) {
    case "add":
      return `${num1} + ${num2} = ${num1 + num2}`;
    case "subtract":
      return `${num1} - ${num2} = ${num1 - num2}`;
    case "multiply":
      return `${num1} × ${num2} = ${num1 * num2}`;
    case "divide":
      // Check for division by zero
      if (num2 === 0) {
        throw new Error("Division by zero is not allowed");
      }
      return `${num1} ÷ ${num2} = ${num1 / num2}`;
    default:
      // This should never happen thanks to zod validation
      throw new Error(`Unsupported operation: ${operation}`);
  }
}
```

##### Step 4: Create the Tool Action Class
Finally, create a class that implements the ZapAction interface. This registers your tool with the FLASH system and connects all the pieces together.

```typescript
/**
 * Action to perform arithmetic calculations.
 * This class registers the tool with the FLASH system.
 */
export class CalculateAction implements ZapAction<typeof CalculateSchema> {
  public name = "calculate";                // Tool name for invocation
  public description = CALCULATE_PROMPT;    // Tool description
  public schema = CalculateSchema;          // Input validation schema
  public func = calculate;                  // The function to execute
}
```

#### Complete Code with Detailed Comments

Here's the complete implementation of our calculator tool with comprehensive comments:

```typescript
import { z } from "zod";
import { ZapAction } from "../zap_action";

/**
 * Step 1: Define Input Schema
 * 
 * Use Zod to create a schema that:
 * - Documents the expected inputs
 * - Provides runtime validation
 * - Enables TypeScript type inference
 */
const CalculateSchema = z.object({
  // Define an enum of allowed operations
  operation: z.enum(["add", "subtract", "multiply", "divide"])
    .describe("The operation to perform"),
  
  // Define number inputs with descriptions
  num1: z.number().describe("First number"),
  num2: z.number().describe("Second number"),
  
  // .strict() ensures no additional properties are allowed
}).strict();

/**
 * Step 2: Create Tool Prompt
 * 
 * This multiline string serves as documentation for the AI.
 * It should clearly explain:
 * - What the tool does
 * - What inputs it expects
 * - How to use it correctly
 * - Any limitations or edge cases
 */
const CALCULATE_PROMPT = `
This tool performs basic arithmetic operations on two numbers.

Inputs:
- operation: The operation to perform, one of: "add", "subtract", "multiply", "divide"
- num1: First number
- num2: Second number

Examples:
- To add 5 and 3: { "operation": "add", "num1": 5, "num2": 3 }
- To divide 10 by 2: { "operation": "divide", "num1": 10, "num2": 2 }

Note: Division by zero will return an error.
`;

/**
 * Step 3: Implement Tool Function
 * 
 * This function contains the actual logic of your tool.
 * It should:
 * - Accept inputs that match your schema
 * - Process those inputs to perform the desired task
 * - Handle errors gracefully
 * - Return results in a user-friendly format
 * 
 * @param inputs The calculation inputs (validated by Zod)
 * @returns The calculation result as a formatted string
 */
export async function calculate(inputs: z.infer<typeof CalculateSchema>) {
  // Destructure inputs for easier access
  const { operation, num1, num2 } = inputs;
  
  // Use a switch statement to handle different operations
  switch (operation) {
    case "add":
      return `${num1} + ${num2} = ${num1 + num2}`;
    
    case "subtract":
      return `${num1} - ${num2} = ${num1 - num2}`;
    
    case "multiply":
      // Use proper multiplication symbol for better readability
      return `${num1} × ${num2} = ${num1 * num2}`;
    
    case "divide":
      // Always check for division by zero
      if (num2 === 0) {
        throw new Error("Division by zero is not allowed");
      }
      // Use proper division symbol for better readability
      return `${num1} ÷ ${num2} = ${num1 / num2}`;
    
    default:
      // This code should never execute due to Zod validation,
      // but TypeScript doesn't know that, so we include it for type safety
      throw new Error(`Unsupported operation: ${operation}`);
  }
}

/**
 * Step 4: Create Tool Action Class
 * 
 * This class implements the ZapAction interface to register your tool
 * with the FLASH system. It connects all the pieces together:
 * - Schema for validation
 * - Prompt for AI documentation
 * - Function for execution
 */
export class CalculateAction implements ZapAction<typeof CalculateSchema> {
  public name = "calculate";                // Name used to invoke the tool
  public description = CALCULATE_PROMPT;    // Description shown to the AI
  public schema = CalculateSchema;          // Schema for validating inputs
  public func = calculate;                  // Function to execute
  
  // Note: Some tools may need additional properties like:
  // public config = SomeConfig.getInstance(); // Configuration for the tool
}
```

### Best Practices for Tool Development

1. **User-friendly error handling**: Provide clear error messages that guide users to fix issues.
2. **Input validation**: Use Zod schemas to validate all inputs and provide helpful error messages.
3. **Documentation**: Add comprehensive JSDoc comments explaining what the tool does and how to use it.
4. **Testing**: Create tests for your tool that cover various edge cases.
5. **Security**: Be mindful of security implications and handle sensitive data appropriately.

### Common Tool Patterns

#### Tools with Required Inputs

For tools that require user inputs:

```typescript
// Example: Search Twitter tool
const SearchTwitterSchema = z.object({
  query: z.string().min(1).describe("Search query"),
  limit: z.number().optional().default(10).describe("Maximum number of results"),
}).strict();
```

#### Tools with API Keys

For tools requiring external API access:

```typescript
// Get API key from configuration
const config = TwitterConfig.getInstance();
const apiKey = config.getApiKey();

if (!apiKey) {
  throw new Error("Twitter API key not found. Please set it in your configuration.");
}
```

#### Handling Asynchronous Operations

Most tools will use async/await for operations like API calls:

```typescript
export async function myAsyncTool(inputs: z.infer<typeof MyToolSchema>) {
  try {
    const response = await someAsyncOperation();
    return processResults(response);
  } catch (error) {
    handleErrorProperly(error);
  }
}
```

## Framework Integration Guidelines

When adding support for a new framework:

1. Create a new package in the monorepo (e.g., `flash-vercel`)
2. Implement the framework-specific adapter
3. Provide framework-specific examples
4. Add comprehensive tests
5. Update the main README.md to reflect the new integration

## Code Style Guidelines

We follow strict coding standards to maintain consistency:

- Use TypeScript for all new code
- Follow JSDoc documentation standards
- Use 2 spaces for indentation
- Maximum line length of 100 characters
- Use double quotes for strings
- Require semicolons
- Use meaningful variable and function names
- Write clear comments for complex logic

## Pull Request Process

1. Create a new branch for your feature/fix:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes following our coding standards

3. Ensure all tests pass:
```bash
pnpm test
```

4. Update documentation as needed

5. Update CHANGELOG.md with your changes

6. Submit a pull request with:
   - Clear description of changes
   - Any breaking changes noted
   - Screenshots for UI changes
   - Links to related issues

## Release Process

1. All changes must pass CI/CD checks
2. Version numbers follow semantic versioning
3. Changelog must be updated
4. Documentation must be current
5. All tests must pass

## Getting Help

If you need assistance:

1. Check existing documentation
2. Search through Issues
3. Create a new Issue with detailed information
4. Join our community channels:
   - [X (Twitter)](https://x.com/0xZapLab)
   - [Website](https://www.0xzap.com/)

## License

By contributing to FLASH, you agree that your contributions will be licensed under the MIT License.

Thank you for helping make FLASH better! ⚡️
