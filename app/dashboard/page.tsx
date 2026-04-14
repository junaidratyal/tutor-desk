"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

export default function DashboardPage() {
  const [stats, setStats] = useState({ students: 0, paidFees: 0, unpaidFees: 0, todaySessions: 0 });
  const [userName, setUserName] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserName(user.user_metadata?.name || user.email || "Tutor");

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

      setStats({
        students: studentsRes.count || 0,
        paidFees: paid,
        unpaidFees: unpaid,
        todaySessions: sessionsRes.count || 0,
      });
    }
    load();
  }, []);

  const cards = [
    { label: "Total Students", value: stats.students, icon: "👨‍🎓", color: "#DBEAFE", textColor: "#1D4ED8" },
    { label: "Fees Paid (This Month)", value: stats.paidFees, icon: "✅", color: "#DCFCE7", textColor: "#15803D" },
    { label: "Fees Pending", value: stats.unpaidFees, icon: "⚠️", color: "#FEF9C3", textColor: "#92400E" },
    { label: "Sessions Today", value: stats.todaySessions, icon: "📅", color: "#EDE9FE", textColor: "#6D28D9" },
  ];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111827" }}>Good morning, {userName.split(" ")[0]}! 👋</h1>
        <p style={{ color: "#6B7280", marginTop: 6 }}>Here's your overview for today</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 36 }}>
        {cards.map((card, i) => (
          <div key={i} className="card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <p style={{ color: "#6B7280", fontSize: 13, fontWeight: 500 }}>{card.label}</p>
              <div style={{ background: card.color, borderRadius: 8, padding: "6px 10px", fontSize: 20 }}>{card.icon}</div>
            </div>
            <p style={{ fontSize: 40, fontWeight: 800, color: card.textColor }}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: "28px" }}>
        <h2 style={{ fontWeight: 700, fontSize: 17, color: "#111827", marginBottom: 16 }}>Quick Actions</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {[
            { label: "➕ Add Student", href: "/dashboard/students" },
            { label: "💰 Record Payment", href: "/dashboard/fees" },
            { label: "📅 Add Session", href: "/dashboard/schedule" },
            { label: "💬 Send Reminder", href: "/dashboard/reminders" },
          ].map(a => (
            <a key={a.href} href={a.href} style={{ padding: "10px 18px", background: "#F3F4F6", borderRadius: 8, color: "#374151", fontWeight: 500, fontSize: 14, textDecoration: "none", border: "1px solid #E5E7EB" }}>
              {a.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
