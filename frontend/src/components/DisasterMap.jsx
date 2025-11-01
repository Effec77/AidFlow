import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- CONFIGURATION: Color and Label Mappings ---
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

// --- NEW CONFIGURATION: Keys that indicate presence, not disaster (used for pin color priority) ---
const PRESENCE_KEYS = [
    'bridges_any', 'buildings_any', 'roads_any', 'trees_any', 'water_any'
];

// Fix 1: Clear the default Leaflet icon settings to avoid image path errors
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});
// --------------------------------------------------------------------

/**
 * Determines marker style properties, prioritizing non-presence keys for coloring.
 */
const getMarkerStyle = (predictionData) => {
    // CRITICAL FIX: Ensure predictionData is a valid object to prevent destructuring errors
    const predictions = predictionData && typeof predictionData === 'object' ? predictionData : {};
    
    let maxPrediction = 0;
    let mainDisasterKey = null;

    // ⚠️ MODIFIED LOGIC: Iterate and filter out presence keys when finding the highest prediction.
    for (const [key, value] of Object.entries(predictions)) {
        // Skip keys that only indicate presence
        if (PRESENCE_KEYS.includes(key)) {
            continue; 
        }

        if (value > maxPrediction) {
            maxPrediction = value;
            mainDisasterKey = key;
        }
    }
    
    // Default to 'buildings_affected' if no high damage/hazard prediction was found
    const defaultKey = 'buildings_affected'; 
    const keyToUse = mainDisasterKey || defaultKey; 

    const baseColor = disasterColors[keyToUse] || 'blue'; 
    const leafletColor = 
        baseColor === 'darkred' ? 'red' : 
        baseColor === 'darkgreen' ? 'green' : 
        baseColor === 'darkblue' ? 'blue' : 
        baseColor;

    const iconUrl = `https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${leafletColor}.png`;

    return {
        iconUrl: iconUrl,
        mainDisasterKey: keyToUse,
        mainDisasterLabel: labelMapping[keyToUse] || 'Data Error',
        maxPrediction: maxPrediction
    };
};

const DisasterMap = ({ predictionData = [] }) => {
    const mapRef = useRef(null);
    const markersRef = useRef([]);

    useEffect(() => {
        // --- 1. Map Initialization ---
        if (!mapRef.current) {
            // Set view to a central California location (where your data seems to be)
            const map = L.map('disaster-map-container').setView([37.5, -122.0], 8); 
            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap contributors & CartoDB',
                maxZoom: 19
            }).addTo(map);
            mapRef.current = map;

            // 🌟 CRITICAL FIX: Invalidate size and reset view to ensure visibility 🌟
            setTimeout(() => {
                map.invalidateSize(); 
                map.setView([37.5, -122.0], 8); 
            }, 300); 
        }

        const map = mapRef.current;

        // --- 2. Cleanup and Rendering ---
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        // Grab the table body from the DOM (managed by the parent component)
        const tableBody = document.querySelector("#data-table tbody");
        if (tableBody) {
            tableBody.innerHTML = '';
        }

        if (predictionData.length > 0) {
            let markerGroup = L.featureGroup();

            predictionData.forEach(item => {
                const { latitude, longitude, timestamp, predicted_labels, prediction_data } = item;
                if (isNaN(latitude) || isNaN(longitude)) return;

                const { iconUrl, mainDisasterLabel, maxPrediction, mainDisasterKey } = getMarkerStyle(prediction_data); 

                const customIcon = L.icon({
                    iconUrl: iconUrl,
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                });

                // Create detailed popup content list (only includes labels >= 0.5, filtered by backend)
                const popupDetails = predicted_labels.map(key => {
                    const probability = prediction_data[key].toFixed(4);
                    const label = labelMapping[key] || key;
                    const color = disasterColors[key] || 'black';
                    return `<li style="color:${color};">● ${label}: <strong>${probability}</strong></li>`;
                }).join('');

                const popupContent = `
                    <div style="max-height: 200px; overflow-y: auto;">
                        <b>Location:</b> ${latitude.toFixed(4)}, ${longitude.toFixed(4)}<br/>
                        <b>Time:</b> ${new Date(timestamp).toLocaleString()}<br/>
                        <hr style="margin: 5px 0; border-top: 1px solid #ccc;">
                        <b>Highest Prediction:</b> <span style="color:${disasterColors[mainDisasterKey]}">${mainDisasterLabel}</span> (${maxPrediction.toFixed(4)})<br/>
                        
                        ${predicted_labels.length > 0 ? 
                            `<b>All Predicted Disasters (≥ 0.5):</b>
                            <ul style="margin-top: 5px; padding-left: 20px; list-style-type: none;">
                                ${popupDetails}
                            </ul>` : 
                            '<i>No predictions above 0.5.</i>'}
                    </div>
                `;

                const marker = L.marker([latitude, longitude], { icon: customIcon })
                    .bindPopup(popupContent);
                
                markerGroup.addLayer(marker);
                markersRef.current.push(marker);

                // Add row to table
                if (tableBody) {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${new Date(timestamp).toLocaleTimeString()}</td>
                        <td>${latitude.toFixed(4)}</td>
                        <td>${longitude.toFixed(4)}</td>
                        <td><span style="color: ${disasterColors[mainDisasterKey] || 'gray'};">●</span> ${mainDisasterLabel}</td>
                        <td>${maxPrediction.toFixed(4)}</td>
                    `;
                    row.addEventListener("click", () => {
                        map.setView([latitude, longitude], 12);
                        marker.openPopup();
                    });
                    tableBody.appendChild(row);
                }
            });

            markerGroup.addTo(map);
            if (markerGroup.getLayers().length > 0) {
                map.fitBounds(markerGroup.getBounds(), { padding: [50, 50] });
            }
        }
    }, [predictionData]); 

    return (
        <div 
            id="disaster-map-container" 
            style={{ height: "100%", width: "100%" }}
        ></div>
    );
};

export default DisasterMap;