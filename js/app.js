import { TaskManager } from './modules/tasks.js';
import { PomodoroTimer } from './modules/timer.js';
import { BackgroundManager } from './modules/background.js';
import { WeatherWidget } from './modules/weather.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Task Manager
    const taskList = document.getElementById('task-list');
    const taskInput = document.getElementById('new-task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    if (taskList && taskInput && addTaskBtn) {
        new TaskManager(taskList, taskInput, addTaskBtn);
    }

    // Initialize Pomodoro Timer
    const timerDisplay = document.querySelector('.timer-display');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resetBtn = document.getElementById('reset-btn');
    const workInput = document.getElementById('work-duration');
    const breakInput = document.getElementById('break-duration');
    if (timerDisplay && startBtn && pauseBtn && resetBtn && workInput && breakInput) {
        new PomodoroTimer(timerDisplay, startBtn, pauseBtn, resetBtn, workInput, breakInput);
    }

    // Initialize Dynamic Backgrounds
    const backgroundManager = new BackgroundManager();
    backgroundManager.setBackground();

    // Initialize Weather Widget
    const weatherWidgetElement = document.getElementById('weather-widget');
    if (weatherWidgetElement) {
        const weatherWidget = new WeatherWidget(weatherWidgetElement);
        weatherWidget.init();
    }
});
