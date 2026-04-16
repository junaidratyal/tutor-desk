"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

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

      const today = new Date().toISOString().split("T")[0];
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const [studentsRes, paymentsRes, sessionsRes] = await Promise.all([
        supabase.from("students").select("id", { count: "exact" }).eq("tutor_id", user.id),
        supabase.from("payments").select("status").eq("year", currentYear).eq("month", currentMonth),
        supabase.from("sessions").select("id", { count: "exact" }).eq("date", today).eq("status", "scheduled"),
      ]);

      const paid = paymentsRes.data?.filter(p => p.status === "paid").length || 0;
      const unpaid = paymentsRes.data?.filter(p => p.status === "unpaid").length || 0;

      setStats({ students: studentsRes.count || 0, paidFees: paid, unpaidFees: unpaid, todaySessions: sessionsRes.count || 0 });
      setLoading(false);
    }
    load();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const cards = [
    { label: "Total Students", value: stats.students, icon: "👨‍🎓", gradient: "linear-gradient(135deg, #4F46E5, #818CF8)", light: "#EEF2FF", textColor: "#4F46E5", suffix: "enrolled" },
    { label: "Fees Collected", value: stats.paidFees, icon: "✅", gradient: "linear-gradient(135deg, #10B981, #34D399)", light: "#ECFDF5", textColor: "#059669", suffix: "this month" },
    { label: "Fees Pending", value: stats.unpaidFees, icon: "⏳", gradient: "linear-gradient(135deg, #F59E0B, #FCD34D)", light: "#FFFBEB", textColor: "#D97706", suffix: "this month" },
    { label: "Sessions Today", value: stats.todaySessions, icon: "📅", gradient: "linear-gradient(135deg, #EC4899, #F9A8D4)", light: "#FDF2F8", textColor: "#DB2777", suffix: "scheduled" },
  ];

  const quickActions = [
    { label: "Add Student", icon: "➕", href: "/dashboard/students", color: "#4F46E5", bg: "#EEF2FF" },
    { label: "Record Payment", icon: "💰", href: "/dashboard/fees", color: "#059669", bg: "#ECFDF5" },
    { label: "Add Session", icon: "📅", href: "/dashboard/schedule", color: "#D97706", bg: "#FFFBEB" },
    { label: "Send Reminder", icon: "💬", href: "/dashboard/reminders", color: "#DB2777", bg: "#FDF2F8" },
  ];

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#94A3B8", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6 }}>
          {new Date().toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: "#0F172A", lineHeight: 1.2 }}>
          {greeting}, {userName.split(" ")[0]}! 👋
        </h1>
        <p style={{ color: "#64748B", marginTop: 6, fontSize: 15 }}>Here's what's happening with your students today</p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18, marginBottom: 28 }}>
        {cards.map((card, i) => (
          <div key={i} className="stat-card" style={{ padding: "22px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <p style={{ color: "#64748B", fontSize: 13, fontWeight: 500 }}>{card.label}</p>
              <div style={{ background: card.light, borderRadius: 10, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{card.icon}</div>
            </div>
            <p style={{ fontSize: 36, fontWeight: 800, color: card.textColor, lineHeight: 1 }}>{loading ? "—" : card.value}</p>
            <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 6 }}>{card.suffix}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ padding: "24px 28px", marginBottom: 24 }}>
        <h2 style={{ fontWeight: 700, fontSize: 16, color: "#0F172A", marginBottom: 16 }}>Quick Actions</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
          {quickActions.map((a, i) => (
            <Link key={i} href={a.href} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "14px 16px",
              background: a.bg, borderRadius: 12, textDecoration: "none",
              border: `1px solid ${a.bg}`, transition: "all 0.2s"
            }}
              onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}>
              <span style={{ fontSize: 20 }}>{a.icon}</span>
              <span style={{ fontWeight: 600, fontSize: 13, color: a.color }}>{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", borderRadius: 16, padding: "24px 28px", color: "white" }}>
        <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>💡 Pro Tip</p>
        <p style={{ fontSize: 14, opacity: 0.9, lineHeight: 1.6 }}>Send fee reminders at the start of each month. Tutors who send reminders on time collect 3x more fees on time!</p>
        <Link href="/dashboard/reminders" style={{ display: "inline-block", marginTop: 14, background: "rgba(255,255,255,0.2)", color: "white", padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none", backdropFilter: "blur(4px)" }}>
          Send Reminders →
        </Link>
      </div>
    </div>
  );
}
