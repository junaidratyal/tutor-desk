"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); }
    else router.push("/dashboard");
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #EEF2FF 0%, #F8FAFF 100%)", display: "flex", flexDirection: "column" }}>
      
      {/* Top Nav */}
      <nav style={{ padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E2E8F0" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", color: "white", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13 }}>TD</div>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#0F172A" }}>Tutor Desk</span>
        </Link>
        <Link href="/" style={{ fontSize: 13, color: "#64748B", textDecoration: "none", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
          ← Back to Home
        </Link>
      </nav>

      {/* Form */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: "white", borderRadius: 20, padding: "48px 40px", width: "100%", maxWidth: 420, boxShadow: "0 8px 40px rgba(0,0,0,0.08)", border: "1px solid #E2E8F0" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", color: "white", borderRadius: 14, width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20, margin: "0 auto 16px" }}>TD</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A" }}>Welcome back!</h1>
            <p style={{ color: "#64748B", marginTop: 6, fontSize: 14 }}>Login to your Tutor Desk account</p>
          </div>

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
              <div style={{ background: "#FEF2F2", color: "#DC2626", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13, border: "1px solid #FECACA" }}>
                ❌ {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg, #4F46E5, #818CF8)", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", opacity: loading ? 0.8 : 1, boxShadow: "0 4px 14px rgba(79,70,229,0.3)" }}>
              {loading ? "Logging in..." : "Login →"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: 24 }}>
            <p style={{ fontSize: 14, color: "#64748B" }}>
              No account?{" "}
              <Link href="/signup" style={{ color: "#4F46E5", fontWeight: 600, textDecoration: "none" }}>Start free trial</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
