import React, { useState, useEffect, useContext } from 'react';
import { AlertTriangle, MapPin, Clock, Users, TrendingUp, Activity, Navigation, Package, Edit, Trash2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from './UserContext';
import { createAuthenticatedAxios } from '../utils/api';
import DispatchControl from './DispatchControl';
import '../css/Emergency.css';
import '../css/EmergencyDashboard.css';

const EmergencyDashboard = () => {
    const navigate = useNavigate();
    const { token, userRole, userId } = useContext(UserContext);
    const [activeEmergencies, setActiveEmergencies] = useState([]);
    const [requests, setRequests] = useState([]);
    const [dispatchRequests, setDispatchRequests] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedEmergency, setSelectedEmergency] = useState(null);
    const [activeTab, setActiveTab] = useState('emergencies');
    const [editingRequest, setEditingRequest] = useState(null);

    useEffect(() => {
        if (token) {
            fetchActiveEmergencies();
            fetchAnalytics();
            if (userRole === 'admin' || userRole === 'branch manager') {
                fetchRequests();
                fetchDispatchRequests();
            }
            
            // Refresh every 30 seconds
            const interval = setInterval(() => {
                fetchActiveEmergencies();
                fetchAnalytics();
                if (userRole === 'admin' || userRole === 'branch manager') {
                    fetchRequests();
                    fetchDispatchRequests();
                }
            }, 30000);

            return () => clearInterval(interval);
        }
    }, [token, userRole]);

    const fetchActiveEmergencies = async () => {
        try {
            const api = createAuthenticatedAxios(token);
            const response = await api.get('/api/emergency/active');
            setActiveEmergencies(response.data.emergencies);
        } catch (error) {
            console.error('Failed to fetch active emergencies:', error);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const api = createAuthenticatedAxios(token);
            const response = await api.get('/api/emergency/analytics');
            setAnalytics(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
            setLoading(false);
        }
    };

    const fetchRequests = async () => {
        try {
            const api = createAuthenticatedAxios(token);
            const response = await api.get('/api/admin/requests');
            setRequests(response.data);
        } catch (error) {
            console.error('Failed to fetch requests:', error);
        }
    };

    const fetchDispatchRequests = async () => {
        try {
            const api = createAuthenticatedAxios(token);
            const response = await api.get('/api/emergency/dispatch-requests');
            setDispatchRequests(response.data.requests);
        } catch (error) {
            console.error('Failed to fetch dispatch requests:', error);
        }
    };

    const approveDispatchRequest = async (requestId) => {
        try {
            console.log('Approving dispatch request:', requestId, 'with userId:', userId);
            console.log('Token available:', !!token);
            console.log('User role:', userRole);
            
            const api = createAuthenticatedAxios(token);
            const response = await api.put(`/api/emergency/dispatch-requests/${requestId}/approve`, {
                adminId: userId || 'admin', // Use actual user ID
                notes: 'Approved via dashboard'
            });
            
            console.log('Approval response:', response.data);
            fetchDispatchRequests();
            fetchActiveEmergencies();
            alert('Dispatch request approved and executed!');
        } catch (error) {
            console.error('Failed to approve dispatch request:', error);
            console.error('Error details:', error.response?.data);
            alert(`Failed to approve dispatch request: ${error.response?.data?.error || error.message}`);
        }
    };

    const rejectDispatchRequest = async (requestId) => {
        const reason = prompt('Enter rejection reason:');
        if (!reason) return;

        try {
            const api = createAuthenticatedAxios(token);
            await api.put(`/api/emergency/dispatch-requests/${requestId}/reject`, {
                adminId: userId || 'admin', // Use actual user ID
                reason: reason
            });
            
            fetchDispatchRequests();
            alert('Dispatch request rejected');
        } catch (error) {
            console.error('Failed to reject dispatch request:', error);
            alert('Failed to reject dispatch request');
        }
    };

    const completeEmergency = async (emergencyId) => {
        const deliveryNotes = prompt('Enter delivery notes (optional):');
        
        try {
            const api = createAuthenticatedAxios(token);
            await api.put(`/api/emergency/complete/${emergencyId}`, {
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
            const api = createAuthenticatedAxios(token);
            await api.delete(`/api/emergency/${emergencyId}`);
            
            fetchActiveEmergencies();
            setSelectedEmergency(null);
            alert('Emergency deleted successfully');
        } catch (error) {
            console.error('Failed to delete emergency:', error);
            alert(error.response?.data?.error || 'Failed to delete emergency');
        }
    };

    const updateRequestStatus = async (requestId, status, notes = '') => {
        try {
            const api = createAuthenticatedAxios(token);
            await api.put(`/api/admin/request/${requestId}`, { status, notes });
            fetchRequests();
            setEditingRequest(null);
            alert('Request status updated successfully');
        } catch (error) {
            console.error('Failed to update request:', error);
            alert(error.response?.data?.error || 'Failed to update request');
        }
    };

    const deleteRequest = async (requestId) => {
        if (!window.confirm('Are you sure you want to delete this request? This action cannot be undone.')) {
            return;
        }

        try {
            const api = createAuthenticatedAxios(token);
            await api.delete(`/api/admin/request/${requestId}`);
            fetchRequests();
            alert('Request deleted successfully');
        } catch (error) {
            console.error('Failed to delete request:', error);
            alert(error.response?.data?.error || 'Failed to delete request');
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

    const getRequestStatusColor = (status) => {
        switch (status) {
            case 'pending': return '#f59e0b';
            case 'approved': return '#3b82f6';
            case 'delivered': return '#10b981';
            case 'fulfilled': return '#059669';
            case 'rejected': return '#dc2626';
            default: return '#6b7280';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return '#dc2626';
            case 'normal': return '#f59e0b';
            case 'low': return '#10b981';
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
                <div className="header-actions">
                    {(userRole === 'admin' || userRole === 'branch manager') && (
                        <div className="tab-buttons">
                            <button 
                                className={`tab-btn ${activeTab === 'emergencies' ? 'active' : ''}`}
                                onClick={() => setActiveTab('emergencies')}
                            >
                                <AlertTriangle size={16} />
                                Emergencies
                            </button>
                            <button 
                                className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
                                onClick={() => setActiveTab('requests')}
                            >
                                <Package size={16} />
                                Requests
                            </button>
                            <button 
                                className={`tab-btn ${activeTab === 'dispatch-requests' ? 'active' : ''}`}
                                onClick={() => setActiveTab('dispatch-requests')}
                            >
                                <Clock size={16} />
                                Dispatch Requests ({dispatchRequests.length})
                            </button>
                        </div>
                    )}
                    <button 
                        className="dispatch-tracker-btn"
                        onClick={() => navigate('/dispatch-tracker')}
                    >
                        <Navigation size={20} />
                        <span>Live Dispatch Tracker</span>
                    </button>
                </div>
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
            {activeTab === 'emergencies' && (
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
            )}

            {/* Requests Management Section */}
            {activeTab === 'requests' && (userRole === 'admin' || userRole === 'branch manager') && (
                <div className="requests-section">
                    <h2>Resource Requests Management</h2>
                    
                    {requests.length === 0 ? (
                        <div className="no-requests">
                            <p>No resource requests at the moment.</p>
                        </div>
                    ) : (
                        <div className="requests-grid">
                            {requests.map((request) => (
                                <div key={request._id} className="request-card">
                                    <div className="request-header">
                                        <div className="request-info">
                                            <h3>{request.itemName}</h3>
                                            <p className="requester-info">
                                                By: {request.requesterId?.firstName} {request.requesterId?.lastName} 
                                                ({request.requesterId?.username})
                                            </p>
                                        </div>
                                        <div className="request-badges">
                                            <div 
                                                className="priority-badge"
                                                style={{ backgroundColor: getPriorityColor(request.priority) }}
                                            >
                                                {request.priority}
                                            </div>
                                            <div 
                                                className="status-badge"
                                                style={{ backgroundColor: getRequestStatusColor(request.status) }}
                                            >
                                                {request.status}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="request-details">
                                        <div className="detail-item">
                                            <Package className="detail-icon" />
                                            <span>{request.quantity} units • {request.category}</span>
                                        </div>
                                        <div className="detail-item">
                                            <MapPin className="detail-icon" />
                                            <span>{request.location}</span>
                                        </div>
                                        <div className="detail-item">
                                            <Clock className="detail-icon" />
                                            <span>{new Date(request.createdAt).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {request.notes && (
                                        <div className="request-notes">
                                            <strong>Notes:</strong> {request.notes}
                                        </div>
                                    )}

                                    <div className="request-actions">
                                        {userRole === 'branch manager' && request.status === 'pending' && (
                                            <>
                                                <button 
                                                    onClick={() => updateRequestStatus(request._id, 'approved')}
                                                    className="approve-btn"
                                                >
                                                    <CheckCircle size={16} />
                                                    Approve
                                                </button>
                                                <button 
                                                    onClick={() => updateRequestStatus(request._id, 'rejected')}
                                                    className="reject-btn"
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                        
                                        {userRole === 'branch manager' && request.status === 'approved' && (
                                            <button 
                                                onClick={() => updateRequestStatus(request._id, 'delivered')}
                                                className="deliver-btn"
                                            >
                                                Mark as Delivered
                                            </button>
                                        )}

                                        <button 
                                            onClick={() => setEditingRequest(request)}
                                            className="edit-btn"
                                        >
                                            <Edit size={16} />
                                            Edit Status
                                        </button>

                                        {userRole === 'admin' && (
                                            <button 
                                                onClick={() => deleteRequest(request._id)}
                                                className="delete-btn"
                                            >
                                                <Trash2 size={16} />
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Dispatch Requests Section */}
            {activeTab === 'dispatch-requests' && (userRole === 'admin' || userRole === 'branch manager') && (
                <div className="dispatch-requests-section">
                    <h2>Pending Dispatch Requests</h2>
                    <p className="section-description">
                        Medium/Low severity emergencies requiring manual approval for dispatch
                    </p>
                    
                    {dispatchRequests.length === 0 ? (
                        <div className="no-requests">
                            <p>No pending dispatch requests. All high severity emergencies are automatically dispatched.</p>
                        </div>
                    ) : (
                        <div className="dispatch-requests-grid">
                            {dispatchRequests.map((request) => (
                                <div key={request._id} className="dispatch-request-card">
                                    <div className="request-header">
                                        <div className="request-info">
                                            <h3>Emergency: {request.emergencyId}</h3>
                                            <p className="severity-info">
                                                Severity: <span className={`severity-${request.severity}`}>{request.severity}</span>
                                            </p>
                                        </div>
                                        <div className="request-badges">
                                            <div 
                                                className="priority-badge"
                                                style={{ backgroundColor: getPriorityColor(request.priority) }}
                                            >
                                                {request.priority}
                                            </div>
                                            <div className="status-badge pending">
                                                {request.status}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="request-details">
                                        <div className="detail-item">
                                            <Package className="detail-icon" />
                                            <span>Resources: {request.requestedResources.length} items</span>
                                        </div>
                                        <div className="detail-item">
                                            <Clock className="detail-icon" />
                                            <span>Requested: {new Date(request.createdAt).toLocaleString()}</span>
                                        </div>
                                        {request.reasoning && (
                                            <div className="detail-item">
                                                <AlertTriangle className="detail-icon" />
                                                <span>{request.reasoning}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="requested-resources">
                                        <h4>Requested Resources:</h4>
                                        <ul>
                                            {request.requestedResources.map((resource, index) => (
                                                <li key={index}>
                                                    {resource.quantity}x {resource.name} ({resource.category})
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="request-actions">
                                        <button 
                                            onClick={() => approveDispatchRequest(request._id)}
                                            className="approve-btn"
                                        >
                                            <CheckCircle size={16} />
                                            Approve & Dispatch
                                        </button>
                                        <button 
                                            onClick={() => rejectDispatchRequest(request._id)}
                                            className="reject-btn"
                                        >
                                            <Trash2 size={16} />
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

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

            {/* Edit Request Modal */}
            {editingRequest && (
                <div className="request-modal" onClick={() => setEditingRequest(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Edit Request Status</h2>
                            <button 
                                className="close-btn"
                                onClick={() => setEditingRequest(null)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="request-summary">
                                <h3>{editingRequest.itemName}</h3>
                                <p>Requested by: {editingRequest.requesterId?.firstName} {editingRequest.requesterId?.lastName}</p>
                                <p>Quantity: {editingRequest.quantity} • Category: {editingRequest.category}</p>
                                <p>Location: {editingRequest.location}</p>
                                <p>Current Status: <span style={{ color: getRequestStatusColor(editingRequest.status) }}>{editingRequest.status}</span></p>
                            </div>

                            <div className="status-actions">
                                <h4>Update Status:</h4>
                                <div className="status-buttons">
                                    {userRole === 'branch manager' && (
                                        <>
                                            <button 
                                                onClick={() => updateRequestStatus(editingRequest._id, 'approved')}
                                                className="status-btn approve"
                                            >
                                                Approve
                                            </button>
                                            <button 
                                                onClick={() => updateRequestStatus(editingRequest._id, 'rejected')}
                                                className="status-btn reject"
                                            >
                                                Reject
                                            </button>
                                            <button 
                                                onClick={() => updateRequestStatus(editingRequest._id, 'delivered')}
                                                className="status-btn deliver"
                                            >
                                                Mark as Delivered
                                            </button>
                                        </>
                                    )}
                                    
                                    {userRole === 'admin' && (
                                        <>
                                            <button 
                                                onClick={() => updateRequestStatus(editingRequest._id, 'pending')}
                                                className="status-btn pending"
                                            >
                                                Set to Pending
                                            </button>
                                            <button 
                                                onClick={() => updateRequestStatus(editingRequest._id, 'approved')}
                                                className="status-btn approve"
                                            >
                                                Approve
                                            </button>
                                            <button 
                                                onClick={() => updateRequestStatus(editingRequest._id, 'rejected')}
                                                className="status-btn reject"
                                            >
                                                Reject
                                            </button>
                                            <button 
                                                onClick={() => updateRequestStatus(editingRequest._id, 'delivered')}
                                                className="status-btn deliver"
                                            >
                                                Mark as Delivered
                                            </button>
                                            <button 
                                                onClick={() => updateRequestStatus(editingRequest._id, 'fulfilled')}
                                                className="status-btn fulfill"
                                            >
                                                Mark as Fulfilled
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="notes-section">
                                <h4>Add Notes:</h4>
                                <textarea 
                                    id="requestNotes"
                                    placeholder="Add any notes about this request..."
                                    rows="3"
                                />
                                <button 
                                    onClick={() => {
                                        const notes = document.getElementById('requestNotes').value;
                                        updateRequestStatus(editingRequest._id, editingRequest.status, notes);
                                    }}
                                    className="save-notes-btn"
                                >
                                    Save Notes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmergencyDashboard;