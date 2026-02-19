
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

    // Test 7: Corrupted LocalStorage
    try {
        console.log('Test: Initialization with corrupted LocalStorage');

        // Setup: Corrupt the data
        global.localStorage.setItem('zenFocusTasks', 'INVALID JSON {');

        const listElement = global.document.createElement('ul');
        const inputElement = global.document.createElement('input');
        const addButtonElement = global.document.createElement('button');

        // Action: Initialize TaskManager (should not throw)
        let errorThrown = false;
        let taskManager;
        try {
            taskManager = new TaskManager(listElement, inputElement, addButtonElement);
        } catch (e) {
            errorThrown = true;
            console.error(e);
        }

        // Verification
        assert(!errorThrown, 'TaskManager initialization should not throw on corrupted data');
        assert(taskManager.tasks.length === 0, 'Tasks should be empty after corruption reset');
        assert(global.localStorage.getItem('zenFocusTasks') === '[]', 'LocalStorage should be reset to empty array');

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

    // Test 7: Accessibility Attributes
    try {
        console.log('Test: Accessibility Attributes');

        // Setup
        global.localStorage.clear();
        const listElement = global.document.createElement('ul');
        const inputElement = global.document.createElement('input');
        const addButtonElement = global.document.createElement('button');
        const taskManager = new TaskManager(listElement, inputElement, addButtonElement);

        // Add a task
        inputElement.value = 'Accessible Task';
        taskManager.addTask();

        const taskLi = listElement.children[0];
        const span = taskLi.querySelector('span');
        const deleteBtn = taskLi.querySelector('.delete-btn');

        // Verification
        assert(span.getAttribute('role') === 'checkbox', 'Task text should have role="checkbox"');
        // Check both property and attribute as mock might behave differently than real DOM depending on implementation details
        // In our mock, we implemented setAttribute and tabIndex property separately, but creating logic sets property.
        // Wait, creating logic: span.tabIndex = 0;
        assert(span.tabIndex === 0, 'Task text should be focusable (tabIndex property)');
        assert(span.getAttribute('aria-checked') === 'false', 'Task text should have aria-checked="false" initially');
        assert(deleteBtn.getAttribute('aria-label') === 'Delete task: Accessible Task', 'Delete button should have correct aria-label');

        // Toggle task
        const task = taskManager.tasks[0];
        taskManager.toggleTask(task.id);

        // render() is called which re-creates elements in current implementation
        // So we need to re-query elements
        const updatedTaskLi = listElement.children[0];
        const updatedSpan = updatedTaskLi.querySelector('span');

        assert(updatedSpan.getAttribute('aria-checked') === 'true', 'Task text should have aria-checked="true" after toggle');

        console.log('PASS');
        passed++;
    } catch (e) {
        console.error('FAIL:', e.message);
        console.error(e.stack);
        failed++;
    }

    // Test 8: Keyboard Interaction
    try {
        console.log('Test: Keyboard Interaction');

        // Setup
        global.localStorage.clear();
        const listElement = global.document.createElement('ul');
        const inputElement = global.document.createElement('input');
        const addButtonElement = global.document.createElement('button');
        const taskManager = new TaskManager(listElement, inputElement, addButtonElement);

        // Add a task
        inputElement.value = 'Keyboard Task';
        taskManager.addTask();
        let taskLi = listElement.children[0];
        let span = taskLi.querySelector('span');
        const task = taskManager.tasks[0];

        // Simulate Keydown 'Enter' on span
        const triggerKeydown = (key, target) => {
            const event = {
                target: target,
                key: key,
                preventDefault: () => {},
                stopPropagation: () => {}
            };
            // Access listeners from the mock object
            if (listElement.listeners['keydown']) {
                listElement.listeners['keydown'].forEach(cb => cb(event));
            }
        };

        // Action: Press Enter on span
        triggerKeydown('Enter', span);

        // Re-query because render() replaces elements
        taskLi = listElement.children[0];
        span = taskLi.querySelector('span');

        // Verification
        assert(task.completed === true, 'Task should be completed after Enter key');
        assert(span.getAttribute('aria-checked') === 'true', 'aria-checked should be true');

        // Action: Press Space on span
        triggerKeydown(' ', span);

        // Re-query
        taskLi = listElement.children[0];
        span = taskLi.querySelector('span');

        // Verification
        assert(task.completed === false, 'Task should be incomplete after Space key');
        assert(span.getAttribute('aria-checked') === 'false', 'aria-checked should be false');

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
