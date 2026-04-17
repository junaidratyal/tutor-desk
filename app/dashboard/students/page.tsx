"use client";
import { useEffect, useState, useRef } from "react";
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
  avatar_url?: string;
  created_at: string;
}

const emptyForm = { name: "", parent_name: "", phone: "", subject: "", monthly_fee: "", email: "" };

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [inviteSent, setInviteSent] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);

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

  async function handleDelete(id: string) {
    if (!confirm("Delete this student?")) return;
    const supabase = createClient();
    await supabase.from("students").delete().eq("id", id);
    load();
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetId) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File too large! Max 2MB allowed.");
      return;
    }

    setUploadingId(uploadTargetId);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `students/${uploadTargetId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      alert("Upload failed: " + uploadError.message);
      setUploadingId(null);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);

    await supabase.from("students").update({ avatar_url: publicUrl + "?t=" + Date.now() }).eq("id", uploadTargetId);
    setUploadingId(null);
    setUploadTargetId(null);
    load();
  }

  async function removeAvatar(student: Student) {
    if (!confirm("Remove profile picture?")) return;
    const supabase = createClient();
    await supabase.from("students").update({ avatar_url: null }).eq("id", student.id);
    load();
  }

  async function sendInvite(student: Student) {
    if (!student.email) { alert("Please add student email first!"); return; }
    const portalUrl = `${window.location.origin}/student/login?email=${encodeURIComponent(student.email)}`;
    const msg = `Assalam o Alaikum ${student.name}! 👋\n\nYour Tutor Desk Student Portal is ready!\n\n🎓 *Student Portal Access*\nEmail: ${student.email}\nPortal: ${portalUrl}\n\nSteps:\n1. Open the link above\n2. Click "Create Account"\n3. Enter your email and set a password\n4. Login to see your assignments, attendance & more!\n\nSee you in class! 📚\n— Your Tutor`;
    navigator.clipboard.writeText(msg);
    setInviteSent(student.id);
    setTimeout(() => setInviteSent(null), 3000);
    const phone = student.phone.replace(/\D/g, "");
    const intl = phone.startsWith("0") ? "92" + phone.slice(1) : phone;
    window.open(`https://wa.me/${intl}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  async function sendAllInvites() {
    const withEmail = students.filter(s => s.email);
    if (!withEmail.length) { alert("No students have email addresses!"); return; }
    const portalUrl = `${window.location.origin}/student/login`;
    const groupMsg = `Assalam o Alaikum Students & Parents! 👋\n\n🎓 *Tutor Desk Student Portal is now LIVE!*\n\nAll students can now access their:\n✅ Homework & Assignments\n✅ Attendance Records\n✅ Fee Status\n✅ Upcoming Sessions\n✅ Announcements\n\n*How to Access:*\n1. Go to: ${portalUrl}\n2. Click "Create Account"\n3. Use your registered email\n4. Set a password and login!\n\nStudents registered:\n${withEmail.map(s => `• ${s.name} (${s.email})`).join("\n")}\n\nSee you online! 📱\n— Tutor Desk`;
    navigator.clipboard.writeText(groupMsg);
    alert(`✅ Group message copied!\n\nPaste it in your WhatsApp group.\n${withEmail.length} students with emails will be notified.`);
  }

  function startEdit(s: Student) {
    setForm({ name: s.name, parent_name: s.parent_name, phone: s.phone, subject: s.subject, monthly_fee: String(s.monthly_fee), email: s.email || "" });
    setEditId(s.id);
    setShowForm(true);
  }

  return (
    <div>
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} />

      {/* Header */}
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

      {/* Portal Banner */}
      <div style={{ background: "linear-gradient(135deg, #EEF2FF, #E0E7FF)", border: "1px solid #C7D2FE", borderRadius: 14, padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 24 }}>🎓</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: "#4F46E5" }}>Student Portal is Live!</p>
          <p style={{ fontSize: 13, color: "#6366F1" }}>Students login at: <strong>{typeof window !== "undefined" ? window.location.origin : ""}/student/login</strong></p>
        </div>
        <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/student/login`); alert("Copied!"); }}
          style={{ padding: "7px 14px", background: "#4F46E5", color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", whiteSpace: "nowrap" }}>
          📋 Copy Link
        </button>
      </div>

      {/* Add/Edit Form */}
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

      {/* Students List */}
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
              {/* Avatar */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", overflow: "hidden", border: "2px solid var(--border)", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                  onClick={() => { setUploadTargetId(s.id); fileInputRef.current?.click(); }}>
                  {uploadingId === s.id ? (
                    <span style={{ fontSize: 18 }}>⏳</span>
                  ) : s.avatar_url ? (
                    <img src={s.avatar_url} alt={s.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: 20, fontWeight: 700, color: "#4F46E5" }}>{s.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                {/* Camera icon */}
                <div style={{ position: "absolute", bottom: 0, right: 0, background: "#4F46E5", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, cursor: "pointer", border: "1px solid white" }}
                  onClick={() => { setUploadTargetId(s.id); fileInputRef.current?.click(); }}>
                  📷
                </div>
              </div>

              <div>
                <p style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>{s.name}</p>
                <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>Parent: {s.parent_name} • {s.phone}</p>
                <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                  {s.subject}
                  {s.email && <span style={{ color: "#4F46E5" }}> • 📧 {s.email}</span>}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontWeight: 700, color: "#4F46E5", fontSize: 16 }}>PKR {s.monthly_fee.toLocaleString()}</p>
                <p style={{ color: "var(--text-muted)", fontSize: 12 }}>per month</p>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {s.email && (
                  <button onClick={() => sendInvite(s)}
                    style={{ padding: "7px 12px", borderRadius: 6, border: "1px solid #A7F3D0", background: inviteSent === s.id ? "#ECFDF5" : "white", color: inviteSent === s.id ? "#059669" : "#10B981", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {inviteSent === s.id ? "✓" : "📲"}
                  </button>
                )}
                {s.avatar_url && (
                  <button onClick={() => removeAvatar(s)}
                    style={{ padding: "7px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-muted)", cursor: "pointer", fontSize: 12, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    title="Remove photo">
                    🗑️📷
                  </button>
                )}
                <button onClick={() => startEdit(s)} style={{ padding: "7px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-card)", cursor: "pointer", fontSize: 13, color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>✏️</button>
                <button onClick={() => handleDelete(s.id)} style={{ padding: "7px 10px", borderRadius: 6, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", cursor: "pointer", fontSize: 13 }}>🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
