import mongoose from 'mongoose';

const dispatchRequestSchema = new mongoose.Schema({
    emergencyId: {
        type: String,
        required: true,
        ref: 'Emergency'
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        required: true
    },
    requestedResources: [{
        name: String,
        quantity: Number,
        category: String
    }],
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'dispatched'],
        default: 'pending'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    requestedBy: {
        type: String,
        default: 'AI Decision Agent'
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedAt: Date,
    notes: String,
    reasoning: String
}, { timestamps: true });

export default mongoose.model('DispatchRequest', dispatchRequestSchema);