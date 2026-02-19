
class MockHTMLElement {
    constructor(tagName = 'DIV') {
        this.tagName = tagName.toUpperCase();
        this.classList = {
            contains: (cls) => this.classes.includes(cls),
            add: (cls) => { if (!this.classes.includes(cls)) this.classes.push(cls); },
            remove: (cls) => this.classes = this.classes.filter(c => c !== cls),
            toggle: (cls, force) => {
                const has = this.classes.includes(cls);
                const shouldAdd = force !== undefined ? force : !has;
                if (shouldAdd && !has) this.classes.push(cls);
                if (!shouldAdd && has) this.classes = this.classes.filter(c => c !== cls);
                return shouldAdd;
            }
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

    insertBefore(newNode, referenceNode) {
        if (!referenceNode) {
            this.appendChild(newNode);
            return newNode;
        }
        const index = this.children.indexOf(referenceNode);
        if (index > -1) {
            this.children.splice(index, 0, newNode);
            newNode.parentElement = this;
        } else {
            this.appendChild(newNode);
        }
        return newNode;
    }

    remove() {
        if (this.parentElement) {
            this.parentElement.children = this.parentElement.children.filter(c => c !== this);
            this.parentElement = null;
        }
    }

    querySelector(selector) {
        // Very basic selector support: tag name only
        return this.children.find(c => c.tagName.toLowerCase() === selector.toLowerCase()) || null;
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

    remove() {
        if (this.parentElement) {
            this.parentElement.children = this.parentElement.children.filter(c => c !== this);
            this.parentElement = null;
        }
    }
}

global.MockHTMLElement = MockHTMLElement;

global.document = {
    createElement: (tag) => new MockHTMLElement(tag),
    getElementById: (id) => new MockHTMLElement('div'), // default to div
    querySelector: (selector) => new MockHTMLElement('div'),
    body: new MockHTMLElement('body')
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
