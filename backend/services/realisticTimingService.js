import fetch from 'node-fetch';
import Groq from 'groq-sdk';

/**
 * Realistic Timing Service
 * Uses real routing APIs and AI to calculate accurate dispatch times
 * Integrates with Groq AI for intelligent time predictions
 */
class RealisticTimingService {
    constructor() {
        // Initialize Groq for AI-powered predictions
        this.groq = process.env.GROQ_API_KEY ? new Groq({
            apiKey: process.env.GROQ_API_KEY,
        }) : null;

        // Routing APIs (in order of preference)
        this.routingAPIs = {
            osrm: 'https://router.project-osrm.org/route/v1/driving',
            mapbox: process.env.MAPBOX_API_KEY ? `https://api.mapbox.com/directions/v5/mapbox/driving` : null,
            google: process.env.GOOGLE_MAPS_API_KEY ? 'https://maps.googleapis.com/maps/api/directions/json' : null
        };

        // Punjab-specific data for realistic calculations
        this.punjabData = {
            // Major cities and their coordinates
            cities: {
                'chandigarh': { lat: 30.7333, lon: 76.7794, population: 1055450 },
                'ludhiana': { lat: 30.9010, lon: 75.8573, population: 1618879 },
                'amritsar': { lat: 31.6340, lon: 74.8723, population: 1183705 },
                'jalandhar': { lat: 31.3260, lon: 75.5762, population: 873725 },
                'patiala': { lat: 30.3398, lon: 76.3869, population: 446246 },
                'bathinda': { lat: 30.2110, lon: 74.9455, population: 285813 },
                'mohali': { lat: 30.7046, lon: 76.7179, population: 146213 },
                'hoshiarpur': { lat: 31.5344, lon: 75.9119, population: 168443 },
                'batala': { lat: 31.8230, lon: 75.2045, population: 156400 },
                'pathankot': { lat: 32.2746, lon: 75.6520, population: 197982 }
            },
            // Emergency response centers (realistic locations)
            responseCenters: {
                'chandigarh_fire': { lat: 30.7614, lon: 76.7883, name: 'Chandigarh Fire Station', type: 'fire' },
                'chandigarh_medical': { lat: 30.7194, lon: 76.8103, name: 'PGI Emergency', type: 'medical' },
                'ludhiana_central': { lat: 30.9000, lon: 75.8500, name: 'Ludhiana Emergency Center', type: 'general' },
                'amritsar_border': { lat: 31.6200, lon: 74.8600, name: 'Amritsar Border Emergency', type: 'general' },
                'patiala_district': { lat: 30.3300, lon: 76.3800, name: 'Patiala District Emergency', type: 'general' }
            },
            // Traffic patterns by time and location
            trafficPatterns: {
                'urban_peak': { multiplier: 2.5, hours: [7, 8, 9, 17, 18, 19] },
                'urban_normal': { multiplier: 1.3, hours: [10, 11, 12, 13, 14, 15, 16, 20, 21] },
                'urban_light': { multiplier: 1.0, hours: [22, 23, 0, 1, 2, 3, 4, 5, 6] },
                'rural_normal': { multiplier: 1.1, hours: 'all' },
                'highway_fast': { multiplier: 0.8, hours: 'night' }
            },
            // Road quality factors
            roadQuality: {
                'national_highway': 1.0,
                'state_highway': 1.2,
                'district_road': 1.5,
                'village_road': 2.0,
                'city_road': 1.3
            }
        };
    }

    /**
     * Calculate realistic dispatch time using multiple data sources
     */
    async calculateRealisticDispatchTime(origin, destination, emergencyType = 'general', severity = 'medium') {
        console.log(`🕐 Calculating realistic dispatch time from ${origin.name || 'origin'} to ${destination.name || 'destination'}`);
        
        try {
            // Step 1: Get real route data
            const routeData = await this.getRealRouteData(origin, destination);
            
            // Step 2: Apply Punjab-specific factors
            const localFactors = this.calculateLocalFactors(origin, destination, emergencyType);
            
            // Step 3: Apply time-based factors
            const timeFactors = this.calculateTimeFactors();
            
            // Step 4: Apply emergency-specific factors
            const emergencyFactors = this.calculateEmergencyFactors(emergencyType, severity);
            
            // Step 5: Use AI to refine prediction if available
            const aiRefinement = await this.getAIRefinedPrediction(
                routeData, localFactors, timeFactors, emergencyFactors, emergencyType
            );
            
            // Step 6: Calculate final realistic time
            const finalTime = this.calculateFinalTime(
                routeData, localFactors, timeFactors, emergencyFactors, aiRefinement
            );
            
            return {
                success: true,
                estimatedTime: finalTime.minutes,
                estimatedArrival: new Date(Date.now() + finalTime.minutes * 60000),
                confidence: finalTime.confidence,
                breakdown: {
                    baseRoute: routeData,
                    localFactors,
                    timeFactors,
                    emergencyFactors,
                    aiRefinement,
                    finalCalculation: finalTime
                },
                warnings: finalTime.warnings || []
            };
            
        } catch (error) {
            console.error('❌ Realistic timing calculation failed:', error.message);
            return this.getFallbackTiming(origin, destination, emergencyType, severity);
        }
    }

    /**
     * Get real route data from routing APIs
     */
    async getRealRouteData(origin, destination) {
        // Try OSRM first (free and reliable)
        try {
            const osrmData = await this.getOSRMRoute(origin, destination);
            if (osrmData.success) {
                return osrmData;
            }
        } catch (error) {
            console.warn('OSRM failed:', error.message);
        }

        // Fallback to distance-based calculation
        return this.getDistanceBasedRoute(origin, destination);
    }

    /**
     * Get route from OSRM API
     */
    async getOSRMRoute(origin, destination) {
        const url = `${this.routingAPIs.osrm}/${origin.lon},${origin.lat};${destination.lon},${destination.lat}?overview=full&annotations=duration,distance`;
        
        const response = await fetch(url, { timeout: 8000 });
        
        if (!response.ok) {
            throw new Error(`OSRM API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.routes || data.routes.length === 0) {
            throw new Error('No route found');
        }
        
        const route = data.routes[0];
        
        return {
            success: true,
            distance: route.distance / 1000, // Convert to km
            duration: route.duration / 60,   // Convert to minutes
            source: 'osrm',
            confidence: 'high',
            geometry: route.geometry
        };
    }

    /**
     * Distance-based route calculation with Punjab road network consideration
     */
    getDistanceBasedRoute(origin, destination) {
        const distance = this.calculateHaversineDistance(origin.lat, origin.lon, destination.lat, destination.lon);
        
        // Estimate road distance (usually 1.3-1.5x straight line distance in Punjab)
        const roadDistance = distance * 1.4;
        
        // Base speed estimation for Punjab roads
        let baseSpeed = 35; // km/h average for mixed roads in Punjab
        
        // Adjust based on distance (longer routes often use better roads)
        if (roadDistance > 50) baseSpeed = 45; // Highway portions
        if (roadDistance > 100) baseSpeed = 55; // Major highways
        
        const duration = (roadDistance / baseSpeed) * 60; // Convert to minutes
        
        return {
            success: true,
            distance: roadDistance,
            duration: duration,
            source: 'distance_estimation',
            confidence: 'medium',
            geometry: null
        };
    }

    /**
     * Calculate Punjab-specific local factors
     */
    calculateLocalFactors(origin, destination, emergencyType) {
        const factors = {
            urbanDensity: 1.0,
            roadQuality: 1.0,
            regionalCongestion: 1.0,
            emergencyLanes: 1.0
        };

        // Check if route involves major cities
        const originCity = this.identifyNearestCity(origin);
        const destCity = this.identifyNearestCity(destination);

        // Urban density factor
        if (originCity || destCity) {
            factors.urbanDensity = 1.4; // Urban areas are slower
            
            // Major cities have better emergency response infrastructure
            if (['chandigarh', 'ludhiana', 'amritsar'].includes(originCity) || 
                ['chandigarh', 'ludhiana', 'amritsar'].includes(destCity)) {
                factors.emergencyLanes = 0.9; // Better emergency lane access
            }
        }

        // Road quality based on route type
        const distance = this.calculateHaversineDistance(origin.lat, origin.lon, destination.lat, destination.lon);
        if (distance > 50) {
            factors.roadQuality = 1.0; // Likely highway route
        } else if (distance > 20) {
            factors.roadQuality = 1.2; // State roads
        } else {
            factors.roadQuality = 1.4; // Local roads
        }

        // Regional congestion (Punjab-specific)
        if (originCity === 'chandigarh' || destCity === 'chandigarh') {
            factors.regionalCongestion = 1.3; // Chandigarh traffic
        }
        if (originCity === 'ludhiana' || destCity === 'ludhiana') {
            factors.regionalCongestion = 1.4; // Ludhiana industrial traffic
        }

        return factors;
    }

    /**
     * Calculate time-based factors
     */
    calculateTimeFactors() {
        const now = new Date();
        const hour = now.getHours();
        const day = now.getDay(); // 0 = Sunday, 6 = Saturday
        
        const factors = {
            timeOfDay: 1.0,
            dayOfWeek: 1.0,
            seasonalFactor: 1.0
        };

        // Time of day factors
        if (hour >= 7 && hour <= 9) {
            factors.timeOfDay = 1.8; // Morning rush
        } else if (hour >= 17 && hour <= 19) {
            factors.timeOfDay = 1.9; // Evening rush (worse in Punjab)
        } else if (hour >= 10 && hour <= 16) {
            factors.timeOfDay = 1.3; // Daytime traffic
        } else if (hour >= 22 || hour <= 5) {
            factors.timeOfDay = 0.7; // Night time - faster
        }

        // Day of week factors
        if (day === 0) { // Sunday
            factors.dayOfWeek = 0.8; // Less traffic
        } else if (day === 6) { // Saturday
            factors.dayOfWeek = 1.1; // Market day traffic
        } else {
            factors.dayOfWeek = 1.0; // Weekday normal
        }

        // Seasonal factors (Punjab-specific)
        const month = now.getMonth();
        if (month >= 3 && month <= 5) { // April-June (harvest season)
            factors.seasonalFactor = 1.2; // Harvest traffic
        } else if (month >= 10 && month <= 11) { // Nov-Dec (wedding season)
            factors.seasonalFactor = 1.15; // Wedding season traffic
        }

        return factors;
    }

    /**
     * Calculate emergency-specific factors
     */
    calculateEmergencyFactors(emergencyType, severity) {
        const factors = {
            priorityLevel: 1.0,
            sirenEffect: 1.0,
            routeClearance: 1.0,
            preparationTime: 0 // Additional time for preparation
        };

        // Priority level affects how fast emergency vehicles can move
        switch (severity) {
            case 'critical':
                factors.priorityLevel = 0.6; // Can move much faster
                factors.sirenEffect = 0.7;   // Traffic clears better
                factors.routeClearance = 0.8;
                factors.preparationTime = 2; // 2 minutes prep
                break;
            case 'high':
                factors.priorityLevel = 0.75;
                factors.sirenEffect = 0.8;
                factors.routeClearance = 0.9;
                factors.preparationTime = 3; // 3 minutes prep
                break;
            case 'medium':
                factors.priorityLevel = 0.9;
                factors.sirenEffect = 0.95;
                factors.routeClearance = 1.0;
                factors.preparationTime = 5; // 5 minutes prep
                break;
            case 'low':
                factors.priorityLevel = 1.0;
                factors.sirenEffect = 1.0;
                factors.routeClearance = 1.0;
                factors.preparationTime = 8; // 8 minutes prep
                break;
        }

        // Emergency type specific adjustments
        switch (emergencyType) {
            case 'fire':
                factors.preparationTime += 2; // Fire trucks need more prep
                break;
            case 'medical':
                factors.priorityLevel *= 0.9; // Ambulances get good priority
                break;
            case 'flood':
                factors.routeClearance *= 1.2; // May need alternate routes
                break;
            case 'earthquake':
                factors.routeClearance *= 1.5; // Roads may be damaged
                break;
        }

        return factors;
    }

    /**
     * Use Groq AI to refine time predictions
     */
    async getAIRefinedPrediction(routeData, localFactors, timeFactors, emergencyFactors, emergencyType) {
        if (!this.groq) {
            return { refinement: 1.0, confidence: 'medium', source: 'rule_based' };
        }

        try {
            const prompt = `You are an emergency response timing expert for Punjab, India. Analyze this dispatch scenario and provide a time refinement factor.

ROUTE DATA:
- Distance: ${routeData.distance?.toFixed(1)} km
- Base Duration: ${routeData.duration?.toFixed(1)} minutes
- Source: ${routeData.source}

LOCAL FACTORS:
- Urban Density: ${localFactors.urbanDensity}x
- Road Quality: ${localFactors.roadQuality}x
- Regional Congestion: ${localFactors.regionalCongestion}x

TIME FACTORS:
- Time of Day: ${timeFactors.timeOfDay}x
- Day of Week: ${timeFactors.dayOfWeek}x
- Seasonal: ${timeFactors.seasonalFactor}x

EMERGENCY FACTORS:
- Priority Level: ${emergencyFactors.priorityLevel}x
- Siren Effect: ${emergencyFactors.sirenEffect}x
- Preparation Time: ${emergencyFactors.preparationTime} minutes
- Emergency Type: ${emergencyType}

Consider Punjab's road conditions, traffic patterns, and emergency response capabilities. Provide a JSON response:

{
  "refinementFactor": 0.8-1.3,
  "confidence": "high/medium/low",
  "reasoning": "brief explanation",
  "additionalMinutes": 0-10,
  "warnings": ["any specific warnings"]
}`;

            const response = await this.groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
                max_tokens: 512,
                temperature: 0.3,
                response_format: { type: "json_object" }
            });

            const aiResult = JSON.parse(response.choices[0].message.content);
            
            return {
                refinement: aiResult.refinementFactor || 1.0,
                confidence: aiResult.confidence || 'medium',
                reasoning: aiResult.reasoning || 'AI analysis applied',
                additionalMinutes: aiResult.additionalMinutes || 0,
                warnings: aiResult.warnings || [],
                source: 'groq_ai'
            };

        } catch (error) {
            console.warn('AI refinement failed:', error.message);
            return { refinement: 1.0, confidence: 'medium', source: 'fallback' };
        }
    }

    /**
     * Calculate final realistic time
     */
    calculateFinalTime(routeData, localFactors, timeFactors, emergencyFactors, aiRefinement) {
        // Start with base route time
        let totalMinutes = routeData.duration || 30;

        // Apply all factors
        totalMinutes *= localFactors.urbanDensity;
        totalMinutes *= localFactors.roadQuality;
        totalMinutes *= localFactors.regionalCongestion;
        totalMinutes *= localFactors.emergencyLanes;

        totalMinutes *= timeFactors.timeOfDay;
        totalMinutes *= timeFactors.dayOfWeek;
        totalMinutes *= timeFactors.seasonalFactor;

        totalMinutes *= emergencyFactors.priorityLevel;
        totalMinutes *= emergencyFactors.sirenEffect;
        totalMinutes *= emergencyFactors.routeClearance;

        // Apply AI refinement
        totalMinutes *= aiRefinement.refinement;
        totalMinutes += aiRefinement.additionalMinutes || 0;

        // Add preparation time
        totalMinutes += emergencyFactors.preparationTime;

        // Round to realistic precision
        totalMinutes = Math.round(totalMinutes);

        // Ensure minimum realistic time (can't be too fast)
        const minTime = Math.max(5, (routeData.distance || 10) * 0.8); // At least 0.8 min per km
        totalMinutes = Math.max(totalMinutes, minTime);

        // Determine confidence level
        let confidence = 'medium';
        if (routeData.source === 'osrm' && aiRefinement.source === 'groq_ai') {
            confidence = 'high';
        } else if (routeData.source === 'osrm' || aiRefinement.source === 'groq_ai') {
            confidence = 'medium';
        } else {
            confidence = 'low';
        }

        return {
            minutes: totalMinutes,
            confidence: confidence,
            warnings: [
                ...(routeData.source === 'distance_estimation' ? ['Route based on distance estimation'] : []),
                ...(aiRefinement.warnings || [])
            ]
        };
    }

    /**
     * Fallback timing calculation
     */
    getFallbackTiming(origin, destination, emergencyType, severity) {
        const distance = this.calculateHaversineDistance(origin.lat, origin.lon, destination.lat, destination.lon);
        
        // Conservative estimate: 25 km/h average speed in Punjab for emergency vehicles
        let baseTime = (distance * 1.4 / 25) * 60; // Road distance / speed * 60 for minutes
        
        // Add preparation time based on severity
        const prepTime = { critical: 3, high: 5, medium: 8, low: 12 };
        baseTime += prepTime[severity] || 8;
        
        // Apply basic time of day factor
        const hour = new Date().getHours();
        if (hour >= 7 && hour <= 9 || hour >= 17 && hour <= 19) {
            baseTime *= 1.5; // Rush hour
        }
        
        return {
            success: true,
            estimatedTime: Math.round(baseTime),
            estimatedArrival: new Date(Date.now() + Math.round(baseTime) * 60000),
            confidence: 'low',
            breakdown: {
                source: 'fallback',
                distance: distance,
                baseCalculation: 'Conservative estimate for Punjab roads'
            },
            warnings: ['Using fallback calculation - limited accuracy']
        };
    }

    /**
     * Identify nearest major city
     */
    identifyNearestCity(location) {
        let nearestCity = null;
        let minDistance = Infinity;

        for (const [cityName, cityData] of Object.entries(this.punjabData.cities)) {
            const distance = this.calculateHaversineDistance(
                location.lat, location.lon,
                cityData.lat, cityData.lon
            );
            
            if (distance < minDistance && distance < 20) { // Within 20km
                minDistance = distance;
                nearestCity = cityName;
            }
        }

        return nearestCity;
    }

    /**
     * Calculate Haversine distance
     */
    calculateHaversineDistance(lat1, lon1, lat2, lon2) {
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
     * Get realistic response center locations from database
     */
    async getRealisticResponseCenters() {
        try {
            const { Location } = await import('../models/Inventory.js');
            const locations = await Location.find({});
            
            const responseCenters = {};
            locations.forEach((loc, index) => {
                responseCenters[`center_${index}`] = {
                    lat: loc.coordinates.lat,
                    lon: loc.coordinates.lon,
                    name: loc.name,
                    type: loc.type
                };
            });
            
            return responseCenters;
        } catch (error) {
            console.error('Error fetching response centers from database:', error.message);
            // Fallback to empty object - no hardcoded data
            return {};
        }
    }

    /**
     * Calculate multiple dispatch scenarios for comparison
     */
    async calculateMultipleScenarios(origin, destination, emergencyType, severity) {
        const scenarios = [];

        // Scenario 1: Optimal conditions
        const optimal = await this.calculateRealisticDispatchTime(origin, destination, emergencyType, 'critical');
        scenarios.push({ name: 'Optimal (Critical Priority)', ...optimal });

        // Scenario 2: Current conditions
        const current = await this.calculateRealisticDispatchTime(origin, destination, emergencyType, severity);
        scenarios.push({ name: 'Current Conditions', ...current });

        // Scenario 3: Worst case
        const worstCase = { ...current };
        worstCase.estimatedTime = Math.round(worstCase.estimatedTime * 1.5);
        worstCase.estimatedArrival = new Date(Date.now() + worstCase.estimatedTime * 60000);
        worstCase.confidence = 'low';
        scenarios.push({ name: 'Worst Case (Delays)', ...worstCase });

        return scenarios;
    }
}

export default RealisticTimingService;