import fetch from 'node-fetch';

/**
 * Weather Service
 * Integrates with OpenWeatherMap API to provide real-time weather data
 * URL: https://api.openweathermap.org/data/2.5/weather
 */
class WeatherService {
    constructor() {
        this.apiKey = process.env.OPENWEATHER_API_KEY;
        this.baseUrl = 'https://api.openweathermap.org/data/2.5';
    }

    /**
     * Get current weather for a location
     * @param {number} lat Latitude
     * @param {number} lon Longitude
     * @returns {Promise<Object>} Weather data
     */
    async getCurrentWeather(lat, lon) {
        if (!this.apiKey) {
            console.warn('⚠️ No OpenWeather API key found. Using mock weather data.');
            return this.getMockWeather();
        }

        try {
            const url = `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Weather API returned ${response.status}`);
            }

            const data = await response.json();
            return {
                temp: data.main.temp,
                condition: data.weather[0].main,
                description: data.weather[0].description,
                windSpeed: data.wind.speed,
                humidity: data.main.humidity,
                visibility: data.visibility,
                isSevere: this.checkSeverity(data.weather[0].id)
            };

        } catch (error) {
            console.error('❌ Weather API error:', error.message);
            return this.getMockWeather();
        }
    }

    /**
     * Check if weather condition is severe
     * @param {number} conditionCode OpenWeather condition code
     */
    checkSeverity(conditionCode) {
        // Codes 2xx (Thunderstorm), 5xx (Rain), 6xx (Snow) can be severe
        // See https://openweathermap.org/weather-conditions
        return (conditionCode >= 200 && conditionCode < 300) || // Thunderstorm
            (conditionCode >= 502 && conditionCode < 600) || // Heavy rain
            (conditionCode >= 600 && conditionCode < 700) || // Snow
            (conditionCode === 781); // Tornado
    }

    /**
     * Get mock weather data for development/fallback
     */
    getMockWeather() {
        return {
            temp: 25 + Math.random() * 10,
            condition: 'Clear',
            description: 'clear sky',
            windSpeed: 5 + Math.random() * 10,
            humidity: 40 + Math.random() * 20,
            visibility: 10000,
            isSevere: false,
            mock: true
        };
    }

    /**
     * Calculate weather impact factor for routing
     * @param {Object} weather Weather object
     * @returns {number} Impact factor (1.0 = normal, >1.0 = slower)
     */
    calculateRoutingImpact(weather) {
        let impact = 1.0;

        if (weather.isSevere) impact += 0.3;

        switch (weather.condition.toLowerCase()) {
            case 'rain': impact += 0.1; break;
            case 'snow': impact += 0.2; break;
            case 'thunderstorm': impact += 0.25; break;
            case 'fog': impact += 0.15; break;
            default: break;
        }

        return impact;
    }
}

export default new WeatherService();
