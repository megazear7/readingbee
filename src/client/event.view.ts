import z from "zod";

export const ViewEventName = z.literal("ReadingBeeView");
export type ViewEventName = z.infer<typeof ViewEventName>;

export const AppView = z.enum(["reading", "settings", "add-profile", "upload"]);
export type AppView = z.infer<typeof AppView>;

export const ViewEventDetail = z.object({
  view: AppView,
});
export type ViewEventDetail = z.infer<typeof ViewEventDetail>;

export const ViewEventData = z.object({
  name: ViewEventName,
  detail: ViewEventDetail,
});
export type ViewEventData = z.infer<typeof ViewEventData>;

export const ViewEvent = (view: AppView): ViewEventData => ({
  name: ViewEventName.value,
  detail: { view },
});
