import z from "zod";

export const WarningEventName = z.literal("Warning");
export type WarningEventName = z.infer<typeof WarningEventName>;

export const WarningEventDetail = z.object({
  message: z.string(),
});
export type WarningEventDetail = z.infer<typeof WarningEventDetail>;

export const WarningEventData = z.object({
  name: WarningEventName,
  detail: WarningEventDetail,
});
export type WarningEventData = z.infer<typeof WarningEventData>;

export const WarningEvent = (message: string): WarningEventData => ({
  name: WarningEventName.value,
  detail: { message },
});
