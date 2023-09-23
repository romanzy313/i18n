import { beforeEach, describe, expect, test } from "vitest";

import { I18nInstance } from "../I18nInstance";
import MemLoader from "../loader/MemLoader";
import ICUFormatter from "../formatter/ICUFormatter";
import JsonParser from "../parser/JsonParser";
import I18nCli from "./I18nCli";
// import type { TestTypes } from "../gen/TestTypes";
import { TestChain, TestGen2 } from "./typeTests";

let i18n: I18nInstance<any>;
let cli: I18nCli;

beforeEach(() => {
  i18n = new I18nInstance<any>({
    locales: ["en", "ru"],
    fallbackLocale: "en",
    nsSeparator: ":",
    keySeparator: ".",
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

  cli = new I18nCli(i18n, {
    name: "TestTypes",
    writeFolder: "./src/gen",
  });
});

describe("i18n", () => {
  test("type test", () => {
    const root = new TestChain<TestGen2>();
    root.locale = "en";

    const gRes = root.t("ns1:hello", {
      name: "bob",
    });

    root.loadNs("ns1");

    const ns1Root = root.getSubI18n({
      ns: "ns1",
      locale: "ru",
    });

    ns1Root.loadNs("ns2");

    root.loadNs(["ns1", "ns1:ns2"]);

    const ans1 = ns1Root.t("hello", {
      name: "alex",
    });
    // ns1Res.t("hello", {})
    const ans2 = ns1Root.t("world");

    // TODO can do vitest type checking

    console.log(gRes);
    console.log(ans1);
    console.log(ans2);

    expect(true).toBe(true);
  });
  test("type generation", async () => {
    const val = await cli.generateTypes();
    console.log("Generated type:\n", val);

    // dont flush
    await cli.flushToDisk(val);

    // lets try it, works nice!

    // now how with scopes
    await i18n.loadTranslation("default"); // this can also be typed... but how can I inherit it?? typeofs?

    const scoped = i18n.getSubI18n({
      namespace: "default", // this should be autocompleted
    });
    const res = scoped.t("default:no");

    console.log("RES", res);

    const typedResult = i18n.t("default:photos", {
      count: 4,
    });
    expect(typedResult).toBe("You have 4 photos.");
  });
});
