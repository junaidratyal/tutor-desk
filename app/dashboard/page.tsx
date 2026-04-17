"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

function localDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function sendNotif(title: string, body: string, url: string = "/dashboard") {
  if (typeof window === "undefined") return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  new Notification(title, { body, icon: "/icon-192.png", tag: title });
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    students: 0, paidFees: 0, unpaidFees: 0, todaySessions: 0,
    pendingHw: 0, lateHw: 0, attendanceMarked: 0, totalStudents: 0,
    submittedHw: 0
  });
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [portalUrl, setPortalUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPortalUrl(`${window.location.origin}/student/login`);
    }

    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserName(user.user_metadata?.name || user.email?.split("@")[0] || "Tutor");

      const today = new Date();
      const todayStr = localDateStr(today);
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();

      const { data: myStudents } = await supabase
        .from("students").select("id").eq("tutor_id", user.id);
      const myStudentIds = (myStudents || []).map(s => s.id);
      const totalStudents = myStudentIds.length;

      if (!totalStudents) { setLoading(false); return; }

      const [paymentsRes, sessionsRes, homeworkRes, attRes] = await Promise.all([
        supabase.from("payments").select("status, student_id")
          .in("student_id", myStudentIds).eq("year", currentYear).eq("month", currentMonth),
        supabase.from("sessions").select("id")
          .in("student_id", myStudentIds).eq("date", todayStr).eq("status", "scheduled"),
        supabase.from("homework").select("status")
          .in("student_id", myStudentIds),
        supabase.from("attendance").select("student_id")
          .in("student_id", myStudentIds).eq("date", todayStr),
      ]);

      const paid = (paymentsRes.data || []).filter(p => p.status === "paid").length;
      const unpaid = totalStudents - paid;
      const todaySessions = (sessionsRes.data || []).length;
      const hw = homeworkRes.data || [];
      const pendingHw = hw.filter(h => h.status === "pending").length;
      const lateHw = hw.filter(h => h.status === "late").length;
      const submittedHw = hw.filter(h => h.status === "submitted").length;
      const attendanceMarked = (attRes.data || []).length;

      setStats({ students: totalStudents, paidFees: paid, unpaidFees: unpaid, todaySessions, pendingHw, lateHw, submittedHw, attendanceMarked, totalStudents });
      setLoading(false);

      // Notifications
      const lastNotif = localStorage.getItem("last_notif_date");
      if (lastNotif !== todayStr && Notification.permission === "granted") {
        localStorage.setItem("last_notif_date", todayStr);
        if (todaySessions > 0) setTimeout(() => sendNotif(`📅 ${todaySessions} sessions today!`, "Check your schedule", "/dashboard/schedule"), 2000);
        if (unpaid > 0) setTimeout(() => sendNotif(`💰 ${unpaid} fees pending!`, "Collect fees this month", "/dashboard/fees"), 4000);
      }
    }
    load();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6 }}>
          {new Date().toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>
          {greeting}, {userName.split(" ")[0]}! 👋
        </h1>
        <p style={{ color: "var(--text-secondary)", marginTop: 6, fontSize: 15 }}>Here's your complete overview for today</p>
      </div>

      {/* Main Stats */}
      <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Total Students", value: stats.students, icon: "👨‍🎓", light: "#EEF2FF", textColor: "#4F46E5", suffix: "enrolled", href: "/dashboard/students" },
          { label: "Fees Collected", value: stats.paidFees, icon: "✅", light: "#ECFDF5", textColor: "#059669", suffix: "this month", href: "/dashboard/fees" },
          { label: "Fees Pending", value: stats.unpaidFees, icon: "⏳", light: "#FFFBEB", textColor: "#D97706", suffix: "this month", href: "/dashboard/fees" },
          { label: "Sessions Today", value: stats.todaySessions, icon: "📅", light: "#FDF2F8", textColor: "#DB2777", suffix: "scheduled", href: "/dashboard/schedule" },
        ].map((card, i) => (
          <Link key={i} href={card.href} style={{ textDecoration: "none" }}>
            <div className="stat-card" style={{ padding: "20px 22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <p style={{ color: "var(--text-secondary)", fontSize: 12, fontWeight: 500 }}>{card.label}</p>
                <div style={{ background: card.light, borderRadius: 8, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>{card.icon}</div>
              </div>
              <p style={{ fontSize: 34, fontWeight: 800, color: card.textColor, lineHeight: 1 }}>{loading ? "—" : card.value}</p>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 5 }}>{card.suffix}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Secondary Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
        {/* Homework Stats */}
        <Link href="/dashboard/homework" style={{ textDecoration: "none" }}>
          <div className="card" style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 20 }}>📝</span>
              <p style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>Homework</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[
                { label: "Pending", value: stats.pendingHw, color: "#D97706" },
                { label: "Late", value: stats.lateHw, color: "#DC2626" },
                { label: "Done", value: stats.submittedHw, color: "#059669" },
              ].map(s => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{loading ? "—" : s.value}</p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </Link>

        {/* Attendance Today */}
        <Link href="/dashboard/attendance" style={{ textDecoration: "none" }}>
          <div className="card" style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 20 }}>✅</span>
              <p style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>Today's Attendance</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div>
                <p style={{ fontSize: 30, fontWeight: 800, color: stats.attendanceMarked === stats.totalStudents && stats.totalStudents > 0 ? "#059669" : "#D97706" }}>
                  {loading ? "—" : `${stats.attendanceMarked}/${stats.totalStudents}`}
                </p>
                <p style={{ fontSize: 11, color: "var(--text-muted)" }}>students marked</p>
              </div>
              {!loading && stats.attendanceMarked < stats.totalStudents && stats.totalStudents > 0 && (
                <span style={{ background: "#FFFBEB", color: "#D97706", border: "1px solid #FDE68A", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                  ⚠️ {stats.totalStudents - stats.attendanceMarked} pending
                </span>
              )}
              {!loading && stats.attendanceMarked === stats.totalStudents && stats.totalStudents > 0 && (
                <span style={{ background: "#ECFDF5", color: "#059669", border: "1px solid #A7F3D0", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                  ✓ All done!
                </span>
              )}
            </div>
          </div>
        </Link>

        {/* Student Portal */}
        <div className="card" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 20 }}>🎓</span>
            <p style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>Student Portal</p>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 12, lineHeight: 1.5 }}>
            Students can access their homework, attendance & fees here
          </p>
          <button onClick={() => { navigator.clipboard.writeText(portalUrl); alert("Portal link copied!"); }}
            style={{ width: "100%", padding: "8px", background: "linear-gradient(135deg, #10B981, #34D399)", color: "white", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            📋 Copy Portal Link
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ padding: "20px 24px", marginBottom: 20 }}>
        <h2 style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 14 }}>⚡ Quick Actions</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
          {[
            { label: "Add Student", icon: "➕", href: "/dashboard/students", color: "#4F46E5", bg: "#EEF2FF" },
            { label: "Mark Attendance", icon: "✅", href: "/dashboard/attendance", color: "#059669", bg: "#ECFDF5" },
            { label: "Record Payment", icon: "💰", href: "/dashboard/fees", color: "#D97706", bg: "#FFFBEB" },
            { label: "Add Session", icon: "📅", href: "/dashboard/schedule", color: "#DB2777", bg: "#FDF2F8" },
            { label: "Add Homework", icon: "📝", href: "/dashboard/homework", color: "#7C3AED", bg: "#EDE9FE" },
            { label: "AI Assistant", icon: "🤖", href: "/dashboard/ai", color: "#0891B2", bg: "#E0F2FE" },
            { label: "Send Reminder", icon: "💬", href: "/dashboard/reminders", color: "#DC2626", bg: "#FEF2F2" },
            { label: "Reports", icon: "📄", href: "/dashboard/reports", color: "#065F46", bg: "#ECFDF5" },
          ].map((a, i) => (
            <Link key={i} href={a.href} style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", background: a.bg, borderRadius: 10, textDecoration: "none", transition: "all 0.2s" }}>
              <span style={{ fontSize: 18 }}>{a.icon}</span>
              <span style={{ fontWeight: 600, fontSize: 12, color: a.color }}>{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {!loading && (stats.lateHw > 0 || stats.unpaidFees > 0) && (
        <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
          {stats.lateHw > 0 && (
            <Link href="/dashboard/homework" style={{ textDecoration: "none" }}>
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 22 }}>❌</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, color: "#DC2626", fontSize: 14 }}>{stats.lateHw} overdue assignment{stats.lateHw > 1 ? "s" : ""}!</p>
                  <p style={{ color: "#EF4444", fontSize: 13 }}>Students have late homework — follow up needed</p>
                </div>
                <span style={{ color: "#DC2626", fontSize: 18 }}>→</span>
              </div>
            </Link>
          )}
          {stats.unpaidFees > 0 && (
            <Link href="/dashboard/fees" style={{ textDecoration: "none" }}>
              <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 22 }}>💰</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, color: "#D97706", fontSize: 14 }}>{stats.unpaidFees} student{stats.unpaidFees > 1 ? "s" : ""} with pending fees</p>
                  <p style={{ color: "#F59E0B", fontSize: 13 }}>Send a reminder to collect fees on time</p>
                </div>
                <span style={{ color: "#D97706", fontSize: 18 }}>→</span>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Pro Tip */}
      <div style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", borderRadius: 16, padding: "22px 26px", color: "white" }}>
        <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>💡 Pro Tip</p>
        <p style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.6 }}>
          Send fee reminders at the start of each month. Tutors who use the Student Portal report 40% better homework completion rates!
        </p>
        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <Link href="/dashboard/reminders" style={{ background: "rgba(255,255,255,0.2)", color: "white", padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
            Send Reminders →
          </Link>
          <Link href="/dashboard/students" style={{ background: "rgba(255,255,255,0.2)", color: "white", padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
            Invite Students →
          </Link>
        </div>
      </div>
    </div>
  );
}
