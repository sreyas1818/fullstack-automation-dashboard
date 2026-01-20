import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // 🔐 If already logged in, redirect to dashboard
  useEffect(() => {
    const loggedIn = sessionStorage.getItem("isLoggedIn");
    if (loggedIn) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const login = async () => {
  console.log("LOGIN FUNCTION TRIGGERED"); // 👈 ADD THIS LINE

  try {
    const res = await fetch("http://127.0.0.1:9000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        password: password,
      }),
    });

    if (res.ok) {
      sessionStorage.setItem("isLoggedIn", "true");
      navigate("/dashboard", { replace: true });
    } else {
      alert("Invalid username or password");
    }
  } catch (err) {
    console.error("Login error:", err);
    alert("Server error. Try again.");
  }
};


  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Admin Login</h2>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={login}>Login</button>
      </div>
    </div>
  );
}

export default Login;
