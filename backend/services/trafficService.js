import fetch from 'node-fetch';

/**
 * Traffic Service - Real-time traffic data integration
 * Supports multiple providers with fallback
 */
class TrafficService {
    constructor() {
        this.googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
        this.googleBaseUrl = 'https://maps.googleapis.com/maps/api/directions/json';
    }

    /**
     * Get real-time traffic data from Google Maps
     * This is the most accurate source for traffic predictions
     */
    async getRealTimeTraffic(origin, destination) {
        // Check if API key is configured
        if (!this.googleApiKey) {
            console.warn('⚠️ Google Maps API key not configured, using time-based estimation');
            return null;
        }

        try {
            const url = `${this.googleBaseUrl}?` + new URLSearchParams({
                origin: `${origin.lat},${origin.lon}`,
                destination: `${destination.lat},${destination.lon}`,
                departure_time: 'now', // Critical for real-time traffic
                traffic_model: 'best_guess', // Options: best_guess, pessimistic, optimistic
                key: this.googleApiKey
            });

            console.log('🌐 Fetching real-time traffic from Google Maps...');
            
            const response = await fetch(url, { timeout: 5000 });
            
            if (!response.ok) {
                throw new Error(`Google API returned ${response.status}`);
            }

            const data = await response.json();

            if (data.status !== 'OK') {
                console.warn(`Google API status: ${data.status}`);
                return null;
            }

            const route = data.routes[0];
            const leg = route.legs[0];

            // Calculate traffic factor
            const normalDuration = leg.duration.value / 60; // minutes
            const trafficDuration = leg.duration_in_traffic.value / 60; // minutes
            const trafficFactor = trafficDuration / normalDuration;

            console.log(`✅ Real-time traffic: ${normalDuration.toFixed(0)}min → ${trafficDuration.toFixed(0)}min (${trafficFactor.toFixed(2)}x)`);

            return {
                distance: leg.distance.value / 1000, // km
                duration: normalDuration,
                durationInTraffic: trafficDuration,
                trafficFactor: trafficFactor,
                trafficDelay: trafficDuration - normalDuration,
                polyline: route.overview_polyline.points,
                warnings: route.warnings || [],
                summary: route.summary,
                source: 'google_maps',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Google Traffic API error:', error.message);
            return null;
        }
    }

    /**
     * Get traffic factor only (lighter API call)
     */
    async getTrafficFactor(origin, destination) {
        const traffic = await this.getRealTimeTraffic(origin, destination);
        
        if (traffic) {
            return {
                factor: traffic.trafficFactor,
                delay: traffic.trafficDelay,
                source: 'real_time'
            };
        }

        // Fallback to time-based estimation
        return {
            factor: this.estimateTrafficByTime(),
            delay: 0,
            source: 'estimated'
        };
    }

    /**
     * Fallback: Time-based traffic estimation
     * Used when real-time data is unavailable
     */
    estimateTrafficByTime() {
        const hour = new Date().getHours();
        const day = new Date().getDay();

        // Weekend traffic is lighter
        if (day === 0 || day === 6) {
            if (hour >= 10 && hour <= 16) return 1.1; // Moderate
            return 1.0; // Light
        }

        // Weekday traffic patterns
        if (hour >= 7 && hour <= 9) return 1.5; // Morning rush
        if (hour >= 17 && hour <= 19) return 1.5; // Evening rush
        if (hour >= 10 && hour <= 16) return 1.2; // Moderate
        if (hour >= 22 || hour <= 5) return 0.9; // Night (faster)
        
        return 1.0; // Normal
    }

    /**
     * Get traffic description for UI
     */
    getTrafficDescription(factor) {
        if (factor >= 1.5) return 'Heavy traffic';
        if (factor >= 1.3) return 'Moderate traffic';
        if (factor >= 1.1) return 'Light traffic';
        if (factor < 1.0) return 'Clear roads';
        return 'Normal traffic';
    }

    /**
     * Check if API is configured and working
     */
    async healthCheck() {
        if (!this.googleApiKey) {
            return {
                status: 'disabled',
                message: 'Google Maps API key not configured'
            };
        }

        try {
            // Test with a simple request
            const testOrigin = { lat: 30.7171, lon: 76.8537 };
            const testDest = { lat: 30.7200, lon: 76.8600 };
            
            const result = await this.getRealTimeTraffic(testOrigin, testDest);
            
            if (result) {
                return {
                    status: 'active',
                    message: 'Real-time traffic data available',
                    provider: 'Google Maps'
                };
            }

            return {
                status: 'error',
                message: 'API key configured but requests failing'
            };

        } catch (error) {
            return {
                status: 'error',
                message: error.message
            };
        }
    }
}

export default TrafficService;
