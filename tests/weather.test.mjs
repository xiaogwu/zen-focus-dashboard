
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
        element.querySelector = (selector) => {
             return new MockHTMLElement('div');
        };
        return element;
    };

    // Reset mocks helper
    const resetMocks = () => {
        global.sessionStorage.clear();
        global.localStorage.clear();
    };

    // Test 1: Fetch Network Error
    try {
        console.log('Test: fetchWeather handles network error');
        resetMocks();

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

        const widgetElement = createMockWidgetElement();
        const widget = new WeatherWidget(widgetElement);

        const mockData = {
            current: { temperature_2m: 25.6, weather_code: 3, is_day: 1 }
        };

        global.fetch = () => Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockData)
        });

        await widget.fetchWeather(10, 20);

        assert(widget.weatherTemp.textContent === '26°C',
               `Expected '26°C', got '${widget.weatherTemp.textContent}'`);
        assert(widget.weatherDesc.textContent === 'Overcast',
               `Expected 'Overcast', got '${widget.weatherDesc.textContent}'`);

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
