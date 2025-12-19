import React, { useState, useEffect, useContext } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import { Navigation, AlertTriangle, Clock, MapPin, Route } from 'lucide-react';
import { UserContext } from './UserContext';
import { createAuthenticatedAxios } from '../utils/api';
import 'leaflet/dist/leaflet.css';

/**
 * Routing Visualization Component
 * Shows real-time routing with disaster zone avoidance
 */
const RoutingVisualization = () => {
    const { token } = useContext(UserContext);
    const [originLat, setOriginLat] = useState(30.7171);
    const [originLon, setOriginLon] = useState(76.8537);
    const [originName, setOriginName] = useState(''); // Initialize as empty

    const [destinationLat, setDestinationLat] = useState(30.7200);
    const [destinationLon, setDestinationLon] = useState(76.8600);
    const [destinationName, setDestinationName] = useState(''); // Initialize as empty

    const [route, setRoute] = useState(null);
    const [loading, setLoading] = useState(false);
    const [disasterZones, setDisasterZones] = useState([]);
    const [error, setError] = useState(null);
    const [mapKey, setMapKey] = useState(0); // Force map re-render

    useEffect(() => {
        if (token) {
            fetchDisasterZones();
        }
    }, [token]);

    const fetchDisasterZones = async () => {
        try {
            const api = createAuthenticatedAxios(token);
            const response = await api.get('/api/agents/disaster-zones?status=active');
            setDisasterZones(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch disaster zones:', error);
        }
    };

    const getCurrentLocation = (type) => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                if (type === 'origin') {
                    setOriginLat(position.coords.latitude);
                    setOriginLon(position.coords.longitude);
                    setOriginName('');
                } else {
                    setDestinationLat(position.coords.latitude);
                    setDestinationLon(position.coords.longitude);
                    setDestinationName('');
                }
            },
            (error) => {
                alert('Unable to get location: ' + error.message);
            }
        );
    };

    const calculateRoute = async () => {
        setLoading(true);
        setError(null);
        
        try {
            let originToSend = {};
            if (originName.trim() !== '') { // Check if originName is not empty
                originToSend = { name: originName.trim() };
            } else {
                originToSend = { lat: originLat, lon: originLon };
            }

            let destinationToSend = {};
            if (destinationName.trim() !== '') { // Check if destinationName is not empty
                destinationToSend = { name: destinationName.trim() };
            } else {
                destinationToSend = { lat: destinationLat, lon: destinationLon };
            }

            const api = createAuthenticatedAxios(token);
            const response = await api.post('/api/agents/calculate-route', {
                origin: originToSend,
                destination: destinationToSend,
                options: {
                    requestType: 'emergency_response',
                    severity: 'high'
                }
            });

            if (response.data.success) {
                console.log('✅ Route received:', response.data);
                console.log('📍 Waypoints count:', response.data.route?.waypoints?.length);
                console.log('🗺️ First 5 waypoints:', response.data.route?.waypoints?.slice(0, 5));
                console.log('🗺️ Last 5 waypoints:', response.data.route?.waypoints?.slice(-5));
                
                // Verify waypoint format
                if (response.data.route?.waypoints?.length > 0) {
                    const firstWp = response.data.route.waypoints[0];
                    console.log('📍 Waypoint format check:', firstWp, 'has lat?', !!firstWp.lat, 'has lon?', !!firstWp.lon);
                }
                
                setRoute(response.data);
                // Update coordinate states based on the geocoded response from the backend
                if (response.data.route.origin) {
                    setOriginLat(response.data.route.origin.lat);
                    setOriginLon(response.data.route.origin.lon);
                    setOriginName(response.data.route.origin.name);
                }
                if (response.data.route.destination) {
                    setDestinationLat(response.data.route.destination.lat);
                    setDestinationLon(response.data.route.destination.lon);
                    setDestinationName(response.data.route.destination.name);
                }

                setMapKey(prev => prev + 1); // Force map update
            } else {
                setError(response.data.error || 'Route calculation failed');
            }
        } catch (error) {
            setError('Failed to calculate route: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return '#dc2626';
            case 'high': return '#ea580c';
            case 'medium': return '#f59e0b';
            case 'low': return '#84cc16';
            default: return '#6b7280';
        }
    };

    const center = [
        (originLat + destinationLat) / 2,
        (originLon + destinationLon) / 2
    ];

    return (
        <div className="routing-visualization">
            <div className="routing-header">
                <h2><Navigation className="header-icon" /> Smart Routing System</h2>
                <p>AI-powered routing with disaster zone avoidance</p>
            </div>

            <div className="routing-controls">
                <div className="location-inputs">
                    <div className="input-group">
                        <div className="input-header">
                            <label>Origin (Place Name or Latitude)</label>
                            <button
                                className="location-picker-btn"
                                onClick={() => getCurrentLocation('origin')}
                                title="Use current location as origin"
                            >
                                <MapPin size={16} />
                                Use My Location
                            </button>
                        </div>
                        <input
                            type="text"
                            value={originName}
                            onChange={(e) => setOriginName(e.target.value)}
                            placeholder="e.g., Response Center, New York"
                        />
                        <div className="coordinate-inputs">
                            <input
                                type="number"
                                step="0.0001"
                                value={originLat}
                                onChange={(e) => setOriginLat(parseFloat(e.target.value))}
                                placeholder="Latitude"
                                disabled={!!originName}
                            />
                            <input
                                type="number"
                                step="0.0001"
                                value={originLon}
                                onChange={(e) => setOriginLon(parseFloat(e.target.value))}
                                placeholder="Longitude"
                                disabled={!!originName}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <div className="input-header">
                            <label>Destination (Place Name or Latitude)</label>
                            <button
                                className="location-picker-btn"
                                onClick={() => getCurrentLocation('destination')}
                                title="Use current location as destination"
                            >
                                <MapPin size={16} />
                                Use My Location
                            </button>
                        </div>
                        <input
                            type="text"
                            value={destinationName}
                            onChange={(e) => setDestinationName(e.target.value)}
                            placeholder="e.g., Emergency Location, Los Angeles"
                        />
                        <div className="coordinate-inputs">
                            <input
                                type="number"
                                step="0.0001"
                                value={destinationLat}
                                onChange={(e) => setDestinationLat(parseFloat(e.target.value))}
                                placeholder="Latitude"
                                disabled={!!destinationName}
                            />
                            <input
                                type="number"
                                step="0.0001"
                                value={destinationLon}
                                onChange={(e) => setDestinationLon(parseFloat(e.target.value))}
                                placeholder="Longitude"
                                disabled={!!destinationName}
                            />
                        </div>
                    </div>
                </div>

                <button 
                    className={`calculate-route-btn ${loading ? 'loading' : ''}`}
                    onClick={calculateRoute}
                    disabled={loading}
                >
                    {loading ? 'Calculating...' : 'Calculate Optimal Route'}
                </button>
            </div>

            {error && (
                <div className="error-message">
                    <AlertTriangle /> {error}
                </div>
            )}

            {route && (
                <div className="route-info">
                    <div className="info-card">
                        <Route className="info-icon" />
                        <div>
                            <span className="info-label">Distance</span>
                            <span className="info-value">{route.route.distance.toFixed(2)} km</span>
                        </div>
                    </div>
                    <div className="info-card">
                        <Clock className="info-icon" />
                        <div>
                            <span className="info-label">Duration</span>
                            <span className="info-value">{Math.round(route.route.duration)} min</span>
                        </div>
                    </div>
                    <div className="info-card">
                        <MapPin className="info-icon" />
                        <div>
                            <span className="info-label">ETA</span>
                            <span className="info-value">
                                {new Date(route.route.eta).toLocaleTimeString()}
                            </span>
                        </div>
                    </div>
                    <div className="info-card">
                        <Navigation className="info-icon" />
                        <div>
                            <span className="info-label">Waypoints</span>
                            <span className="info-value">{route.route.waypoints?.length || 0} points</span>
                        </div>
                    </div>
                    {route.route.warnings && route.route.warnings.length > 0 && (
                        <div className="info-card warning">
                            <AlertTriangle className="info-icon" />
                            <div>
                                <span className="info-label">Warnings</span>
                                <span className="info-value">{route.route.warnings.join(', ')}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="map-container">
                <MapContainer 
                    key={mapKey}
                    center={center} 
                    zoom={13} 
                    style={{ height: '500px', width: '100%' }}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />

                    {/* Origin Marker */}
                    <Marker position={[originLat, originLon]}>
                        <Popup>
                            <strong>Origin</strong><br />
                            {originName || 'Response Center'}<br />
                            {originLat.toFixed(4)}, {originLon.toFixed(4)}
                        </Popup>
                    </Marker>

                    {/* Destination Marker */}
                    <Marker position={[destinationLat, destinationLon]}>
                        <Popup>
                            <strong>Destination</strong><br />
                            {destinationName || 'Emergency Location'}<br />
                            {destinationLat.toFixed(4)}, {destinationLon.toFixed(4)}
                        </Popup>
                    </Marker>

                    {/* Disaster Zones */}
                    {disasterZones.map((zone) => (
                        <Circle
                            key={zone.zoneId}
                            center={[zone.location.center.lat, zone.location.center.lon]}
                            radius={zone.location.radius * 1000} // Convert km to meters
                            pathOptions={{
                                color: getSeverityColor(zone.severity),
                                fillColor: getSeverityColor(zone.severity),
                                fillOpacity: 0.2
                            }}
                        >
                            <Popup>
                                <strong>{zone.name}</strong><br />
                                Type: {zone.disasterType}<br />
                                Severity: {zone.severity}<br />
                                Status: {zone.status}
                            </Popup>
                        </Circle>
                    ))}

                    {/* Route Polyline */}
                    {route && route.route.waypoints && route.route.waypoints.length > 0 && (
                        <>
                            <Polyline
                                positions={route.route.waypoints.map(wp => [wp.lat, wp.lon])}
                                pathOptions={{ 
                                    color: '#3b82f6', 
                                    weight: 4,
                                    opacity: 0.8,
                                    smoothFactor: 1
                                }}
                            />
                            {console.log('🗺️ Rendering polyline with', route.route.waypoints.length, 'waypoints')}
                            {console.log('🗺️ Polyline positions:', route.route.waypoints.slice(0, 3).map(wp => [wp.lat, wp.lon]))}
                            
                            {/* Debug: Show waypoint markers (every 10th point) */}
                            {route.route.waypoints.filter((_, idx) => idx % 10 === 0).map((wp, idx) => (
                                <Circle
                                    key={`waypoint-${idx}`}
                                    center={[wp.lat, wp.lon]}
                                    radius={20}
                                    pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.6 }}
                                />
                            ))}
                        </>
                    )}
                </MapContainer>
            </div>

            <div className="routing-legend">
                <h3>Legend</h3>
                <div className="legend-items">
                    <div className="legend-item">
                        <div className="legend-color" style={{ background: '#3b82f6' }}></div>
                        <span>Optimal Route</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color" style={{ background: '#dc2626' }}></div>
                        <span>Critical Disaster Zone</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color" style={{ background: '#ea580c' }}></div>
                        <span>High Severity Zone</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color" style={{ background: '#f59e0b' }}></div>
                        <span>Medium Severity Zone</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoutingVisualization;