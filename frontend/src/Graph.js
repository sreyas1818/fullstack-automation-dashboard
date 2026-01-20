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

// 🎨 Month-wise colors for Pie chart
const MONTH_COLORS = [
  "#1e88e5", // Jan
  "#43a047", // Feb
  "#fb8c00", // Mar
  "#8e24aa", // Apr
  "#00acc1", // May
  "#f4511e", // Jun
  "#3949ab", // Jul
  "#7cb342", // Aug
  "#c2185b", // Sep
  "#ffb300", // Oct
  "#6d4c41", // Nov
  "#546e7a"  // Dec
];

function Graph() {
  const [salesData, setSalesData] = useState([]);
  const [chartType, setChartType] = useState("bar");

  // Checkbox state
  const [selectedFields, setSelectedFields] = useState({
    total_sales: true,
    electronics: true,
    clothing: true,
    groceries: true
  });

  const navigate = useNavigate();

  // 🔐 Protect page
  useEffect(() => {
    if (!sessionStorage.getItem("isLoggedIn")) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  // 📥 Fetch data
  useEffect(() => {
    fetch("http://127.0.0.1:9000/sales-data")
      .then(res => res.json())
      .then(setSalesData);
  }, []);

  const handleCheckboxChange = (field) => {
    setSelectedFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const labels = salesData.map(item => item.month);

  // Dataset colors (Bar / Line)
  const colors = {
    total_sales: "#1976d2",
    electronics: "#43a047",
    clothing: "#fb8c00",
    groceries: "#8e24aa"
  };

  // 📊 Bar & Line datasets
  const datasets = Object.keys(selectedFields)
    .filter(key => selectedFields[key])
    .map(key => ({
      label:
        key === "total_sales"
          ? "Total Sales (₹)"
          : key.charAt(0).toUpperCase() + key.slice(1) + " (₹)",
      data: salesData.map(item => item[key]),
      backgroundColor: colors[key],
      borderColor: colors[key],
      borderWidth: 2,
      tension: 0,
      fill: false,
      pointRadius: 4
    }));

  const chartData = {
    labels,
    datasets
  };

  // 🎯 Find active field for Pie (only ONE allowed)
  const activePieField = Object.keys(selectedFields)
    .find(key => selectedFields[key]);

  // 🥧 Proper Pie data (MONTH-wise)
  const pieData = {
    labels,
    datasets: [
      {
        label: activePieField
          ? activePieField.replace("_", " ").toUpperCase() + " (₹)"
          : "",
        data: activePieField
          ? salesData.map(item => item[activePieField])
          : [],
        backgroundColor: MONTH_COLORS,
        borderWidth: 1
      }
    ]
  };

  // ⚙️ Common options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top"
      }
    },
    scales: chartType !== "pie" ? {
      y: {
        ticks: {
          callback: value => `₹${value}`
        }
      }
    } : {}
  };

  // 🖼️ Render correct chart
  const renderChart = () => {
    if (chartType === "pie") {
      return <Pie data={pieData} options={options} />;
    }
    if (chartType === "line") {
      return <Line data={chartData} options={options} />;
    }
    return <Bar data={chartData} options={options} />;
  };

  return (
    <>
      <Navbar />

      <div className="graph-page">
        <div className="graph-card">
          <h3>Monthly Sales Graph</h3>

          {/* Chart type buttons */}
          <div className="graph-buttons">
            <button
              className={chartType === "bar" ? "active" : ""}
              onClick={() => setChartType("bar")}
            >
              Bar
            </button>
            <button
              className={chartType === "line" ? "active" : ""}
              onClick={() => setChartType("line")}
            >
              Line
            </button>
            <button
              className={chartType === "pie" ? "active" : ""}
              onClick={() => setChartType("pie")}
            >
              Pie
            </button>
          </div>

          {/* 🎛️ Filter Chips */}
          <div className="graph-filters-card">
            <span className="filter-title">Show:</span>

            <div className="graph-filters">
              <label>
                <input
                  type="checkbox"
                  checked={selectedFields.total_sales}
                  onChange={() => handleCheckboxChange("total_sales")}
                />
                <span className="chip total_sales">Total Sales</span>
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={selectedFields.electronics}
                  onChange={() => handleCheckboxChange("electronics")}
                />
                <span className="chip electronics">Electronics</span>
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={selectedFields.clothing}
                  onChange={() => handleCheckboxChange("clothing")}
                />
                <span className="chip clothing">Clothing</span>
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={selectedFields.groceries}
                  onChange={() => handleCheckboxChange("groceries")}
                />
                <span className="chip groceries">Groceries</span>
              </label>
            </div>
          </div>

          {/* 📊 Chart */}
          <div className="graph-container">
            {renderChart()}
          </div>
        </div>
      </div>
    </>
  );
}

export default Graph;
