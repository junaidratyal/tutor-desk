
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export default function JoinAcademyPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    // Find academy with this invite code
    const { data: academy, error: findErr } = await supabase
      .from("academies")
      .select("*")
      .eq("invite_code", code.trim().toLowerCase())
      .single();

    if (findErr || !academy) {
      setError("Yeh invite code galat hai. Dobara check karein!");
      setLoading(false);
      return;
    }

    // Check if already member
    const { data: existing } = await supabase
      .from("academy_members")
      .select("id")
      .eq("academy_id", academy.id)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      router.push("/academy/dashboard");
      return;
    }

    // Join academy
    const { error: joinErr } = await supabase.from("academy_members").insert({
      academy_id: academy.id,
      user_id: user.id,
      role: "tutor",
      name: user.user_metadata?.name || "",
      email: user.email || ""
    });

    if (joinErr) {
      setError(joinErr.message);
      setLoading(false);
      return;
    }

    router.push("/academy/dashboard");
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #ECFDF5 0%, #F8FAFF 100%)", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", flexDirection: "column" }}>
      <nav style={{ padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E2E8F0" }}>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", color: "white", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13 }}>TD</div>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#0F172A" }}>Tutor Desk</span>
        </Link>
        <Link href="/academy" style={{ fontSize: 13, color: "#64748B", textDecoration: "none", fontWeight: 500 }}>← Back</Link>
      </nav>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: "white", borderRadius: 20, padding: "48px 40px", width: "100%", maxWidth: 440, boxShadow: "0 8px 40px rgba(0,0,0,0.08)", border: "1px solid #E2E8F0" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🤝</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A" }}>Academy Join Karo</h1>
            <p style={{ color: "#64748B", marginTop: 6, fontSize: 14 }}>Admin ne jo 8-digit code diya hai woh daalo</p>
          </div>

          <form onSubmit={handleJoin}>
            <div style={{ marginBottom: 24 }}>
              <label className="label">Invite Code</label>
              <input className="input" type="text" placeholder="e.g. ab12cd34" value={code}
                onChange={e => setCode(e.target.value)} required maxLength={8}
                style={{ fontSize: 20, letterSpacing: "0.15em", textAlign: "center", fontWeight: 700, textTransform: "lowercase" }} />
              <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 6, textAlign: "center" }}>Admin se yeh code maangein</p>
            </div>

            {error && (
              <div style={{ background: "#FEF2F2", color: "#DC2626", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13, border: "1px solid #FECACA" }}>❌ {error}</div>
            )}

            <button type="submit" disabled={loading || code.length < 6} style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg, #10B981, #34D399)", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", opacity: loading || code.length < 6 ? 0.7 : 1, boxShadow: "0 4px 14px rgba(16,185,129,0.3)" }}>
              {loading ? "Join ho raha hai..." : "Academy Join Karo →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
