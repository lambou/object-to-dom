# Object to DOM
Generate dom element from object.

>> This package is only for client side rendering based apps as React.js or Vue.js apps

#### Example

```typescript
export const example = el<"div">({
  tag: "div",
  className: "flex flex-col gap-3",
  children: [
    el<"span">({
      tag: "span",
      className: "text-xl font-bold",
      children: "Card from object",
      beforeChildrenRendering: (instance) => {
        // component rendered
      },
    }),
    el<"p">({
      tag: "p",
      className: "text-base font-thin",
      children:
        "lorem ipsum dolor si amet, patati patata lorem dollor sit amet, fuck religion so on and so fort.",
    }),
  ],
});
```

#### Rendering

```typescript
import { example, renderNode } from "object-to-dom";

// render the example to an html element
const htmlElement = renderNode(example);

// You can now include the generated element in the dom
// document.getElementById("#root")?.append(htmlElement);
```