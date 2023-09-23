import { I18nError } from "../I18nError";

export type LoadResult = Promise<string | null>;

export type ListResult = { locale: string; namespace: string[] };

export abstract class BaseLoader {
  abstract load(
    locale: string,
    namespace: string[],
    extension: string
  ): Promise<string | I18nError>; // or error!
  abstract list(): Promise<ListResult[]>;
}
