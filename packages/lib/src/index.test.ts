import { beforeEach, afterEach, describe, expect, test, vi } from "vitest";

import { I18nInstance } from "./I18nInstance";
import MemLoader from "./loader/MemLoader";
import ICUFormatter from "./formatter/ICUFormatter";
import JsonParser from "./parser/JsonParser";
import { CompositeKeyDef, GenericGeneratedType } from ".";

type DefaultTranslation = CompositeKeyDef<
  "default",
  {
    yes: {};
    no: {};
    photos: {
      count: number;
    };
  }
>;

type NestedTranslation = CompositeKeyDef<
  "hello:nested",
  {
    "namespace.key": {};
  }
>;

// export interface TestGeneratedType extends GenericGeneratedType {
//   t: {} & DefaultTranslation["keys"] & NestedTranslation["keys"];
//   n: {
//     default: {
//       t: DefaultTranslation["def"];
//       n: {};
//       l: [];
//     };
//     "hello:nested": {
//       t: NestedTranslation["def"];
//       n: {};
//       l: [];
//     };
//   };
//   l: ["default", "hello:nested"];
// }

export type TestGeneratedType = any;

let i18n: I18nInstance<TestGeneratedType>;
let notFound = vi.fn();
// loader.register("en", translation or () => translation or async () => translation)

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
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("i18n", () => {
  test("basic use cases", async () => {
    // english is default
    // await i18n.loadTranslation("default");
    const defScope = i18n.getSubI18n({
      // this should autoload it??
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

    // load nested

    await i18n.loadTranslation("hello");

    expect(i18n.t("hello:nested.key")).toBe("hello");

    expect(defScope.t("bad")).toBe("***not found***");

    expect(notFound).toBeCalledTimes(1);
    // create new scope
    const ruScope = i18n.getSubI18n({
      // this should autoload it??
      locale: "ru",
      namespace: "default",
    });

    await ruScope.loadRootScopeTranslation();

    expect(ruScope.t("yes")).toBe("да");
  });

  test("changing option on the scope directly", async () => {
    notFound();
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

  test("memloader lists properly", async () => {
    const res = await i18n.runtime.loader.list();

    expect(res.length).toBe(4);

    // this can be flakey?
    expect(res).toContainEqual({
      extension: "",
      locale: "en",
      namespace: "hello",
    });
  });
});
