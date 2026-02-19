import './dom-mock.mjs';
import { PomodoroTimer } from '../js/modules/timer.js';

// --- Mocks ---

// Mock AudioContext
global.window.AudioContext = class {
    constructor() {
        this.state = 'running';
        this.currentTime = 0;
    }
    createOscillator() {
        return {
            connect: () => {},
            start: () => {},
            stop: () => {},
            type: '',
            frequency: { value: 0, setValueAtTime: () => {} }
        };
    }
    createGain() {
        return {
            connect: () => {},
            gain: {
                value: 0,
                setValueAtTime: () => {},
                exponentialRampToValueAtTime: () => {},
                linearRampToValueAtTime: () => {}
            }
        };
    }
    resume() {}
};
global.window.webkitAudioContext = global.window.AudioContext;

// Mock alert (deprecated in favor of notifier, but kept for safety)
global.alert = (msg) => {
    // console.log('Alert:', msg);
};

// Mock Notifier
let lastNotification = null;
const mockNotifier = (message, type) => {
    lastNotification = { message, type };
};

// Mock document.title
Object.defineProperty(global.document, 'title', {
    get: () => global._docTitle || '',
    set: (v) => { global._docTitle = v; }
});

// Mock Timers
const originalSetInterval = global.setInterval;
const originalClearInterval = global.clearInterval;
const originalSetTimeout = global.setTimeout;

let intervals = {};
let timeouts = {};
let timerIdCounter = 0;

global.setInterval = (cb, ms) => {
    const id = ++timerIdCounter;
    intervals[id] = { cb, ms };
    return id;
};

global.clearInterval = (id) => {
    delete intervals[id];
};

global.setTimeout = (cb, ms) => {
    const id = ++timerIdCounter;
    timeouts[id] = { cb, ms };
    // Execute immediately for testing purposes (alert messages)
    cb();
    return id;
};

function resetMocks() {
    intervals = {};
    timeouts = {};
    timerIdCounter = 0;
    global._docTitle = '';
}

// Helper to advance time
function advanceTime(seconds) {
    const elapsedMs = seconds * 1000;
    Object.values(intervals).forEach(interval => {
        // Calculate how many times the interval should trigger
        const ticks = Math.floor(elapsedMs / interval.ms);
        for (let i = 0; i < ticks; i++) {
            interval.cb();
        }
    });
}

// --- Assertion Helper ---
function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message || 'Assertion failed'}: Expected ${expected}, got ${actual}`);
    }
}


// --- Tests ---

function runTests() {
    console.log('Running tests for PomodoroTimer...');
    let passed = 0;
    let failed = 0;

    // Helper to create fresh DOM elements
    function createElements() {
        return {
            display: global.document.createElement('div'),
            startBtn: global.document.createElement('button'),
            pauseBtn: global.document.createElement('button'),
            resetBtn: global.document.createElement('button'),
            workInput: global.document.createElement('input'),
            breakInput: global.document.createElement('input'),
            autoStartCheckbox: global.document.createElement('input')
        };
    }

    // Test 1: Initialization
    try {
        resetMocks();
        console.log('Test: Initialization');
        const els = createElements();
        els.workInput.value = '25';
        els.breakInput.value = '5';

        const timer = new PomodoroTimer(els.display, els.startBtn, els.pauseBtn, els.resetBtn, els.workInput, els.breakInput, els.autoStartCheckbox);

        assertEqual(els.display.textContent, '25:00', 'Initial display should be 25:00');
        assertEqual(timer.timeLeft, 25 * 60, 'Initial timeLeft should be 1500 seconds');
        assertEqual(timer.isWorkSession, true, 'Should start with work session');
        assertEqual(timer.isRunning, false, 'Should not be running initially');

        console.log('PASS');
        passed++;
    } catch (e) {
        console.error('FAIL:', e.message);
        failed++;
    }

    // Test 2: Start Timer
    try {
        resetMocks();
        console.log('Test: Start Timer');
        const els = createElements();
        els.workInput.value = '25';
        const timer = new PomodoroTimer(els.display, els.startBtn, els.pauseBtn, els.resetBtn, els.workInput, els.breakInput, els.autoStartCheckbox);

        timer.start();

        assertEqual(timer.isRunning, true, 'Timer should be running after start()');
        assertEqual(els.startBtn.disabled, true, 'Start button should be disabled');
        assertEqual(els.pauseBtn.disabled, false, 'Pause button should be enabled');

        // Advance 1 second
        advanceTime(1);
        assertEqual(timer.timeLeft, 25 * 60 - 1, 'Time should decrease by 1 second');
        assertEqual(els.display.textContent, '24:59', 'Display should update to 24:59');

        console.log('PASS');
        passed++;
    } catch (e) {
        console.error('FAIL:', e.message);
        failed++;
    }

    // Test 3: Pause Timer
    try {
        resetMocks();
        console.log('Test: Pause Timer');
        const els = createElements();
        els.workInput.value = '25';
        const timer = new PomodoroTimer(els.display, els.startBtn, els.pauseBtn, els.resetBtn, els.workInput, els.breakInput, els.autoStartCheckbox);

        timer.start();
        advanceTime(5);
        timer.pause();

        assertEqual(timer.isRunning, false, 'Timer should not be running after pause()');
        assertEqual(els.startBtn.disabled, false, 'Start button should be enabled');
        assertEqual(els.pauseBtn.disabled, true, 'Pause button should be disabled');

        const frozenTime = timer.timeLeft;
        advanceTime(5);
        assertEqual(timer.timeLeft, frozenTime, 'Time should not decrease when paused');

        console.log('PASS');
        passed++;
    } catch (e) {
        console.error('FAIL:', e.message);
        failed++;
    }

    // Test 4: Reset Timer
    try {
        resetMocks();
        console.log('Test: Reset Timer');
        const els = createElements();
        els.workInput.value = '25';
        const timer = new PomodoroTimer(els.display, els.startBtn, els.pauseBtn, els.resetBtn, els.workInput, els.breakInput, els.autoStartCheckbox);

        timer.start();
        advanceTime(100);
        timer.reset();

        assertEqual(timer.isRunning, false, 'Timer should stop after reset()');
        assertEqual(timer.timeLeft, 25 * 60, 'Time should reset to initial work duration');
        assertEqual(els.display.textContent, '25:00', 'Display should reset to 25:00');
        assertEqual(timer.isWorkSession, true, 'Should reset to work session');

        console.log('PASS');
        passed++;
    } catch (e) {
        console.error('FAIL:', e.message);
        failed++;
    }

    // Test 5: Change Input Duration
    try {
        resetMocks();
        console.log('Test: Change Input Duration');
        const els = createElements();
        els.workInput.value = '25';
        els.breakInput.value = '5';
        const timer = new PomodoroTimer(els.display, els.startBtn, els.pauseBtn, els.resetBtn, els.workInput, els.breakInput, els.autoStartCheckbox);

        // Change work input
        els.workInput.value = '30';
        // Dispatch change event manually
        // We use .listeners because it's exposed by our custom MockHTMLElement
        if (els.workInput.listeners['change']) {
            els.workInput.listeners['change'].forEach(cb => cb({ target: els.workInput }));
        }

        assertEqual(timer.timeLeft, 30 * 60, 'timeLeft should update when work input changes (while stopped)');
        assertEqual(els.display.textContent, '30:00', 'Display should update');

        // Start timer
        timer.start();
        els.workInput.value = '40';
        if (els.workInput.listeners['change']) {
            els.workInput.listeners['change'].forEach(cb => cb({ target: els.workInput }));
        }

        // Should NOT update while running
        assertEqual(timer.timeLeft < 30 * 60 + 1, true, 'timeLeft should not jump to new input value while running');

        console.log('PASS');
        passed++;
    } catch (e) {
        console.error('FAIL:', e.message);
        failed++;
    }

    // Test 6: Session Completion (Work -> Break)
    try {
        resetMocks();
        console.log('Test: Session Completion (Work -> Break)');
        const els = createElements();
        els.workInput.value = '1'; // 1 minute
        els.breakInput.value = '5';
        // Pass mockNotifier to verify notification
        const timer = new PomodoroTimer(els.display, els.startBtn, els.pauseBtn, els.resetBtn, els.workInput, els.breakInput, els.autoStartCheckbox, mockNotifier);

        // Manually set timeLeft to 2 seconds to speed up test
        timer.timeLeft = 2;
        timer.updateDisplay();

        timer.start();

        // Advance 1 second -> 1 second left
        advanceTime(1);
        assertEqual(timer.timeLeft, 1, 'Should have 1 second left');

        // Advance 1 second -> triggers completeSession
        advanceTime(1);

        // Check state
        assertEqual(timer.isRunning, false, 'Timer should pause after completion');
        assertEqual(timer.isWorkSession, false, 'Should switch to break session');
        assertEqual(timer.timeLeft, 5 * 60, 'Should set time to break duration (5 min)');

        // Check Notification
        assert(lastNotification !== null, 'Notification should be displayed');
        assert(lastNotification.message === 'Work session complete! Take a break.', 'Notification message incorrect');
        assert(lastNotification.type === 'success', 'Notification type incorrect');

        console.log('PASS');
        passed++;
    } catch (e) {
        console.error('FAIL:', e.message);
        failed++;
    }

    // Test 7: Start Timer When Already Running
    try {
        resetMocks();
        console.log('Test: Start Timer When Already Running');
        const els = createElements();
        els.workInput.value = '25';
        const timer = new PomodoroTimer(els.display, els.startBtn, els.pauseBtn, els.resetBtn, els.workInput, els.breakInput, els.autoStartCheckbox);

        timer.start();
        const initialTimerId = timer.timerId;

        // Try to start again
        timer.start();

        if (timer.timerId !== initialTimerId) {
             throw new Error('Timer ID changed! Multiple intervals might be running.');
        }

        // Verify time decreases correctly (not double speed)
        const timeBefore = timer.timeLeft;
        advanceTime(1);
        const timeAfter = timer.timeLeft;

        // If two intervals running, timeLeft would decrease by 2
        if (timeBefore - timeAfter !== 1) {
             throw new Error(`Time decreased by ${timeBefore - timeAfter} seconds instead of 1. Likely duplicate intervals.`);
        }

        console.log('PASS');
        passed++;
    } catch (e) {
        console.error('FAIL:', e.message);
        failed++;
    }

    // Test: Detailed Reset Behavior
    try {
        console.log('Test: Detailed Reset Behavior');
        const els = createElements();
        els.workInput.value = '25';
        els.breakInput.value = '5';
        const timer = new PomodoroTimer(els.display, els.startBtn, els.pauseBtn, els.resetBtn, els.workInput, els.breakInput);

        // Scenario: Reset from Break Session
        timer.isWorkSession = false; // Force break session state
        timer.start(); // Start it running

        // Spy on pause
        let pauseCalled = false;
        const originalPause = timer.pause;
        timer.pause = function() {
            pauseCalled = true;
            originalPause.call(this);
        };

        // Modify work input to ensure it picks up new value
        els.workInput.value = '45';

        timer.reset();

        assertEqual(pauseCalled, true, 'reset() should call pause()');
        assertEqual(timer.isRunning, false, 'Timer should be stopped');
        assertEqual(timer.isWorkSession, true, 'Should switch to work session');
        assertEqual(timer.timeLeft, 45 * 60, 'Should use current work input value');
        assertEqual(els.display.textContent, '45:00', 'Display should update');

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
