import { Agent } from "@mastra/core/agent";
import { weatherTool } from "@/mastra/tools";
import { LibSQLStore } from "@mastra/libsql";
import { Memory } from "@mastra/memory";
import { FlowerCardSchema } from "@/flowers/schema";

export const FlowerCardStateSchema = FlowerCardSchema;

export const weatherAgent = new Agent({
  id: "weather-agent",
  name: "Weather Agent",
  tools: { weatherTool },
  model: {
    providerId: "featherless",
    modelId: "google/gemma-4-31B-it",
    url: "https://api.featherless.ai/v1",
    apiKey: process.env.FEATHERLESS_API_KEY,
  },
  instructions:
    "You are a helpful assistant for editing Mother's Day flower cards. Use frontend actions when the user wants presets, card content, flower type picking, or flower type variations.",
  memory: new Memory({
    storage: new LibSQLStore({
      id: "weather-agent-memory",
      url: "file::memory:",
    }),
    options: {
      workingMemory: {
        enabled: true,
        schema: FlowerCardStateSchema,
        scope: "thread",
      },
    },
  }),
});
