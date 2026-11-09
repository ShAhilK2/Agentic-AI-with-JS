import express from "express";
import dotenv from "dotenv";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";
import { MongoClient } from "mongodb";

import { randomUUID } from "node:crypto";
import { Command } from "@langchain/langgraph";
import {
  StateGraph,
  MessagesAnnotation,
  MemorySaver,
  StateSchema,
  interrupt,
} from "@langchain/langgraph";
import z from "zod";
import { ChatGroq } from "@langchain/groq";

dotenv.config();

const app = express();

app.use(express.json());

// const checkPointer = new MemorySaver();

const client = new MongoClient(
  "mongodb+srv://skdev842_db_user:Asus123@cluster0.ffu297f.mongodb.net/",
);
const checkPointer = new MongoDBSaver({ client, dbName: "langgraph" });

const customState = new StateSchema({
  prompt: z.string(),
  approvalRequires: z.boolean(),
  aiResponse: z.string(),
  approved: z.boolean(),
  result: z.string(),
});
const model = new ChatGroq({
  model: "openai/gpt-oss-120b",
  temperature: 0,
  maxRetries: 2,
});

const approvalNode = async (state) => {
  const answer = interrupt({
    message: "Do you approve this action?",
    prompt: state.prompt,
    aiResponse: state.aiResponse,
  });

  return {
    approved: String(answer).trim().toLowerCase() === "yes",
  };
};

const actionNode = async (state) => {
  if (state.approved) {
    return {
      result: `action approved`,
    };
  }
  return {
    result: `action rejected by the human`,
  };
};
const agent = async (state) => {
  const result = await model.invoke([
    {
      role: "system",
      content: `You are a helpful assistant. 
      If the user is greeting or asking a normal question ,
      response normally and set approvalRequires to false.
      If the rquest requires a sensitives external action ,
      such as sending an email or making a payment,or deleting a file,
      set approvalRequires to true.

      Return JSON with :
      {
       "response": "Your response here",
        "approvalRequires": true or false
      }
      `,
    },
    {
      role: "user",
      content: state.prompt,
    },
  ]);

  const parsed = JSON.parse(result.content);
  return {
    aiResponse: parsed.response,
    approvalRequires: parsed.approvalRequires,
  };
};

const shouldContinue = async (state) => {
  if (state.approvalRequires) {
    return "approval";
  }
  return "__end__";
};
const graph = new StateGraph(customState)
  .addNode("agent", agent)
  .addNode("approval", approvalNode)
  .addNode("action", actionNode)
  .addEdge("__start__", "agent")
  .addConditionalEdges("agent", shouldContinue)
  .addEdge("approval", "action")
  .addEdge("action", "__end__")
  .compile({ checkpointer: checkPointer });

app.post("/chat", async (req, res) => {
  const { prompt } = req.body;
  const thread_id = randomUUID();
  const config = { configurable: { thread_id } };
  const result = await graph.invoke({ prompt }, config);
  res.json({
    result: result.result,
    aiResponse: result.aiResponse,
    thread_id,
  });
});

app.post("/chat/resume", async (req, res) => {
  const { answer, thread_id } = req.body;
  const config = { configurable: { thread_id } };
  const result = await graph.invoke(
    new Command({ resume: String(answer) }),
    config,
  );
  res.json({
    result: result.result,
    thread_id,
  });
});

app.listen(8000, () => {
  console.log("Server is running on port 8000");
});
