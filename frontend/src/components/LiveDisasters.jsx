import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import axios from 'axios';
import { 
    AlertTriangle, 
    MapPin, 
    Clock, 
    Users, 
    Plus,
    Zap,
    CheckCircle,
    Activity,
    Package,
    TrendingUp,
    Navigation
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import '../css/LiveDisasters.css';

/**
 * Live Disasters Dashboard
 * Real-time disaster monitoring integrated with Emergency & Dispatch systems
 */
const LiveDisasters = () => {
    const navigate = useNavigate();
    const [disasters, setDisasters] = useState([]);
    const [selectedDisaster, setSelectedDisaster] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [inventoryImpact, setInventoryImpact] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [mapCenter, setMapCenter] = useState([30.7171, 76.8537]); // Default: Chandigarh
    
    const [newDisaster, setNewDisaster] = useState({
        name: '',
        type: 'flood',
        severity: 'medium',
        location: { lat: 30.7171, lon: 76.8537, address: '' },
        radius: 1000,
        description: '',
        affectedPopulation: 0,
        estimatedDamage: 'unknown'
    });

    useEffect(() => {
        fetchDisasters();
        fetchAnalytics();
        fetchInventoryImpact();
        
        // Refresh every 30 seconds
        const interval = setInterval(() => {
            fetchDisasters();
            fetchAnalytics();
            fetchInventoryImpact();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const fetchDisasters = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/disasters/zones');
            setDisasters(response.data.zones || []);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch disasters:', error);
            setLoading(false);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/disasters/analytics');
            setAnalytics(response.data.analytics);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        }
    };

    const fetchInventoryImpact = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/inventory/items');
            setInventoryImpact(response.data || []);
        } catch (error) {
            console.error('Failed to fetch inventory:', error);
        }
    };

    const createDisaster = async () => {
        try {
            await axios.post('http://localhost:5000/api/disasters/zones', {
                ...newDisaster,
                createdBy: 'admin'
            });
            setShowCreateModal(false);
            setNewDisaster({
                name: '',
                type: 'flood',
                severity: 'medium',
                location: { lat: 30.7171, lon: 76.8537, address: '' },
                radius: 1000,
                description: '',
                affectedPopulation: 0,
                estimatedDamage: 'unknown'
            });
            fetchDisasters();
            fetchAnalytics();
        } catch (error) {
            console.error('Failed to create disaster:', error);
            alert('Failed to create disaster zone');
        }
    };

    const createEmergencyFromDisaster = async (disaster) => {
        try {
            const lat = getDisasterProp(disaster, 'lat');
            const lon = getDisasterProp(disaster, 'lon');
            const type = getDisasterProp(disaster, 'type');
            const description = getDisasterProp(disaster, 'description');
            const address = getDisasterProp(disaster, 'address');
            
            // Create emergency request from disaster zone
            const response = await axios.post('http://localhost:5000/api/emergency/request', {
                lat,
                lon,
                message: `Emergency in ${disaster.name} disaster zone. ${type} disaster with ${disaster.severity} severity. ${description}`,
                userId: 'disaster_system',
                address: address || disaster.name
            });

            if (response.data.success) {
                alert(`Emergency ${response.data.emergencyId} created! Redirecting to Emergency Dashboard...`);
                navigate('/emergency-dashboard');
            }
        } catch (error) {
            console.error('Failed to create emergency:', error);
            alert('Failed to create emergency from disaster zone');
        }
    };

    const resolveDisaster = async (zoneId) => {
        if (!window.confirm('Mark this disaster zone as resolved?')) return;
        
        try {
            await axios.delete(`http://localhost:5000/api/disasters/zones/${zoneId}`, {
                data: {
                    resolvedBy: 'admin',
                    resolutionNotes: 'Disaster situation resolved'
                }
            });
            fetchDisasters();
            fetchAnalytics();
            setSelectedDisaster(null);
        } catch (error) {
            console.error('Failed to resolve disaster:', error);
            alert('Failed to resolve disaster');
        }
    };

    const getSeverityColor = (severity) => {
        const colors = {
            'critical': '#DC2626',
            'high': '#EA580C',
            'medium': '#D97706',
            'low': '#65A30D'
        };
        return colors[severity] || '#6B7280';
    };

    const getTypeIcon = (type) => {
        const icons = {
            flood: '🌊',
            fire: '🔥',
            earthquake: '🌍',
            storm: '⛈️',
            landslide: '🏔️',
            drought: '🏜️',
            cyclone: '🌀'
        };
        return icons[type] || '⚠️';
    };

    const getResourcesForDisasterType = (type) => {
        const resourceMap = {
            flood: ['Water Pumps', 'Boats', 'Life Jackets', 'Medical Kit'],
            fire: ['Fire Extinguishers', 'Water Tanks', 'Protective Gear'],
            earthquake: ['Search Equipment', 'Medical Kit', 'Shelter', 'Food'],
            storm: ['Shelter Materials', 'Medical Kit', 'Food', 'Water'],
            landslide: ['Search Equipment', 'Medical Kit', 'Heavy Machinery'],
            drought: ['Water Tanks', 'Food', 'Medical Kit'],
            cyclone: ['Shelter Materials', 'Medical Kit', 'Communication Equipment']
        };
        return resourceMap[type.toLowerCase()] || ['Medical Kit', 'Food', 'Water'];
    };

    const getInventoryStatus = (resourceName) => {
        const item = inventoryImpact.find(i => 
            i.name.toLowerCase().includes(resourceName.toLowerCase()) ||
            resourceName.toLowerCase().includes(i.name.toLowerCase())
        );
        
        if (!item) return { status: 'unknown', stock: 0 };
        return { status: item.status, stock: item.currentStock, unit: item.unit };
    };

    if (loading) {
        return (
            <div className="disasters-loading">
                <div className="spinner-large" />
                <p>Loading disaster data...</p>
            </div>
        );
    }

    const activeDisasters = disasters.filter(d => d.status === 'active');
    
    // Helper to get disaster properties from the model
    const getDisasterProp = (disaster, prop) => {
        switch(prop) {
            case 'type':
                return disaster.disasterType || disaster.type;
            case 'lat':
                return disaster.location?.center?.lat || disaster.location?.lat;
            case 'lon':
                return disaster.location?.center?.lon || disaster.location?.lon;
            case 'address':
                return disaster.metadata?.address || disaster.location?.address;
            case 'affectedPopulation':
                return disaster.affectedPopulation?.estimated || disaster.affectedPopulation || 0;
            case 'radius':
                return (disaster.location?.radius || 1) * 1000; // Convert km to meters
            case 'description':
                return disaster.metadata?.description || disaster.alerts?.[0]?.message || '';
            default:
                return disaster[prop];
        }
    };

    return (
        <div className="live-disasters">
            {/* Header */}
            <div className="disasters-header">
                <div className="header-content">
                    <Activity className="header-icon" />
                    <div>
                        <h2>🌍 Live Disasters Dashboard</h2>
                        <p>Real-time disaster monitoring and emergency coordination</p>
                    </div>
                </div>
                <div className="header-actions">
                    <button 
                        className="nav-btn"
                        onClick={() => navigate('/emergency-dashboard')}
                    >
                        <AlertTriangle size={20} />
                        <span>Emergency Dashboard</span>
                    </button>
                    <button 
                        className="nav-btn"
                        onClick={() => navigate('/dispatch-tracker')}
                    >
                        <Navigation size={20} />
                        <span>Dispatch Tracker</span>
                    </button>
                    <button 
                        className="create-disaster-btn"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <Plus size={20} />
                        <span>Create Disaster Zone</span>
                    </button>
                </div>
            </div>

            {/* Analytics Cards */}
            {analytics && (
                <div className="analytics-grid">
                    <div className="analytics-card critical">
                        <div className="card-icon">
                            <AlertTriangle size={24} />
                        </div>
                        <div className="card-content">
                            <h3>{analytics.activeZones}</h3>
                            <p>Active Zones</p>
                        </div>
                    </div>
                    <div className="analytics-card success">
                        <div className="card-icon">
                            <CheckCircle size={24} />
                        </div>
                        <div className="card-content">
                            <h3>{analytics.resolvedZones}</h3>
                            <p>Resolved Zones</p>
                        </div>
                    </div>
                    <div className="analytics-card info">
                        <div className="card-icon">
                            <Users size={24} />
                        </div>
                        <div className="card-content">
                            <h3>{analytics.totalAffectedPopulation.toLocaleString()}</h3>
                            <p>People Affected</p>
                        </div>
                    </div>
                    <div className="analytics-card warning">
                        <div className="card-icon">
                            <TrendingUp size={24} />
                        </div>
                        <div className="card-content">
                            <h3>{analytics.recentZones}</h3>
                            <p>This Week</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="disasters-content">
                {/* Disasters List */}
                <div className="disasters-list">
                    <h3>Active Disaster Zones ({activeDisasters.length})</h3>
                    {activeDisasters.length === 0 ? (
                        <div className="no-disasters">
                            <CheckCircle className="empty-icon" />
                            <p>No active disasters</p>
                        </div>
                    ) : (
                        activeDisasters.map((disaster) => {
                            const type = getDisasterProp(disaster, 'type');
                            const lat = getDisasterProp(disaster, 'lat');
                            const lon = getDisasterProp(disaster, 'lon');
                            const address = getDisasterProp(disaster, 'address');
                            const affectedPop = getDisasterProp(disaster, 'affectedPopulation');
                            const description = getDisasterProp(disaster, 'description');
                            
                            return (
                            <div
                                key={disaster.zoneId}
                                className={`disaster-card ${selectedDisaster?.zoneId === disaster.zoneId ? 'selected' : ''}`}
                                onClick={() => {
                                    setSelectedDisaster(disaster);
                                    setMapCenter([lat, lon]);
                                }}
                            >
                                <div className="disaster-header">
                                    <div className="disaster-type">
                                        <span className="type-icon">{getTypeIcon(type)}</span>
                                        <span className="type-name">{type}</span>
                                    </div>
                                    <div 
                                        className="severity-badge"
                                        style={{ backgroundColor: getSeverityColor(disaster.severity) }}
                                    >
                                        {disaster.severity}
                                    </div>
                                </div>
                                <h4>{disaster.name}</h4>
                                <p className="disaster-description">{description}</p>
                                <div className="disaster-stats">
                                    <div className="stat">
                                        <MapPin size={16} />
                                        <span>{address || 'Location set'}</span>
                                    </div>
                                    <div className="stat">
                                        <Users size={16} />
                                        <span>{affectedPop.toLocaleString()} affected</span>
                                    </div>
                                    <div className="stat">
                                        <Clock size={16} />
                                        <span>{new Date(disaster.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="disaster-actions">
                                    <button 
                                        className="action-btn emergency-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            createEmergencyFromDisaster(disaster);
                                        }}
                                    >
                                        <Zap size={16} />
                                        Create Emergency
                                    </button>
                                    <button 
                                        className="action-btn resolve-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            resolveDisaster(disaster.zoneId);
                                        }}
                                    >
                                        <CheckCircle size={16} />
                                        Resolve
                                    </button>
                                </div>
                            </div>
                        );
                        })
                    )}
                </div>

                {/* Map View */}
                <div className="disasters-map">
                    <MapContainer
                        center={mapCenter}
                        zoom={12}
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        />
                        {activeDisasters.map((disaster) => {
                            const lat = getDisasterProp(disaster, 'lat');
                            const lon = getDisasterProp(disaster, 'lon');
                            const type = getDisasterProp(disaster, 'type');
                            const affectedPop = getDisasterProp(disaster, 'affectedPopulation');
                            const radius = getDisasterProp(disaster, 'radius');
                            
                            return (
                            <React.Fragment key={disaster.zoneId}>
                                <Marker position={[lat, lon]}>
                                    <Popup>
                                        <div className="map-popup">
                                            <strong>{disaster.name}</strong>
                                            <p>Type: {type}</p>
                                            <p>Severity: {disaster.severity}</p>
                                            <p>Affected: {affectedPop}</p>
                                        </div>
                                    </Popup>
                                </Marker>
                                <Circle
                                    center={[lat, lon]}
                                    radius={radius}
                                    pathOptions={{
                                        color: getSeverityColor(disaster.severity),
                                        fillColor: getSeverityColor(disaster.severity),
                                        fillOpacity: 0.2
                                    }}
                                />
                            </React.Fragment>
                        );
                        })}
                    </MapContainer>
                </div>

                {/* Detail Panel */}
                {selectedDisaster && (
                    <div className="disaster-detail">
                        <div className="detail-header">
                            <h3>{selectedDisaster.name}</h3>
                            <button 
                                className="close-detail"
                                onClick={() => setSelectedDisaster(null)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="detail-content">
                            <div className="detail-section">
                                <h4>Disaster Information</h4>
                                <p><strong>Type:</strong> {getTypeIcon(getDisasterProp(selectedDisaster, 'type'))} {getDisasterProp(selectedDisaster, 'type')}</p>
                                <p><strong>Severity:</strong> 
                                    <span 
                                        className="severity-inline"
                                        style={{ color: getSeverityColor(selectedDisaster.severity) }}
                                    >
                                        {selectedDisaster.severity}
                                    </span>
                                </p>
                                <p><strong>Description:</strong> {getDisasterProp(selectedDisaster, 'description')}</p>
                                <p><strong>Affected Radius:</strong> {(getDisasterProp(selectedDisaster, 'radius') / 1000).toFixed(1)} km</p>
                            </div>

                            <div className="detail-section">
                                <h4>Impact Assessment</h4>
                                <p><strong>Affected Population:</strong> {getDisasterProp(selectedDisaster, 'affectedPopulation').toLocaleString()}</p>
                                <p><strong>Estimated Damage:</strong> {selectedDisaster.metadata?.estimatedDamage || 'unknown'}</p>
                                <p><strong>Created:</strong> {new Date(selectedDisaster.createdAt).toLocaleString()}</p>
                            </div>

                            <div className="detail-section">
                                <h4>Required Resources</h4>
                                <div className="resources-list">
                                    {getResourcesForDisasterType(getDisasterProp(selectedDisaster, 'type')).map((resource, idx) => {
                                        const inventoryStatus = getInventoryStatus(resource);
                                        return (
                                            <div key={idx} className="resource-item">
                                                <Package size={16} />
                                                <span className="resource-name">{resource}</span>
                                                <span className={`resource-status ${inventoryStatus.status}`}>
                                                    {inventoryStatus.stock > 0 
                                                        ? `${inventoryStatus.stock} ${inventoryStatus.unit || 'units'}`
                                                        : 'Out of stock'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="detail-section">
                                <h4>Quick Actions</h4>
                                <div className="quick-actions">
                                    <button 
                                        className="quick-action emergency"
                                        onClick={() => createEmergencyFromDisaster(selectedDisaster)}
                                    >
                                        <Zap size={20} />
                                        Create Emergency
                                    </button>
                                    <button 
                                        className="quick-action resolve"
                                        onClick={() => resolveDisaster(selectedDisaster.zoneId)}
                                    >
                                        <CheckCircle size={20} />
                                        Mark Resolved
                                    </button>
                                </div>
                            </div>

                            {selectedDisaster.alerts && selectedDisaster.alerts.length > 0 && (
                                <div className="detail-section">
                                    <h4>Timeline & Alerts</h4>
                                    <div className="timeline">
                                        {selectedDisaster.alerts.map((alert, idx) => (
                                            <div key={idx} className="timeline-event">
                                                <div className="timeline-time">
                                                    {new Date(alert.timestamp).toLocaleString()}
                                                </div>
                                                <div className="timeline-description">
                                                    <span className={`alert-level ${alert.level}`}>{alert.level.toUpperCase()}</span>: {alert.message}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Create Disaster Modal */}
            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal-content create-modal">
                        <div className="modal-header">
                            <h3>Create New Disaster Zone</h3>
                            <button 
                                className="close-modal"
                                onClick={() => setShowCreateModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Disaster Name</label>
                                    <input
                                        type="text"
                                        value={newDisaster.name}
                                        onChange={(e) => setNewDisaster({...newDisaster, name: e.target.value})}
                                        placeholder="e.g., Downtown Flood Zone"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Type</label>
                                    <select
                                        value={newDisaster.type}
                                        onChange={(e) => setNewDisaster({...newDisaster, type: e.target.value})}
                                    >
                                        <option value="flood">🌊 Flood</option>
                                        <option value="fire">🔥 Fire</option>
                                        <option value="earthquake">🌍 Earthquake</option>
                                        <option value="storm">⛈️ Storm</option>
                                        <option value="landslide">🏔️ Landslide</option>
                                        <option value="drought">🏜️ Drought</option>
                                        <option value="cyclone">🌀 Cyclone</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Severity</label>
                                    <select
                                        value={newDisaster.severity}
                                        onChange={(e) => setNewDisaster({...newDisaster, severity: e.target.value})}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Affected Population</label>
                                    <input
                                        type="number"
                                        value={newDisaster.affectedPopulation}
                                        onChange={(e) => setNewDisaster({...newDisaster, affectedPopulation: parseInt(e.target.value) || 0})}
                                        placeholder="0"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Latitude</label>
                                    <input
                                        type="number"
                                        step="0.000001"
                                        value={newDisaster.location.lat}
                                        onChange={(e) => setNewDisaster({
                                            ...newDisaster, 
                                            location: {...newDisaster.location, lat: parseFloat(e.target.value)}
                                        })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Longitude</label>
                                    <input
                                        type="number"
                                        step="0.000001"
                                        value={newDisaster.location.lon}
                                        onChange={(e) => setNewDisaster({
                                            ...newDisaster, 
                                            location: {...newDisaster.location, lon: parseFloat(e.target.value)}
                                        })}
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label>Description</label>
                                    <textarea
                                        value={newDisaster.description}
                                        onChange={(e) => setNewDisaster({...newDisaster, description: e.target.value})}
                                        placeholder="Describe the disaster situation..."
                                        rows="3"
                                    />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button 
                                    className="btn-secondary"
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className="btn-primary"
                                    onClick={createDisaster}
                                    disabled={!newDisaster.name || !newDisaster.description}
                                >
                                    Create Disaster Zone
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LiveDisasters;
