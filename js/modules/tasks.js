export class TaskManager {
    constructor(listElement, inputElement, addButtonElement) {
        this.tasks = JSON.parse(localStorage.getItem('zenFocusTasks')) || [];
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

        // Event delegation for delete and toggle
        this.listElement.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn')) {
                const id = this.getTaskId(e.target);
                this.deleteTask(id);
            } else if (e.target.tagName === 'LI' || e.target.tagName === 'SPAN') {
                const id = this.getTaskId(e.target);
                this.toggleTask(id);
            }
        });

        // Keyboard navigation for tasks
        this.listElement.addEventListener('keydown', (e) => {
            const li = e.target.closest('li');
            if (li && e.target.tagName === 'SPAN' && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                const id = this.getTaskId(li);
                this.toggleTask(id);
            }
        });
    }

    getTaskId(element) {
        return parseInt(element.closest('li').dataset.id, 10);
    }

    saveTasks() {
        localStorage.setItem('zenFocusTasks', JSON.stringify(this.tasks));
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

        const span = document.createElement('span');
        span.textContent = task.text;
        span.tabIndex = 0;
        span.setAttribute('role', 'checkbox');
        span.setAttribute('aria-checked', task.completed);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '×';
        deleteBtn.setAttribute('aria-label', `Delete task: ${task.text}`);
        deleteBtn.dataset.id = task.id;

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

        const span = li.querySelector('span');
        if (span) {
            if (span.getAttribute('aria-checked') !== String(task.completed)) {
                span.setAttribute('aria-checked', task.completed);
            }
            if (span.textContent !== task.text) {
                span.textContent = task.text;
                const deleteBtn = li.querySelector('.delete-btn');
                if (deleteBtn) {
                    deleteBtn.setAttribute('aria-label', `Delete task: ${task.text}`);
                }
            }
        }
    }
}
