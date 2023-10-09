export type TArgs = { [P: string]: string | number };
export type GeneratedTranslation = Record<string, TArgs>;

export type TContent<T = TArgs> = { [key: string]: TContent<T> | TArgs };

export type GenericGeneratedType = {
  this: GeneratedTranslation; // global
  others: Record<string, GeneratedTranslation>; // sub translations available
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
