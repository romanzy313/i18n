import { beforeEach, afterEach, describe, expect, test, vi } from "vitest";

import { I18nInstance } from "./I18nInstance";
import MemLoader from "./loader/MemLoader";
import ICUFormatter from "./formatter/ICUFormatter";
import JsonParser from "./parser/JsonParser";
import BaseUtils from "./utils/BaseUtils";

export type TestGeneratedType = any;

let i18n: I18nInstance<TestGeneratedType>;
let notFound = vi.fn();

beforeEach(() => {
  // notFound = vi.fn()
  const loader = new MemLoader();
  loader.register("en", "default", {
    yes: "yeees",
    no: "no",
    photos: `You have {count, plural,
                  =0 {no photos.}
                  =1 {1 photo.}
                  other {# photos.}
                }`,
  });
  loader.register("en", "hello", () =>
    Promise.resolve({
      nested: {
        key: "hello",
      },
    })
  );
  loader.registerMany("ru", {
    default: {
      yes: "да",
      no: "нет",
      // this is incorrect actually
      photos: `Вы имеете {count, plural,
                  =0 {nothing.}
                  =1 {1 книга.}
                  other {# книг.}
                }`,
    },
    hello: {
      nested: {
        key: "привет",
      },
    },
  });

  i18n = new I18nInstance<TestGeneratedType>({
    locales: ["en", "ru"],
    fallbackLocale: "en",
    loader,
    formatter: new ICUFormatter(),
    parser: new JsonParser(),
    formatNotFound: () => "***not found***",
    events: {
      translationNotFound: notFound, // remove console logging of missing translations
    },
    utils: new BaseUtils(),
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("i18n", () => {
  test("basic use cases", async () => {
    const defScope = i18n.getSubI18n({
      namespace: "default",
    });
    await defScope.loadRootScopeTranslation();

    expect(defScope.t("yes")).toBe("yeees");
    expect(
      defScope.t("photos", {
        count: 0,
      })
    ).toBe("You have no photos.");
    expect(
      defScope.t("photos", {
        count: 4,
      })
    ).toBe("You have 4 photos.");

    // load nested keys

    await i18n.loadTranslation("hello");

    expect(i18n.t("hello:nested.key")).toBe("hello");

    expect(defScope.t("bad")).toBe("***not found***");

    expect(notFound).toBeCalledTimes(1);

    const ruScope = i18n.getSubI18n({
      locale: "ru",
      namespace: "default",
    });

    await ruScope.loadRootScopeTranslation();

    expect(ruScope.t("yes")).toBe("да");
  });

  test("getting sub i18n", async () => {
    const defScope = i18n.getSubI18n({
      // this should autoload it??
      namespace: "default",
    });
    await defScope.loadRootScopeTranslation();
    expect(defScope.t("yes")).toBe("yeees");

    defScope.setLocale("ru");
    await defScope.loadRootScopeTranslation();
    expect(defScope.t("yes")).toBe("да");
  });

  test("change locale and reload", async () => {
    i18n.setLocale("en");
    await i18n.loadTranslations(["hello", "default"]);

    expect(i18n.t_locale("en", "default:no")).toBe("no");
    expect(i18n.t_locale("en", "hello:nested.key")).toBe("hello");
    expect(i18n.t_locale("ru", "default:no")).toBe("***not found***");

    await i18n.changeLocaleAndReloadTranslations("ru");
    expect(i18n.t_locale("ru", "default:no")).toBe("нет");
    expect(i18n.t_locale("ru", "hello:nested.key")).toBe("привет");
  });

  test("loads all translations", async () => {
    const ok = await i18n.loadAllTranslations();
    expect(ok).toBe(true);

    expect(i18n.t_locale("en", "default:no")).toBe("no");
    expect(i18n.t_locale("ru", "hello:nested.key")).toBe("привет");
  });

  test("utils", async () => {
    i18n.setLocale("en");
    const numberFormatter = i18n.utils.numberFormat({
      type: "currency",
    });

    expect(numberFormatter.format(1_000_000.5)).toBe("1,000,000.5"); // english format

    const ru = i18n.getSubI18n({
      locale: "ru",
    });

    const rusFormat = ru.utils
      .numberFormat({
        type: "currency",
      })
      .format(1_000_000.5); // russian format

    // unicode wierdness https://stackoverflow.com/questions/54242039/intl-numberformat-space-character-does-not-match
    expect(rusFormat).toEqual("1\xa0000\xa0000,5");
  });
});
