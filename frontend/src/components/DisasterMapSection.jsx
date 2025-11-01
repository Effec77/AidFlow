import React, { useState } from 'react'; 
import DisasterMap from './DisasterMap'; 
import '../css/DisasterMap.css';

// --- CONFIGURATION: Color and Label Mappings (Kept for consistency) ---
const disasterColors = {
    "bridges_any": "purple",
    "bridges_damage": "darkblue",
    "buildings_affected": "orange",
    "buildings_any": "gold",
    "buildings_destroyed": "red",
    "buildings_major": "darkred",
    "buildings_minor": "pink",
    "debris_any": "brown",
    "flooding_any": "blue",
    "flooding_structures": "darkblue",
    "roads_any": "gray",
    "roads_damage": "black",
    "trees_any": "green",
    "trees_damage": "darkgreen",
    "water_any": "cyan"
};

const labelMapping = {
    "bridges_any": "Bridges",
    "bridges_damage": "Bridges Damage",
    "buildings_affected": "Buildings Affected",
    "buildings_any": "Buildings",
    "buildings_destroyed": "Buildings Destroyed",
    "buildings_major": "Buildings Major",
    "buildings_minor": "Buildings Minor",
    "debris_any": "Debris",
    "flooding_any": "Flooding",
    "flooding_structures": "Flooding Structures",
    "roads_any": "Roads",
    "roads_damage": "Roads Damage",
    "trees_any": "Trees",
    "trees_damage": "Trees Damage",
    "water_any": "Water"
};


const DisasterMapSection = ({ predictionData }) => {
    // State to toggle data sidebar visibility (starts hidden)
    const [isDataPanelOpen, setIsDataPanelOpen] = useState(false);

    return (
        <section className="disaster-map-section">
            <h2>Disaster Prediction Map</h2>
            <p>This map shows predicted disaster locations (confidence ≥ 50%). Marker color indicates the most probable damage type.</p>

            <div className="map-and-data-container">

                {/* 1. Map Container */}
                <div className="map-wrapper" style={{ flex: '2', height: '600px', position: 'relative' }}>
                    
                    {/* Toggle Button for Data Panel */}
                    <button 
                        className={`toggle-data-btn ${isDataPanelOpen ? 'active' : ''}`}
                        onClick={() => setIsDataPanelOpen(!isDataPanelOpen)}
                    >
                        {isDataPanelOpen ? 'Hide Data Panel' : 'Show Data Panel'}
                    </button>
                    
                    {/* ⚠️ LEGEND BOX HAS BEEN REMOVED FROM HERE ⚠️ */}

                    <DisasterMap predictionData={predictionData} />
                </div>

                {/* 2. Data Panel (Sliding Table) */}
                <div className={`data-sidebar ${isDataPanelOpen ? 'open' : ''}`}>
                    
                    <div id="data-table-container">
                        <h3>Disaster Data Points</h3>
                        <table id="data-table">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Lat</th>
                                    <th>Lon</th>
                                    <th>Main Label</th>
                                    <th>Prob.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Rows populated by DisasterMap.jsx */}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default DisasterMapSection;