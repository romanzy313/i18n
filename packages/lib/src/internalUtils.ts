export type InterpolatePathFn = (
  locale: string,
  namespace: string,
  extension: string
) => string;

export const makePathInterpolator = (
  endpoint: string,
  separator: string
): InterpolatePathFn => {
  // TODO need to remove trailing slashes of the endpoint path

  return (locale: string, ns: string, extension: string) => {
    // this can be a bit more optimized
    const base = [endpoint, locale, ns].join(separator);

    if (!extension) return base;

    return base + "." + extension;
  };
};

export type DeinterpolatePathFn = (path: string) => {
  locale: string;
  namespace: string;
  extension: string;
} | null;

export function makeMinDeinterpolator(separator: string): DeinterpolatePathFn {
  return (path: string) => {
    // can maybe use regex instead?
    // const extracted = path.substring(cutoffLength); // locale/namespace.extension
    const extracted = path;
    const [locale, others] = extracted.split(separator);

    if (!others) return null;

    const [namespace, extension] = others.split(".");

    return {
      locale,
      namespace,
      extension: extension || "",
    };
  };
}
