"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Student } from "@/lib/types";

const emptyForm = { name: "", parent_name: "", phone: "", subject: "", monthly_fee: "" };

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("students").select("*").eq("tutor_id", user.id).order("created_at", { ascending: false });
    setStudents(data || []);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = { ...form, monthly_fee: Number(form.monthly_fee), tutor_id: user.id };

    if (editId) {
      await supabase.from("students").update(payload).eq("id", editId);
    } else {
      await supabase.from("students").insert(payload);
    }
    setForm(emptyForm); setShowForm(false); setEditId(null); setLoading(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this student?")) return;
    const supabase = createClient();
    await supabase.from("students").delete().eq("id", id);
    load();
  }

  function startEdit(s: Student) {
    setForm({ name: s.name, parent_name: s.parent_name, phone: s.phone, subject: s.subject, monthly_fee: String(s.monthly_fee) });
    setEditId(s.id); setShowForm(true);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111827" }}>Students</h1>
          <p style={{ color: "#6B7280", marginTop: 4 }}>{students.length} students enrolled</p>
        </div>
        <button className="btn-primary" onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }}>+ Add Student</button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: 28, marginBottom: 28 }}>
          <h2 style={{ fontWeight: 700, marginBottom: 20 }}>{editId ? "Edit Student" : "Add New Student"}</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { label: "Student Name", key: "name", placeholder: "Ali Hassan", type: "text" },
                { label: "Parent Name", key: "parent_name", placeholder: "Hassan Ali", type: "text" },
                { label: "Phone (WhatsApp)", key: "phone", placeholder: "03001234567", type: "tel" },
                { label: "Subject", key: "subject", placeholder: "Math, Physics...", type: "text" },
                { label: "Monthly Fee (PKR)", key: "monthly_fee", placeholder: "5000", type: "number" },
              ].map(f => (
                <div key={f.key}>
                  <label className="label">{f.label}</label>
                  <input className="input" type={f.type} placeholder={f.placeholder} value={(form as any)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} required />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              <button className="btn-primary" type="submit" disabled={loading}>{loading ? "Saving..." : editId ? "Update Student" : "Add Student"}</button>
              <button className="btn-secondary" type="button" onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: "grid", gap: 14 }}>
        {students.length === 0 && (
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
                <button onClick={() => startEdit(s)} style={{ padding: "7px 14px", borderRadius: 6, border: "1px solid #E5E7EB", background: "white", cursor: "pointer", fontSize: 13 }}>✏️ Edit</button>
                <button onClick={() => handleDelete(s.id)} style={{ padding: "7px 14px", borderRadius: 6, border: "1px solid #FCA5A5", background: "#FEF2F2", color: "#DC2626", cursor: "pointer", fontSize: 13 }}>🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
