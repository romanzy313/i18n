import { describe, expect, test } from "vitest";
import { makeMinDeinterpolator } from "./internalUtils";

describe("internal utils", () => {
  test("min interpolator", () => {
    const deinterp = makeMinDeinterpolator("/");

    // Test the regex with a sample string
    const res1 = deinterp("ru");
    expect(res1).toStrictEqual(null);

    const res2 = deinterp("ru/translation.json");
    expect(res2).toStrictEqual({
      locale: "ru",
      namespace: "translation",
      extension: "json",
    });
  });
});
