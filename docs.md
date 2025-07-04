# JimsWebBuilder Documentation

**JimsWebBuilder** is a lightweight, modular JavaScript framework for building dynamic, component-based web applications. It offers reactive state management, client-side routing, single-file components (SFCs), and virtual DOM diffing. Designed for simplicity and performance, it supports CommonJS, AMD, and browser globals, making it versatile for various environments.

---

## Table of Contents
1. [Getting Started](#getting-started)
   - [Installation](#installation)
   - [Basic Usage](#basic-usage)
2. [Core Concepts](#core-concepts)
   - [Components](#components)
   - [State Management](#state-management)
   - [Routing](#routing)
   - [Single File Components (SFCs)](#single-file-components-sfcs)
   - [Reactivity](#reactivity)
   - [Virtual DOM](#virtual-dom)
   - [Plugins](#plugins)
3. [API Reference](#api-reference)
   - [ComponentRegistry](#componentregistry)
   - [Router](#router)
   - [Store](#store)
   - [JimsWebBuilder Class](#jimswebbuilder-class)
   - [Utilities](#utilities)
4. [Examples](#examples)
   - [Basic Component](#example-1-basic-component)
   - [Component with Store](#example-2-component-with-store)
   - [Routing Example](#example-3-routing)
   - [Single File Component](#example-4-single-file-component)
   - [Plugin Example](#example-5-plugin)
   - [Using RenderFile](#example-6-using-renderfile)
5. [Debugging](#debugging)
6. [Best Practices](#best-practices)
7. [Advanced Usage](#advanced-usage)
   - [Lazy Loading Components](#lazy-loading-components)
   - [Custom Error Boundaries](#custom-error-boundaries)
   - [Dependency Injection](#dependency-injection)
8. [Troubleshooting](#troubleshooting)
9. [FAQs](#faqs)
10. [Limitations](#limitations)

---

## Getting Started

### Installation
Include JimsWebBuilder via a CDN for quick setup in browser environments:

```html
<script src="https://cdn.jsdelivr.net/npm/jims-web-builder@1.0.1/jwb.js"></script>
```

For Node.js projects, install via npm:

```bash
npm install jims-web-builder
```

Then import in your JavaScript:

```javascript
const JimsWebBuilder = require('jims-web-builder');
```

### Basic Usage
Define a component and render it in your HTML. Components are attached to `<jims-web-builder>` elements with an `id` attribute.

```html
<!DOCTYPE html>
<html>
<head>
  <title>JimsWebBuilder App</title>
  <script src="https://cdn.jsdelivr.net/npm/jims-web-builder@1.0.1/jwb.js"></script>
</head>
<body>
  <div id="app">
    <jims-web-builder id="greeting"></jims-web-builder>
  </div>
  <script>
    JimsWebBuilder.define('greeting', {
      state: { message: 'Welcome to JimsWebBuilder!' },
      render: ({ state }) => `
        <div>
          <h1>{{ message }}</h1>
        </div>
      `
    });
  </script>
</body>
</html>
```

This renders a simple component displaying a static message. The `{{ message }}` syntax evaluates `state.message` reactively.

---

## Core Concepts

### Components
Components are the core building blocks of JimsWebBuilder applications. They are defined using `ComponentRegistry.define(id, config)` and rendered via `<jims-web-builder id="component-id">` elements in the DOM.

- **Configuration Options**:
  - `state`: Initial reactive state (object).
  - `methods`: Functions for event handling and logic (bound to the component instance).
  - `render`: String template, function returning HTML, or `RenderFile` object. Supports `{{ expr }}` for reactive expressions.
  - `store`: Local store configuration (`state`, `actions`, `computed`).
  - `sfc`: URL to a single-file component (HTML file with `<template>`, `<script>`, `<style>`).
  - `links`: Array of resources (`css`, `js`, `html`) with optional `lazy: true` for deferred loading.
  - `errorBoundary`: Function returning HTML for error states.
  - **Lifecycle Hooks**:
    - `beforeLoad`: Runs before resources are loaded.
    - `afterLoad`: Runs after resources are loaded.
    - `onMount`: Runs after the component is mounted.
    - `onUpdate`: Runs when props change.
    - `beforeRender`: Runs before rendering.
    - `afterRender`: Runs after rendering.
    - `onDestroy`: Runs when the component is removed.

### State Management
JimsWebBuilder provides reactive state management through `createStore(def, moduleName)`:
- **State**: A reactive object (via `Proxy`) that triggers re-renders on changes.
- **Actions**: Methods to update state, receiving `{ state, context }` as the first argument.
- **Computed**: Getter-based properties that recompute when dependencies change.
- **Global Context**: Use `provide(key, value)` and `inject(key)` for dependency injection across components.
- **Global Store**: Access all stores via `globalStore.modules` (a `Map` of module names to stores).

### Routing
The `Router` class enables client-side routing:
- **Route Definition**: Use `router.add(path, componentId, options)` to map URLs to components.
- **Dynamic Routes**: Support parameters (e.g., `/user/:id`) and query strings.
- **Navigation Guards**: Optional `guard` functions to control access (e.g., authentication checks).
- **Navigation**: Triggered via `router.go(path)` or browser history events (`popstate`).

### Single File Components (SFCs)
SFCs combine template, logic, and styles in a single HTML file:
```html
<template>
  <div>
    <h1>{{ message }}</h1>
    <button @click="update">Update</button>
  </div>
</template>
<script type="application/json">
{
  "state": { "message": "Hello from SFC!" },
  "methods": { "update": function() { this.state.message = "Updated!"; } }
}
</script>
<style>
h1 { color: blue; }
</style>
```
- **Loading**: Specify `sfc: 'path/to/component.html'` in the component config.
- **Scoped Styles**: Styles are automatically scoped with a unique class (e.g., `jwb-scope-abc123`).

### Reactivity
Reactivity is powered by `Proxy` for state and `MutationObserver` for props:
- **State Changes**: Updates to `state` or `store.state` trigger debounced re-renders.
- **Prop Changes**: DOM attribute changes (e.g., `:param0`, `:query-key`) are observed and trigger `onUpdate`.
- **Template Expressions**: `{{ expr }}` evaluates JavaScript expressions in the context of `state` and `modules`.

### Virtual DOM
JimsWebBuilder uses a lightweight virtual DOM for efficient updates:
- **Parsing**: `createVdom` converts HTML strings to DOM nodes.
- **Diffing**: `diffAndPatch` compares old and new DOM trees, updating only changed nodes.
- **Keyed Nodes**: Use `data-key` attributes for stable list rendering.

### Plugins
Plugins extend framework functionality via `use(plugin)`:
- Plugins receive the `JimsWebBuilder` instance and `config` during initialization.
- Use cases include logging, analytics, or custom lifecycle modifications.

---

## API Reference

### ComponentRegistry
Manages component definitions.

- **`ComponentRegistry.define(id, config)`**  
  Registers a component.  
  - `id`: String (e.g., `namespace/componentId` or `componentId`).  
  - `config`: Object with `state`, `methods`, `render`, `store`, `sfc`, `links`, lifecycle hooks, etc.  
  - Example:  
    ```javascript
    JimsWebBuilder.define('my-component', {
      state: { count: 0 },
      render: ({ state }) => `<div>{{ count }}</div>`
    });
    ```

- **`ComponentRegistry.lazyDefine(id, src)`**  
  Asynchronously loads a component from a JSON URL.  
  - `src`: URL to a JSON file containing the component config.  
  - Example:  
    ```javascript
    JimsWebBuilder.lazyDefine('my-component', 'my-component.json');
    ```

- **`ComponentRegistry.get(id)`**  
  Retrieves a component config by ID.  
  - Returns: Config object or `undefined` if not found.

### Router
Handles client-side routing.

- **`new Router(options)`**  
  Creates a router instance.  
  - `options.container`: DOM element for rendering components (default: `document.body`).  

- **`router.add(path, componentId, options)`**  
  Defines a route.  
  - `path`: Route path (e.g., `/user/:id`).  
  - `componentId`: Component to render.  
  - `options`: `{ parentRoute, guard }` (optional parent route and navigation guard function).  
  - Example:  
    ```javascript
    router.add('/user/:id', 'user', {
      guard: ({ params }) => params[0] !== 'invalid'
    });
    ```

- **`router.go(path)`**  
  Navigates to a path using `pushState`.  

- **`router.navigate()`**  
  Renders the component for the current URL.

### Store
Creates reactive stores.

- **`createStore(def, moduleName)`**  
  Creates a store with reactive state, actions, and computed properties.  
  - `def`: `{ state, actions, computed }`.  
  - `moduleName`: Store identifier (default: `'default'`).  
  - Returns: `{ state, actions, computed }`.  
  - Example:  
    ```javascript
    const store = JimsWebBuilder.createStore({
      state: { count: 0 },
      actions: { increment: ({ state }) => state.count++ },
      computed: { double: ({ state }) => state.count * 2 }
    }, 'counter');
    ```

### JimsWebBuilder Class
Core class for components.

- **`new JimsWebBuilder(element)`**  
  Initializes a component for a `<jims-web-builder>` element.  

- **Key Methods**:  
  - `init()`: Loads config, resources, and renders the component.  
  - `render(config)`: Renders the component using its template or render function.  
  - `loadResources(links)`: Loads CSS, JS, and HTML resources.  
  - `processEvents(node)`: Binds event listeners for `@click`, `@input`, `@submit`.  
  - `queueRender()`: Debounced re-render trigger.  
  - `destroy()`: Cleans up resources and listeners.

### Utilities
- **`css(href, lazy)`**: Defines a CSS resource to load.  
  - `href`: URL to the CSS file.  
  - `lazy`: Boolean; if `true`, defers loading until needed.  
  - Example: `css('styles.css', true)`

- **`js(src, attributes, lazy)`**: Defines a JavaScript resource to load.  
  - `src`: URL to the JS file.  
  - `attributes`: Object of HTML attributes (e.g., `{ async: '' }`).  
  - `lazy`: Boolean; if `true`, defers loading.  
  - Example: `js('script.js', { defer: '' }, true)`

- **`html(src, lazy)`**: Defines an HTML resource to load as a template.  
  - `src`: URL to the HTML file.  
  - `lazy`: Boolean; if `true`, defers loading.  
  - Example: `html('template.html')`

- **`RenderFile(path)`**: Specifies an external HTML file to use as a component’s template. The file is fetched, sanitized, and processed for reactive expressions (`{{ expr }}`). Use in a component’s `render` property. Ideal for large or reusable templates.  
  - `path`: URL to the HTML file.  
  - Returns: `{ type: 'renderFile', path }`.  
  - Notes:  
    - The template is fetched during component initialization and cached in `resourceCache`.  
    - Supports reactive expressions using the component’s `state` and `globalStore.modules`.  
    - Sanitized to prevent XSS using allowed tags and attributes.  
  - Example:  
    ```javascript
    JimsWebBuilder.define('my-component', {
      state: { name: 'User' },
      render: JimsWebBuilder.RenderFile('template.html')
    });
    // template.html: <div>Hello, {{ name }}!</div>
    ```

- **`use(plugin)`**: Registers a plugin function to extend framework functionality.  
  - `plugin`: Function receiving `(component, config)`.  
  - Example: `use((component) => console.log(component.id))`

- **`provide(key, value)`**: Adds a value to the global context for dependency injection.  
  - Example: `provide('api', { fetchData: () => 'Data' })`

- **`inject(key)`**: Retrieves a value from the global context.  
  - Example: `inject('api').fetchData()`

- **`debounce(fn, delay)`**: Creates a debounced version of a function.  
  - Example: `debounce(() => console.log('Delayed'), 100)`

- **`sanitize(html)`**: Sanitizes HTML to prevent XSS, allowing only specific tags (`div`, `span`, etc.) and attributes (`id`, `class`, `href`, etc.).  
  - Example: `sanitize('<div>{{ text }}</div>')`

---

## Examples

### Example 1: Basic Component
A counter component with reactive state and event handling.

```html
<!DOCTYPE html>
<html>
<head>
  <title>Counter</title>
  <script src="https://cdn.jsdelivr.net/npm/jims-web-builder@1.0.1/jwb.js"></script>
</head>
<body>
  <div id="app">
    <jims-web-builder id="counter"></jims-web-builder>
  </div>
  <script>
    JimsWebBuilder.define('counter', {
      state: { count: 0 },
      methods: {
        increment() { this.state.count++; }, // Increments count reactively
        decrement() { this.state.count--; }  // Decrements count reactively
      },
      render: ({ state, methods }) => `
        <div>
          <h2>Count: {{ count }}</h2>
          <button @click="increment">+1</button>
          <button @click="decrement">-1</button>
        </div>
      `
    });
  </script>
</body>
</html>
```

### Example 2: Component with Store
A todo list using a local store for state management.

```html
<!DOCTYPE html>
<html>
<head>
  <title>Todo App</title>
  <script src="https://cdn.jsdelivr.net/npm/jims-web-builder@1.0.1/jwb.js"></script>
</head>
<body>
  <div id="app">
    <jims-web-builder id="todo"></jims-web-builder>
  </div>
  <script>
    JimsWebBuilder.define('todo', {
      store: {
        state: { todos: [], newTodo: '' },
        actions: {
          addTodo({ state }, text) {
            state.todos.push({ text, done: false }); // Add new todo
            state.newTodo = '';                      // Clear input
          },
          toggleTodo({ state }, index) {
            state.todos[index].done = !state.todos[index].done; // Toggle todo status
          }
        },
        computed: {
          completedTodos({ state }) {
            return state.todos.filter(todo => todo.done).length; // Count completed todos
          }
        }
      },
      methods: {
        add() { this.localStore.actions.addTodo(this.state.newTodo); },
        toggle(index) { this.localStore.actions.toggleTodo(index); }
      },
      render: ({ state, methods, computed }) => `
        <div>
          <h2>Todos ({{ computed.completedTodos }} done)</h2>
          <input @input="newTodo = event.target.value" value="{{ newTodo }}">
          <button @click="add">Add Todo</button>
          <ul>
            ${state.todos.map((todo, i) => `
              <li @click="toggle(${i})" style="text-decoration: {{ todo.done ? 'line-through' : 'none' }}">
                {{ todo.text }}
              </li>
            `).join('')}
          </ul>
        </div>
      `
    });
  </script>
</body>
</html>
```

### Example 3: Routing
An app with two routes and a navigation guard.

```html
<!DOCTYPE html>
<html>
<head>
  <title>Routing Demo</title>
  <script src="https://cdn.jsdelivr.net/npm/jims-web-builder@1.0.1/jwb.js"></script>
</head>
<body>
  <div id="app"></div>
  <script>
    JimsWebBuilder.define('home', {
      render: () => `<h1>Welcome to Home</h1><a href="/user/123">Go to User</a>`
    });
    JimsWebBuilder.define('user', {
      render: ({ props }) => `<h1>User: {{ props.param0 }}</h1><a href="/home">Go to Home</a>`
    });

    const router = JimsWebBuilder.router;
    router.add('/home', 'home');
    router.add('/user/:id', 'user', {
      guard: ({ params }) => params[0] !== 'invalid' // Block invalid user IDs
    });

    router.go('/home'); // Start at home route
  </script>
</body>
</html>
```

Click the links to navigate between `/home` and `/user/123`. The guard prevents navigation to `/user/invalid`.

### Example 4: Single File Component
Load a component from an external SFC file.

**`my-component.html`**:
```html
<template>
  <div>
    <h1>{{ message }}</h1>
    <button @click="update">Update</button>
  </div>
</template>
<script type="application/json">
{
  "state": { "message": "Hello from SFC!" },
  "methods": { "update": function() { this.state.message = "Updated!"; } }
}
</script>
<style>
h1 { color: blue; }
</style>
```

**HTML**:
```html
<!DOCTYPE html>
<html>
<head>
  <title>SFC Demo</title>
  <script src="https://cdn.jsdelivr.net/npm/jims-web-builder@1.0.1/jwb.js"></script>
</head>
<body>
  <div id="app">
    <jims-web-builder id="my-component"></jims-web-builder>
  </div>
  <script>
    JimsWebBuilder Succinctly, the component uses the `sfc` property to load an external HTML file containing a `<template>`, `<script type="application/json">`, and `<style>` section.
  </script>
</body>
</html>
```

### Example 5: Plugin
A plugin to log lifecycle events.

```html
<!DOCTYPE html>
<html>
<head>
  <title>Plugin Demo</title>
  <script src="https://cdn.jsdelivr.net/npm/jims-web-builder@1.0.1/jwb.js"></script>
</head>
<body>
  <div id="app">
    <jims-web-builder id="my-component"></jims-web-builder>
  </div>
  <script>
    JimsWebBuilder.use((component, config) => {
      console.log(`Initializing component: ${component.id}`);
      const originalOnMount = config.onMount;
      config.onMount = function() {
        console.log(`${component.id} mounted`);
        if (originalOnMount) originalOnMount.call(this);
      };
    });

    JimsWebBuilder.define('my-component', {
      render: () => `<h1>Hello, Plugin!</h1>`
    });
  </script>
</body>
</html>
```

### Example 6: Using RenderFile
Load a component’s template from an external HTML file.

**`template.html`**:
```html
<div>
  <h1>{{ title }}</h1>
  <p>Count: {{ count }}</p>
  <button @click="increment">Increment</button>
</div>
```

**HTML**:
```html
<!DOCTYPE html>
<html>
<head>
  <title>RenderFile Demo</title>
  <script src="https://cdn.jsdelivr.net/npm/jims-web-builder@1.0.1/jwb.js"></script>
</head>
<body>
  <div id="app">
    <jims-web-builder id="my-component"></jims-web-builder>
  </div>
  <script>
    JimsWebBuilder.define('my-component', {
      state: { title: 'RenderFile Example', count: 0 },
      methods: {
        increment() { this.state.count++; } // Updates count reactively
      },
      render: JimsWebBuilder.RenderFile('template.html') // Load external template
    });
  </script>
</body>
</html>
```

This example defines a component that loads its template from `template.html`, renders reactive data (`title`, `count`), and handles a button click event.

---

## Debugging
Enable `debugMode` (set `debugMode = true` in the source) to access `_JWB_DEVTOOLS_`:
- `_JWB_DEVTOOLS_.getComponent(id)`: Retrieves a component instance by ID.
- `_JWB_DEVTOOLS_.getStore(moduleName)`: Retrieves a store by module name.
- `_JWB_DEVTOOLS_.logState(moduleName, key)`: Logs state changes.
- `_JWB_DEVTOOLS_.registry`: Accesses the component registry.
- `_JWB_DEVTOOLS_.router`: Accesses the router instance.

**Example**:
```javascript
// Inspect a component
console.log(_JWB_DEVTOOLS_.getComponent('my-component'));

// Monitor state changes
_JWB_DEVTOOLS_.logState('todo', 'todos');
```

---

## Best Practices
1. **Organize with Namespaces**: Use `namespace/componentId` (e.g., `app/counter`) to avoid naming conflicts.
2. **Secure Templates**: Leverage `sanitize` to prevent XSS by restricting tags and attributes.
3. **Optimize Lists**: Add `data-key` attributes to list items for efficient diffing.
4. **Use Stores**: Encapsulate complex state logic in `createStore` to keep components lightweight.
5. **Lazy Load Resources**: Set `lazy: true` for non-critical CSS/JS to reduce initial load time.
6. **Handle Errors**: Define `errorBoundary` for custom error displays.
7. **Debounce Updates**: Rely on built-in debouncing to prevent excessive renders.
8. **Clean Up**: Ensure `onDestroy` removes event listeners and resources to avoid memory leaks.

---

## Advanced Usage

### Lazy Loading Components
Load components asynchronously to improve performance:
```javascript
JimsWebBuilder.lazyDefine('lazy-component', 'lazy-component.json');
// lazy-component.json
{
  "state": { "data": "Loaded!" },
  "render": ({ state }) => `<div>{{ data }}</div>`
}
```

### Custom Error Boundaries
Define a custom error display:
```javascript
JimsWebBuilder.define('my-component', {
  errorBoundary: (message) => `
    <div style="border: 2px solid red; padding: 10px;">
      <h3>Error</h3>
      <p>${message}</p>
    </div>
  `,
  render: () => { throw new Error('Test error'); }
});
```

### Dependency Injection
Share services across components:
```javascript
JimsWebBuilder.provide('api', { fetchData: () => Promise.resolve('Data') });
JimsWebBuilder.define('my-component', {
  render: ({ inject }) => {
    const api = inject('api');
    api.fetchData().then(data => `<div>${data}</div>`);
  }
});
```

---

## Troubleshooting
- **Component Not Rendering**:
  - Check if the `id` matches a defined component.
  - Ensure `ComponentRegistry.define` is called before DOM load.
  - Verify SFC or resource URLs are accessible.
- **State Not Updating**:
  - Confirm state is modified via `Proxy` (e.g., `state.count++`).
  - Check for typos in `{{ expr }}` template expressions.
- **Routing Issues**:
  - Verify route paths and guards in `router.add`.
  - Ensure `router.go` or `popstate` is triggered.
- **Resource Loading Errors**:
  - Check console for 404 errors on CSS/JS/HTML files.
  - Set `lazy: true` for non-critical resources.
- **RenderFile Issues**:
  - Ensure the `template.html` file exists and is accessible.
  - Verify reactive expressions reference valid state properties.
  - Check console for fetch errors.
- **Performance Issues**:
  - Use `data-key` for lists.
  - Minimize state updates to reduce re-renders.

---

## FAQs
**Q: How do I debug a component not rendering?**  
A: Use `_JWB_DEVTOOLS_.getComponent(id)` to inspect the instance. Check console for errors and verify the component ID and config.

**Q: What is the difference between `html` and `RenderFile`?**  
A: `html(src, lazy)` loads an HTML resource as a template, typically used in `links`, while `RenderFile(path)` is used in the `render` property to define a component’s template directly.

**Q: Can I use TypeScript?**  
A: JimsWebBuilder lacks built-in TypeScript support, but you can add type definitions manually.

**Q: How do I handle async data with RenderFile?**  
A: Fetch data in `beforeLoad` or `onMount` and update state to trigger a re-render of the `RenderFile` template.

**Q: Is SSR supported?**  
A: No, JimsWebBuilder is client-side only.

---

## Limitations
- **Client-Side Only**: No server-side rendering (SSR) support, impacting SEO and initial load performance.
- **Expression Parsing**: `evalExpression` may fail for complex expressions (e.g., nested objects).
- **Error Recovery**: Limited recovery for failed resource loads or parsing errors.
- **Browser Compatibility**: Requires modern browser APIs (`Proxy`, `MutationObserver`, `fetch`).
- **Ecosystem**: Smaller community and fewer tools compared to React or Vue.
