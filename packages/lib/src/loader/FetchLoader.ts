import { BaseLoader, ListResult } from "../bases/BaseLoader";
import path from "path";
import fs from "fs/promises";
import {
  InterpolatePathFn,
  makeMinDeinterpolator,
  makePathInterpolator,
} from "../internalUtils";
import { I18nError } from "../I18nError";

export type FetchLoaderOptions = {
  /**
   * base url where the resources are located
   */
  baseUrl: string;
  fetchInit?: RequestInit;
  fetch?: any;
};

export default class FsLoader extends BaseLoader {
  //   private rootDir: string;
  private formatPath: InterpolatePathFn;
  private fetchInit?: RequestInit;
  //   private fetch: Fetch
  //   private folder: string;

  constructor(opts: FetchLoaderOptions) {
    super();

    this.formatPath = makePathInterpolator(opts.baseUrl, "/");
    this.fetchInit = opts.fetchInit;
  }

  async load(
    locale: string,
    namespace: string,
    extension: string
  ): Promise<string> {
    const webUrl = this.formatPath(locale, namespace, extension);

    try {
      //   const completePath = safePathJoin(this.rootDir, webUrl);
      const rawContent = await fetch(webUrl, this.fetchInit);

      if (!rawContent.ok)
        throw new Error(
          `Bad response for ${webUrl} with status code ${rawContent.status}`
        );

      //   fs.readFile(completePath, "utf8");
      return await rawContent.text();
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
    // it is in the plans to make this work with an api-call

    throw new Error("Fetch loader does not support list yet");
  }
}
