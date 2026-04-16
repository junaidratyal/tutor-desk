
"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { Student, Payment } from "@/lib/types";

interface Attendance {
  id: string;
  student_id: string;
  date: string;
  status: "present" | "absent" | "leave";
}

interface Session {
  id: string;
  student_id: string;
  date: string;
  time: string;
  duration: number;
  status: string;
  students?: { name: string; subject: string };
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function ReportsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [tutorName, setTutorName] = useState("");
  const [reportType, setReportType] = useState<"overview" | "student">("overview");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const printRef = useRef<HTMLDivElement>(null);

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setTutorName(user.user_metadata?.name || user.email?.split("@")[0] || "Tutor");

    const startDate = `${year}-${String(month).padStart(2,"0")}-01`;
    const endDate = `${year}-${String(month).padStart(2,"0")}-31`;

    const [st, py, att, se] = await Promise.all([
      supabase.from("students").select("*").eq("tutor_id", user.id),
      supabase.from("payments").select("*").eq("month", month).eq("year", year),
      supabase.from("attendance").select("*").gte("date", startDate).lte("date", endDate),
      supabase.from("sessions").select("*, students(name, subject)").gte("date", startDate).lte("date", endDate),
    ]);

    setStudents(st.data || []);
    setPayments(py.data || []);
    setAttendance(att.data || []);
    setSessions(se.data || []);
    if (st.data && st.data.length > 0) setSelectedStudent(st.data[0].id);
  }

  useEffect(() => { load(); }, [month, year]);

  function getPayment(studentId: string) {
    return payments.find(p => p.student_id === studentId);
  }

  function getAttStats(studentId: string) {
    const records = attendance.filter(a => a.student_id === studentId);
    const present = records.filter(a => a.status === "present").length;
    const absent = records.filter(a => a.status === "absent").length;
    const leave = records.filter(a => a.status === "leave").length;
    const total = present + absent + leave;
    const pct = total > 0 ? Math.round((present / total) * 100) : 0;
    return { present, absent, leave, total, pct };
  }

  function getStudentSessions(studentId: string) {
    return sessions.filter(s => s.student_id === studentId);
  }

  const totalFees = students.reduce((sum, s) => sum + s.monthly_fee, 0);
  const collectedFees = students.filter(s => getPayment(s.id)?.status === "paid").reduce((sum, s) => sum + s.monthly_fee, 0);
  const pendingFees = totalFees - collectedFees;
  const avgAttendance = students.length > 0 ? Math.round(students.reduce((sum, s) => sum + getAttStats(s.id).pct, 0) / students.length) : 0;

  function printReport() {
    window.print();
  }

  const selectedStudentData = students.find(s => s.id === selectedStudent);

  return (
    <div className="fade-in">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: fixed; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0F172A" }}>Reports</h1>
          <p style={{ color: "#64748B", marginTop: 4 }}>Generate monthly reports for students & parents</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <select className="input" style={{ width: "auto" }} value={month} onChange={e => setMonth(Number(e.target.value))}>
            {MONTHS_SHORT.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select className="input" style={{ width: "auto" }} value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Report Type Toggle */}
      <div className="no-print" style={{ display: "flex", gap: 4, background: "#F1F5F9", borderRadius: 10, padding: 4, marginBottom: 24, width: "fit-content" }}>
        {(["overview","student"] as const).map(v => (
          <button key={v} onClick={() => setReportType(v)} style={{ padding: "8px 20px", borderRadius: 8, border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", background: reportType === v ? "white" : "transparent", color: reportType === v ? "#4F46E5" : "#64748B", boxShadow: reportType === v ? "0 1px 4px rgba(0,0,0,0.1)" : "none", transition: "all 0.2s" }}>
            {v === "overview" ? "📊 Academy Overview" : "👤 Per Student (Parent)"}
          </button>
        ))}
      </div>

      {reportType === "student" && (
        <div className="no-print" style={{ marginBottom: 20, display: "flex", gap: 10, alignItems: "center" }}>
          <select className="input" style={{ maxWidth: 280 }} value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}

      {/* Print Button */}
      <div className="no-print" style={{ marginBottom: 24 }}>
        <button onClick={printReport} style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", color: "white", padding: "12px 28px", borderRadius: 10, fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: "0 4px 14px rgba(79,70,229,0.3)", display: "flex", alignItems: "center", gap: 8 }}>
          🖨️ Print / Save as PDF
        </button>
        <p style={{ color: "#94A3B8", fontSize: 12, marginTop: 8 }}>Browser print dialog mein "Save as PDF" select karo</p>
      </div>

      {/* PRINT AREA */}
      <div id="print-area" ref={printRef}>
        {reportType === "overview" ? (
          /* ── ACADEMY OVERVIEW REPORT ── */
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", maxWidth: 800, margin: "0 auto", background: "white", padding: "40px" }}>

            {/* Report Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, paddingBottom: 20, borderBottom: "3px solid #4F46E5" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", color: "white", borderRadius: 8, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15 }}>TD</div>
                  <span style={{ fontWeight: 800, fontSize: 20, color: "#0F172A" }}>Tutor Desk</span>
                </div>
                <p style={{ color: "#64748B", fontSize: 13 }}>Monthly Progress Report</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontWeight: 800, fontSize: 18, color: "#4F46E5" }}>{MONTHS[month-1]} {year}</p>
                <p style={{ color: "#64748B", fontSize: 13 }}>Tutor: {tutorName}</p>
                <p style={{ color: "#94A3B8", fontSize: 12 }}>Generated: {new Date().toLocaleDateString("en-PK")}</p>
              </div>
            </div>

            {/* Summary Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 32 }}>
              {[
                { label: "Total Students", value: students.length, color: "#4F46E5", bg: "#EEF2FF" },
                { label: "Fees Collected", value: `PKR ${collectedFees.toLocaleString()}`, color: "#059669", bg: "#ECFDF5" },
                { label: "Fees Pending", value: `PKR ${pendingFees.toLocaleString()}`, color: "#DC2626", bg: "#FEF2F2" },
                { label: "Avg Attendance", value: `${avgAttendance}%`, color: "#D97706", bg: "#FFFBEB" },
              ].map((stat, i) => (
                <div key={i} style={{ background: stat.bg, borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
                  <p style={{ fontSize: 11, color: stat.color, fontWeight: 600, marginBottom: 6, textTransform: "uppercase" }}>{stat.label}</p>
                  <p style={{ fontSize: 18, fontWeight: 800, color: stat.color }}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Students Table */}
            <h3 style={{ fontWeight: 800, fontSize: 15, color: "#0F172A", marginBottom: 14 }}>Student Details</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#4F46E5" }}>
                  {["Student","Subject","Monthly Fee","Fee Status","Present","Absent","Attendance %","Sessions"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", color: "white", fontWeight: 700, textAlign: "left", fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => {
                  const pay = getPayment(s.id);
                  const att = getAttStats(s.id);
                  const sess = getStudentSessions(s.id);
                  return (
                    <tr key={s.id} style={{ background: i % 2 === 0 ? "#F8FAFF" : "white" }}>
                      <td style={{ padding: "10px 12px", fontWeight: 600, color: "#0F172A" }}>{s.name}</td>
                      <td style={{ padding: "10px 12px", color: "#64748B" }}>{s.subject}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 600 }}>PKR {s.monthly_fee.toLocaleString()}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ background: pay?.status === "paid" ? "#ECFDF5" : "#FEF2F2", color: pay?.status === "paid" ? "#059669" : "#DC2626", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                          {pay?.status === "paid" ? "✓ Paid" : "✗ Unpaid"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", color: "#059669", fontWeight: 700, textAlign: "center" }}>{att.present}</td>
                      <td style={{ padding: "10px 12px", color: "#DC2626", fontWeight: 700, textAlign: "center" }}>{att.absent}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        <span style={{ fontWeight: 800, color: att.pct >= 75 ? "#059669" : att.pct >= 50 ? "#D97706" : "#DC2626" }}>{att.pct}%</span>
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "center", color: "#4F46E5", fontWeight: 700 }}>{sess.length}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: "#F1F5F9", borderTop: "2px solid #E2E8F0" }}>
                  <td colSpan={2} style={{ padding: "10px 12px", fontWeight: 800, color: "#0F172A" }}>TOTAL</td>
                  <td style={{ padding: "10px 12px", fontWeight: 800 }}>PKR {totalFees.toLocaleString()}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: "#059669" }}>PKR {collectedFees.toLocaleString()} collected</td>
                  <td colSpan={4}></td>
                </tr>
              </tfoot>
            </table>

            {/* Sessions */}
            {sessions.length > 0 && (
              <>
                <h3 style={{ fontWeight: 800, fontSize: 15, color: "#0F172A", margin: "28px 0 14px" }}>Sessions This Month ({sessions.length} total)</h3>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#F1F5F9" }}>
                      {["Date","Student","Subject","Time","Duration","Status"].map(h => (
                        <th key={h} style={{ padding: "8px 12px", color: "#64748B", fontWeight: 700, textAlign: "left", fontSize: 12 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.slice(0,15).map((s, i) => (
                      <tr key={s.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "8px 12px", color: "#374151" }}>{s.date}</td>
                        <td style={{ padding: "8px 12px", fontWeight: 600 }}>{s.students?.name}</td>
                        <td style={{ padding: "8px 12px", color: "#64748B" }}>{s.students?.subject}</td>
                        <td style={{ padding: "8px 12px", color: "#64748B" }}>{s.time?.slice(0,5)}</td>
                        <td style={{ padding: "8px 12px", color: "#64748B" }}>{s.duration} min</td>
                        <td style={{ padding: "8px 12px" }}>
                          <span style={{ background: s.status === "done" ? "#ECFDF5" : s.status === "cancelled" ? "#F1F5F9" : "#EEF2FF", color: s.status === "done" ? "#059669" : s.status === "cancelled" ? "#94A3B8" : "#4F46E5", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {/* Footer */}
            <div style={{ marginTop: 40, paddingTop: 16, borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: 11, color: "#94A3B8" }}>Generated by Tutor Desk • tutor-desk-sage.vercel.app</p>
              <p style={{ fontSize: 11, color: "#94A3B8" }}>{MONTHS[month-1]} {year} Report</p>
            </div>
          </div>
        ) : (
          /* ── PER STUDENT PARENT REPORT ── */
          selectedStudentData && (() => {
            const pay = getPayment(selectedStudentData.id);
            const att = getAttStats(selectedStudentData.id);
            const sess = getStudentSessions(selectedStudentData.id);
            const attRecords = attendance.filter(a => a.student_id === selectedStudentData.id).sort((a,b) => a.date.localeCompare(b.date));

            return (
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", maxWidth: 720, margin: "0 auto", background: "white", padding: "40px" }}>

                {/* Header */}
                <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: "3px solid #4F46E5" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <div style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", color: "white", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13 }}>TD</div>
                        <span style={{ fontWeight: 800, fontSize: 18, color: "#0F172A" }}>Tutor Desk</span>
                      </div>
                      <p style={{ color: "#64748B", fontSize: 12 }}>Student Progress Report — {MONTHS[month-1]} {year}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontWeight: 700, color: "#4F46E5" }}>{MONTHS[month-1]} {year}</p>
                      <p style={{ fontSize: 12, color: "#94A3B8" }}>Tutor: {tutorName}</p>
                    </div>
                  </div>
                </div>

                {/* Student Info */}
                <div style={{ background: "#F8FAFF", borderRadius: 14, padding: "20px 24px", marginBottom: 24, border: "1px solid #E2E8F0" }}>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>{selectedStudentData.name}</h2>
                  <p style={{ color: "#64748B", fontSize: 14 }}>Subject: <strong>{selectedStudentData.subject}</strong> • Parent: <strong>{selectedStudentData.parent_name}</strong> • Phone: {selectedStudentData.phone}</p>
                </div>

                {/* Stats Row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 28 }}>
                  {[
                    { label: "Monthly Fee", value: `PKR ${selectedStudentData.monthly_fee.toLocaleString()}`, color: "#4F46E5", bg: "#EEF2FF" },
                    { label: "Fee Status", value: pay?.status === "paid" ? "✓ Paid" : "✗ Unpaid", color: pay?.status === "paid" ? "#059669" : "#DC2626", bg: pay?.status === "paid" ? "#ECFDF5" : "#FEF2F2" },
                    { label: "Attendance", value: `${att.pct}%`, color: att.pct >= 75 ? "#059669" : "#DC2626", bg: att.pct >= 75 ? "#ECFDF5" : "#FEF2F2" },
                    { label: "Sessions", value: sess.length, color: "#D97706", bg: "#FFFBEB" },
                  ].map((stat, i) => (
                    <div key={i} style={{ background: stat.bg, borderRadius: 10, padding: "14px", textAlign: "center" }}>
                      <p style={{ fontSize: 10, color: stat.color, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>{stat.label}</p>
                      <p style={{ fontSize: 16, fontWeight: 800, color: stat.color }}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Attendance Details */}
                <h3 style={{ fontWeight: 800, fontSize: 14, color: "#0F172A", marginBottom: 12 }}>Attendance Details</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
                  {[
                    { label: "Present", value: att.present, color: "#059669", bg: "#ECFDF5" },
                    { label: "Absent", value: att.absent, color: "#DC2626", bg: "#FEF2F2" },
                    { label: "Leave", value: att.leave, color: "#D97706", bg: "#FFFBEB" },
                  ].map(s => (
                    <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: "12px", textAlign: "center" }}>
                      <p style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</p>
                      <p style={{ fontSize: 12, color: s.color, fontWeight: 600 }}>{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Attendance Log */}
                {attRecords.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {attRecords.map(a => (
                        <span key={a.id} style={{
                          padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                          background: a.status === "present" ? "#ECFDF5" : a.status === "absent" ? "#FEF2F2" : "#FFFBEB",
                          color: a.status === "present" ? "#059669" : a.status === "absent" ? "#DC2626" : "#D97706"
                        }}>
                          {a.date.slice(8)} {a.status === "present" ? "✓" : a.status === "absent" ? "✗" : "○"}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sessions */}
                {sess.length > 0 && (
                  <>
                    <h3 style={{ fontWeight: 800, fontSize: 14, color: "#0F172A", marginBottom: 12 }}>Sessions ({sess.length})</h3>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 24 }}>
                      <thead>
                        <tr style={{ background: "#F1F5F9" }}>
                          {["Date","Time","Duration","Status"].map(h => (
                            <th key={h} style={{ padding: "8px 12px", color: "#64748B", fontWeight: 700, textAlign: "left", fontSize: 12 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sess.map(s => (
                          <tr key={s.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                            <td style={{ padding: "8px 12px" }}>{s.date}</td>
                            <td style={{ padding: "8px 12px" }}>{s.time?.slice(0,5)}</td>
                            <td style={{ padding: "8px 12px" }}>{s.duration} min</td>
                            <td style={{ padding: "8px 12px" }}>
                              <span style={{ background: s.status === "done" ? "#ECFDF5" : "#EEF2FF", color: s.status === "done" ? "#059669" : "#4F46E5", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{s.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                {/* Message to parent */}
                <div style={{ background: "#F8FAFF", border: "1px solid #C7D2FE", borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
                  <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>
                    Assalam o Alaikum {selectedStudentData.parent_name} sb,<br/>
                    Yeh {MONTHS[month-1]} {year} ki progress report hai. {selectedStudentData.name} ki attendance <strong>{att.pct}%</strong> rahi aur fee status <strong>{pay?.status === "paid" ? "paid" : "unpaid"}</strong> hai.
                    {att.pct < 75 ? " Attendance 75% se kam hai — please attention dein." : " Attendance acha raha, keep it up!"}
                  </p>
                </div>

                {/* Tutor Signature */}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 40, paddingTop: 16, borderTop: "1px solid #E2E8F0" }}>
                  <div>
                    <p style={{ fontSize: 12, color: "#94A3B8" }}>Generated by Tutor Desk</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ width: 120, borderBottom: "1px solid #374151", marginBottom: 4 }}></div>
                    <p style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>{tutorName}</p>
                    <p style={{ fontSize: 11, color: "#94A3B8" }}>Tutor Signature</p>
                  </div>
                </div>
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}
