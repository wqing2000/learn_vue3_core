import { h } from "../../lib/guide-mini-vue.esm.js";
import { Foo } from "./Foo.js";

window.self = null;
export const App = {
  name: "APP",
  // <template></template> 需要编译模块
  // 暂时使用更底层的render函数
  render() {
    self = this;
    return h(
      "div",
      {
        class: "box,left",
        id: "root",
        onClick(e) {
          console.log("click", e);
        },
        onMousedown(e) {
          console.log("mousedown", e);
        },
      },
      [h("h1", { class: "title" }, "主页"), h(Foo, { count: this.count })]
      // * this -> setupState
      // "hi," + this.message
      // this.$el
      // * 实现渲染string类型
      // "hi mini-vue"
      // * 实现渲染Array
      // [
      //   h("h1", { class: "title" }, "主页"),
      //   h("p", { class: "content" }, [
      //     "主页内容",
      //     h("p", { class: "content" }, "主页内容2"),
      //   ]),
      // ]
    );
  },

  setup() {
    // composition api
    return {
      message: "mini-vue-hello",
      count: 10,
    };
  },
};
