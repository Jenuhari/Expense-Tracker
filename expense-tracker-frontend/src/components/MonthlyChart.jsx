// src/components/MonthlyChart.jsx
import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function MonthlyChart({ stats }) {
  if (!stats) return null;

  const labels = stats.per_category.map((c) => c.category_name);
  const values = stats.per_category.map((c) => c.total_amount);

  const data = {
    labels,
    datasets: [
      {
        label: "Amount spent",
        data: values,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
    },
  };

  const monthName = new Date(stats.year, stats.month - 1).toLocaleString(
    "default",
    { month: "long" }
  );

  return (
    <div className="card">
      <h3>
        Monthly Statistics – {monthName} {stats.year}
      </h3>
      <p>Total spent: {stats.total_spent.toFixed(2)}</p>
      {values.length === 0 ? <p>No data for this month.</p> : <Bar data={data} options={options} />}
    </div>
  );
}
