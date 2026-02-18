
import './dom-mock.mjs';
import { WeatherWidget } from '../js/modules/weather.js';

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

async function runTests() {
    console.log('Running tests for WeatherWidget...');
    let passed = 0;
    let failed = 0;

    // Helper to create mock widget element
    const createMockWidgetElement = () => {
        const element = new MockHTMLElement('div');
        // Override querySelector to return a new element for each call
        // But we need to keep references if we want to check them later?
        // Actually, WeatherWidget stores references in constructor:
        // this.weatherTemp = widgetElement.querySelector('.weather-temp');
        // So we can just rely on the fact that querySelector returns a NEW element each time,
        // unless we want to spy on them.
        // Wait, dom-mock.mjs: querySelector: (selector) => new MockHTMLElement('div')
        // So `widgetElement.querySelector` needs to be defined.
        element.querySelector = (selector) => new MockHTMLElement('div');
        return element;
    };

    // Test 1: Fetch Network Error
    try {
        console.log('Test: fetchWeather handles network error');

        // Setup
        global.localStorage.clear();
        global.localStorage.setItem('openWeatherMapApiKey', 'test-api-key');

        const widgetElement = createMockWidgetElement();
        const widget = new WeatherWidget(widgetElement);

        // Mock fetch to reject (network error)
        global.fetch = () => Promise.reject(new Error('Network error'));

        // Action
        await widget.fetchWeather(10, 20);

        // Verification
        // The widget should display 'Weather unavailable' in weatherDesc
        // check weatherDesc.textContent
        assert(widget.weatherDesc.textContent === 'Weather unavailable',
               `Expected 'Weather unavailable', got '${widget.weatherDesc.textContent}'`);

        console.log('PASS');
        passed++;
    } catch (e) {
        console.error('FAIL:', e.message);
        console.error(e.stack);
        failed++;
    }

    // Test 2: Fetch API Error (Non-200)
    try {
        console.log('Test: fetchWeather handles non-200 response');

        // Setup
        global.localStorage.clear();
        global.localStorage.setItem('openWeatherMapApiKey', 'test-api-key');

        const widgetElement = createMockWidgetElement();
        const widget = new WeatherWidget(widgetElement);

        // Mock fetch to resolve with ok: false
        global.fetch = () => Promise.resolve({
            ok: false,
            status: 404,
            statusText: 'Not Found',
            json: () => Promise.resolve({})
        });

        // Action
        await widget.fetchWeather(10, 20);

        // Verification
        assert(widget.weatherDesc.textContent === 'Weather unavailable',
               `Expected 'Weather unavailable', got '${widget.weatherDesc.textContent}'`);

        console.log('PASS');
        passed++;
    } catch (e) {
        console.error('FAIL:', e.message);
        console.error(e.stack);
        failed++;
    }

    // Test 3: Fetch Success
    try {
        console.log('Test: fetchWeather handles success');

        // Setup
        global.localStorage.clear();
        global.localStorage.setItem('openWeatherMapApiKey', 'test-api-key');

        const widgetElement = createMockWidgetElement();
        const widget = new WeatherWidget(widgetElement);

        const mockData = {
            main: { temp: 25.6 }, // 25.6 should be rounded to 26
            weather: [{ description: 'Cloudy', icon: '04d' }]
        };

        // Mock fetch to resolve successfully
        global.fetch = () => Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockData)
        });

        // Action
        await widget.fetchWeather(10, 20);

        // Verification
        assert(widget.weatherTemp.textContent === '26°C',
               `Expected '26°C', got '${widget.weatherTemp.textContent}'`);
        assert(widget.weatherDesc.textContent === 'Cloudy',
               `Expected 'Cloudy', got '${widget.weatherDesc.textContent}'`);

        // Verify icon logic
        // The widget sets background image style
        assert(widget.weatherIcon.style.backgroundImage.includes('04d.png'),
               `Expected icon URL to contain '04d.png', got '${widget.weatherIcon.style.backgroundImage}'`);

        console.log('PASS');
        passed++;
    } catch (e) {
        console.error('FAIL:', e.message);
        console.error(e.stack);
        failed++;
    }

    console.log(`\nTests completed. Passed: ${passed}, Failed: ${failed}`);
    if (failed > 0) process.exit(1);
}

runTests();
