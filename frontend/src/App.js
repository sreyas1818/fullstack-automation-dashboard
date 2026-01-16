import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./Login";
import Dashboard from "./Dashboard";
import Chatbot from "./Chatbot";
import Graph from "./Graph";   // ✅ NEW

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* 📊 Graph Route */}
        <Route path="/graph" element={<Graph />} />

        {/* 🤖 Chatbot Route */}
        <Route path="/chatbot" element={<Chatbot />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
