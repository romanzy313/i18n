import { defineMiddleware } from "astro:middleware";
import i18n from "./i18n";

export const onRequest = defineMiddleware((context, next) => {
  const unsafeLocale = context.params["locale"];
  const safeLocale = i18n.getSafeLocale(unsafeLocale);

  // redirect if locale is wrong or when its missing
  if (unsafeLocale !== safeLocale) {
    return context.redirect("/" + safeLocale, 307);
  }

  // get the chain with current lnaguage
  context.locals.i18n = i18n.getSubI18n({
    locale: safeLocale,
  });

  return next();
});
