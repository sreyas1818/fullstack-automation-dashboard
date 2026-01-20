import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./Chatbot.css";

function Chatbot() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!sessionStorage.getItem("isLoggedIn")) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  // Auto-scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    setChat((prev) => [...prev, { role: "user", text: message }]);

    const res = await fetch("http://127.0.0.1:9000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const data = await res.json();

    setChat((prev) => [...prev, { role: "bot", text: data.reply }]);
    setMessage("");
  };

  return (
    <>
      <Navbar />

      <div className="chatbot-page">
        <div className="chatbot-card">
          <div className="chatbot-header">
            🤖 Dashboard Assistant
          </div>

          <div className="chat-box">
            {chat.length === 0 && (
              <div className="chat-hint">
                Ask anything about your dashboard data 👇
              </div>
            )}

            {chat.map((c, i) => (
              <div
                key={i}
                className={`chat-message ${c.role === "user" ? "user" : "bot"}`}
              >
                {c.text}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="chat-input">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask about sales, highest month, trends..."
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Chatbot;
