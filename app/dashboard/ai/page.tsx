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

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function AIPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [tutorName, setTutorName] = useState("");
  const [activeTab, setActiveTab] = useState<"report" | "study" | "feedback">("report");
  const [copied, setCopied] = useState(false);

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

  async function callAI(prompt: string) {
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });
    const data = await response.json();
    return data.text || data.error || "Kuch error aya. Dobara try karo.";
  }

  async function generateReportCard() {
    if (!selectedStudent) return;
    setLoading(true);
    setResult("");
    const supabase = createClient();
    const student = students.find(s => s.id === selectedStudent)!;
    const startDate = `${year}-${String(month).padStart(2,"0")}-01`;
    const endDate = `${year}-${String(month).padStart(2,"0")}-30`;

    const [attRes, payRes, sessRes] = await Promise.all([
      supabase.from("attendance").select("status").eq("student_id", selectedStudent).gte("date", startDate).lte("date", endDate),
      supabase.from("payments").select("status").eq("student_id", selectedStudent).eq("month", month).eq("year", year),
      supabase.from("sessions").select("status").eq("student_id", selectedStudent).gte("date", startDate).lte("date", endDate),
    ]);

    const att = attRes.data || [];
    const present = att.filter(a => a.status === "present").length;
    const absent = att.filter(a => a.status === "absent").length;
    const leave = att.filter(a => a.status === "leave").length;
    const total = present + absent + leave;
    const attPct = total > 0 ? Math.round((present / total) * 100) : 0;
    const attGrade = attPct >= 90 ? "A+" : attPct >= 80 ? "A" : attPct >= 70 ? "B" : attPct >= 60 ? "C" : "D";
    const feePaid = (payRes.data || []).length > 0 && payRes.data![0].status === "paid";
    const doneSessions = (sessRes.data || []).filter(s => s.status === "done").length;
    const totalSessions = (sessRes.data || []).length;

    const prompt = `You are a professional Pakistani tutor writing a monthly report card. Write ONLY in Roman Urdu (Pakistani style). 

STRICT RULES:
- Use ONLY Roman Urdu - NO Urdu script, NO Hindi words
- Roman Urdu means: "acha", "theek", "mehnat", "koshish", "umeed", "shukriya" etc
- NO Hindi words like: "bahut" (use "bohat"), "hain" (use "hain is ok), "bahiya", "bhi" is ok
- Format with clear sections using emojis
- Keep a warm, encouraging, professional tone
- Do NOT use asterisks ** for bold - just write plainly

Student: ${student.name}
Subject: ${student.subject}  
Month: ${MONTHS[month-1]} ${year}
Tutor: ${tutorName}
Parent: ${student.parent_name}

Performance Data:
- Attendance: ${present} present, ${absent} absent, ${leave} leave (${attPct}% - Grade ${attGrade})
- Sessions: ${doneSessions} complete out of ${totalSessions} total
- Fee: ${feePaid ? "Paid - Shukriya!" : "Pending hai"}

Write the report card in this exact format:

━━━━━━━━━━━━━━━━━━━━
TUTOR DESK - Monthly Report Card
━━━━━━━━━━━━━━━━━━━━

Student: ${student.name}
Subject: ${student.subject}
Month: ${MONTHS[month-1]} ${year}
Tutor: ${tutorName}

━━━━━━━━━━━━━━━━━━━━
📊 OVERALL SUMMARY
━━━━━━━━━━━━━━━━━━━━
(2-3 lines in Roman Urdu about overall performance)

━━━━━━━━━━━━━━━━━━━━
✅ ATTENDANCE
━━━━━━━━━━━━━━━━━━━━
Hazri: ${present}/${total} din  
Grade: ${attGrade} (${attPct}%)
(1-2 lines comment in Roman Urdu)

━━━━━━━━━━━━━━━━━━━━
📚 SUBJECT PROGRESS - ${student.subject}
━━━━━━━━━━━━━━━━━━━━
(2-3 lines about subject progress in Roman Urdu)

━━━━━━━━━━━━━━━━━━━━
💪 KHOOBIYAN (Strengths)
━━━━━━━━━━━━━━━━━━━━
1. (strength 1)
2. (strength 2)

━━━━━━━━━━━━━━━━━━━━
📈 BEHTAR HO SAKTA HAI (Areas to Improve)
━━━━━━━━━━━━━━━━━━━━
1. (improvement 1)
2. (improvement 2)

━━━━━━━━━━━━━━━━━━━━
💬 TUTOR KA PAIGHAM
━━━━━━━━━━━━━━━━━━━━
(A warm personal message to ${student.parent_name} in Roman Urdu - 3-4 lines)

━━━━━━━━━━━━━━━━━━━━
Overall Rating: X/10
━━━━━━━━━━━━━━━━━━━━`;

    const text = await callAI(prompt);
    setResult(text);
    setLoading(false);
  }

  async function generateStudyPlan() {
    if (!selectedStudent) return;
    setLoading(true);
    setResult("");
    const student = students.find(s => s.id === selectedStudent)!;

    const prompt = `You are a professional Pakistani tutor. Create a monthly study plan.

STRICT RULES:
- Write ONLY in Roman Urdu (Pakistani style) mixed with English subject terms
- NO Urdu script, NO Hindi words
- Use clean formatting with emojis
- No asterisks for bold

Student: ${student.name}
Subject: ${student.subject}
Month: ${MONTHS[month-1]} ${year}
Sessions: 3 per week, 1 hour each

Write in this format:

━━━━━━━━━━━━━━━━━━━━
TUTOR DESK - Monthly Study Plan
━━━━━━━━━━━━━━━━━━━━
Student: ${student.name}
Subject: ${student.subject}
Month: ${MONTHS[month-1]} ${year}

━━━━━━━━━━━━━━━━━━━━
📅 WEEK 1
━━━━━━━━━━━━━━━━━━━━
Topics: (specific topics for ${student.subject})
Sessions: 3 sessions
Homework: (daily 20 min homework suggestion)

━━━━━━━━━━━━━━━━━━━━
📅 WEEK 2
━━━━━━━━━━━━━━━━━━━━
Topics: (next topics)
Sessions: 3 sessions  
Homework: (homework suggestion)

━━━━━━━━━━━━━━━━━━━━
📅 WEEK 3
━━━━━━━━━━━━━━━━━━━━
Topics: (revision + new topics)
Sessions: 3 sessions
Homework: (homework suggestion)

━━━━━━━━━━━━━━━━━━━━
📅 WEEK 4 - Revision Week
━━━━━━━━━━━━━━━━━━━━
Topics: (full revision)
Sessions: 3 sessions
Test: (mini test suggestion)

━━━━━━━━━━━━━━━━━━━━
💡 PARENTS KE LIYE TIPS
━━━━━━━━━━━━━━━━━━━━
(3 practical tips in Roman Urdu for parents to help at home)

━━━━━━━━━━━━━━━━━━━━
📚 RESOURCES
━━━━━━━━━━━━━━━━━━━━
(Recommended books/materials for ${student.subject})`;

    const text = await callAI(prompt);
    setResult(text);
    setLoading(false);
  }

  async function generateFeedback() {
    if (!selectedStudent) return;
    setLoading(true);
    setResult("");
    const supabase = createClient();
    const student = students.find(s => s.id === selectedStudent)!;
    const startDate = `${year}-${String(month).padStart(2,"0")}-01`;
    const endDate = `${year}-${String(month).padStart(2,"0")}-30`;

    const { data: att } = await supabase.from("attendance").select("status").eq("student_id", selectedStudent).gte("date", startDate).lte("date", endDate);
    const present = (att || []).filter(a => a.status === "present").length;
    const total = (att || []).length;
    const attPct = total > 0 ? Math.round((present / total) * 100) : 0;

    const prompt = `You are a professional Pakistani tutor. Write a WhatsApp message to a parent.

STRICT RULES:
- Write ONLY in Roman Urdu (Pakistani style)
- NO Urdu script at all
- NO Hindi words - use proper Pakistani words
- Pakistani Roman Urdu: "bohat", "acha", "theek", "mehnat", "koshish", "umeed", "shukriya", "aap", "hain", "kar", "raha", "tha"
- Keep it warm, respectful and concise (150-180 words max)
- Use WhatsApp style with emojis
- Start with Assalam o Alaikum

Student: ${student.name}
Parent: ${student.parent_name}
Subject: ${student.subject}
Month: ${MONTHS[month-1]} ${year}
Attendance: ${attPct}%
Tutor: ${tutorName}

Write a complete WhatsApp message only - no extra explanation needed.`;

    const text = await callAI(prompt);
    setResult(text);
    setLoading(false);
  }

  function handleGenerate() {
    if (activeTab === "report") generateReportCard();
    else if (activeTab === "study") generateStudyPlan();
    else generateFeedback();
  }

  function handleCopy() {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const student = students.find(s => s.id === selectedStudent);

  const tabs = [
    { id: "report" as const, label: "📝 Report Card", desc: "Monthly progress report" },
    { id: "study" as const, label: "📚 Study Plan", desc: "4 week plan generate karo" },
    { id: "feedback" as const, label: "💬 Parent Message", desc: "WhatsApp message" },
  ];

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <div style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)", borderRadius: 12, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🤖</div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)" }}>AI Assistant</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Powered by Groq AI — Fast & Free</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setResult(""); }}
            style={{ padding: "16px", borderRadius: 14, border: `2px solid ${activeTab === tab.id ? "#7C3AED" : "var(--border)"}`, background: activeTab === tab.id ? "rgba(124,58,237,0.08)" : "var(--bg-card)", cursor: "pointer", textAlign: "left", fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.2s" }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: activeTab === tab.id ? "#7C3AED" : "var(--text-primary)", marginBottom: 4 }}>{tab.label}</p>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{tab.desc}</p>
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="card" style={{ padding: "24px 28px", marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
          <div>
            <label className="label">Student</label>
            <select className="input" value={selectedStudent} onChange={e => { setSelectedStudent(e.target.value); setResult(""); }}>
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
          <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 16px", background: "var(--bg-hover)", borderRadius: 10, marginBottom: 20 }}>
            <div style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
              {student.name.charAt(0)}
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{student.name}</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{student.subject} • Parent: {student.parent_name}</p>
            </div>
          </div>
        )}

        <button onClick={handleGenerate} disabled={loading || !selectedStudent}
          style={{ padding: "13px 28px", background: loading ? "var(--text-muted)" : "linear-gradient(135deg, #7C3AED, #A78BFA)", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 4px 14px rgba(124,58,237,0.3)", transition: "all 0.2s" }}>
          {loading ? "⏳ AI likh raha hai..." : `🤖 ${activeTab === "report" ? "Report Card Banao" : activeTab === "study" ? "Study Plan Banao" : "Message Banao"}`}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="card" style={{ padding: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)" }}>
              {activeTab === "report" ? "📝 Report Card" : activeTab === "study" ? "📚 Study Plan" : "💬 Parent Message"}
            </h2>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleCopy}
                style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {copied ? "✓ Copied!" : "📋 Copy"}
              </button>
              {activeTab === "feedback" && student && (
                <button onClick={() => {
                  const phone = student.parent_name;
                  const url = `https://wa.me/?text=${encodeURIComponent(result)}`;
                  window.open(url, "_blank");
                }}
                  style={{ padding: "8px 16px", borderRadius: 8, background: "#25D366", color: "white", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  📲 WhatsApp
                </button>
              )}
              <button onClick={() => window.print()}
                style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #7C3AED, #A78BFA)", color: "white", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                🖨️ Print
              </button>
            </div>
          </div>

          <div style={{ background: "var(--bg-hover)", borderRadius: 14, padding: "28px", border: "1px solid var(--border)" }}>
            <pre style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.9, color: "var(--text-primary)", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0 }}>
              {result}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
