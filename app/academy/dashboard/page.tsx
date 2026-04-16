"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { getUserAcademy, Academy, AcademyMember } from "@/lib/academy";

interface Student {
  id: string;
  name: string;
  subject: string;
  monthly_fee: number;
  tutor_id: string;
}

interface Payment {
  status: string;
  student_id: string;
}

export default function AcademyDashboard() {
  const router = useRouter();
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [role, setRole] = useState<"admin" | "tutor">("tutor");
  const [members, setMembers] = useState<AcademyMember[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const loadData = useCallback(async () => {
    const result = await getUserAcademy();
    if (!result) { router.push("/academy"); return; }

    setAcademy(result.academy);
    setRole(result.role);

    const supabase = createClient();

    const { data: mems } = await supabase
      .from("academy_members")
      .select("*")
      .eq("academy_id", result.academy.id)
      .order("joined_at", { ascending: true });
    setMembers(mems || []);

    const memberIds = (mems || []).map((m: AcademyMember) => m.user_id);
    if (memberIds.length > 0) {
      const { data: sts } = await supabase
        .from("students").select("*").in("tutor_id", memberIds);
      setStudents(sts || []);

      const studentIds = (sts || []).map((s: Student) => s.id);
      if (studentIds.length > 0) {
        const { data: pays } = await supabase
          .from("payments").select("status, student_id")
          .in("student_id", studentIds)
          .eq("month", currentMonth).eq("year", currentYear);
        setPayments(pays || []);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();

    // Real-time subscription for new members
    const supabase = createClient();
    const channel = supabase
      .channel("academy_members_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "academy_members" }, () => {
        loadData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadData]);

  async function removeMember(memberId: string) {
    if (!confirm("Is tutor ko academy se remove karna chahte hain?")) return;
    setRemoving(memberId);
    const supabase = createClient();
    await supabase.from("academy_members").delete().eq("id", memberId);
    setMembers(prev => prev.filter(m => m.id !== memberId));
    setRemoving(null);
  }

  function copyInviteCode() {
    if (!academy) return;
    navigator.clipboard.writeText(academy.invite_code.toUpperCase());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyInviteLink() {
    if (!academy) return;
    const link = `${window.location.origin}/academy/join?code=${academy.invite_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFF", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <p style={{ color: "#94A3B8" }}>Loading academy...</p>
    </div>
  );

  const totalFees = students.reduce((sum, s) => sum + s.monthly_fee, 0);
  const paidStudentIds = payments.filter(p => p.status === "paid").map(p => p.student_id);
  const collectedFees = students.filter(s => paidStudentIds.includes(s.id)).reduce((sum, s) => sum + s.monthly_fee, 0);
  const getMemberStudents = (userId: string) => students.filter(s => s.tutor_id === userId);

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFF", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <nav style={{ padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", borderBottom: "1px solid #E2E8F0", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", color: "white", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13 }}>TD</div>
          </Link>
          <div style={{ width: 1, height: 24, background: "#E2E8F0" }} />
          <div>
            <p style={{ fontWeight: 800, fontSize: 16, color: "#0F172A" }}>🏫 {academy?.name}</p>
            <p style={{ fontSize: 11, color: "#94A3B8" }}>Academy {role === "admin" ? "👑 Admin" : "📚 Tutor"}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={loadData} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #E2E8F0", color: "#64748B", background: "white", fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            🔄 Refresh
          </button>
          <Link href="/dashboard" style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #E2E8F0", color: "#64748B", textDecoration: "none", fontSize: 13, fontWeight: 500, background: "white" }}>
            My Dashboard
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
          {[
            { label: "Total Tutors", value: members.length, icon: "👨‍🏫", color: "#4F46E5", bg: "#EEF2FF" },
            { label: "Total Students", value: students.length, icon: "👨‍🎓", color: "#059669", bg: "#ECFDF5" },
            { label: "Fees Collected", value: `PKR ${collectedFees.toLocaleString()}`, icon: "💰", color: "#D97706", bg: "#FFFBEB" },
            { label: "Fees Pending", value: `PKR ${(totalFees - collectedFees).toLocaleString()}`, icon: "⏳", color: "#DC2626", bg: "#FEF2F2" },
          ].map((stat, i) => (
            <div key={i} style={{ background: "white", borderRadius: 14, padding: "20px 24px", border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <p style={{ color: "#64748B", fontSize: 13, fontWeight: 500 }}>{stat.label}</p>
                <div style={{ background: stat.bg, borderRadius: 8, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{stat.icon}</div>
              </div>
              <p style={{ fontSize: 26, fontWeight: 800, color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: role === "admin" ? "1fr 1fr" : "1fr", gap: 24 }}>

          {/* Invite — Admin only */}
          {role === "admin" && (
            <div style={{ background: "white", borderRadius: 16, padding: "24px 28px", border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <h2 style={{ fontWeight: 700, fontSize: 16, color: "#0F172A", marginBottom: 6 }}>🔗 Tutors Ko Invite Karo</h2>
              <p style={{ color: "#64748B", fontSize: 13, marginBottom: 20 }}>Yeh code share karo — tutor join kar le ga</p>
              <div style={{ background: "#F8FAFF", borderRadius: 12, padding: "20px", textAlign: "center", border: "2px dashed #C7D2FE", marginBottom: 16 }}>
                <p style={{ fontSize: 11, color: "#94A3B8", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Invite Code</p>
                <p style={{ fontSize: 36, fontWeight: 800, color: "#4F46E5", letterSpacing: "0.2em" }}>{academy?.invite_code?.toUpperCase()}</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button onClick={copyInviteCode} style={{ padding: "10px", borderRadius: 8, border: "1px solid #C7D2FE", background: "#EEF2FF", color: "#4F46E5", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {copied ? "✓ Copied!" : "📋 Code Copy"}
                </button>
                <button onClick={copyInviteLink} style={{ padding: "10px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #4F46E5, #818CF8)", color: "white", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  🔗 Link Copy
                </button>
              </div>
            </div>
          )}

          {/* Members */}
          <div style={{ background: "white", borderRadius: 16, padding: "24px 28px", border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <h2 style={{ fontWeight: 700, fontSize: 16, color: "#0F172A", marginBottom: 20 }}>👨‍🏫 Academy Members ({members.length})</h2>
            <div style={{ display: "grid", gap: 10 }}>
              {members.map(member => {
                const memberStudents = getMemberStudents(member.user_id);
                const isAdmin = member.role === "admin";
                return (
                  <div key={member.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "#F8FAFC", borderRadius: 12, border: "1px solid #E2E8F0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ background: isAdmin ? "linear-gradient(135deg, #4F46E5, #818CF8)" : "linear-gradient(135deg, #10B981, #34D399)", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 15 }}>
                        {(member.name || member.email || "T").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 14, color: "#0F172A" }}>{member.name || member.email}</p>
                        <p style={{ fontSize: 12, color: "#94A3B8" }}>{memberStudents.length} students • {isAdmin ? "👑 Admin" : "📚 Tutor"}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ background: isAdmin ? "#EEF2FF" : "#ECFDF5", color: isAdmin ? "#4F46E5" : "#059669", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                        {isAdmin ? "Admin" : "Tutor"}
                      </span>
                      {role === "admin" && !isAdmin && (
                        <button onClick={() => removeMember(member.id)} disabled={removing === member.id}
                          style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          {removing === member.id ? "..." : "Remove"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* All Students — Admin only */}
        {role === "admin" && students.length > 0 && (
          <div style={{ background: "white", borderRadius: 16, padding: "24px 28px", border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", marginTop: 24 }}>
            <h2 style={{ fontWeight: 700, fontSize: 16, color: "#0F172A", marginBottom: 20 }}>👨‍🎓 All Students ({students.length})</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#F8FAFC" }}>
                    {["Student", "Subject", "Monthly Fee", "Fee Status", "Tutor"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", color: "#64748B", fontWeight: 700, textAlign: "left", fontSize: 12, borderBottom: "1px solid #E2E8F0" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => {
                    const isPaid = paidStudentIds.includes(s.id);
                    const tutor = members.find(m => m.user_id === s.tutor_id);
                    return (
                      <tr key={s.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "10px 14px", fontWeight: 600, color: "#0F172A" }}>{s.name}</td>
                        <td style={{ padding: "10px 14px", color: "#64748B" }}>{s.subject}</td>
                        <td style={{ padding: "10px 14px", fontWeight: 600 }}>PKR {s.monthly_fee.toLocaleString()}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ background: isPaid ? "#ECFDF5" : "#FEF2F2", color: isPaid ? "#059669" : "#DC2626", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                            {isPaid ? "✓ Paid" : "✗ Unpaid"}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px", color: "#64748B" }}>{tutor?.name || tutor?.email || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tutor view — my students only */}
        {role === "tutor" && (
          <div style={{ marginTop: 24 }}>
            <div style={{ background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: 14, padding: "20px 24px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 24 }}>ℹ️</span>
              <p style={{ color: "#4F46E5", fontSize: 14, fontWeight: 500 }}>
                Tum is academy ke tutor ho. Apne students <Link href="/dashboard/students" style={{ fontWeight: 700, color: "#4F46E5" }}>My Dashboard</Link> se manage karo.
              </p>
            </div>
            <div style={{ textAlign: "center" }}>
              <button onClick={async () => {
                if (!confirm("Academy leave karna chahte hain?")) return;
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (!user || !academy) return;
                await supabase.from("academy_members").delete().eq("user_id", user.id).eq("academy_id", academy.id);
                router.push("/academy");
              }} style={{ padding: "10px 24px", borderRadius: 8, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                🚪 Academy Leave Karo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
