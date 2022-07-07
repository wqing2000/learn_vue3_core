import { isReactive, isReadonly, isProxy, readonly } from "../reactive";

describe("readonly", () => {
  it("happy path", () => {
    // not set
    const original = { foo: 1, bar: { baz: 2 } };
    const wrapped = readonly(original);

    expect(wrapped).not.toBe(original);
    expect(wrapped.foo).toBe(1);

    expect(isReactive(wrapped)).toBe(false);
    expect(isReadonly(wrapped)).toBe(true);
    expect(isReactive(original)).toBe(false);
    expect(isReadonly(original)).toBe(false);
    expect(isReactive(wrapped.bar)).toBe(false);
    expect(isReadonly(wrapped.bar)).toBe(true);
    expect(isReactive(original.bar)).toBe(false);
    expect(isReadonly(original.bar)).toBe(false);
    
    expect(isProxy(wrapped)).toBe(true);
  });

  it("warn then call set", () => {
    // mock jest.fn
    console.warn = jest.fn();

    const user = readonly({ age: 10 });

    user.age = 11;

    expect(console.warn).toBeCalled();
  });
});
