import { beforeEach, describe, expect, test } from "vitest";

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

export interface TestGeneratedType extends GenericGeneratedType {
  t: {} & DefaultTranslation["keys"] & NestedTranslation["keys"];
  n: {
    default: {
      t: DefaultTranslation["def"];
      n: {};
      l: [];
    };
    "hello:nested": {
      t: NestedTranslation["def"];
      n: {};
      l: [];
    };
  };
  l: ["default", "hello:nested"];
}

let i18n: I18nInstance<TestGeneratedType>;

beforeEach(() => {
  i18n = new I18nInstance<TestGeneratedType>({
    locales: ["en", "ru"],
    fallbackLocale: "en",
    loader: new MemLoader({
      en: {
        default: MemLoader.translation({
          yes: "yeees",
          no: "no",
          photos: `You have {count, plural,
                  =0 {no photos.}
                  =1 {1 photo.}
                  other {# photos.}
                }`,
        }),
        hello: {
          nested: MemLoader.translation({
            namespace: {
              key: "hello",
            },
          }),
        },
      },
      ru: {
        default: MemLoader.translation({
          yes: "да",
          no: "нет",
          // this is incorrect actually
          photos: `Вы имеете {count, plural,
                  =0 {nothing.}
                  =1 {1 книга.}
                  other {# книг.}
                }`,
        }),
        hello: {
          nested: MemLoader.translation({
            namespace: {
              key: "привет",
            },
          }),
        },
      },
    }),
    formatter: new ICUFormatter(),
    parser: new JsonParser(),
  });
});

describe("i18n", () => {
  test("parses user input", () => {
    expect(i18n.parseUserInputKey("hello:world.subkey")).toEqual({
      key: ["world", "subkey"],
      namespace: ["hello"],
    });

    expect(i18n.parseUserInputKey("world.subkey")).toEqual({
      key: ["world", "subkey"],
      namespace: [],
    });
  });
  test("memloader lists properly", async () => {
    const res = await i18n.runtime.loader.list();

    expect(res.length).toBe(4);
    expect(res).toContainEqual({
      locale: "en",
      namespace: ["hello", "nested"],
    });
  });

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

    await i18n.loadTranslation("hello:nested");

    expect(i18n.t("hello:nested:namespace.key")).toBe("hello");

    // @ts-expect-error
    expect(defScope.t("bad")).toBe("not found");

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
    const defScope = i18n.getSubI18n({
      // this should autoload it??
      namespace: "default",
    });
    await defScope.loadRootScopeTranslation();
    expect(defScope.t("yes")).toBe("yeees");

    defScope.changeLocale("ru");
    await defScope.loadRootScopeTranslation();
    expect(defScope.t("yes")).toBe("да");
  });
});
