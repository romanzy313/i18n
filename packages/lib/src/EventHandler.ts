import { I18nError } from "./I18nError";

export interface NotFoundArgs {
  locale: string;
  namespace: string[];
  fullyResolvedPath: string;
}

export interface I18nEvents {
  translationNotFound: (args: NotFoundArgs) => void; // return the formatted value
  loadFailure: (args: {
    targetObj: string;
    operation: "load" | "parse" | "format"; // where the error happened
    reason?: string; // more explanation if needed
  }) => void;
  badLocale: (args: { locale: string }) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  debug: (message: string) => void;
}

// export type I18nEventOptions = Partial<{
//   [key in keyof I18nEvents as `on${Capitalize<key>}`]: I18nEvents[key];
// }>;
export type I18nEventOptions = Partial<{
  [key in keyof I18nEvents]: I18nEvents[key];
}>;

export class I18nEventHandler {
  // have defaults in here
  public eventCache = new Set<string>();

  // , private notFoundFormatter: (args: NotFoundArgs) => string
  constructor(private handler: I18nEvents) {}

  // this can have its own set
  // why go to the map?
  //
  private getCacheKey<Key extends keyof I18nEvents>(
    type: Key,
    value: Parameters<I18nEvents[Key]>[0]
  ): string | null {
    if (type == "error") {
      return value as string;
    } else if (type == "translationNotFound")
      // @ts-expect-error // ugh
      return `not_found:${value.fullyResolvedPath}`;
    else if (type == "loadFailure")
      // @ts-expect-error // ugh
      return `${value.operation}_${value.targetObj}`;
    else if (type == "badLocale")
      // @ts-expect-error // ugh
      return `bad_locale:${value.locale}`;

    return null;
  }
  //   handleEvent<Type extends keyof I18nEvents>(tt: inferType<Type>) {
  handleEvent<Key extends keyof I18nEvents>(
    type: Key,
    value: Parameters<I18nEvents[Key]>[0]
  ): void {
    // so now we need to take this and get the cache key

    // if (data.type == "debug") return;

    const cacheKey = this.getCacheKey(type, value);

    if (!cacheKey) throw new Error("cannot handle event, more info TODO"); // TODO

    if (this.eventCache.has(cacheKey)) return;

    // console.log("handling event with cache key", cacheKey);

    // the handler below deals with all sideeffects, by default hardcoded to console.logs
    // @ts-expect-error
    this.handler[type](value);

    // like doing a console log
    this.eventCache.add(cacheKey);
  }

  handleError(err: I18nError) {
    const cacheKey = this.getCacheKey(err.type, err.data);

    if (!cacheKey) throw new Error("cannot handle event, more info TODO"); // TODO

    if (this.eventCache.has(cacheKey)) return;
    // @ts-expect-error
    this.handler[type](value);

    // like doing a console log

    this.eventCache.add(cacheKey);
  }
}
