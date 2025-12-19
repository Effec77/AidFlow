import React, { useState, useEffect } from 'react';
import { AlertTriangle, MapPin, Clock, Users, TrendingUp, Activity, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DispatchControl from './DispatchControl';
import '../css/Emergency.css';

const EmergencyDashboard = () => {
    const navigate = useNavigate();
    const [activeEmergencies, setActiveEmergencies] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedEmergency, setSelectedEmergency] = useState(null);

    useEffect(() => {
        fetchActiveEmergencies();
        fetchAnalytics();
        
        // Refresh every 30 seconds
        const interval = setInterval(() => {
            fetchActiveEmergencies();
            fetchAnalytics();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const fetchActiveEmergencies = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/emergency/active');
            setActiveEmergencies(response.data.emergencies);
        } catch (error) {
            console.error('Failed to fetch active emergencies:', error);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/emergency/analytics');
            setAnalytics(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
            setLoading(false);
        }
    };

    const completeEmergency = async (emergencyId) => {
        const deliveryNotes = prompt('Enter delivery notes (optional):');
        
        try {
            await axios.put(`http://localhost:5000/api/emergency/complete/${emergencyId}`, {
                deliveryNotes: deliveryNotes || 'Resources delivered successfully',
                completedBy: 'admin'
            });
            
            fetchActiveEmergencies();
            alert('Emergency marked as completed!');
        } catch (error) {
            console.error('Failed to complete emergency:', error);
            alert('Failed to complete emergency');
        }
    };

    const deleteEmergency = async (emergencyId) => {
        if (!window.confirm('Are you sure you want to delete this emergency? This action cannot be undone.')) {
            return;
        }

        try {
            await axios.delete(`http://localhost:5000/api/emergency/${emergencyId}`);
            
            fetchActiveEmergencies();
            setSelectedEmergency(null);
            alert('Emergency deleted successfully');
        } catch (error) {
            console.error('Failed to delete emergency:', error);
            alert(error.response?.data?.error || 'Failed to delete emergency');
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return '#dc2626';
            case 'high': return '#ea580c';
            case 'medium': return '#d97706';
            case 'low': return '#65a30d';
            default: return '#6b7280';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'received': return '#3b82f6';
            case 'dispatched': return '#f59e0b';
            case 'en_route': return '#10b981';
            case 'completed': return '#059669';
            default: return '#6b7280';
        }
    };

    if (loading) {
        return <div className="loading">Loading emergency dashboard...</div>;
    }

    return (
        <div className="emergency-dashboard">
            <div className="dashboard-header">
                <div>
                    <h1>🚨 Emergency Response Dashboard</h1>
                    <p>AI-powered emergency management system</p>
                </div>
                <button 
                    className="dispatch-tracker-btn"
                    onClick={() => navigate('/dispatch-tracker')}
                >
                    <Navigation size={20} />
                    <span>Live Dispatch Tracker</span>
                </button>
            </div>

            {/* Analytics Cards */}
            {analytics && (
                <div className="analytics-grid">
                    <div className="analytics-card">
                        <Activity className="card-icon" />
                        <div className="card-content">
                            <h3>Active Emergencies</h3>
                            <p className="card-number">{activeEmergencies.length}</p>
                        </div>
                    </div>
                    
                    <div className="analytics-card">
                        <TrendingUp className="card-icon" />
                        <div className="card-content">
                            <h3>Last 24 Hours</h3>
                            <p className="card-number">{analytics.last24Hours}</p>
                        </div>
                    </div>
                    
                    <div className="analytics-card">
                        <AlertTriangle className="card-icon" />
                        <div className="card-content">
                            <h3>Critical Cases</h3>
                            <p className="card-number">
                                {activeEmergencies.filter(e => e.aiAnalysis?.severity === 'critical').length}
                            </p>
                        </div>
                    </div>
                    
                    <div className="analytics-card">
                        <Users className="card-icon" />
                        <div className="card-content">
                            <h3>Teams Deployed</h3>
                            <p className="card-number">
                                {activeEmergencies.filter(e => e.assignedTeam).length}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Active Emergencies List */}
            <div className="emergencies-section">
                <h2>Active Emergency Requests</h2>
                
                {activeEmergencies.length === 0 ? (
                    <div className="no-emergencies">
                        <p>No active emergencies at the moment.</p>
                    </div>
                ) : (
                    <div className="emergencies-grid">
                        {activeEmergencies.map((emergency) => (
                            <div 
                                key={emergency.emergencyId} 
                                className="emergency-card"
                                onClick={() => setSelectedEmergency(emergency)}
                            >
                                <button 
                                    className="card-delete-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteEmergency(emergency.emergencyId);
                                    }}
                                    title="Delete Emergency"
                                >
                                    ×
                                </button>
                                <div className="emergency-header">
                                    <div className="emergency-id">
                                        {emergency.emergencyId}
                                    </div>
                                    <div 
                                        className="severity-badge"
                                        style={{ backgroundColor: getSeverityColor(emergency.aiAnalysis?.severity) }}
                                    >
                                        {emergency.aiAnalysis?.severity || 'unknown'}
                                    </div>
                                </div>

                                <div className="emergency-info">
                                    <div className="location-info">
                                        <MapPin className="info-icon" />
                                        <span>{emergency.location.address || `${emergency.location.lat.toFixed(4)}, ${emergency.location.lon.toFixed(4)}`}</span>
                                    </div>
                                    
                                    <div className="time-info">
                                        <Clock className="info-icon" />
                                        <span>{new Date(emergency.createdAt).toLocaleString()}</span>
                                    </div>
                                    
                                    <div className="disaster-info">
                                        <AlertTriangle className="info-icon" />
                                        <span>{emergency.aiAnalysis?.disaster?.type || 'unknown'} ({emergency.aiAnalysis?.disaster?.confidence ? Math.round(emergency.aiAnalysis.disaster.confidence * 100) : 0}% confidence)</span>
                                    </div>
                                </div>

                                <div className="emergency-message">
                                    <p>"{emergency.userMessage}"</p>
                                </div>

                                <div className="emergency-actions">
                                    <div 
                                        className="status-badge"
                                        style={{ backgroundColor: getStatusColor(emergency.status) }}
                                    >
                                        {emergency.status}
                                    </div>
                                    
                                    <div className="action-buttons">
                                        {emergency.status === 'en_route' && (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    completeEmergency(emergency.emergencyId);
                                                }}
                                                className="complete-btn"
                                            >
                                                ✓ Mark Complete
                                            </button>
                                        )}
                                        
                                        {emergency.status === 'completed' && (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteEmergency(emergency.emergencyId);
                                                }}
                                                className="delete-btn"
                                            >
                                                🗑️ Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Emergency Detail Modal */}
            {selectedEmergency && (
                <div className="emergency-modal-overlay" onClick={() => setSelectedEmergency(null)}>
                    <div className="emergency-modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="emergency-modal-header">
                            <h2>🚨 Emergency Details</h2>
                            <span className="emergency-modal-id">{selectedEmergency.emergencyId}</span>
                            <button className="emergency-modal-close" onClick={() => setSelectedEmergency(null)}>×</button>
                        </div>

                        <div className="emergency-modal-body">
                            {/* User Information */}
                            <div className="modal-section">
                                <h3>📍 Location & User</h3>
                                <div className="modal-section-content">
                                    <p><strong>User ID:</strong> {selectedEmergency.userId || 'N/A'}</p>
                                    <p><strong>Address:</strong> {selectedEmergency.location?.address || 'N/A'}</p>
                                    <p><strong>Coordinates:</strong> {selectedEmergency.location?.lat?.toFixed(4) || 'N/A'}, {selectedEmergency.location?.lon?.toFixed(4) || 'N/A'}</p>
                                </div>
                            </div>

                            {/* AI Analysis */}
                            <div className="modal-section">
                                <h3>🤖 AI Analysis</h3>
                                <div className="modal-section-content modal-grid">
                                    <div className="modal-stat">
                                        <span className="modal-stat-label">Disaster Type</span>
                                        <span className="modal-stat-value">{selectedEmergency.aiAnalysis?.disaster?.type || 'Unknown'}</span>
                                    </div>
                                    <div className="modal-stat">
                                        <span className="modal-stat-label">Confidence</span>
                                        <span className="modal-stat-value">{selectedEmergency.aiAnalysis?.disaster?.confidence ? Math.round(selectedEmergency.aiAnalysis.disaster.confidence * 100) : 0}%</span>
                                    </div>
                                    <div className="modal-stat">
                                        <span className="modal-stat-label">Severity</span>
                                        <span className="modal-stat-value severity-tag" style={{ backgroundColor: getSeverityColor(selectedEmergency.aiAnalysis?.severity) }}>
                                            {selectedEmergency.aiAnalysis?.severity || 'Unknown'}
                                        </span>
                                    </div>
                                    <div className="modal-stat">
                                        <span className="modal-stat-label">Urgency</span>
                                        <span className="modal-stat-value">{selectedEmergency.aiAnalysis?.sentiment?.urgency || 'medium'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Resources */}
                            <div className="modal-section">
                                <h3>📦 Resources Required</h3>
                                <div className="modal-section-content modal-resources-grid">
                                    <div>
                                        <strong>Immediate:</strong>
                                        <ul>
                                            {selectedEmergency.response?.resources?.immediate?.length > 0 
                                                ? selectedEmergency.response.resources.immediate.map((resource, index) => (
                                                    <li key={index}>{String(resource).replace(/_/g, ' ')}</li>
                                                ))
                                                : <li>None specified</li>
                                            }
                                        </ul>
                                    </div>
                                    <div>
                                        <strong>Secondary:</strong>
                                        <ul>
                                            {selectedEmergency.response?.resources?.secondary?.length > 0
                                                ? selectedEmergency.response.resources.secondary.map((resource, index) => (
                                                    <li key={index}>{String(resource).replace(/_/g, ' ')}</li>
                                                ))
                                                : <li>None specified</li>
                                            }
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Dispatched Resources */}
                            {selectedEmergency.dispatchDetails && (
                                <div className="modal-section modal-section-success">
                                    <h3>✅ Resources Dispatched</h3>
                                    <div className="modal-section-content">
                                        <p><strong>Dispatched:</strong> {new Date(selectedEmergency.dispatchDetails.dispatchedAt).toLocaleString()}</p>
                                        <p><strong>ETA:</strong> {new Date(selectedEmergency.dispatchDetails.estimatedArrival).toLocaleTimeString()}</p>
                                        
                                        <div className="modal-centers-grid">
                                            {selectedEmergency.dispatchDetails.centers?.map((center, idx) => (
                                                <div key={idx} className="modal-center-card">
                                                    <h4>📦 {center.centerName}</h4>
                                                    <ul>
                                                        {center.resources?.map((resource, ridx) => (
                                                            <li key={ridx}>✓ {resource.quantity} {resource.unit} - {resource.name}</li>
                                                        ))}
                                                    </ul>
                                                    {center.route && (
                                                        <p className="modal-route-info">🚗 {center.route.distance?.toFixed(2)} km • {Math.round(center.route.duration)} min</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Dispatch Control */}
                            <div className="modal-section">
                                <h3>🚀 Dispatch Control</h3>
                                <div className="modal-section-content">
                                    <DispatchControl 
                                        emergency={selectedEmergency}
                                        onDispatchComplete={(result) => {
                                            fetchActiveEmergencies();
                                            setSelectedEmergency({
                                                ...selectedEmergency,
                                                status: 'dispatched',
                                                dispatchDetails: result.dispatch
                                            });
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Timeline */}
                            {selectedEmergency.timeline && selectedEmergency.timeline.length > 0 && (
                                <div className="modal-section">
                                    <h3>📋 Timeline</h3>
                                    <div className="modal-section-content">
                                        <div className="modal-timeline">
                                            {selectedEmergency.timeline.map((event, index) => (
                                                <div key={index} className="modal-timeline-item">
                                                    <div className="modal-timeline-time">{new Date(event.timestamp).toLocaleString()}</div>
                                                    <div className="modal-timeline-status">{event.status}</div>
                                                    {event.notes && <div className="modal-timeline-notes">{event.notes}</div>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmergencyDashboard;