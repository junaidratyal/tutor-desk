"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

function localDateStr(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}

function sendNotif(title: string, body: string, url: string = "/dashboard") {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  new Notification(title, { body, icon: "/icon-192.png", tag: title, data: { url } });
}

export default function DashboardPage() {
  const [stats, setStats] = useState({ students: 0, paidFees: 0, unpaidFees: 0, todaySessions: 0 });
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        .from("students").select("id, name, monthly_fee").eq("tutor_id", user.id);

      const myStudentIds = (myStudents || []).map(s => s.id);
      const totalStudents = myStudentIds.length;

      if (myStudentIds.length === 0) {
        setStats({ students: 0, paidFees: 0, unpaidFees: 0, todaySessions: 0 });
        setLoading(false);
        return;
      }

      const [paymentsRes, sessionsRes] = await Promise.all([
        supabase.from("payments").select("status, student_id")
          .in("student_id", myStudentIds).eq("year", currentYear).eq("month", currentMonth),
        supabase.from("sessions").select("id, time, student_id, students(name)")
          .in("student_id", myStudentIds).eq("date", todayStr).eq("status", "scheduled"),
      ]);

      const paidIds = (paymentsRes.data || []).filter(p => p.status === "paid").map(p => p.student_id);
      const paid = paidIds.length;
      const unpaid = totalStudents - paid;
      const todaySessions = (sessionsRes.data || []).length;

      setStats({ students: totalStudents, paidFees: paid, unpaidFees: unpaid, todaySessions });
      setLoading(false);

      // ── AUTO NOTIFICATIONS ──
      // Check if already notified today
      const lastNotifDate = localStorage.getItem("last_notif_date");
      const todayKey = todayStr;

      if (lastNotifDate !== todayKey && Notification.permission === "granted") {
        localStorage.setItem("last_notif_date", todayKey);

        // 1. Today's sessions
        if (todaySessions > 0) {
          const sessionNames = (sessionsRes.data || [])
            .map((s: any) => s.students?.name || "Student")
            .join(", ");
          setTimeout(() => {
            sendNotif(
              `📅 Aaj ${todaySessions} session${todaySessions > 1 ? "s" : ""} hain!`,
              `Students: ${sessionNames}`,
              "/dashboard/schedule"
            );
          }, 2000);
        }

        // 2. Pending fees
        if (unpaid > 0) {
          const unpaidStudents = (myStudents || [])
            .filter(s => !paidIds.includes(s.id))
            .map(s => s.name).slice(0, 3).join(", ");
          setTimeout(() => {
            sendNotif(
              `💰 ${unpaid} student${unpaid > 1 ? "s" : ""} ki fees pending hai!`,
              `${unpaidStudents}${unpaid > 3 ? " aur..." : ""}`,
              "/dashboard/fees"
            );
          }, 4000);
        }

        // 3. All fees collected
        if (unpaid === 0 && totalStudents > 0) {
          setTimeout(() => {
            sendNotif(
              "🎉 Sab fees collect ho gayi!",
              "Is mahine sab students ne fees de di hain. Shabash!",
              "/dashboard/fees"
            );
          }, 2000);
        }
      }

      // ── SESSION TIME REMINDERS ──
      // Check every session time — 30 min before alert
      const now = new Date();
      (sessionsRes.data || []).forEach((session: any) => {
        if (!session.time) return;
        const [hours, minutes] = session.time.split(":").map(Number);
        const sessionTime = new Date();
        sessionTime.setHours(hours, minutes, 0, 0);

        const diffMs = sessionTime.getTime() - now.getTime();
        const diffMin = Math.floor(diffMs / 60000);

        // 30 minutes pehle
        if (diffMin > 0 && diffMin <= 31) {
          setTimeout(() => {
            sendNotif(
              `⏰ Session 30 minute mein!`,
              `${session.students?.name || "Student"} ka session ${session.time.slice(0,5)} pe hai`,
              "/dashboard/schedule"
            );
          }, Math.max(0, (diffMin - 30) * 60000));
        }

        // 5 minutes pehle
        if (diffMin > 0 && diffMin <= 6) {
          setTimeout(() => {
            sendNotif(
              `🔔 Session abhi shuru hone wala hai!`,
              `${session.students?.name || "Student"} ka session 5 minute mein hai!`,
              "/dashboard/schedule"
            );
          }, Math.max(0, (diffMin - 5) * 60000));
        }
      });
    }
    load();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const cards = [
    { label: "Total Students", value: stats.students, icon: "👨‍🎓", light: "#EEF2FF", textColor: "#4F46E5", suffix: "enrolled" },
    { label: "Fees Collected", value: stats.paidFees, icon: "✅", light: "#ECFDF5", textColor: "#059669", suffix: "this month" },
    { label: "Fees Pending", value: stats.unpaidFees, icon: "⏳", light: "#FFFBEB", textColor: "#D97706", suffix: "this month" },
    { label: "Sessions Today", value: stats.todaySessions, icon: "📅", light: "#FDF2F8", textColor: "#DB2777", suffix: "scheduled" },
  ];

  const quickActions = [
    { label: "Add Student", icon: "➕", href: "/dashboard/students", color: "#4F46E5", bg: "#EEF2FF" },
    { label: "Record Payment", icon: "💰", href: "/dashboard/fees", color: "#059669", bg: "#ECFDF5" },
    { label: "Add Session", icon: "📅", href: "/dashboard/schedule", color: "#D97706", bg: "#FFFBEB" },
    { label: "Send Reminder", icon: "💬", href: "/dashboard/reminders", color: "#DB2777", bg: "#FDF2F8" },
  ];

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6 }}>
          {new Date().toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>
          {greeting}, {userName.split(" ")[0]}! 👋
        </h1>
        <p style={{ color: "var(--text-secondary)", marginTop: 6, fontSize: 15 }}>Here's what's happening with your students today</p>
      </div>

      <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18, marginBottom: 28 }}>
        {cards.map((card, i) => (
          <div key={i} className="stat-card" style={{ padding: "22px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <p style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 500 }}>{card.label}</p>
              <div style={{ background: card.light, borderRadius: 10, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{card.icon}</div>
            </div>
            <p style={{ fontSize: 36, fontWeight: 800, color: card.textColor, lineHeight: 1 }}>{loading ? "—" : card.value}</p>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>{card.suffix}</p>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: "24px 28px", marginBottom: 24 }}>
        <h2 style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)", marginBottom: 16 }}>Quick Actions</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
          {quickActions.map((a, i) => (
            <Link key={i} href={a.href} style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", background: a.bg, borderRadius: 12, textDecoration: "none", border: `1px solid ${a.bg}`, transition: "all 0.2s" }}>
              <span style={{ fontSize: 20 }}>{a.icon}</span>
              <span style={{ fontWeight: 600, fontSize: 13, color: a.color }}>{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", borderRadius: 16, padding: "24px 28px", color: "white" }}>
        <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>💡 Pro Tip</p>
        <p style={{ fontSize: 14, opacity: 0.9, lineHeight: 1.6 }}>Send fee reminders at the start of each month. Tutors who send reminders on time collect 3x more fees on time!</p>
        <Link href="/dashboard/reminders" style={{ display: "inline-block", marginTop: 14, background: "rgba(255,255,255,0.2)", color: "white", padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
          Send Reminders →
        </Link>
      </div>
    </div>
  );
}
