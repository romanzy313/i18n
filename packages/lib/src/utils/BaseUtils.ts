// i want easy extension though
import { AbstractUtils } from "./def";
import { getDir } from "./getDir";

export default class Utils extends AbstractUtils {
  displayNames(options: Intl.DisplayNamesOptions): Intl.DisplayNames {
    return new Intl.DisplayNames(this.locale, options);
  }

  dateTimeFormat(): Intl.DateTimeFormat {
    return new Intl.DateTimeFormat(this.locale);
  }

  numberFormat(options: Intl.DisplayNamesOptions): Intl.NumberFormat {
    return new Intl.NumberFormat(this.locale, options);
  }

  dir(): string {
    return getDir(this.locale);
  }
}
