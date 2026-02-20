
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

        // Dialog specific properties
        this.open = false;
        this.returnValue = '';

        this.attributes = {};
        this.tabIndex = -1;
    }

    setAttribute(name, value) {
        this.attributes[name] = String(value);
    }

    getAttribute(name) {
        return this.attributes[name] || null;
    }

    hasAttribute(name) {
        return Object.prototype.hasOwnProperty.call(this.attributes, name);
    }

    showModal() {
        this.open = true;
    }

    close(returnValue) {
        this.open = false;
        if (returnValue !== undefined) {
            this.returnValue = returnValue;
        }
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
        if (child.tagName === 'DOCUMENT_FRAGMENT') {
            child.children.forEach(c => {
                this.children.push(c);
                c.parentElement = this;
            });
            child.children = [];
            return child;
        }
        this.children.push(child);
        child.parentElement = this;
        return child;
    }

    insertBefore(newNode, referenceNode) {
        if (!referenceNode) {
            return this.appendChild(newNode);
        }

        if (newNode.tagName === 'DOCUMENT_FRAGMENT') {
             const index = this.children.indexOf(referenceNode);
             if (index > -1) {
                 const newChildren = [...newNode.children];
                 newChildren.forEach(c => c.parentElement = this);
                 this.children.splice(index, 0, ...newChildren);
                 newNode.children = [];
                 return newNode;
             } else {
                 return this.appendChild(newNode);
             }
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

    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index > -1) {
            this.children.splice(index, 1);
            child.parentElement = null;
        }
        return child;
    }

    focus() {}

    select() {}

    blur() {
        if (this.listeners['blur']) {
            this.listeners['blur'].forEach(cb => cb({
                target: this,
                stopPropagation: () => {},
                preventDefault: () => {}
            }));
        }
    }

    get nextSibling() {
        if (!this.parentElement) return null;
        const siblings = this.parentElement.children;
        const index = siblings.indexOf(this);
        return index > -1 && index < siblings.length - 1 ? siblings[index + 1] : null;
    }

    querySelector(selector) {
        if (selector.startsWith('.')) {
            const className = selector.substring(1);
            return this.children.find(c => c.classList.contains(className)) || null;
        }
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
            this.listeners['click'].forEach(cb => cb({
                target: this,
                stopPropagation: () => {},
                preventDefault: () => {}
            }));
        }
    }
}

class MockDocumentFragment extends MockHTMLElement {
    constructor() {
        super('DOCUMENT_FRAGMENT');
    }
}

global.MockHTMLElement = MockHTMLElement;

global.document = {
    createElement: (tag) => new MockHTMLElement(tag),
    createDocumentFragment: () => new MockDocumentFragment(),
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

// Mock window/global properties if needed
global.window = global;
