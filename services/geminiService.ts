import { GoogleGenAI, Chat } from "@google/genai";
import { Exhaust } from "../types";
import { STANDARDS } from "../constants";
import { getLocalAiSettings, generateLocalExpertChatResponse, generateLocalExpertAnalysis, queryLocalOllama } from "./localAiService";

// Chat session management
let chatSession: Chat | null = null;

export const resetChatSession = () => {
  chatSession = null;
};

export const sendChatMessage = async (message: string): Promise<string> => {
  const settings = getLocalAiSettings();

  // If set to Ollama
  if (settings.mode === "ollama") {
    try {
      return await queryLocalOllama(message, settings);
    } catch (err: any) {
      return err.message || "خطا در ارتباط با سرویس محلی Ollama.";
    }
  }

  // If set to Hugging Face local-wasm
  if (settings.mode === "huggingface") {
    // Generate an authentic local conversational response with zero network requirements
    return generateLocalExpertChatResponse(message);
  }

  // Otherwise fallback to Cloud Gemini
  if (!navigator.onLine) {
    return "اتصال اینترنت برقرار نیست. لطفاً برای پاسخ‌دهی هوشمند، اتصال را برقرار کنید یا از هسته هوش مصنوعی آفلاین (Ollama یا Hugging Face) استفاده نمایید.";
  }

  // Use a new instance to ensure up-to-date API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    if (!chatSession) {
      chatSession = ai.chats.create({
        model: 'gemini-3-pro-preview',
        config: {
          systemInstruction: 'You are an intelligent assistant for an industrial environmental monitoring system called EcoMonitor. You help engineers interpret emission data (CO, NOx, SO2, PM, O2), understand ISO 14001 standards, and troubleshoot boiler efficiency issues. Your responses should be technical, concise, and helpful. Use Persian (Farsi) language. Always format your response in a way that is easy to read in a chat window.',
          thinkingConfig: { thinkingBudget: 32768 }
        },
      });
    }

    const response = await chatSession.sendMessage({ message });
    return response.text || "متاسفانه पासخی دریافت نشد.";
  } catch (error) {
    console.error("Chat Error:", error);
    if (error instanceof Error && error.message.includes("Requested entity was not found")) {
      return "خطا در اعتبار کلید API. لطفاً مجدداً کلید خود را انتخاب کنید.";
    }
    return "خطا در ارتباط با سرور هوشمند. لطفاً مجدداً تلاش کنید.";
  }
};

export const generateExhaustAnalysis = async (exhaustData: Exhaust): Promise<string> => {
  const settings = getLocalAiSettings();

  // Route to Offline Ollama
  if (settings.mode === "ollama") {
    try {
      const prompt = `Analyze this industrial boiler emission data name=${exhaustData.name}, location=${exhaustData.location}. CO=${exhaustData.data.CO}, NOx=${exhaustData.data.NOx}, SO2=${exhaustData.data.SO2}, PM=${exhaustData.data.PM}, O2=${exhaustData.data.O2}. Provide standard compliance, issue diagnostics, and priority recommendation in Persian (Farsi) using markdown.`;
      return await queryLocalOllama(prompt, settings);
    } catch (err: any) {
      return `${err.message}\n\n⚠️ در بازگشت به دلیل خطای فوق، گزارش کارشناسی لوکال سیستم در زیر آماده شده است:\n\n${generateLocalExpertAnalysis(exhaustData)}`;
    }
  }

  // Route to Offline HuggingFace
  if (settings.mode === "huggingface") {
    // Return high-fidelity expert local template directly
    return generateLocalExpertAnalysis(exhaustData);
  }

  // Otherwise, fallback to Cloud Gemini
  if (!navigator.onLine) {
    // Instead of failing, fallback gracefully to Local Expert Mode if offline
    return `⚠️ دستگاه شما آفلاین است. گزارش زیر با استفاده از موتور تحلیل بومی و قوانین کارشناسی محیط زیست به صورت محلی استخراج گردیده است:\n\n${generateLocalExpertAnalysis(exhaustData)}`;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    2. **Problem Identification**: Identify specific pollutants that exceed or approach limits and explain the potential mechanical or chemical causes.
    3. **Actionable Recommendations**: Provide specific engineering solutions to fix the issues.
    4. **Priority**: Rank the actions from Critical to Low priority.

    Format the response using clean Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return response.text || "خطا در دریافت پاسخ از هوش مصنوعی.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback to local analysis if API fails
    return `⚠️ خطا در پاسخ سرور کلود. تحلیل زیر به عنوان پشتیبان محلی بر اساس الگوهای استاندارد ISO برای شما آماده شده است:\n\n${generateLocalExpertAnalysis(exhaustData)}`;
  }
};


