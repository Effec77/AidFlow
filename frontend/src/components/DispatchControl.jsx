import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Send, Package, MapPin, Clock, CheckCircle, AlertTriangle, Navigation } from 'lucide-react';
import '../css/DispatchControl.css';

/**
 * Dispatch Control Component
 * One-click automated dispatch system
 */
const DispatchControl = ({ emergency, onDispatchComplete }) => {
    const navigate = useNavigate();
    const [dispatching, setDispatching] = useState(false);
    const [dispatchResult, setDispatchResult] = useState(null);
    const [error, setError] = useState(null);

    const handleDispatch = async () => {
        setDispatching(true);
        setError(null);

        try {
            console.log('🚀 Initiating dispatch for:', emergency.emergencyId);

            const response = await axios.post(
                `http://localhost:5000/api/emergency/dispatch/${emergency.emergencyId}`,
                {
                    adminId: 'admin_001' // In production, get from auth context
                }
            );

            console.log('✅ Dispatch successful:', response.data);
            setDispatchResult(response.data);

            if (onDispatchComplete) {
                onDispatchComplete(response.data);
            }

        } catch (err) {
            console.error('❌ Dispatch failed:', err);
            setError(err.response?.data?.error || err.message);
        } finally {
            setDispatching(false);
        }
    };

    // If already dispatched, show tracking info
    if (emergency.status === 'dispatched' || dispatchResult) {
        const dispatch = dispatchResult?.dispatch || emergency.dispatchDetails;

        return (
            <div className="dispatch-tracking">
                <div className="tracking-header">
                    <CheckCircle className="success-icon" />
                    <h3>Resources Dispatched</h3>
                </div>

                <div className="tracking-info">
                    <div className="info-row">
                        <Clock className="icon" />
                        <div>
                            <span className="label">Dispatched At</span>
                            <span className="value">
                                {new Date(dispatch.dispatchedAt).toLocaleString()}
                            </span>
                        </div>
                    </div>

                    <div className="info-row">
                        <MapPin className="icon" />
                        <div>
                            <span className="label">Estimated Arrival</span>
                            <span className="value">
                                {new Date(dispatch.estimatedArrival).toLocaleTimeString()}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="dispatch-centers">
                    <h4>Response Centers</h4>
                    {dispatch.centers?.map((center, idx) => (
                        <div key={idx} className="center-card">
                            <div className="center-header">
                                <Package className="center-icon" />
                                <div>
                                    <h5>{center.centerName}</h5>
                                    <span className="distance">
                                        {center.route?.distance?.toFixed(2)} km • 
                                        {Math.round(center.route?.duration)} min
                                    </span>
                                </div>
                            </div>

                            <div className="resources-list">
                                <strong>Resources:</strong>
                                <ul>
                                    {center.resources?.map((resource, ridx) => (
                                        <li key={ridx}>
                                            {resource.quantity} {resource.unit} of {resource.name}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>

                {dispatch.allocation?.unmetNeeds?.length > 0 && (
                    <div className="unmet-needs">
                        <AlertTriangle className="warning-icon" />
                        <div>
                            <strong>Partial Allocation</strong>
                            <p>Some resources unavailable in inventory:</p>
                            <ul>
                                {dispatch.allocation.unmetNeeds.map((need, idx) => (
                                    <li key={idx}>
                                        {need.resource}: {need.shortfall} units short
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                <button 
                    className="track-dispatch-btn"
                    onClick={() => navigate('/dispatch-tracker')}
                >
                    <Navigation className="button-icon" />
                    <span>Track Dispatch Live</span>
                </button>
            </div>
        );
    }

    // Show dispatch button
    return (
        <div className="dispatch-control">
            <div className="dispatch-info">
                <h3>Ready to Dispatch</h3>
                <p>
                    Click below to automatically allocate resources from inventory,
                    calculate optimal routes, and dispatch emergency response teams.
                </p>

                <div className="required-resources">
                    <h4>Required Resources:</h4>
                    <ul>
                        {emergency.response?.resources?.immediate?.map((resource, idx) => (
                            <li key={idx}>{resource}</li>
                        ))}
                    </ul>
                </div>
            </div>

            {error && (
                <div className="dispatch-error">
                    <AlertTriangle className="error-icon" />
                    <span>{error}</span>
                </div>
            )}

            <button
                className={`dispatch-button ${dispatching ? 'dispatching' : ''}`}
                onClick={handleDispatch}
                disabled={dispatching}
            >
                {dispatching ? (
                    <>
                        <div className="spinner" />
                        <span>Dispatching Resources...</span>
                    </>
                ) : (
                    <>
                        <Send className="button-icon" />
                        <span>Dispatch Emergency Response</span>
                    </>
                )}
            </button>

            {dispatching && (
                <div className="dispatch-progress">
                    <div className="progress-step">
                        <div className="step-icon">✓</div>
                        <span>Analyzing emergency requirements...</span>
                    </div>
                    <div className="progress-step">
                        <div className="step-icon active">⟳</div>
                        <span>Checking inventory availability...</span>
                    </div>
                    <div className="progress-step">
                        <div className="step-icon">○</div>
                        <span>Calculating optimal routes...</span>
                    </div>
                    <div className="progress-step">
                        <div className="step-icon">○</div>
                        <span>Updating inventory...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DispatchControl;
