import { isReactive, isReadonly, shallowReadonly } from "../reactive";

describe("shallowsReadonly", () => {
  it("should not make non-reactive properties reactive", () => {
    const props = shallowReadonly({ n: { foo: 1 } });
    expect(isReactive(props.n)).toBe(false);
  });

  it("warn then call set", () => {
    // mock jest.fn
    console.warn = jest.fn();
    const user = shallowReadonly({ age: 10 });

    user.age = 11;

    expect(console.warn).toBeCalled();
  });

  it("shoule readonly then shallow", () => {
    // not set
    const original = { foo: 1, bar: { baz: 2 } };
    const wrapped = shallowReadonly(original);

    expect(wrapped).not.toBe(original);
    expect(wrapped.foo).toBe(1);

    expect(isReactive(wrapped)).toBe(false);
    expect(isReadonly(wrapped)).toBe(true);
    expect(isReactive(original)).toBe(false);
    expect(isReadonly(original)).toBe(false);
    expect(isReactive(wrapped.bar)).toBe(false);
    expect(isReadonly(wrapped.bar)).toBe(false);
  });
});
