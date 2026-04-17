"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

interface Student {
  id: string;
  tutor_id: string;
  name: string;
  parent_name: string;
  phone: string;
  subject: string;
  monthly_fee: number;
  email: string;
  created_at: string;
}

const emptyForm = { name: "", parent_name: "", phone: "", subject: "", monthly_fee: "", email: "" };

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [inviteSent, setInviteSent] = useState<string | null>(null);

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
    setMsg("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMsg("❌ Not logged in!"); setSaving(false); return; }

    const payload = {
      name: form.name,
      parent_name: form.parent_name,
      phone: form.phone,
      subject: form.subject,
      monthly_fee: Number(form.monthly_fee),
      email: form.email.trim().toLowerCase(),
      tutor_id: user.id,
    };

    const { error } = editId
      ? await supabase.from("students").update(payload).eq("id", editId)
      : await supabase.from("students").insert(payload);

    if (error) { setMsg("❌ Error: " + error.message); setSaving(false); return; }

    setMsg("✅ Saved!");
    setSaving(false);
    setForm(emptyForm);
    setShowForm(false);
    setEditId(null);
    setTimeout(() => setMsg(""), 2000);
    load();
  }

  const [saving, setSaving] = useState(false);

  async function handleDelete(id: string) {
    if (!confirm("Delete this student?")) return;
    const supabase = createClient();
    await supabase.from("students").delete().eq("id", id);
    load();
  }

  async function sendInvite(student: Student) {
    if (!student.email) { alert("Please add student email first!"); return; }

    const supabase = createClient();

    // Check if already has account
    const { data: acc } = await supabase
      .from("student_accounts")
      .select("id, user_id")
      .eq("student_id", student.id)
      .single();

    const portalUrl = `${window.location.origin}/student/login?email=${encodeURIComponent(student.email)}`;
    const msg = `Assalam o Alaikum ${student.name}! 👋

Your Tutor Desk Student Portal is ready!

🎓 *Student Portal Access*
Email: ${student.email}
Portal: ${portalUrl}

Steps:
1. Open the link above
2. Click "Create Account"
3. Enter your email and set a password
4. Login to see your assignments, attendance & more!

See you in class! 📚
— Your Tutor`;

    // Copy to clipboard
    navigator.clipboard.writeText(msg);
    setInviteSent(student.id);
    setTimeout(() => setInviteSent(null), 3000);

    // Also open WhatsApp
    const phone = student.phone.replace(/\D/g, "");
    const intl = phone.startsWith("0") ? "92" + phone.slice(1) : phone;
    window.open(`https://wa.me/${intl}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  async function sendAllInvites() {
    const studentsWithEmail = students.filter(s => s.email);
    if (studentsWithEmail.length === 0) { alert("No students have email addresses. Add emails first!"); return; }

    const portalUrl = `${window.location.origin}/student/login`;
    const groupMsg = `Assalam o Alaikum Students & Parents! 👋

🎓 *Tutor Desk Student Portal is now LIVE!*

All students can now access their:
✅ Homework & Assignments
✅ Attendance Records
✅ Fee Status
✅ Upcoming Sessions

*How to Access:*
1. Go to: ${portalUrl}
2. Click "Create Account"
3. Use your registered email
4. Set a password and login!

Students registered:
${studentsWithEmail.map(s => `• ${s.name} (${s.email})`).join("\n")}

See you online! 📱
— Tutor Desk`;

    navigator.clipboard.writeText(groupMsg);
    alert(`✅ Group message copied!\n\nPaste it in your WhatsApp group.\n${studentsWithEmail.length} students with emails will be notified.`);
  }

  function startEdit(s: Student) {
    setForm({ name: s.name, parent_name: s.parent_name, phone: s.phone, subject: s.subject, monthly_fee: String(s.monthly_fee), email: s.email || "" });
    setEditId(s.id);
    setShowForm(true);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)" }}>Students</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: 4 }}>{students.length} students enrolled</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={sendAllInvites}
            style={{ padding: "10px 18px", background: "#ECFDF5", color: "#059669", border: "1px solid #A7F3D0", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            📲 Invite All to Portal
          </button>
          <button className="btn-primary" onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); setMsg(""); }}>
            + Add Student
          </button>
        </div>
      </div>

      {msg && (
        <div style={{ background: msg.includes("❌") ? "#FEF2F2" : "#ECFDF5", color: msg.includes("❌") ? "#DC2626" : "#059669", padding: "12px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          {msg}
        </div>
      )}

      {/* Student Portal Info Banner */}
      <div style={{ background: "linear-gradient(135deg, #EEF2FF, #E0E7FF)", border: "1px solid #C7D2FE", borderRadius: 14, padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 24 }}>🎓</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: "#4F46E5" }}>Student Portal is Live!</p>
          <p style={{ fontSize: 13, color: "#6366F1" }}>
            Students can login at: <strong>{typeof window !== "undefined" ? window.location.origin : ""}/student/login</strong>
          </p>
        </div>
        <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/student/login`); alert("Link copied!"); }}
          style={{ padding: "7px 14px", background: "#4F46E5", color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", whiteSpace: "nowrap" }}>
          📋 Copy Link
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: 28, marginBottom: 28 }}>
          <h2 style={{ fontWeight: 700, marginBottom: 20, color: "var(--text-primary)" }}>{editId ? "Edit Student" : "Add New Student"}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="form-grid">
            {[
              { label: "Student Name", key: "name", placeholder: "Ali Hassan", type: "text" },
              { label: "Parent Name", key: "parent_name", placeholder: "Hassan Ali", type: "text" },
              { label: "Phone (WhatsApp)", key: "phone", placeholder: "03001234567", type: "tel" },
              { label: "Subject", key: "subject", placeholder: "Math, Physics...", type: "text" },
              { label: "Monthly Fee (PKR)", key: "monthly_fee", placeholder: "5000", type: "number" },
              { label: "Student Email (for portal)", key: "email", placeholder: "student@email.com", type: "email" },
            ].map(f => (
              <div key={f.key}>
                <label className="label">{f.label}</label>
                <input className="input" type={f.type} placeholder={f.placeholder} value={(form as any)[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editId ? "Update" : "Add Student"}</button>
            <button className="btn-secondary" onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: 14 }}>
        {students.length === 0 && !showForm && (
          <div className="card" style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>👨‍🎓</p>
            <p style={{ fontWeight: 600, fontSize: 16, color: "var(--text-primary)" }}>No students yet</p>
            <p style={{ fontSize: 14 }}>Click "Add Student" to get started</p>
          </div>
        )}
        {students.map(s => (
          <div key={s.id} className="card" style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ background: "#EEF2FF", borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#4F46E5" }}>
                {s.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>{s.name}</p>
                <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>Parent: {s.parent_name} • {s.phone}</p>
                <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>Subject: {s.subject} {s.email && <span style={{ color: "#4F46E5" }}>• 📧 {s.email}</span>}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontWeight: 700, color: "#4F46E5", fontSize: 16 }}>PKR {s.monthly_fee.toLocaleString()}</p>
                <p style={{ color: "var(--text-muted)", fontSize: 12 }}>per month</p>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {s.email && (
                  <button onClick={() => sendInvite(s)}
                    style={{ padding: "7px 14px", borderRadius: 6, border: "1px solid #A7F3D0", background: inviteSent === s.id ? "#ECFDF5" : "white", color: inviteSent === s.id ? "#059669" : "#10B981", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {inviteSent === s.id ? "✓ Sent!" : "📲 Invite"}
                  </button>
                )}
                <button onClick={() => startEdit(s)} style={{ padding: "7px 14px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-card)", cursor: "pointer", fontSize: 13, color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>✏️ Edit</button>
                <button onClick={() => handleDelete(s.id)} style={{ padding: "7px 12px", borderRadius: 6, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", cursor: "pointer", fontSize: 13 }}>🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
