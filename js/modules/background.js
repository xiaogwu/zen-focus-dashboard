export class BackgroundManager {
    constructor() {
        this.apiKey = localStorage.getItem('unsplashApiKey') || '';
        this.fallbackImages = [
            {
                url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
                author: 'V2osk',
                link: 'https://unsplash.com/@v2osk'
            },
            {
                url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
                author: 'Lukasz Szmigiel',
                link: 'https://unsplash.com/@szmigiel'
            },
            {
                url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
                author: 'Patrick Hendry',
                link: 'https://unsplash.com/@worldsbetweenlines'
            }
        ];
    }

    async setBackground() {
        const timeOfDay = this.getTimeOfDay();
        let imageData = null;

        if (this.apiKey) {
            try {
                imageData = await this.fetchUnsplashImage(timeOfDay);
            } catch (error) {
                console.warn('Failed to fetch Unsplash image:', error);
            }
        }

        if (!imageData) {
            // Use fallback based on time of day (mocking "dynamic" aspect)
            let index = 0; // Default to morning
            if (timeOfDay === 'afternoon') {
                index = 1;
            } else if (timeOfDay === 'evening') {
                index = 2;
            }
            imageData = this.fallbackImages[index];
        }

        this.applyBackground(imageData);
    }

    getTimeOfDay() {
        const hour = new Date().getHours();
        if (hour < 12) return 'morning';
        if (hour < 18) return 'afternoon';
        return 'evening';
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
        document.body.style.backgroundImage = `url('${image.url}')`;

        const creditElement = document.getElementById('background-credit');
        const authorElement = document.getElementById('photo-author');

        if (creditElement && authorElement) {
            authorElement.textContent = image.author;
            // Optionally make it a link
            // authorElement.innerHTML = `<a href="${image.link}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline;">${image.author}</a>`;
        }
    }
}
