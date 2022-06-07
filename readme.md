# babel-plugin-solid-if-component

`babel-plugin-solid-if-component` is a Babel for SolidJS plugin that gives you an `If` and `Else` component macros. It compiles to Solid's `Show` component (`Else` goes to the fallback prop) and it gives you an altrnative syntax to the `Show` component that achieve the same conditional rendering behavior. 

> **Note**  
This plugin is WIP.

```jsx
import { If, Else } from 'babel-plugin-solid-if-component';

const MyComp = () => {
   return (
      <>
         <If cond={hello}>
            <div>Hello</div>
         </If>
         <Else>
            <div>Goodbye</div>
         </Else>
      </>
   )
}

// ↓ ↓ ↓ ↓  Compiles to ↓ ↓ ↓ ↓

import { Show as _Show } from "solid-js";

const MyComp = () => {
   return (
      <>
         <_Show
            when={hello}
            fallback={<div>Goodbye</div>}
         >
            <div>Hello</div>
         </_Show>
      </>
   )
}
```

## Getting Started

```sh
npm i -D babel-plugin-solid-if-component
```

In your Vite config, find the your vite-plugin-solid initialization (in the default Solid template it will be imported as solidPlugin).

The first argument this initialization function takes, is the options object.

Add this field to the initializer options:

```js
babel: {
	plugins: ['babel-plugin-solid-if-component']
} 
```


## Roadmap / Missing Features
- `ElseIf` / `Elif` component
- More tests



## Other cool plugins for Solid
- https://github.com/orenelbaum/babel-plugin-reactivars-solid - A Svelte-like "reactive variables" plugin for Solid that lets you pass reactive variables (getter + setter) around in a concise way (made by me).
- https://github.com/orenelbaum/babel-plugin-solid-undestructure - This plugin lets you destructure your props without losing reactivity (made by me).
- https://github.com/LXSMNSYC/babel-plugin-solid-labels - Solid labels is more of an all in one plugin. It has Svelte-like reactive variables (like this plugin), prop destructuring and more.
- https://github.com/LXSMNSYC/solid-sfc - An experimental SFC compiler for SolidJS.
