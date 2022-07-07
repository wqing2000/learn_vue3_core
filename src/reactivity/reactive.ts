import { isObject } from "../shared/index";
import {
  mutableHandlers,
  readonlyHandlers,
  shallowReadonlyHandlers,
} from "./baseHandlers";

export const enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
  IS_READONLY = "__V_isReadonly",
}
export function reactive(raw) {
  return createReactiveObject(raw, mutableHandlers);
}

export function readonly(raw) {
  return createReactiveObject(raw, readonlyHandlers);
}

export function shallowReadonly(raw) {
  return createReactiveObject(raw, shallowReadonlyHandlers);
}

export function isReactive(value) {
  // 如果 value 是 proxy 的话
  // 涉及到读取操作，会触发 get 操作，而在 createGetter 里面会判断
  // 如果 value 是普通对象的话
  // 那么会返回 undefined ，那么就需要转换成布尔值
  return !!value[ReactiveFlags.IS_REACTIVE];
}

export function isReadonly(value) {
  return !!value[ReactiveFlags.IS_READONLY];
}

export function isProxy(value) {
  return isReactive(value) || isReadonly(value);
}

function createReactiveObject(raw, baseHandlers) {
  if (!isObject(raw)) {
    console.warn(`target ${raw} 必须是一个对象`);
    return raw;
  }

  // 用 Proxy 代理对象
  // get 对象属性时，收集依赖，返回属性值
  // set 对象属性时，触发依赖，更新与该对象响应的对象属性值。
  return new Proxy(raw, baseHandlers);
}
