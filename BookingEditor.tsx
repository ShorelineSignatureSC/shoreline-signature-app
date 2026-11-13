import { useEffect, useState, type FormEvent } from "react";
import { ADD_ONS, BEDROOM_OPTIONS, BOOKING_STATUSES, DEPOSIT_STATUSES, PROPERTY_TYPES, SERVICE_TYPES } from "../../../shared/constants";
import { api, type Booking, type BookingDetail, type Staff } from "../api";
import { Button, ErrorNote, Field, Input, Modal, Select, Textarea } from "../ui";

type Props = {
  booking?: Booking | null;
  assigned?: { id: number; name: string }[];
  defaultDate?: string;
  onClose: () => void;
  onSaved: (d: BookingDetail) => void;
};

export default function BookingEditor({ booking, assigned, defaultDate, onClose, onSaved }: Props) {
  const isNew = !booking;
  const [f, setF] = useState({
    customerName: booking?.customerName ?? "",
    customerEmail: booking?.customerEmail ?? "",
    customerPhone: booking?.customerPhone ?? "",
    propertyAddress: booking?.propertyAddress ?? "",
    propertyType: booking?.propertyType ?? "",
    bedrooms: booking?.bedrooms ?? "",
    bathrooms: booking?.bathrooms ?? "",
    serviceType: booking?.serviceType || SERVICE_TYPES[0],
    addOns: booking?.addOns ?? ([] as string[]),
    requestType: booking?.requestType ?? "booking",
    status: booking?.status ?? (defaultDate ? "scheduled" : "pending"),
    preferredDate: booking?.preferredDate ?? "",
    preferredTime: booking?.preferredTime ?? "",
    scheduledDate: booking?.scheduledDate ?? defaultDate ?? "",
    scheduledTime: booking?.scheduledTime ?? "",
    instructions: booking?.instructions ?? "",
    specialRequests: booking?.specialRequests ?? "",
    internalNotes: booking?.internalNotes ?? "",
    price: booking?.price ?? "",
    depositStatus: booking?.depositStatus ?? "none",
  });
  const [staffIds, setStaffIds] = useState<number[]>(assigned?.map((a) => a.id) ?? []);
  const [team, setTeam] = useState<Staff[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ staff: Staff[] }>("/api/portal/staff")
      .then((r) => setTeam(r.staff.filter((s) => s.active)))
      .catch(() => setTeam([]));
  }, []);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  async function save(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!f.customerName.trim()) return setError("Customer name is required.");
    let status = f.status;
    // Scheduling a pending request moves it to Scheduled automatically.
    if (status === "pending" && f.scheduledDate && (isNew || !booking?.scheduledDate)) status = "scheduled";
    setBusy(true);
    try {
      const body = { ...f, status, staffIds };
      const d = isNew
        ? await api<BookingDetail>("/api/portal/bookings", { method: "POST", body })
        : await api<BookingDetail>(`/api/portal/bookings/${booking!.id}`, { method: "PATCH", body });
      onSaved(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save booking.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={isNew ? "New booking" : `Edit booking #${booking!.id}`} onClose={onClose} wide>
      <form onSubmit={save} className="space-y-6">
        <ErrorNote>{error}</ErrorNote>
        <section>
          <h3 className="text-[15px] mb-3">Customer</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Name *">
              <Input value={f.customerName} onChange={(e) => set("customerName", e.target.value)} required />
            </Field>
            <Field label="Email">
              <Input type="email" value={f.customerEmail} onChange={(e) => set("customerEmail", e.target.value)} />
            </Field>
            <Field label="Phone">
              <Input type="tel" value={f.customerPhone} onChange={(e) => set("customerPhone", e.target.value)} />
            </Field>
          </div>
        </section>
        <section>
          <h3 className="text-[15px] mb-3">Property</h3>
          <div className="grid sm:grid-cols-4 gap-4">
            <Field label="Address" className="sm:col-span-4">
              <Input value={f.propertyAddress} onChange={(e) => set("propertyAddress", e.target.value)} />
            </Field>
            <Field label="Bedrooms">
              <Select value={f.bedrooms} onChange={(e) => set("bedrooms", e.target.value)}>
                <option value="">—</option>
                {BEDROOM_OPTIONS.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Bathrooms">
              <Input value={f.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} />
            </Field>
            <Field label="Property type">
              <Select value={f.propertyType} onChange={(e) => set("propertyType", e.target.value)}>
                <option value="">—</option>
                {PROPERTY_TYPES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </Select>
            </Field>
            <Field label="Service">
              <Select value={f.serviceType} onChange={(e) => set("serviceType", e.target.value)}>
                {SERVICE_TYPES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="mt-4">
            <span className="text-[10px] tracking-[0.16em] uppercase opacity-60 font-medium">Additional services</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {ADD_ONS.map((a) => {
                const on = f.addOns.includes(a);
                return (
                  <button
                    type="button"
                    key={a}
                    aria-pressed={on}
                    onClick={() => set("addOns", on ? f.addOns.filter((x) => x !== a) : [...f.addOns, a])}
                    className={`px-3 py-1.5 text-[12px] border transition ${on ? "bg-[var(--navy)] text-white border-[var(--navy)] dark:bg-[var(--gold)] dark:text-[#0a2342] dark:border-[var(--gold)]" : "border-[var(--line-strong)] hover:bg-[var(--surface-soft)]"}`}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
        <section>
          <h3 className="text-[15px] mb-3">Schedule & status</h3>
          <div className="grid sm:grid-cols-4 gap-4">
            <Field label="Cleaning date">
              <Input type="date" value={f.scheduledDate} onChange={(e) => set("scheduledDate", e.target.value)} />
            </Field>
            <Field label="Start time">
              <Input type="time" value={f.scheduledTime} onChange={(e) => set("scheduledTime", e.target.value)} />
            </Field>
            <Field label="Status">
              <Select value={f.status} onChange={(e) => set("status", e.target.value)}>
                {BOOKING_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Type">
              <Select value={f.requestType} onChange={(e) => set("requestType", e.target.value as "booking" | "quote")}>
                <option value="booking">Booking</option>
                <option value="quote">Quote request</option>
              </Select>
            </Field>
            <Field label="Customer preferred date">
              <Input type="date" value={f.preferredDate} onChange={(e) => set("preferredDate", e.target.value)} />
            </Field>
            <Field label="Customer preferred time">
              <Input value={f.preferredTime} onChange={(e) => set("preferredTime", e.target.value)} />
            </Field>
            <Field label="Price / quote">
              <Input value={f.price} onChange={(e) => set("price", e.target.value)} placeholder="$155" />
            </Field>
            <Field label="Deposit">
              <Select value={f.depositStatus} onChange={(e) => set("depositStatus", e.target.value)}>
                {DEPOSIT_STATUSES.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </Select>
            </Field>
          </div>
        </section>
        <section>
          <h3 className="text-[15px] mb-3">Assign team</h3>
          {team.length === 0 ? (
            <p className="text-[13px] opacity-60">No active team members yet. Add employees from the Team page.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {team.map((s) => {
                const on = staffIds.includes(s.id);
                return (
                  <button
                    type="button"
                    key={s.id}
                    aria-pressed={on}
                    onClick={() => setStaffIds(on ? staffIds.filter((x) => x !== s.id) : [...staffIds, s.id])}
                    className={`px-3 py-2 text-[13px] border transition ${on ? "bg-[var(--navy)] text-white border-[var(--navy)] dark:bg-[var(--gold)] dark:text-[#0a2342] dark:border-[var(--gold)]" : "border-[var(--line-strong)] hover:bg-[var(--surface-soft)]"}`}
                  >
                    {s.name || s.email}
                    {s.role === "owner" && <span className="ml-1 opacity-60 text-[10px] uppercase tracking-[0.1em]">owner</span>}
                  </button>
                );
              })}
            </div>
          )}
        </section>
        <section className="grid sm:grid-cols-2 gap-4">
          <Field label="Cleaning & access instructions" hint="Visible to assigned employees">
            <Textarea rows={4} value={f.instructions} onChange={(e) => set("instructions", e.target.value)} />
          </Field>
          <Field label="Special requests" hint="Visible to assigned employees">
            <Textarea rows={4} value={f.specialRequests} onChange={(e) => set("specialRequests", e.target.value)} />
          </Field>
          <Field label="Owner notes" hint="Private — never shown to employees" className="sm:col-span-2">
            <Textarea rows={3} value={f.internalNotes} onChange={(e) => set("internalNotes", e.target.value)} />
          </Field>
        </section>
        <div className="flex flex-wrap gap-3 justify-end pt-2 border-t border-[var(--line)]">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? "Saving…" : isNew ? "Create booking" : "Save changes"}</Button>
        </div>
      </form>
    </Modal>
  );
}
