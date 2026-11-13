import { useEffect, useState } from "react";
import { BEDROOM_OPTIONS, type Pricing } from "../../../shared/constants";
import type { Ctx } from "../App";
import { api } from "../api";
import { Button, Card, ErrorNote, Field, Input, SectionTitle, Spinner, Textarea } from "../ui";

type S = { pricing: Pricing; squareUrl: string; depositNote: string };

export default function Settings({ ctx }: { ctx: Ctx }) {
  const [s, setS] = useState<S | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<S>("/api/portal/settings")
      .then(setS)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load settings."));
  }, []);

  const save = async () => {
    if (!s) return;
    setBusy(true);
    setError("");
    try {
      setS(await api<S>("/api/portal/settings", { method: "PUT", body: s }));
      ctx.toast("Settings saved — the website updates within a minute");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  };

  if (!s) return error ? <ErrorNote>{error}</ErrorNote> : <Spinner />;

  return (
    <div className="max-w-[760px]">
      <SectionTitle eyebrow="Website & payments" title="Settings" />
      <div className="space-y-6">
        <ErrorNote>{error}</ErrorNote>
        <Card className="p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-[18px]">Square deposit link</h2>
            <p className="mt-1 text-[13px] opacity-65 leading-[1.6]">
              Paste your Square payment link, checkout link, or Square Appointments booking page. Once saved, a “Pay Deposit with Square” button appears on the website and
              after every booking request. Leave it blank to hide the button.
            </p>
          </div>
          <Field label="Square link (https://…)">
            <Input type="url" value={s.squareUrl} onChange={(e) => setS({ ...s, squareUrl: e.target.value })} placeholder="https://square.link/u/…" />
          </Field>
          <Field label="Deposit message (optional)" hint="Shown next to the deposit button">
            <Textarea rows={2} value={s.depositNote} onChange={(e) => setS({ ...s, depositNote: e.target.value })} placeholder="A 25% deposit secures your date. Please include your request number." />
          </Field>
          {s.squareUrl && (
            <a href={s.squareUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-[12px] underline opacity-75">
              Test this link ↗
            </a>
          )}
        </Card>

        <Card className="p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-[18px]">Starting prices on the website</h2>
            <p className="mt-1 text-[13px] opacity-65 leading-[1.6]">
              Shown as “Turnovers from $…” on each property size. Leave a size blank to show “Request a Quote” instead. 4- and 5-bedroom beach homes always show Request a Quote.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {BEDROOM_OPTIONS.filter((b) => !b.quoteOnly).map((b) => (
              <Field key={b.value} label={b.short}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50">$</span>
                  <Input
                    inputMode="decimal"
                    className="pl-7"
                    value={s.pricing[b.value] ?? ""}
                    onChange={(e) => setS({ ...s, pricing: { ...s.pricing, [b.value]: e.target.value.replace(/[^0-9.]/g, "") } })}
                  />
                </div>
              </Field>
            ))}
          </div>
        </Card>
        <div className="flex justify-end">
          <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save settings"}</Button>
        </div>
      </div>
    </div>
  );
}
