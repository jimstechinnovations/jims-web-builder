# JimsWebBuilder Documentation

**JimsWebBuilder** is a lightweight, modular JavaScript framework for building modern web applications. It provides a component-based architecture, reactive state management, client-side routing, and support for single-file components (SFCs). The framework is designed to be flexible, supporting CommonJS, AMD, and browser globals, with a focus on simplicity and performance.

---

## Table of Contents
1. [Getting Started](#getting-started)
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
5. [Debug Tools](#debug-tools)
6. [Best Practices](#best-practices)
7. [Limitations](#limitations)

---

## Getting Started

### Installation
Include JimsWebBuilder via a CDN in your HTML file:

```html
<script src="https://cdn.jsdelivr.net/npm/jims-web-builder@1.0.1/@jwb.js"></script>
```

Alternatively, install it in a Node.js project (CommonJS):

```bash
npm install jims-web-builder
```

```javascript
const JimsWebBuilder = require('jims-web-builder');
```

### Basic Usage
Create a component and render it in your HTML:

```html
<!DOCTYPE html>
<html>
<head>
  <title>JimsWebBuilder App</title>
  <script src="https://cdn.jsdelivr.net/npm/jims-web-builder@1.0.1/@jwb.js"></script>
</head>
<body>
  <div id="app">
    <jims-web-builder id="my-component"></jims-web-builder>
  </div>
  <script>
    JimsWebBuilder.define('my-component', {
      state: { message: 'Hello, JimsWebBuilder!' },
      render: ({ state }) => `
        <div>
          <h1>${state.message}</h1>
        </div>
      `
    });
  </script>
</body>
</html>
```

This creates a simple component that renders a heading with a static message.

---

## Core Concepts

### Components
Components are the building blocks of JimsWebBuilder applications. They are defined using `ComponentRegistry.define(id, config)` and rendered using `<jims-web-builder id="component-id">` elements.

- **Config Options**:
  - `state`: Initial reactive state (object).
  - `methods`: Event handlers and utility functions.
  - `render`: Function or string template for rendering the component.
  - `store`: Configuration for a local store (state, actions, computed).
  - `sfc`: URL to a single-file component.
  - `links`: Array of resources (CSS, JS, HTML).
  - Lifecycle hooks: `beforeLoad`, `afterLoad`, `onMount`, `onUpdate`, `beforeRender`, `afterRender`, `onDestroy`, `errorBoundary`.

### State Management
State is managed using `createStore(def, moduleName)`, which creates a reactive store with:
- `state`: Reactive state (via `Proxy`).
- `actions`: Methods to modify state.
- `computed`: Getter-based computed properties.

Global state is accessible via `globalStore.modules`, and dependency injection is supported with `provide`/`inject`.

### Routing
The `Router` class enables client-side routing:
- Maps paths to components using `router.add(path, componentId, options)`.
- Supports dynamic parameters (`:param`) and query strings.
- Handles navigation with `router.go(path)` and guards for conditional routing.

### Single File Components (SFCs)
SFCs combine template, script, and style in one file:
```html
<template>
  <div><p>{{ message }}</p></div>
</template>
<script type="application/json">
{
  "state": { "message": "Hello from SFC!" },
  "methods": { "update": function() { this.state.message = "Updated!"; } }
}
</script>
<style>
p { color: blue; }
</style>
```
Load SFCs using `sfc: 'path/to/component.html'` in the component config.

### Reactivity
State changes trigger re-renders using `Proxy`. Props are observed with `MutationObserver` for dynamic updates. Rendering is debounced to optimize performance.

### Virtual DOM
JimsWebBuilder uses a lightweight virtual DOM with `createVdom` and `diffAndPatch` for efficient DOM updates, supporting keyed nodes for optimized child reconciliation.

### Plugins
Extend functionality with `use(plugin)`. Plugins are functions that receive the `JimsWebBuilder` instance and config, allowing modifications to behavior.

---

## API Reference

### ComponentRegistry
Manages component definitions.

- `ComponentRegistry.define(id, config)`: Registers a component.
  - `id`: String (e.g., `namespace/componentId` or `componentId`).
  - `config`: Component configuration object.
- `ComponentRegistry.lazyDefine(id, src)`: Asynchronously loads and registers a component from a JSON URL.
- `ComponentRegistry.get(id)`: Retrieves a component config by ID.

### Router
Handles client-side routing.

- `new Router(options)`: Creates a router instance.
  - `options.container`: DOM element to render components (default: `document.body`).
- `router.add(path, componentId, options)`: Adds a route.
  - `path`: Route path (e.g., `/user/:id`).
  - `componentId`: ID of the component to render.
  - `options`: `{ parentRoute, guard }` (optional parent route and navigation guard).
- `router.go(path)`: Navigates to a path using `pushState`.
- `router.navigate()`: Renders the component for the current path.

### Store
Creates reactive stores.

- `createStore(def, moduleName)`: Creates a store.
  - `def`: `{ state, actions, computed }`.
  - `moduleName`: Store identifier (default: `'default'`).
  - Returns: `{ state, actions, computed }`.

### JimsWebBuilder Class
Core component class.

- Constructor: `new JimsWebBuilder(element)`:
  - `element`: `<jims-web-builder>` DOM element.
- Methods:
  - `init()`: Initializes the component (loads config, resources, and renders).
  - `render(config)`: Renders the component using its template or render function.
  - `loadResources(links)`: Loads CSS, JS, and HTML resources.
  - `processEvents(node)`: Binds event listeners (`@click`, `@input`, `@submit`).
  - `queueRender()`: Debounced render trigger.
  - `destroy()`: Cleans up resources and event listeners.

### Utilities
- `css(href, lazy)`: Defines a CSS resource.
- `js(src, attributes, lazy)`: Defines a JS resource.
- `html(src, lazy)`: Defines an HTML resource.
- `use(plugin)`: Registers a plugin.
- `provide(key, value)`: Adds a value to the global context.
- `inject(key)`: Retrieves a value from the global context.
- `debounce(fn, delay)`: Creates a debounced function.
- `sanitize(html)`: Sanitizes HTML to prevent XSS.

---

## Examples

### Example 1: Basic Component
A simple counter component.

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/jims-web-builder@1.0.1/@jwb.js"></script>
</head>
<body>
  <div id="app">
    <jims-web-builder id="counter"></jims-web-builder>
  </div>
  <script>
    JimsWebBuilder.define('counter', {
      state: { count: 0 },
      methods: {
        increment() { this.state.count++; },
        decrement() { this.state.count--; }
      },
      render: ({ state, methods }) => `
        <div>
          <h2>Count: ${state.count}</h2>
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
A component using a local store for state management.

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/jims-web-builder@1.0.1/@jwb.js"></script>
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
            state.todos.push({ text, done: false });
            state.newTodo = '';
          },
          toggleTodo({ state }, index) {
            state.todos[index].done = !state.todos[index].done;
          }
        },
        computed: {
          completedTodos({ state }) {
            return state.todos.filter(todo => todo.done).length;
          }
        }
      },
      methods: {
        add() { this.localStore.actions.addTodo(this.state.newTodo); },
        toggle(index) { this.localStore.actions.toggleTodo(index); }
      },
      render: ({ state, methods, computed }) => `
        <div>
          <h2>Todos (${computed.completedTodos} done)</h2>
          <input @input="newTodo = event.target.value" value="${state.newTodo}">
          <button @click="add">Add Todo</button>
          <ul>
            ${state.todos.map((todo, i) => `
              <li @click="toggle(${i})" style="text-decoration: ${todo.done ? 'line-through' : 'none'}">
                ${todo.text}
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

### Example3: Routing
A simple app with two routes.

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/jims-web-builder@1.0.1/@jwb.js"></script>
</head>
<body>
  <div id="app"></div>
  <script>
    JimsWebBuilder.define('home', {
      render: () => `<h1>Welcome to Home</h1>`
    });
    JimsWebBuilder.define('user', {
      render: ({ props }) => `<h1>User: ${props.param0}</h1>`
    });

    const router = JimsWebBuilder.router;
    router.add('/home', 'home');
    router.add('/user/:id', 'user', {
      guard: ({ params }) => {
        return params[0] !== 'invalid';
      }
    });

    router.go('/home');
  </script>
</body>
</html>
```

Navigate to `/user/123` to see the user component or `/home` for the home component. The guard prevents navigation to `/user/invalid`.

### Example 4: Single File Component
Define an SFC and load it.

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
  <script src="https://cdn.jsdelivr.net/npm/jims-web-builder@1.0.1/@jwb.js"></script>
</head>
<body>
  <div id="app">
    <jims-web-builder id="my-component"></jims-web-builder>
  </div>
  <script>
    JimsWebBuilder.define('my-component', {
      sfc: 'my-component.html'
    });
  </script>
</body>
</html>
```

### Example 5: Plugin
A plugin to log component lifecycle events.

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/jims-web-builder@1.0.1/@jwb.js"></script>
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

---

## Debug Tools
When `debugMode` is enabled (set `debugMode = true` in the source), JimsWebBuilder exposes `_JWB_DEVTOOLS_` for debugging:

- `_JWB_DEVTOOLS_.getComponent(id)`: Get a component instance by ID.
- `_JWB_DEVTOOLS_.getStore(moduleName)`: Get a store by module name.
- `_JWB_DEVTOOLS_.logState(moduleName, key)`: Logs state changes.
- `_JWB_DEVTOOLS_.registry`: Access the component registry.
- `_JWB_DEVTOOLS_.router`: Access the router instance.

Example:
```javascript
console.log(_JWB_DEVTOOLS_.getComponent('my-component'));
```

---

## Best Practices
1. **Use Namespaces**: Organize components with namespaces (e.g., `app/counter`) for clarity.
2. **Sanitize Inputs**: Rely on the built-in `sanitize` function to prevent XSS.
3. **Optimize Rendering**: Use keyed nodes (`data-key`) for lists to improve diffing performance.
4. **Leverage Stores**: Use `createStore` for complex state logic, keeping components lightweight.
5. **Lazy Load Resources**: Set `lazy: true` for non-critical resources to improve initial load time.
6. **Error Boundaries**: Define `errorBoundary` to handle errors gracefully.

---

## Limitations
- **No Server-Side Rendering**: The framework is client-side only.
- **Basic Expression Parser**: `evalExpression` supports simple property access but may fail with complex expressions.
- **Limited Error Handling**: Resource loading failures may not be fully recoverable.
- **No Type Safety**: Lacks TypeScript support out of the box.
- **Browser Dependency**: Relies on modern browser APIs (e.g., `Proxy`, `MutationObserver`).

