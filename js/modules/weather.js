const WMO_DESCRIPTIONS = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snowfall',
    73: 'Moderate snowfall',
    75: 'Heavy snowfall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
};

const WMO_ICONS = {
    0:  { day: '\u2600\uFE0F', night: '\uD83C\uDF19' },   // Clear sky: ☀️ / 🌙
    1:  { day: '\uD83C\uDF24\uFE0F', night: '\uD83C\uDF19' }, // Mainly clear: 🌤️ / 🌙
    2:  { day: '\u26C5', night: '\u26C5' },                 // Partly cloudy: ⛅
    3:  { day: '\u2601\uFE0F', night: '\u2601\uFE0F' },     // Overcast: ☁️
    45: { day: '\uD83C\uDF2B\uFE0F', night: '\uD83C\uDF2B\uFE0F' }, // Fog: 🌫️
    48: { day: '\uD83C\uDF2B\uFE0F', night: '\uD83C\uDF2B\uFE0F' }, // Rime fog: 🌫️
    51: { day: '\uD83C\uDF26\uFE0F', night: '\uD83C\uDF26\uFE0F' }, // Light drizzle: 🌦️
    53: { day: '\uD83C\uDF26\uFE0F', night: '\uD83C\uDF26\uFE0F' }, // Moderate drizzle: 🌦️
    55: { day: '\uD83C\uDF27\uFE0F', night: '\uD83C\uDF27\uFE0F' }, // Dense drizzle: 🌧️
    56: { day: '\uD83C\uDF27\uFE0F', night: '\uD83C\uDF27\uFE0F' }, // Light freezing drizzle: 🌧️
    57: { day: '\uD83C\uDF27\uFE0F', night: '\uD83C\uDF27\uFE0F' }, // Dense freezing drizzle: 🌧️
    61: { day: '\uD83C\uDF26\uFE0F', night: '\uD83C\uDF26\uFE0F' }, // Slight rain: 🌦️
    63: { day: '\uD83C\uDF27\uFE0F', night: '\uD83C\uDF27\uFE0F' }, // Moderate rain: 🌧️
    65: { day: '\uD83C\uDF27\uFE0F', night: '\uD83C\uDF27\uFE0F' }, // Heavy rain: 🌧️
    66: { day: '\uD83C\uDF27\uFE0F', night: '\uD83C\uDF27\uFE0F' }, // Light freezing rain: 🌧️
    67: { day: '\uD83C\uDF27\uFE0F', night: '\uD83C\uDF27\uFE0F' }, // Heavy freezing rain: 🌧️
    71: { day: '\uD83C\uDF28\uFE0F', night: '\uD83C\uDF28\uFE0F' }, // Slight snow: 🌨️
    73: { day: '\uD83C\uDF28\uFE0F', night: '\uD83C\uDF28\uFE0F' }, // Moderate snow: 🌨️
    75: { day: '\uD83C\uDF28\uFE0F', night: '\uD83C\uDF28\uFE0F' }, // Heavy snow: 🌨️
    77: { day: '\uD83C\uDF28\uFE0F', night: '\uD83C\uDF28\uFE0F' }, // Snow grains: 🌨️
    80: { day: '\uD83C\uDF26\uFE0F', night: '\uD83C\uDF26\uFE0F' }, // Slight rain showers: 🌦️
    81: { day: '\uD83C\uDF27\uFE0F', night: '\uD83C\uDF27\uFE0F' }, // Moderate rain showers: 🌧️
    82: { day: '\uD83C\uDF27\uFE0F', night: '\uD83C\uDF27\uFE0F' }, // Violent rain showers: 🌧️
    85: { day: '\uD83C\uDF28\uFE0F', night: '\uD83C\uDF28\uFE0F' }, // Slight snow showers: 🌨️
    86: { day: '\uD83C\uDF28\uFE0F', night: '\uD83C\uDF28\uFE0F' }, // Heavy snow showers: 🌨️
    95: { day: '\u26C8\uFE0F', night: '\u26C8\uFE0F' },     // Thunderstorm: ⛈️
    96: { day: '\u26C8\uFE0F', night: '\u26C8\uFE0F' },     // Thunderstorm + slight hail: ⛈️
    99: { day: '\u26C8\uFE0F', night: '\u26C8\uFE0F' },     // Thunderstorm + heavy hail: ⛈️
};

export class WeatherWidget {
    constructor(widgetElement) {
        this.widgetElement = widgetElement;
        this.weatherIcon = widgetElement.querySelector('.weather-icon');
        this.weatherTemp = widgetElement.querySelector('.weather-temp');
        this.weatherDesc = widgetElement.querySelector('.weather-desc');
        this.unit = localStorage.getItem('weather_unit') || 'C';
        this.tempC = null;

        if (this.weatherTemp) {
            this.weatherTemp.style.cursor = 'pointer';
            this.weatherTemp.addEventListener('click', () => this.toggleUnit());
        }
    }

    toggleUnit() {
        this.unit = this.unit === 'C' ? 'F' : 'C';
        localStorage.setItem('weather_unit', this.unit);
        if (this.tempC !== null) {
            this.weatherTemp.textContent = this.formatTemp(this.tempC);
        }
    }

    formatTemp(tempC) {
        if (tempC === '--') return `--`;
        const value = this.unit === 'F' ? Math.round(tempC * 9 / 5 + 32) : tempC;
        return `${value}\u00B0${this.unit}`;
    }

    async init() {
        // Check for cached weather data
        try {
            const cachedData = localStorage.getItem('weather_cache');
            if (cachedData) {
                try {
                    const { timestamp, data } = JSON.parse(cachedData);
                    // Check if cache is less than 30 minutes old
                    if (Date.now() - timestamp < 30 * 60 * 1000) {
                        this.updateDisplay(data);
                        return;
                    }
                } catch (e) {
                    console.warn('Error parsing weather cache:', e);
                    localStorage.removeItem('weather_cache');
                }
            }
        } catch (e) {
            console.warn('Error reading weather cache:', e);
        }

        if (!navigator.geolocation) {
            this.showError('Geolocation not supported');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => this.fetchWeather(position.coords.latitude, position.coords.longitude),
            (error) => this.handleGeoError(error)
        );
    }

    async fetchWeather(lat, lon) {
        try {
            const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&timezone=auto`);
            if (!response.ok) throw new Error('Weather API Error');
            const data = await response.json();

            const weatherCode = data.current.weather_code;
            const isDay = data.current.is_day;
            const description = WMO_DESCRIPTIONS[weatherCode] || 'Unknown';
            const iconEntry = WMO_ICONS[weatherCode];
            const icon = iconEntry ? (isDay ? iconEntry.day : iconEntry.night) : '';

            const weatherData = {
                temp: Math.round(data.current.temperature_2m),
                description,
                icon
            };

            this.updateDisplay(weatherData);

            // Cache the data
            try {
                localStorage.setItem('weather_cache', JSON.stringify({
                    timestamp: Date.now(),
                    data: weatherData,
                    coords: { lat, lon }
                }));
            } catch (e) {
                console.warn('Error saving weather cache:', e);
            }
        } catch (error) {
            console.warn('Failed to fetch weather:', error);
            this.showError('Weather unavailable');
        }
    }

    handleGeoError(error) {
        console.warn('Geolocation error:', error);
        this.updateDisplay({
            temp: '--',
            description: 'Location access denied',
            icon: ''
        });
    }

    updateDisplay(data) {
        this.tempC = data.temp;
        this.weatherTemp.textContent = this.formatTemp(data.temp);
        this.weatherDesc.textContent = data.description;
        if (data.icon) {
            this.weatherIcon.textContent = data.icon;
            this.weatherIcon.style.backgroundImage = 'none';
        } else {
            this.weatherIcon.textContent = '';
            this.weatherIcon.style.backgroundImage = 'none';
        }
    }

    showError(message) {
        this.weatherTemp.textContent = '';
        this.weatherDesc.textContent = message;
    }
}
