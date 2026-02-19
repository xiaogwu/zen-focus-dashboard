
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

    // Test 3: Add Empty Task
    try {
        console.log('Test: addTask with empty input');

        // Setup
        global.localStorage.clear();
        const listElement = global.document.createElement('ul');
        const inputElement = global.document.createElement('input');
        const addButtonElement = global.document.createElement('button');
        const taskManager = new TaskManager(listElement, inputElement, addButtonElement);

        // Action 1: Empty String
        inputElement.value = '';
        taskManager.addTask();
        assert(taskManager.tasks.length === 0, 'Should not add task with empty string');

        // Action 2: Whitespace String
        inputElement.value = '   ';
        taskManager.addTask();
        assert(taskManager.tasks.length === 0, 'Should not add task with whitespace only');

        console.log('PASS');
        passed++;
    } catch (e) {
        console.error('FAIL:', e.message);
        console.error(e.stack);
        failed++;
    }

    // Test 4: Delete Existing Task
    try {
        console.log('Test: deleteTask with existing ID');

        // Setup
        global.localStorage.clear();
        const listElement = global.document.createElement('ul');
        const inputElement = global.document.createElement('input');
        const addButtonElement = global.document.createElement('button');
        const taskManager = new TaskManager(listElement, inputElement, addButtonElement);

        // Add a task
        inputElement.value = 'Task to Delete';
        taskManager.addTask();
        const task = taskManager.tasks[0];
        const taskId = task.id;

        // Action
        taskManager.deleteTask(taskId);

        // Verification
        assert(taskManager.tasks.length === 0, 'Task list should be empty after deletion');

        // Verify localStorage update
        const storedTasks = JSON.parse(global.localStorage.getItem('zenFocusTasks'));
        assert(storedTasks.length === 0, 'LocalStorage should be updated after deletion');

        console.log('PASS');
        passed++;
    } catch (e) {
        console.error('FAIL:', e.message);
        console.error(e.stack);
        failed++;
    }

    // Test 5: Delete Non-Existing Task
    try {
        console.log('Test: deleteTask with non-existing ID');

        // Setup
        global.localStorage.clear();
        const listElement = global.document.createElement('ul');
        const inputElement = global.document.createElement('input');
        const addButtonElement = global.document.createElement('button');
        const taskManager = new TaskManager(listElement, inputElement, addButtonElement);

        // Add a task
        inputElement.value = 'Existing Task';
        taskManager.addTask();
        const initialLength = taskManager.tasks.length;

        // Action
        taskManager.deleteTask(999999); // Non-existing ID

        // Verification
        assert(taskManager.tasks.length === initialLength, 'Task list length should not change');
        assert(taskManager.tasks[0].text === 'Existing Task', 'Existing task should remain');

        console.log('PASS');
        passed++;
    } catch (e) {
        console.error('FAIL:', e.message);
        console.error(e.stack);
        failed++;
    }

    // Test 6: Delete from Empty List
    try {
        console.log('Test: deleteTask from empty list');

        // Setup
        global.localStorage.clear();
        const listElement = global.document.createElement('ul');
        const inputElement = global.document.createElement('input');
        const addButtonElement = global.document.createElement('button');
        const taskManager = new TaskManager(listElement, inputElement, addButtonElement);

        // Action
        taskManager.deleteTask(12345);

        // Verification
        assert(taskManager.tasks.length === 0, 'Task list should remain empty');

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
