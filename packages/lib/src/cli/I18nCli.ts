import fs from "fs/promises";
import path from "path";
import { I18nInstance } from "../I18nInstance";
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

export default class I18nCli {
  constructor(public instance: I18nInstance<any>, private opts: I18nCliOpts) {}

  async processTranslation(tr: ListResult): Promise<SingleNamespaceResultObj> {
    let raw: string;
    try {
      raw = await this.instance.runtime.loader.load(
        tr.locale,
        tr.namespace,
        tr.extension
      );
    } catch (error) {
      throw error;
    }

    const parsed = this.instance.runtime.parser.parse(raw);

    const keyResults = extractObjectKeyValue(parsed as any);

    const results: SingleNamespaceResultObj = {
      namespace: tr.namespace,
      obj: {},
    };

    keyResults.forEach((v) => {
      const flatKey = v.key.join(this.instance.opts.keySeparator);
      const typeValue = this.instance.runtime.formatter.getType(
        v.value,
        tr.locale
      );
      results.obj[flatKey] = typeValue;
    });

    return results;
  }

  async generateTypes() {
    const loader = this.instance.runtime.loader;
    let items = await loader.list();

    items = items.filter((v) => v.locale !== this.instance.opts.fallbackLocale);

    const batchProcessed = await Promise.all(
      items.map(this.processTranslation.bind(this))
    );

    const full = renderGeneratedType(
      this.opts.name,
      this.instance.opts.nsSeparator,
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
    const folder = path.resolve(this.opts.writeFolder);
    const dest = path.join(folder, `${this.opts.name}.ts`);

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
