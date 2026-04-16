"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [codeConfirmed, setCodeConfirmed] = useState(false);
  const [academyName, setAcademyName] = useState("");

  useEffect(() => {
    const urlCode = searchParams.get("code");
    if (urlCode) setCode(urlCode.toUpperCase());
    async function checkAuth() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setCheckingAuth(false);
    }
    checkAuth();
  }, []);

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data: academy } = await supabase
      .from("academies").select("*")
      .eq("invite_code", code.trim().toLowerCase()).single();

    if (!academy) {
      setError("Yeh invite code galat hai. Dobara check karein!");
      setLoading(false);
      return;
    }

    setAcademyName(academy.name);

    if (user) {
      const { data: existing } = await supabase
        .from("academy_members").select("id")
        .eq("academy_id", academy.id).eq("user_id", user.id).single();

      if (!existing) {
        await supabase.from("academy_members").insert({
          academy_id: academy.id, user_id: user.id, role: "tutor",
          name: user.user_metadata?.name || "", email: user.email || ""
        });
      }
      router.push("/academy/dashboard");
      return;
    }

    setCodeConfirmed(true);
    setLoading(false);
  }

  if (checkingAuth) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFF" }}>
      <p style={{ color: "#94A3B8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Loading...</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #ECFDF5 0%, #F8FAFF 100%)", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", flexDirection: "column" }}>
      <nav style={{ padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E2E8F0" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", color: "white", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13 }}>TD</div>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#0F172A" }}>Tutor Desk</span>
        </Link>
      </nav>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: "white", borderRadius: 20, padding: "48px 40px", width: "100%", maxWidth: 440, boxShadow: "0 8px 40px rgba(0,0,0,0.08)", border: "1px solid #E2E8F0" }}>

          {!codeConfirmed ? (
            <>
              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🤝</div>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A" }}>Academy Join Karo</h1>
                <p style={{ color: "#64748B", marginTop: 6, fontSize: 14 }}>Admin ne jo invite code diya hai woh daalo</p>
              </div>

              <form onSubmit={handleVerifyCode}>
                <div style={{ marginBottom: 24 }}>
                  <label className="label">Invite Code</label>
                  <input className="input" type="text" placeholder="e.g. AB12CD34"
                    value={code} onChange={e => setCode(e.target.value.toUpperCase())}
                    required maxLength={8}
                    style={{ fontSize: 24, letterSpacing: "0.2em", textAlign: "center", fontWeight: 800 }} />
                  <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 6, textAlign: "center" }}>Admin se yeh code maangein</p>
                </div>

                {error && <div style={{ background: "#FEF2F2", color: "#DC2626", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13, border: "1px solid #FECACA" }}>❌ {error}</div>}

                <button type="submit" disabled={loading || code.length < 6}
                  style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg, #10B981, #34D399)", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: loading || code.length < 6 ? "not-allowed" : "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", opacity: loading || code.length < 6 ? 0.7 : 1, boxShadow: "0 4px 14px rgba(16,185,129,0.3)" }}>
                  {loading ? "Check ho raha hai..." : "Code Verify Karo →"}
                </button>
              </form>
            </>
          ) : (
            <>
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🏫</div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>Academy Mili!</h1>
                <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 12, padding: "12px 20px", margin: "16px 0" }}>
                  <p style={{ color: "#059669", fontWeight: 700, fontSize: 16 }}>✅ {academyName}</p>
                  <p style={{ color: "#059669", fontSize: 13, marginTop: 4 }}>Code: {code}</p>
                </div>
                <p style={{ color: "#64748B", fontSize: 14 }}>Ab login ya signup karo — automatically join ho jaoge!</p>
              </div>

              <div style={{ display: "grid", gap: 14 }}>
                <Link href={`/login?invite=${code.toLowerCase()}`} style={{ textDecoration: "none" }}>
                  <div style={{ background: "white", border: "2px solid #C7D2FE", borderRadius: 14, padding: "20px 24px", textAlign: "center" }}>
                    <p style={{ fontSize: 28, marginBottom: 8 }}>👋</p>
                    <p style={{ fontWeight: 800, fontSize: 16, color: "#4F46E5", marginBottom: 4 }}>Pehle se Account Hai</p>
                    <p style={{ color: "#64748B", fontSize: 13, marginBottom: 14 }}>Login karo — academy mein auto join</p>
                    <div style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", color: "white", padding: "10px", borderRadius: 8, fontSize: 13, fontWeight: 700 }}>Login Karo →</div>
                  </div>
                </Link>

                <Link href={`/signup?invite=${code.toLowerCase()}`} style={{ textDecoration: "none" }}>
                  <div style={{ background: "white", border: "2px solid #A7F3D0", borderRadius: 14, padding: "20px 24px", textAlign: "center" }}>
                    <p style={{ fontSize: 28, marginBottom: 8 }}>🆕</p>
                    <p style={{ fontWeight: 800, fontSize: 16, color: "#059669", marginBottom: 4 }}>Naya Account Banao</p>
                    <p style={{ color: "#64748B", fontSize: 13, marginBottom: 14 }}>Sign up karo — academy mein auto join</p>
                    <div style={{ background: "linear-gradient(135deg, #10B981, #34D399)", color: "white", padding: "10px", borderRadius: 8, fontSize: 13, fontWeight: 700 }}>Sign Up Free →</div>
                  </div>
                </Link>
              </div>

              <button onClick={() => { setCodeConfirmed(false); setError(""); }} style={{ width: "100%", marginTop: 16, padding: "10px", background: "none", border: "none", color: "#94A3B8", fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                ← Dobara code enter karo
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function JoinAcademyPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFF" }}>
        <p style={{ color: "#94A3B8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Loading...</p>
      </div>
    }>
      <JoinContent />
    </Suspense>
  );
}
