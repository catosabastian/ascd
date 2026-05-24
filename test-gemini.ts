// @ts-nocheck
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
dotenv.config();

async function test() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    console.error("API Key missing");
    return;
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  // Using gemini-2.5-flash which is widely available and fast
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
  console.log("Calling Gemini...");
  try {
    const result = await model.generateContent("Say hello!");
    console.log("Response:", result.response.text());
  } catch (err) {
    console.error("Gemini failed:", err);
  }
}

test();
