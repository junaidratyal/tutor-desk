
"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";

function StudentLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }

    // Check if this user is a student
    const { data: acc } = await supabase
      .from("student_accounts")
      .select("*, students(*)")
      .eq("user_id", data.user.id)
      .single();

    if (!acc) {
      // Maybe tutor trying to login here
      setError("No student account found. Are you a tutor? Login at the main portal.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    router.push("/student/dashboard");
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();

    // Check if student exists with this email
    const { data: student } = await supabase
      .from("students")
      .select("id, name")
      .eq("email", email.trim().toLowerCase())
      .single();

    if (!student) {
      setError("No student found with this email. Ask your tutor to add your email first!");
      setLoading(false);
      return;
    }

    // Create auth account
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: name || student.name, role: "student" } }
    });

    if (error) { setError(error.message); setLoading(false); return; }

    if (data.user) {
      // Link student account
      await supabase.from("student_accounts").upsert({
        student_id: student.id,
        user_id: data.user.id,
        joined_at: new Date().toISOString()
      }, { onConflict: "student_id" });
    }

    setVerifyMsg(email);
    setLoading(false);
  }

  if (verifyMsg) return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #ECFDF5 0%, #F8FAFF 100%)", display: "flex", flexDirection: "column", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <nav style={{ padding: "16px 32px", background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E2E8F0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ background: "linear-gradient(135deg, #10B981, #34D399)", color: "white", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13 }}>TD</div>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#0F172A" }}>Tutor Desk — Student Portal</span>
        </div>
      </nav>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: "white", borderRadius: 20, padding: "48px 40px", width: "100%", maxWidth: 460, boxShadow: "0 8px 40px rgba(0,0,0,0.08)", textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📧</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", marginBottom: 10 }}>Check Your Email!</h1>
          <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
            We sent a verification link to <strong style={{ color: "#10B981" }}>{verifyMsg}</strong>. Click the link to verify and then login.
          </p>
          <button onClick={() => { setVerifyMsg(""); setMode("login"); }}
            style={{ padding: "12px 28px", background: "linear-gradient(135deg, #10B981, #34D399)", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Go to Login →
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #ECFDF5 0%, #F8FAFF 100%)", display: "flex", flexDirection: "column", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <nav style={{ padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E2E8F0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ background: "linear-gradient(135deg, #10B981, #34D399)", color: "white", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13 }}>TD</div>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#0F172A" }}>Tutor Desk — Student Portal</span>
        </div>
        <Link href="/" style={{ fontSize: 13, color: "#64748B", textDecoration: "none" }}>← Main Site</Link>
      </nav>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: "white", borderRadius: 20, padding: "48px 40px", width: "100%", maxWidth: 420, boxShadow: "0 8px 40px rgba(0,0,0,0.08)", border: "1px solid #E2E8F0" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ background: "linear-gradient(135deg, #10B981, #34D399)", color: "white", borderRadius: 14, width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 22, margin: "0 auto 14px" }}>🎓</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A" }}>Student Portal</h1>
            <p style={{ color: "#64748B", marginTop: 6, fontSize: 14 }}>Access your assignments, attendance & more</p>
          </div>

          {/* Toggle */}
          <div style={{ display: "flex", gap: 4, background: "#F1F5F9", borderRadius: 10, padding: 4, marginBottom: 24 }}>
            {(["login", "signup"] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", background: mode === m ? "white" : "transparent", color: mode === m ? "#10B981" : "#64748B", boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.1)" : "none", transition: "all 0.2s" }}>
                {m === "login" ? "Login" : "Create Account"}
              </button>
            ))}
          </div>

          <form onSubmit={mode === "login" ? handleLogin : handleSignup}>
            {mode === "signup" && (
              <div style={{ marginBottom: 16 }}>
                <label className="label">Your Name</label>
                <input className="input" type="text" placeholder="Ali Hassan" value={name} onChange={e => setName(e.target.value)} />
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <label className="label">Email Address</label>
              <input className="input" type="email" placeholder="student@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label className="label">Password</label>
              <input className="input" type="password" placeholder={mode === "signup" ? "Min 6 characters" : "••••••••"} value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>

            {error && <div style={{ background: "#FEF2F2", color: "#DC2626", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13, border: "1px solid #FECACA" }}>❌ {error}</div>}

            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: "13px", background: loading ? "#94A3B8" : "linear-gradient(135deg, #10B981, #34D399)", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: "0 4px 14px rgba(16,185,129,0.3)" }}>
              {loading ? "Please wait..." : mode === "login" ? "Login →" : "Create Account →"}
            </button>
          </form>

          {mode === "signup" && (
            <div style={{ marginTop: 16, padding: "12px 16px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, fontSize: 12, color: "#92400E" }}>
              💡 Your email must be registered by your tutor first. Ask your tutor to add your email in the Students section.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StudentLoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><p>Loading...</p></div>}>
      <StudentLoginContent />
    </Suspense>
  );
}
