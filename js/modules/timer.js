export class PomodoroTimer {
    constructor(displayElement, startBtn, pauseBtn, resetBtn, workInput, breakInput) {
        this.displayElement = displayElement;
        this.startBtn = startBtn;
        this.pauseBtn = pauseBtn;
        this.resetBtn = resetBtn;
        this.workInput = workInput;
        this.breakInput = breakInput;

        this.timeLeft = 25 * 60; // Default 25 minutes
        this.timerId = null;
        this.isWorkSession = true;
        this.isRunning = false;
        this.audioCtx = null;

        this.bindEvents();
        this.updateDisplay();
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());

        this.workInput.addEventListener('change', () => {
            if (!this.isRunning && this.isWorkSession) {
                this.timeLeft = this.workInput.value * 60;
                this.updateDisplay();
            }
        });

        this.breakInput.addEventListener('change', () => {
            if (!this.isRunning && !this.isWorkSession) {
                this.timeLeft = this.breakInput.value * 60;
                this.updateDisplay();
            }
        });
    }

    start() {
        if (!this.isRunning) {
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
        this.timeLeft = this.workInput.value * 60;
        this.updateDisplay();
    }

    completeSession() {
        this.pause();
        this.playSound();

        // Switch session
        this.isWorkSession = !this.isWorkSession;
        if (this.isWorkSession) {
            this.timeLeft = this.workInput.value * 60;
            setTimeout(() => alert('Break is over! Time to work.'), 10);
        } else {
            this.timeLeft = this.breakInput.value * 60;
            setTimeout(() => alert('Work session complete! Take a break.'), 10);
        }
        this.updateDisplay();
        // Automatically start the next session? Maybe not. Let the user start.
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.displayElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Update document title for visibility in other tabs
        document.title = `${this.displayElement.textContent} - ZenFocus`;
    }

    toggleControls(running) {
        this.startBtn.disabled = running;
        this.pauseBtn.disabled = !running;
    }

    playSound() {
        // Simple beep using AudioContext or just console.log for now if no file
        // Using a data URI for a simple beep sound could work, but let's stick to alert for simplicity as per plan
        // Or I can try to use a simple oscillator
        try {
            if (!this.audioCtx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) {
                    this.audioCtx = new AudioContext();
                }
            }

            if (this.audioCtx) {
                // Ensure context is running (it might be suspended by the browser)
                if (this.audioCtx.state === 'suspended') {
                    this.audioCtx.resume();
                }

                const oscillator = this.audioCtx.createOscillator();
                const gainNode = this.audioCtx.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(this.audioCtx.destination);

                oscillator.type = 'sine';
                oscillator.frequency.value = 880; // A5
                gainNode.gain.value = 0.1;

                oscillator.start();
                setTimeout(() => oscillator.stop(), 500);
            }
        } catch (e) {
            console.error('Audio play failed', e);
        }
    }
}
