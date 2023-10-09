export type TArgs = { [P: string]: string | number };
export type GeneratedTranslation = Record<string, TArgs>;

export type TContent<T = TArgs> = { [key: string]: TContent<T> | TArgs };

export type GenericGeneratedType = {
  this: GeneratedTranslation; // global
  others: Record<string, GeneratedTranslation>; // sub translations available
};

// {
//   [key in `${Prefix}:${keyof T}`]: T[key];
// };

// export type SubHelper<Prefix extends string, T extends TArgs> = <K = keyof TArgs>{
//   [key in `${Prefix}:${keyof T}`]: T[key];
// };

// export type GenericGeneratedType = {
//   t: RecursedObj<TArgs>;
//   n: { [key: string]: GenericGeneratedType };
//   l: string[];
// };

type RecursedObj<V> = { [key: string]: V | RecursedObj<V> };

/**
 type Ns1StrObj<Key extends keyof Ns1Def = keyof Ns1Def> = {
  [key in `ns1:${Key}`]: Ns1Def[Key];
};
 */
// type FrozenDef = { [key: string]: TArgs | FrozenDef };
// export type CompositeKeyDef<Prefix extends string, Def extends FrozenDef> = {
//   def: Def;
//   // prefix: Prefix;
//   keys: ReturnType<
//     <Key extends keyof Def>() => {
//       // @ts-expect-error it still actually works!
//       [key in `${Prefix}:${Key}`]: Def[Key];
//     }
//   >;
// };

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
