import { useCallback, useEffect, useState } from "react";
import { ArrowRight, CalendarDays, ClipboardList, Plus, UserX, Inbox } from "lucide-react";
import type { Ctx } from "../App";
import { api, type Booking } from "../api";
import { addDays, toKey, todayKey } from "../dates";
import { Button, Card, Empty, ErrorNote, SectionTitle, Spinner } from "../ui";
import { BookingRow } from "./Bookings";
import BookingEditor from "./BookingEditor";

type Stats = { counts: Record<string, number>; today: number; unassigned: number; unreviewedReports: number };

export default function Overview({ ctx }: { ctx: Ctx }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [today, setToday] = useState<Booking[] | null>(null);
  const [requests, setRequests] = useState<Booking[] | null>(null);
  const [upcoming, setUpcoming] = useState<Booking[] | null>(null);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const t = todayKey();
    try {
      const [s, td, rq, up] = await Promise.all([
        api<Stats>(`/api/portal/overview?today=${t}`),
        api<{ bookings: Booking[] }>(`/api/portal/bookings?from=${t}&to=${t}`),
        api<{ bookings: Booking[] }>(`/api/portal/bookings?status=pending`),
        api<{ bookings: Booking[] }>(`/api/portal/bookings?from=${toKey(addDays(new Date(), 1))}&to=${toKey(addDays(new Date(), 7))}&status=active`),
      ]);
      setStats(s);
      setToday(td.bookings.filter((b) => b.status !== "cancelled"));
      setRequests(rq.bookings);
      setUpcoming(up.bookings);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load dashboard.");
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  const open = (b: Booking) => ctx.navigate(`/booking/${b.id}`);
  const c = stats?.counts ?? {};
  const tiles = [
    { label: "Today’s cleanings", value: stats?.today, icon: CalendarDays, go: "/bookings" },
    { label: "Pending requests", value: c.pending ?? 0, icon: Inbox, go: "/bookings" },
    { label: "Scheduled", value: c.scheduled ?? 0, icon: CalendarDays, go: "/bookings" },
    { label: "In progress", value: c.in_progress ?? 0, icon: ClipboardList, go: "/bookings" },
    { label: "Completed", value: c.completed ?? 0, icon: ClipboardList, go: "/reports" },
    { label: "Needs assignment", value: stats?.unassigned, icon: UserX, go: "/bookings" },
  ];

  return (
    <div>
      <SectionTitle
        eyebrow={new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        title={`Welcome${ctx.me.name ? ", " + ctx.me.name.split(" ")[0] : ""}`}
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus size={14} /> New booking
          </Button>
        }
      />
      <ErrorNote>{error}</ErrorNote>
      {!stats ? (
        <Spinner />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-[1px] bg-[var(--line-strong)] border border-[var(--line-strong)]">
            {tiles.map((t) => (
              <button key={t.label} onClick={() => ctx.navigate(t.go)} className="bg-[var(--surface)] p-4 sm:p-5 text-left hover:bg-[var(--surface-soft)] transition">
                <t.icon size={16} className="text-[var(--gold)]" />
                <div className="mt-3 font-display text-[30px] leading-none">{t.value ?? 0}</div>
                <div className="mt-2 text-[10px] tracking-[0.14em] uppercase opacity-60">{t.label}</div>
              </button>
            ))}
          </div>
          {stats.unreviewedReports > 0 && (
            <button onClick={() => ctx.navigate("/reports")} className="mt-4 w-full text-left px-4 py-3 bg-[var(--navy)] text-white flex items-center justify-between gap-3">
              <span className="text-[13px]">
                <strong className="text-[var(--gold)]">{stats.unreviewedReports}</strong> completion report{stats.unreviewedReports > 1 ? "s" : ""} waiting for your review
              </span>
              <ArrowRight size={16} />
            </button>
          )}

          <div className="mt-8 grid xl:grid-cols-2 gap-6">
            <section>
              <h2 className="text-[20px] mb-3">Today</h2>
              {today && today.length ? (
                <Card className="divide-y divide-[var(--line)]">{today.map((b) => <BookingRow key={b.id} b={b} onOpen={() => open(b)} />)}</Card>
              ) : (
                <Empty title="No cleanings today" />
              )}
            </section>
            <section>
              <h2 className="text-[20px] mb-3">New requests & quotes</h2>
              {requests && requests.length ? (
                <Card className="divide-y divide-[var(--line)]">{requests.slice(0, 8).map((b) => <BookingRow key={b.id} b={b} onOpen={() => open(b)} />)}</Card>
              ) : (
                <Empty title="All caught up">Website booking and quote requests appear here as soon as they’re submitted.</Empty>
              )}
            </section>
            <section className="xl:col-span-2">
              <h2 className="text-[20px] mb-3">Next 7 days</h2>
              {upcoming && upcoming.length ? (
                <Card className="divide-y divide-[var(--line)]">{upcoming.map((b) => <BookingRow key={b.id} b={b} onOpen={() => open(b)} />)}</Card>
              ) : (
                <Empty title="Nothing scheduled this week yet" />
              )}
            </section>
          </div>
        </>
      )}
      {creating && (
        <BookingEditor
          onClose={() => setCreating(false)}
          onSaved={(d) => {
            setCreating(false);
            ctx.toast("Booking created");
            ctx.navigate(`/booking/${d.booking.id}`);
          }}
        />
      )}
    </div>
  );
}
