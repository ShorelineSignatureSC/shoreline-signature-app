import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight, Clock, MapPin, BookOpen } from "lucide-react";
import { bedroomShort } from "../../../shared/constants";
import type { Ctx } from "../App";
import { api, type Booking } from "../api";
import { addDays, fmtDate, fmtTime, relativeDay, toKey, todayKey } from "../dates";
import { Card, Empty, ErrorNote, SectionTitle, Spinner, StatusBadge, Tag } from "../ui";

function JobCard({ b, onOpen }: { b: Booking; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="w-full text-left bg-[var(--surface)] border border-[var(--line-strong)] p-4 sm:p-5 hover:border-[var(--navy)] dark:hover:border-[var(--gold)] transition flex gap-4 items-center">
      <div className="w-[64px] shrink-0 text-center border-r border-[var(--line)] pr-4">
        <div className="text-[10px] tracking-[0.14em] uppercase opacity-60">{b.scheduledDate ? fmtDate(b.scheduledDate, { weekday: "short" }) : "TBD"}</div>
        <div className="font-display text-[26px] leading-none mt-1">{b.scheduledDate ? Number(b.scheduledDate.slice(8)) : "–"}</div>
        <div className="text-[11px] mt-1 font-semibold">{fmtTime(b.scheduledTime) || "—"}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={b.status} />
          <Tag>{bedroomShort(b.bedrooms)}</Tag>
        </div>
        <div className="mt-1.5 font-medium text-[15px] flex items-start gap-1.5">
          <MapPin size={14} className="mt-1 text-[var(--gold)] shrink-0" />
          <span className="line-clamp-2">{b.propertyAddress || "Address pending"}</span>
        </div>
        <div className="text-[12px] opacity-60 mt-0.5 truncate">{b.serviceType}{b.addOns.length ? ` + ${b.addOns.length} add-on${b.addOns.length > 1 ? "s" : ""}` : ""}</div>
      </div>
      <ChevronRight size={18} className="opacity-40 shrink-0" />
    </button>
  );
}

export default function MyJobs({ ctx }: { ctx: Ctx }) {
  const [jobs, setJobs] = useState<Booking[] | null>(null);
  const [done, setDone] = useState<Booking[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const to = toKey(addDays(new Date(), 30));
      const [a, c] = await Promise.all([
        api<{ bookings: Booking[] }>(`/api/portal/bookings?status=active`),
        api<{ bookings: Booking[] }>(`/api/portal/bookings?status=completed&from=${toKey(addDays(new Date(), -14))}&to=${to}`),
      ]);
      setJobs(a.bookings);
      setDone(c.bookings.reverse());
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your jobs.");
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  const groups = useMemo(() => {
    const t = todayKey();
    const list = jobs ?? [];
    return {
      today: list.filter((b) => b.scheduledDate === t || b.status === "in_progress"),
      upcoming: list.filter((b) => b.status !== "in_progress" && b.scheduledDate && b.scheduledDate > t),
      overdue: list.filter((b) => b.status !== "in_progress" && b.scheduledDate && b.scheduledDate < t),
      unscheduled: list.filter((b) => b.status !== "in_progress" && !b.scheduledDate),
    };
  }, [jobs]);

  const open = (b: Booking) => ctx.navigate(`/booking/${b.id}`);

  return (
    <div>
      <SectionTitle eyebrow={new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} title={`Hi${ctx.me.name ? ", " + ctx.me.name.split(" ")[0] : ""}`} />
      <ErrorNote>{error}</ErrorNote>
      {jobs === null ? (
        <Spinner />
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="text-[20px] mb-3 flex items-center gap-2">
              <Clock size={18} className="text-[var(--gold)]" /> Today
            </h2>
            {groups.today.length ? (
              <div className="space-y-3">{groups.today.map((b) => <JobCard key={b.id} b={b} onOpen={() => open(b)} />)}</div>
            ) : (
              <Empty title="No jobs assigned for today">New assignments from the owner show up here automatically.</Empty>
            )}
          </section>
          {groups.overdue.length > 0 && (
            <section>
              <h2 className="text-[20px] mb-3">Still open from earlier</h2>
              <div className="space-y-3">{groups.overdue.map((b) => <JobCard key={b.id} b={b} onOpen={() => open(b)} />)}</div>
            </section>
          )}
          <section>
            <h2 className="text-[20px] mb-3">Upcoming</h2>
            {groups.upcoming.length ? (
              <div className="space-y-3">
                {groups.upcoming.map((b) => (
                  <div key={b.id}>
                    {relativeDay(b.scheduledDate) && <div className="text-[10px] tracking-[0.16em] uppercase opacity-60 mb-1">{relativeDay(b.scheduledDate)}</div>}
                    <JobCard b={b} onOpen={() => open(b)} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] opacity-60">No upcoming jobs assigned yet.</p>
            )}
          </section>
          {groups.unscheduled.length > 0 && (
            <section>
              <h2 className="text-[20px] mb-3">Assigned — date to be confirmed</h2>
              <div className="space-y-3">{groups.unscheduled.map((b) => <JobCard key={b.id} b={b} onOpen={() => open(b)} />)}</div>
            </section>
          )}
          {done && done.length > 0 && (
            <section>
              <h2 className="text-[20px] mb-3">Recently completed</h2>
              <Card className="divide-y divide-[var(--line)]">
                {done.slice(0, 10).map((b) => (
                  <button key={b.id} onClick={() => open(b)} className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-[var(--surface-soft)]">
                    <span className="text-[13px] truncate">{b.propertyAddress}</span>
                    <span className="text-[12px] opacity-60 shrink-0">{fmtDate(b.scheduledDate)}</span>
                  </button>
                ))}
              </Card>
            </section>
          )}
          <a href="#/training" className="flex items-center justify-between gap-3 p-4 bg-[var(--navy)] text-white">
            <span className="flex items-center gap-3 text-[13px]">
              <BookOpen size={16} className="text-[var(--gold)]" /> Training videos, checklists & company policies
            </span>
            <ChevronRight size={16} />
          </a>
        </div>
      )}
    </div>
  );
}
