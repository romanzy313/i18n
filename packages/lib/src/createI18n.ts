// import type {
//   I18nOpts,
//   BackendObj,
//   InterpolationValues,
//   ReadonlyOpts,
//   I18nLoadTranslationFn,
//   I18nLoadTranslationScopedFn,
//   I18nTranslateFn,
//   I18nTranslateScopedFn,
// } from "./types";
// import { createInterpolator, getNestedKeyValue } from "./utils";

// const defaultOpts: Omit<Required<I18nOpts>, "locales" | "defaultLocale"> = {
//   defaultNs: "default",
//   nsSeparator: ":",
//   keySeparator: ".",
//   startDelimiter: "%{",
//   endDelimiter: "}",
//   backend: undefined as any,
//   onNotFound: (original, key, namespace) => original,
//   onError: (args) => `${args.errorMsg} on ${args.original}`,
//   debug: false,
// };

// const getDebugFn = (isDebug: boolean) => {
//   if (isDebug) return console;

//   return {
//     log: (...any: any[]) => {},
//     warn: (...any: any[]) => {},
//     error: (...any: any[]) => {},
//   };
// };

// export const createI18n = (createOpts: I18nOpts) => {
//   let opts: Required<I18nOpts> = { ...defaultOpts, ...createOpts } as any;
//   if (!createOpts?.defaultLocale) opts.defaultLocale = opts.locales[0];

//   let debug = getDebugFn(opts.debug);
//   let interpolator = createInterpolator(opts.startDelimiter, opts.endDelimiter);

//   const pending = new Map<string, Promise<Record<string, string>>>();
//   const loaded = new Map<string, Record<string, string | object>>();

//   let backend: BackendObj = opts.backend!;

//   // Helpter functions

//   const getSafeLang = (lang: string) => {
//     if (opts.debug && !opts.locales.includes(lang)) {
//       debug.warn(`Language ${lang} is not supported.`);
//     }
//     return opts.locales.includes(lang) ? lang : opts.defaultLocale;
//   };

//   const getCacheKey = (lang: string, ns: string) =>
//     lang + opts.nsSeparator + ns;

//   // promise void as we dont care about return type
//   const getLoadTranslationPromise = (
//     lang: string,
//     ns: string
//   ): Promise<any> => {
//     const cacheKey = getCacheKey(lang, ns);
//     if (pending.has(cacheKey)) {
//       return pending.get(cacheKey)!;
//     }

//     const loadJob = backend.load(
//       ns.replaceAll(opts.nsSeparator, "/"), // slash "/"" hardcoded for now
//       lang
//     );

//     pending.set(cacheKey, loadJob);
//     // set it into loaded
//     loadJob.then((translation) => {
//       loaded.set(cacheKey, translation);
//     });

//     return loadJob as unknown as Promise<void>;
//   };

//   const useBackend = (_backend: BackendObj) => {
//     backend = _backend;
//   };

//   /**
//    * Warning, this does not take scope into account, so scope needs to be reloaded
//    * @param changes what needs to be changed
//    */
//   const modifyOpts = (changes: Partial<I18nOpts>) => {
//     opts = { ...opts, ...changes };

//     if ("debug" in changes) debug = getDebugFn(changes.debug!);

//     if (changes.startDelimiter || changes.endDelimiter)
//       interpolator = createInterpolator(opts.startDelimiter, opts.endDelimiter);

//     if (changes.locales) {
//       console.warn("TODO, this is not working yet with autolangs");
//     }

//     // if (changes.debug)
//     //   debug = get
//   };

//   /**
//    * TODO will reload the namespaces, useful when language is changed in runtime (like in browser case)
//    * @param lang language we need to reload
//    */
//   const reloadNamespaces = (lang: string): Promise<void> => {
//     lang = getSafeLang(lang);
//     // need to move out loadNamespace out
//     const nsToLoad = new Set<string>();
//     loaded.forEach((val, fullNs) => {
//       // get the language, as it is the first key
//       const lngIndex = fullNs.indexOf(opts.nsSeparator);

//       if (lngIndex === -1) throw new Error("Panic! unknown error");
//       const ns = fullNs.substring(lngIndex + 1);
//       const desiredKey = lang + opts.nsSeparator + ns;

//       if (!loaded.has(desiredKey)) nsToLoad.add(ns);
//     });

//     debug.log(
//       "reloading translations for lang",
//       lang,
//       "namespaces are",
//       nsToLoad
//     );

//     // now turn it into an array and loadAll

//     if (nsToLoad.size === 0) return Promise.resolve();

//     const promiseMap = Array.from(nsToLoad.values()).map((ns) =>
//       getLoadTranslationPromise(lang, ns)
//     );

//     return Promise.all(promiseMap) as unknown as Promise<void>;
//   };
//   // export translate to here

//   const translate: I18nTranslateFn = (lang, t_ns_key, values?) => {
//     const nsIndex = t_ns_key.lastIndexOf(opts.nsSeparator);

//     // the default when scoped may not work!! need to do it on the outside too, to include automatically.
//     const ns = nsIndex === -1 ? opts.defaultNs : t_ns_key.substring(0, nsIndex);
//     const key = nsIndex === -1 ? t_ns_key : t_ns_key.substring(nsIndex + 1);

//     const notFoundText = () => {
//       // todo move this out
//       // if (debug)
//       //   debug.warn("translation not found", {
//       //     original: t_ns_key,
//       //     key,
//       //     namespace: ns,
//       //   });
//       return opts.onNotFound(t_ns_key, key, ns);
//     };
//     const onError = (msg: string) => {
//       // we add sideeffects here

//       if (debug)
//         debug.warn("translation failed", {
//           original: t_ns_key,
//           key,
//           namespace: ns,
//           errorMsg: msg,
//         });
//       return opts.onError({
//         original: t_ns_key,
//         key,
//         namespace: ns,
//         errorMsg: msg,
//       });
//     };

//     const cacheKey = getCacheKey(lang, ns);

//     if (!loaded.has(cacheKey)) {
//       debug.warn("namespace", ns, "is not loaded");
//       return notFoundText();
//     }
//     const translation = loaded.get(cacheKey);

//     if (!translation) {
//       debug.warn("key", key, "in namespace", ns, "was not found");
//       return notFoundText();
//     }

//     const val = getNestedKeyValue(translation, key, opts.keySeparator);

//     if (typeof val === "undefined") {
//       debug.warn("key", key, "in namespace", ns, "was not found");
//       return notFoundText();
//     }

//     if (typeof val === "string") {
//       if (values) {
//         return interpolator(val, values);
//       }

//       return val;
//     } else if (typeof val === "object") {
//       if (
//         !values ||
//         !("count" in values) ||
//         typeof values["count"] !== "number"
//       ) {
//         return onError(`pluralization no count`);
//       }
//       // special zero case
//       const count = values.count;

//       const pluralizer = new Intl.PluralRules(lang, {
//         // type: "cardinal" | "ordinal" how to
//       });
//       const pluralType =
//         count === 0 && "zero" in val ? "zero" : pluralizer.select(count);

//       // console.log("plural type is", pluralType);

//       const template = val[pluralType];

//       if (!template || typeof template !== "string") {
//         return onError(`pluralization type ${pluralType} not defined`);
//       }

//       return interpolator(template, values);
//     }

//     debug.error("key", key, "in namespace", ns, "has a wrong type");
//     return notFoundText();
//   };

//   const translateArray = (
//     lang: string,
//     keys: string[]
//   ): Record<string, string> => {
//     const res: Record<string, string> = {};
//     keys.forEach((key) => {
//       res[key] = translate(lang, key);
//     });

//     return res;
//   };

//   const loadTranslation: I18nLoadTranslationFn = async (lang, namespace) => {
//     if (!backend) {
//       debug.error("No backend defined to ensure namespace is loaded");
//       return Promise.resolve();
//     }

//     lang = getSafeLang(lang);

//     if (Array.isArray(namespace)) {
//       await Promise.all(
//         namespace.map((ns) => getLoadTranslationPromise(lang, ns))
//       );
//     } else {
//       await getLoadTranslationPromise(lang, namespace);
//     }
//   };

//   const addTranslation = (lang: string, ns: string, content: any) => {
//     const cacheKey = getCacheKey(lang, ns);
//     if (loaded.has(cacheKey)) {
//       // debug.warn(
//       //   "manual translation for lang",
//       //   lang,
//       //   "and namespace",
//       //   ns,
//       //   "is already set!"
//       // );
//       return;
//     }

//     loaded.set(cacheKey, content);
//   };

//   // now here I can scope it?

//   // todo should return another make scope!
//   const makeScope = (lang: string, parentNs?: string) => {
//     // now this just does thouse two
//     lang = getSafeLang(lang);
//     const scopedT: I18nTranslateScopedFn = (t_ns_key, values?) => {
//       // here we add the parent scope + optional default!!
//       if (!t_ns_key.includes(opts.nsSeparator) && !parentNs)
//         t_ns_key = opts.defaultNs + opts.nsSeparator + t_ns_key;

//       if (parentNs) t_ns_key = parentNs + opts.nsSeparator + t_ns_key;

//       return translate(lang, t_ns_key, values);
//     };

//     // same can be done for load behavior

//     const scopedLoad: I18nLoadTranslationScopedFn = (namespace?) => {
//       let parentNsPrefix = "";
//       if (namespace === undefined && parentNs !== undefined) {
//         //meaning we just want to load parent
//         // TODO test this
//         namespace = parentNs;
//       } else if (parentNs) {
//         parentNsPrefix = parentNs + opts.nsSeparator;
//       }

//       if (namespace === undefined) {
//         throw new Error("please either define parentNs or this namespace");
//       }

//       const namespaces = Array.isArray(namespace)
//         ? namespace.map((ns) => `${parentNsPrefix}${ns}`)
//         : `${parentNsPrefix}${namespace}`;

//       return loadTranslation(lang, namespaces);
//     };

//     return {
//       t: scopedT,
//       translate: scopedT,
//       loadTranslation: scopedLoad,
//       // loadNamespace: scopedLoad,
//     };
//   };

//   return {
//     t: translate,
//     tA: translateArray,
//     translate,
//     translateArray,
//     loadTranslation,
//     // loadNamespace: loadTranslation,
//     makeScope,
//     useBackend,
//     modifyOpts,
//     opts: opts as ReadonlyOpts,
//     reloadNamespaces,
//     addTranslation,
//   };
// };
export {};
