export const extend = Object.assign;

export function hasChanged(value, newValue) {
  return !Object.is(value, newValue);
}

export function isObject(res) {
  return res !== null && typeof res === "object";
}

export const hasOwn = (val: any, key: PropertyKey) =>
  Object.prototype.hasOwnProperty.call(val, key);

export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const camelize = (str: string) => {
  return str.replace(/-(\w)/g, (match) => {
    return match.slice(1).toUpperCase();
  });
};

export const toHandlerKey = (str: string) => {
  return str ? "on" + capitalize(str) : "";
};
