import { hasOwn } from "../shared/index";

const PublicPropertiesMap = {
  $el: (i) => i.vnode.el,
};

export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    // setupState，props
    const { setupState, props } = instance;

    // * 重构 实现属性值是否在对象中，语义化封装
    // * 实现setupState属性代理
    // if (key in setupState) {
    //   return setupState[key];
    // }
    // * 将props的属性代理
    // if (key in props) {
    //   return props[key];
    // }
    if (hasOwn(setupState, key)) {
      return setupState[key];
    } else if (hasOwn(props, key)) {
      return props[key];
    }

    // * 添加 $el 到 组件实例上
    // if (key === "$el") {
    //   return instance.vnode.el;
    // }

    const publicGetter = PublicPropertiesMap[key];
    if (publicGetter) {
      return publicGetter(instance);
    }
  },
};
