
import { showNotification } from './notification.js';

export class PomodoroTimer {
    constructor(displayElement, startBtn, pauseBtn, resetBtn, workInput, breakInput, autoStartCheckbox, notifier = showNotification) {
        this.displayElement = displayElement;
        this.startBtn = startBtn;
        this.pauseBtn = pauseBtn;
        this.resetBtn = resetBtn;
        this.workInput = workInput;
        this.breakInput = breakInput;
        this.autoStartCheckbox = autoStartCheckbox;
        this.notifier = notifier;
        this.timerSection = document.getElementById('timer-section');
        this.sessionLabel = document.querySelector('.session-label');

        this.timeLeft = 25 * 60; // Default 25 minutes
        this.timerId = null;
        this.isWorkSession = true;
        this.isRunning = false;
        this.audioCtx = null;

        this.bindEvents();
        this.updateDisplay();
        this.updateSessionIndicator();
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());

        this.workInput.addEventListener('change', () => {
            if (!this.isRunning && this.isWorkSession) {
                this.timeLeft = this.getValidTime(this.workInput) * 60;
                this.updateDisplay();
            }
        });

        this.breakInput.addEventListener('change', () => {
            if (!this.isRunning && !this.isWorkSession) {
                this.timeLeft = this.getValidTime(this.breakInput) * 60;
                this.updateDisplay();
            }
        });
    }

    getValidTime(input) {
        const value = Math.max(1, parseInt(input.value) || 1);
        input.value = value;
        return value;
    }

    initAudio() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioCtx = new AudioContext();
            }
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    start() {
        if (!this.isRunning) {
            this.initAudio();
            this.isRunning = true;
            this.timerId = setInterval(() => {
                this.timeLeft--;
                this.updateDisplay();
                if (this.timeLeft === 0) {
                    this.completeSession();
                }
            }, 1000);
            this.toggleControls(true);
        }
    }

    pause() {
        if (this.isRunning) {
            this.isRunning = false;
            clearInterval(this.timerId);
            this.toggleControls(false);
        }
    }

    reset() {
        this.pause();
        this.isWorkSession = true;
        this.timeLeft = this.getValidTime(this.workInput) * 60;
        this.updateDisplay();
        this.updateSessionIndicator();
    }

    completeSession() {
        this.pause();
        this.playSound();

        // Switch session
        this.isWorkSession = !this.isWorkSession;
        this.updateSessionIndicator();

        let message;
        let type;
        if (this.isWorkSession) {
            this.timeLeft = this.getValidTime(this.workInput) * 60;
            message = 'Break is over! Time to work.';
            type = 'info';
        } else {
            this.timeLeft = this.getValidTime(this.breakInput) * 60;
            message = 'Work session complete! Take a break.';
            type = 'success';
        }

        this.updateDisplay();

        setTimeout(() => {
            if (this.notifier) {
                this.notifier(message, type);
            }
            if (this.autoStartCheckbox && this.autoStartCheckbox.checked) {
                this.start();
            }
        }, 10);
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.displayElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Update document title for visibility in other tabs
        document.title = `${this.displayElement.textContent} - ZenFocus`;
    }

    updateSessionIndicator() {
        if (this.timerSection) {
            this.timerSection.classList.toggle('break-mode', !this.isWorkSession);
        }
        if (this.sessionLabel) {
            this.sessionLabel.textContent = this.isWorkSession ? 'Work' : 'Break';
        }
    }

    toggleControls(running) {
        this.startBtn.disabled = running;
        this.pauseBtn.disabled = !running;
    }

    playSound() {
        try {
            this.initAudio();

            if (this.audioCtx) {
                const now = this.audioCtx.currentTime;

                // Play a pleasant major triad arpeggio (C5, E5, G5)
                const notes = [523.25, 659.25, 783.99];

                notes.forEach((freq, index) => {
                    const oscillator = this.audioCtx.createOscillator();
                    const gainNode = this.audioCtx.createGain();

                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioCtx.destination);

                    oscillator.type = 'sine';
                    oscillator.frequency.value = freq;

                    // Stagger notes slightly for an arpeggio effect
                    const startTime = now + (index * 0.1);
                    const duration = 0.5;

                    // Envelope: fast attack, slow exponential decay
                    gainNode.gain.setValueAtTime(0, startTime);
                    gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

                    oscillator.start(startTime);
                    oscillator.stop(startTime + duration);
                });
            }
        } catch (e) {
            console.error('Audio play failed', e);
        }
    }
}
