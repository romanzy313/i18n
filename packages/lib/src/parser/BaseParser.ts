import { NestedRawTranslations } from "..";

export type TParser = (blob: string) => NestedRawTranslations;

export default abstract class BaseParser {
  abstract extension: string;
  abstract parse(blob: string): NestedRawTranslations;
}
