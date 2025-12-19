import mongoose from 'mongoose';

/**
 * Agent Output Model
 * Stores outputs from all three AI agents
 */
const agentOutputSchema = new mongoose.Schema({
    outputId: {
        type: String,
        required: true,
        unique: true
    },
    agentId: {
        type: String,
        required: true,
        enum: ['agent_1_nlp', 'agent_2_cv', 'agent_3_routing']
    },
    agentName: {
        type: String,
        required: true
    },
    inputData: mongoose.Schema.Types.Mixed,
    outputData: mongoose.Schema.Types.Mixed,
    processingTime: Number, // in milliseconds
    confidence: {
        type: Number,
        min: 0,
        max: 1
    },
    status: {
        type: String,
        enum: ['success', 'partial', 'failed', 'timeout'],
        default: 'success'
    },
    errors: [String],
    warnings: [String],
    metadata: {
        modelVersion: String,
        apiVersion: String,
        environment: String,
        timestamp: Date
    },
    linkedEntities: {
        emergencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Emergency' }, // Changed to ObjectId
        severityLogId: { type: mongoose.Schema.Types.ObjectId, ref: 'SeverityLog' }, // Changed to ObjectId
        disasterZoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'DisasterZone' }, // Changed to ObjectId
        routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'RoutingHistory' } // Changed to ObjectId
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Changed to ObjectId
}, {
    timestamps: true
});

// Indexes
agentOutputSchema.index({ agentId: 1, createdAt: -1 });
agentOutputSchema.index({ 'linkedEntities.emergencyId': 1 });
agentOutputSchema.index({ status: 1, createdAt: -1 });

const AgentOutput = mongoose.model('AgentOutput', agentOutputSchema);
export default AgentOutput;