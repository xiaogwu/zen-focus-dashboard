
import './dom-mock.mjs';
import { TaskManager } from '../js/modules/tasks.js';

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function runTests() {
    console.log('Running tests for TaskManager...');
    let passed = 0;
    let failed = 0;

    // Test 1: Valid ID
    try {
        console.log('Test: toggleTask with valid ID');

        // Setup
        global.localStorage.clear();
        const listElement = global.document.createElement('ul');
        const inputElement = global.document.createElement('input');
        const addButtonElement = global.document.createElement('button');
        const taskManager = new TaskManager(listElement, inputElement, addButtonElement);

        // Add a task
        inputElement.value = 'Test Task';
        taskManager.addTask();

        const task = taskManager.tasks[0];
        const taskId = task.id;

        // Action
        taskManager.toggleTask(taskId);

        // Verification
        assert(task.completed === true, 'Task should be completed after toggle');

        // Toggle back
        taskManager.toggleTask(taskId);
        assert(task.completed === false, 'Task should be incomplete after second toggle');

        console.log('PASS');
        passed++;
    } catch (e) {
        console.error('FAIL:', e.message);
        console.error(e.stack);
        failed++;
    }

    // Test 2: Invalid ID
    try {
        console.log('Test: toggleTask with invalid ID');

        // Setup
        global.localStorage.clear();
        const listElement = global.document.createElement('ul');
        const inputElement = global.document.createElement('input');
        const addButtonElement = global.document.createElement('button');
        const taskManager = new TaskManager(listElement, inputElement, addButtonElement);

        // Add a task just to have some state
        inputElement.value = 'Existing Task';
        taskManager.addTask();

        // Action
        const invalidId = 999999;
        let errorThrown = false;
        try {
            taskManager.toggleTask(invalidId);
        } catch (e) {
            errorThrown = true;
            console.error(e);
        }

        // Verification
        assert(!errorThrown, 'toggleTask should not throw error for invalid ID');

        // Verify state remains unchanged
        assert(taskManager.tasks.length === 1, 'Task list length should not change');
        assert(taskManager.tasks[0].completed === false, 'Existing task should not be modified');

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
