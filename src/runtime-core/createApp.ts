// * 接收一个根组件参数，返回一个app实例对象
// * 对象内部需要有一个 mount(rootContainer) 函数，接收容器参数，挂载到容器上

import { render } from "./render";
import { createVNode } from "./vnode";

export function createApp(rootComponent) {
  return {
    mount(rootContainer) {
      // * vue3中，必须先把 SFC 转成 vnode
      // * component  -> vnode
      // * 所有的逻辑操作 都会基于 vnode 做处理

      // #1 先将根组件转成vnode
      const vnode = createVNode(rootComponent);

      // #2 render将vnode渲染到页面
      render(vnode, rootContainer);
    },
  };
}
