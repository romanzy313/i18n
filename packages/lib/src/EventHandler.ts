import { I18nError } from "./I18nError";

export interface NotFoundArgs {
  locale: string;
  namespace: string;
  fullyResolvedPath: string;
}

export interface I18nEvents {
  translationNotFound: (args: NotFoundArgs) => void; // return the formatted value
  loadFailure: (args: {
    targetObj: {
      locale: string;
      namespace: string;
      extension: string;
    };
    operation: "load" | "parse" | "format"; // where the error happened
    reason?: string; // more explanation if needed
  }) => void;
  badLocale: (args: { locale: string }) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  debug: (message: string) => void;
}

export type I18nEventOptions = Partial<{
  [key in keyof I18nEvents]: I18nEvents[key];
}>;

export class I18nEventHandler {
  // have defaults in here
  public eventCache = new Set<string>();

  // , private notFoundFormatter: (args: NotFoundArgs) => string
  constructor(private handler: I18nEvents) {}

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
  handleEvent<Key extends keyof I18nEvents>(
    type: Key,
    value: Parameters<I18nEvents[Key]>[0]
  ): void {
    const cacheKey = this.getCacheKey(type, value);

    if (!cacheKey) throw new Error("cannot handle event, more info TODO"); // TODO

    if (this.eventCache.has(cacheKey)) return;

    console.log("handling event of type", type, "with value", value);

    // the handler below deals with all sideeffects, by default hardcoded to console.logs
    // @ts-expect-error
    this.handler[type](value);

    this.eventCache.add(cacheKey);
  }

  handleError(err: I18nError | Error) {
    if (err.name !== "I18nError") {
      this.handler.error(err.message);
      return;
    }
    const cacheKey = this.getCacheKey(
      (err as I18nError).type,
      (err as I18nError).data
    );

    if (!cacheKey) {
      console.log("unknown error", err);
      return;
    }

    if (this.eventCache.has(cacheKey)) return;
    // @ts-expect-error
    this.handler[type](value);

    this.eventCache.add(cacheKey);
  }
}
