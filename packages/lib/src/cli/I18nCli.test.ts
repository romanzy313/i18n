import { beforeEach, describe, expect, expectTypeOf, test } from "vitest";

import { I18nInstance } from "../I18nInstance";
import MemLoader from "../loader/MemLoader";
import ICUFormatter from "../formatter/ICUFormatter";
import JsonParser from "../parser/JsonParser";
import I18nCli from "./I18nCli";
// import type { TestTypes } from "../gen/TestTypes";

let i18n: I18nInstance<any>;
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

  i18n = new I18nInstance<any>({
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

    expect(val).toStrictEqual(`export type TestTypeGen = {
	"default:yes": {}
	"default:no": {}
	"default:photos": {
		"count": number
	}
	"hello:nested.key": {}
}
export default TestTypeGen;`);

    // TODO dont flush
    await cli.flushToDisk(val);

    // lets try it, works nice!

    // // now test the types, it wont work right away?
    // await i18n.loadTranslation("default"); // this can also be typed... but how can I inherit it?? typeofs?

    // const scoped = i18n.getSubI18n({
    //   namespace: "default", // this should be autocompleted
    // });
    // const res = scoped.t("default:no");

    // const typedResult = i18n.t("default:photos", {
    //   count: 4,
    // });
    // expect(typedResult).toBe("You have 4 photos.");
  });

  test.todo("typedef is correct", () => {
    // expectTypeOf(i18n).parameter(0).toMatchTypeOf<{ name: string }>();
  });
});
