import mongoose from 'mongoose';

/**
 * Routing History Model
 * Stores all routing requests and suggestions
 */
const routingHistorySchema = new mongoose.Schema({
    routeId: {
        type: String,
        required: true,
        unique: true
    },
    requestType: {
        type: String,
        enum: ['emergency_response', 'evacuation', 'resource_delivery', 'reconnaissance', 'general'],
        default: 'emergency_response'
    },
    origin: {
        lat: { type: Number, required: true },
        lon: { type: Number, required: true },
        name: String,
        type: String // 'response_center', 'warehouse', 'hospital', etc.
    },
    destination: {
        lat: { type: Number, required: true },
        lon: { type: Number, required: true },
        name: String,
        disasterZoneId: String
    },
    routeData: {
        distance: Number, // in kilometers
        duration: Number, // in minutes
        waypoints: [{
            lat: Number,
            lon: Number,
            action: String,
            eta: Date
        }],
        geometry: mongoose.Schema.Types.Mixed // GeoJSON or encoded polyline
    },
    routingFactors: {
        traffic: Number,
        weather: Number,
        roadConditions: Number,
        hazards: [String],
        disasterZones: [String],
        urgency: Number
    },
    alternatives: [{
        distance: Number,
        duration: Number,
        score: Number,
        reason: String
    }],
    status: {
        type: String,
        enum: ['planned', 'active', 'rerouted', 'completed', 'cancelled', 'expired'],
        default: 'planned'
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical']
    },
    vehicle: {
        type: String,
        id: String,
        currentLocation: {
            lat: Number,
            lon: Number,
            timestamp: Date
        }
    },
    reroutingHistory: [{
        timestamp: Date,
        reason: String,
        oldRoute: mongoose.Schema.Types.Mixed,
        newRoute: mongoose.Schema.Types.Mixed
    }],
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Changed to ObjectId
    emergencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Emergency' }, // Changed to ObjectId
    expiresAt: Date,
    metadata: mongoose.Schema.Types.Mixed
}, {
    timestamps: true
});

// Indexes
routingHistorySchema.index({ status: 1, createdAt: -1 });
routingHistorySchema.index({ emergencyId: 1 });
routingHistorySchema.index({ userId: 1, createdAt: -1 });
routingHistorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

const RoutingHistory = mongoose.model('RoutingHistory', routingHistorySchema);
export default RoutingHistory;