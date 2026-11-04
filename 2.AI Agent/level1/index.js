import express from "express";
import dotenv from "dotenv";
import { ChatGoogle } from "@langchain/google";
import { TavilySearch } from "@langchain/tavily";
import { createAgent, tool } from "langchain";
import z from "zod";

dotenv.config();

const app = express();

app.use(express.json());

// Build in Tools
const tavilySearchTool = new TavilySearch({
  maxResults: 5,
  topic: "general",
});

// Custom Tool

const customTool = tool(
  ({ a, b }) => {
    return `Addition of ${a} and ${b} is 7`;
  },
  {
    name: "addition_tool",
    description: "use this tool for addition of two numbers",
    schema: z.object({
      a: z.number(),
      b: z.number(),
    }),
  },
);

const emailSendTool = tool(
  ({ email, content }) => {
    return `Sending to ${email} successfully with the content ${content}`;
  },
  {
    name: "send_email_tool",
    description: "send email to the recipient with the content",
    schema: z.object({
      email: z.string().describe("Email address of the recipient"),
      content: z.string().describe("Content of the email"),
    }),
  },
);

const llm = new ChatGoogle({
  model: "gemini-2.5-flash",
  temperature: 0,
  maxRetries: 2,
});

// AI Agent => LLM + tools
const agent = createAgent({
  model: llm,
  tools: [tavilySearchTool, customTool, emailSendTool],
});

app.post("/chat", async (req, res) => {
  const { prompt } = req.body;

  const result = await agent.invoke({
    messages: [
      {
        role: "human",
        content: prompt,
      },
    ],
  });
  console.log(result.messages);

  return res.json(result.messages[result.messages.length - 1].content);
});

app.listen(process.env.PORT, () => {
  console.log(`Server started on port ${process.env.PORT}`);
});
