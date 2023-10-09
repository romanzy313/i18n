import { describe, expect, test } from "vitest";
import NodeFsLoader from "./NodeFsLoader";

describe("Node Fs Loader", () => {
  test("loads correctly", async () => {
    const loader = new NodeFsLoader({
      folder: "src/loader/test",
    });

    const res = await loader.load("en", "default", "json");

    expect(res).toBe(`testing`);
  });

  test("lists correctly", async () => {
    const loader = new NodeFsLoader({
      folder: "src/loader/test",
    });

    const res = await loader.list();

    expect(res).toStrictEqual([
      { locale: "en", namespace: "another", extension: "json" },
      { locale: "en", namespace: "default", extension: "json" },
    ]);
  });
});
