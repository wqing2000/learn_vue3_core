import { extend } from "./../shared/index";
import { isObject } from "../shared/index";
import { track, trigger } from "./effect";
import { reactive, ReactiveFlags, readonly } from "./reactive";

// 缓存技术，初始化时创建，避免每次创建响应式对象时，都创建一次
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);

function createGetter(isReadonly = false, isShallow = false) {
  return function get(target, key) {
    // * 判断功能
    // 传入参数isReadonly时，就已经判断是reactive对象，还是readonly对象
    // 判断key值，确定调用的是哪个方法，返回结果
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly; //return true 不是readonly对象，是reactive对象
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly; //return true 是readonly对象，不是reactive对象
    }

    // target 对象，key对象属性名
    // return target.key;
    const res = Reflect.get(target, key);

    if (isShallow) {
      // * 浅层只读的响应式对象，且内部是普通对象，内部对象的属性可以读写
      return res;
    }

    if (isObject(res)) {
      // * proxy对象内部如果还是对象，修改它的属性并不会触发get / set 因为它还是普通objec
      // * 判断proxy对象的属性是否还是对象
      // * 递归将其转为proxy对象
      return isReadonly ? readonly(res) : reactive(res);
    }

    if (!isReadonly) {
      // * 是否添加收集依赖功能？
      // * 只读时，不收集依赖
      track(target, key);
    }

    return res;
  };
}

function createSetter() {
  return function set(target, key, value) {
    const res = Reflect.set(target, key, value);

    // todo 触发依赖
    trigger(target, key);

    return res;
    // return value;
  };
}

export const mutableHandlers = {
  get,
  set,
};

export const readonlyHandlers = {
  get: readonlyGet,
  set(target, key, value) {
    console.warn(`key:${key} set 失败，因为 target 是 readonly`, target);
    return true;
  },
};

export const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
  get: shallowReadonlyGet,
});
