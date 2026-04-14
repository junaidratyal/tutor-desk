"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Student, Session } from "@/lib/types";

const emptyForm = { student_id: "", date: "", time: "", duration: "60", status: "scheduled" as const };

export default function SchedulePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: st } = await supabase.from("students").select("*").eq("tutor_id", user.id);
    const { data: se } = await supabase.from("sessions").select("*, students(name, subject)").order("date", { ascending: true }).order("time", { ascending: true });
    setStudents(st || []);
    setSessions(se || []);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    await supabase.from("sessions").insert({ ...form, duration: Number(form.duration) });
    setForm(emptyForm); setShowForm(false); setLoading(false);
    load();
  }

  async function updateStatus(id: string, status: Session["status"]) {
    const supabase = createClient();
    await supabase.from("sessions").update({ status }).eq("id", id);
    load();
  }

  async function deleteSession(id: string) {
    if (!confirm("Delete this session?")) return;
    const supabase = createClient();
    await supabase.from("sessions").delete().eq("id", id);
    load();
  }

  const today = new Date().toISOString().split("T")[0];
  const todaySessions = sessions.filter(s => s.date === today);
  const upcoming = sessions.filter(s => s.date > today);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111827" }}>Schedule</h1>
          <p style={{ color: "#6B7280", marginTop: 4 }}>Manage your sessions and timetable</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Add Session</button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: 28, marginBottom: 28 }}>
          <h2 style={{ fontWeight: 700, marginBottom: 20 }}>Schedule New Session</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label className="label">Student</label>
                <select className="input" value={form.student_id} onChange={e => setForm(p => ({ ...p, student_id: e.target.value }))} required>
                  <option value="">Select student...</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} — {s.subject}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Date</label>
                <input className="input" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Time</label>
                <input className="input" type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Duration (minutes)</label>
                <select className="input" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))}>
                  {["30","45","60","90","120"].map(d => <option key={d} value={d}>{d} mins</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              <button className="btn-primary" type="submit" disabled={loading}>{loading ? "Saving..." : "Add Session"}</button>
              <button className="btn-secondary" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Today */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontWeight: 700, fontSize: 17, color: "#111827", marginBottom: 14 }}>📅 Today's Sessions ({todaySessions.length})</h2>
        {todaySessions.length === 0
          ? <div className="card" style={{ padding: "20px 24px", color: "#9CA3AF", fontSize: 14 }}>No sessions scheduled for today</div>
          : todaySessions.map(s => <SessionCard key={s.id} session={s} onStatus={updateStatus} onDelete={deleteSession} />)
        }
      </div>

      {/* Upcoming */}
      <div>
        <h2 style={{ fontWeight: 700, fontSize: 17, color: "#111827", marginBottom: 14 }}>🗓️ Upcoming Sessions ({upcoming.length})</h2>
        {upcoming.length === 0
          ? <div className="card" style={{ padding: "20px 24px", color: "#9CA3AF", fontSize: 14 }}>No upcoming sessions</div>
          : upcoming.map(s => <SessionCard key={s.id} session={s} onStatus={updateStatus} onDelete={deleteSession} />)
        }
      </div>
    </div>
  );
}

function SessionCard({ session: s, onStatus, onDelete }: { session: Session; onStatus: (id: string, status: Session["status"]) => void; onDelete: (id: string) => void }) {
  const timeStr = s.time ? s.time.slice(0, 5) : "";
  return (
    <div className="card" style={{ padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <div style={{ background: "#EDE9FE", borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
          <p style={{ fontWeight: 800, color: "#6D28D9", fontSize: 15 }}>{timeStr}</p>
          <p style={{ color: "#7C3AED", fontSize: 11 }}>{s.duration}m</p>
        </div>
        <div>
          <p style={{ fontWeight: 600, fontSize: 15, color: "#111827" }}>{s.students?.name}</p>
          <p style={{ color: "#6B7280", fontSize: 13 }}>{s.students?.subject} • {s.date}</p>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span className={`badge-${s.status}`}>{s.status}</span>
        {s.status === "scheduled" && (
          <button onClick={() => onStatus(s.id, "done")} style={{ padding: "7px 14px", borderRadius: 6, border: "1px solid #86EFAC", background: "#F0FDF4", color: "#15803D", cursor: "pointer", fontSize: 13 }}>✓ Done</button>
        )}
        <button onClick={() => onDelete(s.id)} style={{ padding: "7px 12px", borderRadius: 6, border: "1px solid #FCA5A5", background: "#FEF2F2", color: "#DC2626", cursor: "pointer", fontSize: 13 }}>🗑️</button>
      </div>
    </div>
  );
}
