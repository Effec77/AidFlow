import { InventoryItem, Location } from '../models/Inventory.js';
import Emergency from '../models/Emergency.js';
import RoutingService from './routingService.js';

/**
 * Integrated Dispatch Service
 * Connects Emergency → Inventory → Routing → Dispatch
 * One-click automated resource dispatch
 */
class DispatchService {
    constructor() {
        this.routingService = new RoutingService();
    }

    /**
     * Main dispatch function - ONE CLICK AUTOMATION
     * @param {String} emergencyId - Emergency request ID
     * @param {String} adminId - Admin who authorized dispatch
     */
    async dispatchEmergency(emergencyId, adminId) {
        console.log(`🚀 Starting automated dispatch for emergency: ${emergencyId}`);
        const startTime = Date.now();

        try {
            // Step 1: Get emergency details
            const emergency = await Emergency.findOne({ emergencyId });
            if (!emergency) {
                throw new Error('Emergency not found');
            }

            if (emergency.status === 'dispatched' || emergency.status === 'completed') {
                throw new Error('Emergency already dispatched or completed');
            }

            console.log(`📋 Emergency Type: ${emergency.aiAnalysis?.disaster?.type || 'unknown'}`);
            console.log(`📍 Location: ${emergency.location.lat}, ${emergency.location.lon}`);

            // Step 2: Identify required resources from AI analysis
            const immediate = emergency.response?.resources?.immediate || [];
            const secondary = emergency.response?.resources?.secondary || [];
            const requiredResources = [...immediate, ...secondary].map(name => ({
                name: name,
                quantity: 1
            }));
            console.log(`📦 Required Resources:`, requiredResources);

            // Step 3: Check inventory and allocate resources
            const allocation = await this.allocateResources(
                requiredResources,
                emergency.location,
                emergency.aiAnalysis?.disaster?.type || 'unknown'
            );

            if (!allocation.success) {
                throw new Error(`Resource allocation failed: ${allocation.reason}`);
            }

            console.log(`✅ Resources allocated from ${allocation.centers.length} centers`);

            // Step 4: Calculate optimal routes for each center
            const routes = await this.calculateDispatchRoutes(
                allocation.centers,
                emergency.location,
                emergencyId
            );

            console.log(`🗺️ Calculated ${routes.length} optimal routes`);

            // Step 5: Update inventory (deduct dispatched items)
            await this.updateInventoryAfterDispatch(allocation.centers);

            // Step 6: Update emergency status
            emergency.status = 'dispatched';
            emergency.dispatchDetails = {
                dispatchedAt: new Date(),
                dispatchedBy: adminId,
                centers: allocation.centers.map(c => ({
                    centerId: c.centerId,
                    centerName: c.centerName,
                    resources: c.allocatedResources,
                    route: routes.find(r => r.centerId === c.centerId)
                })),
                totalResources: allocation.totalAllocated,
                estimatedArrival: routes[0]?.eta || new Date(Date.now() + 30 * 60000)
            };

            await emergency.save();

            const processingTime = Date.now() - startTime;
            console.log(`✅ Dispatch completed in ${processingTime}ms`);

            return {
                success: true,
                emergencyId,
                dispatch: {
                    status: 'dispatched',
                    dispatchedAt: emergency.dispatchDetails.dispatchedAt,
                    centers: emergency.dispatchDetails.centers,
                    routes: routes,
                    allocation: allocation,
                    estimatedArrival: emergency.dispatchDetails.estimatedArrival,
                    processingTime
                },
                message: 'Resources dispatched successfully! Help is on the way.'
            };

        } catch (error) {
            console.error('❌ Dispatch error:', error.message);
            throw error;
        }
    }

    /**
     * Allocate resources from inventory based on emergency needs
     */
    async allocateResources(requiredResources, emergencyLocation, disasterType) {
        try {
            // Get all available locations
            const locations = await Location.find({});
            
            if (!locations || locations.length === 0) {
                return {
                    success: false,
                    reason: 'No response centers available'
                };
            }

            // Mock coordinates for centers (in production, these would be in the database)
            const centerCoordinates = {
                'Emergency Response Center Alpha': { lat: 30.7271, lon: 76.8637 },
                'Fire Station Beta': { lat: 30.7071, lon: 76.8437 },
                'Medical Response Unit Gamma': { lat: 30.7221, lon: 76.8487 }
            };

            // Calculate distance to each center
            const centersWithDistance = locations.map(loc => {
                const coords = centerCoordinates[loc.name] || { lat: 30.7171, lon: 76.8537 };
                return {
                    centerId: loc._id.toString(),
                    centerName: loc.name,
                    location: coords,
                    distance: this.calculateDistance(
                        emergencyLocation.lat,
                        emergencyLocation.lon,
                        coords.lat,
                        coords.lon
                    )
                };
            }).sort((a, b) => a.distance - b.distance);

            // Allocate resources from nearest centers
            const allocation = {
                centers: [],
                totalAllocated: {},
                unmetNeeds: []
            };

            for (const resource of requiredResources) {
                let remainingQuantity = resource.quantity || 1;
                
                for (const center of centersWithDistance) {
                    if (remainingQuantity <= 0) break;

                    // Find matching inventory items
                    const category = this.mapResourceToCategory(resource.name);
                    const availableItems = await InventoryItem.find({
                        location: center.centerName,
                        category: category,
                        currentStock: { $gt: 0 }
                    });
                    
                    console.log(`🔍 Looking for ${category} at ${center.centerName}: found ${availableItems.length} items`);

                    for (const item of availableItems) {
                        if (remainingQuantity <= 0) break;

                        const allocateQty = Math.min(remainingQuantity, item.currentStock);
                        
                        // Add to center allocation
                        let centerAlloc = allocation.centers.find(c => c.centerId === center.centerId);
                        if (!centerAlloc) {
                            centerAlloc = {
                                centerId: center.centerId,
                                centerName: center.centerName,
                                location: center.location,
                                distance: center.distance,
                                allocatedResources: []
                            };
                            allocation.centers.push(centerAlloc);
                        }

                        centerAlloc.allocatedResources.push({
                            itemId: item._id.toString(),
                            name: item.name,
                            category: item.category,
                            quantity: allocateQty,
                            unit: item.unit
                        });

                        remainingQuantity -= allocateQty;

                        // Track total allocated
                        if (!allocation.totalAllocated[resource.name]) {
                            allocation.totalAllocated[resource.name] = 0;
                        }
                        allocation.totalAllocated[resource.name] += allocateQty;
                    }
                }

                // Track unmet needs
                if (remainingQuantity > 0) {
                    allocation.unmetNeeds.push({
                        resource: resource.name,
                        shortfall: remainingQuantity
                    });
                }
            }

            if (allocation.centers.length === 0) {
                return {
                    success: false,
                    reason: 'No resources available in inventory'
                };
            }

            return {
                success: true,
                centers: allocation.centers,
                totalAllocated: allocation.totalAllocated,
                unmetNeeds: allocation.unmetNeeds,
                message: allocation.unmetNeeds.length > 0 
                    ? 'Partial allocation - some resources unavailable'
                    : 'All resources allocated successfully'
            };

        } catch (error) {
            console.error('Resource allocation error:', error);
            return {
                success: false,
                reason: error.message
            };
        }
    }

    /**
     * Calculate optimal routes for all dispatch centers
     */
    async calculateDispatchRoutes(centers, destination, emergencyId) {
        const routes = [];

        for (const center of centers) {
            try {
                const routeResult = await this.routingService.calculateRoute(
                    {
                        lat: center.location.lat,
                        lon: center.location.lon,
                        name: center.centerName
                    },
                    {
                        lat: destination.lat,
                        lon: destination.lon,
                        name: 'Emergency Location'
                    },
                    {
                        requestType: 'emergency_dispatch',
                        severity: 'high',
                        emergencyId: emergencyId
                    }
                );

                if (routeResult.success) {
                    routes.push({
                        centerId: center.centerId,
                        centerName: center.centerName,
                        route: routeResult.route,
                        distance: routeResult.route.distance,
                        duration: routeResult.route.duration,
                        eta: routeResult.route.eta,
                        waypoints: routeResult.route.waypoints
                    });
                }
            } catch (error) {
                console.warn(`Route calculation failed for ${center.centerName}:`, error.message);
            }
        }

        return routes.sort((a, b) => a.duration - b.duration);
    }

    /**
     * Update inventory after dispatch (deduct quantities)
     */
    async updateInventoryAfterDispatch(centers) {
        for (const center of centers) {
            for (const resource of center.allocatedResources) {
                try {
                    const item = await InventoryItem.findById(resource.itemId);
                    if (item) {
                        item.currentStock -= resource.quantity;
                        
                        // Update status based on thresholds
                        if (item.currentStock <= 0) {
                            item.status = 'critical';
                            item.currentStock = 0;
                        } else if (item.currentStock < item.minThreshold) {
                            item.status = 'low';
                        } else {
                            item.status = 'adequate';
                        }

                        item.lastUpdated = new Date();
                        await item.save();
                        console.log(`📦 Updated inventory: ${item.name} - ${resource.quantity} dispatched (${item.currentStock} remaining)`);
                    }
                } catch (error) {
                    console.error(`Failed to update inventory for ${resource.itemId}:`, error.message);
                }
            }
        }
    }

    /**
     * Map resource name to inventory category
     * Categories in DB: Medical, Food, Shelter, Equipment, Water
     */
    mapResourceToCategory(resourceName) {
        const categoryMap = {
            'water': 'Water',
            'food': 'Food',
            'meal': 'Food',
            'shelter': 'Shelter',
            'tent': 'Shelter',
            'blanket': 'Shelter',
            'medical': 'Medical',
            'medicine': 'Medical',
            'medical kit': 'Medical',
            'first aid': 'Medical',
            'rescue': 'Equipment',
            'equipment': 'Equipment',
            'boat': 'Equipment',
            'vehicle': 'Equipment',
            'communication': 'Equipment',
            'radio': 'Equipment'
        };

        const lowerName = resourceName.toLowerCase();
        for (const [key, category] of Object.entries(categoryMap)) {
            if (lowerName.includes(key)) {
                return category;
            }
        }

        // Default to Equipment for unknown resources
        return 'Equipment';
    }

    /**
     * Calculate distance between two points (Haversine formula)
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    /**
     * Get dispatch status for an emergency
     */
    async getDispatchStatus(emergencyId) {
        try {
            const emergency = await Emergency.findOne({ emergencyId });
            if (!emergency) {
                throw new Error('Emergency not found');
            }

            return {
                success: true,
                emergencyId,
                status: emergency.status,
                dispatchDetails: emergency.dispatchDetails || null,
                location: emergency.location,
                analysis: emergency.aiAnalysis
            };
        } catch (error) {
            throw error;
        }
    }
}

export default DispatchService;
