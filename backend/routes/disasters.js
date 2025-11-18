import express from 'express';
import DisasterZone from '../models/DisasterZone.js';
import Emergency from '../models/Emergency.js';

const router = express.Router();

// ============================================
// DISASTER ZONES CRUD
// ============================================

/**
 * GET /api/disasters/zones
 * Get all disaster zones
 */
router.get('/zones', async (req, res) => {
    try {
        const { status, type, severity } = req.query;
        const query = {};
        
        if (status) query.status = status;
        if (type) query.type = type;
        if (severity) query.severity = severity;

        const zones = await DisasterZone.find(query).sort({ createdAt: -1 });
        
        res.json({
            success: true,
            count: zones.length,
            zones
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/disasters/zones
 * Create new disaster zone
 */
router.post('/zones', async (req, res) => {
    try {
        const {
            name,
            type,
            severity,
            location,
            radius,
            description,
            affectedPopulation,
            estimatedDamage,
            weatherConditions,
            createdBy
        } = req.body;

        const zone = new DisasterZone({
            zoneId: `ZONE_${Date.now()}`,
            name,
            disasterType: type,
            severity,
            location: {
                center: {
                    lat: location.lat,
                    lon: location.lon
                },
                radius: (radius || 1000) / 1000, // Convert meters to km
                affectedArea: Math.PI * Math.pow((radius || 1000) / 1000, 2)
            },
            affectedPopulation: {
                estimated: affectedPopulation || 0
            },
            status: 'active',
            detectedBy: {
                agents: ['admin_system'],
                sources: ['manual_entry'],
                firstDetected: new Date(),
                lastUpdated: new Date()
            },
            alerts: [{
                level: severity === 'critical' ? 'critical' : severity === 'high' ? 'danger' : 'warning',
                message: description || `${type} disaster zone created`,
                timestamp: new Date()
            }],
            metadata: {
                description,
                estimatedDamage,
                weatherConditions,
                createdBy: createdBy || 'admin',
                address: location.address
            }
        });

        await zone.save();

        res.status(201).json({
            success: true,
            message: 'Disaster zone created successfully',
            zone
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT /api/disasters/zones/:zoneId
 * Update disaster zone
 */
router.put('/zones/:zoneId', async (req, res) => {
    try {
        const { zoneId } = req.params;
        const updates = req.body;

        const zone = await DisasterZone.findOne({ zoneId });
        if (!zone) {
            return res.status(404).json({ error: 'Disaster zone not found' });
        }

        // Update fields
        if (updates.severity) zone.severity = updates.severity;
        if (updates.status) zone.status = updates.status;
        if (updates.affectedPopulation) {
            zone.affectedPopulation.estimated = updates.affectedPopulation;
        }
        
        // Update detection timestamp
        zone.detectedBy.lastUpdated = new Date();
        
        // Add alert for update
        zone.alerts.push({
            level: 'info',
            message: updates.description || 'Zone information updated',
            timestamp: new Date()
        });

        await zone.save();

        res.json({
            success: true,
            message: 'Disaster zone updated successfully',
            zone
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/disasters/zones/:zoneId
 * Resolve disaster zone
 */
router.delete('/zones/:zoneId', async (req, res) => {
    try {
        const { zoneId } = req.params;
        const { resolvedBy, resolutionNotes } = req.body;

        const zone = await DisasterZone.findOne({ zoneId });
        if (!zone) {
            return res.status(404).json({ error: 'Disaster zone not found' });
        }

        // Mark as resolved instead of deleting
        zone.status = 'resolved';
        zone.detectedBy.lastUpdated = new Date();
        
        // Add resolution metadata
        if (!zone.metadata) zone.metadata = {};
        zone.metadata.resolvedAt = new Date();
        zone.metadata.resolvedBy = resolvedBy || 'admin';
        zone.metadata.resolutionNotes = resolutionNotes || 'Disaster zone resolved';
        
        zone.alerts.push({
            level: 'info',
            message: resolutionNotes || 'Disaster zone marked as resolved',
            timestamp: new Date()
        });

        await zone.save();

        res.json({
            success: true,
            message: 'Disaster zone resolved successfully',
            zone
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// DISASTER ANALYTICS
// ============================================

/**
 * GET /api/disasters/analytics
 * Get disaster analytics and statistics
 */
router.get('/analytics', async (req, res) => {
    try {
        const totalZones = await DisasterZone.countDocuments();
        const activeZones = await DisasterZone.countDocuments({ status: 'active' });
        const resolvedZones = await DisasterZone.countDocuments({ status: 'resolved' });

        // Count by type
        const typeStats = await DisasterZone.aggregate([
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);

        // Count by severity
        const severityStats = await DisasterZone.aggregate([
            { $group: { _id: '$severity', count: { $sum: 1 } } }
        ]);

        // Recent zones (last 7 days)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentZones = await DisasterZone.countDocuments({
            createdAt: { $gte: weekAgo }
        });

        // Total affected population
        const populationStats = await DisasterZone.aggregate([
            { $group: { _id: null, total: { $sum: '$affectedPopulation' } } }
        ]);

        res.json({
            success: true,
            analytics: {
                totalZones,
                activeZones,
                resolvedZones,
                recentZones,
                totalAffectedPopulation: populationStats[0]?.total || 0,
                typeBreakdown: typeStats,
                severityBreakdown: severityStats
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// INTEGRATION WITH EMERGENCIES
// ============================================

/**
 * GET /api/disasters/zones/:zoneId/emergencies
 * Get all emergencies linked to a disaster zone
 */
router.get('/zones/:zoneId/emergencies', async (req, res) => {
    try {
        const { zoneId } = req.params;
        
        const emergencies = await Emergency.find({ disasterZoneId: zoneId })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: emergencies.length,
            emergencies
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
