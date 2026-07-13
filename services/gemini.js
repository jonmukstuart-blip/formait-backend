import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.log("[GEMINI] ❌ Missing API Key");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function askGemini(prompt) {
  if (!genAI) {
    return "Gemini is not configured.";
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent(prompt);
  const response = await result.response;

  return response.text();
}