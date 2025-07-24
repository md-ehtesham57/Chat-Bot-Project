// OpenAiService.jsx
export async function getChatbotResponse(messages, abortRef, retryCount = 0) {
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const maxRetries = 2;
  const retryDelayBase = 3000;

  const controller = new AbortController();
  if (abortRef) abortRef.current = controller;

  const userContent = messages.map((msg) => ({
    role: msg.role,
    parts: [{ text: msg.content }],
  }));

  const body = {
    contents: userContent,
  };

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify(body),
    });

    if (response.status === 429 && retryCount < maxRetries) {
      const delay = retryDelayBase * Math.pow(2, retryCount);
      console.warn(`⏳ Rate limited. Retrying in ${delay / 1000}s (Attempt ${retryCount + 1})`);
      await new Promise((res) => setTimeout(res, delay));
      return getChatbotResponse(messages, abortRef, retryCount + 1);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) throw new Error("Empty response from Gemini.");
    return reply;
  } catch (err) {
    if (err.name === "AbortError") {
      console.log("⏹ Request manually aborted.");
      return "⏹ Request paused by user.";
    }

    console.error("🔥 Gemini Request Failed:", err.message);
    return "Something went wrong while talking to Gemini.";
  }
}
