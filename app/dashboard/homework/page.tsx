"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

interface Student {
  id: string;
  name: string;
  subject: string;
  phone: string;
  parent_name: string;
}

interface Homework {
  id: string;
  student_id: string;
  title: string;
  description: string;
  due_date: string;
  given_date: string;
  status: "pending" | "submitted" | "late";
  students?: { name: string; subject: string; phone: string; parent_name: string };
}

const STATUS_CONFIG = {
  pending:   { label: "Pending",   bg: "#FFFBEB", color: "#D97706", border: "#FDE68A", icon: "⏳" },
  submitted: { label: "Submitted", bg: "#ECFDF5", color: "#059669", border: "#A7F3D0", icon: "✅" },
  late:      { label: "Late",      bg: "#FEF2F2", color: "#DC2626", border: "#FECACA", icon: "❌" },
};

function localDateStr(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}

function getDaysLeft(dueDate: string) {
  const today = new Date();
  const due = new Date(dueDate + "T00:00:00");
  const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `${Math.abs(diff)} day(s) overdue`;
  if (diff === 0) return "Due today!";
  if (diff === 1) return "Due tomorrow";
  return `${diff} days left`;
}

function sendWhatsApp(hw: Homework, student: any) {
  const phone = (student?.phone || "").replace(/\D/g, "");
  const intl = phone.startsWith("0") ? "92" + phone.slice(1) : phone;
  const msg = `Assalam o Alaikum ${student?.parent_name}! 👋

📝 *New Homework Assigned*

Student: *${student?.name}*
Subject: *${student?.subject}*
Assignment: *${hw.title}*${hw.description ? `\nDetails: ${hw.description}` : ""}
Due Date: *${hw.due_date}*

Please make sure the assignment is completed on time.

Thank you! 🙏
— Tutor Desk`;
  window.open(`https://wa.me/${intl}?text=${encodeURIComponent(msg)}`, "_blank");
}

export default function HomeworkPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "submitted" | "late">("all");
  const [filterStudent, setFilterStudent] = useState("all");
  const [newHwId, setNewHwId] = useState<string | null>(null);
  const [form, setForm] = useState({ student_id: "", title: "", description: "", due_date: "" });

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: st } = await supabase.from("students").select("id, name, subject, phone, parent_name").eq("tutor_id", user.id);
    setStudents(st || []);
    if (st && st.length > 0 && !form.student_id) setForm(p => ({ ...p, student_id: st[0].id }));

    const studentIds = (st || []).map(s => s.id);
    if (studentIds.length === 0) return;

    const { data: hw } = await supabase
      .from("homework")
      .select("*, students(name, subject, phone, parent_name)")
      .in("student_id", studentIds)
      .order("due_date", { ascending: true });

    const today = localDateStr(new Date());
    const updated = (hw || []).map(h => {
      if (h.status === "pending" && h.due_date < today) return { ...h, status: "late" as const };
      return h;
    });
    setHomework(updated);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from("homework").insert({
      student_id: form.student_id,
      title: form.title,
      description: form.description,
      due_date: form.due_date,
      given_date: localDateStr(new Date()),
      status: "pending",
    }).select("*, students(name, subject, phone, parent_name)").single();

    setLoading(false);
    setShowForm(false);

    if (data) {
      setNewHwId(data.id);
      setHomework(prev => [...prev, data]);
    }
    setForm(p => ({ ...p, title: "", description: "", due_date: "" }));
  }

  async function updateStatus(id: string, status: Homework["status"]) {
    const supabase = createClient();
    await supabase.from("homework").update({ status }).eq("id", id);
    setHomework(prev => prev.map(h => h.id === id ? { ...h, status } : h));
  }

  async function deleteHomework(id: string) {
    if (!confirm("Delete this assignment?")) return;
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

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)" }}>Homework Tracker</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: 4 }}>Assign and track student homework</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">+ Add Assignment</button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total", value: stats.total, color: "#4F46E5", bg: "#EEF2FF", icon: "📝", f: "all" },
          { label: "Pending", value: stats.pending, color: "#D97706", bg: "#FFFBEB", icon: "⏳", f: "pending" },
          { label: "Submitted", value: stats.submitted, color: "#059669", bg: "#ECFDF5", icon: "✅", f: "submitted" },
          { label: "Late", value: stats.late, color: "#DC2626", bg: "#FEF2F2", icon: "❌", f: "late" },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ padding: "18px 20px", cursor: "pointer" }} onClick={() => setFilter(s.f as any)}>
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
        <div className="card" style={{ padding: "24px 28px", marginBottom: 24 }}>
          <h2 style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)", marginBottom: 20 }}>📝 New Assignment</h2>
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
              <textarea className="input" placeholder="Additional details about the assignment..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} style={{ resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" className="btn-primary" disabled={loading}>{loading ? "Saving..." : "Add Assignment"}</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* WhatsApp Prompt after adding */}
      {newHwId && (() => {
        const hw = homework.find(h => h.id === newHwId);
        const student = hw?.students;
        if (!hw) return null;
        return (
          <div style={{ background: "linear-gradient(135deg, #ECFDF5, #D1FAE5)", border: "1px solid #A7F3D0", borderRadius: 14, padding: "20px 24px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 28 }}>🎉</span>
              <div>
                <p style={{ fontWeight: 700, fontSize: 15, color: "#065F46" }}>Assignment added successfully!</p>
                <p style={{ fontSize: 13, color: "#059669" }}>Send a WhatsApp notification to {student?.parent_name || "parent"}?</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => sendWhatsApp(hw, student)}
                style={{ padding: "10px 20px", background: "#25D366", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
                📲 Send WhatsApp
              </button>
              <button onClick={() => setNewHwId(null)}
                style={{ padding: "10px 16px", background: "white", color: "#374151", border: "1px solid #E5E7EB", borderRadius: 8, fontWeight: 500, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Skip
              </button>
            </div>
          </div>
        );
      })()}

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 4, background: "var(--bg-hover)", borderRadius: 10, padding: 4 }}>
          {(["all", "pending", "submitted", "late"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: "7px 16px", borderRadius: 7, border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", background: filter === f ? "var(--bg-card)" : "transparent", color: filter === f ? "#4F46E5" : "var(--text-secondary)", boxShadow: filter === f ? "0 1px 4px rgba(0,0,0,0.1)" : "none", transition: "all 0.2s", textTransform: "capitalize" }}>
              {f === "all" ? "All" : STATUS_CONFIG[f].icon + " " + STATUS_CONFIG[f].label}
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
          <div className="card" style={{ padding: 48, textAlign: "center" }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>📝</p>
            <p style={{ fontWeight: 600, fontSize: 16, color: "var(--text-primary)" }}>No assignments yet</p>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>Click "+ Add Assignment" to get started</p>
          </div>
        )}

        {filtered.map(hw => {
          const cfg = STATUS_CONFIG[hw.status];
          const isOverdue = hw.due_date < localDateStr(new Date()) && hw.status !== "submitted";
          return (
            <div key={hw.id} className="card" style={{ padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, borderLeft: `4px solid ${cfg.color}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                  <p style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>{hw.title}</p>
                  <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                    {cfg.icon} {cfg.label}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>👨‍🎓 {hw.students?.name} — {hw.students?.subject}</p>
                  <p style={{ color: isOverdue ? "#DC2626" : "var(--text-secondary)", fontSize: 13, fontWeight: isOverdue ? 600 : 400 }}>
                    📅 Due: {hw.due_date} • {getDaysLeft(hw.due_date)}
                  </p>
                  {hw.description && <p style={{ color: "var(--text-muted)", fontSize: 13 }}>📌 {hw.description}</p>}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
                {/* WhatsApp button */}
                <button onClick={() => sendWhatsApp(hw, hw.students)}
                  style={{ padding: "8px 12px", borderRadius: 8, background: "#25D366", color: "white", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  📲
                </button>

                {hw.status !== "submitted" ? (
                  <button onClick={() => updateStatus(hw.id, "submitted")}
                    style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #A7F3D0", background: "#ECFDF5", color: "#059669", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    ✅ Submitted
                  </button>
                ) : (
                  <button onClick={() => updateStatus(hw.id, "pending")}
                    style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", cursor: "pointer", fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    ↩️ Undo
                  </button>
                )}
                <button onClick={() => deleteHomework(hw.id)}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", cursor: "pointer", fontSize: 13 }}>
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
