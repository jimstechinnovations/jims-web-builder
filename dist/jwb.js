(function (global, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        global.JimsWebBuilder = factory();
    }
}(typeof window !== 'undefined' ? window : globalThis, function () {
    const ResourceType = { CSS: 'css', JS: 'js', HTML: 'html' };
    const globalStore = { modules: new Map(), listeners: new Set(), context: new Map() };
    const plugins = [];
    const resourceCache = new Map();
    const debugMode = false; // Toggle for production

    function css(href, lazy = false) { return { type: ResourceType.CSS, href, lazy }; }
    function js(src, attributes = {}, lazy = false) { return { type: ResourceType.JS, src, attributes, lazy }; }
    function html(src, lazy = false) { return { type: ResourceType.HTML, src, lazy }; }

    function debounce(fn, delay) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    }

    // Safer expression evaluation
    function evalExpression(expr, state, modules) {
        try {
            const ctx = { ...state, ...Object.fromEntries(modules) };
            const keys = Object.keys(ctx);
            const values = Object.values(ctx);
            // Simplified expression parser (supports basic property access)
            return new Function(...keys, `return ${expr}`)(...values);
        } catch (e) {
            console.warn(`Failed to evaluate expression ${expr}:`, e);
            return undefined;
        }
    }

    function createStore(def, moduleName = 'default') {
        const store = {
            state: new Proxy(def.state || {}, {
                set: (target, key, value) => {
                    if (target[key] === value) return true;
                    target[key] = value;
                    globalStore.listeners.forEach(fn => fn(moduleName, key));
                    return true;
                }
            }),
            actions: Object.entries(def.actions || {}).reduce((acc, [k, fn]) => {
                acc[k] = (...args) => fn({ state: store.state, context: globalStore.context }, ...args);
                return acc;
            }, {}),
            computed: {}
        };
        Object.entries(def.computed || {}).forEach(([k, fn]) => {
            Object.defineProperty(store.computed, k, {
                get: () => fn.call(store, store.state, globalStore.context)
            });
        });
        globalStore.modules.set(moduleName, store);
        return store;
    }

    function use(plugin) {
        plugins.push(plugin);
    }

    function provide(key, value) {
        globalStore.context.set(key, value);
    }

    function inject(key) {
        return globalStore.context.get(key);
    }

    class ComponentRegistry {
        static components = new Map();
        static define(id, config) {
            const [namespace = 'default', componentId] = id.split('/');
            const ns = ComponentRegistry.components.get(namespace) || new Map();
            ns.set(componentId, config);
            ComponentRegistry.components.set(namespace, ns);
        }
        static get(id) {
            const [namespace = 'default', componentId] = id.split('/');
            return ComponentRegistry.components.get(namespace)?.get(componentId);
        }
        static async lazyDefine(id, src) {
            try {
                const config = await fetch(src).then(r => r.json());
                ComponentRegistry.define(id, config);
            } catch (e) {
                console.error(`Failed to lazy load component ${id}:`, e);
            }
        }
    }

    class Router {
        constructor(options = {}) {
            this.routes = new Map();
            this.guards = new Map();
            this.container = options.container || document.body;
            window.addEventListener('popstate', () => this.navigate());
        }

        add(path, componentId, options = {}) {
            this.routes.set(path, { componentId, parentRoute: options.parentRoute, ...options });
            if (options.guard) this.guards.set(path, options.guard);
        }

        match(path) {
            for (const [route, { componentId, parentRoute, ...options }] of this.routes) {
                const regex = new RegExp(`^${route.replace(/:[^/]+/g, '([^/]+)')}$`);
                const match = path.match(regex);
                if (match) return { componentId, params: match.slice(1), query: new URLSearchParams(window.location.search), parentRoute };
            }
            return null;
        }

        async navigate() {
            const path = window.location.pathname;
            const match = this.match(path);
            if (!match) {
                this.renderError(`No route found for ${path}`);
                return;
            }
            const { componentId, params, query, parentRoute } = match;
            const guard = this.guards.get(path);
            if (guard && !await guard({ params, query })) return;

            const container = this.container.querySelector('.jwb-route-container') || this.container;
            container.innerHTML = '';
            const el = document.createElement('jims-web-builder');
            el.setAttribute('id', componentId);
            params.forEach((param, i) => el.setAttribute(`:param${i}`, param));
            for (const [key, value] of query) el.setAttribute(`:query-${key}`, value);
            if (parentRoute) el.setAttribute('data-parent-route', parentRoute);
            container.appendChild(el);
            new JimsWebBuilder(el);
        }

        go(path) {
            window.history.pushState({}, '', path);
            this.navigate();
        }

        renderError(message) {
            const errorEl = document.createElement('div');
            errorEl.style.color = 'red';
            errorEl.textContent = message;
            this.container.innerHTML = '';
            this.container.appendChild(errorEl);
        }
    }

    function createVdom(html) {
        const template = document.createElement('template');
        template.innerHTML = html.trim();
        return template.content.firstChild;
    }

    function diffAndPatch(oldNode, newNode, parent, oldKey = '', newKey = '') {
        if (oldKey && newKey && oldKey !== newKey) {
            return parent.replaceChild(newNode, oldNode);
        }
        if (!oldNode && newNode) return parent.appendChild(newNode);
        if (oldNode && !newNode) return parent.removeChild(oldNode);
        if (oldNode.nodeType !== newNode.nodeType || oldNode.tagName !== newNode.tagName) {
            return parent.replaceChild(newNode, oldNode);
        }
        if (oldNode.nodeType === 3 && oldNode.textContent !== newNode.textContent) {
            oldNode.textContent = newNode.textContent;
        }
        const oldChildren = Array.from(oldNode.childNodes);
        const newChildren = Array.from(newNode.childNodes);
        const oldKeyed = new Map(oldChildren.map(n => [n.getAttribute?.('data-key') || String(Math.random()), n]));
        const newKeyed = newChildren.map(n => [n.getAttribute?.('data-key') || String(Math.random()), n]);
        newKeyed.forEach(([key, newChild], i) => {
            const oldChild = oldKeyed.get(key);
            diffAndPatch(oldChild, newChild, oldNode, key, key);
            if (oldChild) oldKeyed.delete(key);
        });
        oldKeyed.forEach((_, key) => {
            const node = oldKeyed.get(key);
            if (node.parentNode) node.parentNode.removeChild(node);
        });
    }

    function sanitize(html) {
        const allowedTags = ['div', 'span', 'p', 'button', 'input', 'form', 'a', 'img', 'ul', 'li', 'h1', 'h2', 'h3'];
        const allowedAttrs = ['id', 'class', 'href', 'src', 'alt', '@click', '@input', '@submit', 'data-key', ':param0', ':param1', ':query'];
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
        const walker = document.createTreeWalker(doc.body, Node.ELEMENT_NODE);
        while (walker.nextNode()) {
            const node = walker.currentNode;
            if (!allowedTags.includes(node.tagName.toLowerCase())) {
                const text = document.createTextNode(node.textContent);
                node.parentNode.replaceChild(text, node);
                continue;
            }
            Array.from(node.attributes).forEach(attr => {
                if (!allowedAttrs.includes(attr.name)) {
                    node.removeAttribute(attr.name);
                } else if (['href', 'src'].includes(attr.name) && attr.value.match(/javascript:/i)) {
                    node.removeAttribute(attr.name);
                }
            });
        }
        return doc.body.firstChild.innerHTML;
    }

    async function parseSFC(src) {
        try {
            const html = await fetch(src).then(r => r.text());
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const template = doc.querySelector('template')?.innerHTML || '';
            const script = doc.querySelector('script[type="application/json"]')?.textContent || '{}';
            const style = doc.querySelector('style')?.textContent || '';
            const config = JSON.parse(script);
            const scopedClass = `jwb-${Math.random().toString(36).slice(2)}`;
            const scopedStyle = style ? `${style}\n.jwb-scope-${scopedClass} { ${style} }` : '';
            return { template, config, style: scopedStyle, scopedClass };
        } catch (e) {
            console.error(`Failed to parse SFC ${src}:`, e);
            return { template: '', config: {}, style: '', scopedClass: '' };
        }
    }

    class JimsWebBuilder {
        constructor(element) {
            if (!element) return;
            this.el = element;
            this.id = element.getAttribute('id');
            this.state = {};
            this.methods = {};
            this.localStore = null;
            this.parent = null;
            this.children = new Map();
            this.isMounted = false;
            this.template = null;
            this.props = {};
            this.slots = {};
            this.renderTimer = null;
            this.config = null;
            this.prevProps = {};
            this.eventListeners = new Map();
            this.errorBoundary = null;
            this.el.__component = this;
            this.observeProps();
            this.init();
        }

        extractProps() {
            const props = {};
            for (const attr of this.el.attributes) {
                if (attr.name.startsWith(':')) {
                    const key = attr.name.slice(1);
                    props[key] = evalExpression(attr.value, globalStore.modules.get('default')?.state || {}, globalStore.modules);
                } else {
                    props[attr.name] = attr.value;
                }
            }
            return props;
        }

        observeProps() {
            const observer = new MutationObserver(() => {
                const newProps = this.extractProps();
                const changedKeys = Object.keys(newProps).filter(k => newProps[k] !== this.props[k]);
                this.prevProps = this.props;
                this.props = newProps;
                if (changedKeys.length > 0 && this.config?.onUpdate) {
                    this.tryRun(() => this.config.onUpdate.call(this, changedKeys), 'onUpdate');
                }
                this.queueRender();
            });
            observer.observe(this.el, { attributes: true });
        }

        async init() {
            const config = ComponentRegistry.get(this.id);
            if (!config) {
                this.renderError(`Component ${this.id} not defined.`);
                return;
            }
            this.config = config;

            try {
                if (config.sfc) {
                    const { template, config: sfcConfig, style, scopedClass } = await parseSFC(config.sfc);
                    this.template = template;
                    this.config = { ...config, ...sfcConfig };
                    if (style) {
                        const styleEl = document.createElement('style');
                        styleEl.textContent = style;
                        document.head.appendChild(styleEl);
                        this.el.classList.add(`jwb-scope-${scopedClass}`);
                    }
                }

                plugins.forEach(p => p(this, this.config));
                this.props = this.extractProps();
                this.localStore = config.store ? createStore(config.store, this.id) : null;
                this.state = this.createReactiveState(config.state || {});
                this.methods = Object.entries(config.methods || {}).reduce((acc, [k, fn]) => {
                    acc[k] = fn.bind(this);
                    return acc;
                }, {});

                if (config.errorBoundary) this.errorBoundary = config.errorBoundary;
                await this.tryRun(() => config.beforeLoad?.call(this), 'beforeLoad');
                await this.loadResources(config.links);
                await this.tryRun(() => config.afterLoad?.call(this), 'afterLoad');
                this.render(config);
                await this.tryRun(() => config.onMount?.call(this), 'onMount');
            } catch (e) {
                this.renderError(`Initialization error: ${e.message}`);
            }
        }

        async loadResources(links = []) {
            const queue = links.filter(r => !r.lazy).map(async r => {
                const cacheKey = `${r.type}:${r.href || r.src}`;
                if (resourceCache.has(cacheKey)) return resourceCache.get(cacheKey);
                let promise;
                if (r.type === ResourceType.CSS) promise = this.loadCss(r.href);
                else if (r.type === ResourceType.JS) promise = this.loadJs(r.src, r.attributes);
                else if (r.type === ResourceType.HTML) promise = this.fetchHtml(r.src).then(html => this.template = html);
                resourceCache.set(cacheKey, promise);
                return promise;
            }).filter(Boolean);
            return Promise.all(queue);
        }

        loadCss(href) {
            return new Promise(res => {
                if (document.querySelector(`link[href="${href}"]`)) return res();
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = href;
                link.onload = res;
                link.onerror = () => console.error(`Failed to load CSS: ${href}`);
                document.head.appendChild(link);
            });
        }

        loadJs(src, attributes = {}) {
            return new Promise(res => {
                if (document.querySelector(`script[src="${src}"]`)) return res();
                const script = document.createElement('script');
                script.src = src;
                Object.entries(attributes).forEach(([k, v]) => script.setAttribute(k, v));
                script.onload = res;
                script.onerror = () => console.error(`Failed to load JS: ${src}`);
                document.body.appendChild(script);
            });
        }

        fetchHtml(src) {
            return fetch(src).then(r => r.text()).catch(e => {
                console.error(`Failed to fetch HTML: ${src}`, e);
                return '';
            });
        }

        createReactiveState(obj) {
            return new Proxy(obj, {
                set: (target, key, value) => {
                    if (target[key] === value) return true;
                    target[key] = value;
                    this.queueRender();
                    globalStore.listeners.forEach(fn => fn(this.id, key));
                    return true;
                }
            });
        }

        processEvents(node) {
            const events = ['click', 'input', 'submit'];
            events.forEach(event => {
                node.querySelectorAll(`[@${event}]`).forEach(el => {
                    const methodName = el.getAttribute(`@${event}`);
                    const method = this.methods[methodName];
                    if (method) {
                        const listener = e => this.tryRun(() => method.call(this, e), `Event handler ${event}`);
                        el.addEventListener(event, listener);
                        this.eventListeners.set(`${event}-${methodName}`, { el, listener });
                        el.removeAttribute(`@${event}`);
                    }
                });
            });
        }

        tryRun(fn, context) {
            try {
                return fn();
            } catch (e) {
                this.renderError(`${context} error: ${e.message}`);
            }
        }

        renderError(message) {
            if (this.errorBoundary) {
                this.el.innerHTML = this.errorBoundary(message);
            } else {
                this.el.innerHTML = `<div style="color: red; padding: 10px; border: 1px solid red;">${message}</div>`;
            }
        }

        render(config) {
            this.tryRun(() => {
                if (config.beforeRender) config.beforeRender.call(this);
                const state = {
                    ...globalStore.modules.get('default')?.state || {},
                    ...this.localStore?.state,
                    ...Object.fromEntries(globalStore.modules)
                };
                const computed = {
                    ...globalStore.modules.get('default')?.computed || {},
                    ...this.localStore?.computed
                };
                const tpl = typeof config.render === 'function'
                    ? config.render.call({ ...this, state, computed, inject })
                    : (this.template || config.render);

                const slotMap = new Map();
                this.el.querySelectorAll('[slot]').forEach(el => {
                    slotMap.set(el.getAttribute('slot') || '', sanitize(el.outerHTML));
                });

                const rendered = sanitize(tpl.replace(/<slot(?:\s+name="([^"]*)")?\s*>(.*?)<\/slot>/gs, (_, name = '') => {
                    return slotMap.get(name) || '';
                }));

                const newVdom = createVdom(rendered);
                diffAndPatch(this.el.firstChild, newVdom, this.el, this.el.getAttribute('data-key'), newVdom.getAttribute('data-key'));
                this.processEvents(this.el);
                this.processChildren();

                if (config.afterRender) config.afterRender.call(this);
                this.isMounted = true;
            }, 'render');
        }

        processChildren() {
            const children = this.el.querySelectorAll('jims-web-builder');
            const newChildren = new Map();
            children.forEach(child => {
                const id = child.getAttribute('id');
                const existing = this.children.get(id) || new JimsWebBuilder(child);
                existing.parent = this;
                newChildren.set(id, existing);
            });
            this.children.forEach((child, id) => {
                if (!newChildren.has(id)) child.destroy();
            });
            this.children = newChildren;
        }

        queueRender = debounce(() => {
            const config = ComponentRegistry.get(this.id);
            if (config) this.render(config);
        }, 0);

        destroy() {
            this.tryRun(() => {
                if (this.config?.onDestroy) this.config.onDestroy.call(this);
                this.children.forEach(child => child.destroy());
                this.children.clear();
                this.eventListeners.forEach(({ el, listener }, key) => {
                    const [event] = key.split('-');
                    el.removeEventListener(event, listener);
                });
                this.eventListeners.clear();
                this.el.__component = null;
                resourceCache.clear(); // Clear resources on destroy
            }, 'destroy');
        }
    }

    function initializeComponents() {
        document.querySelectorAll('jims-web-builder').forEach(el => {
            if (!el.__component) new JimsWebBuilder(el);
        });
    }

    if (typeof window !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeComponents);
        } else {
            initializeComponents();
        }

        if (debugMode) {
            window._JWB_DEVTOOLS_ = {
                getComponent: id => document.querySelector(`jims-web-builder[id="${id}"]`)?.__component || null,
                getStore: moduleName => globalStore.modules.get(moduleName) || null,
                logState: (moduleName, key) => {
                    const store = globalStore.modules.get(moduleName);
                    console.log(`State update in ${moduleName}.${key}:`, store?.state[key]);
                },
                registry: ComponentRegistry,
                router: new Router({ container: document.querySelector('#app') || document.body })
            };
            globalStore.listeners.add((moduleName, key) => window._JWB_DEVTOOLS_.logState(moduleName, key));
        }
    }

    return {
        define: ComponentRegistry.define.bind(ComponentRegistry),
        lazyDefine: ComponentRegistry.lazyDefine.bind(ComponentRegistry),
        use,
        createStore,
        provide,
        inject,
        router: new Router({ container: document.querySelector('#app') || document.body })
    };
}));