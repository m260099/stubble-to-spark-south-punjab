import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const resultSchema = z.object({
  name: z.string().nullable(),
  location: z.string().nullable(),
  acres: z.number().nullable(),
  deadlineDays: z.number().nullable(),
});

export type LlmExtraction =
  | { ok: true; data: z.infer<typeof resultSchema>; model: string }
  | { ok: false; error: string };

const MODEL = "openai/gpt-6-astra" as const;

/**
 * LLM step of the hybrid system: natural-language parsing ONLY.
 * Returns extracted fields; it never computes prices, subsidies or verdicts.
 */
export const extractFarmerData = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ text: z.string().trim().min(1).max(2000) }).parse(input))
  .handler(async ({ data }): Promise<LlmExtraction> => {
    try {
      const { generateResponse } = await import("@lovable.dev/ai-gateway");
      const response = await generateResponse({
        model: MODEL,
        reasoning: { effort: "low" },
        instructions:
          "You extract structured fields from a South Punjab farmer's transcribed voice note (Roman Urdu, Urdu or English). " +
          "Return the farmer's first name, the town/village location, the land size in acres, and the deadline in days to clear the field. " +
          "Use null for anything not stated. Do not compute prices, costs or any other values.",
        input: data.text,
        text: {
          format: {
            type: "json_schema",
            name: "farmer_extraction",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["name", "location", "acres", "deadlineDays"],
              properties: {
                name: { type: ["string", "null"] },
                location: { type: ["string", "null"] },
                acres: { type: ["number", "null"] },
                deadlineDays: { type: ["number", "null"] },
              },
            },
          },
        },
      });

      let raw = "";
      for (const item of response.output ?? []) {
        if (item.type === "message") {
          for (const part of item.content) {
            if (part.type === "output_text") raw += part.text;
          }
        }
      }
      const parsed = resultSchema.safeParse(JSON.parse(raw));
      if (!parsed.success) return { ok: false, error: "The AI returned an unexpected format." };
      return { ok: true, data: parsed.data, model: MODEL };
    } catch (err) {
      console.error("LLM extraction failed", err);
      return { ok: false, error: "AI service unavailable." };
    }
  });
