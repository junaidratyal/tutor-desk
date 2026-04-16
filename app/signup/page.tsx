"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setVerified(true);
      setLoading(false);
    }
  }

  // ── Email Verification Screen ──
  if (verified) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #EEF2FF 0%, #F8FAFF 100%)", display: "flex", flexDirection: "column" }}>
        <nav style={{ padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E2E8F0" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", color: "white", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13 }}>TD</div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#0F172A" }}>Tutor Desk</span>
          </Link>
        </nav>

        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "white", borderRadius: 20, padding: "48px 40px", width: "100%", maxWidth: 460, boxShadow: "0 8px 40px rgba(0,0,0,0.08)", border: "1px solid #E2E8F0", textAlign: "center" }}>
            
            {/* Email icon */}
            <div style={{ width: 72, height: 72, background: "linear-gradient(135deg, #EEF2FF, #C7D2FE)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 36 }}>
              📧
            </div>

            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", marginBottom: 12 }}>
              Check your email!
            </h1>
            <p style={{ color: "#64748B", fontSize: 15, lineHeight: 1.7, marginBottom: 8 }}>
              Humne <strong style={{ color: "#4F46E5" }}>{email}</strong> pe verification link bheja hai.
            </p>
            <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.7, marginBottom: 32 }}>
              Email open karo aur link pe click karo — phir login kar sakte ho!
            </p>

            {/* Steps */}
            <div style={{ background: "#F8FAFF", borderRadius: 12, padding: "20px 24px", marginBottom: 28, textAlign: "left" }}>
              {[
                { step: "1", text: "Apni email inbox kholein" },
                { step: "2", text: "Tutor Desk ka email dhundein" },
                { step: "3", text: '"Confirm your email" link pe click karein' },
                { step: "4", text: "Wapas aa kar login karein" },
              ].map(s => (
                <div key={s.step} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", color: "white", borderRadius: "50%", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{s.step}</div>
                  <p style={{ fontSize: 13, color: "#374151" }}>{s.text}</p>
                </div>
              ))}
            </div>

            <Link href="/login" style={{ display: "block", width: "100%", padding: "13px", background: "linear-gradient(135deg, #4F46E5, #818CF8)", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: "none", boxShadow: "0 4px 14px rgba(79,70,229,0.3)" }}>
              Login karein →
            </Link>

            <p style={{ marginTop: 16, fontSize: 12, color: "#94A3B8" }}>
              Email nahi aayi? Spam folder check karein ya{" "}
              <button onClick={() => setVerified(false)} style={{ color: "#4F46E5", background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
                dobara try karein
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Signup Form ──
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #EEF2FF 0%, #F8FAFF 100%)", display: "flex", flexDirection: "column" }}>

      {/* Top Nav */}
      <nav style={{ padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E2E8F0" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", color: "white", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13 }}>TD</div>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#0F172A" }}>Tutor Desk</span>
        </Link>
        <Link href="/" style={{ fontSize: 13, color: "#64748B", textDecoration: "none", fontWeight: 500 }}>
          ← Back to Home
        </Link>
      </nav>

      {/* Form */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: "white", borderRadius: 20, padding: "48px 40px", width: "100%", maxWidth: 420, boxShadow: "0 8px 40px rgba(0,0,0,0.08)", border: "1px solid #E2E8F0" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", color: "white", borderRadius: 14, width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20, margin: "0 auto 16px" }}>TD</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A" }}>Start Free Trial</h1>
            <p style={{ color: "#64748B", marginTop: 6, fontSize: 14 }}>30 days free • No credit card needed</p>
          </div>

          <form onSubmit={handleSignup}>
            <div style={{ marginBottom: 16 }}>
              <label className="label">Your Name</label>
              <input className="input" type="text" placeholder="Ahmed Ali" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="label">Email Address</label>
              <input className="input" type="email" placeholder="tutor@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>

            {error && (
              <div style={{ background: "#FEF2F2", color: "#DC2626", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13, border: "1px solid #FECACA" }}>
                ❌ {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg, #4F46E5, #818CF8)", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", opacity: loading ? 0.8 : 1, boxShadow: "0 4px 14px rgba(79,70,229,0.3)" }}>
              {loading ? "Creating account..." : "Create Free Account →"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: 24 }}>
            <p style={{ fontSize: 14, color: "#64748B" }}>
              Already have account?{" "}
              <Link href="/login" style={{ color: "#4F46E5", fontWeight: 600, textDecoration: "none" }}>Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
