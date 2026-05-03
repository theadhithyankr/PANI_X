import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: (import.meta as any).env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true // Required when using Groq SDK in client-side Vite (browser)
});

export const getGroqChatCompletion = async (prompt: string, model: string = "llama-3.1-8b-instant", jsonMode: boolean = false) => {
  try {
    const options: any = {
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: model,
    };

    if (jsonMode) {
      options.response_format = { type: "json_object" };
    }

    const response = await groq.chat.completions.create(options);
    
    return response.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Error calling Groq API:", error);
    throw error;
  }
};
