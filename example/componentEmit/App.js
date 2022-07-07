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
      },
      [
        h("h1", { class: "title" }, "主页"),
        h(Foo, {
          count: this.count,
          onChangeCount(count,x) {
            console.log(count,x);
            // TODO 自定义事件内容this指向问题
            // this.count = count;
          },
        }),
      ]
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
