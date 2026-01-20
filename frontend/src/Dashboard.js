import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import ChatbotWidget from "./ChatbotWidget";
import "./Dashboard.css";

function Dashboard() {
  const [salesData, setSalesData] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  // 🔐 Protect dashboard
  useEffect(() => {
    if (!sessionStorage.getItem("isLoggedIn")) {
      navigate("/", { replace: true });
    }
  }, [navigate]);
  // 📥 Fetch sales data
  useEffect(() => {
    fetch("http://127.0.0.1:9000/sales-data")
      .then((res) => res.json())
      .then(setSalesData);
  }, []);

  // 🔎 Filter by MONTH or SOURCE
  const filteredSalesData = salesData.filter((row) => {
    const query = search.toLowerCase();

    return (
      row.month?.toLowerCase().includes(query) ||
      row.source?.toLowerCase().includes(query)
    );
  });

  return (
    <>
      <Navbar />

      <div className="dashboard-page">
        {/* 🔹 SEARCH BAR */}
        <div className="card search-card">
          <input
            type="text"
            placeholder="Search by Month or Source (Jan, google_drive...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span>{filteredSalesData.length} records found</span>
        </div>

        {/* 🔹 SALES TABLE */}
        <div className="card table-card">
          <h3>Monthly Sales Data</h3>

          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Electronics</th>
                <th>Clothing</th>
                <th>Groceries</th>
                <th>Total Sales</th>
                <th>Source</th>
              </tr>
            </thead>

            <tbody>
              {filteredSalesData.map((row) => (
                <tr key={row.id}>
                  <td>{row.month}</td>
                  <td>₹ {row.electronics}</td>
                  <td>₹ {row.clothing}</td>
                  <td>₹ {row.groceries}</td>
                  <td>₹ {row.total_sales}</td>
                  <td>{row.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* 🤖 CHATBOT FLOATING WIDGET */}
      <ChatbotWidget />
    </>
  );
}
export default Dashboard;