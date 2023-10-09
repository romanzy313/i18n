// arguments

import fs from "fs/promises";
import path from "path";
import { I18nInstance } from "../I18nInstance";
import { ListResult } from "../loader/BaseLoader";

type KeyExpandResult = {
  key: string[];
  value: string;
};

type SingleKeyResult = {
  locale: string;
  key: string[];
  namespace: string;
  type: Record<string, any>;
};

function toKeyResult(
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
    results.push(...toKeyResult(obj[key], [...path, key]));
  });
  return results;
}

// TODO make this a class too

// need to convert object into js object

function objToType(obj: Record<string, any>, tabs: number) {
  if (Object.keys(obj).length === 0) {
    return "{}";
  }

  function oneItem(key: string, value: string) {
    return `${"\t".repeat(tabs)}"${key}": ${value}\n`;
  }

  let res = `{\n${Object.keys(obj).map((v) => oneItem(v, obj[v]))}${"\t".repeat(
    tabs - 1
  )}}`;

  return res;
}

type I18nCliOpts = {
  name: string;
  writeFolder: string;
};

export default class I18nCli {
  constructor(public instance: I18nInstance, private opts: I18nCliOpts) {}

  generateFullType(singles: SingleKeyResult[]) {
    // export type Typename = {

    //}
    let res = `export type ${this.opts.name} = {\n`;
    singles.forEach((s) => {
      res += "\t" + this.generateSingleType(s);
    });
    res += "}";

    return res;
  }

  generateSingleType(single: SingleKeyResult) {
    const ns = this.instance.opts.nsSeparator;
    const key = this.instance.opts.keySeparator;

    // "some_name_here": "type"
    let result = `"`;

    if (single.namespace.length > 0) {
      result += single.namespace + ns;
    }
    result += single.key.join(key);
    result += `": `;
    result += objToType(single.type, 2);
    result += `\n`;

    return result;

    // return `${single.namespace.join(ns)}`
  }

  async processTranslation(tr: ListResult): Promise<SingleKeyResult[]> {
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
    console.log("got load res", parsed);

    const keyResults = toKeyResult(parsed as any);

    return keyResults.map((v) => ({
      locale: tr.locale,
      namespace: tr.namespace,
      key: v.key,
      type: this.instance.runtime.formatter.getType(v.value, tr.locale),
    }));
  }

  async generateTypes() {
    const loader = this.instance.runtime.loader;
    let items = await loader.list();

    // hmmm
    // lets go one by one

    // need to remove all that are no primary
    // this is very non-performant, but works
    // need ability to compare locales, see what is different.
    items = items.filter((v) => v.locale !== this.instance.opts.fallbackLocale);

    const batchProcessed = (
      await Promise.all(items.map(this.processTranslation.bind(this)))
    ).flat();

    const full = this.generateFullType(batchProcessed);

    return full;
  }

  async flushToDisk(value: string) {
    const folder = path.resolve(this.opts.writeFolder);
    const dest = path.join(folder, `${this.opts.name}.ts`);

    await fs.writeFile(dest, value);
  }
}
