
import './dom-mock.mjs';
import { WeatherWidget } from '../js/modules/weather.js';

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

// Mock prompt and confirm
let promptResponse = null;
let confirmResponse = true;

global.prompt = (msg) => {
    // console.log(`Prompt called with: ${msg}`);
    return promptResponse;
};

global.confirm = (msg) => {
    // console.log(`Confirm called with: ${msg}`);
    return confirmResponse;
};


async function runTests() {
    console.log('Running tests for WeatherWidget...');
    let passed = 0;
    let failed = 0;

    // Helper to create mock widget element
    const createMockWidgetElement = () => {
        const element = new MockHTMLElement('div');
        element.querySelector = (selector) => new MockHTMLElement('div');
        return element;
    };

    // Test 1: Fetch Network Error
    try {
        console.log('Test: fetchWeather handles network error');

        // Setup
        global.sessionStorage.clear(); // changed from localStorage
        global.sessionStorage.setItem('openWeatherMapApiKey', 'test-api-key');

        const widgetElement = createMockWidgetElement();
        const widget = new WeatherWidget(widgetElement);

        // Mock fetch to reject (network error)
        global.fetch = () => Promise.reject(new Error('Network error'));

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

    // Test 2: Fetch API Error (Non-200)
    try {
        console.log('Test: fetchWeather handles non-200 response');

        // Setup
        global.sessionStorage.clear();
        global.sessionStorage.setItem('openWeatherMapApiKey', 'test-api-key');

        const widgetElement = createMockWidgetElement();
        const widget = new WeatherWidget(widgetElement);

        global.fetch = () => Promise.resolve({
            ok: false,
            status: 404,
            statusText: 'Not Found',
            json: () => Promise.resolve({})
        });

        await widget.fetchWeather(10, 20);

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

        global.sessionStorage.clear();
        global.sessionStorage.setItem('openWeatherMapApiKey', 'test-api-key');

        const widgetElement = createMockWidgetElement();
        const widget = new WeatherWidget(widgetElement);

        const mockData = {
            main: { temp: 25.6 },
            weather: [{ description: 'Cloudy', icon: '04d' }]
        };

        global.fetch = () => Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockData)
        });

        await widget.fetchWeather(10, 20);

        assert(widget.weatherTemp.textContent === '26°C',
               `Expected '26°C', got '${widget.weatherTemp.textContent}'`);
        assert(widget.weatherDesc.textContent === 'Cloudy',
               `Expected 'Cloudy', got '${widget.weatherDesc.textContent}'`);

        console.log('PASS');
        passed++;
    } catch (e) {
        console.error('FAIL:', e.message);
        console.error(e.stack);
        failed++;
    }

    // Test 4: Fetch without API Key (Prompt to set key)
    try {
        console.log('Test: fetchWeather prompts to set API key when missing');

        global.sessionStorage.clear();
        global.localStorage.clear(); // Ensure clean state

        const widgetElement = createMockWidgetElement();
        const widget = new WeatherWidget(widgetElement);

        await widget.fetchWeather(10, 20);

        assert(widget.weatherTemp.textContent === '--°C',
               `Expected '--°C', got '${widget.weatherTemp.textContent}'`);
        assert(widget.weatherDesc.textContent === 'Click to set API Key',
               `Expected 'Click to set API Key', got '${widget.weatherDesc.textContent}'`);

        console.log('PASS');
        passed++;
    } catch (e) {
        console.error('FAIL:', e.message);
        console.error(e.stack);
        failed++;
    }

    // Test 5: Migration from LocalStorage to SessionStorage
    try {
        console.log('Test: Migration from LocalStorage to SessionStorage');

        global.localStorage.clear();
        global.sessionStorage.clear();
        global.localStorage.setItem('openWeatherMapApiKey', 'migrated-key');

        const widgetElement = createMockWidgetElement();
        const widget = new WeatherWidget(widgetElement);

        assert(widget.apiKey === 'migrated-key', 'API Key should be loaded');
        assert(global.sessionStorage.getItem('openWeatherMapApiKey') === 'migrated-key',
               'API Key should be in sessionStorage');
        assert(global.localStorage.getItem('openWeatherMapApiKey') === null,
               'API Key should be removed from localStorage');

        console.log('PASS');
        passed++;
    } catch (e) {
        console.error('FAIL:', e.message);
        console.error(e.stack);
        failed++;
    }

    // Test 6: Click Handler sets API Key
    try {
        console.log('Test: Click handler prompts for API key');

        global.sessionStorage.clear();
        global.localStorage.clear();

        const widgetElement = createMockWidgetElement();
        const widget = new WeatherWidget(widgetElement);

        // Spy on init
        let initCalled = false;
        widget.init = () => { initCalled = true; };

        // Mock prompt response
        promptResponse = 'user-entered-key';

        // Simulate click
        widgetElement.click();

        assert(widget.apiKey === 'user-entered-key', 'API Key should be updated from prompt');
        assert(global.sessionStorage.getItem('openWeatherMapApiKey') === 'user-entered-key',
               'API Key should be saved to sessionStorage');
        assert(initCalled === true, 'init() should be called after setting key');

        console.log('PASS');
        passed++;
    } catch (e) {
        console.error('FAIL:', e.message);
        console.error(e.stack);
        failed++;
    }

    // Test 7: Update Existing Key
    try {
        console.log('Test: Click handler updates existing API key');

        global.sessionStorage.setItem('openWeatherMapApiKey', 'old-key');
        const widgetElement = createMockWidgetElement();
        const widget = new WeatherWidget(widgetElement);

        // Spy on init
        let initCalled = false;
        widget.init = () => { initCalled = true; };

        // Mock confirm and prompt
        confirmResponse = true;
        promptResponse = 'new-key';

        // Simulate click
        widgetElement.click();

        assert(widget.apiKey === 'new-key', 'API Key should be updated');
        assert(global.sessionStorage.getItem('openWeatherMapApiKey') === 'new-key',
               'New API Key should be saved to sessionStorage');
        assert(initCalled === true, 'init() should be called');

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
