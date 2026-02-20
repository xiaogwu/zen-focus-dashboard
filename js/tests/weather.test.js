
import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';

// Initialize globals with placeholders
const mockGeolocation = {
    getCurrentPosition: null
};

global.localStorage = {
    getItem: null,
    setItem: null,
};

global.fetch = null;

Object.defineProperty(global, 'navigator', {
    value: {
        geolocation: mockGeolocation,
    },
    writable: true,
    configurable: true,
});

// Import Module
import { WeatherWidget } from '../modules/weather.js';

describe('WeatherWidget', () => {
    let widget;
    let mockWidgetElement;

    let originalConsoleWarn;

    beforeEach(() => {
        // Mock console.warn to suppress output and verify calls
        originalConsoleWarn = console.warn;
        console.warn = mock.fn();

        // Reset/Re-create mocks for each test
        global.localStorage.getItem = mock.fn(() => null);
        global.localStorage.setItem = mock.fn();

        global.fetch = mock.fn(() => Promise.resolve({
            ok: true,
            json: async () => ({
                current: { temperature_2m: 25, weather_code: 0, is_day: 1 }
            })
        }));

        mockGeolocation.getCurrentPosition = mock.fn();

        mockWidgetElement = {
            querySelector: mock.fn((selector) => ({
                textContent: '',
                style: {},
                addEventListener: mock.fn(),
            })),
        };

        widget = new WeatherWidget(mockWidgetElement);
    });

    afterEach(() => {
        console.warn = originalConsoleWarn;
    });

    test('constructor initializes correctly', () => {
        assert.strictEqual(widget.widgetElement, mockWidgetElement);
        assert.strictEqual(mockWidgetElement.querySelector.mock.calls.length, 3);
    });

    test('init requests geolocation', async () => {
        mockGeolocation.getCurrentPosition.mock.mockImplementation((success) => {
            success({ coords: { latitude: 10, longitude: 20 } });
        });

        // Mock fetchWeather to verify it is called
        widget.fetchWeather = mock.fn();

        await widget.init();

        assert.strictEqual(mockGeolocation.getCurrentPosition.mock.calls.length, 1);

        assert.strictEqual(widget.fetchWeather.mock.calls.length, 1);
        assert.strictEqual(widget.fetchWeather.mock.calls[0].arguments[0], 10);
        assert.strictEqual(widget.fetchWeather.mock.calls[0].arguments[1], 20);
    });

    test('fetchWeather calls Open-Meteo API', async () => {
        widget.updateDisplay = mock.fn();

        await widget.fetchWeather(10, 20);

        assert.strictEqual(global.fetch.mock.calls.length, 1);
        const url = global.fetch.mock.calls[0].arguments[0];
        assert.ok(url.startsWith('https://api.open-meteo.com/v1/forecast'));
        assert.ok(url.includes('latitude=10'));
        assert.ok(url.includes('longitude=20'));

        assert.strictEqual(widget.updateDisplay.mock.calls.length, 1);
        const data = widget.updateDisplay.mock.calls[0].arguments[0];
        assert.strictEqual(data.temp, 25);
        assert.strictEqual(data.description, 'Clear sky');
    });

    test('fetchWeather handles API error', async () => {
        global.fetch.mock.mockImplementation(() => Promise.resolve({ ok: false }));
        widget.showError = mock.fn();

        await widget.fetchWeather(10, 20);

        assert.strictEqual(widget.showError.mock.calls.length, 1);
        assert.strictEqual(widget.showError.mock.calls[0].arguments[0], 'Weather unavailable');
        assert.strictEqual(console.warn.mock.calls.length, 1);
    });

    test('updateDisplay updates DOM', () => {
        const data = { temp: 30, description: 'Cloudy', icon: '☁️' };

        widget.updateDisplay(data);

        assert.strictEqual(widget.weatherTemp.textContent, '30°C');
        assert.strictEqual(widget.weatherDesc.textContent, 'Cloudy');
        assert.strictEqual(widget.weatherIcon.textContent, '☁️');
    });

    test('handleGeoError updates display', () => {
        widget.updateDisplay = mock.fn();
        const error = new Error('User denied');

        widget.handleGeoError(error);

        assert.strictEqual(widget.updateDisplay.mock.calls.length, 1);
        const data = widget.updateDisplay.mock.calls[0].arguments[0];
        assert.strictEqual(data.description, 'Location access denied');
        assert.strictEqual(console.warn.mock.calls.length, 1);
    });

    test('init shows error when geolocation not supported', async () => {
        // Temporarily remove geolocation
        const originalGeo = global.navigator.geolocation;
        Object.defineProperty(global.navigator, 'geolocation', { value: undefined, configurable: true });

        widget.showError = mock.fn();

        await widget.init();

        assert.strictEqual(widget.showError.mock.calls.length, 1);
        assert.strictEqual(widget.showError.mock.calls[0].arguments[0], 'Geolocation not supported');

        // Restore
        Object.defineProperty(global.navigator, 'geolocation', { value: originalGeo, configurable: true });
    });
});
