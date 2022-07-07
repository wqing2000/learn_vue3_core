const extend = Object.assign;
function isObject(res) {
    return res !== null && typeof res === "object";
}
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
const camelize = (str) => {
    return str.replace(/-(\w)/g, (match) => {
        return match.slice(1).toUpperCase();
    });
};
const toHandlerKey = (str) => {
    return str ? "on" + capitalize(str) : "";
};

const targetMap = new Map(); //存储全局作用域下所有的依赖
function trigger(target, key) {
    // 触发依赖的函数
    let depsMap = targetMap.get(target);
    let dep = depsMap.get(key);
    triggerEffects(dep);
}
function triggerEffects(dep) {
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}

// 缓存技术，初始化时创建，避免每次创建响应式对象时，都创建一次
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, isShallow = false) {
    return function get(target, key) {
        // * 判断功能
        // 传入参数isReadonly时，就已经判断是reactive对象，还是readonly对象
        // 判断key值，确定调用的是哪个方法，返回结果
        if (key === "__v_isReactive" /* ReactiveFlags.IS_REACTIVE */) {
            return !isReadonly; //return true 不是readonly对象，是reactive对象
        }
        else if (key === "__V_isReadonly" /* ReactiveFlags.IS_READONLY */) {
            return isReadonly; //return true 是readonly对象，不是reactive对象
        }
        // target 对象，key对象属性名
        // return target.key;
        const res = Reflect.get(target, key);
        if (isShallow) {
            // * 浅层只读的响应式对象，且内部是普通对象，内部对象的属性可以读写
            return res;
        }
        if (isObject(res)) {
            // * proxy对象内部如果还是对象，修改它的属性并不会触发get / set 因为它还是普通objec
            // * 判断proxy对象的属性是否还是对象
            // * 递归将其转为proxy对象
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        // todo 触发依赖
        trigger(target, key);
        return res;
        // return value;
    };
}
const mutableHandlers = {
    get,
    set,
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn(`key:${key} set 失败，因为 target 是 readonly`, target);
        return true;
    },
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet,
});

function reactive(raw) {
    return createReactiveObject(raw, mutableHandlers);
}
function readonly(raw) {
    return createReactiveObject(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
    return createReactiveObject(raw, shallowReadonlyHandlers);
}
function createReactiveObject(raw, baseHandlers) {
    if (!isObject(raw)) {
        console.warn(`target ${raw} 必须是一个对象`);
        return raw;
    }
    // 用 Proxy 代理对象
    // get 对象属性时，收集依赖，返回属性值
    // set 对象属性时，触发依赖，更新与该对象响应的对象属性值。
    return new Proxy(raw, baseHandlers);
}

const emit = (instance, event, ...args) => {
    console.log("emit", event);
    // 每个组件实例都有instance，父组件传入的自定义事件函数，在组件实例的props中
    const { props } = instance;
    const handlerName = toHandlerKey(camelize(event));
    const handler = props[handlerName];
    handler && handler(...args);
};

// * 初始化props功能
function initProps(instance, rawProps) {
    // for (const key in rawProps) {
    //   instance.props[key] = rawProps[key];
    // }
    // * 上下2种写法，实现的功能相同，但是下面的写法，必须要|| {} ，
    // * 否则会导致instance.props 不是一个对象，导致创建shallowReadnoly时报错。Proxy只能代理对象
    instance.props = rawProps || {};
}

const PublicPropertiesMap = {
    $el: (i) => i.vnode.el,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        // setupState，props
        const { setupState, props } = instance;
        // * 重构 实现属性值是否在对象中，语义化封装
        // * 实现setupState属性代理
        // if (key in setupState) {
        //   return setupState[key];
        // }
        // * 将props的属性代理
        // if (key in props) {
        //   return props[key];
        // }
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        // * 添加 $el 到 组件实例上
        // if (key === "$el") {
        //   return instance.vnode.el;
        // }
        const publicGetter = PublicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

function createComponentInstance(vnode) {
    // ? 为什么创建组件实例对象,只需要把vnode放到一个对象里就可以
    // * 创建组件实例,并将vnode挂载到组件实例上,方便后面获取vnode中的属性/方法
    // 每个组件实例都具有以下属性
    const Instance = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        emit: () => { },
    };
    // * 这里使用bind，不是为了绑定this，而是为了给emit函数表达式，传入组件组件实例这个参数，让用户不需要传这个参数
    Instance.emit = emit.bind(null, Instance);
    return Instance;
}
// * 解析组件setup，挂到创建的实例
function setupComponent(instance) {
    // TODO
    initProps(instance, instance.vnode.props);
    // initSlots()
    // #6 初始化一个有setup状态的组件
    // 函数组件没有状态
    setupStatefulComponent(instance);
}
// * 初始化一个有setup状态的组件功能
function setupStatefulComponent(instance) {
    const Component = instance.type;
    // TODO
    // * 用proxy代理 instance 实例，实现简化访问。让用户写代码的时候更方便
    // 如：setupState对象中的数据，可以通过this.msg 而不是this.setupState.msg 访问
    // 还有 this.$el 等
    // * 需要将它们的值，绑定到render函数（实例）的this上
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    // 解构,拿到虚拟节点内的setup
    const { setup } = Component;
    // #7 调用setup,拿到它的返回值
    if (setup) {
        // * 传入的props 包装为shallowReadon
        // const setupResult = setup(instance.props);
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit, // 这里要传入的是组件实例的emit函数表达式，经过bind处理的
        });
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // * 要将组件sfc内部的 setup内写的代码,挂载到组件的实例上,最后才能识别
    // * setup 返回值有2种情况 function 或 object
    // TODO function
    if (typeof setupResult === "object") {
        instance.setupState = setupResult;
    }
    // * 需要保证组件实例的render 一定要有值
    // * 即,如果组件内有写render函数,将render函数挂载到组件实例
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    // * 将用户写的render函数，挂到实例上
    // if (Component.render) {
    instance.render = Component.render;
    // }
}

// * render渲染函数，接收2个参数，
// * vnode 虚拟节点
// * container 节点挂载的容器
function render(vnode, container) {
    // 只调用patch函数，补丁、更新页面
    patch(vnode, container);
}
// * 函数接收2个参数，vnode和container
// * 内部调用diff 算法，只将 vnode 有改动的地方渲染到 页面
// 后续需要递归调用，封装
function patch(vnode, container) {
    // #3 处理vnode 的过程函数
    // * 需要判断vnode的类型,是 component 还是 element
    // ? 如何判断虚拟节点是component 还是 element 类型
    // * vnode.type是 string 还是Object类型
    // // 是否存在render函数
    const { shapeFlag } = vnode;
    // if (typeof vnode.type === "string") {
    if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
        processElement(vnode, container);
        // } else if (isObject(vnode.type)) {
    }
    else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        processComponent(vnode, container);
    }
}
// * 挂载element
function processElement(vnode, container) {
    mountElement(vnode, container);
}
function mountElement(vnode, container) {
    // 创建真实DOM元素
    // vnode -> element 类型，这里保存下来
    const el = (vnode.el = document.createElement(vnode.type));
    // 添加属性
    const { props } = vnode;
    for (const key in props) {
        const val = props[key];
        const isOn = (key) => /^on[A-Z]/.test(key);
        if (isOn(key)) {
            // * 实现注册事件功能
            const event = key.slice(2).toLowerCase();
            el.addEventListener(event, val);
        }
        else {
            el.setAttribute(key, val);
        }
    }
    // 添加子元素（包括文本节点）
    const { children, shapeFlag } = vnode;
    // if (typeof children === "string") {
    if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
        // el.appendChild(document.createTextNode(children));
        el.textContent = children;
        // } else if (Array.isArray(children)) {
    }
    else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
        mountChildren(vnode, el);
    }
    container.append(el);
}
// * 挂载element的子元素
function mountChildren(vnode, container) {
    // TODO children内的文本节点无法渲染
    for (let v of vnode.children) {
        patch(v, container);
    }
}
// * 挂载组件
function processComponent(vnode, container) {
    // TODO 判断是初始化,还是更新组件component
    // #4 挂载组件
    mountComponent(vnode, container);
}
// * 挂载组件
function mountComponent(initialVNode, container) {
    // 创建组件实例
    const instance = createComponentInstance(initialVNode);
    // 组件初始化,挂载vnode内部的setup render 等到组件实例
    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container);
}
function setupRenderEffect(instance, initialVNode, container) {
    // * 运行组件实例上的render函数，获取返回值 vnode（subTree接收） ，这时vnode是 element类型
    // 将实例的this 绑定到proxy，所有的取值操作全部代理
    const { proxy } = instance;
    const subTree = instance.render.call(proxy);
    // instance.$el = subTree; // * 需要的是element，不是组件
    // vnode -> patch()
    // vnode -> element -> mountElement
    patch(subTree, container);
    // 在所有element 都 mount 之后，才能获取到真实DOM的根节点
    initialVNode.el = subTree.el;
}

// * 创建组件vnode的函数，接收3个参数
// * type，创建的组件
// * props 创建组件的属性
// * children 创建组件内的子组件
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        shapeFlag: getShapeFlag(type),
    };
    if (typeof children === "string") {
        vnode.shapeFlag |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    function getShapeFlag(type) {
        return typeof type === "string"
            ? 1 /* ShapeFlags.ELEMENT */
            : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
    }
    return vnode;
}

// * 接收一个根组件参数，返回一个app实例对象
function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            // * vue3中，必须先把 SFC 转成 vnode
            // * component  -> vnode
            // * 所有的逻辑操作 都会基于 vnode 做处理
            // #1 先将根组件转成vnode
            const vnode = createVNode(rootComponent);
            // #2 render将vnode渲染到页面
            render(vnode, rootContainer);
        },
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

export { createApp, h };
