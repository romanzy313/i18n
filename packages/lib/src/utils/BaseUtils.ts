// i want easy extension though

import { UtilContext, UtilDefinition } from "./types";

export default class BaseUtils implements UtilDefinition {
  [key: string]: (firstArg: UtilContext, ...restArgs: any[]) => any;

  // TODO gotta implement them all
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl
  // Intl.RelativeTimeFormat
  // Intl.ListFormat

  displayNames(
    ctx: UtilContext,
    options: Intl.DisplayNamesOptions
  ): Intl.DisplayNames {
    return new Intl.DisplayNames(ctx.locale, options);
  }

  // these are cached by their use
  dateTimeFormat(ctx: UtilContext): Intl.DateTimeFormat {
    return new Intl.DateTimeFormat(ctx.locale);
  }

  numberFormat(
    ctx: UtilContext,
    options: Intl.DisplayNamesOptions
  ): Intl.NumberFormat {
    return new Intl.NumberFormat(ctx.locale, options);
  }

  dir(ctx: UtilContext): string {
    return getLocaleDirection(ctx.locale);
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

// function getLocaleDirection2(localeCode: string) {
//   try {
//     // Create a Locale object using the provided locale code
//     const locale = new Intl.Locale(localeCode);

//     // Check the default numbering system for the locale
//     const numberingSystem = locale.numberingSystem;

//     // If the numbering system is Arabic, it's likely RTL
//     if (numberingSystem === "arab") {
//       return "rtl";
//     } else {
//       return "ltr";
//     }
//   } catch (error) {
//     // Handle invalid locale codes or errors
//     console.error(`Invalid locale code: ${localeCode}`);
//     return "ltr"; // Default to LTR in case of errors or invalid input
//   }
// }
