// arguments

import fs from "fs/promises";
import path from "path";
import { I18nInstance } from "../I18nInstance";
import { ListResult } from "../loader/BaseLoader";
import { renderGeneratedType } from "./generateFns";

// here what i need to generate
/**
export type TestGeneratedType = {
  this: {
    [key1 in keyof Translation1 as `translation1:${key1}`]: Translation1[key1];
  } & {
    [key2 in keyof Translation2 as `translation2:${key2}`]: Translation2[key2];
  };
  others: {
    translation1: Translation1;
    translation2: Translation2;
  };
};

export type Translation1 = {
  key1: {
    hello: string;
  };
  another: {};
};
export type Translation2 = {
  "nested.value.is.like.this": {
    count: number;
  };
  locales: {};
};
 */

type KeyExpandResult = {
  key: string[];
  value: string;
};

type SingleKeyResult = {
  locale: string;
  key: string; // unobjectify it
  namespace: string;
  type: Record<string, string>;
};

type SingleNamespaceResultObj = {
  namespace: string;
  obj: Record<string, Record<string, string>>;
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

    const keyResults = toKeyResult(parsed as any);

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

    // lets return this as an object instead
    return results;
  }

  // async processTranslation(tr: ListResult): Promise<SingleKeyResult[]> {
  //   let raw: string;
  //   try {
  //     raw = await this.instance.runtime.loader.load(
  //       tr.locale,
  //       tr.namespace,
  //       tr.extension
  //     );
  //   } catch (error) {
  //     throw error;
  //   }

  //   const parsed = this.instance.runtime.parser.parse(raw);

  //   const keyResults = toKeyResult(parsed as any);

  //   // lets return this as an object instead
  //   return keyResults.map((v) => ({
  //     locale: tr.locale,
  //     namespace: tr.namespace,
  //     key: v.key.join(this.instance.opts.keySeparator),
  //     type: this.instance.runtime.formatter.getType(v.value, tr.locale),
  //   }));
  // }

  async generateTypes() {
    const loader = this.instance.runtime.loader;
    let items = await loader.list();

    // hmmm
    // lets go one by one

    // need to remove all that are no primary
    // this is very non-performant, but works
    // need ability to compare locales, see what is different.
    items = items.filter((v) => v.locale !== this.instance.opts.fallbackLocale);

    const batchProcessed = await Promise.all(
      items.map(this.processTranslation.bind(this))
    );

    const full = renderGeneratedType(
      this.opts.name,
      this.instance.opts.nsSeparator,
      batchProcessed.map((v) => {
        return {
          quantifiedName: v.namespace, // all have the same namespace?
          raw: v.obj,
        };
      })
    );

    // this.generateFullType(batchProcessed);

    return full;
  }

  async flushToDisk(value: string) {
    const folder = path.resolve(this.opts.writeFolder);
    const dest = path.join(folder, `${this.opts.name}.ts`);

    await fs.writeFile(dest, value);
  }
}
