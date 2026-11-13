export const BEDROOM_OPTIONS = [
  { value: "studio", label: "Studio / Efficiency", short: "Studio", quoteOnly: false },
  { value: "1", label: "1-Bedroom Property", short: "1 BR", quoteOnly: false },
  { value: "2", label: "2-Bedroom Property", short: "2 BR", quoteOnly: false },
  { value: "3", label: "3-Bedroom Property", short: "3 BR", quoteOnly: false },
  { value: "4", label: "4-Bedroom Beach Home", short: "4 BR", quoteOnly: true },
  { value: "5", label: "5-Bedroom Beach Home", short: "5 BR", quoteOnly: true },
] as const;

export type BedroomValue = (typeof BEDROOM_OPTIONS)[number]["value"];

export function bedroomLabel(v: string) {
  return BEDROOM_OPTIONS.find((b) => b.value === v)?.label ?? (v ? `${v} bedrooms` : "Not specified");
}
export function bedroomShort(v: string) {
  return BEDROOM_OPTIONS.find((b) => b.value === v)?.short ?? (v || "—");
}

export const SERVICE_TYPES = [
  "Signature Turnover Cleaning",
  "Deep Clean & Seasonal Refresh",
  "Linen & Restocking Program",
  "Welcome Touch Staging",
  "Property Inspections & Reports",
  "Concierge & Guest Support",
] as const;

export const ADD_ONS = [
  "Linen & laundry service",
  "Welcome staging",
  "Restock consumables",
  "Photo inspection report",
  "Deep clean add-on",
  "Same-day / rush turnover",
  "Interior windows & sliders",
  "Balcony, patio & grill",
  "Mid-stay touch-up",
] as const;

export const PROPERTY_TYPES = ["Condo", "Townhome", "Beach house", "Single-family home", "Cottage", "Other"] as const;

export const BOOKING_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number]["value"];

export const DEPOSIT_STATUSES = [
  { value: "none", label: "No deposit" },
  { value: "requested", label: "Deposit requested" },
  { value: "paid", label: "Deposit paid" },
] as const;

export const TRAINING_CATEGORIES = [
  "Training & Certification Videos",
  "Step-by-Step Cleaning Instructions",
  "Cleaning Checklists",
  "Property Turnover Procedures",
  "Linen & Laundry Procedures",
  "Welcome Staging Instructions",
  "Inspection Standards",
  "Customer Service Expectations",
  "Company Policies & Safety",
  "Work Tips",
] as const;

// Sections an employee confirms when submitting a job completion report.
export const REPORT_CHECKLIST = [
  "Kitchen cleaned, appliances wiped inside & out",
  "Bathrooms sanitized, fixtures polished",
  "Bedrooms made with fresh linens",
  "Living areas dusted, floors vacuumed & mopped",
  "Linens & towels replaced and counted",
  "Consumables restocked",
  "Trash & recycling removed",
  "Balcony / patio swept",
  "Welcome staging completed",
  "Doors locked, lights & thermostat set",
] as const;

export type Pricing = Record<string, string>;

// Starting prices shown on the website. Owners can change these from the portal (Settings).
export const DEFAULT_PRICING: Pricing = { studio: "65", "1": "85", "2": "115", "3": "155", "4": "", "5": "" };

export const PHONE_DISPLAY = "843-220-0580";
export const PHONE_TEL = "+18432200580";
export const EMAIL = "info@shorelinesignaturesc.com";
