// this is the core class

import { GenericGeneratedType, TArgs } from "./types";
import {
  I18nEventHandler,
  I18nEventOptions,
  I18nEvents,
  NotFoundArgs,
} from "./EventHandler";
import { BaseFormatter, FormatTranslation } from "./bases/BaseFormatter";
import BaseParser from "./bases/BaseParser";
import { UtilDefinition } from "./utils/def";
import { BaseLoader } from "./bases/BaseLoader";

// cache is its own class
export type I18nRuntime = {
  // loaded: Map<any,any>,
  loader: BaseLoader;
  parser: BaseParser;
  formatter: BaseFormatter;
  eventHandler: I18nEventHandler;
  loading: Map<string, Promise<boolean>>;
  loaded: Set<string>; //
  eventCache: Set<string>;
  utilCache: Map<string, UtilDefinition>; // TODO
  formatNotFound: (args: NotFoundArgs) => string;
  translateFns: Map<string, FormatTranslation>;
  utils: UtilDefinition | null;
};

export type InnerI18nOpts = {
  locales: string[];
  defaultLocale: string;

  nsSeparator: string;
  keySeparator: string;

  utils: UtilDefinition | null;
};

export type I18nOpts<U extends UtilDefinition> = {
  locales: string[];
  defaultLocale: string;
  loader: BaseLoader;
  parser: BaseParser;
  formatter: BaseFormatter;

  // utils?: UtilDefinition<U>;
  utils?: U;

  // what to initialize current instance to. if not provided fallback locale is used
  currentLocale?: string;

  // various formatter things with good defaults
  nsSeparator?: string;
  keySeparator?: string;
  startDelimiter?: string;
  endDelimiter?: string;

  // custom handling of events
  events?: I18nEventOptions;

  formatNotFound?: (args: NotFoundArgs) => string;
};

function processOpts(opts: I18nOpts<any>): InnerI18nOpts {
  return {
    locales: opts.locales,
    defaultLocale: opts.defaultLocale,
    nsSeparator: opts.nsSeparator || ":",
    keySeparator: opts.keySeparator || ".",
    utils: opts.utils || null,
  };
}

const defaultEvents: I18nEvents = {
  badLocale: (o) => {
    console.log("bad locale", o.locale);
  },
  debug: (message) => console.log(message),
  error: (message) => console.error(message),
  warning: (message) => console.warn(message),
  loadFailure: (o) => {
    console.error(
      "Failed to",
      o.operation,
      "on",
      o.targetObj,
      "with reason",
      o.reason
    );
  },
  // this should not return a value
  // this is just a sideeffect
  translationNotFound: (o) => {
    console.log("Translation", o.fullyResolvedPath, "not found");

    return o.fullyResolvedPath;
  },
};

function processEventOpts(eventOpts?: I18nEventOptions): I18nEvents {
  return {
    ...defaultEvents,
    ...eventOpts,
  };
}

function createRuntime<U extends UtilDefinition>(
  opts: I18nOpts<U>,
  eventOpts: I18nEvents
): I18nRuntime {
  return {
    loader: opts.loader,
    parser: opts.parser,
    formatter: opts.formatter,
    eventHandler: new I18nEventHandler(eventOpts),
    //   cache: new Cache(),
    loading: new Map(),
    loaded: new Set(),
    eventCache: new Set(),
    utilCache: new Map(),
    formatNotFound:
      opts.formatNotFound || (({ fullyResolvedPath }) => fullyResolvedPath),
    utils: opts.utils || null,
    translateFns: new Map<string, FormatTranslation>(),
  };
}

// TODO publically exposed scopes need to remove internal public fields from types
export type I18nScope<T extends GenericGeneratedType> = Omit<
  I18nChain<T, any>, // TODO?
  "opts" | "runtime"
>;

// only root one has access to load namspeace, it returns self!!
// export class

export class I18nChain<
  T extends GenericGeneratedType,
  U extends UtilDefinition
> {
  public opts: InnerI18nOpts; // should be hidden from the library consumer
  public runtime: I18nRuntime; // should be hidden from the library consumer

  private _locale: string;
  private _namespace: string;
  // private translateFns =

  private utilInstance: InstanceType<U> | null = null;

  constructor(
    opts: InnerI18nOpts,
    runtime: I18nRuntime,
    locale: string,
    namespace: string
  ) {
    this.opts = opts;
    this.runtime = runtime;

    // need to make sure it is safe
    this._locale = this.getSafeLocale(locale);
    this._namespace = namespace;

    if (opts.utils)
      //@ts-expect-error class types are a pain in ts
      this.utilInstance = new opts.utils(opts, runtime, locale, namespace);
  }

  get utils(): InstanceType<U> {
    if (!this.utilInstance)
      throw new Error("Define util when constructing to use it");

    return this.utilInstance;
  }

  // opts some accessors
  get locale(): string {
    return this._locale;
  }

  get namespace(): string {
    return this.namespace;
  }
  get dir(): string {
    // TODO this is not complete

    if (this._locale == "ar") return "rtl";

    return "lrt";
  }
  get allLocales(): string[] {
    return this.opts.locales;
  }
  get otherLocales(): string[] {
    return this.opts.locales.filter((locale) => locale != this._locale);
  }
  get defaultLocale(): string {
    return this.opts.defaultLocale;
  }

  public getSafeLocale(locale: string | undefined | null) {
    const isOk = locale && this.opts.locales.includes(locale);
    if (!isOk) {
      // error event
      this.runtime.eventHandler.handleEvent("badLocale", {
        locale: locale || "undefined",
      });
    }
    return isOk ? locale : this.opts.defaultLocale;
  }

  public setLocale(newLocale: string) {
    const safeLocale = this.getSafeLocale(newLocale);

    if (this._locale == newLocale) return;
    this._locale = safeLocale;

    // TODO reload utils
  }

  public async setLocaleAndReloadTranslations(newLocale: string) {
    newLocale = this.getSafeLocale(newLocale);
    const oldLocale = this._locale;

    if (newLocale == this._locale) return;

    const current = this.runtime.loaded.keys();
    const translationsToLoad: string[] = [];

    for (const i of current) {
      const [thisLocale, translation] = i.split("_");
      if (thisLocale != oldLocale) continue;

      translationsToLoad.push(translation);
    }

    this.setLocale(newLocale);
    return this.loadTranslations(translationsToLoad);
  }

  // TRANSLATING

  private t_internal(locale: string, relativePath: string, args?: TArgs) {
    const fullyQuantified =
      (this._namespace ? this._namespace + this.opts.nsSeparator : "") +
      (relativePath as string);

    const cacheKey = locale + "_" + fullyQuantified;

    const translateFn = this.runtime.translateFns.get(cacheKey);

    if (!translateFn) {
      const args = {
        locale,
        namespace: this._namespace, // TODO,
        fullyResolvedPath: fullyQuantified,
      };
      this.runtime.eventHandler.handleEvent("translationNotFound", args);
      return this.runtime.formatNotFound(args);
    }

    return translateFn(args || undefined);
  }

  public t_locale<Key extends keyof T["this"]>(
    locale: string,
    relativePath: Key,
    args?: T["this"][Key]
  ) {
    return this.t_internal(
      this.getSafeLocale(locale),
      relativePath as string,
      args || (undefined as any)
    );
  }

  public t<Key extends keyof T["this"]>(
    relativePath: Key,
    args?: T["this"][Key]
  ) {
    return this.t_internal(
      this._locale,
      relativePath as string,
      args || (undefined as any)
    );
  }

  // LOADING

  private addTranslationFunctions(
    locale: string,
    namespace: string,
    obj: Record<string, any>,
    parentKey = ""
  ) {
    // const result = new Map<string, string>();
    for (const key in obj) {
      if (typeof obj[key] === "object") {
        this.addTranslationFunctions(
          locale,
          namespace,
          obj[key],

          parentKey + key + this.opts.keySeparator
        );
      } else {
        // Leaf node found, add it to the result map
        // namespace will 100% be defined
        const fullKey = `${locale}_${namespace}${this.opts.nsSeparator}${parentKey}${key}`;
        const value = obj[key];
        this.runtime.translateFns.set(
          fullKey,
          this.runtime.formatter.format(value, locale)
        );
      }
    }
  }

  protected async loadSingleTranslation(
    locale: string,
    namespace: string
  ): Promise<boolean> {
    // const cacheKey = this.getCacheKey()
    const cacheKey = `${locale}_${namespace}`;

    if (this.runtime.loading.has(cacheKey)) {
      return this.runtime.loading.get(cacheKey)!;
    }

    const loadPromise = new Promise<boolean>((resolve) => {
      this.runtime.loader
        .load(locale, namespace, this.runtime.parser.extension)
        .then((rawData) => {
          const parsedTranslation = this.runtime.parser.parse(rawData);
          this.addTranslationFunctions(
            locale,
            namespace,
            parsedTranslation,
            ""
          );
          this.runtime.loaded.add(cacheKey); // add it to loaded, just for now
          resolve(true);
        })
        .catch((err: any) => {
          // log that it fails
          this.runtime.eventHandler.handleError(err);

          // TODO remove this
          console.error("failed to load translation", err); // but could also fails in addTranslationFunctions

          resolve(false);
        });
    });
    this.runtime.loading.set(cacheKey, loadPromise);
    return loadPromise;
  }

  public async loadTranslation<Key extends keyof T["others"]>(key: Key) {
    return this.loadSingleTranslation(this.locale, key as string);
  }

  public async loadTranslations<Key extends keyof T["others"]>(keys: Key[]) {
    const res = await Promise.all(
      (keys as string[]).map((key) =>
        this.loadSingleTranslation(this.locale, key)
      )
    );
    return res.every((v) => v == true);
  }

  // loads the current namespace, only available in sub namespace
  public async loadRootScopeTranslation() {
    if (!this._namespace) {
      this.runtime.eventHandler.handleEvent(
        "error",
        "Must be inside a namespace to load own root scope translation."
      );
      return;
    }

    const loadRes = await this.loadSingleTranslation(
      this.locale,
      this._namespace
    );

    return loadRes;
  }

  // OTHERS

  public getSubI18n<Key extends keyof T["others"]>(opts: {
    locale: string | undefined | null;
    namespace: Key;
  }): I18nChain<
    {
      this: T["others"][Key];
      others: {};
    },
    U
  >;
  public getSubI18n<Key extends keyof T["others"]>(opts: {
    locale?: string | undefined | null;
    namespace: Key;
  }): I18nChain<
    {
      this: T["others"][Key];
      others: {};
    },
    U
  >;
  public getSubI18n<Key extends keyof T["others"]>(opts: {
    locale: string | undefined | null;
  }): this;
  public getSubI18n<Key extends keyof T["others"]>(opts: {
    locale?: string | undefined | null;
    namespace?: Key;
  }) {
    const newChain = new I18nChain(
      this.opts,
      this.runtime,
      opts.locale || this._locale,
      opts.namespace || (this._namespace as any)
    );

    return newChain;
  }
}

export class I18nInstance<
  T extends GenericGeneratedType = any,
  U extends UtilDefinition = any
> extends I18nChain<T, U> {
  constructor(opts: I18nOpts<U>) {
    // do some preliminary checks
    if (!opts.locales.includes(opts.defaultLocale))
      throw new Error("fallback locale must be define in locales");

    // this makes a full copy
    const innerOpts = processOpts(opts);
    const eventOpts = processEventOpts(opts.events);
    const runtime = createRuntime(opts, eventOpts);

    const startLocale =
      opts.currentLocale && opts.locales.includes(opts.currentLocale)
        ? opts.currentLocale
        : opts.defaultLocale;
    // start the intiial copy
    super(innerOpts, runtime, startLocale, "");
  }

  async loadAllTranslations(): Promise<boolean> {
    const list = await this.runtime.loader.list();

    const promises = list.map(({ locale, namespace }) =>
      this.loadSingleTranslation(locale, namespace)
    );

    const res = await Promise.all(promises);

    return res.every((v) => v == true);
  }
}
