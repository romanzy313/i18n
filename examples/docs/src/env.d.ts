/// <reference types="astro/client" />

// type I18nChain = ;
// import type { I18nChain } from "@romanzy/i18n";
// import type { I18nChain, I18nOpts } from "@romanzy/i18n";

declare namespace App {
  interface Locals {
    i18n: import("@romanzy/i18n").I18nChain<any>;
    // test: string;
  }
}

// declare namespace App {
//   type Locals = {
//     test: string;
//   };
// }
