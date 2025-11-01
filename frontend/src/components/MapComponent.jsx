import React, { useState, useEffect } from 'react';
import "leaflet/dist/leaflet.css";
import L from 'leaflet';

// Create a custom icon for fire and other events, overriding the default blue marker
const fireIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const defaultIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const greenIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const Map = ({ fireData }) => {
  const [map, setMap] = useState(null);
  const [routeLayer, setRouteLayer] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [startCoords, setStartCoords] = useState('');
  const [endCoords, setEndCoords] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Initial map setup
  useEffect(() => {
    if (map) return; // Prevent re-initializing the map

    const initialMap = L.map('map').setView([20.5937, 78.9629], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(initialMap);
    setMap(initialMap);

    return () => {
      if (initialMap) {
        initialMap.remove();
      }
    };
  }, [map]);

  // Add fire data markers to the map
  useEffect(() => {
    if (!map) return;
    
    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    const newMarkers = [];

    fireData.forEach(fire => {
      const marker = L.marker([fire.latitude, fire.longitude], { icon: fireIcon }).addTo(map);
      marker.bindPopup(`<b>Fire Detected!</b><br>Magnitude: ${fire.magnitude}`).openPopup();
      newMarkers.push(marker);
    });

    setMarkers(newMarkers);
  }, [map, fireData]);

  // Handle route optimization
  const handleRouteOptimization = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const [startLon, startLat] = startCoords.split(',').map(Number);
      const [endLon, endLat] = endCoords.split(',').map(Number);
      
      if (isNaN(startLon) || isNaN(startLat) || isNaN(endLon) || isNaN(endLat)) {
        throw new Error('Invalid coordinates. Please use format: longitude,latitude');
      }

      const response = await fetch('http://localhost:5001/api/route_optimizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start: [startLon, startLat], end: [endLon, endLat] })
      });
      
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to optimize route.');
      }

      // Clear previous route
      if (routeLayer) {
        map.removeLayer(routeLayer);
      }

      const bestRoute = result.routes[0];
      const routeCoords = bestRoute.route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
      const newRouteLayer = L.polyline(routeCoords, { color: 'blue' }).addTo(map);
      setRouteLayer(newRouteLayer);

      // Fit map to the route
      map.fitBounds(newRouteLayer.getBounds());

      // Add start and end markers
      markers.forEach(marker => map.removeLayer(marker));
      const newMarkers = [];
      const startMarker = L.marker([startLat, startLon], { icon: greenIcon }).addTo(map);
      startMarker.bindPopup("<b>Start Location</b>").openPopup();
      newMarkers.push(startMarker);

      const endMarker = L.marker([endLat, endLon], { icon: defaultIcon }).addTo(map);
      endMarker.bindPopup("<b>End Location</b>").openPopup();
      newMarkers.push(endMarker);
      
      setMarkers(newMarkers);

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div id="map" className="w-full h-[600px] rounded-xl shadow-lg border border-text-color border-opacity-20 mb-6"></div>
      
      {/* Route Optimization UI */}
      <div className="w-full max-w-xl bg-card-bg p-6 rounded-xl shadow-lg border border-text-color border-opacity-20 space-y-4">
        <h3 className="text-xl font-bold text-heading-color text-center">Route Optimization</h3>
        <p className="text-sm text-text-color text-opacity-70 text-center">Find the safest and fastest route, avoiding disaster zones.</p>
        
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium">Start Coordinates (lon,lat)</label>
          <input
            type="text"
            value={startCoords}
            onChange={(e) => setStartCoords(e.target.value)}
            className="w-full p-2 rounded-md bg-transparent border border-text-color border-opacity-20 text-text-color focus:outline-none focus:ring-1 focus:ring-accent-color"
            placeholder="e.g., 77.1734,31.1048"
          />
        </div>
        
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium">End Coordinates (lon,lat)</label>
          <input
            type="text"
            value={endCoords}
            onChange={(e) => setEndCoords(e.target.value)}
            className="w-full p-2 rounded-md bg-transparent border border-text-color border-opacity-20 text-text-color focus:outline-none focus:ring-1 focus:ring-accent-color"
            placeholder="e.g., 72.8777,19.0760"
          />
        </div>
        
        {error && <div className="text-sm text-red-500 text-center">{error}</div>}
        
        <button
          onClick={handleRouteOptimization}
          disabled={isLoading}
          className="w-full py-2 rounded-md bg-button-bg text-white font-medium transition-colors hover:bg-button-hover-bg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Optimizing...' : 'Find Best Route'}
        </button>
      </div>
    </div>
  );
};

export default Map;
