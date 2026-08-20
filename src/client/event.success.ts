import z from "zod";

export const SuccessEventName = z.literal("Success");
export type SuccessEventName = z.infer<typeof SuccessEventName>;

export const SuccessEventDetail = z.object({
  message: z.string(),
});
export type SuccessEventDetail = z.infer<typeof SuccessEventDetail>;

export const SuccessEventData = z.object({
  name: SuccessEventName,
  detail: SuccessEventDetail,
});
export type SuccessEventData = z.infer<typeof SuccessEventData>;

export const SuccessEvent = (message: string): SuccessEventData => ({
  name: SuccessEventName.value,
  detail: { message },
});
