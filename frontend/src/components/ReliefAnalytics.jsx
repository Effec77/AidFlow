import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  CartesianGrid,
} from "recharts";
import "../css/ReliefAnalytics.css";

const ReliefAnalytics = ({ fundData, volunteerData, providerData }) => {
  const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444"];

  const pieData = [
    { name: "Funds", value: fundData?.total || 0 },
    { name: "Volunteers", value: volunteerData?.total || 0 },
    { name: "Providers", value: providerData?.total || 0 },
  ];

  const trendData = fundData?.monthlyTrends || [
    { month: "Jan", funds: 200, volunteers: 40, providers: 15 },
    { month: "Feb", funds: 350, volunteers: 55, providers: 22 },
    { month: "Mar", funds: 450, volunteers: 70, providers: 30 },
  ];

  return (
    <div className="relief-analytics-section">
      <h2 className="analytics-title">Relief Fund Analytics</h2>
      <p className="analytics-subtitle">
        Visual overview of relief operations and contributions.
      </p>

      <div className="analytics-grid">
        {/* ===== Pie Chart ===== */}
        <div className="analytics-card">
          <h3>Overall Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* ===== Bar Chart ===== */}
        <div className="analytics-card">
          <h3>Monthly Funds vs Volunteers</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="funds" fill="#2563eb" />
              <Bar dataKey="volunteers" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ===== Line Chart ===== */}
        <div className="analytics-card wide">
          <h3>Funds, Volunteers & Providers Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="funds" stroke="#2563eb" strokeWidth={2} />
              <Line type="monotone" dataKey="volunteers" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="providers" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ReliefAnalytics;
