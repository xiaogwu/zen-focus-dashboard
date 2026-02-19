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
        const existingElements = new Map();
        Array.from(this.listElement.children).forEach(li => {
            if (li.dataset.id) {
                existingElements.set(li.dataset.id, li);
            }
        });

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
            if (currentChild !== li) {
                if (currentChild) {
                    this.listElement.insertBefore(li, currentChild);
                } else {
                    this.listElement.appendChild(li);
                }
            }
        });

        existingElements.forEach(li => li.remove());
    }

    createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.dataset.id = task.id;

        const span = document.createElement('span');
        span.textContent = task.text;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '×';
        deleteBtn.dataset.id = task.id;

        li.appendChild(span);
        li.appendChild(deleteBtn);
        return li;
    }

    updateTaskElement(li, task) {
        const isCompleted = li.classList.contains('completed');
        if (task.completed !== isCompleted) {
            li.classList.toggle('completed', task.completed);
        }

        const span = li.querySelector('span');
        if (span && span.textContent !== task.text) {
            span.textContent = task.text;
        }
    }
}
