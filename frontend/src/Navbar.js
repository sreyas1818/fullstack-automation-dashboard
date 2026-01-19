import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    sessionStorage.removeItem("isLoggedIn");
    navigate("/", { replace: true });
  };

  return (
    <div className="navbar">
      <div className="nav-left">
        <h3>Admin Panel</h3>
      </div>

      <div className="nav-center">
        <Link
          to="/dashboard"
          className={location.pathname === "/dashboard" ? "active" : ""}
        >
          Dashboard
        </Link>

        <Link
          to="/graph"
          className={location.pathname === "/graph" ? "active" : ""}
        >
          Graph
        </Link>

        {/* ❌ Chatbot link REMOVED */}
      </div>

      <div className="nav-right">
        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default Navbar;
