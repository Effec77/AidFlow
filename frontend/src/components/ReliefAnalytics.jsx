import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  CartesianGrid,
} from "recharts";
import "../css/ReliefAnalytics.css";

const ReliefAnalytics = ({ fundData, volunteerData, providerData }) => {
  const trendData = fundData?.monthlyTrends || [
    { month: "Jan", funds: 200, volunteers: 40, providers: 15 },
    { month: "Feb", funds: 350, volunteers: 55, providers: 22 },
    { month: "Mar", funds: 450, volunteers: 70, providers: 30 },
  ];

  // Explicit colors for Recharts SVG elements (Light Mode)
  const TEXT_MUTED = "#6B7280"; // Cool Gray 500
  const TEXT_MAIN = "#111827";   // Gray 900
  const BORDER_LIGHT = "#E5E7EB"; // Gray 200
  const BG_CARD = "#FFFFFF";

  return (
    <div className="relief-analytics-section">
      <h2 className="analytics-title">Relief Analytics</h2>
      <p className="analytics-subtitle">
        Visual overview of relief operations and contributions.
      </p>

      <div className="analytics-grid">
        {/* ===== Bar Chart ===== */}
        <div className="analytics-card">
          <h3>Monthly Funds vs Volunteers</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={trendData} barGap={8}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={BORDER_LIGHT} opacity={0.3} />
              <XAxis dataKey="month" tick={{ fill: TEXT_MUTED }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: TEXT_MUTED }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                contentStyle={{ backgroundColor: BG_CARD, borderColor: BORDER_LIGHT, color: TEXT_MAIN }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Bar dataKey="funds" fill="#60A5FA" radius={[4, 4, 0, 0]} barSize={32} name="Funds" />
              <Bar dataKey="volunteers" fill="#34D399" radius={[4, 4, 0, 0]} barSize={32} name="Volunteers" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ===== Line Chart ===== */}
        <div className="analytics-card wide">
          <h3>Funds, Volunteers & Providers Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={BORDER_LIGHT} opacity={0.3} />
              <XAxis dataKey="month" tick={{ fill: TEXT_MUTED }} axisLine={{ stroke: BORDER_LIGHT, opacity: 0.3 }} tickLine={false} dy={10} />
              <YAxis tick={{ fill: TEXT_MUTED }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: BG_CARD, borderColor: BORDER_LIGHT, color: TEXT_MAIN }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Line type="monotone" dataKey="funds" stroke="#60A5FA" strokeWidth={3} dot={{ r: 4, fill: '#60A5FA', strokeWidth: 0 }} activeDot={{ r: 7 }} name="Funds" />
              <Line type="monotone" dataKey="volunteers" stroke="#34D399" strokeWidth={3} dot={{ r: 4, fill: '#34D399', strokeWidth: 0 }} activeDot={{ r: 7 }} name="Volunteers" />
              <Line type="monotone" dataKey="providers" stroke="#FBBF24" strokeWidth={3} dot={{ r: 4, fill: '#FBBF24', strokeWidth: 0 }} activeDot={{ r: 7 }} name="Providers" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ReliefAnalytics;
