import express from 'express';
import SeverityLog from '../models/SeverityLog.js';
import DisasterZone from '../models/DisasterZone.js';
import RoutingHistory from '../models/RoutingHistory.js';
import AgentOutput from '../models/AgentOutput.js';

const router = express.Router();

// ============================================
// SEVERITY LOGS CRUD
// ============================================

/**
 * CREATE - Add new severity log
 */
router.post('/severity-logs', async (req, res) => {
    try {
        const logId = `SEV_${Date.now()}`;
        const severityLog = new SeverityLog({
            logId,
            ...req.body
        });
        await severityLog.save();
        res.status(201).json({ success: true, data: severityLog });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * READ - Get all severity logs with filters
 */
router.get('/severity-logs', async (req, res) => {
    try {
        const { agentType, severity, disasterType, status, limit = 50 } = req.query;
        
        const query = {};
        if (agentType) query.agentType = agentType;
        if (severity) query.severity = severity;
        if (disasterType) query.disasterType = disasterType;
        if (status) query.status = status;

        const logs = await SeverityLog.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json({ success: true, count: logs.length, data: logs });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * READ - Get single severity log
 */
router.get('/severity-logs/:logId', async (req, res) => {
    try {
        const log = await SeverityLog.findOne({ logId: req.params.logId });
        if (!log) return res.status(404).json({ error: 'Log not found' });
        res.json({ success: true, data: log });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * UPDATE - Update severity log
 */
router.put('/severity-logs/:logId', async (req, res) => {
    try {
        const log = await SeverityLog.findOneAndUpdate(
            { logId: req.params.logId },
            req.body,
            { new: true, runValidators: true }
        );
        if (!log) return res.status(404).json({ error: 'Log not found' });
        res.json({ success: true, data: log });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE - Delete severity log
 */
router.delete('/severity-logs/:logId', async (req, res) => {
    try {
        const log = await SeverityLog.findOneAndDelete({ logId: req.params.logId });
        if (!log) return res.status(404).json({ error: 'Log not found' });
        res.json({ success: true, message: 'Log deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// DISASTER ZONES CRUD
// ============================================

/**
 * CREATE - Add new disaster zone
 */
router.post('/disaster-zones', async (req, res) => {
    try {
        const zoneId = `ZONE_${Date.now()}`;
        const zone = new DisasterZone({
            zoneId,
            ...req.body
        });
        await zone.save();
        res.status(201).json({ success: true, data: zone });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * READ - Get all disaster zones
 */
router.get('/disaster-zones', async (req, res) => {
    try {
        const { status, severity, disasterType, limit = 50 } = req.query;
        
        const query = {};
        if (status) query.status = status;
        if (severity) query.severity = severity;
        if (disasterType) query.disasterType = disasterType;

        const zones = await DisasterZone.find(query)
            .sort({ severity: -1, createdAt: -1 })
            .limit(parseInt(limit));

        res.json({ success: true, count: zones.length, data: zones });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * READ - Get single disaster zone
 */
router.get('/disaster-zones/:zoneId', async (req, res) => {
    try {
        const zone = await DisasterZone.findOne({ zoneId: req.params.zoneId });
        if (!zone) return res.status(404).json({ error: 'Zone not found' });
        res.json({ success: true, data: zone });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * UPDATE - Update disaster zone
 */
router.put('/disaster-zones/:zoneId', async (req, res) => {
    try {
        const zone = await DisasterZone.findOneAndUpdate(
            { zoneId: req.params.zoneId },
            req.body,
            { new: true, runValidators: true }
        );
        if (!zone) return res.status(404).json({ error: 'Zone not found' });
        res.json({ success: true, data: zone });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE - Delete disaster zone
 */
router.delete('/disaster-zones/:zoneId', async (req, res) => {
    try {
        const zone = await DisasterZone.findOneAndDelete({ zoneId: req.params.zoneId });
        if (!zone) return res.status(404).json({ error: 'Zone not found' });
        res.json({ success: true, message: 'Zone deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// ROUTING HISTORY CRUD
// ============================================

/**
 * CREATE - Add new route
 */
router.post('/routing-history', async (req, res) => {
    try {
        const routeId = `ROUTE_${Date.now()}`;
        const route = new RoutingHistory({
            routeId,
            ...req.body
        });
        await route.save();
        res.status(201).json({ success: true, data: route });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * READ - Get all routes
 */
router.get('/routing-history', async (req, res) => {
    try {
        const { status, severity, emergencyId, limit = 50 } = req.query;
        
        const query = {};
        if (status) query.status = status;
        if (severity) query.severity = severity;
        if (emergencyId) query.emergencyId = emergencyId;

        const routes = await RoutingHistory.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json({ success: true, count: routes.length, data: routes });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * READ - Get single route
 */
router.get('/routing-history/:routeId', async (req, res) => {
    try {
        const route = await RoutingHistory.findOne({ routeId: req.params.routeId });
        if (!route) return res.status(404).json({ error: 'Route not found' });
        res.json({ success: true, data: route });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * UPDATE - Update route
 */
router.put('/routing-history/:routeId', async (req, res) => {
    try {
        const route = await RoutingHistory.findOneAndUpdate(
            { routeId: req.params.routeId },
            req.body,
            { new: true, runValidators: true }
        );
        if (!route) return res.status(404).json({ error: 'Route not found' });
        res.json({ success: true, data: route });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE - Delete route (or mark as expired)
 */
router.delete('/routing-history/:routeId', async (req, res) => {
    try {
        const route = await RoutingHistory.findOneAndDelete({ routeId: req.params.routeId });
        if (!route) return res.status(404).json({ error: 'Route not found' });
        res.json({ success: true, message: 'Route deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// AGENT OUTPUTS CRUD
// ============================================

/**
 * CREATE - Add new agent output
 */
router.post('/agent-outputs', async (req, res) => {
    try {
        const outputId = `OUT_${Date.now()}`;
        const output = new AgentOutput({
            outputId,
            ...req.body
        });
        await output.save();
        res.status(201).json({ success: true, data: output });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * READ - Get all agent outputs
 */
router.get('/agent-outputs', async (req, res) => {
    try {
        const { agentId, status, emergencyId, limit = 50 } = req.query;
        
        const query = {};
        if (agentId) query.agentId = agentId;
        if (status) query.status = status;
        if (emergencyId) query['linkedEntities.emergencyId'] = emergencyId;

        const outputs = await AgentOutput.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json({ success: true, count: outputs.length, data: outputs });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * READ - Get single agent output
 */
router.get('/agent-outputs/:outputId', async (req, res) => {
    try {
        const output = await AgentOutput.findOne({ outputId: req.params.outputId });
        if (!output) return res.status(404).json({ error: 'Output not found' });
        res.json({ success: true, data: output });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * UPDATE - Update agent output
 */
router.put('/agent-outputs/:outputId', async (req, res) => {
    try {
        const output = await AgentOutput.findOneAndUpdate(
            { outputId: req.params.outputId },
            req.body,
            { new: true, runValidators: true }
        );
        if (!output) return res.status(404).json({ error: 'Output not found' });
        res.json({ success: true, data: output });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE - Delete agent output
 */
router.delete('/agent-outputs/:outputId', async (req, res) => {
    try {
        const output = await AgentOutput.findOneAndDelete({ outputId: req.params.outputId });
        if (!output) return res.status(404).json({ error: 'Output not found' });
        res.json({ success: true, message: 'Output deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// ANALYTICS & AGGREGATIONS
// ============================================

/**
 * Get severity statistics
 */
router.get('/analytics/severity-stats', async (req, res) => {
    try {
        const stats = await SeverityLog.aggregate([
            {
                $group: {
                    _id: {
                        severity: '$severity',
                        agentType: '$agentType'
                    },
                    count: { $sum: 1 },
                    avgConfidence: { $avg: '$confidence' },
                    avgScore: { $avg: '$severityScore' }
                }
            }
        ]);
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get disaster zone statistics
 */
router.get('/analytics/zone-stats', async (req, res) => {
    try {
        const stats = await DisasterZone.aggregate([
            {
                $group: {
                    _id: {
                        disasterType: '$disasterType',
                        severity: '$severity',
                        status: '$status'
                    },
                    count: { $sum: 1 },
                    totalAffectedPopulation: { $sum: '$affectedPopulation.estimated' }
                }
            }
        ]);
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get routing statistics
 */
router.get('/analytics/routing-stats', async (req, res) => {
    try {
        const stats = await RoutingHistory.aggregate([
            {
                $group: {
                    _id: {
                        status: '$status',
                        severity: '$severity'
                    },
                    count: { $sum: 1 },
                    avgDistance: { $avg: '$routeData.distance' },
                    avgDuration: { $avg: '$routeData.duration' }
                }
            }
        ]);
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST - Calculate route (Agent 3 functionality) - PRODUCTION GRADE
 */
router.post('/calculate-route', async (req, res) => {
    try {
        const { origin, destination, options } = req.body;
        
        // Validate input
        if (!origin || !destination) {
            return res.status(400).json({ 
                success: false,
                error: 'Origin and destination required',
                example: {
                    origin: { lat: 30.7171, lon: 76.8537, name: 'Response Center' },
                    destination: { lat: 30.7024, lon: 76.864, name: 'Emergency Location' }
                }
            });
        }

        // Validate coordinates
        if (!origin.lat || !origin.lon || !destination.lat || !destination.lon) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid coordinates. Both origin and destination must have lat and lon' 
            });
        }

        console.log(`🗺️ Route request: [${origin.lat}, ${origin.lon}] → [${destination.lat}, ${destination.lon}]`);

        // Import routing service
        const RoutingService = (await import('../services/routingService.js')).default;
        const routingService = new RoutingService();
        
        // Calculate route
        const result = await routingService.calculateRoute(origin, destination, options || {});
        
        console.log(`✅ Route calculated: ${result.route.waypoints?.length || 0} waypoints, ${result.route.distance?.toFixed(2) || 0} km`);
        
        res.json(result);
    } catch (error) {
        console.error('❌ Route calculation error:', error);
        res.status(500).json({ 
            success: false,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

export default router;