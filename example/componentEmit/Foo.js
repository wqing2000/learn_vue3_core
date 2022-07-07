import { h } from "../../lib/guide-mini-vue.esm.js";

export const Foo = {
  setup(props, { emit }) {
    const emitAdd = (e) => {
      console.log("emit-add");
      // emit("ChangeCount", 11, "hi");
      emit("change-count", 11, "hi");
    };

    return {
      emitAdd,
    };
  },

  render() {
    const Btn = h("button", { onClick: this.emitAdd }, "改值");
    const Child = h("div", {}, "foo:" + this.count);
    return h("div", { class: "foo" }, [Child, Btn]);
  },
};
