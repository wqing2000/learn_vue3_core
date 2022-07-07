import { extend } from "./../shared/index";

let activeEffect: any; //全局变量，临时存储fn
const targetMap = new Map(); //存储全局作用域下所有的依赖
let shouldTrack: boolean; // 是否应该收集依赖

export class ReactiveEffect {
  private _fn: any;
  // deps = [];
  deps = new Set();
  active = true; // 标记是否执行了stop，false表示执行了stop
  onStop?: () => void;
  // shouldTrack: boolean = true;  // 标记表示是否可以添加依赖，false表示被stop删除，重新运行run可以重置回true

  //* 问号表示参数可有可无，public表示公共的，可以在外部被读取
  constructor(fn, public scheduler?) {
    this._fn = fn;
    this.scheduler = scheduler;
  }

  run() {
    // * 执行 fn  但是不收集依赖
    if (!this.active) {
      return this._fn();
    }

    // * 不使用this.shouldTrack，而使用全局变量shouldTrack 控制是否收集依赖
    // * 运行stop()后，会导致之后永远不会收集依赖。哪怕运行runner(实际使effect返回的run函数)
    //   通过run() 将 this.shouldTrack 设为 true，stop() 时设为 false
    //   运行runner之后，还能重新收集依赖
    //     this.shouldTrack = true;

    shouldTrack = true;
    activeEffect = this;
    // * activeEffect = this; 不能放在this.fn()执行之后
    // * 如果上一步是this._fn()函数，运行时涉及响应式对象，会被get()拦截
    // * 先执行track函数收集依赖，而这时 activeEffect 为 undefined
    const result = this._fn(); //执行fn，并将fn的返回值return出去
    // reset
    shouldTrack = false;

    return result;
  }

  stop() {
    // stop执行时，删除被收集的依赖
    // 如何获取dep,反向绑定
    // 如果依赖已经删除，节省性能，不执行遍历删除

    if (this.active) {
      cleanupEffect(this);
      // this.deps.delete(this);
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
      // this.shouldTrack = false;
    }
  }
}

function cleanupEffect(effect) {
  for (let dep of effect.deps) {
    dep.delete(effect);
  }
  /* 重复收集的场景
    *  重复收集的场景*
      const obj = rea*ctive({a: 1, b: 2})
      let x,y
      effect(() => {
      x = obj.a + obj.b
      y = obj.a - obj.b
      })

    *  这里用的不是数组，而是set。一个key可以对应多个fn，但一个fn也可能被多个属性记录依赖
    *  响应式系统，响应式对象的依赖与副作用函数之间建立多对多的关系，这点真的是很牛逼啊
  */
}

// 依赖的数据结构：
// 一个target对应多个key，一个key对应多个fn
// 以及一个项目对应有多个target，大致结构如下：
// const targetMap = {
//   target1: { key1: ["fn1", "fn2", "fn3"], key2: ["fn1", "fn2", "fn3"] },
//   target2: { key1: ["fn1", "fn2", "fn3"], key2: ["fn1", "fn2", "fn3"] },
//   target3: { key1: ["fn1", "fn2", "fn3"], key2: ["fn1", "fn2", "fn3"] },
// };
// # 一个响应式对象的其中任一个属性都可以对应多个变量，即每个key有多个不同依赖
// # 同时，因为每次get操作都会触发收集依赖，为了避免重复收集，因此使用Set结构存储数据

export function track(target, key) {
  if (!isTracking()) return;

  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Set();
    depsMap.set(key, dep);
  }

  trackEffects(dep);
}

export function trackEffects(dep) {
  if (dep.has(activeEffect)) return; // 已收集，则不重复收集
  dep.add(activeEffect);
  // activeEffect.deps.push(dep); // 反向收集，优化点，使用Set不会重复反向收集
  activeEffect.deps.add(dep); //# 反向收集
}

export function isTracking() {
  // if (!activeEffect) return; // * 如果activeEffect未定义，说明不需要 收集依赖，直接结束
  //    if (!activeEffect.shouldTrack) return; //是否应该收集依赖
  // if (!shouldTrack) return; // * 是否应该收集依赖

  return shouldTrack && activeEffect !== undefined;
}

export function trigger(target, key) {
  // 触发依赖的函数
  let depsMap = targetMap.get(target);
  let dep = depsMap.get(key);

  triggerEffects(dep);
}

export function triggerEffects(dep) {
  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}

export function effect(fn, options: any = {}) {
  // 响应式对象和某个变量的依赖，第一次绑定时需要运行一次

  // * 可读性与抽离
  // const _effect = new ReactiveEffect(fn, options.scheduler);
  // _effect.onStop = options.onStop;
  const _effect = new ReactiveEffect(fn);
  // Object.assign(_effect, options);
  extend(_effect, options); // 语义化

  _effect.run();

  const runner: any = _effect.run.bind(_effect); // ? 为什么要将fn函数return出去
  runner.effect = _effect;
  return runner; // 返回的是一个普通函数，内部this的指向，需要绑定
}

export function stop(runner) {
  runner.effect.stop();
}
