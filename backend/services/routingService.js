import fetch from 'node-fetch';
import RoutingHistory from '../models/RoutingHistory.js';
import DisasterZone from '../models/DisasterZone.js';
import { InventoryItem, Location } from '../models/Inventory.js';

/**
 * Routing Service - Integrates with existing routing implementation
 * This service provides the bridge between your routing model and the backend
 */
class RoutingService {
    constructor() {
        // OSRM API for real routing
        this.osrmEndpoint = 'https://router.project-osrm.org/route/v1/driving';

        // If you have a Python routing model, configure it here
        this.pythonModelEndpoint = process.env.ROUTING_MODEL_URL || null;
    }

    /**
     * Geocode a place name to coordinates using OpenStreetMap Nominatim.
     */
    async geocodePlace(placeName) {
        console.log(`🌍 Geocoding place: ${placeName}`);
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(placeName)}&format=json&limit=1`;
        try {
            const response = await fetch(url, { timeout: 5000 });
            if (!response.ok) {
                throw new Error(`Nominatim API returned ${response.status}`);
            }
            const data = await response.json();
            if (data && data.length > 0) {
                const { lat, lon, display_name } = data[0];
                console.log(`✅ Geocoded '${placeName}' to lat: ${lat}, lon: ${lon} (${display_name})`);
                return { lat: parseFloat(lat), lon: parseFloat(lon), name: display_name };
            } else {
                console.warn(`⚠️ No coordinates found for place: ${placeName}`);
                return null;
            }
        } catch (error) {
            console.error(`❌ Geocoding error for '${placeName}':`, error.message);
            return null;
        }
    }

    /**
     * Main routing function - calculates optimal route
     */
    async calculateRoute(origin, destination, options = {}) {
        console.log('🗺️ Calculating route from', origin, 'to', destination);

        // Geocode origin if it's a place name
        let processedOrigin = origin;
        if (typeof origin === 'string') {
            const geocodedOrigin = await this.geocodePlace(origin);
            if (!geocodedOrigin) {
                throw new Error(`Could not geocode origin: ${origin}`);
            }
            processedOrigin = geocodedOrigin;
        } else if (!origin || (typeof origin.lat === 'undefined' || typeof origin.lon === 'undefined')) {
            throw new Error('Invalid origin provided. Must be a place name or an object with lat/lon.');
        }

        // Geocode destination if it's a place name
        let processedDestination = destination;
        if (typeof destination === 'string') {
            const geocodedDestination = await this.geocodePlace(destination);
            if (!geocodedDestination) {
                throw new Error(`Could not geocode destination: ${destination}`);
            }
            processedDestination = geocodedDestination;
        } else if (!destination || (typeof destination.lat === 'undefined' || typeof destination.lon === 'undefined')) {
            throw new Error('Invalid destination provided. Must be a place name or an object with lat/lon.');
        }

        const routeId = `ROUTE_${Date.now()}`;
        const startTime = Date.now();

        try {
            // Step 1: Get disaster zones to avoid
            const disasterZones = await this.getActiveDisasterZones().catch(() => []);

            // Step 2: Calculate base route using OSRM
            const baseRoute = await this.getOSRMRoute(processedOrigin, processedDestination);

            if (!baseRoute || baseRoute.fallback) {
                console.warn('⚠️ Using fallback route calculation');
                console.log('Fallback route waypoints:', baseRoute.waypoints?.length || 0);
            } else {
                console.log(`✅ OSRM route with ${baseRoute.waypoints?.length || 0} waypoints`);
            }

            // Step 3: Apply routing factors (traffic, weather, hazards)
            const factors = await this.calculateRoutingFactors(baseRoute, disasterZones);

            // Step 4: Adjust route based on factors
            const optimizedRoute = this.optimizeRoute(baseRoute, factors, disasterZones);

            // Step 5: Calculate alternatives
            const alternatives = [];

            // Step 6: Try to save to database (non-blocking)
            let savedToDatabase = false;
            try {
                await RoutingHistory.create({
                    routeId,
                    requestType: options.requestType || 'emergency_response',
                    origin: {
                        lat: origin.lat,
                        lon: origin.lon,
                        name: origin.name || 'Origin',
                        type: origin.type || 'response_center'
                    },
                    destination: {
                        lat: destination.lat,
                        lon: destination.lon,
                        name: destination.name || 'Destination',
                        disasterZoneId: destination.disasterZoneId
                    },
                    routeData: optimizedRoute,
                    routingFactors: factors,
                    alternatives: alternatives,
                    status: 'planned',
                    severity: options.severity || 'medium',
                    emergencyId: options.emergencyId,
                    userId: options.userId,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
                });

                savedToDatabase = true;
            } catch (dbError) {
                console.warn('⚠️ Could not save to database:', dbError.message);
            }

            const processingTime = Date.now() - startTime;
            console.log(`✅ Route calculated in ${processingTime}ms`);

            return {
                success: true,
                routeId,
                route: optimizedRoute,
                alternatives,
                factors,
                disasterZones: disasterZones.map(z => z.zoneId || z._id),
                processingTime,
                savedToDatabase
            };

        } catch (error) {
            console.error('❌ Routing error:', error.message);
            return this.fallbackRoute(origin, destination, routeId);
        }
    }

    /**
     * Get route from OSRM - PRODUCTION GRADE
     */
    async getOSRMRoute(origin, destination) {
        try {
            // Validate coordinates
            if (!this.validateCoordinates(origin.lat, origin.lon) ||
                !this.validateCoordinates(destination.lat, destination.lon)) {
                throw new Error('Invalid coordinates provided');
            }

            // OSRM expects lon,lat format
            const url = `${this.osrmEndpoint}/${origin.lon},${origin.lat};${destination.lon},${destination.lat}?overview=full&geometries=geojson&steps=true&annotations=true`;

            console.log('🌐 Calling OSRM API:', url);

            const response = await fetch(url, {
                timeout: 10000 // 10 second timeout
            });

            if (!response.ok) {
                throw new Error(`OSRM API returned ${response.status}`);
            }

            const data = await response.json();

            if (!data.routes || data.routes.length === 0) {
                throw new Error('No route found by OSRM');
            }

            const route = data.routes[0];

            // Extract detailed waypoints from geometry
            const waypoints = this.extractDetailedWaypoints(route.geometry);

            console.log(`✅ OSRM route found: ${waypoints.length} waypoints, ${(route.distance / 1000).toFixed(2)} km`);

            return {
                distance: route.distance / 1000, // Convert to km
                duration: route.duration / 60, // Convert to minutes
                waypoints: waypoints, // Detailed waypoints following roads
                geometry: route.geometry,
                steps: route.legs[0]?.steps || [],
                confidence: 'high',
                source: 'osrm'
            };

        } catch (error) {
            console.error('❌ OSRM routing failed:', error.message);
            console.log('⚠️ Falling back to direct route calculation');
            return this.calculateFallbackRoute(origin, destination);
        }
    }

    /**
     * Validate coordinates are within valid ranges
     */
    validateCoordinates(lat, lon) {
        return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
    }

    /**
     * Get active disaster zones
     */
    async getActiveDisasterZones() {
        try {
            return await DisasterZone.find({
                status: { $in: ['active', 'monitoring'] }
            });
        } catch (error) {
            console.warn('Error fetching disaster zones:', error.message);
            return [];
        }
    }

    /**
     * Get response centers with resources
     */
    async getResponseCenters(location) {
        try {
            // Get unique locations from inventory
            const locations = await Location.find({});

            // Calculate distances
            const centersWithDistance = locations.map(loc => ({
                ...loc.toObject(),
                distance: this.calculateDistance(
                    location.lat, location.lon,
                    loc.coordinates?.lat || 0, loc.coordinates?.lon || 0
                )
            }));

            // Sort by distance
            return centersWithDistance.sort((a, b) => a.distance - b.distance).slice(0, 5);
        } catch (error) {
            console.warn('Error fetching response centers:', error.message);
            return [];
        }
    }

    /**
     * Calculate routing factors
     */
    async calculateRoutingFactors(route, disasterZones) {
        const origin = route.waypoints && route.waypoints.length > 0 ? route.waypoints[0] : null;

        const factors = {
            traffic: this.estimateTraffic(),
            weather: await this.getWeatherFactor(origin),
            roadConditions: 1.0,
            timeOfDay: this.getTimeOfDayFactor(),
            urgency: 1.0,
            disasterZoneImpact: this.calculateDisasterZoneImpact(route, disasterZones),
            hazards: []
        };

        // Check if route passes through disaster zones
        disasterZones.forEach(zone => {
            if (this.routeIntersectsZone(route, zone)) {
                factors.hazards.push({
                    type: zone.disasterType,
                    severity: zone.severity,
                    zoneId: zone.zoneId
                });
            }
        });

        return factors;
    }

    /**
     * Optimize route based on factors
     */
    optimizeRoute(baseRoute, factors, disasterZones) {
        let optimized = { ...baseRoute };

        // Adjust duration based on factors
        let durationMultiplier = 1.0;
        durationMultiplier *= factors.traffic;
        durationMultiplier *= factors.weather;
        durationMultiplier *= factors.timeOfDay;
        durationMultiplier *= factors.disasterZoneImpact;

        optimized.duration = Math.round(baseRoute.duration * durationMultiplier);

        // Add hazard delays
        if (factors.hazards.length > 0) {
            optimized.duration += factors.hazards.length * 5; // 5 min per hazard
        }

        // Calculate ETA
        optimized.eta = new Date(Date.now() + optimized.duration * 60000).toISOString();

        // Add warnings
        optimized.warnings = [];
        if (factors.hazards.length > 0) {
            optimized.warnings.push(`Route passes through ${factors.hazards.length} disaster zone(s)`);
        }
        if (factors.traffic > 1.3) {
            optimized.warnings.push('Heavy traffic expected');
        }

        return optimized;
    }

    /**
     * Calculate alternative routes
     */
    async calculateAlternatives(origin, destination, primaryRoute) {
        // For now, return empty array
        // In production, calculate actual alternative routes
        return [];
    }

    /**
     * Check if route intersects with disaster zone
     */
    routeIntersectsZone(route, zone) {
        if (!route.waypoints || !zone.location) return false;

        const zoneCenter = zone.location.center;
        const zoneRadius = zone.location.radius;

        // Check if any waypoint is within the zone
        return route.waypoints.some(waypoint => {
            const distance = this.calculateDistance(
                waypoint.lat, waypoint.lon,
                zoneCenter.lat, zoneCenter.lon
            );
            return distance <= zoneRadius;
        });
    }

    /**
     * Calculate disaster zone impact on route
     */
    calculateDisasterZoneImpact(route, disasterZones) {
        let impact = 1.0;

        disasterZones.forEach(zone => {
            if (this.routeIntersectsZone(route, zone)) {
                // Increase time based on severity
                switch (zone.severity) {
                    case 'critical': impact *= 1.5; break;
                    case 'high': impact *= 1.3; break;
                    case 'medium': impact *= 1.15; break;
                    case 'low': impact *= 1.05; break;
                }
            }
        });

        return impact;
    }

    /**
     * Extract detailed waypoints from GeoJSON geometry
     * This ensures the route follows actual roads
     */
    extractDetailedWaypoints(geometry) {
        if (!geometry || !geometry.coordinates || !Array.isArray(geometry.coordinates)) {
            console.warn('⚠️ Invalid geometry, returning empty waypoints');
            return [];
        }

        const coords = geometry.coordinates;
        const waypoints = [];

        // For accurate routing, we need more waypoints
        // Sample every 5th point for detailed route, or all if less than 100 points
        const sampleRate = coords.length > 100 ? 5 : 1;

        for (let i = 0; i < coords.length; i += sampleRate) {
            // OSRM returns [lon, lat] format
            waypoints.push({
                lat: coords[i][1], // latitude
                lon: coords[i][0]  // longitude
            });
        }

        // Always include the last point for accuracy
        if (coords.length > 0 && waypoints[waypoints.length - 1].lat !== coords[coords.length - 1][1]) {
            const last = coords[coords.length - 1];
            waypoints.push({
                lat: last[1],
                lon: last[0]
            });
        }

        console.log(`📍 Extracted ${waypoints.length} waypoints from ${coords.length} coordinates`);

        return waypoints;
    }

    /**
     * Calculate distance between two points (Haversine)
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Estimate traffic factor
     */
    estimateTraffic() {
        const hour = new Date().getHours();
        if (hour >= 7 && hour <= 9 || hour >= 17 && hour <= 19) return 1.5; // Rush hour
        if (hour >= 10 && hour <= 16) return 1.2; // Moderate
        return 1.0; // Light
    }

    /**
     * Get weather factor
     */
    async getWeatherFactor(origin) {
        try {
            // Use origin coordinates if available, otherwise default location
            const lat = origin?.lat || 30.7333; // Chandigarh default
            const lon = origin?.lon || 76.7794;

            const WeatherService = (await import('./weatherService.js')).default;
            const weather = await WeatherService.getCurrentWeather(lat, lon);

            console.log(`Cloudy with a chance of AI: ${weather.condition} (${weather.temp}°C)`);
            return WeatherService.calculateRoutingImpact(weather);
        } catch (error) {
            console.warn('Weather service error:', error.message);
            return 1.0;
        }
    }

    /**
     * Get time of day factor
     */
    getTimeOfDayFactor() {
        const hour = new Date().getHours();
        if (hour >= 22 || hour <= 5) return 0.9; // Night - less traffic
        return 1.0;
    }

    /**
     * Calculate fallback route with intermediate points
     * Creates a more realistic route even when OSRM fails
     */
    calculateFallbackRoute(origin, destination) {
        const distance = this.calculateDistance(
            origin.lat, origin.lon,
            destination.lat, destination.lon
        );

        // Create intermediate waypoints for more realistic visualization
        const waypoints = [];
        const numIntermediatePoints = Math.min(Math.floor(distance / 2), 10); // One point every 2km, max 10

        waypoints.push({ lat: origin.lat, lon: origin.lon });

        // Add intermediate points along the path
        for (let i = 1; i <= numIntermediatePoints; i++) {
            const ratio = i / (numIntermediatePoints + 1);
            waypoints.push({
                lat: origin.lat + (destination.lat - origin.lat) * ratio,
                lon: origin.lon + (destination.lon - origin.lon) * ratio
            });
        }

        waypoints.push({ lat: destination.lat, lon: destination.lon });

        console.log(`⚠️ Using fallback route with ${waypoints.length} waypoints`);

        return {
            distance: distance,
            duration: distance * 2, // Assume 30 km/h average in emergency
            waypoints: waypoints,
            geometry: this.createGeoJSONFromWaypoints(waypoints),
            steps: [],
            fallback: true,
            confidence: 'low',
            source: 'fallback',
            warning: 'Using direct route estimation. OSRM API unavailable.'
        };
    }

    /**
     * Create GeoJSON from waypoints
     */
    createGeoJSONFromWaypoints(waypoints) {
        return {
            type: 'LineString',
            coordinates: waypoints.map(wp => [wp.lon, wp.lat])
        };
    }

    /**
     * Fallback route response - PRODUCTION GRADE
     */
    fallbackRoute(origin, destination, routeId) {
        console.log('⚠️ Creating fallback route');

        const distance = this.calculateDistance(
            origin.lat, origin.lon,
            destination.lat, destination.lon
        );

        const fallbackRouteData = this.calculateFallbackRoute(origin, destination);

        return {
            success: true, // Still return success but with warning
            routeId,
            route: {
                distance: fallbackRouteData.distance,
                duration: fallbackRouteData.duration,
                waypoints: fallbackRouteData.waypoints,
                eta: new Date(Date.now() + fallbackRouteData.duration * 60000).toISOString(),
                warnings: [
                    'Using estimated route - OSRM API unavailable',
                    'Route may not follow exact roads',
                    'For production use, ensure OSRM API is accessible'
                ],
                confidence: 'low',
                source: 'fallback'
            },
            alternatives: [],
            factors: {
                fallback: true,
                traffic: 1.0,
                weather: 1.0,
                urgency: 1.0
            },
            disasterZones: [],
            processingTime: 0,
            savedToDatabase: false,
            note: 'This is an estimated route. For accurate routing, ensure OSRM API connectivity.'
        };
    }
}

export default RoutingService;