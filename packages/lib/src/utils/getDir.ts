// chatgippity functions
// sadly no built-in methods

export function getDir(localeCode: string) {
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

export function getDir2(localeCode: string) {
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
