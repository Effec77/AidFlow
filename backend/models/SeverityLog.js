import mongoose from 'mongoose';

/**
 * Severity Log Model
 * Stores severity predictions from both NLP and CV agents
 */
const severityLogSchema = new mongoose.Schema({
    logId: {
        type: String,
        required: true,
        unique: true
    },
    agentType: {
        type: String,
        required: true,
        enum: ['nlp_agent', 'cv_agent', 'combined']
    },
    disasterType: {
        type: String,
        required: true,
        enum: ['fire', 'flood', 'earthquake', 'landslide', 'storm', 'cyclone', 'tsunami', 'unknown']
    },
    severity: {
        type: String,
        required: true,
        enum: ['low', 'medium', 'high', 'critical']
    },
    severityScore: {
        type: Number,
        required: true,
        min: 0,
        max: 1
    },
    confidence: {
        type: Number,
        required: true,
        min: 0,
        max: 1
    },
    location: {
        lat: { type: Number, required: true },
        lon: { type: Number, required: true },
        address: String
    },
    inputData: {
        text: String,
        imageUrl: String,
        imageMetadata: mongoose.Schema.Types.Mixed
    },
    predictions: {
        labels: [String],
        probabilities: [Number],
        features: mongoose.Schema.Types.Mixed
    },
    resourcesAllocated: {
        triggered: { type: Boolean, default: false },
        items: [String],
        quantities: { type: Map, of: Number }
    },
    status: {
        type: String,
        enum: ['pending', 'processed', 'resources_allocated', 'completed', 'archived'],
        default: 'pending'
    },
    userId: String,
    notes: String
}, {
    timestamps: true
});

// Indexes for efficient queries
severityLogSchema.index({ agentType: 1, createdAt: -1 });
severityLogSchema.index({ severity: 1, status: 1 });
severityLogSchema.index({ 'location.lat': 1, 'location.lon': 1 });
severityLogSchema.index({ disasterType: 1, createdAt: -1 });

const SeverityLog = mongoose.model('SeverityLog', severityLogSchema);
export default SeverityLog;