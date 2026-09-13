import { BEDROOM_STATUSES, BEDROOM_TYPES } from "@/lib/types";

export function parseAmenities(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export type BedroomInput = {
  _id?: string;
  label: string;
  type: string;
  beds: number;
  status: string;
  amenities: string[];
};

export function normalizeBedroomInput(raw: unknown): BedroomInput | null {
  if (!raw || typeof raw !== "object") return null;

  const body = raw as Record<string, unknown>;
  const label = String(body.label ?? "").trim();
  if (!label) return null;

  const type = String(body.type ?? "single");
  if (!BEDROOM_TYPES.includes(type as (typeof BEDROOM_TYPES)[number])) {
    return null;
  }

  const beds = body.beds === undefined ? 1 : Number(body.beds);
  if (Number.isNaN(beds) || beds < 1) return null;

  const status = String(body.status ?? "available");
  if (!BEDROOM_STATUSES.includes(status as (typeof BEDROOM_STATUSES)[number])) {
    return null;
  }

  const _id = body._id ? String(body._id) : undefined;

  return {
    _id,
    label,
    type,
    beds,
    status,
    amenities: parseAmenities(body.amenities),
  };
}
