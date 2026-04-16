"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";

async function joinAcademy(supabase: any, user: any, inviteCode: string) {
  const { data: academy } = await supabase
    .from("academies").select("*")
    .eq("invite_code", inviteCode.toLowerCase()).single();
  if (!academy) return false;

  const { data: existing } = await supabase
    .from("academy_members").select("id")
    .eq("academy_id", academy.id).eq("user_id", user.id).single();
  if (existing) return true;

  await supabase.from("academy_members").insert({
    academy_id: academy.id, user_id: user.id, role: "tutor",
    name: user.user_metadata?.name || "", email: user.email || ""
  });
  return true;
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("invite");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }

    if (inviteCode && data.user) {
      await joinAcademy(supabase, data.user, inviteCode);
      router.push("/academy/dashboard");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #EEF2FF 0%, #F8FAFF 100%)", display: "flex", flexDirection: "column", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <nav style={{ padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E2E8F0" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", color: "white", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13 }}>TD</div>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#0F172A" }}>Tutor Desk</span>
        </Link>
        <Link href="/" style={{ fontSize: 13, color: "#64748B", textDecoration: "none", fontWeight: 500 }}>← Back to Home</Link>
      </nav>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: "white", borderRadius: 20, padding: "48px 40px", width: "100%", maxWidth: 420, boxShadow: "0 8px 40px rgba(0,0,0,0.08)", border: "1px solid #E2E8F0" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", color: "white", borderRadius: 14, width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20, margin: "0 auto 16px" }}>TD</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A" }}>
              {inviteCode ? "Login karke Join Karo" : "Welcome back!"}
            </h1>
            <p style={{ color: "#64748B", marginTop: 6, fontSize: 14 }}>
              {inviteCode ? "Login karo — academy mein auto join ho jaoge" : "Login to your Tutor Desk account"}
            </p>
          </div>

          {inviteCode && (
            <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 10, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#059669", textAlign: "center", fontWeight: 600 }}>
              🏫 Invite Code: {inviteCode.toUpperCase()} — Login ke baad auto join!
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label className="label">Email Address</label>
              <input className="input" type="email" placeholder="tutor@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {error && (
              <div style={{ background: "#FEF2F2", color: "#DC2626", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13, border: "1px solid #FECACA" }}>❌ {error}</div>
            )}
            <button type="submit" disabled={loading} style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg, #4F46E5, #818CF8)", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", opacity: loading ? 0.8 : 1, boxShadow: "0 4px 14px rgba(79,70,229,0.3)" }}>
              {loading ? "Login ho raha hai..." : inviteCode ? "Login & Join Academy →" : "Login →"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "#64748B" }}>
            Account nahi hai?{" "}
            <Link href={inviteCode ? `/signup?invite=${inviteCode}` : "/signup"} style={{ color: "#4F46E5", fontWeight: 600, textDecoration: "none" }}>
              {inviteCode ? "Sign up karke join karo" : "Free account banao"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}><p style={{ color: '#94A3B8' }}>Loading...</p></div>}>
      <LoginPageContent />
    </Suspense>
  );
}
