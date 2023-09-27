import { beforeEach, describe, expect, test } from "vitest";
import { makeMinDeinterpolator, makePathDeinterpolator } from "./internalUtils";

// import { I18nInstance } from "./I18nInstance";
// import MemLoader from "./loader/MemLoader";
// import ICUFormatter from "./formatter/ICUFormatter";
// import JsonParser from "./parser/JsonParser";
// import { CompositeKeyDef, GenericGeneratedType } from ".";

describe("internal utils", () => {
  test("path deinterpolator with extension", () => {
    const template = "public/locale";
    const deinterp = makePathDeinterpolator(template, "/");

    // Test the regex with a sample string
    const inputString =
      "whatevereverywhere/public/locale/ru/this/is/namespace.json";
    const res = deinterp(inputString);

    expect(res).toStrictEqual({
      locale: "ru",
      namespace: ["this", "is", "namespace"],
      extension: "json",
    });
  });

  test("path deinterpolator without extension", () => {
    const template = "public/locale";
    const deinterp = makePathDeinterpolator(template, "/");

    // Test the regex with a sample string
    const inputString = "whatevereverywhere/public/locale/ru/this/is/namespace";
    const res = deinterp(inputString);

    expect(res).toStrictEqual({
      locale: "ru",
      namespace: ["this", "is", "namespace"],
      extension: "",
    });
  });

  test("handles errors", () => {
    const deinterp = makePathDeinterpolator("public/locale", "/");

    // Test the regex with a sample string
    const res1 = deinterp("badbad/locale/ru/this/is/namespace");
    expect(res1).toStrictEqual(null);

    const res2 = deinterp("irrelevant");
    expect(res2).toStrictEqual(null);

    const res3 = deinterp("public/locale/en");
    expect(res3).toStrictEqual(null);
  });

  test("min interpolator", () => {
    const deinterp = makeMinDeinterpolator("/");

    // Test the regex with a sample string
    const res1 = deinterp("ru");
    expect(res1).toStrictEqual(null);

    const res2 = deinterp("ru/translation.json");
    expect(res2).toStrictEqual({
      locale: "ru",
      namespace: ["translation"],
      extension: "json",
    });
  });
});

// if (match) {
//   console.log("MATCH RESULT IS", match);

//   console.log("Matched variables:");

//   variableNames.forEach((name, index) => {
//     console.log(`${name}: ${match[index + 1]}`);
//   });
// } else {
//   console.log("No match found.");
// }