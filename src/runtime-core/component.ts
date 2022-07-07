import { shallowReadonly } from "../reactivity/reactive";
import { emit } from "./componentEmit";
import { initProps } from "./componentProps";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";

export function createComponentInstance(vnode) {
  // ? 为什么创建组件实例对象,只需要把vnode放到一个对象里就可以
  // * 创建组件实例,并将vnode挂载到组件实例上,方便后面获取vnode中的属性/方法
  // 每个组件实例都具有以下属性
  const Instance = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    emit: () => {},
  };

  // * 这里使用bind，不是为了绑定this，而是为了给emit函数表达式，传入组件组件实例这个参数，让用户不需要传这个参数
  Instance.emit = emit.bind(null, Instance) as any;
  return Instance;
}

// * 解析组件setup，挂到创建的实例
export function setupComponent(instance: any) {
  // TODO
  initProps(instance, instance.vnode.props);
  // initSlots()

  // #6 初始化一个有setup状态的组件
  // 函数组件没有状态
  setupStatefulComponent(instance);
}

// * 初始化一个有setup状态的组件功能
function setupStatefulComponent(instance: any) {
  const Component = instance.type;

  // TODO
  // * 用proxy代理 instance 实例，实现简化访问。让用户写代码的时候更方便
  // 如：setupState对象中的数据，可以通过this.msg 而不是this.setupState.msg 访问
  // 还有 this.$el 等
  // * 需要将它们的值，绑定到render函数（实例）的this上
  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);

  // 解构,拿到虚拟节点内的setup
  const { setup } = Component;

  // #7 调用setup,拿到它的返回值
  if (setup) {
    // * 传入的props 包装为shallowReadon
    // const setupResult = setup(instance.props);
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit, // 这里要传入的是组件实例的emit函数表达式，经过bind处理的
    });

    handleSetupResult(instance, setupResult);
  }
}

function handleSetupResult(instance: any, setupResult: any) {
  // * 要将组件sfc内部的 setup内写的代码,挂载到组件的实例上,最后才能识别
  // * setup 返回值有2种情况 function 或 object

  // TODO function

  if (typeof setupResult === "object") {
    instance.setupState = setupResult;
  }

  // * 需要保证组件实例的render 一定要有值
  // * 即,如果组件内有写render函数,将render函数挂载到组件实例
  finishComponentSetup(instance);
}

function finishComponentSetup(instance: any) {
  const Component = instance.type;

  // * 将用户写的render函数，挂到实例上
  // if (Component.render) {
  instance.render = Component.render;
  // }
}
