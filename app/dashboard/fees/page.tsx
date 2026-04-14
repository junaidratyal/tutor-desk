"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Student, Payment } from "@/lib/types";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function FeesPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: st } = await supabase.from("students").select("*").eq("tutor_id", user.id);
    const { data: py } = await supabase.from("payments").select("*").eq("month", month).eq("year", year);
    setStudents(st || []);
    setPayments(py || []);
  }

  useEffect(() => { load(); }, [month, year]);

  async function togglePayment(student: Student) {
    const supabase = createClient();
    const existing = payments.find(p => p.student_id === student.id);
    if (existing) {
      const newStatus = existing.status === "paid" ? "unpaid" : "paid";
      await supabase.from("payments").update({ status: newStatus, paid_at: newStatus === "paid" ? new Date().toISOString() : null }).eq("id", existing.id);
    } else {
      await supabase.from("payments").insert({ student_id: student.id, month, year, amount: student.monthly_fee, status: "paid", paid_at: new Date().toISOString() });
    }
    load();
  }

  function getPayment(studentId: string) {
    return payments.find(p => p.student_id === studentId);
  }

  const totalDue = students.reduce((sum, s) => sum + s.monthly_fee, 0);
  const totalPaid = students.filter(s => getPayment(s.id)?.status === "paid").reduce((sum, s) => sum + s.monthly_fee, 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111827" }}>Fee Tracker</h1>
          <p style={{ color: "#6B7280", marginTop: 4 }}>Track monthly payments for all students</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <select className="input" style={{ width: "auto" }} value={month} onChange={e => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select className="input" style={{ width: "auto" }} value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total Due", value: `PKR ${totalDue.toLocaleString()}`, color: "#DBEAFE", text: "#1D4ED8" },
          { label: "Collected", value: `PKR ${totalPaid.toLocaleString()}`, color: "#DCFCE7", text: "#15803D" },
          { label: "Pending", value: `PKR ${(totalDue - totalPaid).toLocaleString()}`, color: "#FEE2E2", text: "#DC2626" },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: "20px 24px", background: s.color, border: "none" }}>
            <p style={{ color: s.text, fontSize: 13, fontWeight: 500 }}>{s.label}</p>
            <p style={{ color: s.text, fontSize: 26, fontWeight: 800, marginTop: 4 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Students list */}
      <div style={{ display: "grid", gap: 12 }}>
        {students.length === 0 && (
          <div className="card" style={{ padding: 48, textAlign: "center", color: "#9CA3AF" }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>💰</p>
            <p style={{ fontWeight: 600 }}>No students found. Add students first!</p>
          </div>
        )}
        {students.map(s => {
          const payment = getPayment(s.id);
          const isPaid = payment?.status === "paid";
          return (
            <div key={s.id} className="card" style={{ padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 15, color: "#111827" }}>{s.name}</p>
                <p style={{ color: "#6B7280", fontSize: 13 }}>{s.subject} • {s.parent_name}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <p style={{ fontWeight: 700, fontSize: 16, color: "#374151" }}>PKR {s.monthly_fee.toLocaleString()}</p>
                <span className={isPaid ? "badge-paid" : "badge-unpaid"}>{isPaid ? "✓ Paid" : "Unpaid"}</span>
                <button onClick={() => togglePayment(s)} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${isPaid ? "#FCA5A5" : "#86EFAC"}`, background: isPaid ? "#FEF2F2" : "#F0FDF4", color: isPaid ? "#DC2626" : "#15803D", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
                  {isPaid ? "Mark Unpaid" : "Mark Paid ✓"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
