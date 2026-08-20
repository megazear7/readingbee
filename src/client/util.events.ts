import z from "zod";
import { ModelClosingEventData } from "./event.modal-closing.js";
import { ModelOpeningEventData } from "./event.modal-opening.js";
import { SuccessEventData } from "./event.success.js";
import { WarningEventData } from "./event.warning.js";

export const ReadingBeeEvent = z.union([
  ModelOpeningEventData,
  ModelClosingEventData,
  SuccessEventData,
  WarningEventData,
]);
export type ReadingBeeEvent = z.infer<typeof ReadingBeeEvent>;

export const stopProp = (event: Event): void => {
  event.stopPropagation();
};

export const dispatch = (element: HTMLElement, event: ReadingBeeEvent): void => {
  element.dispatchEvent(
    new CustomEvent(event.name, {
      detail: event.detail,
      bubbles: true,
      composed: true,
    }),
  );
};
