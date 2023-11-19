// import {parse} from '@formatjs/icu-messageformat-parser'

import IntlMessageFormat from "intl-messageformat";
import { BaseFormatter, FormatTranslation } from "../bases/BaseFormatter";

export default class UCIFormatter extends BaseFormatter {
  getType(rawValue: string, locale: string): Record<string, any> {
    const msg = new IntlMessageFormat(rawValue, locale);

    const ast = msg.getAst();

    let result: Record<string, any> = {};

    ast.forEach((val) => {
      // TODO check these and add more types
      if (val.type == 1) {
        // its argument
        result[val.value] = "string";
      } else if (val.type == 2 || val.type == 6) {
        // its number?
        result[val.value] = "number";
      }
    });

    return result;
  }
  format(rawValue: string, locale: string): FormatTranslation {
    const msg = new IntlMessageFormat(rawValue, locale); //, [formats], [opts])
    return msg.format as FormatTranslation;
  }
}
