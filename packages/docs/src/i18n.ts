import { I18nInstance } from "@romanzy/i18n";
import ICUFormatter from "@romanzy/i18n/src/formatter/ICUFormatter";
import NodeFsLoader from "@romanzy/i18n/src/loader/NodeFsLoader";
import JsonParser from "@romanzy/i18n/src/parser/JsonParser";

const i18n = new I18nInstance<any>({
  locales: ["en", "ru"],
  fallbackLocale: "en",
  loader: new NodeFsLoader({
    folder: "public/locale",
  }),
  formatter: new ICUFormatter(),
  parser: new JsonParser(),
  formatNotFound: ({ fullyResolvedPath }) =>
    `*** NOT FOUND ${fullyResolvedPath} ***`,
  events: {
    translationNotFound: ({ locale, namespace }) => {
      console.log("missing translation for", locale, "in", namespace);
    }, // supress it
  },
});

export default i18n;
