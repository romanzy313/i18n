export type TArgs = { [P: string]: string | number };
// export type TTranslation = { readonly [P: string]: TArgs };

export type TTranslation = Record<string, TArgs | undefined>;

export type Translation1 = Readonly<{
  key1: {
    hello: string;
  };
  another: undefined;
}>;
export type Translation2 = Readonly<{
  more: {};
  locales: {};
}>;
const t1: Translation1 = {
  key1: {
    hello: "as",
  },
  another: undefined,
};

class TTest {}

type SubHelper2<
  Prefix extends string,
  NsSeparator extends string,
  T extends TTranslation
> = {
  // it is unfortunate that Key can also be a symbol
  // even though it is clearly defined as a string
  // yet this still works

  // @ts-expect-error
  readonly [Property in keyof T as `${Prefix}${NsSeparator}${Property}`]: readonly T[Property];
};

type CreateImmutable<Type> = {
  +readonly [Property in keyof Type]: Type[Property];
};
type CreateImmutable2<Type> = {
  +readonly [Property in keyof Type]: Type[Property];
};

type Test2 = SubHelper2<"translation1", ":", Translation1>;

// const obj1: Test1 = {
//   "translation1:key1": {},
//   "translation1:another": {},
// };
const obj2: Test2 = {
  "translation1:key1": {
    hello: "asdasd",
  },
  "translation1:another": undefined,
};

// {
//   [key in `${Prefix}:${keyof T}`]: T[key];
// };

// export type SubHelper<Prefix extends string, T extends TArgs> = <K = keyof TArgs>{
//   [key in `${Prefix}:${keyof T}`]: T[key];
// };

export type GeneratedType = {
  $$global: {
    [key: `translation1${string}`]: Translation1;
    // "translation2:key": {}
  };
  translation1: Translation1;
  translation2: Translation2;
};

export type GenericGeneratedType = {
  t: RecursedObj<TArgs>;
  n: { [key: string]: GenericGeneratedType };
  l: string[];
};

type RecursedObj<V> = { [key: string]: V | RecursedObj<V> };

/**
 type Ns1StrObj<Key extends keyof Ns1Def = keyof Ns1Def> = {
  [key in `ns1:${Key}`]: Ns1Def[Key];
};
 */
type FrozenDef = { [key: string]: TArgs | FrozenDef };
export type CompositeKeyDef<Prefix extends string, Def extends FrozenDef> = {
  def: Def;
  // prefix: Prefix;
  keys: ReturnType<
    <Key extends keyof Def>() => {
      // @ts-expect-error it still actually works!
      [key in `${Prefix}:${Key}`]: Def[Key];
    }
  >;
};

export type ErrorArgs = {
  message: string;
  level: "warn" | "error";
  original: string;
  key: string;
  namespace: string;
  etcetc: any;
};

export type NestedRawTranslations = {
  [key: string]: NestedRawTranslations;
};
