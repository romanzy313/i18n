import { CompositeKeyDef, GenericGeneratedType } from "..";

type Ns2Def = {
  sup: {};
};

type Ns1Ns2StrObj<Key extends keyof Ns2Def = keyof Ns2Def> = {
  [key in `ns1:ns2:${Key}`]: Ns2Def[Key];
};

// type Ns1Def = {
//   hello: {
//     name: string;
//   };
//   world: {};
// };
// type Ns1StrObj<Key extends keyof Ns1Def = keyof Ns1Def> = {
//   [key in `ns1:${Key}`]: Ns1Def[Key];
// };

// this replaces code above, but better not, i can genearte them
type Auto1 = CompositeKeyDef<
  "ns1",
  {
    hello: {
      name: string;
    };
    world: {};
  }
>;

export interface TestGen2 extends GenericGeneratedType {
  t: {} & Auto1["keys"] & Ns1Ns2StrObj;
  n: {
    ns1: {
      t: Auto1["def"];
      //   t: {
      //     hello: {
      //       name: string;
      //     };
      //     world: {};
      //   };
      n: {
        ns2: {
          //   t: {
          //     sub: {};
          //   };
          t: Ns2Def;
          n: {};
          l: [];
        };
      };
      l: ["ns2"];
    };
    "ns1:ns2": {
      //   t: {
      //     sub: {};
      //   };
      t: Ns2Def;
      n: {};
      l: [];
    };
  };
  l: ["ns1", "ns1:ns2"];
}

// export interface TestGen extends GenericGeneratedType {
//   t: {
//     // these are replaced with Ns1Obj
//     // "ns1:hello": {
//     //   name: string;
//     // };
//     // "ns1:world": {};
//     // "ns1:ns2:sup": {};
//   } & Ns1StrObj &
//     Ns1Ns2StrObj;
//   n: {
//     ns1: {
//       t: Ns1Def;
//       //   t: {
//       //     hello: {
//       //       name: string;
//       //     };
//       //     world: {};
//       //   };
//       n: {
//         ns2: {
//           //   t: {
//           //     sub: {};
//           //   };
//           t: Ns2Def;
//           n: {};
//           l: [];
//         };
//       };
//       l: ["ns2"];
//     };
//     "ns1:ns2": {
//       //   t: {
//       //     sub: {};
//       //   };
//       t: Ns2Def;
//       n: {};
//       l: [];
//     };
//   };
//   l: ["ns1", "ns1:ns2"];
// }

// class TestChainSimple<Tr extends GenericGen> {
//   getSub<Key extends keyof Tr["n"]>(ns: Key) {
//     return new TestChainSimple<Tr["n"][typeof ns]>();
//   }

//   t<Key extends keyof Tr["t"]>(path: Key, value?: Tr["t"][Key]) {
//     return `translated ${path.toString()} with args ${JSON.stringify(value)}`;
//   }
// }

// const root = new TestChainSimple<TestGen>();

// root.t("ns1:hello", {
//   name: "boss",
// });

// const ns1 = root.getSub("ns1");
// ns1.t("hello");

// const ns2 = ns1.getSub("ns2");
// ns2.t("sub");

// const straightNs2 = root.getSub("ns1:ns2");
// straightNs2.t("sub");

export class TestChain<T extends GenericGeneratedType> {
  public locale: string = "";
  public ns: string = "";

  getSubI18n<Key extends keyof T["n"]>(opts: {
    locale: string;
    ns: Key;
  }): TestChain<T["n"][typeof opts.ns]>;
  getSubI18n<Key extends keyof T["n"]>(opts: {
    ns: Key;
  }): TestChain<T["n"][typeof opts.ns]>;
  getSubI18n<Key extends keyof T["n"]>(opts: { locale: string }): TestChain<T>;
  getSubI18n<Key extends keyof T["n"]>(opts: { locale?: string; ns?: Key }) {
    const chain = new TestChain();
    chain.locale = opts.locale ?? this.locale;
    // @ts-expect-error // ts infinite wisdom
    chain.ns = opts.ns ?? this.ns;

    return chain;
  }

  t<Key extends keyof T["t"]>(path: Key, value?: T["t"][Key]) {
    return `translated "${path.toString()}" in namespace "${
      this.ns
    }" in locale "${this.locale}" with args ${JSON.stringify(value)}`;
  }

  loadNs<Key extends keyof T["n"]>(keys: Key | Key[]) {
    const realKeys = Array.isArray(keys) ? keys : [keys];

    console.log("loading", realKeys.join(", "));
  }
}
