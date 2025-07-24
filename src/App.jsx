import { useState, useRef } from "react";
import { getChatbotResponse } from "./OpenAiService";

function App() {
  const [userInput, setUserInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const abortRef = useRef(null); // For manual cancel

  const handleSend = async () => {
    if (!userInput.trim() || isPaused || isLoading) return;

    const newMessage = { role: "user", content: userInput };
    const updatedHistory = [...chatHistory, newMessage];

    setChatHistory(updatedHistory);
    setUserInput("");
    setIsLoading(true);

    try {
      const response = await getChatbotResponse(updatedHistory, abortRef);
      const botMessage = { role: "assistant", content: response };
      setChatHistory([...updatedHistory, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      setChatHistory([
        ...updatedHistory,
        { role: "assistant", content: "⚠️ Oops, I zoned out. Try again!" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = () => {
    if (abortRef.current) {
      abortRef.current.abort(); // cancel fetch
    }
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "auto" }}>
      <h1>Chat-Bot</h1>

      <div
        style={{
          maxHeight: "400px",
          overflowY: "auto",
          marginBottom: "1rem",
          border: "1px solid #ddd",
          padding: "1rem",
          borderRadius: "8px",
          backgroundColor: "blue",
        }}
      >
        {chatHistory.map((msg, idx) => (
          <div key={idx} style={{ marginBottom: "1rem" }}>
            <strong>{msg.role === "user" ? "You" : "Bot"}:</strong> {msg.content}
          </div>
        ))}
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything..."
          style={{ width: "300px", padding: "0.5rem", marginRight: "1rem" }}
          disabled={isLoading || isPaused}
        />

        <button onClick={handleSend} disabled={isLoading || isPaused}>
          {isLoading ? "Sending..." : "Send"}
        </button>

        {!isPaused ? (
          <button onClick={handlePause} style={{ marginLeft: "1rem" }}>
            ⏸ Pause
          </button>
        ) : (
          <button onClick={handleResume} style={{ marginLeft: "1rem" }}>
            ▶️ Resume
          </button>
        )}
      </div>
    </div>
  );
}

export default App;
