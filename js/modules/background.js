export class BackgroundManager {
    constructor() {
        this.apiKey = sessionStorage.getItem('unsplashApiKey') || '';
        this.fallbackImages = {
            morning: [
                {
                    url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
                    author: 'V2osk',
                    link: 'https://unsplash.com/@v2osk'
                }
            ],
            afternoon: [
                {
                    url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
                    author: 'Lukasz Szmigiel',
                    link: 'https://unsplash.com/@szmigiel'
                }
            ],
            evening: [
                {
                    url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
                    author: 'Patrick Hendry',
                    link: 'https://unsplash.com/@worldsbetweenlines'
                }
            ]
        };
    }

    async setBackground() {
        const timeOfDay = this.getTimeOfDay();
        let imageData = null;
        const cacheKey = 'zenfocus_bg_cache';

        // Try to load from cache
        const cachedData = localStorage.getItem('zenfocus_bg_cache');
        if (cachedData) {
            try {
                const parsed = JSON.parse(cachedData);
                const now = new Date().getTime();
                const oneHour = 60 * 60 * 1000;

                if (now - parsed.timestamp < oneHour && parsed.timeOfDay === timeOfDay) {
                    imageData = parsed.imageData;
                }
            } catch (e) {
                console.warn('Failed to parse cached background:', e);
            }
        }

        if (!imageData && this.apiKey) {
            try {
                imageData = await this.fetchUnsplashImage(timeOfDay);
                // Cache the new image
                localStorage.setItem('zenfocus_bg_cache', JSON.stringify({
                    timestamp: new Date().getTime(),
                    timeOfDay: timeOfDay,
                    imageData: imageData
                }));
            } catch (error) {
                console.warn('Failed to fetch Unsplash image:', error);
            }
        }

        if (!imageData) {
            // Use fallback based on time of day with daily rotation
            const images = this.fallbackImages[timeOfDay] || this.fallbackImages.morning;

            if (images && images.length > 0) {
                const dayOfYear = this.getDayOfYear();
                const index = dayOfYear % images.length;
                imageData = images[index];
            }
        }

        this.applyBackground(imageData);
    }

    getTimeOfDay() {
        const hour = new Date().getHours();
        if (hour < 12) return 'morning';
        if (hour < 18) return 'afternoon';
        return 'evening';
    }

    getDayOfYear() {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = now - start;
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
    }

    async fetchUnsplashImage(query) {
        const response = await fetch(`https://api.unsplash.com/photos/random?query=nature,${query}&orientation=landscape&client_id=${this.apiKey}`);
        if (!response.ok) throw new Error('Unsplash API Error');
        const data = await response.json();
        return {
            url: data.urls.regular,
            author: data.user.name,
            link: data.user.links.html
        };
    }

    applyBackground(image) {
        if (!image || !image.url || !image.url.startsWith('https://images.unsplash.com/')) {
            console.warn('Blocked attempt to load non-Unsplash image:', image?.url);
            return;
        }

        document.body.style.backgroundImage = `url('${image.url}')`;

        const creditElement = document.getElementById('background-credit');
        const authorElement = document.getElementById('photo-author');

        if (creditElement && authorElement) {
            authorElement.textContent = image.author;
        }
    }
}
