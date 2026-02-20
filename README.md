# Zen Focus Dashboard

A minimalist, aesthetic productivity dashboard that combines task management with focus tools. It demonstrates mastery of vanilla JavaScript without relying on frameworks.

## Features

- **Pomodoro Timer**: Customizable work and break intervals with auto-start functionality.
- **Task Manager**: Add, complete, and delete tasks. Tasks are persisted using LocalStorage.
- **Dynamic Backgrounds**: Beautiful background images that change based on the time of day. Supports Unsplash API for random nature images.
- **Weather Widget**: Real-time weather updates based on your location (requires OpenWeatherMap API key).

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge).
- (Optional) Node.js for running tests.

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd zen-focus-dashboard
   ```

2. Open `index.html` in your browser.
   - You can simply double-click the file, or serve it using a local server:
     ```bash
     # Using Python
     python3 -m http.server

     # Using Node.js (npx)
     npx serve
     ```

## Usage

### Dashboard
The dashboard is divided into sections for the timer, tasks, and weather.

### Pomodoro Timer
1. Set your desired **Work** and **Break** duration (in minutes).
2. Click **Start** to begin the timer.
3. Use **Pause** to temporarily stop the timer or **Reset** to start over.
4. Enable **Auto-start** to automatically begin the next session (work or break) when the current one ends.

### Task Manager
1. Type a task in the input field.
2. Click the **+** button or press **Enter** to add the task.
3. Click a task to mark it as completed.
4. Click the **Trash** icon to delete a task.

### Configuration

#### Weather
To enable real-time weather data:
1. Click on the Weather widget (top right).
2. Enter your **OpenWeatherMap API Key** in the settings dialog.
   - You can get a free key from [OpenWeatherMap](https://openweathermap.org/api).
3. The key is stored in your browser's Session Storage for security.

#### Dynamic Backgrounds
To enable high-quality Unsplash backgrounds:
1. Open your browser's developer tools (F12).
2. Go to the **Application** tab (or Storage).
3. Select **Session Storage**.
4. Add a new key: `unsplashApiKey` with your Unsplash Access Key as the value.
5. Refresh the page.
   - Without an API key, the dashboard uses a curated set of fallback images.

## Testing

The project includes unit tests written in vanilla JavaScript (ES Modules).

To run the tests, you need Node.js installed.

```bash
# Run all tests (example command, adjust based on actual test files)
node tests/timer.test.mjs
node tests/tasks.test.mjs
node tests/weather.test.mjs
node tests/background.test.mjs
```

## Technologies

- **HTML5**: Semantic structure.
- **CSS3**: Variables, Grid, Flexbox for layout and styling.
- **JavaScript (ES6+)**: Modules, Classes, Async/Await, LocalStorage/SessionStorage APIs.

## License

[MIT](LICENSE)
