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

function makeWhatsAppMsg(studentName: string, parentName: string, subject: string, title: string, description: string, dueDate: string) {
  return `Assalam o Alaikum ${parentName}! 👋

📝 *New Homework Assigned*

Student: *${studentName}*
Subject: *${subject}*
Assignment: *${title}*${description ? `\nDetails: ${description}` : ""}
Due Date: *${dueDate}*

Please make sure the assignment is completed on time.

Thank you! 🙏
— Tutor Desk`;
}

function openWhatsApp(phone: string, msg: string) {
  const clean = phone.replace(/\D/g, "");
  const intl = clean.startsWith("0") ? "92" + clean.slice(1) : clean;
  window.open(`https://wa.me/${intl}?text=${encodeURIComponent(msg)}`, "_blank");
}

export default function HomeworkPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "submitted" | "late">("all");
  const [filterStudent, setFilterStudent] = useState("all");
  const [bulkSuccess, setBulkSuccess] = useState<{title: string; students: Student[]; msg: string; dueDate: string} | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [assignMode, setAssignMode] = useState<"single" | "bulk">("single");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [form, setForm] = useState({ student_id: "", title: "", description: "", due_date: "" });

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: st } = await supabase.from("students").select("id, name, subject, phone, parent_name").eq("tutor_id", user.id);
    setStudents(st || []);
    if (st && st.length > 0 && !form.student_id) setForm(p => ({ ...p, student_id: st[0].id }));

    const studentIds = (st || []).map(s => s.id);
    if (!studentIds.length) return;

    const { data: hw } = await supabase
      .from("homework")
      .select("*, students(name, subject, phone, parent_name)")
      .in("student_id", studentIds)
      .order("due_date", { ascending: true });

    const today = localDateStr(new Date());
    setHomework((hw || []).map(h => h.status === "pending" && h.due_date < today ? { ...h, status: "late" as const } : h));
  }

  useEffect(() => { load(); }, []);

  // Single student add
  async function handleAddSingle(e: React.FormEvent) {
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
    setLoading(false);
    setShowForm(false);
    setForm(p => ({ ...p, title: "", description: "", due_date: "" }));
    load();
  }

  // Bulk add — assign to multiple/all students
  async function handleAddBulk(e: React.FormEvent) {
    e.preventDefault();
    if (selectedStudents.length === 0) { alert("Select at least one student!"); return; }
    setLoading(true);
    const supabase = createClient();

    const inserts = selectedStudents.map(sid => ({
      student_id: sid,
      title: form.title,
      description: form.description,
      due_date: form.due_date,
      given_date: localDateStr(new Date()),
      status: "pending",
    }));

    await supabase.from("homework").insert(inserts);
    setLoading(false);
    setShowForm(false);

    // Show bulk success with WhatsApp options
    const assignedStudents = students.filter(s => selectedStudents.includes(s.id));
    const sampleMsg = makeWhatsAppMsg(
      "[Student Name]", "[Parent Name]", assignedStudents[0]?.subject || "",
      form.title, form.description, form.due_date
    );
    setBulkSuccess({ title: form.title, students: assignedStudents, msg: sampleMsg, dueDate: form.due_date });
    setForm(p => ({ ...p, title: "", description: "", due_date: "" }));
    setSelectedStudents([]);
    load();
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

  function toggleStudent(id: string) {
    setSelectedStudents(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  }

  function selectAll() {
    setSelectedStudents(selectedStudents.length === students.length ? [] : students.map(s => s.id));
  }

  function copyMsg(msg: string, idx: number) {
    navigator.clipboard.writeText(msg);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  // Group broadcast message (for WhatsApp group)
  function getGroupMsg() {
    if (!bulkSuccess) return "";
    return `Assalam o Alaikum Parents! 👋

📝 *New Homework Assigned*

Assignment: *${bulkSuccess.title}*${form.description ? `\nDetails: ${form.description}` : ""}
Due Date: *${bulkSuccess.dueDate}*

Students: ${bulkSuccess.students.map(s => s.name).join(", ")}

Please complete the assignment on time.

Thank you! 🙏
— Tutor Desk`;
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
        <button onClick={() => { setShowForm(true); setBulkSuccess(null); }} className="btn-primary">+ Add Assignment</button>
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
          {/* Mode Toggle */}
          <div style={{ display: "flex", gap: 4, background: "var(--bg-hover)", borderRadius: 10, padding: 4, marginBottom: 20, width: "fit-content" }}>
            {[
              { id: "single", label: "👤 Single Student" },
              { id: "bulk", label: "👥 Multiple Students" },
            ].map(m => (
              <button key={m.id} onClick={() => setAssignMode(m.id as any)}
                style={{ padding: "8px 18px", borderRadius: 8, border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", background: assignMode === m.id ? "var(--bg-card)" : "transparent", color: assignMode === m.id ? "#4F46E5" : "var(--text-secondary)", boxShadow: assignMode === m.id ? "0 1px 4px rgba(0,0,0,0.1)" : "none", transition: "all 0.2s" }}>
                {m.label}
              </button>
            ))}
          </div>

          <form onSubmit={assignMode === "single" ? handleAddSingle : handleAddBulk}>
            {/* Single mode */}
            {assignMode === "single" && (
              <div style={{ marginBottom: 16 }}>
                <label className="label">Student</label>
                <select className="input" value={form.student_id} onChange={e => setForm(p => ({ ...p, student_id: e.target.value }))} required>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} — {s.subject}</option>)}
                </select>
              </div>
            )}

            {/* Bulk mode — student checkboxes */}
            {assignMode === "bulk" && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <label className="label" style={{ margin: 0 }}>Select Students ({selectedStudents.length}/{students.length} selected)</label>
                  <button type="button" onClick={selectAll}
                    style={{ padding: "5px 14px", borderRadius: 6, border: "1px solid #C7D2FE", background: "#EEF2FF", color: "#4F46E5", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {selectedStudents.length === students.length ? "Deselect All" : "Select All"}
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8, maxHeight: 200, overflowY: "auto", padding: 4 }}>
                  {students.map(s => (
                    <label key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, border: `2px solid ${selectedStudents.includes(s.id) ? "#4F46E5" : "var(--border)"}`, background: selectedStudents.includes(s.id) ? "#EEF2FF" : "var(--bg-card)", cursor: "pointer", transition: "all 0.15s" }}>
                      <input type="checkbox" checked={selectedStudents.includes(s.id)} onChange={() => toggleStudent(s.id)} style={{ accentColor: "#4F46E5", width: 16, height: 16 }} />
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{s.name}</p>
                        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.subject}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label className="label">Assignment Title</label>
                <input className="input" type="text" placeholder="e.g. Chapter 5 Exercise..." value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Due Date</label>
                <input className="input" type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} required min={localDateStr(new Date())} />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="label">Details (Optional)</label>
              <textarea className="input" placeholder="Additional details..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} style={{ resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Saving..." : assignMode === "bulk" ? `Assign to ${selectedStudents.length} Students` : "Add Assignment"}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Bulk Success — WhatsApp Options */}
      {bulkSuccess && (
        <div className="card" style={{ padding: "24px 28px", marginBottom: 24, border: "2px solid #A7F3D0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <span style={{ fontSize: 28 }}>🎉</span>
            <div>
              <p style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)" }}>
                Assignment assigned to {bulkSuccess.students.length} students!
              </p>
              <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Now notify parents via WhatsApp</p>
            </div>
          </div>

          {/* Tab: Individual or Group */}
          <div style={{ display: "flex", gap: 4, background: "var(--bg-hover)", borderRadius: 10, padding: 4, marginBottom: 20, width: "fit-content" }}>
            {["Individual Messages", "Group Message"].map((t, i) => (
              <button key={t} id={`wa-tab-${i}`} onClick={() => {
                document.getElementById("wa-individual")!.style.display = i === 0 ? "block" : "none";
                document.getElementById("wa-group")!.style.display = i === 1 ? "block" : "none";
                [0,1].forEach(j => {
                  const btn = document.getElementById(`wa-tab-${j}`) as HTMLButtonElement;
                  btn.style.background = j === i ? "var(--bg-card)" : "transparent";
                  btn.style.color = j === i ? "#4F46E5" : "var(--text-secondary)";
                  btn.style.boxShadow = j === i ? "0 1px 4px rgba(0,0,0,0.1)" : "none";
                });
              }}
                style={{ padding: "8px 18px", borderRadius: 8, border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", background: i === 0 ? "var(--bg-card)" : "transparent", color: i === 0 ? "#4F46E5" : "var(--text-secondary)", boxShadow: i === 0 ? "0 1px 4px rgba(0,0,0,0.1)" : "none", transition: "all 0.2s" }}>
                {t}
              </button>
            ))}
          </div>

          {/* Individual Messages */}
          <div id="wa-individual">
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>Send personalized message to each parent:</p>
            <div style={{ display: "grid", gap: 10 }}>
              {bulkSuccess.students.map((s, i) => {
                const msg = makeWhatsAppMsg(s.name, s.parent_name, s.subject, bulkSuccess.title, form.description, bulkSuccess.dueDate);
                return (
                  <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "var(--bg-hover)", borderRadius: 10, flexWrap: "wrap", gap: 10 }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{s.name}</p>
                      <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Parent: {s.parent_name} • {s.phone}</p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => copyMsg(msg, i)}
                        style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", cursor: "pointer", fontSize: 12, fontWeight: 500, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {copiedIdx === i ? "✓ Copied!" : "📋 Copy"}
                      </button>
                      <button onClick={() => openWhatsApp(s.phone, msg)}
                        style={{ padding: "7px 14px", borderRadius: 7, background: "#25D366", color: "white", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        📲 WhatsApp
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Group Message */}
          <div id="wa-group" style={{ display: "none" }}>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>Copy this message and paste in your WhatsApp group:</p>
            <div style={{ background: "var(--bg-hover)", borderRadius: 12, padding: "18px", border: "1px solid var(--border)", marginBottom: 14 }}>
              <pre style={{ whiteSpace: "pre-wrap", fontSize: 13, color: "var(--text-primary)", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0, lineHeight: 1.7 }}>
                {getGroupMsg()}
              </pre>
            </div>
            <button onClick={() => { copyMsg(getGroupMsg(), 999); }}
              style={{ padding: "11px 24px", borderRadius: 8, background: "linear-gradient(135deg, #4F46E5, #818CF8)", color: "white", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
              {copiedIdx === 999 ? "✓ Copied!" : "📋 Copy Group Message"}
            </button>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 10 }}>
              💡 Tip: Copy karo aur apne WhatsApp group mein paste karo — sab parents ko ek saath pata lag jayega!
            </p>
          </div>

          <button onClick={() => setBulkSuccess(null)} style={{ marginTop: 16, padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            ✕ Dismiss
          </button>
        </div>
      )}

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
                <button onClick={() => openWhatsApp(hw.students?.phone || "", makeWhatsAppMsg(hw.students?.name || "", hw.students?.parent_name || "", hw.students?.subject || "", hw.title, hw.description, hw.due_date))}
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
