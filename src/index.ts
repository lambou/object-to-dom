export interface IDomJsoncontext<ElementType = HTMLElement> {
  element: ElementType;
  childWithId: <T = HTMLElement>(
    this: IDomJsonNode<any>,
    id: string,
    callback: (elt: T) => void
  ) => void;
  childWithClassName: (
    className: string | Array<string>,
    callback: (elt: any) => void
  ) => void;
  parentWithId: (id: string, callback: (elt: any) => void) => void;
  parentWithClassName: (
    className: string | Array<string>,
    callback: (elt: any) => void
  ) => void;
}

export type IDomJsonNode<
  T extends keyof HTMLElementTagNameMap,
  contextType = any,
  RootContextType = any
> = {
  [key in keyof Partial<
    Omit<HTMLElementTagNameMap[T], "children">
  >]: HTMLElementTagNameMap[T][key];
} & {
  /**
   * Element tag
   */
  tag: T;
  /**
   * After the html element has been created and before children rendering
   * @param {HTMLElementTagNameMap[T]} instance html element
   */
  beforeChildrenRendering?: (instance: HTMLElementTagNameMap[T]) => void;

  /**
   * After the html element has been created and after children rendering
   * @param {HTMLElementTagNameMap[T]} instance html element
   */
  afterChildrenRendering?: (instance: HTMLElementTagNameMap[T]) => void;

  /**
   * Root context
   */
  rootContext?: RootContextType;

  /**
   * Parent node
   */
  upperNode?: DomJsonNode<any>;

  /**
   * Lower nodes
   */
  lowerNodes: Array<DomJsonNode<any>>;

  /**
   * Context
   */
  context?: Readonly<IDomJsoncontext<HTMLElementTagNameMap[T]>> & contextType;

  /**
   * Node children
   */
  children?: Array<DomJsonNode<any>> | DomJsonNode<any> | string | number;
} & Partial<IDomJsoncontext<HTMLDivElement>>;

export class DomJsonNode<
  T extends keyof HTMLElementTagNameMap,
  contextType = any
> {
  props: IDomJsonNode<T, contextType>;
  constructor(props: Omit<IDomJsonNode<T, contextType>, "lowerNodes">) {
    this.props = {
      ...props,
      lowerNodes: [],
    } as any;
  }
}

/**
 * Element creation helper
 * @param props props
 * @returns DomJsonNode<T>
 */
export function el<T extends keyof HTMLElementTagNameMap, contextType = any>(
  props: Omit<IDomJsonNode<T, contextType>, "lowerNodes">
) {
  return new DomJsonNode<T, contextType>(props);
}

export function nodeStaticRender<
  T extends keyof HTMLElementTagNameMap,
  RootContextType = any
>(doc: Document, node: DomJsonNode<T>, rootContext?: RootContextType) {
  // inject root context
  node.props.rootContext = rootContext;

  // create element
  let element = doc.createElement(node.props.tag);

  // inject element in context
  let defaultContext: Partial<IDomJsonNode<any>> = {
    childWithClassName: function (className, callback) {},
    childWithId: function (id, callback) {},
    parentWithClassName: function (className, callback) {
      // class name arrays
      let classNames = Array.isArray(className)
        ? className
        : Array.of(className);

      // contains classNames
      function containsClassNames(
        list: DOMTokenList,
        classNames: Array<string>
      ) {
        for (const item of classNames) {
          if (list.contains(item)) {
            return true;
          }
        }
        return false;
      }

      // upper node exists
      if (this.upperNode) {
        if (
          this.upperNode.props.element?.classList &&
          containsClassNames(this.upperNode.props.element.classList, classNames)
        ) {
          callback(this.upperNode.props.element);
        }

        this.upperNode.props.parentWithClassName?.(className, callback);
      }
    },
    parentWithId: function (id, callback) {
      if (this.upperNode) {
        // console.log("upper node found", [this.upperNode.props.element?.id]);
        if (this.upperNode.props.element?.id === id) {
          callback(this.upperNode.props.element);
        } else {
          this.upperNode.props.parentWithId?.(id, callback);
        }
      } else {
        console.warn("no parent found with the id:", id);
      }
    },
    element: element as any,
  };

  // update node context
  node.props.childWithClassName = defaultContext.childWithClassName;
  node.props.parentWithClassName = defaultContext.parentWithClassName;
  node.props.childWithId = defaultContext.childWithId;
  node.props.parentWithId = defaultContext.parentWithId;
  node.props.element = defaultContext.element;

  // bind props
  node.props.childWithClassName?.bind(node.props);
  node.props.childWithId?.bind(node.props);
  node.props.parentWithClassName?.bind(node.props);
  node.props.parentWithId?.bind(node.props);

  // merge props
  for (const key of Object.keys(node.props)) {
    if (
      ![
        "children",
        "tag",
        "beforeChildrenRendering",
        "afterChildrenRendering",
      ].includes(key)
    ) {
      (element as any)[key] = (node.props as any)[key];
    }
  }

  // call post rendering function
  node.props.beforeChildrenRendering?.(element);

  // get children
  let children = node.props["children"];

  // children exists
  if (children) {
    if (typeof children === "string" || typeof children === "number") {
      element.append(`${children}`);
    } else {
      if (Array.isArray(children)) {
        for (const child of children) {
          // inject parent context
          child.props.upperNode = node;

          // render
          element.append(nodeStaticRender(doc, child, rootContext));
        }
      } else {
        // inject parent context
        children.props.upperNode = node.props.context;

        // render
        element.append(nodeStaticRender(doc, children, rootContext));
      }
    }
  }

  // call post rendering function
  node.props.afterChildrenRendering?.(element);

  // return element
  return element;
}

export function renderNode<
  T extends keyof HTMLElementTagNameMap,
  RootContextType = any
>(node: DomJsonNode<T>, rootContext?: RootContextType) {
  return nodeStaticRender(document, node, rootContext);
}

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

export const interactiveExample = el<"div">({
  tag: "div",
  className: "w-full p-4",
  children: [
    el<"div">({
      tag: "div",
      id: "identifier",
      className: "inline-flex flex-col gap-2 p-4 rounded-md border",
      context: {
        name: "Babayaga",
      },
      children: [
        el<"span">({
          tag: "span",
          className: "text-xl font-bold cursor-pointer",
          onclick: (ev) => {
            alert("You have just clicked on the title");
          },
          children: "Object to dom",
          beforeChildrenRendering: function (instance) {
            // instance.onclick = (ev) => {
            //   this.upperNode?.props.context?.element.classList.add(
            //     "border-red-500"
            //   );
            // };
          },
        }),
        el<"p">({
          tag: "p",
          className: "text-base font-light",
          children:
            "lorem ipsum dolor si amet, patati patata lorem dollor sit amet, fuck religion so on and so fort.",
        }),
        el<"div">({
          id: `${"identifier"}-button-container`,
          tag: "div",
          className: "flex items-center justify-center w-full",
          children: [
            el<"span">({
              tag: "span",
              className:
                "px-2 py-1 rounded-full text-white bg-blue-500 font-bold hover:bg-blue-400 cursor-pointer",
              children: "Click me",
              beforeChildrenRendering: function (instance) {
                instance.onclick = (ev) => {
                  this.parentWithId?.(
                    "identifier",
                    function (el: HTMLDivElement) {
                      el.classList.add("border-red-500");
                    }
                  );

                  this.parentWithClassName?.(
                    "flex",
                    function (el: HTMLElement) {
                      console.log(el.className);
                    }
                  );
                };
              },
            }),
          ],
        }),
      ],
    }),
  ],
});
