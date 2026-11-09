import express from "express";
import dotenv from "dotenv";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";
import { MongoClient } from "mongodb";
import { TavilySearch } from "@langchain/tavily";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { createAgent, tool } from "langchain";
import {
  StateGraph,
  MessagesAnnotation,
  MemorySaver,
} from "@langchain/langgraph";
import z from "zod";
import { ChatGroq } from "@langchain/groq";

dotenv.config();

const app = express();

app.use(express.json());

// const checkPointer = new MemorySaver();

const client = new MongoClient(
  "mongodb+srv://skdev842_db_user:AWzG9MBZ7qE45qHs@cluster0.ffu297f.mongodb.net/",
);
const checkPointer = new MongoDBSaver({ client, dbName: "langgraph" });

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

const tools = [tavilySearchTool, customTool, emailSendTool];
const llm = new ChatGroq({
  model: "openai/gpt-oss-120b",
  temperature: 0,
  maxRetries: 2,
}).bindTools(tools);

const toolNode = new ToolNode(tools);

const agent = async (state) => {
  const result = await llm.invoke(state.messages);

  return { messages: [result] };
};

const shouldContinue = (state) => {
  console.log(state);
  if (state.messages[state.messages.length - 1].tool_calls.length > 0) {
    return "tools_node";
  }
  return "__end__";
};

const graph = new StateGraph(MessagesAnnotation)
  .addNode("agent", agent)
  .addNode("tools_node", toolNode)
  .addEdge("__start__", "agent")
  .addConditionalEdges("agent", shouldContinue)
  .addEdge("tools_node", "agent")
  .compile({ checkpointer: checkPointer });

app.post("/chat", async (req, res) => {
  const { prompt } = req.body;
  const result = await graph.invoke(
    {
      messages: [{ role: "user", content: prompt }],
    },
    {
      configurable: {
        thread_id: "1",
      },
    },
  );
  console.log(result);
  return res.json(result.messages[result.messages.length - 1].content);
});

app.listen(process.env.PORT, () => {
  console.log(`Server started on port ${process.env.PORT}`);
});
