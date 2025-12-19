import React, { useState, useEffect, useContext } from 'react';
import { Package, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import { UserContext } from './UserContext';
import { createAuthenticatedAxios } from '../utils/api';

/**
 * Inventory Integration Component
 * Displays real-time inventory from backend
 */
const InventoryIntegration = () => {
    const { token } = useContext(UserContext);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (token) {
            fetchInventory();
            
            // Refresh every 30 seconds
            const interval = setInterval(fetchInventory, 30000);
            return () => clearInterval(interval);
        }
    }, [token]);

    const fetchInventory = async () => {
        try {
            const api = createAuthenticatedAxios(token);
            const response = await api.get('/api/inventory/items');
            setInventory(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch inventory:', error);
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'critical': return '#dc2626';
            case 'low': return '#f59e0b';
            case 'adequate': return '#10b981';
            default: return '#6b7280';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'critical': return <AlertTriangle className="status-icon critical" />;
            case 'low': return <TrendingDown className="status-icon low" />;
            case 'adequate': return <TrendingUp className="status-icon adequate" />;
            default: return <Package className="status-icon" />;
        }
    };

    const filteredInventory = inventory.filter(item => {
        const matchesFilter = filter === 'all' || item.category === filter;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const categories = ['all', ...new Set(inventory.map(item => item.category))];

    const getStockPercentage = (item) => {
        return (item.currentStock / item.maxCapacity) * 100;
    };

    if (loading) {
        return <div className="inventory-loading">Loading inventory...</div>;
    }

    return (
        <div className="inventory-integration">
            <div className="inventory-header">
                <h2>📦 Real-Time Inventory</h2>
                <p>Live stock levels from backend database</p>
            </div>

            <div className="inventory-controls">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="filter-buttons">
                    {categories.map(category => (
                        <button
                            key={category}
                            className={`filter-btn ${filter === category ? 'active' : ''}`}
                            onClick={() => setFilter(category)}
                        >
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="inventory-stats">
                <div className="stat-card">
                    <h3>Total Items</h3>
                    <p className="stat-number">{inventory.length}</p>
                </div>
                <div className="stat-card critical">
                    <h3>Critical Stock</h3>
                    <p className="stat-number">
                        {inventory.filter(i => i.status === 'critical').length}
                    </p>
                </div>
                <div className="stat-card low">
                    <h3>Low Stock</h3>
                    <p className="stat-number">
                        {inventory.filter(i => i.status === 'low').length}
                    </p>
                </div>
                <div className="stat-card adequate">
                    <h3>Adequate Stock</h3>
                    <p className="stat-number">
                        {inventory.filter(i => i.status === 'adequate').length}
                    </p>
                </div>
            </div>

            <div className="inventory-grid">
                {filteredInventory.map((item) => (
                    <div key={item._id} className="inventory-card">
                        <div className="card-header">
                            <div className="item-info">
                                {getStatusIcon(item.status)}
                                <div>
                                    <h3>{item.name}</h3>
                                    <span className="category-badge">{item.category}</span>
                                </div>
                            </div>
                            <div 
                                className="status-badge"
                                style={{ backgroundColor: getStatusColor(item.status) }}
                            >
                                {item.status}
                            </div>
                        </div>

                        <div className="card-body">
                            <div className="stock-info">
                                <div className="stock-numbers">
                                    <span className="current-stock">{item.currentStock}</span>
                                    <span className="stock-unit">/ {item.maxCapacity} {item.unit}</span>
                                </div>
                                <div className="stock-bar">
                                    <div 
                                        className="stock-fill"
                                        style={{ 
                                            width: `${getStockPercentage(item)}%`,
                                            backgroundColor: getStatusColor(item.status)
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="item-details">
                                <div className="detail-row">
                                    <span className="label">Location:</span>
                                    <span className="value">{item.location}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Min Threshold:</span>
                                    <span className="value">{item.minThreshold} {item.unit}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Cost:</span>
                                    <span className="value">${item.cost}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Supplier:</span>
                                    <span className="value">{item.supplier}</span>
                                </div>
                            </div>
                        </div>

                        <div className="card-footer">
                            <span className="last-updated">
                                Last updated: {item.lastUpdated || 'Just now'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {filteredInventory.length === 0 && (
                <div className="no-results">
                    <p>No items found matching your criteria</p>
                </div>
            )}
        </div>
    );
};

export default InventoryIntegration;