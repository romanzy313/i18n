import { describe, test, expectTypeOf } from "vitest";
import { GenericGeneratedType, GeneratedTranslation } from "./types";

// this is how you generate types

// interfaces
// export interface TestGeneratedType extends GenericGeneratedType {
//   global: {
//     readonly [key1 in keyof Translation1 as `translation1:${key1}`]: Translation1[key1];
//   } & {
//     readonly [key2 in keyof Translation2 as `translation2:${key2}`]: Translation2[key2];
//   };
//   translations: {
//     translation1: Translation1;
//     translation2: Translation2;
//   };
// }

// const actualValue: TestGeneratedType = {
//   global: {
//     "translation1:key1": {
//       hello: "lala",
//     },
//     "translation1:another": {},
//     "translation2:nested.value.is.like.this": {
//       count: 44,
//     },
//     "translation2:locales": {},
//   },
//   translations: {
//     translation1: {
//       key1: {
//         hello: "lala",
//       },
//       another: {},
//     },
//     translation2: {
//       "nested.value.is.like.this": {
//         count: 44,
//       },
//       locales: {},
//     },
//   },
// };

// export interface Translation1 extends GeneratedTranslation {
//   readonly key1: {
//     hello: string;
//   };
//   readonly another: {};
// }
// export interface Translation2 extends GeneratedTranslation {
//   readonly "nested.value.is.like.this": {
//     count: number;
//   };
//   readonly locales: {};
// }

// types
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

function shadow() {
  const actualValue: TestGeneratedType = {
    this: {
      "translation1:key1": {
        hello: "lala",
      },
      "translation1:another": {},
      "translation2:nested.value.is.like.this": {
        count: 44,
      },
      "translation2:locales": {},
    },
    others: {
      translation1: {
        key1: {
          hello: "lala",
        },
        another: {},
      },
      translation2: {
        "nested.value.is.like.this": {
          count: 44,
        },
        locales: {},
      },
    },
  };

  // make a class that does not have sub anymore
  // divide it into globals and not

  // maybe have scope.withLang("en").t()

  class ManualType<T extends GenericGeneratedType> {
    public t<Key extends keyof T["this"]>(
      relativePath: Key,
      args?: T["this"][Key]
    ) {
      // testing
    }

    public async loadTranslation<Key extends keyof T["others"]>(
      keyOrKeys: Key | Key[]
    ) {
      // testing
    }

    public getSubI18n<Key extends keyof T["others"]>(opts: {
      locale: string | undefined | null;
    }): this;
    public getSubI18n<Key extends keyof T["others"]>(opts: {
      locale: string | undefined | null;
      namespace: Key;
    }): ManualType<{
      this: T["others"][Key]; // was typeof opts.namespace
      others: {};
    }>;
    public getSubI18n<Key extends keyof T["others"]>(opts: {
      namespace: Key;
    }): ManualType<{
      this: T["others"][Key]; // was typeof opts.namespace
      others: {};
    }>;
    public getSubI18n<Key extends keyof T["others"]>(opts: {
      locale?: string | undefined | null;
      namespace?: Key;
    }): unknown {
      // testing
      return;
    }
  }

  const newManual = new ManualType<TestGeneratedType>();

  const justLocale = newManual.getSubI18n({
    locale: "lala",
  });

  newManual.t("translation1:key1", {
    hello: "sdsd",
  });

  newManual.loadTranslation("translation2");

  const sub = newManual.getSubI18n({
    namespace: "translation1",
  });

  // sub.loadTranslation()

  sub.t("key1", {
    hello: "sdfsdf",
  });

  // describe("type tests", () => {
  //   test("manually generated types are correct", () => {
  //   })
  // })

  // const deggen: TestGeneratedType = {
  //   $: {
  //     "translation1:key1": {
  //       hello: "value"
  //     }
  //   },
  //   translation1: {

  //   }
  // }
}
