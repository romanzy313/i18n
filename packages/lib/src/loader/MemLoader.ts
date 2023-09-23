import { BaseLoader, ListResult } from "./BaseLoader";
const translationSymbol = Symbol();
export default class MemLoader extends BaseLoader {
  public static translation(val: Record<string, any>) {
    return {
      [translationSymbol]: true,
      ...val,
    };
  }

  constructor(private memSimulatedStore: Record<string, any>) {
    super();
  }

  // this can throw standard error, locale: string, namespace: string[], fullInput: string
  async load(
    locale: string,
    namespace: string[],
    _extension: string
  ): Promise<string> {
    let item: Record<string, any> = this.memSimulatedStore;

    if (!(locale in item)) throw new Error("bad locale");

    let inTranslation = false;

    item = item[locale];
    for (let i = 0; i < namespace.length; i++) {
      if (inTranslation)
        throw new Error(
          "not found, but really trying to escale emaginary namespace"
        );

      const ns = namespace[i];
      if (ns in item) {
        if (translationSymbol in item[ns]) inTranslation = true;

        item = item[ns];
      } else {
        console.log("no there", this.memSimulatedStore, locale, namespace);
        throw new Error("bad namespace " + JSON.stringify(namespace)); // but I also need to pass data, like full information of locale, namespace, key, whatever
        // so lets do a custom error then
      }
    }

    const res = JSON.stringify(item);

    return res;
  }

  private internalList(obj: any, parentNamespace: string[]): string[][] {
    if (translationSymbol in obj) {
      // means its a translation file, record this
      return [parentNamespace]; // basically this is the namespace
    }

    const results: string[][] = [];
    Object.keys(obj).forEach((key) => {
      results.push(...this.internalList(obj[key], [...parentNamespace, key]));
    });
    return results;
  }

  async list(): Promise<ListResult[]> {
    const locales = Object.keys(this.memSimulatedStore);

    let results: ListResult[] = [];

    locales.forEach((locale) => {
      const namespaces = this.internalList(this.memSimulatedStore[locale], []);

      namespaces.forEach((namespace) => {
        results.push({
          locale,
          namespace,
          // need opts of the loader here, just return a path ()
        });
      });
    });

    return results;
  }
}
