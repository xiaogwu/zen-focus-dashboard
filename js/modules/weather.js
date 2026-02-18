const CACHE_KEY = 'zenfocus_weather_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export class WeatherWidget {
    constructor(widgetElement) {
        this.widgetElement = widgetElement;
        this.apiKey = localStorage.getItem('openWeatherMapApiKey') || '';
        this.weatherIcon = widgetElement.querySelector('.weather-icon');
        this.weatherTemp = widgetElement.querySelector('.weather-temp');
        this.weatherDesc = widgetElement.querySelector('.weather-desc');
    }

    async init() {
        // Check cache first
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const { timestamp, data } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_DURATION) {
                    this.updateDisplay(data);
                    return;
                }
            }
        } catch (e) {
            console.warn('Failed to read weather cache:', e);
            try { localStorage.removeItem(CACHE_KEY); } catch (e2) {}
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
        if (!this.apiKey) {
            // Mock data if no API key
            this.updateDisplay({
                temp: 22,
                description: 'Sunny (Mock)',
                icon: '01d'
            });
            return;
        }

        try {
            const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${this.apiKey}`);
            if (!response.ok) throw new Error('Weather API Error');
            const data = await response.json();

            const displayData = {
                temp: Math.round(data.main.temp),
                description: data.weather[0].description,
                icon: data.weather[0].icon
            };

            this.updateDisplay(displayData);

            // Cache the result safely
            try {
                localStorage.setItem(CACHE_KEY, JSON.stringify({
                    timestamp: Date.now(),
                    data: displayData
                }));
            } catch (e) {
                console.warn('Failed to cache weather data:', e);
            }
        } catch (error) {
            console.warn('Failed to fetch weather:', error);
            this.showError('Weather unavailable');
        }
    }

    handleGeoError(error) {
        console.warn('Geolocation error:', error);
        // Fallback to a default location or just show generic message
        this.updateDisplay({
            temp: '--',
            description: 'Location access denied',
            icon: ''
        });
    }

    updateDisplay(data) {
        this.weatherTemp.textContent = `${data.temp}°C`;
        this.weatherDesc.textContent = data.description;
        if (data.icon) {
            // Use OpenWeatherMap icons or a local mapping
            // Using OWM icon URL
            this.weatherIcon.style.backgroundImage = `url(https://openweathermap.org/img/wn/${data.icon}.png)`;
            this.weatherIcon.style.width = '50px';
            this.weatherIcon.style.height = '50px';
            this.weatherIcon.style.backgroundSize = 'contain';
            this.weatherIcon.style.backgroundRepeat = 'no-repeat';
        } else {
            this.weatherIcon.style.backgroundImage = 'none';
        }
    }

    showError(message) {
        this.weatherTemp.textContent = '';
        this.weatherDesc.textContent = message;
    }
}
