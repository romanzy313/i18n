import { NestedRawTranslations } from "../types";
import BaseParser from "./BaseParser";

export default class JsonParser extends BaseParser {
  extension = "json";

  parse(blob: string): NestedRawTranslations {
    return JSON.parse(blob);
  }
}
