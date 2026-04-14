"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name } }
    });
    if (error) { setError(error.message); setLoading(false); }
    else router.push("/dashboard");
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "white", borderRadius: 16, padding: "48px 40px", width: "100%", maxWidth: 420, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ background: "#2563EB", color: "white", borderRadius: 10, padding: "8px 16px", fontWeight: 700, fontSize: 20, display: "inline-block", marginBottom: 16 }}>TD</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111827" }}>Start Free Trial</h1>
          <p style={{ color: "#6B7280", marginTop: 6, fontSize: 14 }}>30 days free • No credit card needed</p>
        </div>

        <form onSubmit={handleSignup}>
          <div style={{ marginBottom: 18 }}>
            <label className="label">Your Name</label>
            <input className="input" type="text" placeholder="Ahmed Ali" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label className="label">Email Address</label>
            <input className="input" type="email" placeholder="tutor@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label className="label">Password</label>
            <input className="input" type="password" placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          </div>

          {error && <div style={{ background: "#FEE2E2", color: "#DC2626", padding: "10px 14px", borderRadius: 8, marginBottom: 18, fontSize: 13 }}>{error}</div>}

          <button className="btn-primary" type="submit" disabled={loading} style={{ width: "100%", padding: "13px", fontSize: 15 }}>
            {loading ? "Creating account..." : "Create Free Account →"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "#6B7280" }}>
          Already have an account? <Link href="/login" style={{ color: "#2563EB", fontWeight: 600, textDecoration: "none" }}>Login</Link>
        </p>
      </div>
    </div>
  );
}
