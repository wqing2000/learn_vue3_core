// * 初始化props功能
export function initProps(instance: any, rawProps: any) {
  // for (const key in rawProps) {
  //   instance.props[key] = rawProps[key];
  // }

  // * 上下2种写法，实现的功能相同，但是下面的写法，必须要|| {} ，
  // * 否则会导致instance.props 不是一个对象，导致创建shallowReadnoly时报错。Proxy只能代理对象

  instance.props = rawProps || {};
}
