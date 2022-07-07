import { h } from "../../lib/guide-mini-vue.esm.js";

export const Foo = {
  setup(props) {
    // 1. props.count 能接收到父组件传来的值
    console.log(props);
    // 2. 可以通过this.count 访问props内的属性
    // 3. props内的值，子组件不能修改 readonly

    props.count++;
    console.log(props);
  },

  render() {
    return h("div", { class: "foo" }, "foo:" + this.count);
  },
};
