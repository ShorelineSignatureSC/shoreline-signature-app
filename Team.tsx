import { useCallback, useEffect, useState, type FormEvent } from "react";
import { KeyRound, Plus, ShieldCheck, Trash2, UserCheck, UserX } from "lucide-react";
import type { Ctx } from "../App";
import { api, type Booking, type Staff } from "../api";
import { addDays, fmtDate, fmtTime, startOfWeek, toKey, todayKey, fromKey } from "../dates";
import { Button, Card, Empty, ErrorNote, Field, Input, Modal, SectionTitle, Select, Spinner, StatusBadge, Tag } from "../ui";

function genPassword() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const arr = new Uint32Array(12);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join("");
}

export default function Team({ ctx }: { ctx: Ctx }) {
  const weekStart = startOfWeek(fromKey(todayKey()));
  const from = toKey(weekStart);
  const to = toKey(addDays(weekStart, 6));
  const [staff, setStaff] = useState<Staff[] | null>(null);
  const [week, setWeek] = useState<Booking[]>([]);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [created, setCreated] = useState<{ email: string; password: string; note: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const [s, b] = await Promise.all([
        api<{ staff: Staff[] }>(`/api/portal/staff?from=${from}&to=${to}`),
        api<{ bookings: Booking[] }>(`/api/portal/bookings?from=${from}&to=${to}`),
      ]);
      setStaff(s.staff);
      setWeek(b.bookings.filter((x) => x.scheduledDate && x.status !== "cancelled"));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load team.");
    }
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <SectionTitle
        eyebrow="Employee accounts & permissions"
        title="Team"
        action={
          <Button onClick={() => setAdding(true)}>
            <Plus size={14} /> Add team member
          </Button>
        }
      />
      <ErrorNote>{error}</ErrorNote>
      {!staff ? (
        <Spinner />
      ) : (
        <>
          <Card className="divide-y divide-[var(--line)]">
            {staff.map((s) => (
              <div key={s.id} className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 ${s.active ? "" : "opacity-55"}`}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="h-10 w-10 rounded-full bg-[var(--navy)] text-white grid place-items-center text-[13px] shrink-0">{(s.name || s.email).slice(0, 1).toUpperCase()}</span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-[14px]">{s.name || "—"}</span>
                      <Tag tone={s.role === "owner" ? "navy" : "plain"}>{s.role === "owner" ? "Owner / Admin" : "Employee"}</Tag>
                      {!s.active && <Tag>Deactivated</Tag>}
                      {!s.hasLogin && s.active && <Tag tone="gold">No login yet</Tag>}
                    </div>
                    <div className="text-[12px] opacity-60 truncate">
                      {s.email}
                      {s.phone ? ` · ${s.phone}` : ""}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-5 text-[12px]">
                  <div>
                    <div className="font-display text-[20px] leading-none">{s.jobsInRange ?? 0}</div>
                    <div className="text-[10px] tracking-[0.12em] uppercase opacity-50">This week</div>
                  </div>
                  <div>
                    <div className="font-display text-[20px] leading-none">{s.jobsCompleted ?? 0}</div>
                    <div className="text-[10px] tracking-[0.12em] uppercase opacity-50">Completed</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setEditing(s)}>Manage</Button>
                </div>
              </div>
            ))}
          </Card>

          <h2 className="text-[20px] mt-10 mb-1">Schedules this week</h2>
          <p className="text-[12px] opacity-60 mb-4">
            {fmtDate(from, { month: "short", day: "numeric" })} – {fmtDate(to, { month: "short", day: "numeric" })}
          </p>
          {week.length === 0 ? (
            <Empty title="No scheduled cleanings this week" />
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...staff.filter((s) => s.active), { id: 0, name: "Unassigned", email: "", role: "employee", active: true, phone: "" } as Staff].map((s) => {
                const jobs = week.filter((b) => (s.id === 0 ? !(b.assigned ?? []).length : (b.assigned ?? []).some((a) => a.id === s.id)));
                if (s.id === 0 && !jobs.length) return null;
                return (
                  <Card key={s.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`font-medium ${s.id === 0 ? "text-[var(--gold-dark)]" : ""}`}>{s.name || s.email}</span>
                      <span className="text-[11px] opacity-60">{jobs.length} job{jobs.length === 1 ? "" : "s"}</span>
                    </div>
                    {jobs.length === 0 ? (
                      <p className="text-[12px] opacity-50">No jobs scheduled.</p>
                    ) : (
                      <ul className="space-y-2">
                        {jobs.map((b) => (
                          <li key={b.id}>
                            <button onClick={() => ctx.navigate(`/booking/${b.id}`)} className="w-full text-left text-[12px] flex items-center gap-2 hover:underline">
                              <span className="w-[86px] shrink-0 font-semibold">
                                {fmtDate(b.scheduledDate, { weekday: "short", day: "numeric" })} {fmtTime(b.scheduledTime).replace(":00", "")}
                              </span>
                              <span className="truncate flex-1 opacity-80">{b.propertyAddress || b.customerName}</span>
                              <StatusBadge status={b.status} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          <Card className="mt-10 p-5 text-[13px] leading-[1.65]">
            <div className="flex items-center gap-2 font-semibold mb-2">
              <ShieldCheck size={16} className="text-[var(--gold)]" /> Access levels
            </div>
            <p className="opacity-75">
              <strong>Employees</strong> see only the jobs assigned to them — property address, bedroom count, schedule, cleaning instructions and special requests — plus training
              materials. They can start and complete jobs, submit reports and upload photos. They never see customer phone numbers, emails, pricing, owner notes or admin pages.{" "}
              <strong>Owners / Admins</strong> have full access. Deactivating someone immediately blocks their portal access.
            </p>
          </Card>
        </>
      )}

      {adding && (
        <AddMember
          onClose={() => setAdding(false)}
          onDone={(r) => {
            setAdding(false);
            if (r) setCreated(r);
            ctx.toast("Team member added");
            load();
          }}
        />
      )}
      {editing && (
        <EditMember
          member={editing}
          selfId={ctx.me.id}
          onClose={() => setEditing(null)}
          onDone={(msg, pw) => {
            setEditing(null);
            ctx.toast(msg);
            if (pw) setCreated({ email: editing.email, password: pw, note: "Password updated." });
            load();
          }}
        />
      )}
      {created && (
        <Modal title="Share these sign-in details" onClose={() => setCreated(null)}>
          <div className="space-y-4 text-[14px]">
            <p className="opacity-75">{created.note} Share these privately with your team member. They can change the password from their Account page after signing in.</p>
            <div className="bg-[var(--surface-soft)] p-4 font-mono text-[13px] space-y-1 break-all">
              <div>Portal: {window.location.origin}/portal/</div>
              <div>Email: {created.email}</div>
              <div>Password: {created.password}</div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => navigator.clipboard?.writeText(`Shoreline Team Portal\n${window.location.origin}/portal/\nEmail: ${created.email}\nPassword: ${created.password}`)}
              >
                Copy
              </Button>
              <Button onClick={() => setCreated(null)}>Done</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function AddMember({ onClose, onDone }: { onClose: () => void; onDone: (r: { email: string; password: string; note: string } | null) => void }) {
  const [f, setF] = useState({ name: "", email: "", phone: "", role: "employee" });
  const [createLogin, setCreateLogin] = useState(true);
  const [password, setPassword] = useState(genPassword);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await api<{ loginCreated: boolean; loginError: string }>("/api/portal/staff", { method: "POST", body: { ...f, password: createLogin ? password : "" } });
      if (r.loginError) {
        alert(r.loginError);
        onDone(null);
      } else onDone(r.loginCreated ? { email: f.email.trim().toLowerCase(), password, note: "Their login is ready." } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add team member.");
      setBusy(false);
    }
  };
  return (
    <Modal title="Add team member" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorNote>{error}</ErrorNote>
        <Field label="Full name *">
          <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
        </Field>
        <Field label="Email *">
          <Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone">
            <Input type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          </Field>
          <Field label="Access level">
            <Select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
              <option value="employee">Employee</option>
              <option value="owner">Owner / Admin</option>
            </Select>
          </Field>
        </div>
        <label className="flex items-start gap-3 text-[13px]">
          <input type="checkbox" checked={createLogin} onChange={(e) => setCreateLogin(e.target.checked)} className="h-4 w-4 mt-0.5 accent-[#0a2342]" />
          <span>
            Create their login now with a temporary password
            <span className="block text-[12px] opacity-60">Otherwise they can create their own login at the portal using this email.</span>
          </span>
        </label>
        {createLogin && (
          <Field label="Temporary password" hint="At least 8 characters">
            <div className="flex gap-2">
              <Input value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
              <Button type="button" variant="outline" onClick={() => setPassword(genPassword())}>New</Button>
            </div>
          </Field>
        )}
        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? "Adding…" : "Add member"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function EditMember({ member, selfId, onClose, onDone }: { member: Staff; selfId: number; onClose: () => void; onDone: (msg: string, pw?: string) => void }) {
  const [name, setName] = useState(member.name);
  const [phone, setPhone] = useState(member.phone);
  const [role, setRole] = useState(member.role);
  const [newPw, setNewPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const locked = member.protected || member.id === selfId;

  const patch = async (body: Record<string, unknown>, msg: string, pw?: string) => {
    setBusy(true);
    setError("");
    try {
      await api(`/api/portal/staff/${member.id}`, { method: "PATCH", body });
      onDone(msg, pw);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!confirm(`Remove ${member.name || member.email} from the team and delete their login? Their past reports are kept.`)) return;
    setBusy(true);
    try {
      await api(`/api/portal/staff/${member.id}`, { method: "DELETE" });
      onDone("Team member removed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove.");
      setBusy(false);
    }
  };

  return (
    <Modal title={member.name || member.email} onClose={onClose}>
      <div className="space-y-5">
        <ErrorNote>{error}</ErrorNote>
        <div className="text-[12px] opacity-60">{member.email}</div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Phone">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
        </div>
        <Field label="Access level" hint={locked ? "Your own and primary owner accounts can’t be changed here." : undefined}>
          <Select value={role} onChange={(e) => setRole(e.target.value as Staff["role"])} disabled={locked}>
            <option value="employee">Employee — assigned jobs & training only</option>
            <option value="owner">Owner / Admin — full access</option>
          </Select>
        </Field>
        <div className="flex justify-end">
          <Button disabled={busy} onClick={() => patch({ name, phone, role }, "Changes saved")}>Save changes</Button>
        </div>

        <div className="pt-5 border-t border-[var(--line)]">
          <div className="text-[10px] tracking-[0.16em] uppercase opacity-60 font-medium mb-2 flex items-center gap-1.5">
            <KeyRound size={12} /> {member.hasLogin ? "Reset password" : "Create login"}
          </div>
          <div className="flex gap-2">
            <Input value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="New password (8+ characters)" />
            <Button variant="outline" type="button" onClick={() => setNewPw(genPassword())}>Generate</Button>
          </div>
          <Button className="mt-2" variant="outline" disabled={busy || newPw.length < 8} onClick={() => patch({ password: newPw }, member.hasLogin ? "Password reset" : "Login created", newPw)}>
            {member.hasLogin ? "Set new password" : "Create login"}
          </Button>
        </div>

        {!locked && (
          <div className="pt-5 border-t border-[var(--line)] flex flex-wrap gap-3">
            {member.active ? (
              <Button variant="outline" disabled={busy} onClick={() => patch({ active: false }, "Access deactivated")}>
                <UserX size={14} /> Deactivate access
              </Button>
            ) : (
              <Button variant="outline" disabled={busy} onClick={() => patch({ active: true }, "Access restored")}>
                <UserCheck size={14} /> Reactivate
              </Button>
            )}
            <Button variant="danger" disabled={busy} onClick={remove}>
              <Trash2 size={14} /> Remove
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
