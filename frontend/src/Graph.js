import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  ArcElement,
  PointElement,
  Tooltip,
  Legend
} from "chart.js";
import { Bar, Line, Pie } from "react-chartjs-2";
import "./Graph.css";

// Register chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  ArcElement,
  PointElement,
  Tooltip,
  Legend
);

function Graph() {
  const [salesData, setSalesData] = useState([]);
  const [chartType, setChartType] = useState("bar");
  const navigate = useNavigate();

  // 🔐 Protect page
  useEffect(() => {
    if (!sessionStorage.getItem("isLoggedIn")) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  // 📥 Fetch sales data
  useEffect(() => {
    fetch("http://127.0.0.1:8000/sales-data")
      .then(res => res.json())
      .then(setSalesData);
  }, []);

  const chartData = {
    labels: salesData.map(item => item.month),
    datasets: [
      {
        label: "Total Monthly Sales (₹)",
        data: salesData.map(item => item.total_sales),
        backgroundColor: [
          "#1976d2","#26a69a","#ef5350","#ab47bc",
          "#ffa726","#66bb6a","#42a5f5","#ff7043",
          "#7e57c2","#26c6da","#d4e157","#8d6e63"
        ],
        borderColor: "#1976d2",
        borderWidth: 2,
        fill: false
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // 🔑 IMPORTANT
    plugins: {
      legend: {
        position: "top"
      }
    }
  };

  const renderChart = () => {
    if (chartType === "line") return <Line data={chartData} options={options} />;
    if (chartType === "pie") return <Pie data={chartData} options={options} />;
    return <Bar data={chartData} options={options} />;
  };

  return (
    <>
      <Navbar />

      <div className="graph-page">
        <div className="graph-card">
          <h3>Monthly Sales Graph</h3>

          {/* 🔘 Buttons */}
          <div className="graph-buttons">
            <button onClick={() => setChartType("bar")}>Bar</button>
            <button onClick={() => setChartType("line")}>Line</button>
            <button onClick={() => setChartType("pie")}>Pie</button>
          </div>

          {/* 📊 Chart container */}
          <div className="graph-container">
            {renderChart()}
          </div>
        </div>
      </div>
    </>
  );
}

export default Graph;
