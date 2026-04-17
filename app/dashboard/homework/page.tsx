
"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

interface Student {
  id: string;
  name: string;
  subject: string;
}

interface Homework {
  id: string;
  student_id: string;
  title: string;
  description: string;
  due_date: string;
  given_date: string;
  status: "pending" | "submitted" | "late";
  students?: { name: string; subject: string };
}

const STATUS_CONFIG = {
  pending:   { label: "Pending",   bg: "#FFFBEB", color: "#D97706", border: "#FDE68A", icon: "⏳" },
  submitted: { label: "Submitted", bg: "#ECFDF5", color: "#059669", border: "#A7F3D0", icon: "✅" },
  late:      { label: "Late",      bg: "#FEF2F2", color: "#DC2626", border: "#FECACA", icon: "❌" },
};

function localDateStr(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}

export default function HomeworkPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "submitted" | "late">("all");
  const [filterStudent, setFilterStudent] = useState("all");
  const [form, setForm] = useState({
    student_id: "",
    title: "",
    description: "",
    due_date: "",
  });

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: st } = await supabase.from("students").select("id, name, subject").eq("tutor_id", user.id);
    setStudents(st || []);

    const studentIds = (st || []).map(s => s.id);
    if (studentIds.length === 0) return;

    const { data: hw } = await supabase
      .from("homework")
      .select("*, students(name, subject)")
      .in("student_id", studentIds)
      .order("due_date", { ascending: true });

    // Auto mark late
    const today = localDateStr(new Date());
    const updated = (hw || []).map(h => {
      if (h.status === "pending" && h.due_date < today) {
        return { ...h, status: "late" as const };
      }
      return h;
    });
    setHomework(updated);
  }

  useEffect(() => {
    load();
    if (students.length > 0) setForm(p => ({ ...p, student_id: students[0].id }));
  }, []);

  useEffect(() => {
    if (students.length > 0 && !form.student_id) {
      setForm(p => ({ ...p, student_id: students[0].id }));
    }
  }, [students]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    await supabase.from("homework").insert({
      student_id: form.student_id,
      title: form.title,
      description: form.description,
      due_date: form.due_date,
      given_date: localDateStr(new Date()),
      status: "pending",
    });
    setForm(p => ({ ...p, title: "", description: "", due_date: "" }));
    setShowForm(false);
    setLoading(false);
    load();
  }

  async function updateStatus(id: string, status: Homework["status"]) {
    const supabase = createClient();
    await supabase.from("homework").update({ status }).eq("id", id);
    setHomework(prev => prev.map(h => h.id === id ? { ...h, status } : h));
  }

  async function deleteHomework(id: string) {
    if (!confirm("Delete this homework?")) return;
    const supabase = createClient();
    await supabase.from("homework").delete().eq("id", id);
    setHomework(prev => prev.filter(h => h.id !== id));
  }

  const filtered = homework.filter(h => {
    if (filter !== "all" && h.status !== filter) return false;
    if (filterStudent !== "all" && h.student_id !== filterStudent) return false;
    return true;
  });

  const stats = {
    total: homework.length,
    pending: homework.filter(h => h.status === "pending").length,
    submitted: homework.filter(h => h.status === "submitted").length,
    late: homework.filter(h => h.status === "late").length,
  };

  function getDaysLeft(dueDate: string) {
    const today = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return `${Math.abs(diff)} din late`;
    if (diff === 0) return "Aaj due hai!";
    if (diff === 1) return "Kal due hai";
    return `${diff} din baaki`;
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)" }}>Homework Tracker</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: 4 }}>Students ko assignments do aur track karo</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + Assignment Do
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total", value: stats.total, color: "#4F46E5", bg: "#EEF2FF", icon: "📝" },
          { label: "Pending", value: stats.pending, color: "#D97706", bg: "#FFFBEB", icon: "⏳" },
          { label: "Submitted", value: stats.submitted, color: "#059669", bg: "#ECFDF5", icon: "✅" },
          { label: "Late", value: stats.late, color: "#DC2626", bg: "#FEF2F2", icon: "❌" },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ padding: "18px 20px", cursor: "pointer" }}
            onClick={() => setFilter(i === 0 ? "all" : s.label.toLowerCase() as any)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>{s.label}</p>
              <div style={{ background: s.bg, borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{s.icon}</div>
            </div>
            <p style={{ fontSize: 30, fontWeight: 800, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="card slide-in" style={{ padding: "24px 28px", marginBottom: 24 }}>
          <h2 style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)", marginBottom: 20 }}>📝 Naya Assignment</h2>
          <form onSubmit={handleAdd}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label className="label">Student</label>
                <select className="input" value={form.student_id} onChange={e => setForm(p => ({ ...p, student_id: e.target.value }))} required>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} — {s.subject}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Due Date</label>
                <input className="input" type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} required min={localDateStr(new Date())} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="label">Assignment Title</label>
              <input className="input" type="text" placeholder="e.g. Chapter 5 Exercise, Practice Problems..." value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="label">Details (Optional)</label>
              <textarea className="input" placeholder="Assignment ke baare mein detail..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} style={{ resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Saving..." : "Assignment Add Karo"}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 4, background: "var(--bg-hover)", borderRadius: 10, padding: 4 }}>
          {(["all", "pending", "submitted", "late"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: "7px 16px", borderRadius: 7, border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", background: filter === f ? "var(--bg-card)" : "transparent", color: filter === f ? "var(--brand, #4F46E5)" : "var(--text-secondary)", boxShadow: filter === f ? "0 1px 4px rgba(0,0,0,0.1)" : "none", transition: "all 0.2s", textTransform: "capitalize" }}>
              {f === "all" ? "Sab" : STATUS_CONFIG[f].icon + " " + STATUS_CONFIG[f].label}
            </button>
          ))}
        </div>
        <select className="input" style={{ width: "auto" }} value={filterStudent} onChange={e => setFilterStudent(e.target.value)}>
          <option value="all">All Students</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Homework List */}
      <div style={{ display: "grid", gap: 12 }}>
        {filtered.length === 0 && (
          <div className="card" style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>📝</p>
            <p style={{ fontWeight: 600, fontSize: 16, color: "var(--text-primary)" }}>Koi assignment nahi</p>
            <p style={{ fontSize: 14, marginTop: 4 }}>+ Assignment Do button se naya add karo</p>
          </div>
        )}

        {filtered.map(hw => {
          const cfg = STATUS_CONFIG[hw.status];
          const daysLeft = getDaysLeft(hw.due_date);
          const isOverdue = hw.due_date < localDateStr(new Date()) && hw.status !== "submitted";
          return (
            <div key={hw.id} className="card" style={{ padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, borderLeft: `4px solid ${cfg.color}`, transition: "all 0.2s" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <p style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>{hw.title}</p>
                  <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                    {cfg.icon} {cfg.label}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>👨‍🎓 {hw.students?.name} — {hw.students?.subject}</p>
                  <p style={{ color: isOverdue && hw.status !== "submitted" ? "#DC2626" : "var(--text-secondary)", fontSize: 13, fontWeight: isOverdue ? 600 : 400 }}>
                    📅 Due: {hw.due_date} • {daysLeft}
                  </p>
                  {hw.description && <p style={{ color: "var(--text-muted)", fontSize: 13 }}>📌 {hw.description}</p>}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                {hw.status !== "submitted" && (
                  <button onClick={() => updateStatus(hw.id, "submitted")}
                    style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #A7F3D0", background: "#ECFDF5", color: "#059669", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif", whiteSpace: "nowrap" }}>
                    ✅ Submitted
                  </button>
                )}
                {hw.status === "submitted" && (
                  <button onClick={() => updateStatus(hw.id, "pending")}
                    style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    ↩️ Undo
                  </button>
                )}
                <button onClick={() => deleteHomework(hw.id)}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", cursor: "pointer", fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
