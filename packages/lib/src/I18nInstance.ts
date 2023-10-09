// this is the core class

import { GenericGeneratedType, TArgs } from ".";
import {
  I18nEventHandler,
  I18nEventOptions,
  I18nEvents,
  NotFoundArgs,
} from "./EventHandler";
import { I18nError } from "./I18nError";
import { BaseFormatter, FormatTranslation } from "./formatter/BaseFormatter";
import { BaseLoader } from "./loader/BaseLoader";
import BaseParser from "./parser/BaseParser";
import { PathnameUtls } from "./utils/PathnameUtils";

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
  formatNotFound: (args: NotFoundArgs) => string;
  translateFns: Map<string, FormatTranslation>;
  utils: PathnameUtls;
};

export type InnerI18nOpts = {
  locales: string[];
  // locale: string;
  // namespace: string[];
  fallbackLocale: string; // is this needed? why would namespace

  // its like getSubI18n
  nsSeparator: string;
  keySeparator: string;
  startDelimiter: string;
  endDelimiter: string;
};

export type I18nOpts = {
  locales: string[];
  fallbackLocale: string;
  loader: BaseLoader;
  parser: BaseParser;
  formatter: BaseFormatter;

  utils?: PathnameUtls;

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

  // we load them with loader

  // backend?: BackendObj;

  /**
   * What is output when the key is not found, or there is an error
   * can interpolate it using same delimiters. Important variables to note:
   *  * original - full value that was given to t
   *  * key - key only
   *  * ns - namespace only
   */

  // default true. will only run one instance of the caching
  singleton?: boolean;
};

function processOpts(opts: I18nOpts): InnerI18nOpts {
  return {
    locales: opts.locales,
    fallbackLocale: opts.fallbackLocale,
    nsSeparator: opts.nsSeparator || ":",
    keySeparator: opts.keySeparator || ".",
    startDelimiter: opts.startDelimiter || "{{",
    endDelimiter: opts.endDelimiter || "}}",
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

function createRuntime(opts: I18nOpts, eventOpts: I18nEvents): I18nRuntime {
  return {
    loader: opts.loader,
    parser: opts.parser,
    formatter: opts.formatter,
    eventHandler: new I18nEventHandler(eventOpts),
    //   cache: new Cache(),
    loading: new Map(),
    loaded: new Set(),
    eventCache: new Set(),
    formatNotFound:
      opts.formatNotFound || (({ fullyResolvedPath }) => fullyResolvedPath),
    utils: opts.utils || new PathnameUtls(),
    translateFns: new Map<string, FormatTranslation>(),
  };
}

// TODO publically exposed scopes need to remove internal public fields from types
export type I18nScope<T extends GenericGeneratedType> = Omit<
  I18nChain<T>,
  "opts" | "runtime"
>;

export class I18nChain<T extends GenericGeneratedType> {
  public opts: InnerI18nOpts; // public for now
  public runtime: I18nRuntime; // public for now

  private _locale: string;
  private _namespace: string;
  // private translateFns =

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
  }

  // helper functions exposed here
  public getLink(url: string) {
    //
    return this.runtime.utils.getLink(this.locale, url);
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
  get fallbackLocale(): string {
    return this.opts.fallbackLocale;
  }

  // private getTranslationCacheKey(locale: string, namespace: string) {
  //   return `${locale}_${namespace}`;
  // }

  public getSafeLocale(locale: string | undefined | null) {
    const isOk = locale && this.opts.locales.includes(locale);
    if (!isOk) {
      // error event
      this.runtime.eventHandler.handleEvent("badLocale", {
        locale: locale || "undefined",
      });
    }
    return isOk ? locale : this.opts.fallbackLocale;
  }

  // this is only available at the root
  // private enterNamespace(newNamespace: string[]) {
  //   this.opts.namespace.push(...newNamespace);
  //   // this.opts.namespace = opts.namespace.split(this.opts.nsSeparator);
  // }

  private addTranslationFunctions(
    locale: string,
    // namespace: string,
    fullNamespace: string,
    obj: Record<string, any>,
    parentKey = ""
  ) {
    // const result = new Map<string, string>();
    for (const key in obj) {
      if (
        typeof obj[key] === "object"
        // &&
        // !Array.isArray(obj[key]) &&
        // obj[key] !== null
      ) {
        this.addTranslationFunctions(
          locale,
          fullNamespace,
          obj[key],

          parentKey + key + this.opts.keySeparator
        );
      } else {
        // Leaf node found, add it to the result map
        // namespace will 100% be defined
        const fullKey = `${locale}_${fullNamespace}${this.opts.nsSeparator}${parentKey}${key}`;
        const value = obj[key];
        this.runtime.translateFns.set(
          fullKey,
          this.runtime.formatter.format(value, locale)
        );
      }
    }
  }

  // break it down
  protected async loadSingleTranslation(
    // relativeNamespace: string
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

  // USER FACING FUNCTIONS

  public setLocale(newLocale: string) {
    // TODO also load all the new translations needed if locale is changed.
    const safeLocale = this.getSafeLocale(newLocale);
    this._locale = safeLocale;
  }

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

  public t_locale<Key extends keyof T["t"]>(
    locale: string,
    relativePath: Key,
    args?: T["t"][Key]
  ) {
    return this.t_internal(
      this.getSafeLocale(locale),
      relativePath as string,
      args || (undefined as any)
    );
  }

  public t<Key extends keyof T["t"]>(relativePath: Key, args?: T["t"][Key]) {
    return this.t_internal(
      this._locale,
      relativePath as string,
      args || (undefined as any)
    );
  }

  // TODO this needs a different type, as n allows intermediaries
  public async loadTranslation<Key extends T["l"][number]>(
    keyOrKeys: Key | Key[]
  ) {
    // ns is relative to the current scope!

    if (typeof keyOrKeys === "string")
      return this.loadSingleTranslation(this.locale, keyOrKeys);

    // const realKeys = Array.isArray(keys) ? keys : [keys];

    const res = await Promise.all(
      (keyOrKeys as string[]).map((key) =>
        this.loadSingleTranslation(this.locale, key)
      )
    );
    return res.every((v) => v == true);
  }

  // loads the current namespace, only available in translations!
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
    // const path = this.opts.namespace.join(this.opts.nsSeparator);
    // return this.loadTranslation(path);
  }

  public getSubI18n<Key extends keyof T["n"]>(opts: {
    locale: string | undefined | null;
    namespace: Key;
  }): I18nChain<T["n"][typeof opts.namespace]>;
  public getSubI18n<Key extends keyof T["n"]>(opts: {
    namespace: Key;
  }): I18nChain<T["n"][typeof opts.namespace]>;
  public getSubI18n<Key extends keyof T["n"]>(opts: {
    locale: string | undefined | null;
  }): I18nChain<T>;
  public getSubI18n<Key extends keyof T["n"]>(opts: {
    locale?: string | undefined | null;
    namespace?: Key;
  }) {
    // const optsCopy = { ...this.opts };

    const newChain = new I18nChain(
      this.opts,
      this.runtime,
      opts.locale || this._locale,
      opts.namespace || (this._namespace as any)
    );

    return newChain;
  }
}

// const s: I18nScope<any> = new I18nChain<any>({} as any, {} as any);

// s.
export class I18nInstance<
  T extends GenericGeneratedType = GenericGeneratedType
> extends I18nChain<T> {
  constructor(opts: I18nOpts) {
    // do some preliminary checks

    if (!opts.locales.includes(opts.fallbackLocale))
      throw new Error("fallback locale must be define in locales");

    // this makes a full copy
    const innerOpts = processOpts(opts);
    const eventOpts = processEventOpts(opts.events);
    const runtime = createRuntime(opts, eventOpts);

    const startLocale =
      opts.currentLocale && opts.locales.includes(opts.currentLocale)
        ? opts.currentLocale
        : opts.fallbackLocale;
    // start the intiial copy
    super(innerOpts, runtime, startLocale, "");
  }

  // can scope only once
  // then you can still change the langs
  // its just scopes are just helpers!
  // dont allow to recursively do this,
  // as it does seem like an overcomplicated idea

  // some superspecial things
  // like ability to start a cli process?

  async loadAllTranslations(): Promise<boolean> {
    throw new Error("not reimplemented yet");

    // const list = await this.runtime.loader.list();

    // const promises = list.map(({ locale, namespace }) =>
    //   this.loadSingleTranslation(locale, namespace)
    // );

    // const res = await Promise.all(promises);

    // return res.every((v) => v == true);
  }

  attachToCli() {
    // basically proxies commands with opts to the outsider
  }
  testTranslation() {}

  // fill forcefully reset this instance...
  // all children are still dangling! can keep a list of them when making it
  // so that when reset is called, everything is cleaned up and removed!
  // this is probably not needed though
  reset() {}
}
