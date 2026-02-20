import { TaskManager } from './tasks.js';

describe('TaskManager', () => {
    let listElement;
    let inputElement;
    let addButtonElement;
    let taskManager;

    beforeEach(() => {
        // Clear localStorage
        localStorage.clear();

        // Setup DOM elements
        listElement = document.createElement('ul');
        inputElement = document.createElement('input');
        addButtonElement = document.createElement('button');

        // Initialize TaskManager
        taskManager = new TaskManager(listElement, inputElement, addButtonElement);
    });

    test('should initialize with empty tasks', () => {
        expect(taskManager.tasks).toEqual([]);
        expect(listElement.children.length).toBe(0);
    });

    test('should initialize with tasks from localStorage', () => {
        const storedTasks = [
            { id: 1, text: 'Stored Task', completed: false }
        ];
        localStorage.setItem('zenFocusTasks', JSON.stringify(storedTasks));

        // Re-initialize to pick up stored tasks
        const newTaskManager = new TaskManager(listElement, inputElement, addButtonElement);

        expect(newTaskManager.tasks.length).toBe(1);
        expect(newTaskManager.tasks[0].text).toBe('Stored Task');
        expect(listElement.children.length).toBe(1);

        // Verify checkbox exists
        const li = listElement.children[0];
        const checkbox = li.querySelector('.task-checkbox');
        expect(checkbox).not.toBeNull();
        expect(checkbox.type).toBe('checkbox');
        expect(checkbox.checked).toBe(false);
    });

    test('should add a new task', () => {
        inputElement.value = 'New Task';
        taskManager.addTask();

        expect(taskManager.tasks.length).toBe(1);
        expect(taskManager.tasks[0].text).toBe('New Task');
        expect(listElement.children.length).toBe(1);

        // Verify localStorage update
        const stored = JSON.parse(localStorage.getItem('zenFocusTasks'));
        expect(stored.length).toBe(1);
        expect(stored[0].text).toBe('New Task');
    });

    test('should not add task if input is empty', () => {
        inputElement.value = '   '; // Only whitespace
        taskManager.addTask();

        expect(taskManager.tasks.length).toBe(0);
        expect(listElement.children.length).toBe(0);
    });

    test('should delete a task', () => {
        // Add a task first
        inputElement.value = 'Task to delete';
        taskManager.addTask();
        const taskId = taskManager.tasks[0].id;

        // Delete it
        taskManager.deleteTask(taskId);

        expect(taskManager.tasks.length).toBe(0);
        expect(listElement.children.length).toBe(0);

        const stored = JSON.parse(localStorage.getItem('zenFocusTasks'));
        expect(stored.length).toBe(0);
    });

    test('should toggle task completion', () => {
        // Add a task
        inputElement.value = 'Task to toggle';
        taskManager.addTask();
        const taskId = taskManager.tasks[0].id;

        // Toggle it
        taskManager.toggleTask(taskId);

        expect(taskManager.tasks[0].completed).toBe(true);
        // Find the li element
        const li = listElement.querySelector(`li[data-id="${taskId}"]`);
        expect(li.classList.contains('completed')).toBe(true);

        // Verify checkbox state
        const checkbox = li.querySelector('.task-checkbox');
        expect(checkbox.checked).toBe(true);

        const stored = JSON.parse(localStorage.getItem('zenFocusTasks'));
        expect(stored[0].completed).toBe(true);

        // Toggle back
        taskManager.toggleTask(taskId);
        expect(taskManager.tasks[0].completed).toBe(false);

        // Re-query the li element as render() recreates DOM nodes
        const updatedLi = listElement.querySelector(`li[data-id="${taskId}"]`);
        expect(updatedLi.classList.contains('completed')).toBe(false);

        const updatedCheckbox = updatedLi.querySelector('.task-checkbox');
        expect(updatedCheckbox.checked).toBe(false);
    });
});
