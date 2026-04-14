import Link from "next/link";

export default function Home() {
  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)" }}>
      {/* Nav */}
      <nav style={{ padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: "#2563EB", color: "white", borderRadius: 8, padding: "6px 12px", fontWeight: 700, fontSize: 18 }}>TD</div>
          <span style={{ fontWeight: 700, fontSize: 20, color: "#1E40AF" }}>Tutor Desk</span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/login" style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid #D1D5DB", color: "#374151", fontWeight: 500, textDecoration: "none", fontSize: 14 }}>Login</Link>
          <Link href="/signup" style={{ padding: "9px 20px", borderRadius: 8, background: "#2563EB", color: "white", fontWeight: 600, textDecoration: "none", fontSize: 14 }}>Free Trial</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: "center", padding: "100px 20px 60px" }}>
        <div style={{ display: "inline-block", background: "#DBEAFE", color: "#1D4ED8", padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 24 }}>
          🎉 30-day free trial — No credit card needed
        </div>
        <h1 style={{ fontSize: "clamp(36px, 5vw, 64px)", fontWeight: 800, color: "#111827", lineHeight: 1.15, marginBottom: 20 }}>
          Stop Managing Students<br />
          <span style={{ color: "#2563EB" }}>with Paper & WhatsApp</span>
        </h1>
        <p style={{ fontSize: 18, color: "#6B7280", maxWidth: 560, margin: "0 auto 40px", lineHeight: 1.7 }}>
          Tutor Desk helps you manage students, collect fees, track schedules — all in one simple dashboard. Built for Pakistani tutors.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/signup" style={{ padding: "14px 32px", background: "#2563EB", color: "white", borderRadius: 10, fontWeight: 700, fontSize: 16, textDecoration: "none", boxShadow: "0 4px 14px rgba(37,99,235,0.4)" }}>
            Start Free Trial →
          </Link>
          <Link href="/login" style={{ padding: "14px 32px", background: "white", color: "#374151", borderRadius: 10, fontWeight: 600, fontSize: 16, textDecoration: "none", border: "1px solid #E5E7EB" }}>
            Login to Account
          </Link>
        </div>
        <p style={{ marginTop: 16, color: "#9CA3AF", fontSize: 13 }}>Only $4/month after trial • Cancel anytime</p>
      </section>

      {/* Features */}
      <section style={{ padding: "60px 20px", maxWidth: 1000, margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", fontSize: 32, fontWeight: 800, color: "#111827", marginBottom: 50 }}>Everything you need to run your tutoring</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {[
            { icon: "👨‍🎓", title: "Student Management", desc: "Keep all student info, parent contacts, and subjects in one place. Never lose a student's details again." },
            { icon: "💰", title: "Fee Tracking", desc: "See exactly who has paid and who hasn't. Send fee reminders via WhatsApp in one click." },
            { icon: "📅", title: "Schedule Calendar", desc: "Manage your weekly timetable easily. Never double-book a session again." },
            { icon: "📊", title: "Dashboard Overview", desc: "See today's sessions, pending fees, and total earnings at a glance every morning." },
            { icon: "💬", title: "WhatsApp Reminders", desc: "Pre-written reminder templates for fees and sessions. Just tap and send to parents." },
            { icon: "📱", title: "Works on Mobile", desc: "Use it on your phone, tablet, or laptop. No app download needed." },
          ].map((f, i) => (
            <div key={i} style={{ background: "white", borderRadius: 14, padding: "28px 24px", border: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: 36, marginBottom: 14 }}>{f.icon}</div>
              <h3 style={{ fontWeight: 700, fontSize: 17, color: "#111827", marginBottom: 10 }}>{f.title}</h3>
              <p style={{ color: "#6B7280", fontSize: 14, lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: "60px 20px", background: "white" }}>
        <h2 style={{ textAlign: "center", fontSize: 32, fontWeight: 800, color: "#111827", marginBottom: 12 }}>Simple, Affordable Pricing</h2>
        <p style={{ textAlign: "center", color: "#6B7280", marginBottom: 50, fontSize: 16 }}>Less than a cup of chai per day ☕</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
          <div style={{ border: "1px solid #E5E7EB", borderRadius: 16, padding: "36px 32px", width: 280, textAlign: "center" }}>
            <p style={{ fontWeight: 600, color: "#6B7280", marginBottom: 8, fontSize: 14 }}>FREE TRIAL</p>
            <p style={{ fontSize: 42, fontWeight: 800, color: "#111827" }}>$0</p>
            <p style={{ color: "#6B7280", fontSize: 13, marginBottom: 28 }}>30 days • No card needed</p>
            {["Up to 5 students", "All features included", "WhatsApp reminders", "Fee tracking"].map(f => (
              <p key={f} style={{ color: "#374151", fontSize: 14, padding: "6px 0", borderBottom: "1px solid #F3F4F6" }}>✓ {f}</p>
            ))}
            <Link href="/signup" style={{ display: "block", marginTop: 28, padding: "12px", background: "#F3F4F6", color: "#374151", borderRadius: 8, fontWeight: 600, textDecoration: "none" }}>Start Free</Link>
          </div>
          <div style={{ border: "2px solid #2563EB", borderRadius: 16, padding: "36px 32px", width: 280, textAlign: "center", position: "relative" }}>
            <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "#2563EB", color: "white", padding: "4px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>MOST POPULAR</div>
            <p style={{ fontWeight: 600, color: "#2563EB", marginBottom: 8, fontSize: 14 }}>SOLO TUTOR</p>
            <p style={{ fontSize: 42, fontWeight: 800, color: "#111827" }}>$4<span style={{ fontSize: 16, fontWeight: 500, color: "#6B7280" }}>/mo</span></p>
            <p style={{ color: "#6B7280", fontSize: 13, marginBottom: 28 }}>~PKR 1,100/month</p>
            {["Unlimited students", "All features included", "WhatsApp reminders", "Fee tracking", "Monthly reports"].map(f => (
              <p key={f} style={{ color: "#374151", fontSize: 14, padding: "6px 0", borderBottom: "1px solid #F3F4F6" }}>✓ {f}</p>
            ))}
            <Link href="/signup" style={{ display: "block", marginTop: 28, padding: "12px", background: "#2563EB", color: "white", borderRadius: 8, fontWeight: 600, textDecoration: "none" }}>Get Started</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ textAlign: "center", padding: "40px 20px", color: "#9CA3AF", fontSize: 13 }}>
        <p style={{ fontWeight: 700, color: "#374151", marginBottom: 8, fontSize: 16 }}>Tutor Desk</p>
        <p>Built for tutors in Pakistan 🇵🇰 • © 2024 Tutor Desk</p>
      </footer>
    </main>
  );
}
