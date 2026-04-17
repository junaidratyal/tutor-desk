"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { toggleTheme, initTheme, getTheme } from "@/lib/theme";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊", exact: true },
  { href: "/dashboard/students", label: "Students", icon: "👨‍🎓" },
  { href: "/dashboard/attendance", label: "Attendance", icon: "✅" },
  { href: "/dashboard/fees", label: "Fees", icon: "💰" },
  { href: "/dashboard/schedule", label: "Schedule", icon: "📅" },
  { href: "/dashboard/reminders", label: "Reminders", icon: "💬" },
  { href: "/dashboard/reports", label: "Reports", icon: "📄" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);

  useEffect(() => {
    initTheme();
    setIsDark(getTheme() === "dark");

    async function getUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUserName(user?.user_metadata?.name || user?.email?.split("@")[0] || "Tutor");
    }
    getUser();

    // Check notification permission
    if ("Notification" in window) {
      setNotifEnabled(Notification.permission === "granted");
    }
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  function handleThemeToggle() {
    const next = toggleTheme();
    setIsDark(next === "dark");
  }

  async function handleNotificationToggle() {
    if (!("Notification" in window)) {
      alert("Yeh browser notifications support nahi karta!");
      return;
    }
    if (Notification.permission === "granted") {
      setNotifEnabled(false);
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setNotifEnabled(true);
      new Notification("Tutor Desk 🎉", {
        body: "Notifications enable ho gayi hain! Ab fee aur session reminders milenge.",
        icon: "/icon-192.png"
      });
    }
  }

  function isActive(item: typeof navItems[0]) {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", color: "white", borderRadius: 10, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, boxShadow: "0 4px 12px rgba(79,70,229,0.35)" }}>TD</div>
          <div>
            <p style={{ fontWeight: 800, fontSize: 16, color: "var(--text-primary)" }}>Tutor Desk</p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>Smart Tutor Manager</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ background: "var(--bg-hover)", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 13 }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{userName}</p>
            <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Solo Tutor</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: "12px", flex: 1, overflowY: "auto" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", padding: "8px 14px 6px" }}>Menu</p>
        {navItems.map(item => (
          <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
            className={`nav-item ${isActive(item) ? "active" : ""}`}>
            <span className="icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}

        {/* Academy */}
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", padding: "16px 14px 6px" }}>Academy</p>
        <Link href="/academy/dashboard" onClick={() => setOpen(false)}
          className={`nav-item ${pathname.startsWith("/academy") ? "active" : ""}`}>
          <span className="icon">🏫</span>
          Academy
        </Link>

        {/* Settings */}
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", padding: "16px 14px 6px" }}>Settings</p>

        {/* Dark Mode Toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{isDark ? "☀️" : "🌙"}</span>
            <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)" }}>{isDark ? "Light Mode" : "Dark Mode"}</span>
          </div>
          <button onClick={handleThemeToggle} style={{
            width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
            background: isDark ? "#4F46E5" : "#E2E8F0",
            position: "relative", transition: "background 0.3s", flexShrink: 0
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: "50%", background: "white",
              position: "absolute", top: 3, transition: "left 0.3s",
              left: isDark ? "23px" : "3px", boxShadow: "0 1px 3px rgba(0,0,0,0.3)"
            }} />
          </button>
        </div>

        {/* Notifications Toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🔔</span>
            <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)" }}>Notifications</span>
          </div>
          <button onClick={handleNotificationToggle} style={{
            width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
            background: notifEnabled ? "#4F46E5" : "#E2E8F0",
            position: "relative", transition: "background 0.3s", flexShrink: 0
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: "50%", background: "white",
              position: "absolute", top: 3, transition: "left 0.3s",
              left: notifEnabled ? "23px" : "3px", boxShadow: "0 1px 3px rgba(0,0,0,0.3)"
            }} />
          </button>
        </div>
      </nav>

      {/* Logout */}
      <div style={{ padding: "16px", borderTop: "1px solid var(--border)" }}>
        <button onClick={handleLogout} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.2s" }}>
          🚪 Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile header */}
      <div className="mobile-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", color: "white", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>TD</div>
          <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Tutor Desk</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={handleThemeToggle} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>
            {isDark ? "☀️" : "🌙"}
          </button>
          <button onClick={() => setOpen(!open)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "var(--text-primary)" }}>☰</button>
        </div>
      </div>
      <div className={`overlay ${open ? "show" : ""}`} onClick={() => setOpen(false)} />
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <SidebarContent />
      </aside>
    </>
  );
}
