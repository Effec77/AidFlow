import express from 'express';
import { InventoryItem, Location, Transaction, Donation, Request } from '../models/Inventory.js';

const router = express.Router();

// ============================================
// INVENTORY ITEMS CRUD
// ============================================

/**
 * GET /api/inventory/items
 * Get all inventory items
 */
router.get('/items', async (req, res) => {
    try {
        const { category, location, status } = req.query;
        
        const query = {};
        if (category) query.category = category;
        if (location) query.location = location;
        if (status) query.status = status;

        const items = await InventoryItem.find(query).sort({ lastUpdated: -1 });
        
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/inventory/items
 * Add new inventory item
 */
router.post('/items', async (req, res) => {
    try {
        const item = new InventoryItem(req.body);
        await item.save();
        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT /api/inventory/items/:id
 * Update inventory item
 */
router.put('/items/:id', async (req, res) => {
    try {
        const item = await InventoryItem.findByIdAndUpdate(
            req.params.id,
            { ...req.body, lastUpdated: Date.now() },
            { new: true }
        );
        
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/inventory/items/:id
 * Delete inventory item
 */
router.delete('/items/:id', async (req, res) => {
    try {
        const item = await InventoryItem.findByIdAndDelete(req.params.id);
        
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// LOCATIONS
// ============================================

/**
 * GET /api/inventory/locations
 * Get all locations
 */
router.get('/locations', async (req, res) => {
    try {
        const locations = await Location.find();
        res.json(locations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/inventory/locations
 * Add new location
 */
router.post('/locations', async (req, res) => {
    try {
        const location = new Location(req.body);
        await location.save();
        res.status(201).json(location);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// TRANSACTIONS
// ============================================

/**
 * GET /api/inventory/transactions
 * Get all transactions
 */
router.get('/transactions', async (req, res) => {
    try {
        const { type, status } = req.query;
        
        const query = {};
        if (type) query.type = type;
        if (status) query.status = status;

        const transactions = await Transaction.find(query).sort({ timestamp: -1 });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/inventory/transactions
 * Create new transaction
 */
router.post('/transactions', async (req, res) => {
    try {
        const transaction = new Transaction(req.body);
        await transaction.save();
        res.status(201).json(transaction);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// DONATIONS (Volunteer)
// ============================================

/**
 * GET /api/donations
 * Get all donations
 */
router.get('/donations', async (req, res) => {
    try {
        const { status, volunteerId } = req.query;
        
        const query = {};
        if (status) query.status = status;
        if (volunteerId) query.volunteerId = volunteerId;

        const donations = await Donation.find(query).sort({ timestamp: -1 });
        res.json(donations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/donations
 * Create new donation
 */
router.post('/donations', async (req, res) => {
    try {
        const { itemName, category, quantity, location } = req.body;

        // Validate required fields
        if (!itemName || !category || !quantity || !location) {
            return res.status(400).json({ 
                error: 'Missing required fields: itemName, category, quantity, location' 
            });
        }

        // Validate volunteerId is provided
        if (!req.body.volunteerId) {
            return res.status(400).json({ 
                error: 'Volunteer ID is required for donation submission' 
            });
        }

        const donation = new Donation({
            volunteerId: req.body.volunteerId,
            itemName,
            category,
            quantity: parseInt(quantity),
            location,
            status: 'pending',
            timestamp: new Date()
        });

        await donation.save();
        
        res.status(201).json({
            success: true,
            message: 'Donation submitted successfully',
            donation
        });
    } catch (error) {
        console.error('Donation error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT /api/donations/:id
 * Update donation status
 */
router.put('/donations/:id', async (req, res) => {
    try {
        const { status, approvedBy } = req.body;
        
        const donation = await Donation.findByIdAndUpdate(
            req.params.id,
            { status, approvedBy },
            { new: true }
        );
        
        if (!donation) {
            return res.status(404).json({ error: 'Donation not found' });
        }

        // If approved, add to inventory
        if (status === 'approved') {
            const item = await InventoryItem.findOne({
                name: donation.itemName,
                location: donation.location
            });

            if (item) {
                // Update existing item
                item.currentStock += donation.quantity;
                item.lastUpdated = Date.now();
                await item.save();
            } else {
                // Create new item
                const newItem = new InventoryItem({
                    name: donation.itemName,
                    category: donation.category,
                    currentStock: donation.quantity,
                    minThreshold: 10,
                    maxCapacity: 1000,
                    unit: 'units',
                    location: donation.location,
                    status: 'adequate',
                    cost: 0,
                    supplier: 'Volunteer Donation'
                });
                await newItem.save();
            }
        }
        
        res.json(donation);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// REQUESTS (Recipient)
// ============================================

/**
 * GET /api/requests
 * Get all requests
 */
router.get('/requests', async (req, res) => {
    try {
        const { status, requesterId } = req.query;
        
        const query = {};
        if (status) query.status = status;
        if (requesterId) query.requesterId = requesterId;

        const requests = await Request.find(query).sort({ timestamp: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/requests
 * Create new request
 */
router.post('/requests', async (req, res) => {
    try {
        const { itemName, category, quantity, location, priority } = req.body;

        // Validate required fields
        if (!itemName || !category || !quantity || !location) {
            return res.status(400).json({ 
                error: 'Missing required fields: itemName, category, quantity, location' 
            });
        }

        // Validate requesterId is provided
        if (!req.body.requesterId) {
            return res.status(400).json({ 
                error: 'Requester ID is required for request submission' 
            });
        }

        const request = new Request({
            requesterId: req.body.requesterId,
            itemName,
            category,
            quantity: parseInt(quantity),
            location,
            priority: priority || 'normal',
            status: 'pending',
            timestamp: new Date()
        });

        await request.save();
        
        res.status(201).json({
            success: true,
            message: 'Request submitted successfully',
            request
        });
    } catch (error) {
        console.error('Request error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT /api/requests/:id
 * Update request status
 */
router.put('/requests/:id', async (req, res) => {
    try {
        const { status } = req.body;
        
        const request = await Request.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        // If approved, deduct from inventory
        if (status === 'approved') {
            const item = await InventoryItem.findOne({
                name: request.itemName,
                location: request.location
            });

            if (item && item.currentStock >= request.quantity) {
                item.currentStock -= request.quantity;
                item.lastUpdated = Date.now();
                
                // Update status based on stock
                if (item.currentStock <= 0) {
                    item.status = 'critical';
                } else if (item.currentStock < item.minThreshold) {
                    item.status = 'low';
                }
                
                await item.save();
            }
        }
        
        res.json(request);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
