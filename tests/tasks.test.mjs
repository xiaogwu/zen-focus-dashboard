
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

        // Action: Toggle to completed
        taskManager.toggleTask(taskId);

        // Verification
        assert(task.completed === true, 'Task should be completed after toggle');

        // Verify localStorage update
        const storedTasks = JSON.parse(global.localStorage.getItem('zenFocusTasks'));
        assert(storedTasks[0].completed === true, 'Task in localStorage should be completed');

        // Verify DOM update
        const taskLi = listElement.children[0];
        assert(taskLi.classList.contains('completed'), 'Task element should have "completed" class');

        // Action: Toggle back to incomplete
        taskManager.toggleTask(taskId);

        // Verification
        assert(task.completed === false, 'Task should be incomplete after second toggle');

        // Verify localStorage update
        const storedTasks2 = JSON.parse(global.localStorage.getItem('zenFocusTasks'));
        assert(storedTasks2[0].completed === false, 'Task in localStorage should be incomplete');

        // Verify DOM update
        const taskLi2 = listElement.children[0];
        assert(!taskLi2.classList.contains('completed'), 'Task element should NOT have "completed" class');

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

    // Test 4: Toggle Persistence
    try {
        console.log('Test: Toggle Persistence');

        // Setup
        global.localStorage.clear();
        const initialTasks = [
            { id: 1, text: 'Task 1', completed: true },
            { id: 2, text: 'Task 2', completed: false }
        ];
        global.localStorage.setItem('zenFocusTasks', JSON.stringify(initialTasks));

        const listElement = global.document.createElement('ul');
        const inputElement = global.document.createElement('input');
        const addButtonElement = global.document.createElement('button');
        const taskManager = new TaskManager(listElement, inputElement, addButtonElement);

        // Verification
        assert(taskManager.tasks.length === 2, 'Should load 2 tasks');

        const task1Li = listElement.children[0];
        assert(task1Li.classList.contains('completed'), 'Task 1 should have "completed" class');
        assert(task1Li.dataset.id === 1, 'Task 1 ID matches');

        const task2Li = listElement.children[1];
        assert(!task2Li.classList.contains('completed'), 'Task 2 should not have "completed" class');
        assert(task2Li.dataset.id === 2, 'Task 2 ID matches');

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
