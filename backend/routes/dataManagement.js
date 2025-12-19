import express from 'express';
import { InventoryItem, Location, Donation, Request } from '../models/Inventory.js';
import Emergency from '../models/Emergency.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// **********************************************
// ********* LOCATION MANAGEMENT ****************
// **********************************************

/**
 * POST /api/data/locations
 * Add new location (Admin/Branch Manager only)
 */
router.post('/locations', protect, authorize('admin', 'branch manager'), async (req, res) => {
    try {
        const { name, type, capacity, coordinates } = req.body;
        
        // Validate required fields
        if (!name || !type || !coordinates) {
            return res.status(400).json({ 
                error: 'Missing required fields: name, type, coordinates' 
            });
        }

        // Default to Punjab coordinates if not provided
        const locationData = {
            name,
            type,
            capacity: capacity || '50%',
            coordinates: {
                lat: coordinates.lat || 30.7333, // Default to Chandigarh
                lon: coordinates.lon || 76.7794
            }
        };

        const location = new Location(locationData);
        await location.save();

        res.status(201).json({
            success: true,
            message: 'Location added successfully',
            location
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Location name already exists' });
        }
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/data/locations
 * Get all locations
 */
router.get('/locations', protect, async (req, res) => {
    try {
        const locations = await Location.find({}).sort({ name: 1 });
        res.json({
            success: true,
            count: locations.length,
            locations
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// **********************************************
// ********* INVENTORY MANAGEMENT ***************
// **********************************************

/**
 * POST /api/data/inventory
 * Add new inventory item (Admin/Branch Manager only)
 */
router.post('/inventory', protect, authorize('admin', 'branch manager'), async (req, res) => {
    try {
        const {
            name,
            category,
            currentStock,
            minThreshold,
            maxCapacity,
            unit,
            location,
            cost,
            supplier
        } = req.body;

        // Validate required fields
        if (!name || !category || !unit || !location || !supplier) {
            return res.status(400).json({ 
                error: 'Missing required fields: name, category, unit, location, supplier' 
            });
        }

        // Validate category
        const validCategories = ['Medical', 'Food', 'Shelter', 'Equipment', 'Water'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({ 
                error: `Invalid category. Must be one of: ${validCategories.join(', ')}` 
            });
        }

        // Find location by name or ID
        let locationRef;
        if (location.match(/^[0-9a-fA-F]{24}$/)) {
            // It's an ObjectId
            locationRef = await Location.findById(location);
        } else {
            // It's a location name
            locationRef = await Location.findOne({ name: location });
        }

        if (!locationRef) {
            return res.status(400).json({ error: 'Location not found' });
        }

        // Determine status based on stock levels
        const stock = currentStock || 0;
        const minThresh = minThreshold || 0;
        let status = 'adequate';
        if (stock === 0) status = 'critical';
        else if (stock < minThresh) status = 'low';

        const inventoryItem = new InventoryItem({
            name,
            category,
            currentStock: stock,
            minThreshold: minThresh,
            maxCapacity: maxCapacity || 1000,
            unit,
            location: locationRef._id,
            status,
            cost: cost || 0,
            supplier
        });

        await inventoryItem.save();

        res.status(201).json({
            success: true,
            message: 'Inventory item added successfully',
            item: inventoryItem
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// **********************************************
// ********* USER MANAGEMENT ********************
// **********************************************

/**
 * POST /api/data/users
 * Add new user (Admin only)
 */
router.post('/users', protect, authorize('admin'), async (req, res) => {
    try {
        const {
            username,
            password,
            firstName,
            lastName,
            role,
            country,
            state,
            city,
            address,
            companyType,
            occupation,
            volunteerSkills
        } = req.body;

        // Validate required fields
        if (!username || !password || !firstName || !lastName || !role) {
            return res.status(400).json({ 
                error: 'Missing required fields: username, password, firstName, lastName, role' 
            });
        }

        // Check if user already exists
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({ error: 'User already exists with this username' });
        }

        // Default to Punjab, India if location not provided
        const userData = {
            username,
            password,
            firstName,
            lastName,
            role,
            country: country || 'India',
            state: state || 'Punjab',
            city: city || 'Chandigarh',
            address: address || 'Punjab, India',
            companyType: companyType || 'Individual',
            occupation: occupation || 'Not specified',
            volunteerSkills: volunteerSkills || []
        };

        const user = await User.create(userData);

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: {
                _id: user._id,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                city: user.city,
                state: user.state
            }
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(e => e.message).join('; ');
            return res.status(400).json({ error: errors });
        }
        res.status(500).json({ error: error.message });
    }
});

// **********************************************
// ********* EMERGENCY MANAGEMENT ***************
// **********************************************

/**
 * POST /api/data/emergency
 * Create emergency request (Any authenticated user)
 */
router.post('/emergency', protect, async (req, res) => {
    try {
        const { location, message, address } = req.body;

        if (!location || !message) {
            return res.status(400).json({ 
                error: 'Missing required fields: location (lat, lon), message' 
            });
        }

        // Generate emergency ID
        const emergencyId = `EMG_${Date.now()}`;

        // Basic AI analysis (simplified for seeding)
        const aiAnalysis = {
            disaster: {
                type: 'unknown',
                confidence: 0.7,
                indicators: message.toLowerCase().split(' ').slice(0, 3),
                priority: 'medium'
            },
            sentiment: {
                urgency: 'medium',
                emotion: 'concern',
                keywords: message.toLowerCase().split(' ').slice(0, 5),
                score: 0.7
            },
            severity: 'medium'
        };

        // Basic resource allocation
        const response = {
            resources: {
                immediate: ['emergency_medical_kits', 'emergency_food'],
                secondary: ['emergency_blankets', 'water_purification_tablets'],
                quantities: {
                    emergency_medical_kits: 5,
                    emergency_food: 20,
                    emergency_blankets: 10,
                    water_purification_tablets: 50
                }
            }
        };

        const emergency = new Emergency({
            emergencyId,
            userId: req.user._id,
            location: {
                lat: location.lat,
                lon: location.lon,
                address: address || `${location.lat}, ${location.lon}`
            },
            userMessage: message,
            aiAnalysis,
            response,
            status: 'received',
            timeline: [{
                status: 'received',
                timestamp: new Date(),
                notes: 'Emergency request received and analyzed'
            }]
        });

        await emergency.save();

        res.status(201).json({
            success: true,
            message: 'Emergency request created successfully',
            emergencyId: emergency.emergencyId,
            analysis: aiAnalysis,
            response
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// **********************************************
// ********* STATISTICS & ANALYTICS *************
// **********************************************

/**
 * GET /api/data/stats
 * Get system statistics
 */
router.get('/stats', protect, async (req, res) => {
    try {
        const [
            userCount,
            locationCount,
            inventoryCount,
            donationCount,
            requestCount,
            emergencyCount
        ] = await Promise.all([
            User.countDocuments(),
            Location.countDocuments(),
            InventoryItem.countDocuments(),
            Donation.countDocuments(),
            Request.countDocuments(),
            Emergency.countDocuments()
        ]);

        // Role distribution
        const roleStats = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);

        // Request status distribution
        const requestStats = await Request.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Emergency status distribution
        const emergencyStats = await Emergency.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            statistics: {
                totalUsers: userCount,
                totalLocations: locationCount,
                totalInventoryItems: inventoryCount,
                totalDonations: donationCount,
                totalRequests: requestCount,
                totalEmergencies: emergencyCount,
                roleDistribution: roleStats,
                requestStatusDistribution: requestStats,
                emergencyStatusDistribution: emergencyStats
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;