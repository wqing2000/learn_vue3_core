import { reactive } from "../reactive";
import { effect, stop } from "../effect";

describe("effcet", () => {
  it("happy path", () => {
    // 准备数据 -> given
    const user = reactive({ age: 10 });
    let nextAge;

    // 触发测试动作 -> when
    effect(() => {
      nextAge = user.age + 1;
    });

    // jest -> 断言
    expect(nextAge).toBe(11);

    // update
    user.age++;
    expect(nextAge).toBe(12);
  });

  it("should return runner when call effect", () => {
    let foo = 10;
    const runner = effect(() => {
      foo++;
      return "hello";
    });

    expect(foo).toBe(11);
    const r = runner();
    expect(foo).toBe(12);
    expect(r).toBe("hello");
  });

  it("scheduler", () => {
    // 1.effect 能接收第二个参数{ scheduler }，
    // 2.effect第一次执行时，会执行fn，并且不会执行scheduler
    // 3.响应式对象(set)更新时，fn不会执行，会执行scheduler，将effect函数的返回值给run
    // 4.执行run函数，响应式对象更新（effect第一个函数参数执行）

    let dummy;
    let run: any;
    // * jest.fn jest模拟函数，可以通过 jest.fn() 创建 mock 函数。
    // * 当调用没有执行，mock 函数会返回undefined
    const scheduler = jest.fn(() => {
      run = runner;
    });
    const obj = reactive({ foo: 1 });
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      { scheduler }
    );

    expect(scheduler).not.toHaveBeenCalled();
    expect(dummy).toBe(1);
    // should be called on first trigger
    obj.foo++;
    expect(scheduler).toHaveBeenCalledTimes(1);
    // should not run yet
    expect(dummy).toBe(1);
    // manually run
    run();
    // should have run
    expect(dummy).toBe(2);
  });

  it("stop", () => {
    let dummy;
    const obj = reactive({ prop: 1 });
    const runner = effect(() => {
      dummy = obj.prop;
    });
    obj.prop = 2;
    expect(dummy).toBe(2);
    stop(runner);
    // obj.prop = 3; // 不触发get，不会执行收集依赖
    obj.prop++; // ! 会触发get，会把stop删除的依赖重新收集
    expect(dummy).toBe(2);

    // stopped effect should still be manually callable
    runner();
    expect(dummy).toBe(3);

    obj.prop++;
    runner();
    expect(dummy).toBe(4);
  });
});

it("events: onStop", () => {
  const onStop = jest.fn();
  const runner = effect(() => {}, {
    onStop,
  });

  stop(runner);
  // expect(onStop).toHaveBeenCalled();
  // expect(onStop).toHaveBeenCalledTimes(1);
  expect(onStop).toBeCalledTimes(1);
});
