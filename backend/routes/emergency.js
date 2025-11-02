import express from 'express';
import EmergencyAIAgent from '../services/aiAgent.js';
import Emergency from '../models/Emergency.js';
import { InventoryItem } from '../models/Inventory.js';

const router = express.Router();
const aiAgent = new EmergencyAIAgent();

/**
 * POST /api/emergency/request
 * Submit an emergency request with location and message
 */
router.post('/request', async (req, res) => {
    try {
        const { lat, lon, message, userId, address } = req.body;

        // Validate input
        if (!lat || !lon || !message || !userId) {
            return res.status(400).json({
                error: 'Missing required fields: lat, lon, message, userId'
            });
        }

        console.log(`🚨 New emergency request from user ${userId} at ${lat}, ${lon}`);

        // Process with AI Agent
        const emergencyData = { lat, lon, message, timestamp: new Date() };
        const aiResponse = await aiAgent.processEmergencyRequest(emergencyData);

        // Save to database
        const emergency = new Emergency({
            emergencyId: aiResponse.emergencyId,
            userId,
            location: { lat, lon, address },
            userMessage: message,
            aiAnalysis: aiResponse.analysis,
            response: aiResponse.response,
            satelliteData: aiResponse.satelliteData || {},
            timeline: [{
                status: 'received',
                timestamp: new Date(),
                notes: 'Emergency request received and analyzed by AI'
            }]
        });

        await emergency.save();

        // Update inventory (reserve resources)
        await reserveResources(aiResponse.response.resources);

        res.status(201).json({
            success: true,
            emergencyId: aiResponse.emergencyId,
            analysis: aiResponse.analysis,
            response: aiResponse.response,
            message: 'Emergency request processed successfully. Help is on the way!'
        });

    } catch (error) {
        console.error('❌ Emergency request error:', error.message);
        res.status(500).json({
            error: 'Failed to process emergency request',
            details: error.message
        });
    }
});

/**
 * GET /api/emergency/status/:emergencyId
 * Get status of an emergency request
 */
router.get('/status/:emergencyId', async (req, res) => {
    try {
        const { emergencyId } = req.params;
        
        const emergency = await Emergency.findOne({ emergencyId })
            // .populate('userId', 'firstName lastName') // Commented out since userId is now string
            .populate('assignedTeam', 'firstName lastName role');

        if (!emergency) {
            return res.status(404).json({ error: 'Emergency request not found' });
        }

        res.json({
            emergencyId: emergency.emergencyId,
            status: emergency.status,
            location: emergency.location,
            analysis: emergency.aiAnalysis,
            response: emergency.response,
            timeline: emergency.timeline,
            assignedTeam: emergency.assignedTeam,
            createdAt: emergency.createdAt,
            updatedAt: emergency.updatedAt
        });

    } catch (error) {
        console.error('❌ Status check error:', error.message);
        res.status(500).json({ error: 'Failed to get emergency status' });
    }
});

/**
 * GET /api/emergency/active
 * Get all active emergency requests (for admin dashboard)
 */
router.get('/active', async (req, res) => {
    try {
        const activeEmergencies = await Emergency.find({
            status: { $in: ['received', 'analyzing', 'dispatched', 'en_route'] }
        })
        // .populate('userId', 'firstName lastName') // Commented out since userId is now string
        .populate('assignedTeam', 'firstName lastName role')
        .sort({ 'aiAnalysis.severity': -1, createdAt: -1 });

        res.json({
            count: activeEmergencies.length,
            emergencies: activeEmergencies
        });

    } catch (error) {
        console.error('❌ Active emergencies error:', error.message);
        res.status(500).json({ error: 'Failed to get active emergencies' });
    }
});

/**
 * PUT /api/emergency/update/:emergencyId
 * Update emergency status (for admin/responders)
 */
router.put('/update/:emergencyId', async (req, res) => {
    try {
        const { emergencyId } = req.params;
        const { status, notes, assignedTeam, updatedBy } = req.body;

        const emergency = await Emergency.findOne({ emergencyId });
        if (!emergency) {
            return res.status(404).json({ error: 'Emergency request not found' });
        }

        // Update status
        if (status) {
            emergency.status = status;
        }

        // Assign team
        if (assignedTeam) {
            emergency.assignedTeam = assignedTeam;
        }

        // Add timeline entry
        emergency.timeline.push({
            status: status || emergency.status,
            timestamp: new Date(),
            notes: notes || `Status updated to ${status}`,
            updatedBy
        });

        await emergency.save();

        res.json({
            success: true,
            emergencyId,
            status: emergency.status,
            message: 'Emergency status updated successfully'
        });

    } catch (error) {
        console.error('❌ Update emergency error:', error.message);
        res.status(500).json({ error: 'Failed to update emergency status' });
    }
});

/**
 * GET /api/emergency/analytics
 * Get emergency analytics for dashboard
 */
router.get('/analytics', async (req, res) => {
    try {
        const analytics = await Promise.all([
            // Total emergencies by status
            Emergency.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            
            // Emergencies by disaster type
            Emergency.aggregate([
                { $group: { _id: '$aiAnalysis.disaster.type', count: { $sum: 1 } } }
            ]),
            
            // Emergencies by severity
            Emergency.aggregate([
                { $group: { _id: '$aiAnalysis.severity', count: { $sum: 1 } } }
            ]),
            
            // Recent emergencies (last 24 hours)
            Emergency.countDocuments({
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            })
        ]);

        res.json({
            byStatus: analytics[0],
            byDisasterType: analytics[1],
            bySeverity: analytics[2],
            last24Hours: analytics[3]
        });

    } catch (error) {
        console.error('❌ Analytics error:', error.message);
        res.status(500).json({ error: 'Failed to get emergency analytics' });
    }
});

// Helper function to reserve resources
async function reserveResources(resourcePlan) {
    try {
        const resourcesToReserve = [...resourcePlan.immediate, ...resourcePlan.secondary];
        
        for (const resourceName of resourcesToReserve) {
            const quantity = resourcePlan.quantities[resourceName] || 1;
            
            // Normalize resource name for better matching
            const normalizedResourceName = resourceName.replace(/_/g, ' ');
            
            const item = await InventoryItem.findOne({ 
                $or: [
                    { name: { $regex: resourceName, $options: 'i' } },
                    { name: { $regex: normalizedResourceName, $options: 'i' } },
                    { name: { $regex: resourceName.replace(/_/g, ''), $options: 'i' } }
                ]
            });
            
            if (item && item.currentStock >= quantity) {
                item.currentStock -= quantity;
                await item.save();
                console.log(`📦 Reserved ${quantity} ${resourceName}`);
            } else {
                console.warn(`⚠️ Insufficient stock for ${resourceName}`);
            }
        }
    } catch (error) {
        console.error('❌ Resource reservation error:', error.message);
    }
}

export default router;