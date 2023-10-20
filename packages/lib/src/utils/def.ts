import { I18nRuntime, InnerI18nOpts } from "../I18nInstance";

export class AbstractUtils {
  constructor(
    protected opts: InnerI18nOpts,
    protected runtime: I18nRuntime,
    protected locale: string,
    protected namespace: string
  ) {}
}

export type UtilDefinition = typeof AbstractUtils;
