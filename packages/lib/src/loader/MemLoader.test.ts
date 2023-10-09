import { describe, beforeEach, expect, test } from "vitest";
import MemLoader from "./MemLoader";

let loader: MemLoader;

beforeEach(() => {
  loader = new MemLoader();
  loader.registerMany("en", {
    one: {
      hi: "hello",
    },
    two: {
      hi: "hello",
    },
  });
  loader.register("ru", "one", {
    hi: "привет",
  });
  loader.register("ru", "two", {
    hi: "привет",
  });
});

describe("MemLoader", () => {
  test("memloader lists properly", async () => {
    const res = await loader.list();

    expect(res.length).toBe(4);

    // this can be flakey?
    expect(res).toStrictEqual([
      {
        extension: "",
        locale: "en",
        namespace: "one",
      },
      {
        extension: "",
        locale: "en",
        namespace: "two",
      },
      {
        extension: "",
        locale: "ru",
        namespace: "one",
      },
      {
        extension: "",
        locale: "ru",
        namespace: "two",
      },
    ]);
  });
});
