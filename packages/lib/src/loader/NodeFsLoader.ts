import { BaseLoader, ListResult } from "./BaseLoader";
import path from "path";
import fs from "fs/promises";
import { InterpolatePathFn, makePathInterpolator } from "../internalUtils";
import { I18nRuntime } from "..";
import { I18nError } from "../I18nError";

export type NodeFsLoaderOptions = {
  rootPath?: string;
  template: string;
};

type ResolvedOpts = {
  rootPath: string;
  pathFormater: () => {};
};

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

export default class NodeFsLoader extends BaseLoader {
  private rootDir: string;
  private formatPath: InterpolatePathFn;
  private template: string;

  // this needs access to runtime

  // initRuntime(runtime: I18nRuntime) {
  //   this.runtime = runtime;
  // }

  // runtime initialize fn then
  // so that i can provide with extension

  // need runtime injection
  // how do I know file formats from here

  constructor(opts: NodeFsLoaderOptions) {
    super();

    this.rootDir = opts.rootPath || process.env.PWD!;
    if (!this.rootDir) throw new Error("invalid rootPath");

    this.template = opts.template;
    this.formatPath = makePathInterpolator(opts.template, "/");
  }

  // this can throw standard error, locale: string, namespace: string[], fullInput: string
  async load(
    locale: string,
    namespace: string[],
    extension: string
  ): Promise<string | I18nError> {
    const relativePath = this.formatPath(locale, namespace, extension);

    try {
      const completePath = safePathJoin(this.rootDir, relativePath);
      const rawContent = await fs.readFile(completePath, "utf8");
      const content = JSON.parse(rawContent);
      return content;

      // return content;
    } catch (err: any) {
      // console.log("fs load error", error);

      // need ability yo proxy the actual error
      return new I18nError("loadFailure", {
        operation: "load",
        targetObj: relativePath,
        reason: err?.message, // okay?
      });
    }
  }

  async list(): Promise<ListResult[]> {
    const res = await fs.readdir(this.rootDir);
    // now need to parse it, for now just keep it simple, assume lang is first
    // in real version need to use template to generate recoupler + deslasher

    const results: ListResult[] = res.map((v) => {
      // first need to remove rootDir
      // for now its this '/locale/{lng}/{ns}.json'
      const filtered = v
        .substring(this.rootDir.length + "/locale/".length)
        .replace(".json", ""); // TODO remove extension!

      this.template; // TODO use the template
      const parts = filtered.split("/");
      const locale = parts.splice(0, 1)[0];
      const namespace = parts;

      return {
        locale,
        namespace,
      };
    });
    return results;
  }
}
