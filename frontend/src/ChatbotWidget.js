import { useState } from "react";
import "./ChatbotWidget.css";

function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    setChat((prev) => [...prev, { role: "user", text: message }]);

    try {
      const res = await fetch("http://127.0.0.1:9000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();
      setChat((prev) => [...prev, { role: "bot", text: data.reply }]);
    } catch {
      setChat((prev) => [
        ...prev,
        { role: "bot", text: "Server not responding." },
      ]);
    }

    setMessage("");
  };

  return (
    <>
      {/* Floating button */}
      <button className="chatbot-toggle" onClick={() => setOpen(!open)}>
        🤖
      </button>

      {open && (
        <div className="chatbot-widget">
          <div className="chatbot-header">
            Dashboard Assistant 🤖
            <span onClick={() => setOpen(false)}>✕</span>
          </div>

          <div className="chatbot-body">
            {chat.map((c, i) => (
              <div key={i} className={`msg ${c.role}`}>
                {c.text}
              </div>
            ))}
          </div>

          <div className="chatbot-footer">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask about sales..."
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatbotWidget;
