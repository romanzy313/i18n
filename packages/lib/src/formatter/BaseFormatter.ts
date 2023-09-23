import { TArgs } from "../types";

export type FormatTranslation = (args?: TArgs) => string;

export abstract class BaseFormatter {
  abstract format(rawValue: string, locale: string): FormatTranslation;
  abstract getType(rawValue: string, locale: string): Record<string, any>;
}
