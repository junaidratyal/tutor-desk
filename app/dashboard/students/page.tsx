"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Student } from "@/lib/types";

const emptyForm = { name: "", parent_name: "", phone: "", subject: "", monthly_fee: "" };

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("students").select("*").eq("tutor_id", user.id).order("created_at", { ascending: false });
    setStudents(data || []);
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    setSaving(true);
    setMsg("Saving...");

    const supabase = createClient();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    if (!user) {
      setMsg("❌ Not logged in!");
      setSaving(false);
      return;
    }

    const payload = {
      name: form.name,
      parent_name: form.parent_name,
      phone: form.phone,
      subject: form.subject,
      monthly_fee: Number(form.monthly_fee),
      tutor_id: user.id,
    };

    const { data, error } = editId
      ? await supabase.from("students").update(payload).eq("id", editId).select()
      : await supabase.from("students").insert(payload).select();

    if (error) {
      setMsg("❌ Error: " + error.message + " | Code: " + error.code);
      setSaving(false);
      return;
    }

    setMsg("✅ Saved! " + JSON.stringify(data));
    setSaving(false);
    setForm(emptyForm);
    setShowForm(false);
    setEditId(null);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete?")) return;
    const supabase = createClient();
    await supabase.from("students").delete().eq("id", id);
    load();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111827" }}>Students</h1>
          <p style={{ color: "#6B7280", marginTop: 4 }}>{students.length} students enrolled</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); setMsg(""); }}
          style={{ background: "#2563EB", color: "white", padding: "10px 20px", borderRadius: 8, fontWeight: 600, fontSize: 14, border: "none", cursor: "pointer" }}>
          + Add Student
        </button>
      </div>

      {msg && (
        <div style={{ background: msg.includes("❌") ? "#FEE2E2" : "#DCFCE7", color: msg.includes("❌") ? "#DC2626" : "#15803D", padding: "12px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13, wordBreak: "break-all" }}>
          {msg}
        </div>
      )}

      {showForm && (
        <div className="card" style={{ padding: 28, marginBottom: 28 }}>
          <h2 style={{ fontWeight: 700, marginBottom: 20 }}>{editId ? "Edit Student" : "Add New Student"}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label className="label">Student Name</label>
              <input className="input" type="text" placeholder="Ali Hassan" value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Parent Name</label>
              <input className="input" type="text" placeholder="Hassan Ali" value={form.parent_name}
                onChange={e => setForm(p => ({ ...p, parent_name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Phone (WhatsApp)</label>
              <input className="input" type="tel" placeholder="03001234567" value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div>
              <label className="label">Subject</label>
              <input className="input" type="text" placeholder="Math, Physics..." value={form.subject}
                onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} />
            </div>
            <div>
              <label className="label">Monthly Fee (PKR)</label>
              <input className="input" type="number" placeholder="5000" value={form.monthly_fee}
                onChange={e => setForm(p => ({ ...p, monthly_fee: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <button onClick={handleSave} disabled={saving}
              style={{ background: "#2563EB", color: "white", padding: "11px 24px", borderRadius: 8, fontWeight: 600, fontSize: 14, border: "none", cursor: "pointer" }}>
              {saving ? "Saving..." : editId ? "Update" : "Add Student"}
            </button>
            <button onClick={() => { setShowForm(false); setMsg(""); }}
              style={{ background: "white", color: "#374151", padding: "11px 24px", borderRadius: 8, fontWeight: 500, fontSize: 14, border: "1px solid #D1D5DB", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: 14 }}>
        {students.length === 0 && !showForm && (
          <div className="card" style={{ padding: 48, textAlign: "center", color: "#9CA3AF" }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>👨‍🎓</p>
            <p style={{ fontWeight: 600, fontSize: 16 }}>No students yet</p>
            <p style={{ fontSize: 14 }}>Click "Add Student" to get started</p>
          </div>
        )}
        {students.map(s => (
          <div key={s.id} className="card" style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ background: "#DBEAFE", borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>👤</div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>{s.name}</p>
                <p style={{ color: "#6B7280", fontSize: 13 }}>Parent: {s.parent_name} • {s.phone}</p>
                <p style={{ color: "#6B7280", fontSize: 13 }}>Subject: {s.subject}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontWeight: 700, color: "#2563EB", fontSize: 16 }}>PKR {s.monthly_fee.toLocaleString()}</p>
                <p style={{ color: "#9CA3AF", fontSize: 12 }}>per month</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setEditId(s.id); setForm({ name: s.name, parent_name: s.parent_name, phone: s.phone, subject: s.subject, monthly_fee: String(s.monthly_fee) }); setShowForm(true); }}
                  style={{ padding: "7px 14px", borderRadius: 6, border: "1px solid #E5E7EB", background: "white", cursor: "pointer", fontSize: 13 }}>✏️ Edit</button>
                <button onClick={() => handleDelete(s.id)}
                  style={{ padding: "7px 14px", borderRadius: 6, border: "1px solid #FCA5A5", background: "#FEF2F2", color: "#DC2626", cursor: "pointer", fontSize: 13 }}>🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
