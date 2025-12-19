import React, { useState, useEffect, useContext } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import { Truck, MapPin, Clock, Package, Navigation, Activity, AlertCircle } from 'lucide-react';
import { UserContext } from './UserContext';
import { createAuthenticatedAxios } from '../utils/api';
import 'leaflet/dist/leaflet.css';
import '../css/DispatchTracker.css';

/**
 * Real-Time Dispatch Tracking Dashboard
 * Shows all active dispatches on a map with live updates
 */
const DispatchTracker = () => {
    const { token } = useContext(UserContext);
    // State
    const [activeDispatches, setActiveDispatches] = useState([]);
    const [selectedDispatch, setSelectedDispatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mapCenter, setMapCenter] = useState([30.7171, 76.8537]); // Default: Chandigarh

    // Simulation State
    const [simulatedPositions, setSimulatedPositions] = useState({});

    // Demo Data for Realistic Simulation
    const DEMO_DISPATCHES = [
        {
            emergencyId: "EMG-2023-001",
            status: "en_route",
            location: { lat: 30.7333, lon: 76.7794, address: "Sector 17 Plaza, Chandigarh" },
            aiAnalysis: { severity: "critical", disaster: { type: "Fire" } },
            dispatchDetails: {
                dispatchedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
                estimatedArrival: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 mins from now
                centers: [
                    {
                        centerName: "Chandigarh Fire Station HQ",
                        resources: [{ name: "Fire Truck", quantity: 2, unit: "units" }, { name: "Paramedics", quantity: 4, unit: "personnel" }],
                        route: {
                            distance: 5.2,
                            duration: 12,
                            waypoints: [
                                { lat: 30.7046, lon: 76.7179 }, // Start
                                { lat: 30.7100, lon: 76.7300 },
                                { lat: 30.7200, lon: 76.7500 },
                                { lat: 30.7333, lon: 76.7794 }  // End
                            ]
                        }
                    }
                ]
            }
        },
        {
            emergencyId: "EMG-2023-002",
            status: "dispatched",
            location: { lat: 30.7046, lon: 76.7179, address: "Mohali Stadium, SAS Nagar" },
            aiAnalysis: { severity: "high", disaster: { type: "Medical Emergency" } },
            dispatchDetails: {
                dispatchedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
                estimatedArrival: new Date(Date.now() + 1000 * 60 * 20).toISOString(),
                centers: [
                    {
                        centerName: "Fortis Hospital Ambulance",
                        resources: [{ name: "ICU Ambulance", quantity: 1, unit: "unit" }],
                        route: {
                            distance: 8.5,
                            duration: 25,
                            waypoints: [
                                { lat: 30.6425, lon: 76.8173 }, // Start
                                { lat: 30.6700, lon: 76.7500 },
                                { lat: 30.7046, lon: 76.7179 }  // End
                            ]
                        }
                    }
                ]
            }
        }
    ];

    useEffect(() => {
        // Start simulation loop for movement
        const moveInterval = setInterval(() => {
            setSimulatedPositions(prev => {
                const newPositions = { ...prev };

                // Animate demo trucks
                DEMO_DISPATCHES.forEach(dispatch => {
                    if (dispatch.status === 'en_route') {
                        const waypoints = dispatch.dispatchDetails.centers[0].route.waypoints;
                        const id = dispatch.emergencyId;

                        // Simple linear interpolation simulation
                        let currentIdx = newPositions[id]?.idx || 0;
                        let progress = newPositions[id]?.progress || 0;

                        progress += 0.05; // Speed

                        if (progress >= 1 && currentIdx < waypoints.length - 1) {
                            currentIdx++;
                            progress = 0;
                        }

                        // Calculate lat/lon
                        const p1 = waypoints[currentIdx];
                        const p2 = waypoints[currentIdx + 1] || p1; // Stay at end

                        const lat = p1.lat + (p2.lat - p1.lat) * progress;
                        const lon = p1.lon + (p2.lon - p1.lon) * progress;

                        newPositions[id] = { lat, lon, idx: currentIdx, progress };
                    }
                });
                return newPositions;
            });
        }, 100); // 10fps smooth animation

        return () => clearInterval(moveInterval);
    }, []);

    useEffect(() => {
        // Initial Fetch
        fetchActiveDispatches();

        // Polling
        const interval = setInterval(fetchActiveDispatches, 10000);
        return () => clearInterval(interval);
    }, [token]);

    const fetchActiveDispatches = async () => {
        try {
            setLoading(true);
            const api = createAuthenticatedAxios(token);
            const response = await api.get('/api/emergency/active-dispatches');

            if (response.data.dispatches && response.data.dispatches.length > 0) {
                setActiveDispatches(response.data.dispatches);
            } else {
                // FALLBACK TO REALISTIC DEMO DATA
                setActiveDispatches(DEMO_DISPATCHES);
            }
            setLoading(false);
        } catch (error) {
            console.warn('Using Demo Data due to fetch error');
            setActiveDispatches(DEMO_DISPATCHES);
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'dispatched': '#F59E0B',
            'en_route': '#3B82F6',
            'delivered': '#10B981',
            'completed': '#059669'
        };
        return colors[status] || '#6B7280';
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'dispatched': return <Package className="status-icon" />;
            case 'en_route': return <Truck className="status-icon" />;
            case 'delivered': return <MapPin className="status-icon" />;
            case 'completed': return <Activity className="status-icon" />;
            default: return <AlertCircle className="status-icon" />;
        }
    };

    const calculateProgress = (dispatch) => {
        // If completed, return 100%
        if (dispatch.status === 'completed' || dispatch.status === 'delivered') {
            return 100;
        }

        if (!dispatch.dispatchDetails) return 0;

        const dispatchedTime = new Date(dispatch.dispatchDetails.dispatchedAt).getTime();
        const estimatedArrival = new Date(dispatch.dispatchDetails.estimatedArrival).getTime();
        const now = Date.now();

        // If already past ETA, return 100%
        if (now >= estimatedArrival) {
            return 100;
        }

        const totalTime = estimatedArrival - dispatchedTime;
        const elapsed = now - dispatchedTime;

        // Ensure we have valid times
        if (totalTime <= 0) return 0;

        const progress = Math.min(Math.max((elapsed / totalTime) * 100, 0), 100);
        return Math.round(progress);
    };

    const getTimeRemaining = (dispatch) => {
        // If completed, show completion status
        if (dispatch.status === 'completed') {
            return 'Completed';
        }
        if (dispatch.status === 'delivered') {
            return 'Delivered';
        }

        if (!dispatch.dispatchDetails) return 'N/A';

        const estimatedArrival = new Date(dispatch.dispatchDetails.estimatedArrival).getTime();
        const now = Date.now();
        const remaining = estimatedArrival - now;

        if (remaining <= 0) return 'Arrived';

        const minutes = Math.floor(remaining / 60000);
        if (minutes < 60) return `${minutes} min`;

        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    if (loading) {
        return (
            <div className="dispatch-tracker loading">
                <div className="spinner-large" />
                <p>Loading dispatch tracking...</p>
            </div>
        );
    }

    return (
        <div className="dispatch-tracker">
            <div className="tracker-header">
                <div className="header-content">
                    <Navigation className="header-icon" />
                    <div>
                        <h2>Live Dispatch Tracking</h2>
                        <p>Real-time monitoring of all active emergency dispatches</p>
                    </div>
                </div>
                <div className="stats-bar">
                    <div className="stat">
                        <span className="stat-value">{activeDispatches.length}</span>
                        <span className="stat-label">Active Dispatches</span>
                    </div>
                    <div className="stat">
                        <span className="stat-value">
                            {activeDispatches.filter(d => d.status === 'en_route').length}
                        </span>
                        <span className="stat-label">En Route</span>
                    </div>
                    <div className="stat">
                        <span className="stat-value">
                            {activeDispatches.filter(d => d.status === 'dispatched').length}
                        </span>
                        <span className="stat-label">Just Dispatched</span>
                    </div>
                </div>
            </div>

            <div className="tracker-content">
                {/* Dispatch List Sidebar */}
                <div className="dispatch-list" style={{ display: selectedDispatch ? 'none' : 'block' }}>
                    <h3>Active Dispatches</h3>

                    {activeDispatches.length === 0 ? (
                        <div className="no-dispatches">
                            <Package className="empty-icon" />
                            <p>No active dispatches</p>
                        </div>
                    ) : (
                        activeDispatches.map((dispatch) => (
                            <div
                                key={dispatch.emergencyId}
                                className={`dispatch-card ${selectedDispatch?.emergencyId === dispatch.emergencyId ? 'selected' : ''}`}
                                onClick={() => {
                                    setSelectedDispatch(dispatch);
                                    setMapCenter([dispatch.location.lat, dispatch.location.lon]);
                                }}
                            >
                                <div className="dispatch-card-header">
                                    <div className="dispatch-id">
                                        {dispatch.emergencyId}
                                        <div className="dispatch-type">
                                            {dispatch.aiAnalysis?.severity === 'high' || dispatch.aiAnalysis?.severity === 'critical' ? (
                                                <span className="auto-dispatch">🤖 Auto</span>
                                            ) : (
                                                <span className="manual-dispatch">👤 Manual</span>
                                            )}
                                        </div>
                                    </div>
                                    <div
                                        className="status-badge"
                                        style={{ backgroundColor: getStatusColor(dispatch.status) }}
                                    >
                                        {getStatusIcon(dispatch.status)}
                                        {dispatch.status}
                                    </div>
                                </div>

                                <div className="dispatch-info">
                                    <div className="info-item">
                                        <MapPin className="info-icon" />
                                        <span>
                                            {dispatch.location.address ||
                                                `${dispatch.location.lat.toFixed(4)}, ${dispatch.location.lon.toFixed(4)}`}
                                        </span>
                                    </div>

                                    <div className="info-item">
                                        <Clock className="info-icon" />
                                        <span>ETA: {getTimeRemaining(dispatch)}</span>
                                    </div>

                                    {dispatch.dispatchDetails && (
                                        <div className="info-item">
                                            <Package className="info-icon" />
                                            <span>
                                                {dispatch.dispatchDetails.centers?.length || 0} centers dispatched
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Progress Bar */}
                                <div className="progress-container">
                                    <div
                                        className="progress-bar"
                                        style={{
                                            width: `${calculateProgress(dispatch)}%`,
                                            backgroundColor: getStatusColor(dispatch.status)
                                        }}
                                    />
                                </div>
                                <div className="progress-label">
                                    {calculateProgress(dispatch)}% Complete
                                </div>

                                {/* Action Buttons */}
                                <div className="dispatch-actions">
                                    {dispatch.status === 'dispatched' && (
                                        <button
                                            className="action-btn enroute-btn"
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                try {
                                                    const api = createAuthenticatedAxios(token);
                                                    await api.put(`/api/emergency/update-status/${dispatch.emergencyId}`, {
                                                        status: 'en_route',
                                                        notes: 'Resources en route to location',
                                                        updatedBy: 'admin'
                                                    });
                                                    fetchActiveDispatches();
                                                } catch (error) {
                                                    console.error('Failed to update status:', error);
                                                }
                                            }}
                                        >
                                            🚗 Mark En Route
                                        </button>
                                    )}
                                    {dispatch.status === 'en_route' && (
                                        <button
                                            className="action-btn complete-btn"
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                try {
                                                    const api = createAuthenticatedAxios(token);
                                                    await api.put(`/api/emergency/complete/${dispatch.emergencyId}`, {
                                                        deliveryNotes: 'Resources delivered successfully',
                                                        completedBy: 'admin'
                                                    });
                                                    fetchActiveDispatches();
                                                } catch (error) {
                                                    console.error('Failed to complete:', error);
                                                }
                                            }}
                                        >
                                            ✓ Mark Complete
                                        </button>
                                    )}
                                    {dispatch.status === 'completed' && (
                                        <button
                                            className="action-btn delete-btn"
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (window.confirm('Delete this completed dispatch?')) {
                                                    try {
                                                        const api = createAuthenticatedAxios(token);
                                                        await api.delete(`/api/emergency/${dispatch.emergencyId}`);
                                                        fetchActiveDispatches();
                                                    } catch (error) {
                                                        console.error('Failed to delete:', error);
                                                    }
                                                }
                                            }}
                                        >
                                            🗑️ Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Map View */}
                <div className="map-view">
                    <MapContainer
                        center={mapCenter}
                        zoom={12}
                        style={{ height: '100%', width: '100%' }}
                    >
                        {/* Dark Matter Tiles for Realistic Ops Center Look */}
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        />

                        {/* Plot all active dispatches */}
                        {activeDispatches.map((dispatch) => (
                            <React.Fragment key={dispatch.emergencyId}>
                                {/* Emergency Location Marker (Destination) */}
                                <Marker position={[dispatch.location.lat, dispatch.location.lon]}>
                                    <Popup>
                                        <div className="map-popup">
                                            <strong>{dispatch.emergencyId}</strong>
                                            <p>Status: {dispatch.status}</p>
                                            <p>Type: {dispatch.aiAnalysis?.disaster?.type}</p>
                                            <p>Severity: {dispatch.aiAnalysis?.severity}</p>
                                        </div>
                                    </Popup>
                                </Marker>

                                {/* Emergency Zone Circle */}
                                <Circle
                                    center={[dispatch.location.lat, dispatch.location.lon]}
                                    radius={500}
                                    pathOptions={{
                                        color: getStatusColor(dispatch.status),
                                        fillColor: getStatusColor(dispatch.status),
                                        fillOpacity: 0.2
                                    }}
                                />

                                {/* Simulated Moving Vehicle Marker */}
                                {dispatch.status === 'en_route' && simulatedPositions[dispatch.emergencyId] && (
                                    <Circle
                                        center={[
                                            simulatedPositions[dispatch.emergencyId].lat,
                                            simulatedPositions[dispatch.emergencyId].lon
                                        ]}
                                        radius={100}
                                        pathOptions={{
                                            color: '#FFFF00', // Bright Yellow
                                            fillColor: '#FFFF00',
                                            fillOpacity: 0.8,
                                            weight: 2
                                        }}
                                    >
                                        <Popup>
                                            <div className="map-popup">
                                                <strong>Response Unit #1</strong>
                                                <p>En Route to Target</p>
                                                <p>Speed: 45 km/h</p>
                                            </div>
                                        </Popup>
                                    </Circle>
                                )}

                                {/* Routes from each dispatch center */}
                                {dispatch.dispatchDetails?.centers?.map((center, idx) => (
                                    <React.Fragment key={`${dispatch.emergencyId}-${idx}`}>
                                        {/* Center Marker (Origin) */}
                                        {center.route?.waypoints && center.route.waypoints.length > 0 && (
                                            <>
                                                <Marker
                                                    position={[
                                                        center.route.waypoints[0].lat,
                                                        center.route.waypoints[0].lon
                                                    ]}
                                                >
                                                    <Popup>
                                                        <div className="map-popup">
                                                            <strong>{center.centerName}</strong>
                                                            <p>Distance: {center.route.distance?.toFixed(2)} km</p>
                                                            <p>Duration: {Math.round(center.route.duration)} min</p>
                                                        </div>
                                                    </Popup>
                                                </Marker>

                                                {/* Route Polyline */}
                                                <Polyline
                                                    positions={center.route.waypoints.map(wp => [wp.lat, wp.lon])}
                                                    pathOptions={{
                                                        color: getStatusColor(dispatch.status),
                                                        weight: 3,
                                                        opacity: 0.6,
                                                        dashArray: dispatch.status === 'dispatched' ? '10, 10' : null
                                                    }}
                                                />
                                            </>
                                        )}
                                    </React.Fragment>
                                ))}
                            </React.Fragment>
                        ))}
                    </MapContainer>

                    {/* Map Legend */}
                    <div className="map-legend">
                        <h4>Legend</h4>
                        <div className="legend-item">
                            <div className="legend-marker" style={{ backgroundColor: '#F59E0B' }} />
                            <span>Dispatched</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-marker" style={{ backgroundColor: '#3B82F6' }} />
                            <span>En Route</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-marker" style={{ backgroundColor: '#10B981' }} />
                            <span>Delivered</span>
                        </div>
                    </div>
                </div>

                {/* Detailed View Panel */}
                {selectedDispatch && (
                    <div className={`detail-panel ${selectedDispatch ? 'active' : ''}`}>
                        <div className="panel-header">
                            <h3>Dispatch Details</h3>
                            <button
                                className="close-panel"
                                onClick={() => setSelectedDispatch(null)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="panel-content">
                            <div className="detail-section">
                                <h4>Emergency Information</h4>
                                <p><strong>ID:</strong> {selectedDispatch.emergencyId}</p>
                                <p><strong>Type:</strong> {selectedDispatch.aiAnalysis?.disaster?.type}</p>
                                <p><strong>Severity:</strong> {selectedDispatch.aiAnalysis?.severity}</p>
                                <p><strong>Message:</strong> "{selectedDispatch.userMessage}"</p>
                            </div>

                            {selectedDispatch.dispatchDetails && (
                                <>
                                    <div className="detail-section">
                                        <h4>Dispatch Status</h4>
                                        <p><strong>Dispatched:</strong> {new Date(selectedDispatch.dispatchDetails.dispatchedAt).toLocaleString()}</p>
                                        <p><strong>ETA:</strong> {new Date(selectedDispatch.dispatchDetails.estimatedArrival).toLocaleTimeString()}</p>
                                        <p><strong>Time Remaining:</strong> {getTimeRemaining(selectedDispatch)}</p>
                                        <p><strong>Progress:</strong> {calculateProgress(selectedDispatch)}%</p>
                                    </div>

                                    <div className="detail-section">
                                        <h4>Response Centers ({selectedDispatch.dispatchDetails.centers?.length || 0})</h4>
                                        {selectedDispatch.dispatchDetails.centers?.map((center, idx) => (
                                            <div key={idx} className="center-detail">
                                                <strong>{center.centerName}</strong>
                                                <p>Distance: {center.route?.distance?.toFixed(2)} km</p>
                                                <p>Duration: {Math.round(center.route?.duration)} min</p>
                                                <div className="resources-mini">
                                                    <strong>Resources:</strong>
                                                    <ul>
                                                        {center.resources?.map((resource, ridx) => (
                                                            <li key={ridx}>
                                                                {resource.quantity} {resource.unit} - {resource.name}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            <div className="detail-section">
                                <h4>Timeline</h4>
                                {selectedDispatch.timeline?.map((event, idx) => (
                                    <div key={idx} className="timeline-item">
                                        <div className="timeline-time">
                                            {new Date(event.timestamp).toLocaleString()}
                                        </div>
                                        <div className="timeline-status">{event.status}</div>
                                        {event.notes && <div className="timeline-notes">{event.notes}</div>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DispatchTracker;
