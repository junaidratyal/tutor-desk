"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { getUserAcademy } from "@/lib/academy";

export default function AcademyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const result = await getUserAcademy();
      if (result) {
        // Already in academy — redirect to academy dashboard
        router.push("/academy/dashboard");
        return;
      }
      setLoading(false);
    }
    check();
  }, []);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFF", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <p style={{ color: "#94A3B8" }}>Loading...</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #EEF2FF 0%, #F8FAFF 100%)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <nav style={{ padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E2E8F0" }}>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", color: "white", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13 }}>TD</div>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#0F172A" }}>Tutor Desk</span>
        </Link>
        <Link href="/dashboard" style={{ fontSize: 13, color: "#64748B", textDecoration: "none", fontWeight: 500 }}>← Back to Dashboard</Link>
      </nav>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 20px" }}>
        <div style={{ maxWidth: 560, width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🏫</div>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: "#0F172A", marginBottom: 10 }}>Academy Plan</h1>
            <p style={{ color: "#64748B", fontSize: 15, lineHeight: 1.7 }}>
              Apni academy banao ya kisi academy mein join karo!
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <Link href="/academy/create" style={{ textDecoration: "none" }}>
              <div style={{ background: "white", borderRadius: 20, padding: "32px 24px", border: "2px solid #E2E8F0", textAlign: "center", transition: "all 0.2s", boxShadow: "0 4px 16px rgba(0,0,0,0.06)", cursor: "pointer" }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🏗️</div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>Academy Banao</h2>
                <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
                  Nai academy create karo aur tutors ko invite karo
                </p>
                <div style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", color: "white", padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700 }}>
                  Create Academy →
                </div>
              </div>
            </Link>

            <Link href="/academy/join" style={{ textDecoration: "none" }}>
              <div style={{ background: "white", borderRadius: 20, padding: "32px 24px", border: "2px solid #E2E8F0", textAlign: "center", transition: "all 0.2s", boxShadow: "0 4px 16px rgba(0,0,0,0.06)", cursor: "pointer" }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🤝</div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>Academy Join Karo</h2>
                <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
                  Invite code se apni academy mein join karo
                </p>
                <div style={{ background: "linear-gradient(135deg, #10B981, #34D399)", color: "white", padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700 }}>
                  Join Academy →
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
