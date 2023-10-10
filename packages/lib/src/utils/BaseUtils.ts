// i want easy extension though

import { I18nRuntime, InnerI18nOpts } from "..";

export type I18nUtils<T extends BaseUtils> = Omit<T, "clone">;

// idea is that your own utils appear there
// maybe they have full access to the options and runtime?

export default class BaseUtils {
  protected locale: string = "";
  protected opts!: InnerI18nOpts;
  protected runtime!: I18nRuntime;

  // TODO gotta implement them all
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl
  // Intl.RelativeTimeFormat
  // Intl.ListFormat

  displayNames(options: Intl.DisplayNamesOptions): Intl.DisplayNames {
    return new Intl.DisplayNames(this.locale, options);
  }

  // these are cached by their use
  dateTimeFormat(): Intl.DateTimeFormat {
    return new Intl.DateTimeFormat(this.locale);
  }

  numberFormat(options: Intl.DisplayNamesOptions): Intl.NumberFormat {
    return new Intl.NumberFormat(this.locale, options);
  }

  clone(newLocale: string, opts: InnerI18nOpts, runtime: I18nRuntime): this {
    if (this.locale == newLocale) return this; // just give itself back

    if (!this.opts) this.opts = opts;

    if (!this.runtime) this.runtime = runtime;

    const clonedInstance: this = Object.create(Object.getPrototypeOf(this));
    Object.assign(clonedInstance, this);

    clonedInstance.locale = newLocale;

    return clonedInstance;
  }

  get dir(): string {
    return getLocaleDirection(this.locale);
  }
}

// TODO is there really no standarized built-in way?
function getLocaleDirection(localeCode: string) {
  // List of RTL (Right-to-Left) languages
  const rtlLanguages = ["ar", "he", "fa", "ur", "ps", "sd", "ckb"];

  // Extract the primary language code (e.g., "en" from "en-US")
  const primaryLanguageCode = localeCode.split("-")[0];

  // Check if the primary language code is in the RTL languages list
  if (rtlLanguages.includes(primaryLanguageCode)) {
    return "rtl";
  } else {
    return "ltr";
  }
}

function getLocaleDirection2(localeCode: string) {
  try {
    // Create a Locale object using the provided locale code
    const locale = new Intl.Locale(localeCode);

    // Check the default numbering system for the locale
    const numberingSystem = locale.numberingSystem;

    // If the numbering system is Arabic, it's likely RTL
    if (numberingSystem === "arab") {
      return "rtl";
    } else {
      return "ltr";
    }
  } catch (error) {
    // Handle invalid locale codes or errors
    console.error(`Invalid locale code: ${localeCode}`);
    return "ltr"; // Default to LTR in case of errors or invalid input
  }
}
