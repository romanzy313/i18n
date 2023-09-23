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
  ns: string[],
  extension: string
) => string;

export const makePathInterpolator = (
  template: string,

  separator: string
): InterpolatePathFn => {
  return (locale: string, ns: string[], extension: string) => {
    // this can be a bit more optimized
    return template
      .replace("{lng}", locale)
      .replace("{ns}", ns.join(separator));
    +"." + extension; // forward slash only!
  };
};

// it also depends on the format
// .json is default right?
// export const interpolateLoadPath = (
//   path: string,
//   locale: string,
//   ns: string[]
// ) => {
//   return path.replace("{lng}", locale).replace("{ns}", ns.join("/")); // forward slash ones
// };

// function flattenObjectToMap<In, Out>(
//   obj: Record<string, any>,
//   parentKey = "",
//   result: Map<string, Out>,
//   transformer: (input: In) => Out
// ): Map<string, string> {
//   // const result = new Map<string, string>();

//   for (const key in obj) {
//     if (
//       typeof obj[key] === "object" &&
//       !Array.isArray(obj[key]) &&
//       obj[key] !== null
//     ) {
//       // Recursively call the function with the updated parent key
//       const childMap = flattenObjectToMap(
//         obj[key],
//         `${parentKey}${key}.`,
//         result,
//         transformer
//       );
//       childMap.forEach((value, childKey) => {
//         result.set(childKey, value);
//       });
//     } else {
//       // Leaf node found, add it to the result map
//       result.set(`${parentKey}${key}`, obj[key].toString());
//     }
//   }

//   return result;
// }

// export function parseUserInput() {

// }

// export function createInterpolator(
//   startDelimiter: string,
//   endDelimiter: string
// ) {
//   const pattern = createPattern(startDelimiter, endDelimiter);

//   return (str: string, values: InterpolationValues) => {
//     const res = str.replace(pattern, (_, key) => (values as any)[key]); // number also works cause js

//     return res;
//   };
// }

// const pattern = /%\{(\w+)\}/g;

// export function interpolateString(
//   pattern: RegExp,
//   str: string,
//   values: Record<string, any>
// ) {
//   // Use a regular expression to match all instances of `%{key}` in the string

//   // Replace each match in the string with its corresponding value from the object
//   return str.replace(pattern, (match, key) => values[key]);
// }

// function createPattern(startDelimiter: string, endDelimiter: string) {
//   const escapedStartDelimiter = startDelimiter.replace(
//     /[.*+?^${}()|[\]\\]/g,
//     "\\$&"
//   );
//   const escapedEndDelimiter = endDelimiter.replace(
//     /[.*+?^${}()|[\]\\]/g,
//     "\\$&"
//   );
//   const pattern = new RegExp(
//     `${escapedStartDelimiter}(\\w+)${escapedEndDelimiter}`,
//     "g"
//   );
//   return pattern;
// }

export const interpolateLoadPath = (path: string, ns: string, lng: string) => {
  return path.replace("{lng}", lng).replace("{ns}", ns);
};
