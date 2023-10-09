import { BaseLoader, ListResult } from "./BaseLoader";
import path from "path";
import fs from "fs/promises";
import {
  InterpolatePathFn,
  makeMinDeinterpolator,
  makePathInterpolator,
} from "../internalUtils";
import { I18nError } from "../I18nError";

export type NodeFsLoaderOptions = {
  /**
   * usually this is a path relative to the project root where the server is started from
   * by default the `process.env.PWD` is used
   */
  rootPath?: string;
  /**
   * relative path from `rootPath` to where the translations are saved in given format
   */
  folder: string;
};

export default class NodeFsLoader extends BaseLoader {
  private rootDir: string;
  private formatPath: InterpolatePathFn;
  private folder: string;

  constructor(opts: NodeFsLoaderOptions) {
    super();

    this.rootDir = opts.rootPath || process.env.PWD!;
    if (!this.rootDir) throw new Error("invalid rootPath");

    this.folder = opts.folder;
    this.formatPath = makePathInterpolator(opts.folder, "/");
  }

  async load(
    locale: string,
    namespace: string,
    extension: string
  ): Promise<string> {
    const relativePath = this.formatPath(locale, namespace, extension);

    try {
      const completePath = safePathJoin(this.rootDir, relativePath);
      const rawContent = await fs.readFile(completePath, "utf8");
      return rawContent;
    } catch (err: any) {
      throw new I18nError("loadFailure", {
        operation: "load",
        targetObj: {
          locale,
          namespace,
          extension,
        },
        reason: err?.message, // okay?
      });
    }
  }

  async list(): Promise<ListResult[]> {
    const rootPath = safePathJoin(this.rootDir, this.folder);
    const deinterp = makeMinDeinterpolator("/");

    const res = await fs.readdir(rootPath, {
      recursive: true,
    });

    const output: ListResult[] = [];

    res.forEach((v) => {
      const parsed = deinterp(v);
      if (parsed && parsed.extension) output.push(parsed);
    });

    return output;
  }
}

/**
 *
 * Makes sure there is no path traversal attacks when joining the path
 *
 *
 * @param safeBase base folder of where to join, only trusted input
 * @param rest rest paths to join
 * @returns the path
 * @throws when path is not safe (hacking attempt)
 */
const safePathJoin = function (safeBase: string, ...rest: string[]) {
  safeBase = path.normalize(safeBase);
  const result = path.join(safeBase, ...rest);

  const isSafe = result.startsWith(safeBase);

  if (!isSafe) {
    throw new Error("path " + result + " is not safe!");
    // return "";
  }

  return result;
};
