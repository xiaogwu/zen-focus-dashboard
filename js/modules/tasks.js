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
        this.listElement.innerHTML = '';
        this.tasks.forEach(task => {
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
            this.listElement.appendChild(li);
        });
    }
}
