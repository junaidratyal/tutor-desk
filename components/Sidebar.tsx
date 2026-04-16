"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useState, useEffect } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊", exact: true },
  { href: "/dashboard/students", label: "Students", icon: "👨‍🎓" },
  { href: "/dashboard/attendance", label: "Attendance", icon: "✅" },
  { href: "/dashboard/fees", label: "Fees", icon: "💰" },
  { href: "/dashboard/schedule", label: "Schedule", icon: "📅" },
  { href: "/dashboard/reminders", label: "Reminders", icon: "💬" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    async function getUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUserName(user?.user_metadata?.name || user?.email?.split("@")[0] || "Tutor");
    }
    getUser();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  function isActive(item: typeof navItems[0]) {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  const SidebarContent = () => (
    <>
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid #F1F5F9" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", color: "white", borderRadius: 10, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, boxShadow: "0 4px 12px rgba(79,70,229,0.35)" }}>TD</div>
          <div>
            <p style={{ fontWeight: 800, fontSize: 16, color: "#0F172A" }}>Tutor Desk</p>
            <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>Smart Tutor Manager</p>
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 20px", borderBottom: "1px solid #F1F5F9" }}>
        <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 13 }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: 13, color: "#0F172A" }}>{userName}</p>
            <p style={{ fontSize: 11, color: "#94A3B8" }}>Solo Tutor</p>
          </div>
        </div>
      </div>

      <nav style={{ padding: "12px", flex: 1 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase", padding: "8px 14px 6px" }}>Menu</p>
        {navItems.map(item => (
          <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
            className={`nav-item ${isActive(item) ? "active" : ""}`}>
            <span className="icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div style={{ padding: "16px", borderTop: "1px solid #F1F5F9" }}>
        <button onClick={handleLogout} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #E2E8F0", background: "white", color: "#64748B", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.2s" }}>
          🚪 Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      <div className="mobile-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", color: "white", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>TD</div>
          <span style={{ fontWeight: 700, fontSize: 15, color: "#0F172A" }}>Tutor Desk</span>
        </div>
        <button onClick={() => setOpen(!open)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer" }}>☰</button>
      </div>
      <div className={`overlay ${open ? "show" : ""}`} onClick={() => setOpen(false)} />
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <SidebarContent />
      </aside>
    </>
  );
}
