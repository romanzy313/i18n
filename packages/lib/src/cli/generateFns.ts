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

type ObjectValues = Record<
  string,
  string | ((args: { depth: number }) => string)
>;

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
  // add tabs

  Object.keys(values).forEach((key) => {
    // pretty it
    result += "  ".repeat(depth + 1);

    const raw = values[key];
    const value =
      typeof raw === "string"
        ? raw
        : raw({
            depth: depth + 1,
          });

    // we always quote here
    // const quote = true;

    result += `"${key}": ${value};\n`;
  });
  result += "  ".repeat(depth);

  result += "}";

  return result;
  // now generate the generic type
}

export function makeAndUnion(members: string[], depth: number) {
  if (members.length == 0) return "{}";

  let result = "{\n";
  result += "  ".repeat(depth);
}

export function renderGeneratedTranslation({
  name,
  translation,
}: {
  name: string;
  translation: RawGenTranslationData;
}) {
  // need to setup the value

  // proper ordered translation things

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

// [key in keyof Translation1 as `translation1:${key}`]: Translation1[key];
export function generateThisMappedType({
  typeName, // this is capitalized one
  quantifiedTranslationName,
  nsSeparator,
  depth,
}: {
  typeName: string;
  quantifiedTranslationName: string;
  nsSeparator: string;
  depth: number;
}) {
  let result = "";
  // {
  //     [key1 in keyof Translation1 as `translation1:${key1}`]: Translation1[key1];
  //   }
  result += "{\n";
  result += "  ".repeat(depth + 1);
  result += `[key in keyof ${typeName} as \`${quantifiedTranslationName}${nsSeparator}\${key}\`]: ${typeName}[key]`;
  result += "\n";
  result += "  ".repeat(depth);
  result += "}";

  return result;
}

type Translationdd = {
  quantifiedName: string; // this is wrong?? its just name
  raw: RawGenTranslationData;
};

export function renderGeneratedType(
  outputName: string,
  nsSeparator: string, // what about another separator?? for keys
  values: Translationdd[]
) {
  // first sort the values by alphabet
  values.sort((a, b) => {
    if (a.quantifiedName < b.quantifiedName) {
      return -1;
    }
    if (a.quantifiedName > b.quantifiedName) {
      return 1;
    }
    return 0;
  });

  const others: Record<string, string> = {};
  const thisF: string[] = [];

  const types: string[] = [];
  values.forEach((val) => {
    const typeName = capitalizeFirstLetter(val.quantifiedName);

    types.push(
      renderGeneratedTranslation({
        name: typeName,
        translation: val.raw,
      })
    );

    // generate others
    others[val.quantifiedName] = typeName;

    thisF.push(
      generateThisMappedType({
        typeName,
        nsSeparator,
        quantifiedTranslationName: val.quantifiedName,
        depth: 1,
      })
    );
  });

  const thisFormatted = thisF.join(" & ");

  // there are many other vals
  const main = renderType({
    name: outputName,
    exported: true,
    values: {
      this: thisFormatted, //
      others: renderObject({
        values: others,
        depth: 1,
      }),
    },
  });

  return (
    `/* 
  AUTOMATICALLY GENERATED TYPES, DO NOT MODIFY
*/\n\n` +
    main +
    "\n\n" +
    types.join("\n")
  );
  // returns the this and others
}
