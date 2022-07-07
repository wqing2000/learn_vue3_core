import { camelize } from "./../shared/index";
import { toHandlerKey } from "../shared/index";

export const emit = (instance, event: string, ...args) => {
  console.log("emit", event);

  // 每个组件实例都有instance，父组件传入的自定义事件函数，在组件实例的props中
  const { props } = instance;

  const handlerName = toHandlerKey(camelize(event));
  const handler = props[handlerName];
  handler && handler(...args);
};
