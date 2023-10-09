// export function getNestedKeyValue<T extends Record<string, any>>(
//   obj: T,
//   key: string,
//   delimiter: string
// ): T | undefined {
//   if (!key.includes(delimiter)) return obj[key];

//   const keys = key.split(delimiter);

//   let result = obj;
//   for (const key of keys) {
//     result = result?.[key];
//     if (result === undefined) {
//       break;
//     }
//   }

//   return result;
// }

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

// export function makePathDeinterpolator(
//   rootPath: string,
//   separator: string
// ): DeinterpolatePathFn {
//   // escape given path
//   const filtered = new RegExp(
//     rootPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + `\\/(.+)`,
//     "i"
//   );

//   console.log("filtered deinterlaced path", filtered);

//   throw new Error("not reimplemented yet");

//   // this one needs to remove root path
//   return (path: string) => {
//     const res = path.match(filtered);
//     // const res = filtered.match(path);

//     if (!res) return null;

//     if (res.length < 2) return null;

//     const parts = res[1].split(separator);

//     if (parts.length < 2) return null;

//     // const locale = parts[0];
//     const [locale] = parts.splice(0, 1);
//     const [last] = parts.splice(parts.length - 1, 1);

//     // const last = parts[parts.length - 1];
//     const [file, extension] = last.split(".");

//     // const ns = parts.filter

//     parts.push(file);

//     return {
//       locale,
//       namespace: file, // was parts
//       extension: extension || "",
//     };
//   };
// }

// we are given a globalPath like /var/www/project/locale/en/translation.json
// need to extract locale from it
// root path provided is /var/www/project/locale/ not sure about trailing one

export function makeMinDeinterpolator(
  // rootPath: string,
  separator: string
): DeinterpolatePathFn {
  // escape given path

  // TODO check if trailing slash is included
  // const cutoffLength = rootPath.length;

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
