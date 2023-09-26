// this is the core class

import {
  ErrorArgs,
  GenericGeneratedType,
  NestedRawTranslations,
  TArgs,
} from ".";
import Cache from "./Cache";
import { I18nEventHandler, I18nEventOptions, I18nEvents } from "./EventHandler";
import { I18nError } from "./I18nError";
import { BaseFormatter, FormatTranslation } from "./formatter/BaseFormatter";
import { BaseLoader, LoadResult } from "./loader/BaseLoader";
import BaseParser from "./parser/BaseParser";

// import { I18nOpts } from ".";

// I want something to talk about levels

type DebugArg =
  | {
      info?: boolean | ((...any: any[]) => void);
      warn?: boolean | ((...any: any[]) => void);
      error?: boolean | ((...any: any[]) => void);
    }
  | boolean;

// different optionalities
// inner one always gives the needed values
// just a type difference between them

// cache is its own class
export type I18nRuntime = {
  // loaded: Map<any,any>,
  loader: BaseLoader;
  parser: BaseParser;
  formatter: BaseFormatter;
  eventHandler: I18nEventHandler;

  // triggerEvent:
  //   | {
  //       onNotFound?: (args: ErrorArgs) => string;
  //       // when actual error happens, how to format it. This is used together with the debug functionality
  //     }
  //   | any;
  loading: Map<string, Promise<boolean>>;
  loaded: Set<string>; //
  eventCache: Set<string>;
  // other opts like failed to load or etc...

  // format opts here
  // formatLog?: (args: ErrorArgs) => string | null;
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
  /** Namespace to use if no namespace is provided */
  locales: string[];

  fallbackLocale: string;

  // what to initialize this. if not provided fallback locale is used
  currentLocale?: string;

  // various formatter things with good default
  nsSeparator?: string;
  keySeparator?: string;
  startDelimiter?: string;
  endDelimiter?: string;
  events?: I18nEventOptions;
  // we load them with loader
  loader: BaseLoader;
  parser: BaseParser;
  // like this, use this https://formatjs.io/docs/icu-messageformat-parser
  formatter: BaseFormatter;

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

//
// export type GetI18nOpts = {
//   locale?: string;
//   namespace?: string; // like enter subnamespaces, can use ../ to go up... use path for this... like instead of :
//   // so it can be /anketa/forms
//   // or forms
// };

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

class I18nChain<T extends GenericGeneratedType> {
  public opts: InnerI18nOpts; // public for now
  public runtime: I18nRuntime; // public for now

  private translateFns = new Map<string, FormatTranslation>();

  constructor(opts: InnerI18nOpts, runtime: I18nRuntime) {
    this.opts = opts;
    this.runtime = runtime;
  }

  get locale(): string {
    return this.opts.locale;
  }

  get currentNamespace(): string {
    return this.opts.namespace.join(this.opts.nsSeparator);
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

  private processEvent(name: string, value: any) {
    // this will do event processing, pretty important
  }

  private getTranslationCacheKey(locale: string, fullNamespace: string[]) {
    return `${locale}_${fullNamespace.join(":")}`;
  }

  private getSafeLocale(locale: string) {
    const isOk = this.opts.locales.includes(locale);
    if (!isOk) {
      // error event
      console.warn(`Language ${locale} is not supported.`);
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
        this.translateFns.set(
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
      // return its completion result
      return this.runtime.loading.get(cacheKey)!;
    }
    // if (this.runtime.loader.loaded)
    // const locale = this.opts.locale;
    // const namespace = relativeNamespace.split(this.opts.nsSeparator); // namespace here is absolute!

    // loader throws for the error

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
        // it will never throw
        // but it would be nice if modules can return errors!
        .catch((err: any) => {
          // log that it fails

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
    const translateFn = this.translateFns.get(cacheKey);
    if (!translateFn) {
      // in async version we will try to load it

      // error, not found or not loaded
      // which one is it?
      this.runtime.eventHandler.handleEvent("translationNotFound", {
        locale: this.locale,
        namespace: [], // TODO,
        fullyResolvedPath: fullyQuantified,
      });
      // console.warn(`Translation not found: "${fullyQuantified}".`);

      // this is done via log
      // log returns the data too?
      // return this.runtime.log

      return "not found"; // with a formatter
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
    if (!this.opts.namespace)
      throw new Error(
        "Must be inside a namespace to load own root scope translation."
      );

    const loadRes = await this.loadSingleTranslation(
      this.locale,
      this.opts.namespace
    );

    return loadRes;
    // const path = this.opts.namespace.join(this.opts.nsSeparator);
    // return this.loadTranslation(path);
  }

  public getSubI18n<Key extends keyof T["n"]>(opts: {
    locale: string;
    namespace: Key;
  }): I18nChain<T["n"][typeof opts.namespace]>;
  public getSubI18n<Key extends keyof T["n"]>(opts: {
    namespace: Key;
  }): I18nChain<T["n"][typeof opts.namespace]>;
  public getSubI18n<Key extends keyof T["n"]>(opts: {
    locale: string;
  }): I18nChain<T>;
  public getSubI18n<Key extends keyof T["n"]>(opts: {
    locale?: string;
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
