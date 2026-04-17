"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

interface StudentData {
  id: string;
  name: string;
  subject: string;
  monthly_fee: number;
  parent_name: string;
  avatar_url?: string;
}

interface Homework {
  id: string;
  title: string;
  description: string;
  due_date: string;
  status: "pending" | "submitted" | "late";
}

interface Attendance {
  date: string;
  status: "present" | "absent" | "leave";
}

interface Payment {
  month: number;
  year: number;
  status: "paid" | "unpaid";
  amount: number;
}

interface Session {
  date: string;
  time: string;
  duration: number;
  status: string;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const ANN_TYPE = {
  general:  { icon: "📢", color: "#4F46E5", bg: "#EEF2FF" },
  urgent:   { icon: "🚨", color: "#DC2626", bg: "#FEF2F2" },
  holiday:  { icon: "🎉", color: "#059669", bg: "#ECFDF5" },
  exam:     { icon: "📝", color: "#D97706", bg: "#FFFBEB" },
  fee:      { icon: "💰", color: "#16A34A", bg: "#F0FDF4" },
};

function localDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"home"|"homework"|"attendance"|"fees"|"schedule"|"announcements">("home");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/student/login"); return; }

      const { data: acc } = await supabase
        .from("student_accounts").select("*, students(*)")
        .eq("user_id", user.id).single();

      if (!acc) { router.push("/student/login"); return; }

      const s = acc.students as StudentData;
      setStudent(s);

      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const startDate = `${year}-${String(month).padStart(2,"0")}-01`;
      const endDate = `${year}-${String(month).padStart(2,"0")}-31`;
      const today = localDateStr(now);

      const [hwRes, attRes, payRes, sessRes, annRes] = await Promise.all([
        supabase.from("homework").select("*").eq("student_id", s.id).order("due_date", { ascending: true }),
        supabase.from("attendance").select("*").eq("student_id", s.id).gte("date", startDate).lte("date", endDate).order("date", { ascending: false }),
        supabase.from("payments").select("*").eq("student_id", s.id).order("year", { ascending: false }).order("month", { ascending: false }),
        supabase.from("sessions").select("*").eq("student_id", s.id).gte("date", today).order("date", { ascending: true }).limit(5),
        supabase.from("announcements").select("*").eq("tutor_id", (await supabase.from("students").select("tutor_id").eq("id", s.id).single()).data?.tutor_id).order("created_at", { ascending: false }).limit(10),
      ]);

      const hw = (hwRes.data || []).map(h =>
        h.status === "pending" && h.due_date < today ? { ...h, status: "late" as const } : h
      );
      setHomework(hw);
      setAttendance(attRes.data || []);
      setPayments(payRes.data || []);
      setSessions(sessRes.data || []);
      setAnnouncements(annRes.data || []);
      setLoading(false);
    }
    load();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/student/login");
  }

  async function markSubmitted(hwId: string) {
    const supabase = createClient();
    await supabase.from("homework").update({ status: "submitted" }).eq("id", hwId);
    setHomework(prev => prev.map(h => h.id === hwId ? { ...h, status: "submitted" as const } : h));
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !student) return;

    if (file.size > 2 * 1024 * 1024) { alert("Max 2MB allowed!"); return; }

    setUploadingPhoto(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `students/${student.id}.${ext}`;

    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { alert("Upload failed: " + error.message); setUploadingPhoto(false); return; }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    const newUrl = publicUrl + "?t=" + Date.now();
    await supabase.from("students").update({ avatar_url: newUrl }).eq("id", student.id);
    setStudent(prev => prev ? { ...prev, avatar_url: newUrl } : prev);
    setUploadingPhoto(false);
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F0FDF4", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <p style={{ color: "#94A3B8" }}>Loading your portal...</p>
    </div>
  );

  if (!student) return null;

  const pendingHw = homework.filter(h => h.status === "pending").length;
  const lateHw = homework.filter(h => h.status === "late").length;
  const presentDays = attendance.filter(a => a.status === "present").length;
  const totalDays = attendance.length;
  const attPct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
  const currentPayment = payments.find(p => p.month === new Date().getMonth() + 1 && p.year === new Date().getFullYear());

  const tabs = [
    { id: "home", label: "Home", icon: "🏠" },
    { id: "announcements", label: "Notices", icon: "📢", badge: announcements.length > 0 ? announcements.length : 0 },
    { id: "homework", label: "Homework", icon: "📝", badge: lateHw > 0 ? lateHw : pendingHw > 0 ? pendingHw : 0 },
    { id: "attendance", label: "Attendance", icon: "✅" },
    { id: "fees", label: "Fees", icon: "💰" },
    { id: "schedule", label: "Schedule", icon: "📅" },
  ] as const;

  return (
    <div style={{ minHeight: "100vh", background: "#F0FDF4", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoUpload} />

      {/* Header */}
      <nav style={{ background: "white", borderBottom: "1px solid #E2E8F0", padding: "0 24px", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Avatar with upload */}
            <div style={{ position: "relative", cursor: "pointer" }} onClick={() => fileInputRef.current?.click()}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", overflow: "hidden", border: "2px solid #10B981", background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {uploadingPhoto ? (
                  <span style={{ fontSize: 16 }}>⏳</span>
                ) : student.avatar_url ? (
                  <img src={student.avatar_url} alt={student.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#10B981" }}>{student.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div style={{ position: "absolute", bottom: 0, right: 0, background: "#10B981", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, border: "1px solid white" }}>
                📷
              </div>
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: 15, color: "#0F172A" }}>{student.name}</p>
              <p style={{ fontSize: 11, color: "#94A3B8" }}>{student.subject} Student • Tap photo to change</p>
            </div>
          </div>
          <button onClick={handleLogout} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #E2E8F0", background: "white", color: "#64748B", fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Logout
          </button>
        </div>
      </nav>

      {/* Tab Nav */}
      <div style={{ background: "white", borderBottom: "1px solid #E2E8F0" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", overflowX: "auto" }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              style={{ padding: "14px 18px", border: "none", borderBottom: `3px solid ${activeTab === tab.id ? "#10B981" : "transparent"}`, background: "transparent", color: activeTab === tab.id ? "#10B981" : "#64748B", fontWeight: activeTab === tab.id ? 700 : 500, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", transition: "all 0.2s" }}>
              {tab.icon} {tab.label}
              {"badge" in tab && tab.badge > 0 && (
                <span style={{ background: lateHw > 0 && tab.id === "homework" ? "#EF4444" : "#10B981", color: "white", borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>

        {/* HOME */}
        {activeTab === "home" && (
          <div className="fade-in">
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>Assalam o Alaikum, {student.name.split(" ")[0]}! 👋</h1>
            <p style={{ color: "#64748B", marginBottom: 20, fontSize: 14 }}>Here's your learning overview</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Attendance", value: `${attPct}%`, sub: `${presentDays}/${totalDays} days`, icon: "✅", color: attPct >= 75 ? "#059669" : "#DC2626", bg: attPct >= 75 ? "#ECFDF5" : "#FEF2F2", tab: "attendance" },
                { label: "Pending Homework", value: pendingHw + lateHw, sub: `${lateHw} late`, icon: "📝", color: lateHw > 0 ? "#DC2626" : "#D97706", bg: lateHw > 0 ? "#FEF2F2" : "#FFFBEB", tab: "homework" },
                { label: "Fee Status", value: currentPayment?.status === "paid" ? "Paid ✓" : "Pending", sub: `PKR ${student.monthly_fee.toLocaleString()}/month`, icon: "💰", color: currentPayment?.status === "paid" ? "#059669" : "#DC2626", bg: currentPayment?.status === "paid" ? "#ECFDF5" : "#FEF2F2", tab: "fees" },
                { label: "Upcoming Sessions", value: sessions.length, sub: sessions[0] ? `Next: ${sessions[0].date}` : "No sessions", icon: "📅", color: "#4F46E5", bg: "#EEF2FF", tab: "schedule" },
              ].map((card, i) => (
                <div key={i} style={{ background: "white", borderRadius: 14, padding: "16px 18px", border: "1px solid #E2E8F0", cursor: "pointer" }}
                  onClick={() => setActiveTab(card.tab as any)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <p style={{ fontSize: 12, color: "#64748B", fontWeight: 500 }}>{card.label}</p>
                    <div style={{ background: card.bg, borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>{card.icon}</div>
                  </div>
                  <p style={{ fontSize: 24, fontWeight: 800, color: card.color }}>{card.value}</p>
                  <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Latest Announcement */}
            {announcements[0] && (
              <div style={{ background: "white", borderRadius: 14, padding: "16px 18px", border: "1px solid #E2E8F0", marginBottom: 12, cursor: "pointer" }}
                onClick={() => setActiveTab("announcements")}>
                <p style={{ fontSize: 12, color: "#64748B", fontWeight: 600, marginBottom: 8 }}>📢 LATEST NOTICE</p>
                <p style={{ fontWeight: 700, fontSize: 14, color: "#0F172A" }}>{announcements[0].title}</p>
                <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>{announcements[0].message.slice(0, 80)}...</p>
              </div>
            )}

            {/* Late homework alert */}
            {lateHw > 0 && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
                onClick={() => setActiveTab("homework")}>
                <span style={{ fontSize: 22 }}>⚠️</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, color: "#DC2626", fontSize: 13 }}>{lateHw} overdue assignment{lateHw > 1 ? "s" : ""}!</p>
                  <p style={{ color: "#EF4444", fontSize: 12 }}>Submit as soon as possible</p>
                </div>
                <span style={{ color: "#DC2626" }}>→</span>
              </div>
            )}
          </div>
        )}

        {/* ANNOUNCEMENTS */}
        {activeTab === "announcements" && (
          <div className="fade-in">
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginBottom: 20 }}>📢 Notices & Announcements</h2>
            {announcements.length === 0 ? (
              <div style={{ background: "white", borderRadius: 14, padding: 48, textAlign: "center" }}>
                <p style={{ fontSize: 36, marginBottom: 12 }}>📢</p>
                <p style={{ fontWeight: 600, color: "#0F172A" }}>No announcements yet</p>
              </div>
            ) : announcements.map(ann => {
              const cfg = ANN_TYPE[ann.type as keyof typeof ANN_TYPE] || ANN_TYPE.general;
              return (
                <div key={ann.id} style={{ background: "white", borderRadius: 14, padding: "18px 20px", border: "1px solid #E2E8F0", marginBottom: 12, borderLeft: `4px solid ${cfg.color}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 20 }}>{cfg.icon}</span>
                    <p style={{ fontWeight: 700, fontSize: 15, color: "#0F172A" }}>{ann.title}</p>
                  </div>
                  <p style={{ color: "#374151", fontSize: 14, lineHeight: 1.6, marginBottom: 8 }}>{ann.message}</p>
                  <p style={{ color: "#94A3B8", fontSize: 12 }}>
                    {new Date(ann.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* HOMEWORK */}
        {activeTab === "homework" && (
          <div className="fade-in">
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginBottom: 20 }}>📝 My Homework</h2>
            {homework.length === 0 ? (
              <div style={{ background: "white", borderRadius: 14, padding: 48, textAlign: "center" }}>
                <p style={{ fontSize: 36, marginBottom: 12 }}>🎉</p>
                <p style={{ fontWeight: 600, color: "#0F172A" }}>No homework assigned yet!</p>
              </div>
            ) : homework.map(hw => {
              const statusColors = {
                pending:   { bg: "#FFFBEB", color: "#D97706", border: "#FDE68A", icon: "⏳" },
                submitted: { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0", icon: "✅" },
                late:      { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA", icon: "❌" },
              };
              const cfg = statusColors[hw.status];
              const due = new Date(hw.due_date + "T00:00:00");
              const diff = Math.ceil((due.getTime() - new Date().getTime()) / (1000*60*60*24));
              return (
                <div key={hw.id} style={{ background: "white", borderRadius: 14, padding: "16px 18px", border: "1px solid #E2E8F0", marginBottom: 12, borderLeft: `4px solid ${cfg.color}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                        <p style={{ fontWeight: 700, fontSize: 14, color: "#0F172A" }}>{hw.title}</p>
                        <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                          {cfg.icon} {hw.status.charAt(0).toUpperCase() + hw.status.slice(1)}
                        </span>
                      </div>
                      {hw.description && <p style={{ color: "#64748B", fontSize: 13, marginBottom: 6 }}>📌 {hw.description}</p>}
                      <p style={{ fontSize: 12, color: diff < 0 ? "#DC2626" : "#64748B", fontWeight: diff < 0 ? 600 : 400 }}>
                        📅 Due: {hw.due_date} • {diff < 0 ? `${Math.abs(diff)} days overdue!` : diff === 0 ? "Due today!" : `${diff} days left`}
                      </p>
                    </div>
                    {hw.status !== "submitted" && (
                      <button onClick={() => markSubmitted(hw.id)}
                        style={{ padding: "8px 16px", background: "#ECFDF5", color: "#059669", border: "1px solid #A7F3D0", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", whiteSpace: "nowrap" }}>
                        ✅ Mark Done
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ATTENDANCE */}
        {activeTab === "attendance" && (
          <div className="fade-in">
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginBottom: 20 }}>✅ My Attendance</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
              {[
                { label: "Present", value: presentDays, color: "#059669", bg: "#ECFDF5" },
                { label: "Absent", value: attendance.filter(a => a.status === "absent").length, color: "#DC2626", bg: "#FEF2F2" },
                { label: "Leave", value: attendance.filter(a => a.status === "leave").length, color: "#D97706", bg: "#FFFBEB" },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: "14px", textAlign: "center" }}>
                  <p style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</p>
                  <p style={{ fontSize: 12, color: s.color, fontWeight: 600 }}>{s.label}</p>
                </div>
              ))}
            </div>
            <div style={{ background: "white", borderRadius: 14, padding: "16px 18px", border: "1px solid #E2E8F0", marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: "#64748B" }}>Attendance Rate</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: attPct >= 75 ? "#059669" : "#DC2626" }}>{attPct}%</span>
              </div>
              <div style={{ background: "#F1F5F9", borderRadius: 8, height: 10, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${attPct}%`, background: attPct >= 75 ? "linear-gradient(90deg,#10B981,#34D399)" : "linear-gradient(90deg,#EF4444,#F87171)", borderRadius: 8, transition: "width 0.5s" }} />
              </div>
              {attPct < 75 && totalDays > 0 && <p style={{ fontSize: 12, color: "#EF4444", marginTop: 8 }}>⚠️ Below 75% — Please attend regularly!</p>}
            </div>
            <div style={{ background: "white", borderRadius: 14, padding: "16px 18px", border: "1px solid #E2E8F0" }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: "#0F172A", marginBottom: 12 }}>Daily Record</p>
              {attendance.length === 0 ? <p style={{ color: "#94A3B8", fontSize: 13 }}>No attendance recorded yet.</p> :
                attendance.map(a => {
                  const cfg = { present: { color: "#059669", bg: "#ECFDF5", icon: "✓" }, absent: { color: "#DC2626", bg: "#FEF2F2", icon: "✗" }, leave: { color: "#D97706", bg: "#FFFBEB", icon: "○" } }[a.status];
                  return (
                    <div key={a.date} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #F8FAFC" }}>
                      <p style={{ fontSize: 13, color: "#374151" }}>{a.date}</p>
                      <span style={{ background: cfg.bg, color: cfg.color, padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{cfg.icon} {a.status.charAt(0).toUpperCase() + a.status.slice(1)}</span>
                    </div>
                  );
                })
              }
            </div>
          </div>
        )}

        {/* FEES */}
        {activeTab === "fees" && (
          <div className="fade-in">
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginBottom: 20 }}>💰 My Fees</h2>
            <div style={{ background: "white", borderRadius: 14, padding: "18px 20px", border: "1px solid #E2E8F0", marginBottom: 14 }}>
              <p style={{ fontSize: 13, color: "#64748B", marginBottom: 4 }}>Monthly Fee</p>
              <p style={{ fontSize: 30, fontWeight: 800, color: "#4F46E5" }}>PKR {student.monthly_fee.toLocaleString()}</p>
            </div>
            {payments.length === 0 ? <p style={{ color: "#94A3B8", fontSize: 13 }}>No payment records yet.</p> :
              payments.map((p, i) => (
                <div key={i} style={{ background: "white", borderRadius: 12, padding: "14px 18px", border: "1px solid #E2E8F0", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14, color: "#0F172A" }}>{MONTHS[p.month-1]} {p.year}</p>
                    <p style={{ fontSize: 13, color: "#64748B" }}>PKR {p.amount.toLocaleString()}</p>
                  </div>
                  <span style={{ background: p.status === "paid" ? "#ECFDF5" : "#FEF2F2", color: p.status === "paid" ? "#059669" : "#DC2626", border: `1px solid ${p.status === "paid" ? "#A7F3D0" : "#FECACA"}`, padding: "4px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
                    {p.status === "paid" ? "✓ Paid" : "✗ Unpaid"}
                  </span>
                </div>
              ))
            }
          </div>
        )}

        {/* SCHEDULE */}
        {activeTab === "schedule" && (
          <div className="fade-in">
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginBottom: 20 }}>📅 My Schedule</h2>
            {sessions.length === 0 ? (
              <div style={{ background: "white", borderRadius: 14, padding: 48, textAlign: "center" }}>
                <p style={{ fontSize: 36, marginBottom: 12 }}>📅</p>
                <p style={{ fontWeight: 600, color: "#0F172A" }}>No upcoming sessions</p>
              </div>
            ) : sessions.map((s, i) => (
              <div key={i} style={{ background: "white", borderRadius: 14, padding: "16px 18px", border: "1px solid #E2E8F0", marginBottom: 12, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ background: "#EEF2FF", borderRadius: 10, padding: "10px 14px", textAlign: "center", flexShrink: 0 }}>
                  <p style={{ fontWeight: 800, color: "#4F46E5", fontSize: 15 }}>{s.time?.slice(0,5)}</p>
                  <p style={{ color: "#818CF8", fontSize: 11 }}>{s.duration}m</p>
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: "#0F172A" }}>{student.subject}</p>
                  <p style={{ color: "#64748B", fontSize: 13 }}>📅 {s.date}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
