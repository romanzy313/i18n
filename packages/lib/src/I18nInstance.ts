// this is the core class

import { GenericGeneratedType } from ".";
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
  locale: string;
  namespace: string[];
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
  const locale = opts.locales.includes(opts.currentLocale || "")
    ? opts.currentLocale!
    : opts.fallbackLocale;

  return {
    locales: opts.locales,
    locale, // check if it is allowed!
    namespace: [], // default is empty!
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

// TODO publically exposed scopes need to remove internal public fields from types
export type I18nScope<T extends GenericGeneratedType> = Omit<
  I18nChain<T>,
  "opts" | "runtime"
>;

export class I18nChain<T extends GenericGeneratedType> {
  public opts: InnerI18nOpts; // public for now
  public runtime: I18nRuntime; // public for now

  // private translateFns =

  constructor(opts: InnerI18nOpts, runtime: I18nRuntime) {
    this.opts = opts;
    this.runtime = runtime;
  }

  // helper functions exposed here
  public getLink(url: string) {
    //
    return this.runtime.utils.getLink(this.locale, url);
  }

  get locale(): string {
    return this.opts.locale;
  }

  get currentNamespace(): string {
    return this.opts.namespace.join(this.opts.nsSeparator);
  }

  get otherLocales(): string[] {
    return this.opts.locales.filter((v) => v !== this.opts.locale);
  }

  public parseUserInputKey(input: string): {
    key: string[];
    namespace: string[];
  } {
    // extract the namespace

    const namespace = [...this.opts.namespace];

    const namespacePos = input.lastIndexOf(this.opts.nsSeparator);

    if (namespacePos != -1) {
      // meaning there are namespaces before it
      const namespaceStr = input.substring(0, namespacePos);
      namespaceStr.split(this.opts.nsSeparator).forEach((v) => {
        namespace.push(v);
      });
    }
    const keyStr =
      namespacePos == -1 ? input : input.substring(namespacePos + 1);

    const key = keyStr.split(this.opts.keySeparator);

    return {
      key,
      namespace,
    };
  }

  private getTranslationCacheKey(locale: string, fullNamespace: string[]) {
    return `${locale}_${fullNamespace.join(":")}`;
  }

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

  private enterNamespace(newNamespace: string[]) {
    this.opts.namespace.push(...newNamespace);
    // this.opts.namespace = opts.namespace.split(this.opts.nsSeparator);
  }

  private addTranslationFunctions(
    locale: string,
    // namespace: string,
    fullNamespace: string[],
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
        const fullKey =
          this.getTranslationCacheKey(locale, fullNamespace) +
          ":" +
          parentKey +
          key;
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
    fullNamespace: string[]
  ): Promise<boolean> {
    // const cacheKey = this.getCacheKey()
    const cacheKey = this.getTranslationCacheKey(locale, fullNamespace);

    if (this.runtime.loading.has(cacheKey)) {
      return this.runtime.loading.get(cacheKey)!;
    }

    const loadPromise = new Promise<boolean>((resolve) => {
      this.runtime.loader
        .load(locale, fullNamespace, this.runtime.parser.extension)
        .then((rawData) => {
          if (rawData instanceof I18nError) {
            this.runtime.eventHandler.handleError(rawData);
            return resolve(false);
          }

          const parsedTranslation = this.runtime.parser.parse(rawData);
          this.addTranslationFunctions(
            locale,
            fullNamespace,
            parsedTranslation,
            ""
          );
          this.runtime.loaded.add(cacheKey); // add it to loaded, just for now
          resolve(true);
        })

        .catch((err: any) => {
          // log that it fails
          this.runtime.eventHandler.handleError(err);
          console.error("failed to load translation", err); // but could also fails in addTranslationFunctions

          resolve(false);
        });
    });
    this.runtime.loading.set(cacheKey, loadPromise);
    return loadPromise;
  }

  // USER FACING FUNCTIONS

  public changeLocale(newLocale: string) {
    // TODO also load all the new translations needed if locale is changed.
    const safeLocale = this.getSafeLocale(newLocale);
    this.opts.locale = safeLocale;
  }

  public t<Key extends keyof T["t"]>(relativePath: Key, args?: T["t"][Key]) {
    // add the namespace here

    // this will add current scopes namespaces if needed
    // no namespace is not possible, so this is okay

    // this.getTranslationCacheKey(this.locale, )
    const fullyQuantified =
      (this.opts.namespace.length > 0
        ? this.opts.namespace.join(this.opts.nsSeparator) +
          this.opts.nsSeparator
        : "") + (relativePath as string);

    const cacheKey = this.locale + "_" + fullyQuantified;

    // console.log("getting full value of ", fullyQuantified, this.translateFns);
    const translateFn = this.runtime.translateFns.get(cacheKey);
    if (!translateFn) {
      console.log(
        "no translation function in",
        this.runtime.translateFns,
        "with key",
        cacheKey
      );

      // in async version we will try to load it

      // error, not found or not loaded
      // which one is it?
      const args = {
        locale: this.locale,
        namespace: [], // TODO,
        fullyResolvedPath: fullyQuantified,
      };
      this.runtime.eventHandler.handleEvent("translationNotFound", args);
      return this.runtime.formatNotFound(args);
    }

    return translateFn(args || ({} as any));
  }

  // TODO this needs a different type, as n allows intermediaries
  public async loadTranslation<Key extends T["l"][number]>(
    keyOrKeys: Key | Key[]
  ) {
    // ns is relative to the current scope!

    if (typeof keyOrKeys === "string")
      return this.loadSingleTranslation(this.locale, [
        ...this.opts.namespace,
        ...keyOrKeys.split(this.opts.nsSeparator),
      ]);

    // const realKeys = Array.isArray(keys) ? keys : [keys];

    const res = await Promise.all(
      (keyOrKeys as string[]).map((key) =>
        this.loadSingleTranslation(this.locale, [
          ...this.opts.namespace,
          ...key.split(this.opts.nsSeparator),
        ])
      )
    );
    return res.every((v) => v == true);
  }

  // loads the current namespace
  public async loadRootScopeTranslation() {
    if (!this.opts.namespace) {
      this.runtime.eventHandler.handleEvent(
        "error",
        "Must be inside a namespace to load own root scope translation."
      );
      return;
    }

    const loadRes = await this.loadSingleTranslation(
      this.locale,
      this.opts.namespace
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
    const optsCopy = structuredClone(this.opts); // this is needed to copy over namespace array!

    const newChain = new I18nChain(optsCopy, this.runtime);

    if (opts.locale) {
      // TODO this can reload everything, work in the promise
      newChain.changeLocale(opts.locale);
    }
    if (opts.namespace) {
      const parts = (opts.namespace as string).split(this.opts.nsSeparator);
      newChain.enterNamespace(parts);
    }

    // TODO can auto

    return newChain;
  }
}

// const s: I18nScope<any> = new I18nChain<any>({} as any, {} as any);

// s.
export class I18nInstance<
  T extends GenericGeneratedType = GenericGeneratedType
> extends I18nChain<T> {
  constructor(opts: I18nOpts) {
    const innerOpts = processOpts(opts);
    const eventOpts = processEventOpts(opts.events);
    const runtime: I18nRuntime = {
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

    // runtime.loader.init(innerOpts, runtime); // bad circular dependencies?

    // create new runtime too
    super(innerOpts, runtime);
  }

  // can scope only once
  // then you can still change the langs
  // its just scopes are just helpers!
  // dont allow to recursively do this,
  // as it does seem like an overcomplicated idea

  // some superspecial things
  // like ability to start a cli process?

  async loadAllTranslations(): Promise<boolean> {
    const list = await this.runtime.loader.list();

    const promises = list.map(({ locale, namespace }) =>
      this.loadSingleTranslation(locale, namespace)
    );

    const res = await Promise.all(promises);

    return res.every((v) => v == true);

    // now load them all
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
