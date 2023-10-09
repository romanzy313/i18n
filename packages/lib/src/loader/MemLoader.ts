import { I18nError } from "../I18nError";
import { BaseLoader, ListResult } from "./BaseLoader";

type TranslationValue = Record<string, any>; // really a recursive type with string leafs

type LoadTranslation =
  | TranslationValue
  | (() => TranslationValue)
  | (() => Promise<TranslationValue>);

type ManyTranslations = Record<string, TranslationValue>;

type LoadTranslationFn = (() => any) | (() => Promise<any>);
export default class MemLoader extends BaseLoader {
  private loadFns = new Map<string, LoadTranslationFn>();

  constructor() {
    super();
  }

  private getCacheKey(locale: string, namespace: string) {
    return `${locale}_${namespace}`;
  }

  async register(
    locale: string,
    namespace: string,
    translation: LoadTranslation
  ) {
    const cacheKey = this.getCacheKey(locale, namespace);

    if (this.loadFns.has(cacheKey))
      throw new Error(`duplicate registration of ${locale} ${namespace}`);

    const fn: any =
      typeof translation === "function" ? translation : () => translation;

    this.loadFns.set(cacheKey, fn);

    // this.memSimulatedStore[locale] = res;
  }

  registerMany(locale: string, translations: ManyTranslations) {
    Object.keys(translations).forEach((namespace) => {
      const cacheKey = this.getCacheKey(locale, namespace);
      if (this.loadFns.has(cacheKey))
        throw new Error(`duplicate registration of ${locale} ${namespace}`);

      this.loadFns.set(cacheKey, () => translations[namespace]);
    });
  }

  // TODO optimize this
  // this always returns json
  // but it doesnt have to
  // an actual object can be passed, but then its a lot of type overides to any
  // this has a potential to get used in production, so invistigate later
  async load(
    locale: string,
    namespace: string,
    _extension: string
  ): Promise<string> {
    const cacheKey = this.getCacheKey(locale, namespace);

    const loadFn = this.loadFns.get(cacheKey);

    if (!loadFn)
      throw new I18nError("loadFailure", {
        operation: "load",
        targetObj: {
          locale,
          namespace,
          extension: _extension,
        },
        reason: "invalid locale or namespace",
      });

    const result = await loadFn();

    return JSON.stringify(result);
  }

  async list(): Promise<ListResult[]> {
    const keys = this.loadFns.keys();

    // split them into pairs and turn into a list
    let results: ListResult[] = [];

    for (const key of keys) {
      const [locale, namespace] = key.split("_");

      results.push({
        locale,
        namespace,
        extension: "",
      });
    }

    return results;
  }
}
