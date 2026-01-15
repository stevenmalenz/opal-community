# Gemini API Knowledge Base

## Status: Vercel AI Gateway Primary
**Strict Rule**: All AI calls MUST route through the Vercel AI Gateway using the `AI_GATEWAY_API_KEY`.

---

## Current Model Stack

| Model | Code (Provider/Model) | Role |
| :--- | :--- | :--- |
| **Gemini 3 Pro** | `google/gemini-3-pro-preview` | **Primary Reasoning**. Best for multimodal and agentic flows. |
| **Gemini 3 Flash** | `google/gemini-3-flash-preview` | **Speed/Cost**. Best for high-frequency or simpler tasks. |
| **Nano Banana Pro** | `google/nano-banana-pro` | **State-of-the-art image generation** and editing. |
| **Veo 3.1** | `google/veo-3.1` | **Video generation** with native audio. |

---

## Vercel AI Gateway Implementation

### Environment Variables
- `AI_GATEWAY_API_KEY`: Your Vercel Gateway key (starts with `vck_`).
- *Note*: Provider-specific keys (like `VITE_GEMINI_API_KEY`) are no longer used for AI calls.

### Integration Pattern (aiService.ts)
```ts
import { generateText } from 'ai';

// String-based resolution handles gateway routing automatically
const { text } = await generateText({
  model: 'google/gemini-3-pro-preview',
  prompt: '...',
});
```

### Knowledge Cutoff
Gemini 3 models have a knowledge cutoff of **January 2025**.

---

## 🚫 Forbidden Patterns
- No direct `fetch` calls to `generativelanguage.googleapis.com`.
- No direct usage of `createGoogleGenerativeAI` or `GoogleGenAI` SDKs.
- No references to `gemini-1.5` models.
