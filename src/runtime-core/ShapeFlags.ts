export const enum ShapeFlags {
  ELEMENT = 1, // 0001
  STATEFUL_COMPONENT = 1 << 1, // 0010
  TEXT_CHILDREN = 1 << 2, // 0100
  ARRAY_CHILDREN = 1 << 3, // 1000
}

// * 使用ShapeFlags判断vnode的类型，对vnode进行不同处理
// 1 在创建虚拟节点时，给vnode添加shapeFlag属性：
// 对传入的type（vnode.type）判断是element还是component类型，赋值给shapeFlag属性
// 2 判断children（vnode.children）判断是text还是array类型，修改shapeFlag属性

// * 优点：因为使用位运算，所以性能较高
// * 缺点：可读性较差

// 0001 -> 1
// 0010 -> 2
// 0100 -> 4
// 1000 -> 8

// | 位运算或 同位，只要有一个为1，结果为1
// & 位运算与 同位全部为1，结果才为1
