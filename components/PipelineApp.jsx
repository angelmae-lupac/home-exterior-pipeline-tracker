"use client";

import React, { useState, useMemo, useEffect } from "react";
import { STAGES, SERVICES, ESTIMATE_CONFIG, stageMeta, serviceMeta, currency } from "@/lib/constants";
import { parseLocalDate, formatShortDate, getThisWeekRange, isThisWeek } from "@/lib/dates";
import { createJob, updateJob, deleteJob as deleteJobAction } from "@/app/actions/jobs";
import { toDbData, toJobViewModel } from "@/lib/jobs";

/**
 * Home Exterior Job Pipeline Tracker
 * ------------------------------------------------------------
 * Data model (UI shape — see lib/jobs.js for the DB <-> UI mapping)
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

const uid = () => Math.random().toString(36).slice(2, 10);

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

export default function PipelineApp({ initialJobs }) {
  const [jobs, setJobs] = useState(initialJobs);
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

  // Optimistic local update for instant UI feedback, then persist to the
  // database via the matching Server Action. New jobs get a temporary local
  // id that's swapped for the real DB id once the create resolves.
  const saveJob = async (job) => {
    const isEdit = jobs.some((j) => j.id === job.id);
    const dbData = toDbData(job);
    setShowForm(false);

    if (isEdit) {
      setJobs((prev) => prev.map((j) => (j.id === job.id ? job : j)));
      await updateJob(job.id, dbData);
    } else {
      const tempId = job.id;
      setJobs((prev) => [...prev, job]);
      const created = await createJob(dbData);
      const mapped = toJobViewModel(created);
      setJobs((prev) => prev.map((j) => (j.id === tempId ? mapped : j)));
    }
  };

  const deleteJob = async (id) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
    setShowForm(false);
    await deleteJobAction(id);
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
