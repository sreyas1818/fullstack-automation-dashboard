import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./Chatbot.css";

function Chatbot() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!sessionStorage.getItem("isLoggedIn")) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    setChat(prev => [...prev, { role: "user", text: message }]);

    const res = await fetch("http://127.0.0.1:8000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const data = await res.json();
    setChat(prev => [...prev, { role: "bot", text: data.reply }]);
    setMessage("");
  };

  return (
    <>
      {/* ✅ SAME NAVBAR */}
      <Navbar />

      <div className="chatbot-page">
        <div className="chat-box">
          {chat.map((c, i) => (
            <p key={i}>
              <b>{c.role === "user" ? "You" : "Bot"}:</b> {c.text}
            </p>
          ))}
        </div>

        <div className="chat-input">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask something..."
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </>
  );
}

export default Chatbot;
