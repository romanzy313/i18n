// import { I18nInstance } from "../../../../packages/lib/src/I18nInstance";
// import Formatter from "../../../../packages/lib/src/formatter/ICUFormatter";
// import Loader from "../../../../packages/lib/src/loader/FetchLoader";
// import Parser from "../../../../packages/lib/src/parser/JsonParser";
// import Utils from "../../../../packages/lib/src/utils/BaseUtils";
import { I18nInstance } from "@romanzy/i18n";
import Formatter from "@romanzy/i18n/formatter/ICUFormatter";
import Loader from "@romanzy/i18n/loader/FetchLoader";
import Parser from "@romanzy/i18n/parser/JsonParser";
import Utils from "@romanzy/i18n/utils/BaseUtils";

const i18n = new I18nInstance({
  locales: ["en", "ru"],
  defaultLocale: window.location.pathname.split("/")[1],
  loader: new Loader({
    baseUrl: "/locale",
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
  utils: Utils as any,
});

export default i18n;
