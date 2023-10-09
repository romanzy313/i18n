import { I18nError } from "../I18nError";

export type ListResult = {
  locale: string;
  namespace: string;
  extension: string;
};

export abstract class BaseLoader {
  abstract load(
    locale: string,
    namespace: string,
    extension: string
  ): Promise<string>; // or error!
  abstract list(): Promise<ListResult[]>;
}
