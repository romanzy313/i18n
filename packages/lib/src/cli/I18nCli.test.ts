import { beforeEach, describe, expect, test } from "vitest";

import { I18nInstance } from "../I18nInstance";
import MemLoader from "../loader/MemLoader";
import ICUFormatter from "../formatter/ICUFormatter";
import JsonParser from "../parser/JsonParser";
import I18nCli from "./I18nCli";
import { TestTypeGen } from "./TestTypeGen";

// TODO try expectTypeOf,

let i18n: I18nInstance<TestTypeGen>;
let cli: I18nCli;

beforeEach(() => {
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

  i18n = new I18nInstance<TestTypeGen>({
    locales: ["en", "ru"],
    fallbackLocale: "en",
    nsSeparator: ":",
    keySeparator: ".",
    loader,
    formatter: new ICUFormatter(),
    parser: new JsonParser(),
  });

  cli = new I18nCli(i18n, {
    name: "TestTypeGen",
    writeFolder: "./src/cli",
  });
});

describe("i18n", () => {
  test.todo("type test", () => {
    // TODO vite typechecking of the TestTypes (after its been generated above)
    // test actual usage, that it stricktly types them
  });
  test("type generation", async () => {
    const val = await cli.generateTypes();

    console.log("generated type", val);

    // TODO dont flush
    await cli.flushToDisk(val);

    expect(val).toContain("DO NOT MODIFY");

    // check the main type
    expect(val).toContain(`export type TestTypeGen = {
  "this": {
    [key in keyof Default as \`default:\${key}\`]: Default[key]
  } & {
    [key in keyof Hello as \`hello:\${key}\`]: Hello[key]
  };
  "others": {
    "default": Default;
    "hello": Hello;
  };
}`);
    // base subtype
    expect(val).toContain(`export type Default = {
  "yes": {};
  "no": {};
  "photos": {
    "count": number;
  };
}`);

    // and nested key
    expect(val).toContain(`export type Hello = {
  "nested.key": {};
}`);

    // just validation that types are accepted

    await i18n.loadTranslation("default");
    i18n.t("default:photos", {
      count: 4,
    });

    const res = i18n.getSubI18n({ namespace: "default" }).t("photos", {
      count: 33,
    });

    expect(res).toBe("You have 33 photos.");
  });

  test("typedef is correct", () => {
    // expectTypeOf(i18n.t).parameter(0).toMatchTypeOf<{ name: string }>();
  });
});
