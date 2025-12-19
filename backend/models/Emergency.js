import mongoose from 'mongoose';

const WaypointSchema = new mongoose.Schema({
    lat: { type: Number, required: true },
    lon: { type: Number, required: true }
}, { _id: false });

const RouteSchema = new mongoose.Schema({
    distance: { type: Number, required: true },
    duration: { type: Number, required: true },
    eta: { type: Date },
    waypoints: [WaypointSchema] // Use the WaypointSchema
}, { _id: false });

const emergencyRequestSchema = new mongoose.Schema({
    emergencyId: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId, // Changed to ObjectId
        ref: 'User',
        required: true
    },
    location: {
        lat: { type: Number, required: true },
        lon: { type: Number, required: true },
        address: { type: String }
    },
    userMessage: {
        type: String,
        required: true,
        maxlength: 500
    },
    aiAnalysis: {
        disaster: {
            type: { type: String, enum: ['fire', 'flood', 'earthquake', 'landslide', 'storm', 'unknown'] },
            confidence: { type: Number, min: 0, max: 1 },
            indicators: [String],
            priority: { type: String, enum: ['low', 'medium', 'high', 'critical'] }
        },
        sentiment: {
            urgency: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
            emotion: { type: String },
            keywords: [String],
            score: { type: Number, min: 0, max: 1 }
        },
        severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] }
    },
    response: {
        resources: {
            immediate: [String],
            secondary: [String],
            quantities: { type: Map, of: Number }
        }
    },
    status: {
        type: String,
        enum: ['received', 'analyzing', 'dispatched', 'en_route', 'delivered', 'completed', 'cancelled'],
        default: 'received'
    },
    assignedTeam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    dispatchDetails: {
        dispatchedAt: Date,
        dispatchedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Changed to ObjectId
        centers: [{
            centerId: String,
            centerName: String,
            resources: [{
                itemId: String,
                name: String,
                category: String,
                quantity: Number,
                unit: String
            }],
            route: RouteSchema // Use the new RouteSchema
        }],
        totalResources: { type: Map, of: Number },
        estimatedArrival: Date,
        actualArrival: Date,
        deliveryNotes: String
    },
    satelliteData: {
        weather: mongoose.Schema.Types.Mixed,
        fires: [mongoose.Schema.Types.Mixed],
        satellite: mongoose.Schema.Types.Mixed
    },
    timeline: [{
        status: String,
        timestamp: { type: Date, default: Date.now },
        notes: String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }]
}, {
    timestamps: true
});

// Index for geospatial queries
emergencyRequestSchema.index({ "location.lat": 1, "location.lon": 1 });
emergencyRequestSchema.index({ status: 1, createdAt: -1 });
emergencyRequestSchema.index({ "aiAnalysis.severity": 1, createdAt: -1 });

const Emergency = mongoose.model('Emergency', emergencyRequestSchema);
export default Emergency;