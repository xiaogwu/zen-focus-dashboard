export class TaskManager {
    constructor(listElement, inputElement, addButtonElement) {
        try {
            this.tasks = JSON.parse(localStorage.getItem('zenFocusTasks')) || [];
        } catch (e) {
            console.warn('Failed to parse tasks from localStorage. Resetting data.', e);
            this.tasks = [];
            localStorage.setItem('zenFocusTasks', JSON.stringify([]));
        }
        this.listElement = listElement;
        this.inputElement = inputElement;
        this.addButtonElement = addButtonElement;

        this.bindEvents();
        this.render();
    }

    bindEvents() {
        this.addButtonElement.addEventListener('click', () => this.addTask());
        this.inputElement.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Event delegation for delete, toggle, and edit
        this.listElement.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn')) {
                const id = this.getTaskId(e.target);
                this.deleteTask(id);
            } else if (e.target.classList.contains('task-checkbox')) {
                const id = this.getTaskId(e.target);
                this.toggleTask(id);
            } else if (e.target.tagName === 'SPAN') {
                const li = e.target.closest('li');
                if (li) {
                    const id = this.getTaskId(li);
                    this.startEdit(li, id);
                }
            }
        });

        // Keyboard navigation for tasks
        this.listElement.addEventListener('keydown', (e) => {
            const li = e.target.closest('li');
            if (!li) return;
            if (e.target.classList.contains('task-checkbox') && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                const id = this.getTaskId(li);
                this.toggleTask(id);
            } else if (e.target.tagName === 'SPAN' && e.key === 'Enter') {
                e.preventDefault();
                const id = this.getTaskId(li);
                this.startEdit(li, id);
            }
        });
    }

    getTaskId(element) {
        return parseInt(element.closest('li').dataset.id, 10);
    }

    saveTasks() {
        try {
            localStorage.setItem('zenFocusTasks', JSON.stringify(this.tasks));
        } catch (e) {
            console.warn('Failed to save tasks to localStorage:', e);
        }
        this.render();
    }

    addTask() {
        const text = this.inputElement.value.trim();
        if (text) {
            const newTask = {
                id: Date.now(),
                text: text,
                completed: false
            };
            this.tasks.push(newTask);
            this.inputElement.value = '';
            this.saveTasks();
        }
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveTasks();
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
        }
    }

    render() {
        if (this.tasks.length === 0) {
            this.listElement.innerHTML = '';
            return;
        }

        const existingElements = new Map();
        for (const li of this.listElement.children) {
            if (li.dataset.id) {
                existingElements.set(li.dataset.id, li);
            }
        }

        const fragment = document.createDocumentFragment();

        this.tasks.forEach((task, index) => {
            const taskId = String(task.id);
            let li = existingElements.get(taskId);

            if (li) {
                this.updateTaskElement(li, task);
                existingElements.delete(taskId);
            } else {
                li = this.createTaskElement(task);
            }

            const currentChild = this.listElement.children[index];
            if (currentChild) {
                if (currentChild !== li) {
                    this.listElement.insertBefore(li, currentChild);
                }
            } else {
                fragment.appendChild(li);
            }
        });

        this.listElement.appendChild(fragment);

        existingElements.forEach(li => li.remove());
    }

    createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.dataset.id = task.id;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.completed;
        checkbox.className = 'task-checkbox';
        checkbox.setAttribute('aria-label', `Mark "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`);

        const span = document.createElement('span');
        span.textContent = task.text;
        span.tabIndex = 0;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '×';
        deleteBtn.setAttribute('aria-label', `Delete task: ${task.text}`);
        deleteBtn.dataset.id = task.id;

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(deleteBtn);
        // Cache span reference for performance to avoid querySelector in render loop
        li._taskSpan = span;
        return li;
    }

    updateTaskElement(li, task) {
        const isCompleted = li.classList.contains('completed');
        if (task.completed !== isCompleted) {
            li.classList.toggle('completed', task.completed);
        }

        const checkbox = li.querySelector('.task-checkbox');
        if (checkbox) {
            checkbox.checked = task.completed;
            checkbox.setAttribute('aria-label', `Mark "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`);
        }

        const span = li.querySelector('span');
        if (span) {
            if (span.textContent !== task.text) {
                span.textContent = task.text;
                const deleteBtn = li.querySelector('.delete-btn');
                if (deleteBtn) {
                    deleteBtn.setAttribute('aria-label', `Delete task: ${task.text}`);
                }
            }
        }
    }

    startEdit(li, taskId) {
        if (li.classList.contains('editing')) return;

        const span = li.querySelector('span');
        if (!span) return;

        const originalText = span.textContent;
        li.classList.add('editing');

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'task-edit-input';
        input.value = originalText;

        const commitEdit = () => {
            if (input.parentElement !== li) return;
            this.saveEdit(taskId, input.value, originalText);
            li.classList.remove('editing');
            li.removeChild(input);
            span.style.display = '';
        };

        input.addEventListener('blur', () => {
            commitEdit();
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                input.blur();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                input.value = originalText;
                input.blur();
            }
        });

        span.style.display = 'none';
        li.insertBefore(input, span.nextSibling || li.querySelector('.delete-btn'));
        input.focus();
        input.select();
    }

    saveEdit(taskId, newText, originalText) {
        const trimmed = newText.trim();
        if (!trimmed) return;

        const task = this.tasks.find(t => t.id === taskId);
        if (task && task.text !== trimmed) {
            task.text = trimmed;
            this.saveTasks();
        }
    }
}
