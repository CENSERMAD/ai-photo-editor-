
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";

let ai: GoogleGenAI | null = null;
export let isConfigured = false;

if (process.env.API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  isConfigured = true;
} else {
  console.error("API_KEY environment variable not set. App will run in a degraded mode.");
}

const model = 'gemini-2.5-flash-image-preview';

interface EditResult {
  imageUrl: string | null;
  text: string | null;
}

export const editImageWithGemini = async (
  base64ImageData: string,
  mimeType: string,
  prompt: string
): Promise<EditResult> => {
  if (!ai) {
    throw new Error("Gemini AI service is not configured. Please set the API_KEY environment variable.");
  }
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    let imageUrl: string | null = null;
    let text: string | null = null;

    if (response.candidates && response.candidates.length > 0) {
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          text = part.text;
        } else if (part.inlineData) {
          imageUrl = part.inlineData.data;
        }
      }
    }
    
    if (!imageUrl && !text) {
        // This can happen if the request is blocked or refused.
        // Check for safety ratings to provide a more specific error.
        const blockReason = response.candidates?.[0]?.finishReason;
        if (blockReason === 'SAFETY') {
            throw new Error('The request was blocked due to safety concerns. Please modify your prompt or image.');
        }
        throw new Error('AI model did not return any content.');
    }

    return { imageUrl, text };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while contacting the Gemini API.");
  }
};