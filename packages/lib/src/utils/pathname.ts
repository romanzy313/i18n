export function browserPathnameDetector() {
  // console.log('window', window.location);

  const detectedLocale = detectLocaleFromPathname(window.location.pathname);
  // console.log('detected locale', detectedLocale ?? defaultLocale);

  // use 1 cause its /en, where
  return detectedLocale;
}

export function detectLocaleFromPathname(pathname: string) {
  return pathname.split("/")[1];
}
