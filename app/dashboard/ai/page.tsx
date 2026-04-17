"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

interface Student {
  id: string;
  name: string;
  parent_name: string;
  subject: string;
  monthly_fee: number;
}

interface Attendance {
  status: string;
  date: string;
}

interface Payment {
  status: string;
  month: number;
  year: number;
}

interface Session {
  status: string;
  date: string;
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function AIPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [reportCard, setReportCard] = useState("");
  const [tutorName, setTutorName] = useState("");
  const [activeTab, setActiveTab] = useState<"report" | "study" | "feedback">("report");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setTutorName(user.user_metadata?.name || user.email?.split("@")[0] || "Tutor");
      const { data: st } = await supabase.from("students").select("*").eq("tutor_id", user.id);
      setStudents(st || []);
      if (st && st.length > 0) setSelectedStudent(st[0].id);
    }
    load();
  }, []);

  async function generateReportCard() {
    if (!selectedStudent) return;
    setLoading(true);
    setReportCard("");

    const supabase = createClient();
    const student = students.find(s => s.id === selectedStudent)!;

    const startDate = `${year}-${String(month).padStart(2,"0")}-01`;
    const endDate = `${year}-${String(month).padStart(2,"0")}-31`;

    const [attRes, payRes, sessRes] = await Promise.all([
      supabase.from("attendance").select("status, date").eq("student_id", selectedStudent).gte("date", startDate).lte("date", endDate),
      supabase.from("payments").select("status, month, year").eq("student_id", selectedStudent).eq("month", month).eq("year", year),
      supabase.from("sessions").select("status, date").eq("student_id", selectedStudent).gte("date", startDate).lte("date", endDate),
    ]);

    const att = attRes.data || [];
    const pay = payRes.data || [];
    const sess = sessRes.data || [];

    const present = att.filter(a => a.status === "present").length;
    const absent = att.filter(a => a.status === "absent").length;
    const leave = att.filter(a => a.status === "leave").length;
    const total = present + absent + leave;
    const attPct = total > 0 ? Math.round((present / total) * 100) : 0;
    const feePaid = pay.length > 0 && pay[0].status === "paid";
    const doneSessions = sess.filter(s => s.status === "done").length;
    const totalSessions = sess.length;

    const prompt = `You are an expert tutor assistant. Generate a professional, encouraging report card in Urdu/English mix (Roman Urdu) for a student.

Student Details:
- Name: ${student.name}
- Parent: ${student.parent_name}
- Subject: ${student.subject}
- Month: ${MONTHS[month-1]} ${year}
- Tutor: ${tutorName}

Performance Data:
- Attendance: ${present} present, ${absent} absent, ${leave} leave out of ${total} total days (${attPct}%)
- Sessions Completed: ${doneSessions} out of ${totalSessions}
- Fee Status: ${feePaid ? "Paid ✓" : "Pending ✗"}
- Monthly Fee: PKR ${student.monthly_fee.toLocaleString()}

Generate a warm, professional report card with:
1. Overall Performance Summary (2-3 sentences)
2. Attendance Analysis with grade (A/B/C/D)
3. Subject Progress comments for ${student.subject}
4. Strengths (2 points)
5. Areas for Improvement (2 points)  
6. Tutor's Personal Message to parent (warm, encouraging, in Roman Urdu)
7. Overall Grade/Rating (out of 10)

Keep it encouraging, professional and parent-friendly. Mix English and Roman Urdu naturally.`;

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });

      const data = await response.json();
      const text = data.text || data.error || "Report generate nahi ho saki. Dobara try karo!";
      setReportCard(text);
    } catch (err) {
      setReportCard("❌ Error: Report generate nahi ho saki. Internet check karo.");
    }
    setLoading(false);
  }

  async function generateStudyPlan() {
    if (!selectedStudent) return;
    setLoading(true);
    setReportCard("");
    const student = students.find(s => s.id === selectedStudent)!;

    const prompt = `You are an expert Pakistani tutor. Create a detailed monthly study plan for a student.

Student: ${student.name}
Subject: ${student.subject}
Month: ${MONTHS[month-1]} ${year}
Sessions per week: Assume 3 sessions per week, 1 hour each

Create a structured 4-week study plan with:
1. Week 1: Topics to cover (with specific sub-topics)
2. Week 2: Topics to cover (building on week 1)
3. Week 3: Topics to cover + Practice/Revision
4. Week 4: Revision + Assessment

Also include:
- Daily homework suggestions (15-20 min)
- Resources/materials recommended
- Tips for parents to support at home

Keep it practical, specific to ${student.subject}, and suitable for Pakistani curriculum.
Write in mix of English and Roman Urdu.`;

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      const data = await response.json();
      setReportCard(data.text || data.error || "Plan generate nahi hua.");
    } catch {
      setReportCard("❌ Error. Dobara try karo.");
    }
    setLoading(false);
  }

  async function generateFeedback() {
    if (!selectedStudent) return;
    setLoading(true);
    setReportCard("");
    const student = students.find(s => s.id === selectedStudent)!;

    const supabase = createClient();
    const startDate = `${year}-${String(month).padStart(2,"0")}-01`;
    const endDate = `${year}-${String(month).padStart(2,"0")}-31`;

    const { data: att } = await supabase.from("attendance").select("status").eq("student_id", selectedStudent).gte("date", startDate).lte("date", endDate);
    const present = (att || []).filter(a => a.status === "present").length;
    const total = (att || []).length;
    const attPct = total > 0 ? Math.round((present / total) * 100) : 0;

    const prompt = `You are a professional Pakistani tutor. Write a warm, personalized WhatsApp message to the parent.

Student: ${student.name}
Parent: ${student.parent_name}
Subject: ${student.subject}
Month: ${MONTHS[month-1]} ${year}
Attendance: ${attPct}%

Write a professional yet warm WhatsApp message in Roman Urdu that:
1. Greets parent respectfully (Assalam o Alaikum)
2. Gives monthly progress update
3. Mentions attendance
4. Highlights one strength and one area to improve
5. Encourages parent involvement
6. Ends warmly

Keep it concise (150-200 words), conversational, and use WhatsApp-friendly formatting with emojis.`;

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      const data = await response.json();
      setReportCard(data.text || data.error || "Message generate nahi hua.");
    } catch {
      setReportCard("❌ Error. Dobara try karo.");
    }
    setLoading(false);
  }

  const student = students.find(s => s.id === selectedStudent);

  const tabs = [
    { id: "report", label: "📝 Report Card", desc: "AI se professional report card" },
    { id: "study", label: "📚 Study Plan", desc: "Monthly study plan generate karo" },
    { id: "feedback", label: "💬 Parent Message", desc: "WhatsApp message for parents" },
  ] as const;

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)", borderRadius: 12, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🤖</div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)" }}>AI Assistant</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Powered by Claude AI — Smart tools for tutors</p>
          </div>
        </div>
      </div>

      {/* Tab Selector */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setReportCard(""); }}
            style={{ padding: "16px", borderRadius: 14, border: `2px solid ${activeTab === tab.id ? "#7C3AED" : "var(--border)"}`, background: activeTab === tab.id ? "linear-gradient(135deg, #EDE9FE, #F5F3FF)" : "var(--bg-card)", cursor: "pointer", textAlign: "left", transition: "all 0.2s", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: activeTab === tab.id ? "#7C3AED" : "var(--text-primary)", marginBottom: 4 }}>{tab.label}</p>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{tab.desc}</p>
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="card" style={{ padding: "24px 28px", marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
          <div>
            <label className="label">Student Select karo</label>
            <select className="input" value={selectedStudent} onChange={e => { setSelectedStudent(e.target.value); setReportCard(""); }}>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} — {s.subject}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Month</label>
            <select className="input" value={month} onChange={e => setMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Year</label>
            <select className="input" value={year} onChange={e => setYear(Number(e.target.value))}>
              {[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {student && (
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 20, padding: "12px 16px", background: "var(--bg-hover)", borderRadius: 10 }}>
            <div style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700 }}>
              {student.name.charAt(0)}
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{student.name}</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{student.subject} • Parent: {student.parent_name} • PKR {student.monthly_fee.toLocaleString()}/month</p>
            </div>
          </div>
        )}

        <button
          onClick={activeTab === "report" ? generateReportCard : activeTab === "study" ? generateStudyPlan : generateFeedback}
          disabled={loading || !selectedStudent}
          style={{ padding: "13px 28px", background: loading ? "#94A3B8" : "linear-gradient(135deg, #7C3AED, #A78BFA)", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 4px 14px rgba(124,58,237,0.3)" }}>
          {loading ? (
            <>
              <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⏳</span>
              AI generate kar raha hai...
            </>
          ) : (
            <>🤖 {activeTab === "report" ? "Report Card Generate Karo" : activeTab === "study" ? "Study Plan Generate Karo" : "Parent Message Generate Karo"}</>
          )}
        </button>
      </div>

      {/* Result */}
      {reportCard && (
        <div className="card" style={{ padding: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)" }}>
              {activeTab === "report" ? "📝 AI Generated Report Card" : activeTab === "study" ? "📚 Monthly Study Plan" : "💬 Parent WhatsApp Message"}
            </h2>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => navigator.clipboard.writeText(reportCard)}
                style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                📋 Copy
              </button>
              {activeTab === "feedback" && student && (
                <a href={`https://wa.me/92${student.parent_name}?text=${encodeURIComponent(reportCard)}`}
                  target="_blank" style={{ padding: "8px 16px", borderRadius: 8, background: "#25D366", color: "white", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
                  📲 WhatsApp
                </a>
              )}
              <button onClick={() => window.print()}
                style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #7C3AED, #A78BFA)", color: "white", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                🖨️ Print
              </button>
            </div>
          </div>

          {/* Report Card Display */}
          <div style={{ background: "var(--bg-hover)", borderRadius: 12, padding: "24px", border: "1px solid var(--border)" }}>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 20, paddingBottom: 16, borderBottom: "2px solid var(--border)" }}>
              <div style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)", color: "white", borderRadius: 10, width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, margin: "0 auto 12px" }}>TD</div>
              <p style={{ fontWeight: 800, fontSize: 18, color: "var(--text-primary)" }}>Tutor Desk — AI Report</p>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{student?.name} • {MONTHS[month-1]} {year}</p>
            </div>

            <div style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.8, color: "var(--text-primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {reportCard}
            </div>

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)" }}>
              <span>Generated by Tutor Desk AI</span>
              <span>Tutor: {tutorName}</span>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
