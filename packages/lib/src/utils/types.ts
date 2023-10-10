import { I18nRuntime, InnerI18nOpts } from "../I18nInstance"; // TODO bad imports

type RemoveFirstArg<T> = T extends (
  firstArg: UtilContext,
  ...restArgs: infer U
) => infer R
  ? (...args: U) => R
  : T;

export type UtilDefinition = {
  [key: string]: (firstArg: UtilContext, ...restArgs: any[]) => any;
};

export type WrappedUtils<T> = {
  [K in keyof T]: RemoveFirstArg<T[K]>;
};

export type UtilContext = {
  locale: string;
  options: InnerI18nOpts;
  runtime: I18nRuntime;
};
