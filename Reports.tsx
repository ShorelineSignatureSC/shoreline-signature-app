import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Package } from "lucide-react";
import { REPORT_CHECKLIST } from "../../../shared/constants";
import type { Ctx } from "../App";
import { api } from "../api";
import { fmtDate, fmtDateTime } from "../dates";
import { Button, Card, Empty, ErrorNote, SectionTitle, Spinner, Tag } from "../ui";

type Row = {
  id: number;
  bookingId: number;
  checklist: string[];
  notes: string;
  issues: string;
  suppliesNeeded: string;
  reviewed: boolean;
  createdAt: string;
  staffName: string | null;
  customerName: string;
  propertyAddress: string;
  scheduledDate: string | null;
  photos: { id: number; kind: string }[];
};

export default function Reports({ ctx }: { ctx: Ctx }) {
  const [filter, setFilter] = useState<"unreviewed" | "all">("unreviewed");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await api<{ reports: Row[] }>(`/api/portal/reports${filter === "unreviewed" ? "?filter=unreviewed" : ""}`);
      setRows(r.reports);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load reports.");
    }
  }, [filter]);

  useEffect(() => {
    setRows(null);
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  const mark = async (r: Row, reviewed: boolean) => {
    try {
      await api(`/api/portal/reports/${r.id}`, { method: "PATCH", body: { reviewed } });
      ctx.toast(reviewed ? "Marked as reviewed" : "Marked as unreviewed");
      load();
    } catch (e) {
      ctx.toast(e instanceof Error ? e.message : "Could not update");
    }
  };

  return (
    <div>
      <SectionTitle
        eyebrow="Inspection & completion records"
        title="Reports"
        action={
          <div className="grid grid-cols-2 border border-[var(--line-strong)]">
            {(["unreviewed", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`h-10 px-4 text-[11px] tracking-[0.14em] uppercase font-semibold ${filter === f ? "bg-[var(--navy)] text-white dark:bg-[var(--gold)] dark:text-[#0a2342]" : ""}`}
              >
                {f === "unreviewed" ? "Needs review" : "All reports"}
              </button>
            ))}
          </div>
        }
      />
      <ErrorNote>{error}</ErrorNote>
      {rows === null ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <Empty title={filter === "unreviewed" ? "No reports waiting for review" : "No completion reports yet"}>
          Reports appear here when a team member completes a job.
        </Empty>
      ) : (
        <div className="space-y-4">
          {rows.map((r) => {
            const missing = REPORT_CHECKLIST.filter((c) => !r.checklist.includes(c));
            return (
              <Card key={r.id} className="p-5">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <button onClick={() => ctx.navigate(`/booking/${r.bookingId}`)} className="font-medium text-[15px] hover:underline text-left">
                        {r.propertyAddress || r.customerName}
                      </button>
                      {r.reviewed ? <Tag>Reviewed</Tag> : <Tag tone="gold">Needs review</Tag>}
                    </div>
                    <div className="text-[12px] opacity-60 mt-1">
                      {r.customerName} · cleaning {fmtDate(r.scheduledDate)} · submitted by {r.staffName || "team member"} {fmtDateTime(r.createdAt)}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => ctx.navigate(`/booking/${r.bookingId}`)}>Open job</Button>
                    <Button size="sm" variant={r.reviewed ? "outline" : "primary"} onClick={() => mark(r, !r.reviewed)}>
                      {r.reviewed ? "Unmark" : "Mark reviewed"}
                    </Button>
                  </div>
                </div>
                <div className="mt-4 grid md:grid-cols-[1fr_auto] gap-4">
                  <div className="space-y-2 text-[13px]">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className={missing.length ? "text-[var(--gold-dark)]" : "text-[var(--navy)]"} />
                      Checklist {r.checklist.length}/{REPORT_CHECKLIST.length}
                      {missing.length > 0 && <span className="opacity-70">— not confirmed: {missing.join("; ")}</span>}
                    </div>
                    {r.notes && <p className="whitespace-pre-wrap opacity-85">{r.notes}</p>}
                    {r.issues && (
                      <p className="flex gap-2 text-[var(--gold-dark)]">
                        <AlertTriangle size={14} className="mt-0.5 shrink-0" /> <span className="whitespace-pre-wrap">{r.issues}</span>
                      </p>
                    )}
                    {r.suppliesNeeded && (
                      <p className="flex gap-2">
                        <Package size={14} className="mt-0.5 shrink-0 text-[var(--gold)]" /> <span className="whitespace-pre-wrap">{r.suppliesNeeded}</span>
                      </p>
                    )}
                  </div>
                  {r.photos.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap md:justify-end md:max-w-[340px]">
                      {r.photos.slice(0, 8).map((p) => (
                        <button key={p.id} onClick={() => ctx.navigate(`/booking/${r.bookingId}`)} className="relative h-16 w-16 bg-[var(--surface-soft)] overflow-hidden">
                          <img src={`/api/files/photos/${p.id}`} alt={`${p.kind} photo`} className="h-full w-full object-cover" loading="lazy" />
                          <span className="absolute bottom-0 inset-x-0 bg-black/55 text-white text-[8px] tracking-[0.1em] uppercase text-center">{p.kind}</span>
                        </button>
                      ))}
                      {r.photos.length > 8 && <span className="text-[11px] opacity-60 self-center">+{r.photos.length - 8}</span>}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
