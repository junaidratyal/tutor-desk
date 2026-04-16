
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export default function CreateAcademyPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data, error } = await supabase
      .from("academies")
      .insert({ name, owner_id: user.id })
      .select().single();

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Add owner as admin member
    await supabase.from("academy_members").insert({
      academy_id: data.id,
      user_id: user.id,
      role: "admin",
      name: user.user_metadata?.name || "",
      email: user.email || ""
    });

    router.push("/academy/dashboard");
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #EEF2FF 0%, #F8FAFF 100%)", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", flexDirection: "column" }}>
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
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏗️</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A" }}>Academy Banao</h1>
            <p style={{ color: "#64748B", marginTop: 6, fontSize: 14 }}>Apni academy ka naam rakhو aur tutors ko invite karo</p>
          </div>

          <form onSubmit={handleCreate}>
            <div style={{ marginBottom: 24 }}>
              <label className="label">Academy Ka Naam</label>
              <input className="input" type="text" placeholder="e.g. Ali Academy, Star Tutors..." value={name} onChange={e => setName(e.target.value)} required />
            </div>

            {error && (
              <div style={{ background: "#FEF2F2", color: "#DC2626", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13, border: "1px solid #FECACA" }}>❌ {error}</div>
            )}

            <button type="submit" disabled={loading} style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg, #4F46E5, #818CF8)", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", opacity: loading ? 0.8 : 1, boxShadow: "0 4px 14px rgba(79,70,229,0.3)" }}>
              {loading ? "Ban raha hai..." : "Academy Banao →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
