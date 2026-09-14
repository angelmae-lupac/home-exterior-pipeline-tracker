import React, { useState, useMemo, useEffect } from "react";

/**
 * Home Exterior Job Pipeline Tracker
 * ------------------------------------------------------------
 * Data model
 *
 * Job = {
 *   id: string
 *   customerName: string
 *   address: string
 *   phone: string
 *   serviceType: "window" | "door" | "siding" | "gutter"
 *   stage: "lead" | "estimate_sent" | "scheduled" | "in_progress" | "completed"
 *   notes: string
 *   estimate: { quantity: number, rate: number, total: number } | null
 *   scheduledDate: string ("YYYY-MM-DD") | null
 *   createdAt: number (epoch ms)
 * }
 * ------------------------------------------------------------
 */

const STAGES = [
  { id: "lead", label: "Lead", accent: "var(--stage-lead)" },
  { id: "estimate_sent", label: "Estimate Sent", accent: "var(--stage-estimate-sent)" },
  { id: "scheduled", label: "Scheduled", accent: "var(--stage-scheduled)" },
  { id: "in_progress", label: "In Progress", accent: "var(--stage-in-progress)" },
  { id: "completed", label: "Completed", accent: "var(--stage-completed)" },
];

const SERVICES = [
  { id: "window", label: "Window", accent: "var(--svc-window)" },
  { id: "door", label: "Door", accent: "var(--svc-door)" },
  { id: "siding", label: "Siding", accent: "var(--svc-siding)" },
  { id: "gutter", label: "Gutter", accent: "var(--svc-gutter)" },
];

// Placeholder rates only — a contractor would swap these for their real pricing.
const ESTIMATE_CONFIG = {
  window: { qtyLabel: "Number of windows", rateLabel: "Price per window", unit: "window", sampleRate: 650 },
  door: { qtyLabel: "Number of doors", rateLabel: "Price per door", unit: "door", sampleRate: 950 },
  siding: { qtyLabel: "Square footage", rateLabel: "Price per sq ft", unit: "sq ft", sampleRate: 4.5 },
  gutter: { qtyLabel: "Linear feet", rateLabel: "Price per linear ft", unit: "linear ft", sampleRate: 9 },
};

const stageMeta = (id) => STAGES.find((s) => s.id === id) || STAGES[0];
const serviceMeta = (id) => SERVICES.find((s) => s.id === id) || SERVICES[0];

const currency = (n) =>
  (n || 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

// Local YYYY-MM-DD for a Date, avoiding UTC shift issues from toISOString().
const toISODate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const isoDateOffset = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toISODate(d);
};
// Parse "YYYY-MM-DD" as a local date (new Date("YYYY-MM-DD") parses as UTC, which
// can shift the day depending on timezone — this keeps it aligned to local time).
const parseLocalDate = (isoStr) => {
  const [y, m, d] = isoStr.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const formatShortDate = (isoStr) =>
  parseLocalDate(isoStr).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
const getThisWeekRange = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const day = now.getDay(); // 0 = Sun ... 6 = Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(now);
  start.setDate(now.getDate() + diffToMonday);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
};
const isThisWeek = (isoStr) => {
  if (!isoStr) return false;
  const { start, end } = getThisWeekRange();
  const d = parseLocalDate(isoStr);
  return d >= start && d <= end;
};

const uid = () => Math.random().toString(36).slice(2, 10);

const SEED_JOBS = [
  {
    id: uid(),
    customerName: "Marisol Reyes",
    address: "412 Cardinal Ct, Lakewood",
    phone: "(216) 555-0142",
    serviceType: "window",
    stage: "estimate_sent",
    notes: "Wants triple-pane quote for 8 windows, south side.",
    estimate: { quantity: 8, rate: 650, total: 5200 },
    createdAt: Date.now() - 86400000 * 6,
  },
  {
    id: uid(),
    customerName: "Dave Holloway",
    address: "88 Birchwood Ave, Parma",
    phone: "(216) 555-0198",
    serviceType: "gutter",
    stage: "scheduled",
    notes: "Seamless gutter replacement, full perimeter. Crew booked Thu.",
    estimate: { quantity: 140, rate: 9, total: 1260 },
    scheduledDate: isoDateOffset(2),
    createdAt: Date.now() - 86400000 * 4,
  },
  {
    id: uid(),
    customerName: "Priya Nair",
    address: "27 Fenwick Rd, Shaker Heights",
    phone: "(216) 555-0176",
    serviceType: "siding",
    stage: "in_progress",
    notes: "Vinyl siding, storm-damaged section on north wall.",
    scheduledDate: isoDateOffset(1),
    createdAt: Date.now() - 86400000 * 9,
  },
  {
    id: uid(),
    customerName: "The Ostrowski Family",
    address: "5 Meridian Pl, Rocky River",
    phone: "(440) 555-0113",
    serviceType: "door",
    stage: "lead",
    notes: "Referral. Interested in front + patio door replacement.",
    createdAt: Date.now() - 86400000 * 1,
  },
  {
    id: uid(),
    customerName: "Bea Simmons",
    address: "930 Larchmere Blvd, Cleveland Hts",
    phone: "(216) 555-0121",
    serviceType: "window",
    stage: "completed",
    notes: "6 windows installed. Left 5-star review.",
    createdAt: Date.now() - 86400000 * 14,
  },
  {
    id: uid(),
    customerName: "Marcus Webb",
    address: "61 Hillcrest Dr, Westlake",
    phone: "(440) 555-0164",
    serviceType: "door",
    stage: "scheduled",
    notes: "Front entry door swap, booked for next week.",
    estimate: { quantity: 1, rate: 950, total: 950 },
    scheduledDate: isoDateOffset(10),
    createdAt: Date.now() - 86400000 * 2,
  },
];

/* ---------------------------------- Icons ---------------------------------- */
/* Small bespoke marks per trade, not a generic icon set. */

function WindowIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function DoorIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="5" y="2.5" width="14" height="19" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="15" cy="12" r="1.1" fill="currentColor" />
    </svg>
  );
}
function SidingIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M2.5 6h19M2.5 12h19M2.5 18h19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M2.5 9l19 0M2.5 15l19 0" stroke="currentColor" strokeWidth="0.9" opacity="0.5" />
    </svg>
  );
}
function GutterIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 5h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M4.5 5v3a7.5 7.5 0 0015 0V5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 8v11" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 19l-2 2.5M12 19l2 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
const SERVICE_ICON = { window: WindowIcon, door: DoorIcon, siding: SidingIcon, gutter: GutterIcon };

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 4v16M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M4 7h16M9 7V4.5A1.5 1.5 0 0110.5 3h3A1.5 1.5 0 0115 4.5V7M6 7l1 13.5A1.5 1.5 0 008.5 22h7a1.5 1.5 0 001.5-1.5L18 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M20 20l-4.5-4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 2.8v2.4M12 18.8v2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M2.8 12h2.4M18.8 12h2.4M4.9 19.1l1.7-1.7M17.4 6.6l1.7-1.7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M20.2 14.6A8.6 8.6 0 1110 3.3a6.8 6.8 0 1010.2 11.3z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ------------------------------- Brand mark ------------------------------ */
/* A simple roofline + level-line mark — not a generic house icon, ties to */
/* the "measure it, mark it, install it" rhythm of an exteriors crew. */

function BrandMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" fill="none" className="brand-mark">
      <path d="M4 17L16 6l12 11" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 15.5V26h18V15.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.5 26v-6.5h7V26" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M2.5 26h27" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

/* ------------------------------- Job Card ------------------------------- */

function JobCard({ job, onOpen }) {
  const stage = stageMeta(job.stage);
  const svc = serviceMeta(job.serviceType);
  const Icon = SERVICE_ICON[job.serviceType];
  return (
    <button className="job-card" style={{ "--stage-color": stage.accent }} onClick={() => onOpen(job)}>
      <div className="job-card-top">
        <span className="svc-tag" style={{ "--svc-color": svc.accent }}>
          <Icon size={13} />
          {svc.label}
        </span>
        {job.estimate?.total ? <span className="estimate-badge">{currency(job.estimate.total)}</span> : null}
      </div>
      <div className="job-card-name">{job.customerName}</div>
      <div className="job-card-address mono">{job.address}</div>
      <div className="job-card-phone mono">{job.phone}</div>
      {job.scheduledDate ? <div className="job-card-date">{formatShortDate(job.scheduledDate)}</div> : null}
      {job.notes ? <div className="job-card-notes">{job.notes}</div> : null}
    </button>
  );
}

/* ------------------------------- Job Form ------------------------------- */

function JobForm({ initial, onSave, onDelete, onClose }) {
  const [form, setForm] = useState(
    initial || {
      customerName: "",
      address: "",
      phone: "",
      serviceType: "window",
      stage: "lead",
      notes: "",
    }
  );
  const isEdit = Boolean(initial && initial.id);

  const cfg = ESTIMATE_CONFIG[form.serviceType];
  const [estQty, setEstQty] = useState(initial?.estimate?.quantity ?? "");
  const [estRate, setEstRate] = useState(String(initial?.estimate?.rate ?? cfg.sampleRate));
  const estTotal = (Number(estQty) || 0) * (Number(estRate) || 0);
  const [scheduledDate, setScheduledDate] = useState(initial?.scheduledDate ?? "");

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const changeService = (e) => {
    const nextType = e.target.value;
    setForm((f) => ({ ...f, serviceType: nextType }));
    // Only reset the rate if it's still sitting at the previous service's
    // sample rate — don't clobber a rate the user already customized.
    setEstRate((r) => (r === String(cfg.sampleRate) ? String(ESTIMATE_CONFIG[nextType].sampleRate) : r));
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.customerName.trim() || !form.address.trim()) return;
    const hasEstimate = estQty !== "" && Number(estQty) > 0;
    onSave({
      ...form,
      id: isEdit ? initial.id : uid(),
      createdAt: isEdit ? initial.createdAt : Date.now(),
      estimate: hasEstimate
        ? { quantity: Number(estQty), rate: Number(estRate), total: estTotal }
        : null,
      scheduledDate: scheduledDate || null,
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? "Edit job" : "Add job"}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>
        <form onSubmit={submit} className="modal-body">
          <label className="field">
            <span>Customer name</span>
            <input value={form.customerName} onChange={update("customerName")} placeholder="Jane Whitfield" required />
          </label>
          <label className="field">
            <span>Address</span>
            <input value={form.address} onChange={update("address")} placeholder="123 Maple St, City" required />
          </label>
          <label className="field">
            <span>Phone</span>
            <input value={form.phone} onChange={update("phone")} placeholder="(555) 555-0100" />
          </label>
          <div className="field-row">
            <label className="field">
              <span>Service type</span>
              <select value={form.serviceType} onChange={changeService}>
                {SERVICES.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Stage</span>
              <select value={form.stage} onChange={update("stage")}>
                {STAGES.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="field">
            <span>Scheduled date</span>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </label>

          <div className="estimate-block">
            <div className="estimate-block-head">
              <span className="estimate-block-title">Estimate calculator</span>
              
            </div>
            <div className="field-row">
              <label className="field">
                <span>{cfg.qtyLabel}</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={estQty}
                  onChange={(e) => setEstQty(e.target.value)}
                  placeholder="0"
                />
              </label>
              <label className="field">
                <span>{cfg.rateLabel}</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={estRate}
                  onChange={(e) => setEstRate(e.target.value)}
                />
              </label>
            </div>
            <div className="estimate-total-row">
              <span>Estimated total</span>
              <span className="estimate-total-value">{currency(estTotal)}</span>
            </div>
          </div>

          <label className="field">
            <span>Notes</span>
            <textarea value={form.notes} onChange={update("notes")} rows={3} placeholder="Job details, measurements, follow-ups..." />
          </label>

          <div className="modal-footer">
            {isEdit ? (
              <button type="button" className="btn btn-danger" onClick={() => onDelete(initial.id)}>
                <TrashIcon /> Delete
              </button>
            ) : <span />}
            <div className="modal-footer-right">
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary">{isEdit ? "Save changes" : "Add job"}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------- Views -------------------------------- */

function BoardView({ jobs, onOpen }) {
  return (
    <div className="board">
      {STAGES.map((stage) => {
        const stageJobs = jobs.filter((j) => j.stage === stage.id);
        return (
          <div className="board-col" key={stage.id}>
            <div className="board-col-head" style={{ "--stage-color": stage.accent }}>
              <span className="board-col-dot" />
              <span className="board-col-title">{stage.label}</span>
              <span className="board-col-count">{stageJobs.length}</span>
            </div>
            <div className="board-col-body">
              {stageJobs.length === 0 ? (
                <div className="empty-col">No matching jobs.</div>
              ) : (
                stageJobs
                  .sort((a, b) => b.createdAt - a.createdAt)
                  .map((job) => <JobCard key={job.id} job={job} onOpen={onOpen} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ListView({ jobs, onOpen }) {
  return (
    <div className="list-wrap">
      <table className="list-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Address</th>
            <th>Phone</th>
            <th>Service</th>
            <th>Stage</th>
            <th>Estimate</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {jobs.length === 0 ? (
            <tr>
              <td colSpan={7} className="empty-row">No jobs match your search or filters.</td>
            </tr>
          ) : (
            jobs
              .slice()
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((job) => {
                const stage = stageMeta(job.stage);
                const svc = serviceMeta(job.serviceType);
                const Icon = SERVICE_ICON[job.serviceType];
                return (
                  <tr key={job.id} className="list-row" onClick={() => onOpen(job)}>
                    <td className="list-name">{job.customerName}</td>
                    <td className="mono">{job.address}</td>
                    <td className="mono">{job.phone}</td>
                    <td>
                      <span className="svc-tag" style={{ "--svc-color": svc.accent }}>
                        <Icon size={13} /> {svc.label}
                      </span>
                    </td>
                    <td>
                      <span className="stage-pill" style={{ "--stage-color": stage.accent }}>{stage.label}</span>
                    </td>
                    <td className="mono">{job.estimate?.total ? currency(job.estimate.total) : "—"}</td>
                    <td className="list-notes">{job.notes}</td>
                  </tr>
                );
              })
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------ Dashboard -------------------------------- */

function ScheduledThisWeekView({ jobs, onOpen }) {
  const { start, end } = getThisWeekRange();
  const rangeLabel = `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  const thisWeek = jobs
    .filter((j) => (j.stage === "scheduled" || j.stage === "in_progress") && isThisWeek(j.scheduledDate))
    .sort((a, b) => parseLocalDate(a.scheduledDate) - parseLocalDate(b.scheduledDate));

  return (
    <div className="dashboard">
      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">Scheduled this week</span>
          <span className="panel-sub mono">{rangeLabel}</span>
        </div>
        {thisWeek.length === 0 ? (
          <div className="empty-col">Nothing scheduled or in progress this week.</div>
        ) : (
          <div className="week-list">
            {thisWeek.map((job) => {
              const stage = stageMeta(job.stage);
              const svc = serviceMeta(job.serviceType);
              const Icon = SERVICE_ICON[job.serviceType];
              return (
                <button
                  key={job.id}
                  className="week-row"
                  style={{ "--stage-color": stage.accent }}
                  onClick={() => onOpen(job)}
                >
                  <div className="week-row-date">
                    <span className="week-row-day">{parseLocalDate(job.scheduledDate).toLocaleDateString("en-US", { weekday: "short" })}</span>
                    <span className="week-row-daynum">{parseLocalDate(job.scheduledDate).getDate()}</span>
                  </div>
                  <div className="week-row-main">
                    <div className="week-row-top">
                      <span className="week-row-name">{job.customerName}</span>
                      <span className="stage-pill" style={{ "--stage-color": stage.accent }}>{stage.label}</span>
                    </div>
                    <div className="week-row-address mono">{job.address}</div>
                  </div>
                  <span className="svc-tag" style={{ "--svc-color": svc.accent }}>
                    <Icon size={13} /> {svc.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* --------------------------------- App ---------------------------------- */

export default function App() {
  const [jobs, setJobs] = useState(SEED_JOBS);
  const [view, setView] = useState("board"); // "board" | "list" | "dashboard"
  const [activeJob, setActiveJob] = useState(null); // job being edited, or {} for new
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterService, setFilterService] = useState("all");
  const [filterStage, setFilterStage] = useState("all");

  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    const stored = window.localStorage.getItem("heptt-theme");
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem("heptt-theme", theme);
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute("content", theme === "dark" ? "#15181B" : "#F6F4EF");
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const openNew = () => {
    setActiveJob(null);
    setShowForm(true);
  };
  const openEdit = (job) => {
    setActiveJob(job);
    setShowForm(true);
  };
  const closeForm = () => setShowForm(false);

  const saveJob = (job) => {
    setJobs((prev) => {
      const exists = prev.some((j) => j.id === job.id);
      return exists ? prev.map((j) => (j.id === job.id ? job : j)) : [...prev, job];
    });
    setShowForm(false);
  };
  const deleteJob = (id) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
    setShowForm(false);
  };

  const stageCounts = useMemo(() => {
    const counts = {};
    STAGES.forEach((s) => (counts[s.id] = 0));
    jobs.forEach((j) => (counts[j.stage] = (counts[j.stage] || 0) + 1));
    return counts;
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter((j) => {
      if (filterService !== "all" && j.serviceType !== filterService) return false;
      if (filterStage !== "all" && j.stage !== filterStage) return false;
      if (q && !`${j.customerName} ${j.address}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [jobs, search, filterService, filterStage]);

  const hasActiveFilters = search.trim() !== "" || filterService !== "all" || filterStage !== "all";
  const clearFilters = () => {
    setSearch("");
    setFilterService("all");
    setFilterStage("all");
  };

  return (
    <div className="app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');

        :root {
          --bg: #F6F4EF;
          --surface: #FFFFFF;
          --surface-2: #F1EDE4;
          --surface-hover: #F5F1E8;
          --border: #E1DBCD;
          --border-strong: #CFC6B3;
          --ink: #21252A;
          --ink-soft: #5B6570;
          --ink-faint: #8B9299;
          --accent: #E8601C;
          --accent-hover: #D1550F;
          --accent-ink: #FFFFFF;
          --warn-bg: #FBEDE7;
          --warn-ink: #B3401F;
          --warn-border: #E9C9BA;
          --radius: 8px;

          --stage-lead: #7C8A96;
          --stage-estimate-sent: #3B7EA1;
          --stage-scheduled: #C0762A;
          --stage-in-progress: #E8601C;
          --stage-completed: #2F7A4D;

          --svc-window: #3B7EA1;
          --svc-door: #8B5A2B;
          --svc-siding: #5B6570;
          --svc-gutter: #C0762A;

          --shadow-sm: 0 1px 2px rgba(30,26,20,0.05), 0 1px 1px rgba(30,26,20,0.04);
          --shadow-md: 0 6px 16px rgba(30,26,20,0.08), 0 2px 5px rgba(30,26,20,0.05);
          --shadow-lg: 0 18px 40px rgba(30,26,20,0.16), 0 6px 14px rgba(30,26,20,0.08);
          color-scheme: light;
        }

        [data-theme="dark"] {
          --bg: #15181B;
          --surface: #1D2125;
          --surface-2: #262A2F;
          --surface-hover: #2A2F35;
          --border: #33383F;
          --border-strong: #454B53;
          --ink: #EEEBE3;
          --ink-soft: #9CA4AC;
          --ink-faint: #6D747C;
          --accent: #FF7A3D;
          --accent-hover: #FF9260;
          --accent-ink: #201002;
          --warn-bg: rgba(255,122,61,0.14);
          --warn-ink: #FF9A6B;
          --warn-border: rgba(255,122,61,0.35);

          --stage-lead: #9FAAB3;
          --stage-estimate-sent: #5FA3CC;
          --stage-scheduled: #E0954A;
          --stage-in-progress: #FF7A3D;
          --stage-completed: #4FA872;

          --svc-window: #5FA3CC;
          --svc-door: #C79564;
          --svc-siding: #9CA4AC;
          --svc-gutter: #E0954A;

          --shadow-sm: 0 1px 2px rgba(0,0,0,0.35), 0 1px 1px rgba(0,0,0,0.25);
          --shadow-md: 0 8px 20px rgba(0,0,0,0.4), 0 3px 8px rgba(0,0,0,0.3);
          --shadow-lg: 0 22px 46px rgba(0,0,0,0.5), 0 8px 18px rgba(0,0,0,0.35);
          color-scheme: dark;
        }

        * { box-sizing: border-box; }
        *, *::before, *::after {
          transition: background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
        }
        .app {
          font-family: 'Inter', system-ui, sans-serif;
          background: var(--bg);
          color: var(--ink);
          min-height: 100vh;
          padding: 28px 32px 64px;
        }
        .mono { font-family: 'IBM Plex Mono', monospace; font-size: 12.5px; color: var(--ink-soft); }

        .header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 22px;
          flex-wrap: wrap;
        }
        .header-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .brand-mark {
          flex-shrink: 0;
          color: var(--ink);
        }
        .header-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          letter-spacing: 0.01em;
          font-size: 34px;
          line-height: 1;
          margin: 0;
        }
        .header-title span { color: var(--accent); }
        .header-sub {
          margin: 6px 0 0;
          color: var(--ink-soft);
          font-size: 13.5px;
        }
        .header-actions { display: flex; gap: 10px; align-items: center; }
        .header-actions-row { display: flex; gap: 10px; align-items: center; }

        .theme-toggle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--ink-soft);
          cursor: pointer;
          flex-shrink: 0;
        }
        .theme-toggle:hover { background: var(--surface-hover); color: var(--ink); border-color: var(--border-strong); }

        .segmented {
          display: inline-flex;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 3px;
        }
        .segmented button {
          border: none;
          background: transparent;
          padding: 7px 16px;
          border-radius: 999px;
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          font-size: 13px;
          color: var(--ink-soft);
          cursor: pointer;
        }
        .segmented button.active {
          background: var(--accent);
          color: var(--accent-ink);
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 7px;
          border: 1px solid transparent;
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          font-size: 13.5px;
          padding: 9px 16px;
          cursor: pointer;
        }
        .btn-primary { background: var(--accent); color: var(--accent-ink); box-shadow: var(--shadow-sm); }
        .btn-primary:hover { background: var(--accent-hover); box-shadow: var(--shadow-md); }
        .btn-ghost { background: transparent; color: var(--ink-soft); border-color: var(--border); }
        .btn-ghost:hover { background: var(--surface-hover); }
        .btn-danger { background: transparent; color: var(--warn-ink); border-color: var(--warn-border); }
        .btn-danger:hover { background: var(--warn-bg); }
        .icon-btn {
          border: none; background: transparent; cursor: pointer; color: var(--ink-soft);
          padding: 4px; border-radius: 6px; display: flex;
        }
        .icon-btn:hover { background: var(--surface-hover); color: var(--ink); }

        .stage-strip {
          display: flex;
          gap: 10px;
          margin-bottom: 22px;
          flex-wrap: wrap;
        }
        .stage-chip {
          display: flex; align-items: center; gap: 8px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-left: 3px solid var(--stage-color);
          border-radius: 6px;
          padding: 8px 14px;
          font-size: 13px;
          box-shadow: var(--shadow-sm);
        }
        .stage-chip b { font-family: 'Barlow Condensed', sans-serif; font-size: 17px; font-weight: 600; }

        /* Filter bar */
        .filter-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }
        .search-field {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 7px;
          padding: 8px 12px;
          color: var(--ink-soft);
          flex: 1;
          min-width: 200px;
        }
        .search-field input {
          border: none;
          outline: none;
          background: transparent;
          font-family: 'Inter', sans-serif;
          font-size: 13.5px;
          color: var(--ink);
          width: 100%;
        }
        .filter-bar select {
          font-family: 'Inter', sans-serif;
          font-size: 13.5px;
          color: var(--ink);
          border: 1px solid var(--border);
          border-radius: 7px;
          padding: 8px 10px;
          background: var(--surface);
        }
        .filter-bar select:focus, .search-field:focus-within {
          outline: 2px solid var(--accent);
          outline-offset: 1px;
        }
        .filter-count {
          margin-left: auto;
          font-size: 11.5px;
          color: var(--ink-soft);
          white-space: nowrap;
        }

        /* Board */
        .board {
          display: grid;
          grid-template-columns: repeat(5, minmax(220px, 1fr));
          gap: 14px;
          overflow-x: auto;
        }
        .board-col {
          background: var(--surface-2);
          border-radius: 10px;
          padding: 10px;
          min-height: 200px;
        }
        .board-col-head {
          display: flex; align-items: center; gap: 8px;
          padding: 6px 6px 12px;
        }
        .board-col-dot {
          width: 9px; height: 9px; border-radius: 50%;
          background: var(--stage-color);
          flex-shrink: 0;
        }
        .board-col-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 16.5px;
          letter-spacing: 0.01em;
        }
        .board-col-count {
          margin-left: auto;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11.5px;
          color: var(--ink-soft);
          background: rgba(0,0,0,0.05);
          border-radius: 999px;
          padding: 2px 8px;
        }
        .board-col-body { display: flex; flex-direction: column; gap: 9px; }
        .empty-col {
          font-size: 12.5px; color: var(--ink-soft);
          border: 1px dashed var(--border);
          border-radius: 7px;
          padding: 14px 10px;
          text-align: center;
        }

        .job-card {
          text-align: left;
          background: var(--surface);
          border: 1px solid var(--border);
          border-left: 3px solid var(--stage-color);
          border-radius: 7px;
          padding: 11px 12px;
          cursor: pointer;
          font-family: inherit;
          color: inherit;
          display: block;
          width: 100%;
        }
        .job-card:hover { box-shadow: var(--shadow-md); border-color: var(--border-strong); transform: translateY(-1px); }
        .job-card-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
        .estimate-badge {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          font-weight: 500;
          color: var(--ink);
        }
        .job-card-name {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 16px;
        }
        .job-card-address, .job-card-phone { margin-top: 2px; }
        .job-card-date {
          display: inline-block;
          margin-top: 7px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11.5px;
          font-weight: 500;
          color: var(--stage-color);
          background: color-mix(in srgb, var(--stage-color) 16%, var(--surface));
          border-radius: 5px;
          padding: 2px 7px;
        }
        .job-card-notes {
          margin-top: 7px;
          font-size: 12.5px;
          color: var(--ink-soft);
          border-top: 1px solid var(--border);
          padding-top: 7px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .svc-tag {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11.5px; font-weight: 500;
          color: var(--svc-color);
          background: color-mix(in srgb, var(--svc-color) 16%, var(--surface));
          border-radius: 999px;
          padding: 3px 9px 3px 7px;
        }
        .stage-pill {
          display: inline-flex; align-items: center;
          font-size: 12px; font-weight: 500;
          color: var(--stage-color);
          border: 1px solid var(--stage-color);
          border-radius: 999px;
          padding: 3px 10px;
        }

        /* Dashboard */
        .dashboard { display: flex; flex-direction: column; gap: 16px; }
        .panel {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 16px 18px 18px;
        }
        .panel-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 14px;
          flex-wrap: wrap;
        }
        .panel-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 19px;
          letter-spacing: 0.01em;
        }
        .panel-sub { color: var(--ink-soft); font-size: 12px; }
        .week-list { display: flex; flex-direction: column; gap: 8px; }
        .week-row {
          display: flex;
          align-items: center;
          gap: 14px;
          width: 100%;
          text-align: left;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-left: 3px solid var(--stage-color);
          border-radius: 7px;
          padding: 10px 14px;
          cursor: pointer;
          font-family: inherit;
          color: inherit;
        }
        .week-row:hover { box-shadow: var(--shadow-md); border-color: var(--border-strong); }
        .week-row-date {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 46px;
          flex-shrink: 0;
          color: var(--stage-color);
        }
        .week-row-day {
          font-size: 10.5px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          font-weight: 600;
        }
        .week-row-daynum {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 22px;
          font-weight: 700;
          line-height: 1;
        }
        .week-row-main { flex: 1; min-width: 0; }
        .week-row-top { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .week-row-name {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 16px;
        }
        .week-row-address { margin-top: 2px; }

        /* List */
        .list-wrap {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px;
          overflow: hidden;
          box-shadow: var(--shadow-sm);
        }
        .list-table { width: 100%; border-collapse: collapse; }
        .list-table thead th {
          text-align: left;
          font-size: 11.5px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--ink-soft);
          font-weight: 600;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
          background: var(--surface-2);
        }
        .list-row { border-bottom: 1px solid var(--border); cursor: pointer; }
        .list-row:last-child { border-bottom: none; }
        .list-row:hover { background: var(--surface-hover); }
        .list-row td { padding: 12px 16px; vertical-align: top; font-size: 13.5px; }
        .list-name { font-family: 'Barlow Condensed', sans-serif; font-weight: 600; font-size: 16px; }
        .list-notes { color: var(--ink-soft); max-width: 260px; }
        .empty-row { text-align: center; color: var(--ink-soft); padding: 30px !important; }

        /* Modal */
        .modal-backdrop {
          position: fixed; inset: 0;
          background: rgba(15,16,18,0.5);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          z-index: 50;
        }
        .modal {
          background: var(--surface);
          border-radius: 12px;
          width: 100%; max-width: 480px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--border);
        }
        .modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 20px;
          border-bottom: 1px solid var(--border);
        }
        .modal-header h2 {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 22px; margin: 0; font-weight: 600;
        }
        .modal-body { padding: 18px 20px; display: flex; flex-direction: column; gap: 14px; }
        .field { display: flex; flex-direction: column; gap: 5px; font-size: 13px; color: var(--ink-soft); flex: 1; }
        .field-row { display: flex; gap: 12px; }
        .field input, .field select, .field textarea {
          font-family: 'Inter', sans-serif;
          font-size: 13.5px;
          color: var(--ink);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 9px 10px;
          background: var(--surface-2);
          width: 100%;
        }
        .field input:focus, .field select:focus, .field textarea:focus {
          outline: 2px solid var(--accent);
          outline-offset: 1px;
        }
        .field textarea { resize: vertical; font-family: inherit; }

        .estimate-block {
          border: 1px solid var(--border);
          background: var(--surface-2);
          border-radius: 8px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .estimate-block-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
        }
        .estimate-block-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 15.5px;
          letter-spacing: 0.01em;
        }
        .sample-rate-tag {
          font-size: 10.5px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--warn-ink);
          background: var(--warn-bg);
          border-radius: 999px;
          padding: 3px 8px;
        }
        .estimate-total-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          border-top: 1px dashed var(--border);
          padding-top: 9px;
          font-size: 13px;
          color: var(--ink-soft);
        }
        .estimate-total-value {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 22px;
          color: var(--ink);
        }
        .modal-footer {
          display: flex; align-items: center; justify-content: space-between;
          margin-top: 4px;
        }
        .modal-footer-right { display: flex; gap: 8px; }

        /* ------------------------- Responsive layout ------------------------- */

        /* Keep the desktop board compact, but let the columns become a
           horizontal kanban on tablets/phones instead of forcing a very tall
           single-column board. */
        @media (max-width: 980px) {
          .app { padding: 22px 20px 48px; }
          .board {
            grid-template-columns: repeat(5, minmax(230px, 1fr));
            overflow-x: auto;
            padding-bottom: 8px;
            scroll-snap-type: x proximity;
            -webkit-overflow-scrolling: touch;
          }
          .board-col { scroll-snap-align: start; }
          .list-wrap {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          .list-table { min-width: 860px; }
        }

        @media (max-width: 700px) {
          .app {
            padding: 16px 12px 40px;
          }

          .header {
            align-items: stretch;
            gap: 14px;
            margin-bottom: 16px;
          }

          .header-title {
            font-size: clamp(28px, 9vw, 34px);
            line-height: 0.98;
          }

          .header-sub {
            font-size: 12.5px;
            line-height: 1.45;
            margin-top: 7px;
          }

          .header-actions {
            width: 100%;
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
          }

          .segmented {
            width: 100%;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
          }

          .segmented button {
            min-height: 40px;
            padding: 8px 6px;
            font-size: 12px;
          }

          .header-actions-row {
            display: flex;
            gap: 8px;
            align-items: center;
          }

          .header-actions-row > .btn {
            flex: 1;
            justify-content: center;
            min-height: 42px;
          }

          .stage-strip {
            flex-wrap: nowrap;
            overflow-x: auto;
            margin: 0 -12px 16px;
            padding: 2px 12px 5px;
            gap: 8px;
            -webkit-overflow-scrolling: touch;
          }

          .stage-chip {
            flex: 0 0 auto;
            padding: 8px 11px;
            font-size: 12px;
          }

          .filter-bar {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-bottom: 14px;
          }

          .search-field {
            grid-column: 1 / -1;
            min-width: 0;
            min-height: 42px;
          }

          .filter-bar select,
          .filter-bar .btn {
            width: 100%;
            min-height: 42px;
          }

          .filter-count {
            grid-column: 1 / -1;
            margin-left: 0;
            text-align: right;
          }

          /* The kanban remains a real kanban on small screens: swipe
             horizontally between stages rather than squeezing five columns. */
          .board {
            grid-template-columns: repeat(5, minmax(250px, 78vw));
            gap: 10px;
            margin-right: -12px;
            padding-right: 12px;
          }

          .board-col {
            min-height: 180px;
            padding: 9px;
          }

          .board-col-title {
            font-size: 16px;
          }

          .job-card {
            min-height: 44px;
            padding: 12px;
          }

          .job-card-name {
            font-size: 16px;
          }

          /* Replace the wide data table with readable mobile cards. */
          .list-wrap {
            overflow: visible;
            border: none;
            background: transparent;
            box-shadow: none;
          }

          .list-table,
          .list-table tbody {
            display: block;
            width: 100%;
            min-width: 0;
          }

          .list-table thead {
            display: none;
          }

          .list-row {
            display: block;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 10px;
            margin-bottom: 9px;
            padding: 8px 12px;
            box-shadow: var(--shadow-sm);
          }

          .list-row:hover {
            background: var(--surface);
          }

          .list-row td {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            padding: 7px 0;
            border: 0;
            font-size: 13px;
            min-width: 0;
          }

          .list-row td::before {
            content: "";
            flex: 0 0 72px;
            color: var(--ink-soft);
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }

          .list-row td:nth-child(1)::before { content: "Customer"; }
          .list-row td:nth-child(2)::before { content: "Address"; }
          .list-row td:nth-child(3)::before { content: "Phone"; }
          .list-row td:nth-child(4)::before { content: "Service"; }
          .list-row td:nth-child(5)::before { content: "Stage"; }
          .list-row td:nth-child(6)::before { content: "Estimate"; }
          .list-row td:nth-child(7)::before { content: "Notes"; }

          .list-row .list-name {
            font-size: 17px;
          }

          .list-row .list-notes {
            max-width: none;
            line-height: 1.45;
          }

          .empty-row {
            display: block !important;
            padding: 24px 12px !important;
            background: var(--surface);
            border: 1px dashed var(--border) !important;
            border-radius: 8px;
          }

          .empty-row::before {
            display: none;
          }

          .panel {
            padding: 14px;
          }

          .panel-head {
            align-items: flex-start;
          }

          .week-row {
            align-items: flex-start;
            gap: 10px;
            padding: 10px;
          }

          .week-row-date {
            width: 38px;
          }

          .week-row-name {
            font-size: 15px;
          }

          .week-row-address {
            white-space: normal;
            overflow-wrap: anywhere;
          }

          .week-row > .svc-tag {
            display: none;
          }

          /* Mobile modal: use almost the whole viewport and keep the footer
             reachable without horizontal squeezing. */
          .modal-backdrop {
            align-items: flex-end;
            padding: 0;
          }

          .modal {
            max-width: none;
            max-height: 94dvh;
            border-radius: 14px 14px 0 0;
          }

          .modal-header {
            padding: 15px 16px;
            position: sticky;
            top: 0;
            z-index: 2;
            background: var(--surface);
          }

          .modal-body {
            padding: 16px;
            gap: 13px;
          }

          .field-row {
            flex-direction: column;
            gap: 13px;
          }

          .field input,
          .field select,
          .field textarea {
            font-size: 16px; /* prevents iOS Safari auto-zoom */
            min-height: 44px;
          }

          .field textarea {
            min-height: 88px;
          }

          .estimate-block {
            padding: 11px;
          }

          .estimate-block .field-row {
            gap: 10px;
          }

          .estimate-total-value {
            font-size: 21px;
          }

          .modal-footer {
            flex-direction: column-reverse;
            align-items: stretch;
            gap: 10px;
            padding-top: 2px;
          }

          .modal-footer > .btn,
          .modal-footer-right,
          .modal-footer-right .btn {
            width: 100%;
          }

          .modal-footer-right {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }

          .modal-footer .btn {
            min-height: 44px;
            justify-content: center;
          }
        }

        @media (max-width: 380px) {
          .app {
            padding-left: 10px;
            padding-right: 10px;
          }

          .stage-strip {
            margin-left: -10px;
            margin-right: -10px;
            padding-left: 10px;
            padding-right: 10px;
          }

          .filter-bar {
            grid-template-columns: 1fr;
          }

          .search-field,
          .filter-count {
            grid-column: auto;
          }

          .filter-count {
            text-align: left;
          }

          .segmented button {
            font-size: 11px;
          }

          .board {
            grid-template-columns: repeat(5, minmax(235px, 84vw));
          }

          .list-row td::before {
            flex-basis: 64px;
          }

          .modal-footer-right {
            grid-template-columns: 1fr;
          }
        }

        /* Respect devices that prefer reduced motion. */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            scroll-behavior: auto !important;
            transition: none !important;
          }
        }
      `}</style>

      <div className="header">
        <div className="header-brand">
          <BrandMark />
          <div>
            <h1 className="header-title">Home Exterior <span>Pipeline</span> Tracker</h1>
            <p className="header-sub">Windows · Doors · Siding · Seamless Gutters — job pipeline at a glance</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="segmented">
            <button className={view === "board" ? "active" : ""} onClick={() => setView("board")}>Board</button>
            <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}>List</button>
            <button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}>Dashboard</button>
          </div>
          <div className="header-actions-row">
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>
            <button className="btn btn-primary" onClick={openNew}>
              <PlusIcon /> Add job
            </button>
          </div>
        </div>
      </div>

      <div className="stage-strip">
        {STAGES.map((s) => (
          <div className="stage-chip" key={s.id} style={{ "--stage-color": s.accent }}>
            <b>{stageCounts[s.id]}</b> {s.label}
          </div>
        ))}
      </div>

      <div className="filter-bar">
        <div className="search-field">
          <SearchIcon />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer or address..."
          />
        </div>
        <select value={filterService} onChange={(e) => setFilterService(e.target.value)}>
          <option value="all">All services</option>
          {SERVICES.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <select value={filterStage} onChange={(e) => setFilterStage(e.target.value)}>
          <option value="all">All stages</option>
          {STAGES.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        {hasActiveFilters ? (
          <button type="button" className="btn btn-ghost" onClick={clearFilters}>
            <CloseIcon /> Clear
          </button>
        ) : null}
        <span className="filter-count mono">
          {filteredJobs.length} of {jobs.length} jobs
        </span>
      </div>

      {view === "board" ? (
        <BoardView jobs={filteredJobs} onOpen={openEdit} />
      ) : view === "list" ? (
        <ListView jobs={filteredJobs} onOpen={openEdit} />
      ) : (
        <ScheduledThisWeekView jobs={filteredJobs} onOpen={openEdit} />
      )}

      {showForm && (
        <JobForm
          initial={activeJob}
          onSave={saveJob}
          onDelete={deleteJob}
          onClose={closeForm}
        />
      )}
    </div>
  );
}
