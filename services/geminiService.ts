import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateRomanticWish = async (): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Hãy viết một lời chúc Giáng sinh ngắn gọn, lãng mạn và đầy cảm xúc dành cho người yêu (dưới 50 từ). Ngôn ngữ: Tiếng Việt. Giọng điệu: Ngọt ngào, ấm áp.",
      config: {
        temperature: 0.8,
      }
    });

    return response.text?.trim() || "Chúc em một mùa Giáng sinh an lành và tràn ngập tình yêu!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Giáng sinh này, anh chỉ muốn ở bên em mãi mãi.";
  }
};