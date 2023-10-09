/** 
 * AUTOMATICALLY GENERATED TYPES, DO NOT MODIFY
 */

export default TestTypeGen;

export type TestTypeGen = {
  "this": {
    [key in keyof Default as `default:${key}`]: Default[key]
  } & {
    [key in keyof Hello as `hello:${key}`]: Hello[key]
  };
  "others": {
    "default": Default;
    "hello": Hello;
  };
}

export type Default = {
  "yes": {};
  "no": {};
  "photos": {
    "count": number;
  };
}

export type Hello = {
  "nested.key": {};
}