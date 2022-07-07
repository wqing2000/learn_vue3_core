import { isObject } from "../shared/index";
import { createComponentInstance, setupComponent } from "./component";
import { ShapeFlags } from "./ShapeFlags";

// * render渲染函数，接收2个参数，
// * vnode 虚拟节点
// * container 节点挂载的容器
export function render(vnode, container) {
  // 只调用patch函数，补丁、更新页面
  patch(vnode, container);
}

// * 函数接收2个参数，vnode和container
// * 内部调用diff 算法，只将 vnode 有改动的地方渲染到 页面
// 后续需要递归调用，封装
function patch(vnode, container) {
  // #3 处理vnode 的过程函数

  // * 需要判断vnode的类型,是 component 还是 element
  // ? 如何判断虚拟节点是component 还是 element 类型
  // * vnode.type是 string 还是Object类型
  // // 是否存在render函数
  const { shapeFlag } = vnode;
  // if (typeof vnode.type === "string") {
  if (shapeFlag & ShapeFlags.ELEMENT) {
    processElement(vnode, container);
    // } else if (isObject(vnode.type)) {
  } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    processComponent(vnode, container);
  }
}

// * 挂载element
function processElement(vnode: any, container: any) {
  mountElement(vnode, container);
}

function mountElement(vnode: any, container: any) {
  // 创建真实DOM元素
  // vnode -> element 类型，这里保存下来
  const el = (vnode.el = document.createElement(vnode.type));

  // 添加属性
  const { props } = vnode;
  for (const key in props) {
    const val = props[key];

    const isOn = (key: string) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
      // * 实现注册事件功能
      const event = key.slice(2).toLowerCase();
      el.addEventListener(event, val);
    } else {
      el.setAttribute(key, val);
    }
  }

  // 添加子元素（包括文本节点）
  const { children, shapeFlag } = vnode;
  // if (typeof children === "string") {
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    // el.appendChild(document.createTextNode(children));
    el.textContent = children;
    // } else if (Array.isArray(children)) {
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(vnode, el);
  }

  container.append(el);
}

// * 挂载element的子元素
function mountChildren(vnode: any, container: any) {
  // TODO children内的文本节点无法渲染
  for (let v of vnode.children) {
    patch(v, container);
  }
}

// * 挂载组件
function processComponent(vnode, container) {
  // TODO 判断是初始化,还是更新组件component

  // #4 挂载组件
  mountComponent(vnode, container);
}

// * 挂载组件
function mountComponent(initialVNode: any, container: any) {
  // 创建组件实例
  const instance = createComponentInstance(initialVNode);

  // 组件初始化,挂载vnode内部的setup render 等到组件实例
  setupComponent(instance);

  setupRenderEffect(instance, initialVNode, container);
}

function setupRenderEffect(instance: any, initialVNode: any, container: any) {
  // * 运行组件实例上的render函数，获取返回值 vnode（subTree接收） ，这时vnode是 element类型
  // 将实例的this 绑定到proxy，所有的取值操作全部代理
  const { proxy } = instance;
  const subTree = instance.render.call(proxy);

  // instance.$el = subTree; // * 需要的是element，不是组件

  // vnode -> patch()
  // vnode -> element -> mountElement

  patch(subTree, container);

  // 在所有element 都 mount 之后，才能获取到真实DOM的根节点
  initialVNode.el = subTree.el;
}
