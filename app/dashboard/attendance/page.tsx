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
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const STATUS_CONFIG = {
  present: { label: "Present", bg: "#ECFDF5", color: "#059669", border: "#A7F3D0", icon: "✓" },
  absent:  { label: "Absent",  bg: "#FEF2F2", color: "#DC2626", border: "#FECACA", icon: "✗" },
  leave:   { label: "Leave",   bg: "#FFFBEB", color: "#D97706", border: "#FDE68A", icon: "○" },
};

function localDateStr(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}

function getLastNDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return localDateStr(d);
  });
}

export default function AttendancePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("all");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [saving, setSaving] = useState<string | null>(null);
  const [view, setView] = useState<"mark" | "report">("mark");
  const [loadError, setLoadError] = useState("");

  const today = localDateStr(new Date());
  const last7Days = getLastNDays(7);

  async function load() {
    setLoadError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoadError("Not logged in!"); return; }

    const { data: st, error: stErr } = await supabase
      .from("students").select("*").eq("tutor_id", user.id);
    if (stErr) { setLoadError("Students load error: " + stErr.message); return; }
    setStudents(st || []);
    if (!st || st.length === 0) return;

    const studentIds = st.map((s: any) => s.id);
    const startDate = `${year}-${String(month).padStart(2,"0")}-01`;
    const endDate = new Date(year, month, 0).toISOString().split("T")[0];

    const { data: att, error: attErr } = await supabase
      .from("attendance")
      .select("*")
      .in("student_id", studentIds)
      .gte("date", startDate)
      .lte("date", endDate);

    if (attErr) { setLoadError("Attendance load error: " + attErr.message); return; }
    setAttendance(att || []);
  }

  useEffect(() => { load(); }, [month, year]);

  async function markAttendance(studentId: string, date: string, status: "present" | "absent" | "leave") {
    setSaving(studentId);
    const supabase = createClient();
    const existing = attendance.find(a => a.student_id === studentId && a.date === date);

    if (existing) {
      if (existing.status === status) {
        const { error } = await supabase.from("attendance").delete().eq("id", existing.id);
        if (!error) setAttendance(prev => prev.filter(a => a.id !== existing.id));
      } else {
        const { error } = await supabase.from("attendance").update({ status }).eq("id", existing.id);
        if (!error) setAttendance(prev => prev.map(a => a.id === existing.id ? { ...a, status } : a));
      }
    } else {
      const { data, error } = await supabase
        .from("attendance")
        .insert({ student_id: studentId, date, status, note: "" })
        .select().single();
      if (!error && data) setAttendance(prev => [...prev, data]);
      else if (error) setLoadError("Save error: " + error.message);
    }
    setSaving(null);
  }

  function getAtt(studentId: string, date: string) {
    return attendance.find(a => a.student_id === studentId && a.date === date) || null;
  }

  function getStats(studentId: string) {
    const records = attendance.filter(a => a.student_id === studentId);
    const present = records.filter(a => a.status === "present").length;
    const absent = records.filter(a => a.status === "absent").length;
    const leave = records.filter(a => a.status === "leave").length;
    const total = present + absent + leave;
    return { present, absent, leave, total, pct: total > 0 ? Math.round((present / total) * 100) : 0 };
  }

  const filteredStudents = selectedStudent === "all" ? students : students.filter(s => s.id === selectedStudent);

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0F172A" }}>Attendance</h1>
          <p style={{ color: "#64748B", marginTop: 4 }}>Track daily attendance for all students</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <select className="input" style={{ width: "auto" }} value={month} onChange={e => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select className="input" style={{ width: "auto" }} value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="input" style={{ width: "auto" }} value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
            <option value="all">All Students</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {loadError && (
        <div style={{ background: "#FEF2F2", color: "#DC2626", padding: "12px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          ❌ {loadError}
        </div>
      )}

      <div style={{ display: "flex", gap: 4, background: "#F1F5F9", borderRadius: 10, padding: 4, marginBottom: 24, width: "fit-content" }}>
        {(["mark","report"] as const).map(v => (
          <button key={v} onClick={() => setView(v)} style={{ padding: "8px 20px", borderRadius: 8, border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", background: view === v ? "white" : "transparent", color: view === v ? "#4F46E5" : "#64748B", boxShadow: view === v ? "0 1px 4px rgba(0,0,0,0.1)" : "none", transition: "all 0.2s" }}>
            {v === "mark" ? "📝 Mark Today" : "📊 Monthly Report"}
          </button>
        ))}
      </div>

      {view === "mark" ? (
        <>
          <div className="card" style={{ padding: "24px 28px", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <h2 style={{ fontWeight: 700, fontSize: 16, color: "#0F172A" }}>📅 Mark Attendance</h2>
              <span style={{ background: "#EEF2FF", color: "#4F46E5", padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{today}</span>
              <span style={{ fontSize: 12, color: "#94A3B8" }}>{attendance.length} records loaded</span>
            </div>

            {filteredStudents.length === 0 ? (
              <p style={{ color: "#94A3B8", fontSize: 14 }}>No students yet!</p>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {filteredStudents.map(s => {
                  const att = getAtt(s.id, today);
                  const activeCfg = att ? STATUS_CONFIG[att.status] : null;
                  const isSaving = saving === s.id;

                  return (
                    <div key={s.id} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "16px 20px", borderRadius: 12, flexWrap: "wrap", gap: 12,
                      background: activeCfg ? activeCfg.bg : "#F8FAFC",
                      border: `2px solid ${activeCfg ? activeCfg.border : "#E2E8F0"}`,
                      transition: "all 0.25s ease"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: "50%",
                          background: activeCfg ? activeCfg.color : "linear-gradient(135deg, #4F46E5, #818CF8)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "white", fontWeight: 800, fontSize: 18, transition: "all 0.25s"
                        }}>
                          {isSaving ? "⏳" : activeCfg ? activeCfg.icon : s.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: 15, color: "#0F172A" }}>{s.name}</p>
                          <p style={{ fontSize: 12, fontWeight: 600, color: activeCfg ? activeCfg.color : "#94A3B8" }}>
                            {isSaving ? "Saving..." : activeCfg ? `✓ Marked as ${att?.status}` : s.subject}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        {(["present","absent","leave"] as const).map(status => {
                          const cfg = STATUS_CONFIG[status];
                          const isActive = att?.status === status;
                          return (
                            <button key={status}
                              onClick={() => !isSaving && markAttendance(s.id, today, status)}
                              disabled={isSaving}
                              style={{
                                padding: "10px 18px", borderRadius: 10,
                                cursor: isSaving ? "not-allowed" : "pointer",
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                                fontSize: 13, fontWeight: 700, transition: "all 0.2s ease",
                                border: `2px solid ${isActive ? cfg.color : "#E2E8F0"}`,
                                background: isActive ? cfg.color : "white",
                                color: isActive ? "white" : "#94A3B8",
                                transform: isActive ? "scale(1.06)" : "scale(1)",
                                boxShadow: isActive ? `0 4px 14px ${cfg.bg}` : "none",
                                opacity: isSaving ? 0.6 : 1
                              }}>
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

          {/* Last 7 Days */}
          <div className="card" style={{ padding: "24px 28px", overflowX: "auto" }}>
            <h2 style={{ fontWeight: 700, fontSize: 16, color: "#0F172A", marginBottom: 20 }}>Last 7 Days</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "10px 14px", fontSize: 13, fontWeight: 700, color: "#64748B", borderBottom: "2px solid #F1F5F9", width: 150 }}>Student</th>
                  {last7Days.map(d => {
                    const isToday = d === today;
                    const dateObj = new Date(d + "T12:00:00");
                    return (
                      <th key={d} style={{ padding: "10px 12px", fontSize: 12, fontWeight: 600, color: isToday ? "#4F46E5" : "#94A3B8", borderBottom: "2px solid #F1F5F9", textAlign: "center", background: isToday ? "#EEF2FF" : "transparent" }}>
                        <div>{dateObj.toLocaleDateString("en", { weekday: "short" })}</div>
                        <div style={{ fontWeight: 800, fontSize: 15, marginTop: 2 }}>{dateObj.getDate()}</div>
                        {isToday && <div style={{ fontSize: 10, color: "#4F46E5", marginTop: 2, fontWeight: 700 }}>TODAY</div>}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s, si) => (
                  <tr key={s.id} style={{ background: si % 2 === 0 ? "white" : "#FAFBFF" }}>
                    <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 600, color: "#0F172A", borderBottom: "1px solid #F1F5F9" }}>{s.name}</td>
                    {last7Days.map(d => {
                      const att = getAtt(s.id, d);
                      const cfg = att ? STATUS_CONFIG[att.status] : null;
                      const isToday = d === today;
                      return (
                        <td key={d} style={{ padding: "12px", textAlign: "center", borderBottom: "1px solid #F1F5F9", background: isToday ? "#F5F7FF" : "transparent" }}>
                          {cfg ? (
                            <span style={{ background: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.border}`, borderRadius: 8, padding: "5px 12px", fontSize: 14, fontWeight: 800, display: "inline-block" }}>
                              {cfg.icon}
                            </span>
                          ) : (
                            <span style={{ color: "#CBD5E1", fontSize: 18 }}>—</span>
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
        <div style={{ display: "grid", gap: 16 }}>
          {filteredStudents.map(s => {
            const stats = getStats(s.id);
            return (
              <div key={s.id} className="card" style={{ padding: "22px 26px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 17 }}>
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 15, color: "#0F172A" }}>{s.name}</p>
                      <p style={{ color: "#94A3B8", fontSize: 12 }}>{s.subject} • {MONTHS[month-1]} {year}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    {[
                      { label: "Present", value: stats.present, color: "#059669", bg: "#ECFDF5" },
                      { label: "Absent",  value: stats.absent,  color: "#DC2626", bg: "#FEF2F2" },
                      { label: "Leave",   value: stats.leave,   color: "#D97706", bg: "#FFFBEB" },
                    ].map(stat => (
                      <div key={stat.label} style={{ textAlign: "center", background: stat.bg, borderRadius: 10, padding: "8px 18px" }}>
                        <p style={{ fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</p>
                        <p style={{ fontSize: 11, color: stat.color, fontWeight: 600 }}>{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "#64748B" }}>Attendance Rate</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: stats.pct >= 75 ? "#059669" : stats.pct >= 50 ? "#D97706" : "#DC2626" }}>{stats.pct}%</span>
                  </div>
                  <div style={{ background: "#F1F5F9", borderRadius: 8, height: 10, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${stats.pct}%`, background: stats.pct >= 75 ? "linear-gradient(90deg,#10B981,#34D399)" : stats.pct >= 50 ? "linear-gradient(90deg,#F59E0B,#FCD34D)" : "linear-gradient(90deg,#EF4444,#F87171)", borderRadius: 8, transition: "width 0.6s ease" }} />
                  </div>
                  {stats.pct < 75 && stats.total > 0 && <p style={{ fontSize: 12, color: "#EF4444", marginTop: 8 }}>⚠️ Below 75% — parent ko inform karo!</p>}
                  {stats.total === 0 && <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 8 }}>No attendance marked this month</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
