// TODO deslashing and external link detection
export class PathnameUtls {
  getLink(locale: string, path: string): string {
    // do path deslashing beforehand
    return `/${locale}/${path}`;
  }
  changeLocaleLink(
    _locale: string,
    oldUrl: string,
    _newLocale: string
  ): string {
    const parts = oldUrl.split("/");
    const locale = parts[0];
    if (!locale) {
      // meaning first part is not a link, so just append it
      return `/${_newLocale}/${oldUrl}`;
    }

    parts[0] = _newLocale;

    return parts.join("/");
  }
  // need to have access to the available locales
  // this must provide full url?
  detectLocale(availableLocales: string[], pathname: string): string | null {
    // this must have access to the runtime
    // and in the case of browser it must
    const parts = pathname.split("/");
    const locale = parts[0];
    if (!locale) return null;
    if (!availableLocales.includes(locale)) return null;

    return locale;
  }
}
