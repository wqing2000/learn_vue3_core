import { ReactiveEffect } from "./effect";

class ComputedRefImpl {
  private _getter: any;
  private _lock: boolean;
  private _effect: any;
  private _value: any;

  constructor(getter) {
    this._getter = getter;
    this._lock = true;
    // STEP-5 触发 trigger时，初始化 收集依赖
    // * 需要传入scheduler参数，
    // * 当响应式对象的值发生改变，会触发set，执行trigger里的scheduler，而不是一直执行getter。
    this._effect = new ReactiveEffect(getter, () => {
      if (!this._lock) {
        this._lock = true;
      }
    });
  }

 get value() {
    // STEP-3 执行一次后，锁死不再执行getter函数
    // 当依赖的响应式对象的值，发生改变时，才能继续执行一次getter
    if (this._lock) {
      this._lock = false;

      // STEP-2 将getter函数的计算结果，绑定到getter实例的属性下，
      // 当外界获取值时，触发 getter实例的 get value() ,将this._getter()的计算结果return
      // this._value = this._getter();
      this._value = this._effect.run(); // ! 注意：这里执行run，还会执行一次getter。因此要回到第5步,
      return this._value;
    }

    // STEP-4 不执行getter，访问时，能返回以前的计算结果
    return this._value;
  }
}

export function computed(getter) {
  return new ComputedRefImpl(getter); // STEP-1 传入函数，创建一个实例
}
