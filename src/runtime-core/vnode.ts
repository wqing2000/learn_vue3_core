// * 创建组件vnode的函数，接收3个参数
// * type，创建的组件
// * props 创建组件的属性
// * children 创建组件内的子组件

import { ShapeFlags } from "./ShapeFlags";

export function createVNode(type, props?, children?) {
  const vnode = {
    type,
    props,
    children,
    shapeFlag: getShapeFlag(type),
  };

  if (typeof children === "string") {
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
  } else if (Array.isArray(children)) {
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
  }

  function getShapeFlag(type: any) {
    return typeof type === "string"
      ? ShapeFlags.ELEMENT
      : ShapeFlags.STATEFUL_COMPONENT;
  }

  return vnode;
}
