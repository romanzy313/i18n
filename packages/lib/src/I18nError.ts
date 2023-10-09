import { I18nEvents } from "./EventHandler";

export class I18nError<
  Key extends keyof I18nEvents = keyof I18nEvents
> extends Error {
  constructor(public type: Key, public data: Parameters<I18nEvents[Key]>[0]) {
    // message needs to be generated
    super((data as any)?.message);
    this.name = "I18nError";
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
  }
}
