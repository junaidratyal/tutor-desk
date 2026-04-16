import Link from "next/link";

export default function Home() {
  return (
    <main style={{ minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#FAFBFF" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .hero-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(79,70,229,0.45) !important; }
        .feature-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.1) !important; }
        @media (max-width: 768px) {
          .hero-title { font-size: 36px !important; }
          .hero-btns { flex-direction: column !important; align-items: stretch !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
          .nav-links { display: none !important; }
        }
      `}</style>

      {/* Nav */}
      <nav style={{ padding: "18px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E2E8F0", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", color: "white", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, boxShadow: "0 4px 12px rgba(79,70,229,0.3)" }}>TD</div>
          <span style={{ fontWeight: 800, fontSize: 18, color: "#0F172A" }}>Tutor Desk</span>
        </div>
        <div className="nav-links" style={{ display: "flex", gap: 32 }}>
          {["Features", "Pricing", "About"].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} style={{ color: "#64748B", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>{l}</a>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/login" style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid #E2E8F0", color: "#374151", fontWeight: 500, textDecoration: "none", fontSize: 14, background: "white" }}>Login</Link>
          <Link href="/signup" style={{ padding: "9px 20px", borderRadius: 8, background: "linear-gradient(135deg, #4F46E5, #818CF8)", color: "white", fontWeight: 600, textDecoration: "none", fontSize: 14, boxShadow: "0 4px 12px rgba(79,70,229,0.3)" }}>Free Trial</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: "center", padding: "90px 20px 70px", background: "linear-gradient(180deg, #EEF2FF 0%, #FAFBFF 100%)" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "white", border: "1px solid #C7D2FE", borderRadius: 20, padding: "6px 16px", fontSize: 13, fontWeight: 600, color: "#4F46E5", marginBottom: 28, boxShadow: "0 2px 8px rgba(79,70,229,0.12)" }}>
          🎉 30-day free trial — No credit card needed
        </div>
        <h1 className="hero-title" style={{ fontSize: 58, fontWeight: 800, color: "#0F172A", lineHeight: 1.1, marginBottom: 22, letterSpacing: "-0.03em" }}>
          Manage Your Students<br />
          <span style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Like a Pro</span>
        </h1>
        <p style={{ fontSize: 18, color: "#64748B", maxWidth: 520, margin: "0 auto 40px", lineHeight: 1.7 }}>
          Pakistan ka #1 tutor management tool. Students, fees, schedule — sab ek jagah. Built for Pakistani tutors.
        </p>
        <div className="hero-btns" style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/signup" className="hero-btn" style={{ padding: "15px 36px", background: "linear-gradient(135deg, #4F46E5, #818CF8)", color: "white", borderRadius: 12, fontWeight: 700, fontSize: 16, textDecoration: "none", boxShadow: "0 4px 16px rgba(79,70,229,0.35)", transition: "all 0.2s", display: "inline-block" }}>
            Start Free Trial →
          </Link>
          <Link href="/login" style={{ padding: "15px 36px", background: "white", color: "#374151", borderRadius: 12, fontWeight: 600, fontSize: 16, textDecoration: "none", border: "1px solid #E2E8F0", display: "inline-block" }}>
            Login
          </Link>
        </div>
        <p style={{ marginTop: 18, color: "#94A3B8", fontSize: 13 }}>Only $4/month (~PKR 1,100) after trial • Cancel anytime</p>

        {/* Mock dashboard preview */}
        <div style={{ marginTop: 60, maxWidth: 800, margin: "60px auto 0", background: "white", borderRadius: 20, border: "1px solid #E2E8F0", boxShadow: "0 20px 60px rgba(0,0,0,0.1)", overflow: "hidden" }}>
          <div style={{ background: "#F8FAFC", padding: "12px 16px", borderBottom: "1px solid #E2E8F0", display: "flex", gap: 6 }}>
            {["#EF4444","#F59E0B","#10B981"].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
            <span style={{ fontSize: 12, color: "#94A3B8", marginLeft: 8 }}>tutor-desk.vercel.app/dashboard</span>
          </div>
          <div style={{ padding: "24px", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            {[["👨‍🎓","12","Students","#EEF2FF","#4F46E5"],["✅","8","Paid","#ECFDF5","#059669"],["⏳","4","Pending","#FFFBEB","#D97706"],["📅","3","Today","#FDF2F8","#DB2777"]].map(([icon,num,label,bg,color]) => (
              <div key={label as string} style={{ background: bg as string, borderRadius: 12, padding: "16px", textAlign: "center" }}>
                <div style={{ fontSize: 22 }}>{icon}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: color as string, margin: "6px 0 2px" }}>{num}</div>
                <div style={{ fontSize: 11, color: "#64748B" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: "80px 20px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#4F46E5", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Features</p>
          <h2 style={{ fontSize: 38, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>Everything you need</h2>
          <p style={{ color: "#64748B", marginTop: 12, fontSize: 16 }}>Sab kuch ek jagah — koi extra app nahi</p>
        </div>
        <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22 }}>
          {[
            { icon: "👨‍🎓", title: "Student Management", desc: "Har student ki complete profile — naam, parent contact, subject, fees. Sab organized." },
            { icon: "💰", title: "Fee Tracking", desc: "Kaun ne diya, kaun ne nahi — ek nazar mein. Monthly fee status bilkul clear." },
            { icon: "📅", title: "Schedule", desc: "Weekly timetable manage karo. Double booking ka koi chance nahi." },
            { icon: "💬", title: "WhatsApp Reminders", desc: "Ek click mein parents ko fee reminder bhejo — Urdu mein pre-written messages." },
            { icon: "📊", title: "Dashboard", desc: "Aaj ke sessions, pending fees, total students — sab ek dashboard pe." },
            { icon: "📱", title: "Mobile Friendly", desc: "Phone pe bhi perfectly kaam karta hai. Kahi bhi access karo." },
          ].map((f, i) => (
            <div key={i} className="feature-card" style={{ background: "white", borderRadius: 16, padding: "28px", border: "1px solid #E2E8F0", transition: "all 0.25s", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
              <h3 style={{ fontWeight: 700, fontSize: 16, color: "#0F172A", marginBottom: 10 }}>{f.title}</h3>
              <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: "80px 20px", background: "#F8FAFC" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#4F46E5", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Pricing</p>
          <h2 style={{ fontSize: 38, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>Simple pricing</h2>
          <p style={{ color: "#64748B", marginTop: 12, fontSize: 16 }}>Ek cup chai se bhi sasta ☕</p>
        </div>
        <div className="pricing-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, maxWidth: 700, margin: "0 auto" }}>
          <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: 20, padding: "36px 32px", textAlign: "center" }}>
            <p style={{ fontWeight: 700, color: "#94A3B8", fontSize: 13, letterSpacing: "0.06em", marginBottom: 12 }}>FREE TRIAL</p>
            <p style={{ fontSize: 48, fontWeight: 800, color: "#0F172A", lineHeight: 1 }}>$0</p>
            <p style={{ color: "#94A3B8", fontSize: 13, margin: "8px 0 28px" }}>30 days • No card needed</p>
            {["5 students", "All features", "WhatsApp reminders", "Fee tracking"].map(f => (
              <p key={f} style={{ color: "#374151", fontSize: 14, padding: "7px 0", borderBottom: "1px solid #F1F5F9", textAlign: "left" }}>✓ {f}</p>
            ))}
            <Link href="/signup" style={{ display: "block", marginTop: 24, padding: "12px", background: "#F1F5F9", color: "#374151", borderRadius: 10, fontWeight: 600, textDecoration: "none", fontSize: 14 }}>Start Free</Link>
          </div>
          <div style={{ background: "linear-gradient(135deg, #4F46E5, #6366F1)", border: "none", borderRadius: 20, padding: "36px 32px", textAlign: "center", boxShadow: "0 12px 40px rgba(79,70,229,0.3)", position: "relative" }}>
            <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "#F59E0B", color: "white", padding: "4px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>MOST POPULAR</div>
            <p style={{ fontWeight: 700, color: "rgba(255,255,255,0.7)", fontSize: 13, letterSpacing: "0.06em", marginBottom: 12 }}>SOLO TUTOR</p>
            <p style={{ fontSize: 48, fontWeight: 800, color: "white", lineHeight: 1 }}>$4<span style={{ fontSize: 16, fontWeight: 500, opacity: 0.7 }}>/mo</span></p>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, margin: "8px 0 28px" }}>~PKR 1,100/month</p>
            {["Unlimited students", "All features", "WhatsApp reminders", "Fee tracking", "Monthly reports"].map(f => (
              <p key={f} style={{ color: "rgba(255,255,255,0.9)", fontSize: 14, padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.1)", textAlign: "left" }}>✓ {f}</p>
            ))}
            <Link href="/signup" style={{ display: "block", marginTop: 24, padding: "12px", background: "white", color: "#4F46E5", borderRadius: 10, fontWeight: 700, textDecoration: "none", fontSize: 14 }}>Get Started →</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ textAlign: "center", padding: "40px 20px", borderTop: "1px solid #E2E8F0", background: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 10 }}>
          <div style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", color: "white", borderRadius: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12 }}>TD</div>
          <span style={{ fontWeight: 700, color: "#0F172A" }}>Tutor Desk</span>
        </div>
        <p style={{ color: "#94A3B8", fontSize: 13 }}>Built with ❤️ for tutors in Pakistan 🇵🇰</p>
      </footer>
    </main>
  );
}
