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
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "white", borderRadius: 16, padding: "48px 40px", width: "100%", maxWidth: 420, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ background: "#2563EB", color: "white", borderRadius: 10, padding: "8px 16px", fontWeight: 700, fontSize: 20, display: "inline-block", marginBottom: 16 }}>TD</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111827" }}>Welcome back!</h1>
          <p style={{ color: "#6B7280", marginTop: 6, fontSize: 14 }}>Login to your Tutor Desk account</p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 18 }}>
            <label className="label">Email Address</label>
            <input className="input" type="email" placeholder="tutor@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label className="label">Password</label>
            <input className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          {error && <div style={{ background: "#FEE2E2", color: "#DC2626", padding: "10px 14px", borderRadius: 8, marginBottom: 18, fontSize: 13 }}>{error}</div>}

          <button className="btn-primary" type="submit" disabled={loading} style={{ width: "100%", padding: "13px", fontSize: 15 }}>
            {loading ? "Logging in..." : "Login →"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "#6B7280" }}>
          No account? <Link href="/signup" style={{ color: "#2563EB", fontWeight: 600, textDecoration: "none" }}>Start free trial</Link>
        </p>
      </div>
    </div>
  );
}
