export const STAGES = [
  { id: "lead", label: "Lead", accent: "var(--stage-lead)" },
  { id: "estimate_sent", label: "Estimate Sent", accent: "var(--stage-estimate-sent)" },
  { id: "scheduled", label: "Scheduled", accent: "var(--stage-scheduled)" },
  { id: "in_progress", label: "In Progress", accent: "var(--stage-in-progress)" },
  { id: "completed", label: "Completed", accent: "var(--stage-completed)" },
];

export const SERVICES = [
  { id: "window", label: "Window", accent: "var(--svc-window)" },
  { id: "door", label: "Door", accent: "var(--svc-door)" },
  { id: "siding", label: "Siding", accent: "var(--svc-siding)" },
  { id: "gutter", label: "Gutter", accent: "var(--svc-gutter)" },
];

// Placeholder rates only — a contractor would swap these for their real pricing.
export const ESTIMATE_CONFIG = {
  window: { qtyLabel: "Number of windows", rateLabel: "Price per window", unit: "window", sampleRate: 650 },
  door: { qtyLabel: "Number of doors", rateLabel: "Price per door", unit: "door", sampleRate: 950 },
  siding: { qtyLabel: "Square footage", rateLabel: "Price per sq ft", unit: "sq ft", sampleRate: 4.5 },
  gutter: { qtyLabel: "Linear feet", rateLabel: "Price per linear ft", unit: "linear ft", sampleRate: 9 },
};

export const stageMeta = (id) => STAGES.find((s) => s.id === id) || STAGES[0];
export const serviceMeta = (id) => SERVICES.find((s) => s.id === id) || SERVICES[0];

export const currency = (n) =>
  (n || 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });


