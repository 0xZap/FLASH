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

Tools are organized by category (Web3, AI/ML, Productivity, Socials) in the core package. To add a new tool:

1. Create a new file in the appropriate category directory
2. Implement the tool following the FLASH Tool interface
3. Add tests for your implementation
4. Update documentation and examples
5. Add the tool to the exports in `index.ts`

Example of a tool implementation:

```typescript
import { z } from "zod";
import axios from "axios";
import { ZapAction } from "../zap_action";
import { HyperbolicConfig } from "../../config/hyperbolic_config";

// Schema for GPU response data
const GpuSchema = z.object({
  model: z.string(),
  memory: z.number(),
  price: z.number(),
  available: z.number(),
  total: z.number(),
  location: z.string(),
  node_id: z.string(),
  cluster_name: z.string(),
  compute_power: z.number(),
  clock_speed: z.number(),
  storage_capacity: z.number(),
  ram_capacity: z.number(),
  cpu_cores: z.number(),
  status: z.string(),
});

// Input schema (empty as no inputs required)
const GetAvailableGpusSchema = z.object({}).strict();

const GET_AVAILABLE_GPUS_PROMPT = `
This tool will get all the available GPU machines on the Hyperbolic platform.

It does not take any following inputs

Important notes:
- Authorization key is required for this operation
- The GPU prices are in CENTS per hour
`;

/**
 * Get available GPUs from Hyperbolic platform.
 * @returns Formatted string of available GPUs.
 */
export async function getAvailableGpus() {
    
    const config = HyperbolicConfig.getInstance();
    const apiKey = config.getApiKey();
    
    // Check if API key is found
    if (!apiKey) {
        throw new Error("Hyperbolic API key not found");
    }
    
    try {
    const response = await axios.post(
      "https://api.hyperbolic.xyz/v1/marketplace",
      { filters: {} },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    // Process GPU information
    const gpuMap = new Map<string, z.infer<typeof GpuSchema>>();

    for (const instance of response.data.instances) {
      if (instance.status === "node_ready") {
        const gpu = instance.hardware.gpus[0];
        const gpuModel = gpu.model.replace("NVIDIA-", "");
        const memory = Math.round(gpu.ram / 1024);
        const price = instance.pricing.price.amount / 100;
        const available = instance.gpus_total - instance.gpus_reserved;
        const total = instance.gpus_total;

        const key = `${gpuModel}-${price}-${instance.cluster_name}`;

        if (!gpuMap.has(key)) {
          gpuMap.set(key, {
            model: gpuModel,
            memory,
            price,
            available,
            total,
            location: instance.location.region,
            node_id: instance.id,
            cluster_name: instance.cluster_name,
            compute_power: gpu.compute_power || 0,
            clock_speed: gpu.clock_speed || 0,
            storage_capacity: instance.hardware.storage[0]?.capacity || 0,
            ram_capacity: instance.hardware.ram[0]?.capacity || 0,
            cpu_cores: instance.hardware.cpus[0]?.virtual_cores || 0,
            status: instance.status,
          });
        } else {
          const existing = gpuMap.get(key);
          if (existing) {
            existing.available += available;
            existing.total += total;
          }
        }
      }
    }

    const gpus = Array.from(gpuMap.values());
    gpus.sort((a, b) => b.price - a.price || b.available - a.available);

    // Format response
    const formattedResponse = gpus
      .map(gpu => {
        const monthlyPrice = Math.round(gpu.price * 24 * 30);
        const storageGB = Math.round(gpu.storage_capacity / 1024);
        const ramGB = Math.round(gpu.ram_capacity / 1024);

        return `${gpu.model} (${gpu.memory}GB):
- Price: $${gpu.price.toFixed(2)}/hour ($${monthlyPrice}/month)
- Available: ${gpu.available}/${gpu.total} units
- Location: ${gpu.location}
- Node ID: ${gpu.node_id}
- Cluster: ${gpu.cluster_name}
- Hardware Specs:
  • CPU: ${gpu.cpu_cores} virtual cores
  • RAM: ${ramGB}GB
  • Storage: ${storageGB}GB
  • GPU Clock: ${gpu.clock_speed}MHz
  • Compute Power: ${gpu.compute_power} TFLOPS
- Status: ${gpu.status}`;
      })
      .join("\n\n");

    return formattedResponse;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to fetch GPU data: ${error.message}`);
    }
    throw new Error("Failed to fetch GPU data");
  }
}

/**
 * Action to get available GPUs from Hyperbolic platform.
 */
export class getAvailableGpusAction implements ZapAction<typeof GetAvailableGpusSchema> {
  public name = "get_available_gpus";
  public description = GET_AVAILABLE_GPUS_PROMPT;
  public schema = GetAvailableGpusSchema;
  public config = HyperbolicConfig.getInstance();
  public func = getAvailableGpus;
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
