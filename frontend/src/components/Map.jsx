import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const Map = ({ disasterData = [], loading, error }) => {
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    // Initialize map only once
    if (!mapRef.current) {
      const map = L.map('disaster-map').setView([22.5, 78.9], 5);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors & CartoDB',
        maxZoom: 19
      }).addTo(map);
      mapRef.current = map;
    }

    const map = mapRef.current;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Update table body
    const tableBody = document.querySelector("#data-table tbody");
    if (tableBody) {
      tableBody.innerHTML = '';
    }

    // Add new markers + table rows
    if (disasterData.length > 0) {
      const customIcon = L.icon({
        iconUrl: '/imgs/disaster_pin.png', // ✅ make sure this file is inside `public/imgs/`
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
      });

      disasterData.forEach(item => {
        const { latitude, longitude, timestamp, predicted_labels } = item;
        if (!latitude || !longitude) return;

        const readableLabels = predicted_labels?.map(label =>
          label.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
        ) || [];

        const popupContent = `
          <b>Time:</b> ${new Date(timestamp).toLocaleString()}<br/>
          <b>Labels:</b> ${readableLabels.join(", ")}
        `;

        const marker = L.marker([latitude, longitude], { icon: customIcon })
          .addTo(map)
          .bindPopup(popupContent);

        markersRef.current.push(marker);

        // Add row to table
        if (tableBody) {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${new Date(timestamp).toLocaleString()}</td>
            <td>${latitude.toFixed(2)}</td>
            <td>${longitude.toFixed(2)}</td>
            <td>${readableLabels.join(", ")}</td>
          `;
          row.addEventListener("click", () => {
            map.setView([latitude, longitude], 10);
            marker.openPopup();
          });
          tableBody.appendChild(row);
        }
      });
    }
  }, [disasterData]);

  if (loading) return <p>Loading map data...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <section id="map" className="map-section hidden-section">
      <div className="map-container">
        <div id="disaster-map" style={{ height: "600px", width: "100%" }}></div>
        <div id="data-table-container">
          <h3>Disaster Data</h3>
          <table id="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>Labels</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default Map;
