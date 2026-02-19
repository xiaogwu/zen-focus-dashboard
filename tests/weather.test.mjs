
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

    // Setup Document Mocks for Dialog
    const originalGetElementById = global.document.getElementById;
    const mockDialog = new MockHTMLElement('dialog');
    const mockInput = new MockHTMLElement('input');
    // Ensure mock dialog has dialog methods (added in dom-mock.mjs)

    global.document.getElementById = (id) => {
        if (id === 'weather-settings-dialog') return mockDialog;
        if (id === 'weather-api-key') return mockInput;
        return originalGetElementById(id);
    };

    // Helper to create mock widget element
    const createMockWidgetElement = () => {
        const element = new MockHTMLElement('div');
        element.querySelector = (selector) => {
             if (selector === '#weather-settings-btn') return new MockHTMLElement('button');
             return new MockHTMLElement('div');
        };
        return element;
    };

    // Reset mocks helper
    const resetMocks = () => {
        mockDialog.open = false;
        mockDialog.returnValue = '';
        mockInput.value = '';
        global.sessionStorage.clear();
        global.localStorage.clear();
    };

    // Test 1: Fetch Network Error
    try {
        console.log('Test: fetchWeather handles network error');
        resetMocks();
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
        resetMocks();
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
        resetMocks();
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

    // Test 4: Fetch without API Key
    try {
        console.log('Test: fetchWeather prompts to set API key when missing');
        resetMocks();

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
        resetMocks();
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

    // Test 6: Settings Interaction (Open and Save)
    try {
        console.log('Test: Settings interaction opens dialog and saves key');
        resetMocks();

        const widgetElement = createMockWidgetElement();
        const widget = new WeatherWidget(widgetElement);

        // Spy on init
        let initCalled = false;
        widget.init = () => { initCalled = true; };

        // 1. Open Settings via button
        const settingsBtn = widget.settingsBtn; // Retrieved from constructor
        settingsBtn.click();

        assert(mockDialog.open === true, 'Dialog should be open after clicking settings button');

        // 2. Simulate User Input
        mockInput.value = 'user-entered-key';

        // 3. Simulate Dialog Close (Save)
        mockDialog.returnValue = 'save';
        // Manually trigger close event on dialog
        const closeEvent = { target: mockDialog };
        if (mockDialog.listeners['close']) {
            mockDialog.listeners['close'].forEach(cb => cb(closeEvent));
        }

        assert(widget.apiKey === 'user-entered-key', 'API Key should be updated from input');
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
        console.log('Test: Settings dialog shows existing key');
        resetMocks();
        global.sessionStorage.setItem('openWeatherMapApiKey', 'old-key');

        const widgetElement = createMockWidgetElement();
        const widget = new WeatherWidget(widgetElement);

        // Open settings
        widget.settingsBtn.click();

        assert(mockDialog.open === true, 'Dialog should be open');
        assert(mockInput.value === 'old-key', 'Input should be populated with existing key');

        console.log('PASS');
        passed++;
    } catch (e) {
        console.error('FAIL:', e.message);
        console.error(e.stack);
        failed++;
    }

     // Test 8: Widget Click when key is missing
    try {
        console.log('Test: Clicking widget when key is missing opens settings');
        resetMocks();

        const widgetElement = createMockWidgetElement();
        const widget = new WeatherWidget(widgetElement);

        // Simulate widget click
        widgetElement.click();

        assert(mockDialog.open === true, 'Dialog should be open');

        console.log('PASS');
        passed++;
    } catch (e) {
        console.error('FAIL:', e.message);
        console.error(e.stack);
        failed++;
    }

    // Test 9: Init handles missing geolocation
    {
        const originalNavigator = global.navigator;
        try {
            console.log('Test: init handles missing geolocation');
            resetMocks();

            Object.defineProperty(global, 'navigator', {
                value: {},
                writable: true,
                configurable: true
            });

            const widgetElement = createMockWidgetElement();
            const widget = new WeatherWidget(widgetElement);

            let errorMsg = null;
            widget.showError = (msg) => { errorMsg = msg; };

            await widget.init();

            assert(errorMsg === 'Geolocation not supported', 'Should show error when geolocation is missing');

            console.log('PASS');
            passed++;
        } catch (e) {
            console.error('FAIL:', e.message);
            console.error(e.stack);
            failed++;
        } finally {
            if (originalNavigator) {
                Object.defineProperty(global, 'navigator', {
                    value: originalNavigator,
                    writable: true,
                    configurable: true
                });
            }
        }
    }

    // Test 10: Init handles geolocation success
    {
        const originalNavigator = global.navigator;
        try {
            console.log('Test: init handles geolocation success');
            resetMocks();

            Object.defineProperty(global, 'navigator', {
                value: {
                    geolocation: {
                        getCurrentPosition: (success, error) => {
                            success({ coords: { latitude: 10, longitude: 20 } });
                        }
                    }
                },
                writable: true,
                configurable: true
            });

            const widgetElement = createMockWidgetElement();
            const widget = new WeatherWidget(widgetElement);

            let fetchedLat = null;
            let fetchedLon = null;
            widget.fetchWeather = (lat, lon) => {
                fetchedLat = lat;
                fetchedLon = lon;
            };

            await widget.init();

            assert(fetchedLat === 10, 'Should fetch weather with correct latitude');
            assert(fetchedLon === 20, 'Should fetch weather with correct longitude');

            console.log('PASS');
            passed++;
        } catch (e) {
            console.error('FAIL:', e.message);
            console.error(e.stack);
            failed++;
        } finally {
            if (originalNavigator) {
                Object.defineProperty(global, 'navigator', {
                    value: originalNavigator,
                    writable: true,
                    configurable: true
                });
            }
        }
    }

    // Test 11: Init handles geolocation error
    {
        const originalNavigator = global.navigator;
        try {
            console.log('Test: init handles geolocation error');
            resetMocks();

            const mockError = new Error('User denied geolocation');
            Object.defineProperty(global, 'navigator', {
                value: {
                    geolocation: {
                        getCurrentPosition: (success, error) => {
                            error(mockError);
                        }
                    }
                },
                writable: true,
                configurable: true
            });

            const widgetElement = createMockWidgetElement();
            const widget = new WeatherWidget(widgetElement);

            let handledError = null;
            widget.handleGeoError = (err) => { handledError = err; };

            await widget.init();

            assert(handledError === mockError, 'Should handle geolocation error');

            console.log('PASS');
            passed++;
        } catch (e) {
            console.error('FAIL:', e.message);
            console.error(e.stack);
            failed++;
        } finally {
            if (originalNavigator) {
                Object.defineProperty(global, 'navigator', {
                    value: originalNavigator,
                    writable: true,
                    configurable: true
                });
            }
        }
    }

    console.log(`\nTests completed. Passed: ${passed}, Failed: ${failed}`);
    if (failed > 0) process.exit(1);
}

runTests();
