import './dom-mock.mjs';
import { BackgroundManager } from '../js/modules/background.js';

// Polyfill document.body
if (!global.document.body) {
    global.document.body = global.document.createElement('body');
}

// Mock getElementById to return stable references for verification
const mockedElements = {};
const originalGetElementById = global.document.getElementById;
global.document.getElementById = (id) => {
    if (!mockedElements[id]) {
        mockedElements[id] = global.document.createElement('div');
        mockedElements[id].id = id;
    }
    return mockedElements[id];
};

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

// Mock Fetch
let mockFetchResponse = null;
let mockFetchOk = true;
let fetchCalls = [];

global.fetch = async (url) => {
    fetchCalls.push(url);
    if (!mockFetchOk) {
        throw new Error('Fetch failed');
    }
    return {
        ok: true,
        json: async () => mockFetchResponse
    };
};

function mockFetch(response, ok = true) {
    mockFetchResponse = response;
    mockFetchOk = ok;
    fetchCalls = [];
}

// Mock Date
const RealDate = global.Date;
let mockedHour = null;

global.Date = class extends RealDate {
    constructor(...args) {
        super(...args);
    }
    getHours() {
        if (mockedHour !== null) return mockedHour;
        return super.getHours();
    }
};

function mockDate(hour) {
    mockedHour = hour;
}

function restoreDate() {
    mockedHour = null;
}

async function runTests() {
    console.log('Running tests for BackgroundManager...');
    let passed = 0;
    let failed = 0;

    // Helper to reset state
    function setup() {
        global.localStorage.clear();
        global.sessionStorage.clear();
        mockedElements['background-credit'] = global.document.createElement('div');
        mockedElements['photo-author'] = global.document.createElement('div');
        global.document.body.style = {};
        fetchCalls = [];
        restoreDate();
    }

    // Test 1: Initialization
    try {
        console.log('Test: Initialization with API Key');
        setup();
        global.sessionStorage.setItem('unsplashApiKey', 'test-key');
        const bg = new BackgroundManager();
        assert(bg.apiKey === 'test-key', 'Should load API key from sessionStorage');
        console.log('PASS');
        passed++;
    } catch (e) {
        console.error('FAIL:', e.message);
        failed++;
    }

    // Test 2: Time of Day
    try {
        console.log('Test: getTimeOfDay logic');
        setup();
        const bg = new BackgroundManager();

        mockDate(9); // 9 AM
        assert(bg.getTimeOfDay() === 'morning', '9 AM should be morning');

        mockDate(14); // 2 PM
        assert(bg.getTimeOfDay() === 'afternoon', '2 PM should be afternoon');

        mockDate(19); // 7 PM
        assert(bg.getTimeOfDay() === 'evening', '7 PM should be evening');

        console.log('PASS');
        passed++;
    } catch (e) {
        console.error('FAIL:', e.message);
        failed++;
    }

    // Test 3: Fallback Logic
    try {
        console.log('Test: Fallback images');
        setup();
        // No API key
        const bg = new BackgroundManager();

        mockDate(9);
        await bg.setBackground();
        assert(global.document.body.style.backgroundImage.includes(bg.fallbackImages[0].url), 'Morning fallback incorrect');

        mockDate(14);
        await bg.setBackground();
        assert(global.document.body.style.backgroundImage.includes(bg.fallbackImages[1].url), 'Afternoon fallback incorrect');

        mockDate(19);
        await bg.setBackground();
        assert(global.document.body.style.backgroundImage.includes(bg.fallbackImages[2].url), 'Evening fallback incorrect');

        console.log('PASS');
        passed++;
    } catch (e) {
        console.error('FAIL:', e.message);
        failed++;
    }

    // Test 4: API Fetching
    try {
        console.log('Test: API Fetching');
        setup();
        global.sessionStorage.setItem('unsplashApiKey', 'test-key');
        const bg = new BackgroundManager();

        const mockImage = {
            urls: { regular: 'https://images.unsplash.com/photo-test' },
            user: { name: 'Test User', links: { html: 'http://test.com' } }
        };
        mockFetch(mockImage);
        mockDate(10); // Morning

        await bg.setBackground();

        // Verify Fetch
        assert(fetchCalls.length === 1, 'Should call fetch once');
        assert(fetchCalls[0].includes('query=nature,morning'), 'URL should include query params');
        assert(fetchCalls[0].includes('client_id=test-key'), 'URL should include client_id');

        // Verify DOM
        assert(global.document.body.style.backgroundImage.includes('https://images.unsplash.com/photo-test'), 'Should apply fetched image');
        assert(mockedElements['photo-author'].textContent === 'Test User', 'Should update author text');

        // Verify Cache
        const cache = JSON.parse(global.localStorage.getItem('zenfocus_bg_cache'));
        assert(cache.imageData.url === 'https://images.unsplash.com/photo-test', 'Should cache image data');
        assert(cache.timeOfDay === 'morning', 'Should cache timeOfDay');

        console.log('PASS');
        passed++;
    } catch (e) {
        console.error('FAIL:', e.message);
        console.error(e.stack);
        failed++;
    }

    // Test 5: Caching Strategy
    try {
        console.log('Test: Caching Strategy');
        setup();
        global.sessionStorage.setItem('unsplashApiKey', 'test-key');
        const bg = new BackgroundManager();

        // 5a: Valid Cache
        const validCache = {
            timestamp: new RealDate().getTime(), // Now
            timeOfDay: 'morning',
            imageData: { url: 'https://images.unsplash.com/cached', author: 'Cached' }
        };
        global.localStorage.setItem('zenfocus_bg_cache', JSON.stringify(validCache));

        mockDate(10); // Morning
        fetchCalls = []; // Reset fetch calls

        await bg.setBackground();
        assert(fetchCalls.length === 0, 'Should not fetch if cache is valid');
        assert(global.document.body.style.backgroundImage.includes('https://images.unsplash.com/cached'), 'Should use cached image');

        // 5b: Expired Cache (Time mismatch)
        const expiredTimeCache = {
            timestamp: new RealDate().getTime() - (60 * 60 * 1000 + 1000), // 1 hour 1 sec ago
            timeOfDay: 'morning',
            imageData: { url: 'https://images.unsplash.com/expired', author: 'Expired' }
        };
        global.localStorage.setItem('zenfocus_bg_cache', JSON.stringify(expiredTimeCache));

        mockFetch({
            urls: { regular: 'https://images.unsplash.com/new' },
            user: { name: 'New', links: { html: '' } }
        });

        await bg.setBackground();
        assert(fetchCalls.length === 1, 'Should fetch if cache is expired by time');
        assert(global.document.body.style.backgroundImage.includes('https://images.unsplash.com/new'), 'Should use new image');

        // 5c: Invalid Cache (Time of Day mismatch)
        const mismatchCache = {
            timestamp: new RealDate().getTime(),
            timeOfDay: 'morning',
            imageData: { url: 'https://images.unsplash.com/morning', author: 'Morning' }
        };
        global.localStorage.setItem('zenfocus_bg_cache', JSON.stringify(mismatchCache));

        mockDate(14); // Afternoon
        fetchCalls = [];
        mockFetch({
             urls: { regular: 'https://images.unsplash.com/afternoon' },
             user: { name: 'Afternoon', links: { html: '' } }
        });

        await bg.setBackground();
        assert(fetchCalls.length === 1, 'Should fetch if time of day changed');
        assert(global.document.body.style.backgroundImage.includes('https://images.unsplash.com/afternoon'), 'Should use new afternoon image');

        console.log('PASS');
        passed++;
    } catch (e) {
        console.error('FAIL:', e.message);
        console.error(e.stack);
        failed++;
    }

    // Test 6: Error Handling
    try {
        console.log('Test: Error Handling');
        setup();
        global.sessionStorage.setItem('unsplashApiKey', 'test-key');
        const bg = new BackgroundManager();

        mockFetch(null, false); // Fail fetch
        mockDate(9); // Morning

        await bg.setBackground();

        assert(fetchCalls.length === 1, 'Should have attempted fetch');
        assert(global.document.body.style.backgroundImage.includes(bg.fallbackImages[0].url), 'Should fallback on error');

        console.log('PASS');
        passed++;
    } catch (e) {
        console.error('FAIL:', e.message);
        failed++;
    }

    console.log(`\nTests completed. Passed: ${passed}, Failed: ${failed}`);
    if (failed > 0) process.exit(1);
}

runTests();
