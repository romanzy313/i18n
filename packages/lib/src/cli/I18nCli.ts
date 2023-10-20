import fs from "fs/promises";
import path from "path";
import { I18nInstance, I18nRuntime, InnerI18nOpts } from "../I18nInstance";
import { ListResult } from "../loader/BaseLoader";
import { renderGeneratedType } from "./generateFns";

type KeyExpandResult = {
  key: string[];
  value: string;
};

type SingleNamespaceResultObj = {
  namespace: string;
  obj: Record<string, Record<string, string>>;
};

type I18nCliOpts = {
  name: string;
  writeFolder: string;
};

export class I18nCli {
  private runtime: I18nRuntime;
  private instanceOtps: InnerI18nOpts;
  constructor(instance: I18nInstance<any, any>, public cliOpts: I18nCliOpts) {
    // @ts-expect-error
    this.runtime = instance.runtime;
    // @ts-expect-error
    this.instanceOtps = instance.opts;
  }

  async processTranslation(tr: ListResult): Promise<SingleNamespaceResultObj> {
    let raw: string;
    try {
      raw = await this.runtime.loader.load(
        tr.locale,
        tr.namespace,
        tr.extension
      );
    } catch (error) {
      throw error;
    }

    const parsed = this.runtime.parser.parse(raw);

    const keyResults = extractObjectKeyValue(parsed as any);

    const results: SingleNamespaceResultObj = {
      namespace: tr.namespace,
      obj: {},
    };

    keyResults.forEach((v) => {
      const flatKey = v.key.join(this.instanceOtps.keySeparator);
      const typeValue = this.runtime.formatter.getType(v.value, tr.locale);
      results.obj[flatKey] = typeValue;
    });

    return results;
  }

  async generateTypes() {
    const loader = this.runtime.loader;
    let items = await loader.list();

    items = items.filter((v) => v.locale !== this.instanceOtps.fallbackLocale);

    const batchProcessed = await Promise.all(
      items.map(this.processTranslation.bind(this))
    );

    const full = renderGeneratedType(
      this.cliOpts.name,
      this.instanceOtps.nsSeparator,
      batchProcessed.map((v) => {
        return {
          translationFile: v.namespace,
          object: v.obj,
        };
      })
    );

    return full;
  }

  async watchGenerateTypes() {
    throw new Error("Method not implemented.");
  }

  async flushToDisk(value: string) {
    const folder = path.resolve(this.cliOpts.writeFolder);
    const dest = path.join(folder, `${this.cliOpts.name}.ts`);

    await fs.writeFile(dest, value);
  }
}

function extractObjectKeyValue(
  obj: string | Record<string, string>,
  path: string[] = []
): KeyExpandResult[] {
  if (typeof obj === "string") {
    return [
      {
        key: path,
        value: obj,
      },
    ];
  }

  const results: KeyExpandResult[] = [];

  Object.keys(obj).forEach((key) => {
    results.push(...extractObjectKeyValue(obj[key], [...path, key]));
  });
  return results;
}
