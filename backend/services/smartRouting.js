import fetch from 'node-fetch';

/**
 * AI Agent 3: Smart Routing & Re-routing
 * Optimizes emergency response routes with real-time adjustments
 */
class SmartRoutingAgent {
    constructor() {
        this.agentId = 'agent_3_smart_routing';
        
        // Routing APIs (can integrate with Google Maps, HERE, OSRM, etc.)
        this.routingAPIs = {
            osrm: 'https://router.project-osrm.org/route/v1/driving',
            graphhopper: process.env.GRAPHHOPPER_API_KEY || null
        };

        // Response centers/warehouses (should come from database)
        this.responseCenters = [];
        
        // Real-time factors
        this.routingFactors = {
            traffic: 1.0,
            weather: 1.0,
            roadConditions: 1.0,
            timeOfDay: 1.0,
            urgency: 1.0
        };
    }

    /**
     * Main routing function - finds optimal route with AI optimization
     */
    async calculateOptimalRoute(emergency) {
        console.log('🗺️ Agent 3: Calculating optimal smart route...');
        
        const routing = {
            agentId: this.agentId,
            timestamp: new Date().toISOString(),
            emergency: {
                id: emergency.emergencyId,
                location: emergency.location,
                severity: emergency.analysis?.severity || 'medium',
                disasterType: emergency.analysis?.disaster?.type || 'unknown'
            },
            routes: [],
            optimalRoute: null,
            alternatives: [],
            processingTime: Date.now()
        };

        try {
            // Step 1: Find nearest response centers
            const centers = await this.findNearestResponseCenters(
                emergency.location,
                emergency.response?.resources || {}
            );

            // Step 2: Calculate routes from each center
            for (const center of centers) {
                const route = await this.calculateRouteFromCenter(
                    center,
                    emergency.location,
                    emergency
                );
                routing.routes.push(route);
            }

            // Step 3: Apply AI optimization to select best route
            routing.optimalRoute = this.selectOptimalRouteWithAI(
                routing.routes,
                emergency
            );

            // Step 4: Generate alternative routes
            routing.alternatives = this.generateAlternativeRoutes(
                routing.routes,
                routing.optimalRoute
            );

            // Step 5: Add real-time re-routing capability
            routing.reRoutingEnabled = true;
            routing.monitoringFactors = this.getMonitoringFactors();

            routing.processingTime = Date.now() - routing.processingTime;
            console.log(`✅ Smart routing complete in ${routing.processingTime}ms`);

            return routing;

        } catch (error) {
            console.error('❌ Smart routing error:', error.message);
            return this.fallbackRouting(emergency);
        }
    }

    /**
     * Find nearest response centers with required resources
     */
    async findNearestResponseCenters(location, requiredResources) {
        // In production, query from database
        const centers = [
            {
                id: 'center_1',
                name: 'Emergency Response Center Alpha',
                location: { lat: location.lat + 0.01, lon: location.lon + 0.01 },
                resources: ['Medical Kit', 'Rescue Team', 'Communication Equipment'],
                vehicles: ['ambulance', 'fire_truck', 'rescue_vehicle'],
                capacity: 'high'
            },
            {
                id: 'center_2',
                name: 'Fire Station Beta',
                location: { lat: location.lat - 0.01, lon: location.lon - 0.01 },
                resources: ['Fire Extinguisher', 'Water', 'Rescue Team'],
                vehicles: ['fire_truck', 'water_tanker'],
                capacity: 'medium'
            },
            {
                id: 'center_3',
                name: 'Medical Response Unit Gamma',
                location: { lat: location.lat + 0.005, lon: location.lon - 0.005 },
                resources: ['Medical Kit', 'Ambulance', 'Medical Team'],
                vehicles: ['ambulance', 'medical_van'],
                capacity: 'high'
            }
        ];

        // Calculate distances and filter by resources
        const centersWithDistance = centers.map(center => ({
            ...center,
            distance: this.calculateDistance(
                location.lat, location.lon,
                center.location.lat, center.location.lon
            ),
            hasRequiredResources: this.checkResourceAvailability(
                center.resources,
                requiredResources
            )
        }));

        // Sort by distance and resource availability
        return centersWithDistance
            .sort((a, b) => {
                // Prioritize centers with required resources
                if (a.hasRequiredResources && !b.hasRequiredResources) return -1;
                if (!a.hasRequiredResources && b.hasRequiredResources) return 1;
                // Then by distance
                return a.distance - b.distance;
            })
            .slice(0, 3); // Top 3 centers
    }

    /**
     * Calculate route from response center to emergency location
     */
    async calculateRouteFromCenter(center, destination, emergency) {
        const route = {
            centerId: center.id,
            centerName: center.name,
            origin: center.location,
            destination: destination,
            distance: center.distance,
            baseTime: 0,
            adjustedTime: 0,
            eta: null,
            waypoints: [],
            factors: {},
            score: 0
        };

        try {
            // Get route from OSRM (free routing service)
            const osrmRoute = await this.getOSRMRoute(
                center.location,
                destination
            );

            if (osrmRoute) {
                route.distance = osrmRoute.distance / 1000; // Convert to km
                route.baseTime = osrmRoute.duration / 60; // Convert to minutes
                route.waypoints = osrmRoute.waypoints;
            } else {
                // Fallback calculation
                route.baseTime = route.distance * 2; // Assume 30 km/h average
            }

            // Apply AI-based time adjustments
            route.factors = await this.analyzeRouteFactors(route, emergency);
            route.adjustedTime = this.calculateAdjustedTime(route);
            route.eta = this.calculateETA(route.adjustedTime);

            // Calculate AI score for route selection
            route.score = this.calculateRouteScore(route, emergency);

            return route;

        } catch (error) {
            console.warn(`Route calculation error for ${center.name}:`, error.message);
            return this.fallbackRoute(center, destination);
        }
    }

    /**
     * Get route from OSRM (Open Source Routing Machine)
     */
    async getOSRMRoute(origin, destination) {
        try {
            const url = `${this.routingAPIs.osrm}/${origin.lon},${origin.lat};${destination.lon},${destination.lat}?overview=full&geometries=geojson`;
            
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                if (data.routes && data.routes.length > 0) {
                    const route = data.routes[0];
                    return {
                        distance: route.distance,
                        duration: route.duration,
                        waypoints: this.decodeWaypoints(route.geometry)
                    };
                }
            }
        } catch (error) {
            console.warn('OSRM routing error:', error.message);
        }
        return null;
    }

    /**
     * Analyze factors affecting route (AI-powered)
     */
    async analyzeRouteFactors(route, emergency) {
        const factors = {
            traffic: await this.estimateTraffic(route),
            weather: await this.getWeatherImpact(route),
            roadConditions: await this.assessRoadConditions(route),
            timeOfDay: this.getTimeOfDayFactor(),
            urgency: this.getUrgencyFactor(emergency),
            terrain: this.assessTerrain(route),
            hazards: await this.identifyHazards(route, emergency)
        };

        return factors;
    }

    /**
     * Calculate adjusted time with AI factors
     */
    calculateAdjustedTime(route) {
        let time = route.baseTime;
        
        // Apply each factor
        time *= route.factors.traffic || 1.0;
        time *= route.factors.weather || 1.0;
        time *= route.factors.roadConditions || 1.0;
        time *= route.factors.timeOfDay || 1.0;
        time *= route.factors.terrain || 1.0;

        // Add hazard delays
        if (route.factors.hazards && route.factors.hazards.length > 0) {
            time += route.factors.hazards.length * 5; // 5 min per hazard
        }

        // Urgency can reduce time (priority routing)
        if (route.factors.urgency > 0.8) {
            time *= 0.85; // 15% faster for critical emergencies
        }

        return Math.round(time);
    }

    /**
     * AI-based route scoring for selection
     */
    calculateRouteScore(route, emergency) {
        let score = 100; // Perfect score

        // Distance penalty (prefer shorter routes)
        score -= route.distance * 2;

        // Time penalty
        score -= route.adjustedTime * 0.5;

        // Factor penalties
        if (route.factors.traffic > 1.3) score -= 15;
        if (route.factors.weather > 1.2) score -= 10;
        if (route.factors.hazards && route.factors.hazards.length > 0) {
            score -= route.factors.hazards.length * 5;
        }

        // Urgency bonus
        if (route.factors.urgency > 0.8) score += 10;

        // Resource availability bonus
        if (route.hasRequiredResources) score += 15;

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Select optimal route using AI scoring
     */
    selectOptimalRouteWithAI(routes, emergency) {
        if (routes.length === 0) return null;

        // Sort by AI score
        const sortedRoutes = routes.sort((a, b) => b.score - a.score);
        
        const optimal = sortedRoutes[0];
        
        // Add AI reasoning
        optimal.selectionReason = this.generateSelectionReason(optimal, routes);
        
        return optimal;
    }

    /**
     * Generate alternative routes
     */
    generateAlternativeRoutes(allRoutes, optimalRoute) {
        return allRoutes
            .filter(route => route.centerId !== optimalRoute.centerId)
            .sort((a, b) => b.score - a.score)
            .slice(0, 2) // Top 2 alternatives
            .map(route => ({
                ...route,
                reason: `Alternative from ${route.centerName}`,
                timeDifference: route.adjustedTime - optimalRoute.adjustedTime
            }));
    }

    /**
     * Real-time re-routing capability
     */
    async checkForReRouting(currentRoute, currentLocation) {
        console.log('🔄 Checking for re-routing opportunities...');
        
        // Check if conditions have changed
        const updatedFactors = await this.analyzeRouteFactors(currentRoute, {});
        
        // Compare with original factors
        const significantChange = this.detectSignificantChange(
            currentRoute.factors,
            updatedFactors
        );

        if (significantChange) {
            console.log('⚠️ Significant route change detected, re-routing...');
            return await this.calculateAlternativeRoute(currentLocation, currentRoute.destination);
        }

        return null; // No re-routing needed
    }

    // Helper methods
    estimateTraffic(route) {
        const hour = new Date().getHours();
        if (hour >= 7 && hour <= 9 || hour >= 17 && hour <= 19) return 1.5; // Rush hour
        if (hour >= 10 && hour <= 16) return 1.2; // Moderate
        return 1.0; // Light
    }

    async getWeatherImpact(route) {
        // In production, call weather API
        return Math.random() > 0.8 ? 1.3 : 1.0;
    }

    async assessRoadConditions(route) {
        // In production, check road condition APIs
        return 1.0;
    }

    getTimeOfDayFactor() {
        const hour = new Date().getHours();
        if (hour >= 22 || hour <= 5) return 0.9; // Night - less traffic
        return 1.0;
    }

    getUrgencyFactor(emergency) {
        const severityMap = {
            'critical': 0.95,
            'high': 0.80,
            'medium': 0.60,
            'low': 0.40
        };
        return severityMap[emergency.analysis?.severity] || 0.60;
    }

    assessTerrain(route) {
        // Simplified terrain assessment
        return 1.0;
    }

    async identifyHazards(route, emergency) {
        const hazards = [];
        
        // Check if disaster area affects route
        if (emergency.analysis?.disaster?.type === 'flood') {
            hazards.push({ type: 'flood_zone', severity: 'high' });
        }
        
        return hazards;
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    checkResourceAvailability(centerResources, requiredResources) {
        if (!requiredResources.immediate) return true;
        return requiredResources.immediate.some(resource => 
            centerResources.some(cr => cr.toLowerCase().includes(resource.toLowerCase()))
        );
    }

    calculateETA(minutes) {
        const now = new Date();
        const eta = new Date(now.getTime() + minutes * 60000);
        return eta.toISOString();
    }

    decodeWaypoints(geometry) {
        // Convert GeoJSON to waypoints
        if (geometry && geometry.coordinates) {
            return geometry.coordinates.map(coord => ({
                lon: coord[0],
                lat: coord[1]
            }));
        }
        return [];
    }

    generateSelectionReason(optimal, allRoutes) {
        const reasons = [];
        
        if (optimal.score > 80) reasons.push('Highest overall score');
        if (optimal.distance < 10) reasons.push('Shortest distance');
        if (optimal.adjustedTime < 20) reasons.push('Fastest ETA');
        if (optimal.factors.urgency > 0.8) reasons.push('Priority routing for critical emergency');
        
        return reasons.join(', ');
    }

    detectSignificantChange(oldFactors, newFactors) {
        // Check if any factor changed by more than 20%
        const threshold = 0.2;
        
        for (const key in oldFactors) {
            if (typeof oldFactors[key] === 'number' && typeof newFactors[key] === 'number') {
                const change = Math.abs(oldFactors[key] - newFactors[key]) / oldFactors[key];
                if (change > threshold) return true;
            }
        }
        
        return false;
    }

    getMonitoringFactors() {
        return ['traffic', 'weather', 'road_conditions', 'new_hazards'];
    }

    fallbackRoute(center, destination) {
        const distance = this.calculateDistance(
            center.location.lat, center.location.lon,
            destination.lat, destination.lon
        );
        
        return {
            centerId: center.id,
            centerName: center.name,
            origin: center.location,
            destination: destination,
            distance: distance,
            baseTime: distance * 2,
            adjustedTime: distance * 2,
            eta: this.calculateETA(distance * 2),
            waypoints: [center.location, destination],
            factors: { fallback: true },
            score: 50
        };
    }

    fallbackRouting(emergency) {
        return {
            agentId: this.agentId,
            timestamp: new Date().toISOString(),
            emergency: emergency,
            routes: [],
            optimalRoute: null,
            alternatives: [],
            error: 'Routing calculation failed',
            processingTime: 0
        };
    }
}

export default SmartRoutingAgent;