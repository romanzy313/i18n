import { I18nInstance } from "@romanzy/i18n";
import Formatter from "@romanzy/i18n/formatter/ICUFormatter";
import Loader from "@romanzy/i18n/loader/NodeFsLoader";
import Parser from "@romanzy/i18n/parser/JsonParser";
import Utils from "@romanzy/i18n/utils/BaseUtils";

const i18n = new I18nInstance({
  locales: ["en", "ru"],
  fallbackLocale: "en",
  loader: new Loader({
    folder: "public/locale",
  }),
  formatter: new Formatter(),
  parser: new Parser(),
  formatNotFound: ({ fullyResolvedPath }) =>
    `*** NOT FOUND ${fullyResolvedPath} ***`,
  events: {
    translationNotFound: ({ locale, namespace }) => {
      console.log("missing translation for", locale, "in", namespace);
    }, // supress it
  },
  utils: Utils,
});

export default i18n;
