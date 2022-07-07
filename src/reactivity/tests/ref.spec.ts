import { effect } from "../effect";
import { reactive } from "../reactive";
import { isRef, proxyRefs, ref, unRef } from "../ref";

describe("ref", () => {
  it("happy path", () => {
    const a = ref(1);
    expect(a.value).toBe(1);
  });

  it("should be reactive", () => {
    const a = ref(1);
    let dummy;
    let calls = 0;
    effect(() => {
      calls++;
      dummy = a.value;
    });
    expect(calls).toBe(1);
    expect(dummy).toBe(1);
    a.value = 2;
    expect(calls).toBe(2);
    expect(dummy).toBe(2);
    // same value should not trigger
    a.value = 2;
    expect(calls).toBe(2);
    expect(dummy).toBe(2);
  });

  it.skip("should make nested properties reactive", () => {
    const a = ref({
      count: 1,
    });
    let dummy;
    effect(() => {
      dummy = a.value.count;
    });
    expect(dummy).toBe(1);
    a.value.count = 2;
    expect(dummy).toBe(2);
  });

  it("isRef", () => {
    const a = ref(1);
    const user = reactive({ age: 10 });

    expect(isRef(a)).toBe(true);
    expect(isRef(1)).toBe(false);
    expect(isRef(user)).toBe(false);
  });

  it("unRef", () => {
    const a = ref(1);

    expect(unRef(a)).toBe(1);
    expect(unRef(1)).toBe(1);
  });

  it("proxyRefs", () => {
    // * 访问响应式对象内部的ref对象的值，不需要通过value属性
    // 用在 template 中， ref.value
    // vue3    setup() { return { ref } }
    const user = {
      age: ref(10),
      name: "xiaowang",
    };

    const proxyUser = proxyRefs(user);
    // * get -> age(ref)，返回.value
    // not ref 返回value

    expect(proxyUser.age).toBe(10);
    expect(proxyUser.name).toBe("xiaowang");

    proxyUser.age = 20;
    // * set -> age(ref) 且新的value 不是 ref ，应该set age.value
    // * 其它情况直接替换
    //   set -> age(ref) 且新的value 是 ref ，直接替换
    //   not ref，直接替换
    expect(proxyUser.age).toBe(20);
    expect(user.age.value).toBe(20);

    proxyUser.age = ref(10);
    expect(proxyUser.age).toBe(10);
    expect(user.age.value).toBe(10);
  });
});
