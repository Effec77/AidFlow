import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { UserProvider } from "./components/UserContext";

// 🧩 Common Layout Components
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";

// 🏠 Home and Core Components
import Hero from "./components/Hero.jsx";
import About from "./components/About.jsx";
import Services from "./components/Services.jsx";
import DisasterMapSection from "./components/DisasterMapSection.jsx";
import Team from "./components/Team.jsx";
import Contact from "./components/Contact.jsx";

// 🔐 Auth
import Register from "./components/Register.jsx";
import Login from "./components/Login.jsx";

// 🏗️ Dashboard / Role Pages
import InventoryPage from "./components/InventoryPage.jsx";   // Admin
import VolunteerPage from "./components/VolunteerPage.jsx";   // Volunteer
import RecipientPage from "./components/RecipientPage.jsx";   // Recipient
import ReliefAnalytics from "./components/ReliefAnalytics.jsx"; // Analytics
import EmergencyRequest from "./components/EmergencyRequest.jsx"; // Emergency Request
import EmergencyDashboard from "./components/EmergencyDashboard.jsx"; // Emergency Dashboard
import InventoryIntegration from "./components/InventoryIntegration.jsx"; // Inventory Integration
import RoutingVisualization from "./components/RoutingVisualization.jsx"; // Routing Visualization
import DispatchTracker from "./components/DispatchTracker.jsx"; // Dispatch Tracker
import LiveDisasters from "./components/LiveDisasters.jsx"; // Live Disasters

// 🎨 CSS Imports
import "./css/style.css";
import "./css/Header.css";
import "./css/Hero.css";
import "./css/About.css";
import "./css/Services.css";
import "./css/Team.css";
import "./css/Forms.css";
import "./css/Contact.css";
import "./css/Register.css";
import "./css/Login.css";
import "./css/DisasterMap.css";
import "./css/InventoryPage.css";
import "./css/ReliefAnalytics.css";
import "./css/Emergency.css";
import "./css/InventoryIntegration.css";
import "./css/RoutingVisualization.css";
import "./css/DispatchTracker.css";
import "./css/LiveDisasters.css";

/* 🏠 Home Page Component */
const Home = ({ predictionData, loading, error }) => {
  return (
    <main>
      <Hero />
      <About />
      <Services />
      {loading && <p className="loading-message">Loading map data...</p>}
      {error && <p className="error-message">{error}</p>}
      {!loading && !error && <DisasterMapSection predictionData={predictionData} />}
      <Team />
      <Contact />
    </main>
  );
};

/* 🌍 Main Application Content */
function AppContent() {
  const [predictionData, setPredictionData] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errorData, setErrorData] = useState(null);

  const location = useLocation();

  // 🧠 Fetch disaster prediction data
  useEffect(() => {
    fetch("http://localhost:5000/api/disaster-predictions")
      .then((res) => {
        if (!res.ok) throw new Error("Server error or bad response");
        return res.json();
      })
      .then((data) => {
        setPredictionData(data);
        setLoadingData(false);
        setErrorData(null);
      })
      .catch((err) => {
        console.error("Error fetching disaster prediction data:", err);
        setErrorData(
          "Failed to load disaster prediction data. Ensure backend is running on http://localhost:5000."
        );
        setLoadingData(false);
      });
  }, []);

  // 🎞️ Section animation observer (runs ONLY on home route)
  useEffect(() => {
    if (location.pathname !== "/") return;
    const sections = document.querySelectorAll(".hidden-section");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible-section");
          }
        });
      },
      { threshold: 0.2 }
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [location]);

  return (
    <div className="app-container">
      <Header />
      <Routes>
        {/* Home */}
        <Route
          path="/"
          element={<Home predictionData={predictionData} loading={loadingData} error={errorData} />}
        />

        {/* Auth */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* Admin Dashboard */}
        <Route
          path="/inventory"
          element={
            <>
              <InventoryPage />
              <ReliefAnalytics />
            </>
          }
        />

        {/* Volunteer Dashboard */}
        <Route path="/volunteer" element={<VolunteerPage />} />

        {/* Recipient Dashboard */}
        <Route path="/recipient" element={<RecipientPage />} />

        {/* Analytics (optional standalone) */}
        <Route path="/analytics" element={<ReliefAnalytics />} />

        {/* Emergency System */}
        <Route path="/emergency" element={<EmergencyRequest userId="demo_user_123" />} />
        <Route path="/emergency-dashboard" element={<EmergencyDashboard />} />
        <Route path="/dispatch-tracker" element={<DispatchTracker />} />
        <Route path="/live-disasters" element={<LiveDisasters />} />
        
        {/* Inventory Integration */}
        <Route path="/inventory-live" element={<InventoryIntegration />} />
        
        {/* Routing Visualization */}
        <Route path="/routing" element={<RoutingVisualization />} />
      </Routes>
      <Footer />
    </div>
  );
}

/* 🔑 Root App Component */
export default function App() {
  return (
    <Router>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </Router>
  );
}
