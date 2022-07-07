import { hasChanged, isObject } from "../shared";
import { isTracking, trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reactive";

class RefImlp {
  private _value: any;
  public dep;
  rawValue: any;
  public __v_isRef = true;

  constructor(value) {
    this.rawValue = value;
    // * ref用来代理基本类型的值，处理基本类型的响应式
    // * 如果传入的 value 是一个对象，则可以自动用 reactive() 处理
    this._value = convert(value);
    this.dep = new Set();
  }

  get value() {
    // 判断是否需要收集依赖，执行了effect()
    if (isTracking()) {
      // * 基本类型值的依赖如何收集？
      // * 值没有对象的多层映射关系，因此只需要一个value 对应一个 Set() 就可以收集
      trackEffects(this.dep);
    }

    return this._value; // 返回响应式对象
  }

  set value(newValue) {
    // * 如果newValue 和 旧value 相同，不执行触发依赖
    // * 考虑：如果ref传入的是对象，以及对象内部还有对象的情况
    // 1.比较需要使用原始的value
    if (hasChanged(this.rawValue, newValue)) {
      // 普通类型值，与新的对象的赋值
      this._value = convert(newValue); // this._value = newValue;
      this.rawValue = newValue;
      // * 一定是值改变之后，再去通知，触发依赖
      triggerEffects(this.dep);
    }
  }
}

function convert(value) {
  return isObject(value) ? reactive(value) : value;
}

export function ref(value) {
  return new RefImlp(value);
}

export function isRef(ref) {
  return !!ref.__v_isRef; // 普通类型值，没有__v_isRef属性
}

export function unRef(ref) {
  return isRef(ref) ? ref.value : ref;
}

export function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, {
    get(target, key) {
      // * get -> age(ref)，返回.value
      // not ref 返回value
      return unRef(Reflect.get(target, key));
    },

    set(target, key, value) {
      // * set -> age(ref) 且新的value 不是 ref ，应该set age.value
      // * 其它情况直接替换
      if (isRef(target[key]) && !isRef(value)) {
        return (target[key].value = value);
      } else {
        return Reflect.set(target, key, value);
      }
    },
  });
}
