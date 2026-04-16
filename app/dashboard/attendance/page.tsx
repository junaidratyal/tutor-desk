
"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Student } from "@/lib/types";

interface Attendance {
  id: string;
  student_id: string;
  date: string;
  status: "present" | "absent" | "leave";
  note: string;
  students?: Student;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const STATUS_CONFIG = {
  present: { label: "Present", bg: "#ECFDF5", color: "#059669", border: "#A7F3D0", icon: "✓" },
  absent:  { label: "Absent",  bg: "#FEF2F2", color: "#DC2626", border: "#FECACA", icon: "✗" },
  leave:   { label: "Leave",   bg: "#FFFBEB", color: "#D97706", border: "#FDE68A", icon: "○" },
};

export default function AttendancePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("all");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"mark" | "report">("mark");

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: st } = await supabase.from("students").select("*").eq("tutor_id", user.id);
    setStudents(st || []);

    const startDate = `${year}-${String(month).padStart(2,"0")}-01`;
    const endDate = `${year}-${String(month).padStart(2,"0")}-31`;
    const { data: att } = await supabase.from("attendance")
      .select("*, students(name, subject)")
      .gte("date", startDate).lte("date", endDate)
      .order("date", { ascending: false });
    setAttendance(att || []);
  }

  useEffect(() => { load(); }, [month, year]);

  async function markAttendance(studentId: string, date: string, status: Attendance["status"]) {
    setLoading(true);
    const supabase = createClient();
    const existing = attendance.find(a => a.student_id === studentId && a.date === date);
    if (existing) {
      await supabase.from("attendance").update({ status }).eq("id", existing.id);
    } else {
      await supabase.from("attendance").insert({ student_id: studentId, date, status, note: "" });
    }
    await load();
    setLoading(false);
  }

  function getAttendance(studentId: string, date: string) {
    return attendance.find(a => a.student_id === studentId && a.date === date);
  }

  // Generate dates for this month
  const daysInMonth = new Date(year, month, 0).getDate();
  const dates = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    return `${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  });
  const today = new Date().toISOString().split("T")[0];

  // Stats per student
  function getStats(studentId: string) {
    const records = attendance.filter(a => a.student_id === studentId);
    const present = records.filter(a => a.status === "present").length;
    const absent = records.filter(a => a.status === "absent").length;
    const leave = records.filter(a => a.status === "leave").length;
    const total = present + absent + leave;
    const pct = total > 0 ? Math.round((present / total) * 100) : 0;
    return { present, absent, leave, total, pct };
  }

  const filteredStudents = selectedStudent === "all" ? students : students.filter(s => s.id === selectedStudent);
  const last7Days = dates.slice(-7).reverse();

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0F172A" }}>Attendance</h1>
          <p style={{ color: "#64748B", marginTop: 4 }}>Track daily attendance for all students</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <select className="input" style={{ width: "auto" }} value={month} onChange={e => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select className="input" style={{ width: "auto" }} value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="input" style={{ width: "auto" }} value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
            <option value="all">All Students</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* View Toggle */}
      <div style={{ display: "flex", gap: 4, background: "#F1F5F9", borderRadius: 10, padding: 4, marginBottom: 24, width: "fit-content" }}>
        {(["mark", "report"] as const).map(v => (
          <button key={v} onClick={() => setView(v)} style={{ padding: "8px 20px", borderRadius: 8, border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", background: view === v ? "white" : "transparent", color: view === v ? "#4F46E5" : "#64748B", boxShadow: view === v ? "0 1px 4px rgba(0,0,0,0.1)" : "none", transition: "all 0.2s" }}>
            {v === "mark" ? "📝 Mark Today" : "📊 Monthly Report"}
          </button>
        ))}
      </div>

      {view === "mark" ? (
        <>
          {/* Today's quick mark */}
          <div className="card" style={{ padding: "24px 28px", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <h2 style={{ fontWeight: 700, fontSize: 16, color: "#0F172A" }}>📅 Mark Attendance</h2>
              <span style={{ background: "#EEF2FF", color: "#4F46E5", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{today}</span>
            </div>

            {students.length === 0 ? (
              <p style={{ color: "#94A3B8", fontSize: 14 }}>No students yet. Add students first!</p>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {filteredStudents.map(s => {
                  const todayAtt = getAttendance(s.id, today);
                  return (
                    <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "#F8FAFC", borderRadius: 12, border: "1px solid #E2E8F0", flexWrap: "wrap", gap: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 15 }}>
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: 14, color: "#0F172A" }}>{s.name}</p>
                          <p style={{ color: "#94A3B8", fontSize: 12 }}>{s.subject}</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        {(["present","absent","leave"] as const).map(status => {
                          const cfg = STATUS_CONFIG[status];
                          const isActive = todayAtt?.status === status;
                          return (
                            <button key={status} onClick={() => markAttendance(s.id, today, status)} disabled={loading}
                              style={{ padding: "8px 16px", borderRadius: 8, border: `1.5px solid ${isActive ? cfg.border : "#E2E8F0"}`, background: isActive ? cfg.bg : "white", color: isActive ? cfg.color : "#94A3B8", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.15s" }}>
                              {cfg.icon} {cfg.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Last 7 days */}
          <div className="card" style={{ padding: "24px 28px", overflowX: "auto" }}>
            <h2 style={{ fontWeight: 700, fontSize: 16, color: "#0F172A", marginBottom: 20 }}>Last 7 Days</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 12, fontWeight: 700, color: "#94A3B8", borderBottom: "1px solid #F1F5F9" }}>Student</th>
                  {last7Days.map(d => (
                    <th key={d} style={{ padding: "8px 10px", fontSize: 12, fontWeight: 600, color: d === today ? "#4F46E5" : "#94A3B8", borderBottom: "1px solid #F1F5F9", textAlign: "center", whiteSpace: "nowrap" }}>
                      {new Date(d).toLocaleDateString("en", { weekday: "short" })}<br />
                      <span style={{ fontWeight: 800 }}>{new Date(d).getDate()}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(s => (
                  <tr key={s.id}>
                    <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 600, color: "#0F172A", borderBottom: "1px solid #F8FAFC" }}>{s.name}</td>
                    {last7Days.map(d => {
                      const att = getAttendance(s.id, d);
                      const cfg = att ? STATUS_CONFIG[att.status] : null;
                      return (
                        <td key={d} style={{ padding: "10px", textAlign: "center", borderBottom: "1px solid #F8FAFC" }}>
                          {cfg ? (
                            <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, borderRadius: 6, padding: "3px 8px", fontSize: 12, fontWeight: 700 }}>{cfg.icon}</span>
                          ) : (
                            <span style={{ color: "#E2E8F0", fontSize: 16 }}>—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* Monthly Report */
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 8 }}>
            {[
              { label: "Total Classes", value: dates.length, icon: "📅", color: "#4F46E5", bg: "#EEF2FF" },
              { label: "Avg Attendance", value: `${students.length > 0 ? Math.round(students.reduce((sum, s) => sum + getStats(s.id).pct, 0) / students.length) : 0}%`, icon: "📊", color: "#059669", bg: "#ECFDF5" },
            ].map((card, i) => (
              <div key={i} className="stat-card" style={{ padding: "20px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ color: "#64748B", fontSize: 13, marginBottom: 8 }}>{card.label}</p>
                    <p style={{ fontSize: 32, fontWeight: 800, color: card.color }}>{card.value}</p>
                  </div>
                  <div style={{ background: card.bg, borderRadius: 12, width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{card.icon}</div>
                </div>
              </div>
            ))}
          </div>

          {filteredStudents.map(s => {
            const stats = getStats(s.id);
            return (
              <div key={s.id} className="card" style={{ padding: "22px 26px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700 }}>
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 15, color: "#0F172A" }}>{s.name}</p>
                      <p style={{ color: "#94A3B8", fontSize: 12 }}>{s.subject}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    {[
                      { label: "Present", value: stats.present, color: "#059669", bg: "#ECFDF5" },
                      { label: "Absent", value: stats.absent, color: "#DC2626", bg: "#FEF2F2" },
                      { label: "Leave", value: stats.leave, color: "#D97706", bg: "#FFFBEB" },
                    ].map(stat => (
                      <div key={stat.label} style={{ textAlign: "center", background: stat.bg, borderRadius: 10, padding: "8px 14px" }}>
                        <p style={{ fontSize: 18, fontWeight: 800, color: stat.color }}>{stat.value}</p>
                        <p style={{ fontSize: 11, color: stat.color, fontWeight: 600 }}>{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: "#64748B" }}>Attendance Rate</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: stats.pct >= 75 ? "#059669" : stats.pct >= 50 ? "#D97706" : "#DC2626" }}>{stats.pct}%</span>
                  </div>
                  <div style={{ background: "#F1F5F9", borderRadius: 8, height: 8, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${stats.pct}%`, background: stats.pct >= 75 ? "linear-gradient(90deg, #10B981, #34D399)" : stats.pct >= 50 ? "linear-gradient(90deg, #F59E0B, #FCD34D)" : "linear-gradient(90deg, #EF4444, #F87171)", borderRadius: 8, transition: "width 0.5s ease" }} />
                  </div>
                  {stats.pct < 75 && stats.total > 0 && (
                    <p style={{ fontSize: 12, color: "#EF4444", marginTop: 6 }}>⚠️ Below 75% attendance — parent ko inform karo!</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
