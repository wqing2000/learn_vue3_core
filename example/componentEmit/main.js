// 应该与vue3的api保持一致

import { App } from "./App.js";
import { createApp } from "../../lib/guide-mini-vue.esm.js";

// TODO
// mount 参数目前是dom的容器，不是字符串

const rootContainer = document.querySelector("#app");

createApp(App).mount(rootContainer);
