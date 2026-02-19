
class MockHTMLElement {
    constructor(tagName = 'DIV') {
        this.tagName = tagName.toUpperCase();
        this.classList = {
            contains: (cls) => this.classes.includes(cls),
            add: (cls) => { if (!this.classes.includes(cls)) this.classes.push(cls); },
            remove: (cls) => this.classes = this.classes.filter(c => c !== cls)
        };
        this.classes = [];
        this.dataset = {};
        this.children = [];
        this.listeners = {};
        this.style = {};
        this._innerHTML = '';
        this.textContent = '';
        this.value = '';
        this.parentElement = null;
    }

    set className(val) {
        this.classes = val.split(' ').filter(c => c.length > 0);
    }

    get className() {
        return this.classes.join(' ');
    }

    set innerHTML(html) {
        this._innerHTML = html;
        this.children = []; // clear children
    }

    get innerHTML() {
        return this._innerHTML;
    }

    addEventListener(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    appendChild(child) {
        this.children.push(child);
        child.parentElement = this;
    }

    closest(selector) {
        // Simple selector matching for tag names (e.g., 'li')
        if (this.tagName.toLowerCase() === selector.toLowerCase()) {
            return this;
        }
        if (this.parentElement) {
            return this.parentElement.closest(selector);
        }
        return null;
    }

    // Helper to simulate event
    click() {
        if (this.listeners['click']) {
            this.listeners['click'].forEach(cb => cb({ target: this }));
        }
    }
}

global.MockHTMLElement = MockHTMLElement;

global.document = {
    createElement: (tag) => new MockHTMLElement(tag),
    getElementById: (id) => new MockHTMLElement('div'), // default to div
    querySelector: (selector) => new MockHTMLElement('div')
};

global.localStorage = {
    store: {},
    getItem: (key) => global.localStorage.store[key] || null,
    setItem: (key, value) => { global.localStorage.store[key] = value.toString(); },
    clear: () => { global.localStorage.store = {}; },
    removeItem: (key) => { delete global.localStorage.store[key]; }
};

global.sessionStorage = {
    store: {},
    getItem: (key) => global.sessionStorage.store[key] || null,
    setItem: (key, value) => { global.sessionStorage.store[key] = value.toString(); },
    clear: () => { global.sessionStorage.store = {}; },
    removeItem: (key) => { delete global.sessionStorage.store[key]; }
};

global.sessionStorage = {
    store: {},
    getItem: (key) => global.sessionStorage.store[key] || null,
    setItem: (key, value) => { global.sessionStorage.store[key] = value.toString(); },
    removeItem: (key) => { delete global.sessionStorage.store[key]; },
    clear: () => { global.sessionStorage.store = {}; }
};

// Mock window/global properties if needed
global.window = global;
