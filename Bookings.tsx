import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Search, UserX } from "lucide-react";
import { BOOKING_STATUSES, bedroomShort } from "../../../shared/constants";
import type { Ctx } from "../App";
import { api, type Booking } from "../api";
import { addDays, endOfMonth, fmtDate, fmtTime, fromKey, startOfMonth, startOfWeek, toKey, todayKey } from "../dates";
import { Button, Card, Empty, ErrorNote, Input, STATUS_DOT, SectionTitle, Select, Spinner, StatusBadge, Tag } from "../ui";
import BookingEditor from "./BookingEditor";

type View = "list" | "day" | "week" | "month";
const dayOf = (b: Booking) => b.scheduledDate ?? b.preferredDate;

export function BookingRow({ b, onOpen, showContact = true }: { b: Booking; onOpen: () => void; showContact?: boolean }) {
  const tentative = !b.scheduledDate;
  return (
    <button onClick={onOpen} className="w-full text-left p-4 sm:p-5 hover:bg-[var(--surface-soft)] transition flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
      <div className="sm:w-[150px] shrink-0">
        <div className={`text-[13px] font-semibold ${tentative ? "opacity-60" : ""}`}>{fmtDate(dayOf(b))}</div>
        <div className="text-[12px] opacity-60">
          {tentative ? (b.preferredDate ? "Requested date" : "No date yet") : fmtTime(b.scheduledTime) || "Time TBD"}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-[14px]">{b.customerName}</span>
          <StatusBadge status={b.status} />
          {b.requestType === "quote" && <Tag tone="gold">Quote</Tag>}
          <Tag>{bedroomShort(b.bedrooms)}</Tag>
        </div>
        <div className="mt-1 text-[13px] opacity-70 truncate">{b.propertyAddress || "No address yet"}</div>
        {showContact && b.customerPhone && <div className="text-[12px] opacity-50">{b.customerPhone}</div>}
      </div>
      <div className="sm:w-[180px] shrink-0 text-[12px]">
        {b.assigned && b.assigned.length ? (
          <span className="opacity-80">{b.assigned.map((a) => a.name).join(", ")}</span>
        ) : b.status !== "completed" && b.status !== "cancelled" ? (
          <span className="inline-flex items-center gap-1 text-[var(--gold-dark)]">
            <UserX size={13} /> Unassigned
          </span>
        ) : null}
      </div>
    </button>
  );
}

function Chip({ b, onOpen }: { b: Booking; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className={`w-full text-left px-1.5 py-1 text-[11px] leading-tight border-l-2 bg-[var(--surface-soft)] hover:bg-[var(--sand-2)] dark:hover:bg-white/10 truncate ${!b.scheduledDate ? "opacity-60 border-dashed" : ""}`}
      style={{ borderLeftColor: "currentColor" }}
      title={`${b.customerName} — ${b.propertyAddress}`}
    >
      <span className={`inline-block h-1.5 w-1.5 rounded-full mr-1 align-middle ${STATUS_DOT[b.status]}`} />
      {b.scheduledTime ? fmtTime(b.scheduledTime).replace(":00", "") + " " : ""}
      {b.customerName}
    </button>
  );
}

export default function Bookings({ ctx }: { ctx: Ctx }) {
  const initialView = (sessionStorage.getItem("bk-view") as View) || "week";
  const [view, setView] = useState<View>(initialView);
  const [cursor, setCursor] = useState(() => fromKey(todayKey()));
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [rows, setRows] = useState<Booking[] | null>(null);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q), 300);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => sessionStorage.setItem("bk-view", view), [view]);

  const range = useMemo(() => {
    if (view === "day") return { from: toKey(cursor), to: toKey(cursor) };
    if (view === "week") {
      const s = startOfWeek(cursor);
      return { from: toKey(s), to: toKey(addDays(s, 6)) };
    }
    if (view === "month") {
      const s = startOfWeek(startOfMonth(cursor));
      const e = addDays(startOfWeek(endOfMonth(cursor)), 6);
      return { from: toKey(s), to: toKey(e) };
    }
    return null;
  }, [view, cursor]);

  const load = useCallback(async () => {
    const p = new URLSearchParams();
    if (range) {
      p.set("from", range.from);
      p.set("to", range.to);
    }
    if (status) p.set("status", status);
    else if (view === "list") p.set("status", "active");
    if (qDebounced) p.set("q", qDebounced);
    try {
      const r = await api<{ bookings: Booking[] }>(`/api/portal/bookings?${p}`);
      setRows(r.bookings);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load bookings.");
    }
  }, [range, status, qDebounced, view]);

  useEffect(() => {
    setRows(null);
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  const open = (b: Booking) => ctx.navigate(`/booking/${b.id}`);
  const shift = (dir: number) => {
    if (view === "day") setCursor(addDays(cursor, dir));
    else if (view === "week") setCursor(addDays(cursor, 7 * dir));
    else setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + dir, 1));
  };
  const byDay = useMemo(() => {
    const m = new Map<string, Booking[]>();
    for (const b of rows ?? []) {
      const k = dayOf(b);
      if (!k) continue;
      m.set(k, [...(m.get(k) ?? []), b]);
    }
    return m;
  }, [rows]);

  const label =
    view === "day"
      ? cursor.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })
      : view === "week"
        ? `${fmtDate(range!.from, { month: "short", day: "numeric" })} – ${fmtDate(range!.to, { month: "short", day: "numeric", year: "numeric" })}`
        : cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <div>
      <SectionTitle
        eyebrow="Booking management"
        title="Bookings"
        action={
          <Button onClick={() => setCreating(view === "day" ? toKey(cursor) : "")}>
            <Plus size={14} /> New booking
          </Button>
        }
      />

      <Card className="p-3 sm:p-4 flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
        <div className="grid grid-cols-4 border border-[var(--line-strong)] w-full lg:w-auto" role="tablist" aria-label="Calendar view">
          {(["list", "day", "week", "month"] as View[]).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={`h-10 px-4 text-[11px] tracking-[0.14em] uppercase font-semibold ${view === v ? "bg-[var(--navy)] text-white dark:bg-[var(--gold)] dark:text-[#0a2342]" : "hover:bg-[var(--surface-soft)]"}`}
            >
              {v}
            </button>
          ))}
        </div>
        {view !== "list" && (
          <div className="flex items-center gap-2 justify-between">
            <button onClick={() => shift(-1)} className="h-10 w-10 grid place-items-center border border-[var(--line-strong)] hover:bg-[var(--surface-soft)]" aria-label="Previous">
              <ChevronLeft size={16} />
            </button>
            <div className="text-[14px] font-medium min-w-[180px] text-center">{label}</div>
            <button onClick={() => shift(1)} className="h-10 w-10 grid place-items-center border border-[var(--line-strong)] hover:bg-[var(--surface-soft)]" aria-label="Next">
              <ChevronRight size={16} />
            </button>
            <Button variant="outline" size="sm" onClick={() => setCursor(fromKey(todayKey()))}>Today</Button>
          </div>
        )}
        <div className="flex gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, address, phone" className="pl-9 h-10" aria-label="Search bookings" />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 w-[150px]" aria-label="Filter by status">
            <option value="">{view === "list" ? "Open jobs" : "All statuses"}</option>
            <option value="unscheduled">Needs a date</option>
            {BOOKING_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </Select>
        </div>
      </Card>

      <div className="mt-4 flex flex-wrap gap-4 text-[11px] opacity-70">
        {BOOKING_STATUSES.map((s) => (
          <span key={s.value} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${STATUS_DOT[s.value]}`} /> {s.label}
          </span>
        ))}
        <span className="opacity-70">Faded = customer’s requested date, not yet scheduled</span>
      </div>

      <div className="mt-4">
        <ErrorNote>{error}</ErrorNote>
        {rows === null ? (
          <Spinner />
        ) : view === "list" || view === "day" ? (
          rows.length === 0 ? (
            <Empty title={view === "day" ? "Nothing on this day" : "No bookings found"}>
              {view === "day" ? "Use “New booking” to schedule a cleaning for this date." : "New website requests and portal bookings will appear here automatically."}
            </Empty>
          ) : (
            <Card className="divide-y divide-[var(--line)]">
              {rows.map((b) => (
                <BookingRow key={b.id} b={b} onOpen={() => open(b)} />
              ))}
            </Card>
          )
        ) : view === "week" ? (
          <div className="grid grid-cols-1 md:grid-cols-7 gap-[1px] bg-[var(--line-strong)] border border-[var(--line-strong)]">
            {Array.from({ length: 7 }, (_, i) => {
              const d = addDays(startOfWeek(cursor), i);
              const k = toKey(d);
              const list = byDay.get(k) ?? [];
              const isToday = k === todayKey();
              return (
                <div key={k} className="bg-[var(--surface)] min-h-[80px] md:min-h-[260px] p-2 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <button onClick={() => (setCursor(d), setView("day"))} className={`text-[11px] tracking-[0.1em] uppercase font-semibold ${isToday ? "text-[var(--gold-dark)] dark:text-[var(--gold)]" : "opacity-70"}`}>
                      {d.toLocaleDateString(undefined, { weekday: "short" })} {d.getDate()}
                    </button>
                    <button onClick={() => setCreating(k)} className="h-6 w-6 grid place-items-center opacity-40 hover:opacity-100" aria-label={`Add booking on ${k}`}>
                      <Plus size={12} />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {list.map((b) => (
                      <Chip key={b.id} b={b} onOpen={() => open(b)} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border border-[var(--line-strong)] overflow-x-auto">
            <div className="min-w-[700px]">
              <div className="grid grid-cols-7 bg-[var(--surface-soft)] text-[10px] tracking-[0.14em] uppercase opacity-70">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="p-2">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-[1px] bg-[var(--line-strong)]">
                {(() => {
                  const start = fromKey(range!.from);
                  const days = Math.round((fromKey(range!.to).getTime() - start.getTime()) / 86400000) + 1;
                  return Array.from({ length: days }, (_, i) => {
                    const d = addDays(start, i);
                    const k = toKey(d);
                    const list = byDay.get(k) ?? [];
                    const inMonth = d.getMonth() === cursor.getMonth();
                    return (
                      <div key={k} className={`bg-[var(--surface)] min-h-[110px] p-1.5 ${inMonth ? "" : "opacity-45"}`}>
                        <button
                          onClick={() => (setCursor(d), setView("day"))}
                          className={`text-[12px] font-semibold h-6 min-w-6 px-1 ${k === todayKey() ? "bg-[var(--navy)] text-white dark:bg-[var(--gold)] dark:text-[#0a2342]" : ""}`}
                        >
                          {d.getDate()}
                        </button>
                        <div className="mt-1 space-y-1">
                          {list.slice(0, 3).map((b) => (
                            <Chip key={b.id} b={b} onOpen={() => open(b)} />
                          ))}
                          {list.length > 3 && (
                            <button onClick={() => (setCursor(d), setView("day"))} className="text-[11px] opacity-60 hover:opacity-100 px-1">
                              +{list.length - 3} more
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        )}
      </div>

      {creating !== null && (
        <BookingEditor
          defaultDate={creating || undefined}
          onClose={() => setCreating(null)}
          onSaved={(d) => {
            setCreating(null);
            ctx.toast("Booking created");
            ctx.navigate(`/booking/${d.booking.id}`);
          }}
        />
      )}
    </div>
  );
}
