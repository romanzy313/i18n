// example output

// export type TestGeneratedType = {
//   this: {
//     [key in keyof Translation1 as `translation1:${key}`]: Translation1[key];
//   } & {
//     [key in keyof Translation2 as `translation2:${key}`]: Translation2[key];
//   };
//   others: {
//     translation1: Translation1;
//     translation2: Translation2;
//   };
// };

// export type Translation1 = {
//   key1: {
//     hello: string;
//   };
//   another: {};
// };
// export type Translation2 = {
//   "nested.value.is.like.this": {
//     count: number;
//   };
//   locales: {};
// };

type ObjectValues = Record<string, string>;

type RawGenTranslationData = Record<string, Record<string, string>>;

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function renderType({
  name,
  values,
  exported,
}: {
  name: string;
  values: ObjectValues;
  exported: boolean;
}) {
  const body = `type ${name} = ${renderObject({
    values,
    depth: 0,
  })}`;

  if (!exported) return body;

  return "export " + body;
}

export function renderObject({
  values,
  depth,
}: {
  values: ObjectValues;
  depth: number;
}) {
  if (Object.keys(values).length == 0) {
    return `{}`;
  }

  let result = `{\n`;

  Object.keys(values).forEach((key) => {
    result += "  ".repeat(depth + 1);
    const value = values[key];

    // TODO decide weather to add quotes or not

    result += `"${key}": ${value};\n`;
  });
  result += "  ".repeat(depth);
  result += "}";

  return result;
}

export function renderGeneratedTranslation({
  name,
  translation,
}: {
  name: string;
  translation: RawGenTranslationData;
}) {
  const actual: ObjectValues = {};

  Object.keys(translation).forEach((key) => {
    const values = translation[key];

    // value is another object
    actual[key] = renderObject({ values, depth: 1 });
  });

  return renderType({
    name,
    values: actual,
    exported: true,
  });
}

// this generates this:
// { [key in keyof Translation1 as `translation1:${key}`]: Translation1[key] }
export function generateThisMappedType({
  typeName, // this is capitalized one
  translationKey,
  nsSeparator,
  depth,
}: {
  typeName: string;
  translationKey: string;
  nsSeparator: string;
  depth: number;
}) {
  let result = "{\n";
  result += "  ".repeat(depth + 1);
  result += `[key in keyof ${typeName} as \`${translationKey}${nsSeparator}\${key}\`]: ${typeName}[key]`;
  result += "\n";
  result += "  ".repeat(depth);
  result += "}";

  return result;
}

type SingleTranslation = {
  translationFile: string; // this is wrong?? its just name
  object: RawGenTranslationData;
};

export function renderGeneratedType(
  outputName: string,
  nsSeparator: string, // what about another separator?? for keys
  values: SingleTranslation[]
) {
  // first sort the values by alphabet
  values.sort((a, b) => {
    if (a.translationFile < b.translationFile) {
      return -1;
    }
    if (a.translationFile > b.translationFile) {
      return 1;
    }
    return 0;
  });

  const othersValue: Record<string, string> = {};
  const thisItems: string[] = [];

  const translations: string[] = [];
  values.forEach((val) => {
    const typeName = capitalizeFirstLetter(val.translationFile);

    translations.push(
      renderGeneratedTranslation({
        name: typeName,
        translation: val.object,
      })
    );

    othersValue[val.translationFile] = typeName;

    thisItems.push(
      generateThisMappedType({
        typeName,
        nsSeparator,
        translationKey: val.translationFile,
        depth: 1,
      })
    );
  });

  const thisFormatted = thisItems.join(" & ");

  const main = renderType({
    name: outputName,
    exported: true,
    values: {
      this: thisFormatted, //
      others: renderObject({
        values: othersValue,
        depth: 1,
      }),
    },
  });
  const header = `/** 
 * AUTOMATICALLY GENERATED TYPES, DO NOT MODIFY
 */\n\n`;

  const defaultExport = `export default ${outputName};\n\n`;

  return header + defaultExport + main + "\n\n" + translations.join("\n\n");
  // returns the this and others
}
