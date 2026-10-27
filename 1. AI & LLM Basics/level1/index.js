import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { ChatGoogle } from "@langchain/google";
import { ChatGroq } from "@langchain/groq";

dotenv.config();

const app = express();
// const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// BY DEFAULT
// generateContentStream is used for streaming responses
// generateContent is used for single responses

// async function main() {
// const responseStream = await ai.models.generateContentStream({
//   model: 'gemini-2.5-flash',
//   contents: 'What is JavaScript?',
// });
// for await (const chunk of responseStream) {
//   console.log(chunk.text);
// }

// }

// main();

app.use(express.json());
// app.post("/chat",async (req,res) => {
//     const {prompt} = req.body;
//     const result = await ai.models.generateContent({
//         model: 'gemini-2.5-flash',
//         contents: prompt,
//     });
//     res.json(result.text);
// });

app.post("/chat", async (req, res) => {
  const { prompt } = req.body;
  // const llm = new ChatGoogle({

  //   apiKey: process.env.GOOGLE_API_KEY,
  //   model: "gemini-3.5-flash",
  //   // // Creative answers range from 0 to 2
  //   // // 0 = factual, 2 = creative
  //   // temperature: 0.7,
  //   // maxOutputTokens: 1000,
  //   // maxRetries: 2,
  //   // // other params...
  // });

  const llm = new ChatGroq({
    model: "openai/gpt-oss-120b",
    temperature: 0,
    maxTokens: undefined,
    maxRetries: 2,
  });
  const result = await llm.invoke([
    {
      role: "system",
      content: "You are a helpful assistant and your name is skdev",
    },
    {
      role: "user",
      content: prompt,
    },
  ]);
  return res.json(result.content);
});

app.listen(process.env.PORT, () => {
  console.log(`Server started on port ${process.env.PORT}`);
});
