"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Student, Payment } from "@/lib/types";

export default function RemindersPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();
  const monthName = new Date().toLocaleString("default", { month: "long" });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: st } = await supabase.from("students").select("*").eq("tutor_id", user.id);
      const { data: py } = await supabase.from("payments").select("*").eq("month", month).eq("year", year);
      setStudents(st || []);
      setPayments(py || []);
    }
    load();
  }, []);

  function isPaid(studentId: string) {
    return payments.find(p => p.student_id === studentId)?.status === "paid";
  }

  function feeMsg(s: Student) {
    return `Assalam o Alaikum ${s.parent_name} sb! 👋\n\nYeh Tutor Desk ki taraf se reminder hai ke *${s.name}* ki ${monthName} ki fees *PKR ${s.monthly_fee.toLocaleString()}* abhi tak pending hai.\n\nBraay meherbani jald payment kar dein.\n\nShukriya! 🙏`;
  }

  function sessionMsg(s: Student, date: string, time: string) {
    return `Assalam o Alaikum ${s.parent_name} sb! 👋\n\n*${s.name}* ka agle session ka reminder:\n\n📅 Date: ${date}\n⏰ Time: ${time}\n📚 Subject: ${s.subject}\n\nPlease time par tayar rahein.\n\nShukriya! 🙏`;
  }

  function openWhatsApp(phone: string, msg: string) {
    const clean = phone.replace(/\D/g, "");
    const intl = clean.startsWith("0") ? "92" + clean.slice(1) : clean;
    const url = `https://wa.me/${intl}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  }

  function copyMsg(key: string, msg: string) {
    navigator.clipboard.writeText(msg);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  const unpaidStudents = students.filter(s => !isPaid(s.id));

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111827" }}>WhatsApp Reminders</h1>
        <p style={{ color: "#6B7280", marginTop: 4 }}>Send fee and session reminders to parents instantly</p>
      </div>

      {/* Fee Reminders */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <h2 style={{ fontWeight: 700, fontSize: 17, color: "#111827" }}>💰 Fee Reminders</h2>
          <span style={{ background: "#FEE2E2", color: "#DC2626", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{unpaidStudents.length} pending</span>
        </div>

        {unpaidStudents.length === 0
          ? <div className="card" style={{ padding: "20px 24px", color: "#15803D", fontSize: 14, background: "#F0FDF4", border: "1px solid #86EFAC" }}>🎉 All fees collected for {monthName}!</div>
          : unpaidStudents.map(s => {
            const msg = feeMsg(s);
            const key = `fee-${s.id}`;
            return (
              <div key={s.id} className="card" style={{ padding: "20px 24px", marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 15, color: "#111827" }}>{s.name}</p>
                    <p style={{ color: "#6B7280", fontSize: 13, marginBottom: 12 }}>Parent: {s.parent_name} • {s.phone}</p>
                    <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, padding: "12px 14px", maxWidth: 500 }}>
                      <p style={{ fontSize: 13, color: "#374151", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{msg}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginLeft: 16 }}>
                    <button onClick={() => openWhatsApp(s.phone, msg)} style={{ padding: "10px 18px", background: "#25D366", color: "white", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
                      📲 Send WhatsApp
                    </button>
                    <button onClick={() => copyMsg(key, msg)} style={{ padding: "10px 18px", background: "white", border: "1px solid #E5E7EB", borderRadius: 8, fontWeight: 500, fontSize: 13, cursor: "pointer" }}>
                      {copied === key ? "✓ Copied!" : "📋 Copy Message"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Session Reminder Builder */}
      <div>
        <h2 style={{ fontWeight: 700, fontSize: 17, color: "#111827", marginBottom: 16 }}>📅 Session Reminder</h2>
        <SessionReminderBuilder students={students} onWhatsApp={openWhatsApp} onCopy={copyMsg} copied={copied} sessionMsg={sessionMsg} />
      </div>
    </div>
  );
}

function SessionReminderBuilder({ students, onWhatsApp, onCopy, copied, sessionMsg }: any) {
  const [sel, setSel] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const student = students.find((s: Student) => s.id === sel);
  const msg = student && date && time ? sessionMsg(student, date, time) : null;

  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
        <div>
          <label className="label">Student</label>
          <select className="input" value={sel} onChange={e => setSel(e.target.value)}>
            <option value="">Select student...</option>
            {students.map((s: Student) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Date</label>
          <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div>
          <label className="label">Time</label>
          <input className="input" type="time" value={time} onChange={e => setTime(e.target.value)} />
        </div>
      </div>
      {msg && (
        <div>
          <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, padding: "14px", marginBottom: 14 }}>
            <p style={{ fontSize: 13, color: "#374151", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{msg}</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => onWhatsApp(student.phone, msg)} style={{ padding: "10px 20px", background: "#25D366", color: "white", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              📲 Send WhatsApp
            </button>
            <button onClick={() => onCopy(`session-${sel}`, msg)} style={{ padding: "10px 20px", background: "white", border: "1px solid #E5E7EB", borderRadius: 8, fontWeight: 500, fontSize: 13, cursor: "pointer" }}>
              {copied === `session-${sel}` ? "✓ Copied!" : "📋 Copy Message"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
