
"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

interface Student {
  id: string;
  name: string;
  phone: string;
  parent_name: string;
  subject: string;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
}

const TYPE_CONFIG = {
  general:  { label: "General",  icon: "📢", bg: "#EEF2FF", color: "#4F46E5", border: "#C7D2FE" },
  urgent:   { label: "Urgent",   icon: "🚨", bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
  holiday:  { label: "Holiday",  icon: "🎉", bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
  exam:     { label: "Exam",     icon: "📝", bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" },
  fee:      { label: "Fee",      icon: "💰", bg: "#F0FDF4", color: "#16A34A", border: "#86EFAC" },
};

export default function AnnouncementsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [sentWa, setSentWa] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", message: "", type: "general" });
  const [activeAnn, setActiveAnn] = useState<Announcement | null>(null);

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: st } = await supabase.from("students").select("id, name, phone, parent_name, subject").eq("tutor_id", user.id);
    setStudents(st || []);
    const { data: ann } = await supabase.from("announcements").select("*").eq("tutor_id", user.id).order("created_at", { ascending: false });
    setAnnouncements(ann || []);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("announcements").insert({
      tutor_id: user.id,
      title: form.title,
      message: form.message,
      type: form.type,
    }).select().single();
    setLoading(false);
    setShowForm(false);
    if (data) {
      setAnnouncements(prev => [data, ...prev]);
      setActiveAnn(data);
    }
    setForm({ title: "", message: "", type: "general" });
  }

  async function deleteAnn(id: string) {
    if (!confirm("Delete this announcement?")) return;
    const supabase = createClient();
    await supabase.from("announcements").delete().eq("id", id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    if (activeAnn?.id === id) setActiveAnn(null);
  }

  function getWhatsAppMsg(ann: Announcement, studentName = "", parentName = "") {
    const cfg = TYPE_CONFIG[ann.type as keyof typeof TYPE_CONFIG];
    return `Assalam o Alaikum ${parentName || "Parents"}! 👋

${cfg.icon} *${ann.title}*
${ann.type === "urgent" ? "⚠️ IMPORTANT NOTICE ⚠️\n" : ""}
${ann.message}

${studentName ? `Student: *${studentName}*\n` : ""}Date: ${new Date(ann.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })}

Thank you! 🙏
— Tutor Desk`;
  }

  function getGroupMsg(ann: Announcement) {
    const cfg = TYPE_CONFIG[ann.type as keyof typeof TYPE_CONFIG];
    return `Assalam o Alaikum Parents! 👋

${cfg.icon} *${ann.title}*
${ann.type === "urgent" ? "⚠️ IMPORTANT NOTICE ⚠️\n" : ""}
${ann.message}

Date: ${new Date(ann.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })}

This message is for all students.
Thank you! 🙏
— Tutor Desk`;
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  function openWhatsApp(phone: string, msg: string, key: string) {
    const clean = phone.replace(/\D/g, "");
    const intl = clean.startsWith("0") ? "92" + clean.slice(1) : clean;
    window.open(`https://wa.me/${intl}?text=${encodeURIComponent(msg)}`, "_blank");
    setSentWa(key);
    setTimeout(() => setSentWa(null), 2000);
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)" }}>Announcements</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: 4 }}>Send announcements to all students at once</p>
        </div>
        <button onClick={() => { setShowForm(true); setActiveAnn(null); }} className="btn-primary">
          📣 New Announcement
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="card" style={{ padding: "24px 28px", marginBottom: 24 }}>
          <h2 style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)", marginBottom: 20 }}>📣 New Announcement</h2>
          <form onSubmit={handleAdd}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label className="label">Title</label>
                <input className="input" type="text" placeholder="e.g. Class cancelled tomorrow, Exam next week..." value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Type</label>
                <select className="input" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                  {Object.entries(TYPE_CONFIG).map(([key, val]) => (
                    <option key={key} value={key}>{val.icon} {val.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="label">Message</label>
              <textarea className="input" placeholder="Write your announcement here..." value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} rows={4} style={{ resize: "vertical" }} required />
            </div>

            {/* Preview */}
            {form.title && form.message && (
              <div style={{ background: "var(--bg-hover)", borderRadius: 12, padding: "14px 16px", marginBottom: 16, border: "1px solid var(--border)" }}>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8, fontWeight: 600 }}>PREVIEW</p>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                  {getWhatsAppMsg({ id: "", title: form.title, message: form.message, type: form.type, created_at: new Date().toISOString() }, "[Student Name]", "[Parent Name]")}
                </p>
              </div>
            )}

            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" className="btn-primary" disabled={loading}>{loading ? "Saving..." : "Create Announcement"}</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Send Panel — appears after creating or clicking */}
      {activeAnn && (
        <div className="card" style={{ padding: "24px 28px", marginBottom: 24, border: `2px solid ${TYPE_CONFIG[activeAnn.type as keyof typeof TYPE_CONFIG]?.border || "#C7D2FE"}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <span style={{ fontSize: 28 }}>{TYPE_CONFIG[activeAnn.type as keyof typeof TYPE_CONFIG]?.icon}</span>
            <div>
              <p style={{ fontWeight: 800, fontSize: 16, color: "var(--text-primary)" }}>{activeAnn.title}</p>
              <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Send to {students.length} students</p>
            </div>
            <button onClick={() => setActiveAnn(null)} style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 18 }}>✕</button>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, background: "var(--bg-hover)", borderRadius: 10, padding: 4, marginBottom: 20, width: "fit-content" }}>
            {["individual", "group"].map((t, i) => (
              <button key={t} id={`ann-tab-${i}`}
                onClick={() => {
                  ["individual","group"].forEach((_, j) => {
                    const el = document.getElementById(`ann-panel-${j}`);
                    const btn = document.getElementById(`ann-tab-${j}`);
                    if (el) el.style.display = j === i ? "block" : "none";
                    if (btn) { btn.style.background = j === i ? "var(--bg-card)" : "transparent"; btn.style.color = j === i ? "#4F46E5" : "var(--text-secondary)"; }
                  });
                }}
                style={{ padding: "8px 18px", borderRadius: 8, border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", background: i === 0 ? "var(--bg-card)" : "transparent", color: i === 0 ? "#4F46E5" : "var(--text-secondary)", transition: "all 0.2s" }}>
                {t === "individual" ? "👤 Individual" : "👥 Group Message"}
              </button>
            ))}
          </div>

          {/* Individual */}
          <div id="ann-panel-0">
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>Send personalized message to each parent:</p>
            <div style={{ display: "grid", gap: 8 }}>
              {students.map((s, i) => {
                const msg = getWhatsAppMsg(activeAnn, s.name, s.parent_name);
                const copyKey = `copy-${s.id}`;
                const waKey = `wa-${s.id}`;
                return (
                  <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "var(--bg-hover)", borderRadius: 10, flexWrap: "wrap", gap: 10 }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{s.name}</p>
                      <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Parent: {s.parent_name} • {s.phone}</p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => copyText(msg, copyKey)}
                        style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", cursor: "pointer", fontSize: 12, fontWeight: 500, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {copied === copyKey ? "✓ Copied!" : "📋 Copy"}
                      </button>
                      <button onClick={() => openWhatsApp(s.phone, msg, waKey)}
                        style={{ padding: "7px 14px", borderRadius: 7, background: "#25D366", color: "white", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {sentWa === waKey ? "✓ Sent!" : "📲 Send"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Group */}
          <div id="ann-panel-1" style={{ display: "none" }}>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>Copy and paste in your WhatsApp group:</p>
            <div style={{ background: "var(--bg-hover)", borderRadius: 12, padding: "16px", border: "1px solid var(--border)", marginBottom: 14 }}>
              <pre style={{ whiteSpace: "pre-wrap", fontSize: 13, color: "var(--text-primary)", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0, lineHeight: 1.7 }}>
                {getGroupMsg(activeAnn)}
              </pre>
            </div>
            <button onClick={() => copyText(getGroupMsg(activeAnn), "group")}
              style={{ padding: "11px 24px", background: "linear-gradient(135deg, #4F46E5, #818CF8)", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
              {copied === "group" ? "✓ Copied!" : "📋 Copy Group Message"}
            </button>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 10 }}>
              💡 Copy karo aur WhatsApp group mein paste karo — sab parents ko ek saath mil jayega!
            </p>
          </div>
        </div>
      )}

      {/* Announcements List */}
      <div style={{ display: "grid", gap: 12 }}>
        {announcements.length === 0 && (
          <div className="card" style={{ padding: 48, textAlign: "center" }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>📢</p>
            <p style={{ fontWeight: 600, fontSize: 16, color: "var(--text-primary)" }}>No announcements yet</p>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>Create your first announcement above</p>
          </div>
        )}
        {announcements.map(ann => {
          const cfg = TYPE_CONFIG[ann.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.general;
          return (
            <div key={ann.id} className="card" style={{ padding: "18px 24px", borderLeft: `4px solid ${cfg.color}`, cursor: "pointer" }}
              onClick={() => setActiveAnn(ann)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 18 }}>{cfg.icon}</span>
                    <p style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>{ann.title}</p>
                    <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                      {cfg.label}
                    </span>
                  </div>
                  <p style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.5 }}>{ann.message.length > 100 ? ann.message.slice(0, 100) + "..." : ann.message}</p>
                  <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 6 }}>
                    {new Date(ann.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={e => { e.stopPropagation(); setActiveAnn(ann); }}
                    style={{ padding: "7px 14px", borderRadius: 7, background: "#25D366", color: "white", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    📲 Send
                  </button>
                  <button onClick={e => { e.stopPropagation(); deleteAnn(ann.id); }}
                    style={{ padding: "7px 12px", borderRadius: 7, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", cursor: "pointer", fontSize: 13 }}>
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
