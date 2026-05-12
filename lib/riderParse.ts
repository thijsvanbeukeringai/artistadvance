import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { TechCategory } from "./types";

export interface ParsedRiderItem {
  category: TechCategory;
  item_description: string;
  is_mandatory: boolean;
  artist_notes?: string;
}

export interface ParseRiderResult {
  ok: true;
  items: ParsedRiderItem[];
  modelUsage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
}

export interface ParseRiderError {
  ok: false;
  error: string;
  code: "no_api_key" | "unsupported_file" | "claude_error" | "no_tool_use";
}

const SYSTEM_PROMPT = `Je bent een advancing-assistant voor een management bureau dat tour-riders verwerkt.
Je leest een technical rider (PDF) van een DJ/artiest en extraheert alle losse items die een festival per item moet bevestigen via een "PLEASE CONFIRM" flow.

Per item bepaal je:
- category - één van: dj_gear, monitors, audio, light, video, lasers, sfx_pyro, stage, ethernet, communication, power, backline
- item_description - korte concrete omschrijving (bv. "4x CDJ3000", "GrandMA3 full size MODE 3", "L-Acoustics K1/K2 PA")
- is_mandatory - true alleen als de rider expliciet aangeeft dat dit verplicht is (mandatory / required / minimum / "MUST be"). Anders false.
- artist_notes - alleen invullen als de rider een korte notitie naast het item heeft (bv. "NOT directly in mixer", "with FB4 card"). Geen lange tekst kopiëren.

Splits items op zodat festivals ze één-voor-één kunnen confirmeren. Bv. "4x CDJ3000 + DJM-V10" wordt 2 items.
Negeer hospitality, catering, dressing-room en travel - alleen tech.
Negeer algemene tekst zoals begroetingen of contactinfo.`;

const TOOL_SCHEMA = {
  name: "submit_tech_requirements",
  description:
    "Verzend de geëxtraheerde tech-requirements uit de rider als lijst van losse items, gegroepeerd per categorie.",
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      items: {
        type: "array",
        description: "Alle individuele tech-items uit de rider.",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            category: {
              type: "string",
              enum: [
                "dj_gear", "monitors", "audio", "light", "video", "lasers",
                "sfx_pyro", "stage", "ethernet", "communication", "power", "backline",
              ],
              description: "De tech-categorie waar dit item onder valt.",
            },
            item_description: {
              type: "string",
              description: "Korte concrete omschrijving van het item (bv. '4x CDJ3000').",
            },
            is_mandatory: {
              type: "boolean",
              description: "True alleen als rider expliciet aangeeft dat dit verplicht is.",
            },
            artist_notes: {
              type: "string",
              description: "Korte notitie naast het item, indien aanwezig.",
            },
          },
          required: ["category", "item_description", "is_mandatory"],
        },
      },
    },
    required: ["items"],
  },
} as const;

function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

export async function parseRiderPdf(
  pdfBytes: Buffer,
  mediaType: string
): Promise<ParseRiderResult | ParseRiderError> {
  if (mediaType !== "application/pdf") {
    return { ok: false, error: "Alleen PDF-bestanden worden ondersteund.", code: "unsupported_file" };
  }

  const client = getClient();
  if (!client) {
    return {
      ok: false,
      error: "ANTHROPIC_API_KEY ontbreekt - zet deze in `.env.local` om rider-PDF's automatisch te laten parsen.",
      code: "no_api_key",
    };
  }

  const base64 = pdfBytes.toString("base64");

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 16000,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: [TOOL_SCHEMA as any],
      tool_choice: { type: "tool", name: "submit_tech_requirements" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64,
              },
            },
            {
              type: "text",
              text: "Extraheer alle tech-items uit deze rider en categoriseer ze. Splits combo-items op in losse rows.",
            },
          ],
        },
      ],
    });

    const toolUse = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === "submit_tech_requirements"
    );

    if (!toolUse) {
      return {
        ok: false,
        error: "Claude leverde geen gestructureerd antwoord op deze rider.",
        code: "no_tool_use",
      };
    }

    const input = toolUse.input as { items: ParsedRiderItem[] };
    const items = (input.items ?? []).filter((i) => i.item_description?.trim());

    return {
      ok: true,
      items,
      modelUsage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
        cache_creation_input_tokens: response.usage.cache_creation_input_tokens ?? undefined,
        cache_read_input_tokens: response.usage.cache_read_input_tokens ?? undefined,
      },
    };
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      return {
        ok: false,
        error: `Claude API error (${error.status}): ${error.message}`,
        code: "claude_error",
      };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Onbekende fout bij rider-parsing.",
      code: "claude_error",
    };
  }
}
