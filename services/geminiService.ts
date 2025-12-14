import { GoogleGenAI } from "@google/genai";

let genAI: GoogleGenAI | null = null;

export const initializeGemini = () => {
  if (!process.env.API_KEY) {
    console.warn("Gemini API Key is missing. AI features will be disabled.");
    return null;
  }
  if (!genAI) {
    genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return genAI;
};

export const askMathTutor = async (userQuestion: string, context: string): Promise<string> => {
  const ai = initializeGemini();
  if (!ai) {
    return "За жал, AI туторот моментално не е достапен. Проверете го API клучот.";
  }

  try {
    const systemPrompt = `
      Ти си пријателски настроен наставник по математика за ученици во основно училиште (одделенска настава).
      Твојот јазик е Македонски.
      Темата е: Триаголници (Видови, внатрешни агли, надворешни агли).
      
      Правила:
      1. Никогаш не го давај директниот одговор на задача. Наместо тоа, давај "scaffolding" (скеле) - помошни прашања или насоки.
      2. Биди краток, јасен и ентузијастичен.
      3. Користи LaTeX за математички изрази каде е потребно, но во едноставна форма.
      4. Контекстот во кој се наоѓа ученикот е: ${context}.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userQuestion,
      config: {
        systemInstruction: systemPrompt,
      }
    });

    return response.text || "Се извинувам, не успеав да генерирам одговор.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Настана грешка при комуникација со туторот. Обиди се повторно.";
  }
};