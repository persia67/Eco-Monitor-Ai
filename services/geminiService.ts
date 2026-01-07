import { GoogleGenAI, Chat } from "@google/genai";
import { Exhaust } from "../types";
import { STANDARDS } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Chat session management
let chatSession: Chat | null = null;

export const resetChatSession = () => {
  chatSession = null;
};

export const sendChatMessage = async (message: string): Promise<string> => {
  try {
    if (!chatSession) {
      chatSession = ai.chats.create({
        model: 'gemini-3-pro-preview',
        config: {
          systemInstruction: 'You are an intelligent assistant for an industrial environmental monitoring system called EcoMonitor. You help engineers interpret emission data (CO, NOx, SO2, PM, O2), understand ISO 14001 standards, and troubleshoot boiler efficiency issues. Your responses should be technical, concise, and helpful. Use Persian (Farsi) language. Always format your response in a way that is easy to read in a chat window.',
        },
      });
    }

    const response = await chatSession.sendMessage({ message });
    return response.text || "متاسفانه پاسخی دریافت نشد.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "خطا در ارتباط با سرور هوشمند. لطفاً مجدداً تلاش کنید.";
  }
};

export const generateExhaustAnalysis = async (exhaustData: Exhaust): Promise<string> => {
  const dataDescription = Object.entries(exhaustData.data).map(([pollutant, value]) => {
    const std = STANDARDS[pollutant];
    return `- ${std.name} (${pollutant}): ${value} ${std.unit} (Standard Limit: ${std.limit})`;
  }).join('\n');

  const prompt = `
    You are an expert environmental engineer and boiler system specialist. 
    Analyze the following emission data for an industrial boiler:

    Exhaust Name: ${exhaustData.name}
    Location: ${exhaustData.location}
    Last Check Date: ${exhaustData.lastCheck}

    Pollutant Data:
    ${dataDescription}

    Please provide a detailed technical report in Persian (Farsi) covering:
    1. **Overall Status**: A summary of the boiler's compliance with environmental standards.
    2. **Problem Identification**: Identify specific pollutants that exceed or approach limits and explain the potential mechanical or chemical causes (e.g., lean fuel mixture, low combustion temperature, sulfur content).
    3. **Actionable Recommendations**: Provide specific engineering solutions to fix the issues.
    4. **Priority**: Rank the actions from Critical to Low priority.
    5. **Estimation**: Rough time and resource estimation for the fixes.

    Format the response using clean Markdown with headers and bullet points. Use professional technical Persian terminology.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return response.text || "خطا در دریافت پاسخ از هوش مصنوعی. لطفاً مجدداً تلاش کنید.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "خطا در برقراری ارتباط با سرور تحلیل هوشمند. لطفاً اتصال اینترنت خود را بررسی کنید.";
  }
};