#### Core rules

* **Do not** call OpenAI, Anthropic, or any provider SDK directly.
* **Do not** set a custom base URL when running on Vercel.
* **Always** use the `ai` SDK (`generateText`, `streamText`, etc.).
* **Always** specify models using `provider/model` identifiers.

#### Authentication

* Rely on the environment variable:
  * `AI_GATEWAY_API_KEY`
* Do **not** reference provider API keys (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, etc.).

#### Basic pattern

Simple LLM calls look like this:

```ts
import { generateText } from 'ai';

const { text } = await generateText({
  model: 'anthropic/claude-sonnet-4.5',
  prompt: '...',
});
```

This automatically routes through AI Gateway when deployed on Vercel.

#### Agentic pattern with tools

For agentic workflows with tool calling, use `ToolLoopAgent`:

```ts
import { ToolLoopAgent } from 'ai';

const agent = new ToolLoopAgent({
  model: 'anthropic/claude-sonnet-4.5',
  instructions: 'You are a helpful assistant.',
  tools: {
    weather: weatherTool,
    calculator: calculatorTool,
  },
});

const result = await agent.generate({
  prompt: 'What is the weather in NYC?',
});

console.log(result.text);
```

#### Model selection

* Always pass the model explicitly.
* Prefer the latest models from each provider for best results.
* Use gateway-supported model IDs (e.g. `openai/gpt-5.2`, `anthropic/claude-sonnet-4.5`).
* Do not rely on SDK defaults.

#### Behavior assumptions

* Usage tracking, retries, routing, and observability are handled by AI Gateway.
* Do not implement custom retry, failover, or logging logic unless instructed.

#### Forbidden patterns

* `import OpenAI from 'openai'`
* `import Anthropic from '@anthropic-ai/sdk'`
* Hardcoded provider base URLs
* Direct HTTP calls to provider APIs

Read more in the [AI Gateway](https://vercel.com/docs/ai-gateway.md) and [AI SDK](https://ai-sdk.dev/docs/introduction.md) documentation.
