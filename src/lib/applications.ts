export type ApplicationTraveller = {
  name: string;
  email: string;
  phone: string;
  company: string;
  photoIdFileName?: string;
};

export type ApplicationRecord = {
  _id: string;
  applicationType: string;
  travellers: ApplicationTraveller[];
  hostName: string;
  hostTitle: string;
  department: string;
  reason: string;
  arrival: string;
  departure: string;
  accommodationRequired: boolean;
  carRego: string;
  status: string;
  gmNotes?: string;
  houseName?: string;
  bedroomLabel?: string;
  createdAt?: string;
};

export function formatAppDate(value: string | Date) {
  return new Date(value).toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function travellerSummary(travellers: ApplicationTraveller[]) {
  if (!travellers.length) return "—";
  if (travellers.length === 1) return travellers[0].name;
  return `${travellers[0].name} +${travellers.length - 1} more`;
}
