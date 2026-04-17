"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

interface StudentData {
  id: string;
  name: string;
  subject: string;
  monthly_fee: number;
  parent_name: string;
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

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"home" | "homework" | "attendance" | "fees" | "schedule">("home");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/student/login"); return; }

      // Get student account
      const { data: acc } = await supabase
        .from("student_accounts")
        .select("*, students(*)")
        .eq("user_id", user.id)
        .single();

      if (!acc) { router.push("/student/login"); return; }

      const s = acc.students as StudentData;
      setStudent(s);

      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const startDate = `${year}-${String(month).padStart(2,"0")}-01`;
      const endDate = `${year}-${String(month).padStart(2,"0")}-31`;
      const today = localDateStr(now);

      const [hwRes, attRes, payRes, sessRes] = await Promise.all([
        supabase.from("homework").select("*").eq("student_id", s.id).order("due_date", { ascending: true }),
        supabase.from("attendance").select("*").eq("student_id", s.id).gte("date", startDate).lte("date", endDate).order("date", { ascending: false }),
        supabase.from("payments").select("*").eq("student_id", s.id).order("year", { ascending: false }).order("month", { ascending: false }),
        supabase.from("sessions").select("*").eq("student_id", s.id).gte("date", today).order("date", { ascending: true }).limit(5),
      ]);

      // Auto mark late
      const hw = (hwRes.data || []).map(h =>
        h.status === "pending" && h.due_date < today ? { ...h, status: "late" as const } : h
      );
      setHomework(hw);
      setAttendance(attRes.data || []);
      setPayments(payRes.data || []);
      setSessions(sessRes.data || []);
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
    { id: "homework", label: "Homework", icon: "📝" },
    { id: "attendance", label: "Attendance", icon: "✅" },
    { id: "fees", label: "Fees", icon: "💰" },
    { id: "schedule", label: "Schedule", icon: "📅" },
  ] as const;

  return (
    <div style={{ minHeight: "100vh", background: "#F0FDF4", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <nav style={{ background: "white", borderBottom: "1px solid #E2E8F0", padding: "0 24px", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ background: "linear-gradient(135deg, #10B981, #34D399)", color: "white", borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>🎓</div>
            <div>
              <p style={{ fontWeight: 800, fontSize: 15, color: "#0F172A", lineHeight: 1.2 }}>{student.name}</p>
              <p style={{ fontSize: 11, color: "#94A3B8" }}>{student.subject} Student</p>
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
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ padding: "14px 20px", border: "none", borderBottom: `3px solid ${activeTab === tab.id ? "#10B981" : "transparent"}`, background: "transparent", color: activeTab === tab.id ? "#10B981" : "#64748B", fontWeight: activeTab === tab.id ? 700 : 500, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", transition: "all 0.2s" }}>
              {tab.icon} {tab.label}
              {tab.id === "homework" && (lateHw > 0 || pendingHw > 0) && (
                <span style={{ background: lateHw > 0 ? "#EF4444" : "#F59E0B", color: "white", borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>
                  {lateHw > 0 ? lateHw : pendingHw}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>

        {/* HOME TAB */}
        {activeTab === "home" && (
          <div className="fade-in">
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", marginBottom: 6 }}>
              Assalam o Alaikum, {student.name.split(" ")[0]}! 👋
            </h1>
            <p style={{ color: "#64748B", marginBottom: 24, fontSize: 14 }}>Here's your learning overview</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
              {[
                { label: "This Month Attendance", value: `${attPct}%`, sub: `${presentDays}/${totalDays} days`, icon: "✅", color: attPct >= 75 ? "#059669" : "#DC2626", bg: attPct >= 75 ? "#ECFDF5" : "#FEF2F2" },
                { label: "Pending Homework", value: pendingHw + lateHw, sub: `${lateHw} late`, icon: "📝", color: lateHw > 0 ? "#DC2626" : "#D97706", bg: lateHw > 0 ? "#FEF2F2" : "#FFFBEB" },
                { label: "Fee Status", value: currentPayment?.status === "paid" ? "Paid ✓" : "Pending", sub: `PKR ${student.monthly_fee.toLocaleString()}/month`, icon: "💰", color: currentPayment?.status === "paid" ? "#059669" : "#DC2626", bg: currentPayment?.status === "paid" ? "#ECFDF5" : "#FEF2F2" },
                { label: "Upcoming Sessions", value: sessions.length, sub: sessions[0] ? `Next: ${sessions[0].date}` : "No sessions", icon: "📅", color: "#4F46E5", bg: "#EEF2FF" },
              ].map((card, i) => (
                <div key={i} style={{ background: "white", borderRadius: 14, padding: "18px 20px", border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <p style={{ fontSize: 12, color: "#64748B", fontWeight: 500 }}>{card.label}</p>
                    <div style={{ background: card.bg, borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{card.icon}</div>
                  </div>
                  <p style={{ fontSize: 26, fontWeight: 800, color: card.color }}>{card.value}</p>
                  <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Late homework alert */}
            {lateHw > 0 && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "16px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 24 }}>⚠️</span>
                <div>
                  <p style={{ fontWeight: 700, color: "#DC2626", fontSize: 14 }}>You have {lateHw} overdue assignment{lateHw > 1 ? "s" : ""}!</p>
                  <p style={{ color: "#EF4444", fontSize: 13 }}>Please submit as soon as possible.</p>
                </div>
                <button onClick={() => setActiveTab("homework")} style={{ marginLeft: "auto", padding: "8px 16px", background: "#EF4444", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  View →
                </button>
              </div>
            )}

            {/* Next session */}
            {sessions[0] && (
              <div style={{ background: "white", borderRadius: 14, padding: "18px 20px", border: "1px solid #E2E8F0" }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: "#0F172A", marginBottom: 12 }}>📅 Next Session</p>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ background: "#EEF2FF", borderRadius: 10, padding: "10px 16px", textAlign: "center" }}>
                    <p style={{ fontWeight: 800, color: "#4F46E5", fontSize: 16 }}>{sessions[0].time?.slice(0,5)}</p>
                    <p style={{ color: "#818CF8", fontSize: 11 }}>{sessions[0].duration}m</p>
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, color: "#0F172A" }}>{student.subject}</p>
                    <p style={{ color: "#64748B", fontSize: 13 }}>{sessions[0].date}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* HOMEWORK TAB */}
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
                pending: { bg: "#FFFBEB", color: "#D97706", border: "#FDE68A", icon: "⏳" },
                submitted: { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0", icon: "✅" },
                late: { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA", icon: "❌" },
              };
              const cfg = statusColors[hw.status];
              const due = new Date(hw.due_date + "T00:00:00");
              const diff = Math.ceil((due.getTime() - new Date().getTime()) / (1000*60*60*24));
              return (
                <div key={hw.id} style={{ background: "white", borderRadius: 14, padding: "18px 20px", border: "1px solid #E2E8F0", marginBottom: 12, borderLeft: `4px solid ${cfg.color}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                        <p style={{ fontWeight: 700, fontSize: 15, color: "#0F172A" }}>{hw.title}</p>
                        <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                          {cfg.icon} {hw.status.charAt(0).toUpperCase() + hw.status.slice(1)}
                        </span>
                      </div>
                      {hw.description && <p style={{ color: "#64748B", fontSize: 13, marginBottom: 6 }}>📌 {hw.description}</p>}
                      <p style={{ fontSize: 13, color: diff < 0 ? "#DC2626" : "#64748B", fontWeight: diff < 0 ? 600 : 400 }}>
                        📅 Due: {hw.due_date} • {diff < 0 ? `${Math.abs(diff)} days overdue!` : diff === 0 ? "Due today!" : `${diff} days left`}
                      </p>
                    </div>
                    {hw.status !== "submitted" && (
                      <button onClick={() => markSubmitted(hw.id)}
                        style={{ padding: "9px 18px", background: "#ECFDF5", color: "#059669", border: "1px solid #A7F3D0", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", whiteSpace: "nowrap" }}>
                        ✅ Mark as Done
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ATTENDANCE TAB */}
        {activeTab === "attendance" && (
          <div className="fade-in">
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginBottom: 20 }}>✅ My Attendance</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Present", value: presentDays, color: "#059669", bg: "#ECFDF5" },
                { label: "Absent", value: attendance.filter(a => a.status === "absent").length, color: "#DC2626", bg: "#FEF2F2" },
                { label: "Leave", value: attendance.filter(a => a.status === "leave").length, color: "#D97706", bg: "#FFFBEB" },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: "16px", textAlign: "center" }}>
                  <p style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</p>
                  <p style={{ fontSize: 12, color: s.color, fontWeight: 600 }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div style={{ background: "white", borderRadius: 14, padding: "18px 20px", border: "1px solid #E2E8F0", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: "#64748B" }}>This Month Attendance Rate</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: attPct >= 75 ? "#059669" : "#DC2626" }}>{attPct}%</span>
              </div>
              <div style={{ background: "#F1F5F9", borderRadius: 8, height: 10, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${attPct}%`, background: attPct >= 75 ? "linear-gradient(90deg, #10B981, #34D399)" : "linear-gradient(90deg, #EF4444, #F87171)", borderRadius: 8, transition: "width 0.5s" }} />
              </div>
              {attPct < 75 && totalDays > 0 && <p style={{ fontSize: 12, color: "#EF4444", marginTop: 8 }}>⚠️ Below 75% — Please attend regularly!</p>}
            </div>

            {/* Attendance log */}
            <div style={{ background: "white", borderRadius: 14, padding: "18px 20px", border: "1px solid #E2E8F0" }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: "#0F172A", marginBottom: 14 }}>Daily Record</p>
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

        {/* FEES TAB */}
        {activeTab === "fees" && (
          <div className="fade-in">
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginBottom: 20 }}>💰 My Fees</h2>
            <div style={{ background: "white", borderRadius: 14, padding: "20px 24px", border: "1px solid #E2E8F0", marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: "#64748B", marginBottom: 4 }}>Monthly Fee</p>
              <p style={{ fontSize: 32, fontWeight: 800, color: "#4F46E5" }}>PKR {student.monthly_fee.toLocaleString()}</p>
            </div>
            {payments.length === 0 ? <p style={{ color: "#94A3B8", fontSize: 13 }}>No payment records yet.</p> :
              payments.map((p, i) => (
                <div key={i} style={{ background: "white", borderRadius: 12, padding: "16px 20px", border: "1px solid #E2E8F0", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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

        {/* SCHEDULE TAB */}
        {activeTab === "schedule" && (
          <div className="fade-in">
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginBottom: 20 }}>📅 My Schedule</h2>
            {sessions.length === 0 ? (
              <div style={{ background: "white", borderRadius: 14, padding: 48, textAlign: "center" }}>
                <p style={{ fontSize: 36, marginBottom: 12 }}>📅</p>
                <p style={{ fontWeight: 600, color: "#0F172A" }}>No upcoming sessions</p>
              </div>
            ) : sessions.map((s, i) => (
              <div key={i} style={{ background: "white", borderRadius: 14, padding: "18px 20px", border: "1px solid #E2E8F0", marginBottom: 12, display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ background: "#EEF2FF", borderRadius: 12, padding: "12px 16px", textAlign: "center", flexShrink: 0 }}>
                  <p style={{ fontWeight: 800, color: "#4F46E5", fontSize: 16 }}>{s.time?.slice(0,5)}</p>
                  <p style={{ color: "#818CF8", fontSize: 11 }}>{s.duration}m</p>
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: "#0F172A" }}>{student.subject}</p>
                  <p style={{ color: "#64748B", fontSize: 13 }}>📅 {s.date}</p>
                  <span style={{ background: "#EEF2FF", color: "#4F46E5", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{s.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

