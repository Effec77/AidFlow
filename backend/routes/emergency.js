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

        // Save to database - map NLP analysis to expected schema
        const nlpData = aiResponse.analysis.nlp || {};
        
        // Extract emotion as string (handle various nested structures)
        let emotionStr = 'neutral';
        const emotionData = nlpData.sentiment?.emotion || nlpData.emotion;
        if (typeof emotionData === 'string') {
            emotionStr = emotionData;
        } else if (emotionData?.primary?.label) {
            // Handle { primary: { label: 'neutral', score: 0.5 } }
            emotionStr = emotionData.primary.label;
        } else if (typeof emotionData?.primary === 'string') {
            emotionStr = emotionData.primary;
        } else if (emotionData?.label) {
            // Handle { label: 'neutral', score: 0 }
            emotionStr = emotionData.label;
        }
        
        // Extract urgency (can be nested in nlpData.urgency)
        const urgencyLevel = nlpData.urgency?.level || 'medium';
        const urgencyScore = nlpData.urgency?.score || 0.5;
        
        // Extract keywords as string array from entities object
        let keywordsArr = [];
        const entities = nlpData.entities || {};
        
        // Handle entities as object with locations/persons/etc arrays
        if (entities && typeof entities === 'object' && !Array.isArray(entities)) {
            ['locations', 'persons', 'organizations', 'miscellaneous'].forEach(key => {
                if (Array.isArray(entities[key])) {
                    entities[key].forEach(item => {
                        if (typeof item === 'string') keywordsArr.push(item);
                        else if (item?.word) keywordsArr.push(item.word);
                        else if (item?.text) keywordsArr.push(item.text);
                    });
                }
            });
        } else if (Array.isArray(entities)) {
            // Handle entities as array
            entities.forEach(entity => {
                if (typeof entity === 'string') keywordsArr.push(entity);
                else if (entity?.word) keywordsArr.push(entity.word);
            });
        }
        
        const emergency = new Emergency({
            emergencyId: aiResponse.emergencyId,
            userId,
            location: { lat, lon, address },
            userMessage: message,
            aiAnalysis: {
                disaster: aiResponse.analysis.disaster,
                sentiment: {
                    urgency: urgencyLevel,
                    emotion: emotionStr,
                    keywords: keywordsArr,
                    score: urgencyScore
                },
                severity: aiResponse.analysis.severity
            },
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

/**
 * POST /api/emergency/analyze-image
 * Analyze disaster from image (Agent 2)
 */
router.post('/analyze-image', async (req, res) => {
    try {
        const { imageData, location, userId } = req.body;

        if (!imageData || !location) {
            return res.status(400).json({
                error: 'Missing required fields: imageData, location'
            });
        }

        console.log(`🖼️ Image analysis request from user ${userId} at ${location.lat}, ${location.lon}`);

        // Use Agent 2 for image-based disaster detection
        const imageAgent = new (await import('../services/imageDisasterDetection.js')).default();
        const detection = await imageAgent.detectDisasterFromImage(imageData, location);

        // Extract labels
        const labels = imageAgent.extractLabels(detection);

        res.status(200).json({
            success: true,
            detection: detection,
            labels: labels,
            message: 'Image analysis complete'
        });

    } catch (error) {
        console.error('❌ Image analysis error:', error.message);
        res.status(500).json({
            error: 'Failed to analyze image',
            details: error.message
        });
    }
});

/**
 * POST /api/emergency/reroute
 * Request re-routing for active emergency (Agent 3)
 */
router.post('/reroute/:emergencyId', async (req, res) => {
    try {
        const { emergencyId } = req.params;
        const { currentLocation } = req.body;

        const emergency = await Emergency.findOne({ emergencyId });
        if (!emergency) {
            return res.status(404).json({ error: 'Emergency not found' });
        }

        console.log(`🔄 Re-routing request for emergency ${emergencyId}`);

        // Use Agent 3 for smart re-routing
        const routingAgent = new (await import('../services/smartRouting.js')).default();
        const newRoute = await routingAgent.checkForReRouting(
            emergency.response.routing,
            currentLocation
        );

        if (newRoute) {
            // Update emergency with new route
            emergency.response.routing = newRoute;
            emergency.timeline.push({
                status: 'rerouted',
                timestamp: new Date(),
                notes: 'Route updated due to changing conditions'
            });
            await emergency.save();

            res.json({
                success: true,
                newRoute: newRoute,
                message: 'Route updated successfully'
            });
        } else {
            res.json({
                success: true,
                message: 'Current route is still optimal'
            });
        }

    } catch (error) {
        console.error('❌ Re-routing error:', error.message);
        res.status(500).json({
            error: 'Failed to re-route',
            details: error.message
        });
    }
});

export default router;
/**

 * POST /api/emergency/dispatch/:emergencyId
 * ONE-CLICK DISPATCH - Automates inventory allocation, routing, and dispatch
 */
router.post('/dispatch/:emergencyId', async (req, res) => {
    try {
        const { emergencyId } = req.params;
        const { adminId } = req.body;

        if (!adminId) {
            return res.status(400).json({
                error: 'Admin ID required for dispatch authorization'
            });
        }

        console.log(`🚀 Admin ${adminId} initiating dispatch for ${emergencyId}`);

        // Import dispatch service
        const DispatchService = (await import('../services/dispatchService.js')).default;
        const dispatchService = new DispatchService();

        // Execute automated dispatch
        const result = await dispatchService.dispatchEmergency(emergencyId, adminId);

        res.json(result);

    } catch (error) {
        console.error('❌ Dispatch error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/emergency/dispatch-status/:emergencyId
 * Get dispatch status and tracking information
 */
router.get('/dispatch-status/:emergencyId', async (req, res) => {
    try {
        const { emergencyId } = req.params;

        const DispatchService = (await import('../services/dispatchService.js')).default;
        const dispatchService = new DispatchService();

        const status = await dispatchService.getDispatchStatus(emergencyId);

        res.json(status);

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * PUT /api/emergency/update-status/:emergencyId
 * Update emergency status (en-route, arrived, completed)
 */
router.put('/update-status/:emergencyId', async (req, res) => {
    try {
        const { emergencyId } = req.params;
        const { status, notes, updatedBy } = req.body;

        const emergency = await Emergency.findOne({ emergencyId });
        if (!emergency) {
            return res.status(404).json({ error: 'Emergency not found' });
        }

        emergency.status = status;
        emergency.timeline.push({
            status,
            timestamp: new Date(),
            notes: notes || `Status updated to ${status}`,
            updatedBy
        });

        await emergency.save();

        res.json({
            success: true,
            emergencyId,
            status: emergency.status,
            timeline: emergency.timeline
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/emergency/active-dispatches
 * Get all active dispatches for real-time tracking
 */
router.get('/active-dispatches', async (req, res) => {
    try {
        // Include completed emergencies from last 24 hours for deletion
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const dispatches = await Emergency.find({
            $or: [
                { status: { $in: ['dispatched', 'en_route', 'delivered'] } },
                { status: 'completed', updatedAt: { $gte: oneDayAgo } }
            ]
        }).sort({ 'dispatchDetails.dispatchedAt': -1 });

        res.json({
            success: true,
            count: dispatches.length,
            dispatches: dispatches
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /api/emergency/:emergencyId
 * Delete any emergency (admin action)
 */
router.delete('/:emergencyId', async (req, res) => {
    try {
        const { emergencyId } = req.params;

        const emergency = await Emergency.findOne({ emergencyId });
        
        if (!emergency) {
            return res.status(404).json({
                success: false,
                error: 'Emergency not found'
            });
        }

        await Emergency.deleteOne({ emergencyId });

        res.json({
            success: true,
            message: 'Emergency deleted successfully',
            emergencyId
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * PUT /api/emergency/complete/:emergencyId
 * Mark emergency as completed with delivery confirmation
 */
router.put('/complete/:emergencyId', async (req, res) => {
    try {
        const { emergencyId } = req.params;
        const { deliveryNotes, completedBy } = req.body;

        const emergency = await Emergency.findOne({ emergencyId });
        
        if (!emergency) {
            return res.status(404).json({
                success: false,
                error: 'Emergency not found'
            });
        }

        // Update status to completed
        emergency.status = 'completed';
        
        // Add completion details
        if (emergency.dispatchDetails) {
            emergency.dispatchDetails.actualArrival = new Date();
            emergency.dispatchDetails.deliveryNotes = deliveryNotes || 'Resources delivered successfully';
        }

        // Add to timeline
        emergency.timeline.push({
            status: 'completed',
            timestamp: new Date(),
            notes: deliveryNotes || 'Emergency resolved. Resources delivered successfully.',
            updatedBy: completedBy
        });

        await emergency.save();

        res.json({
            success: true,
            message: 'Emergency marked as completed',
            emergency
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/emergency/completed
 * Get all completed emergencies
 */
router.get('/completed', async (req, res) => {
    try {
        const completedEmergencies = await Emergency.find({
            status: 'completed'
        }).sort({ updatedAt: -1 }).limit(50);

        res.json({
            success: true,
            count: completedEmergencies.length,
            emergencies: completedEmergencies
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
