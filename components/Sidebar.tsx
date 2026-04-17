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
  { href: "/dashboard/ai", label: "AI Assistant", icon: "🤖" },
  { href: "/dashboard/homework", label: "Homework", icon: "📝" },
  { href: "/dashboard/announcements", label: "Announcements", icon: "📣" },
  { href: "/academy/dashboard", label: "Academy", icon: "🏫", academy: true },
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
    if (!("Notification" in window)) { alert("Browser notifications support nahi karta!"); return; }
    if (Notification.permission === "granted") { setNotifEnabled(false); return; }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setNotifEnabled(true);
      new Notification("Tutor Desk 🎉", { body: "Notifications enable ho gayi hain!", icon: "/icon-192.png" });
    }
  }

  function isActive(item: any) {
    if (item.exact) return pathname === item.href;
    if (item.academy) return pathname.startsWith("/academy");
    return pathname.startsWith(item.href);
  }

  function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
    return (
      <button onClick={onToggle} style={{
        width: 42, height: 22, borderRadius: 11, border: "none", cursor: "pointer",
        background: enabled ? "#4F46E5" : "var(--border)", position: "relative",
        transition: "background 0.3s", flexShrink: 0
      }}>
        <div style={{
          width: 16, height: 16, borderRadius: "50%", background: "white",
          position: "absolute", top: 3, left: enabled ? "23px" : "3px",
          transition: "left 0.3s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)"
        }} />
      </button>
    );
  }

  const SidebarContent = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Logo */}
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", color: "white", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, boxShadow: "0 4px 12px rgba(79,70,229,0.35)" }}>TD</div>
          <div>
            <p style={{ fontWeight: 800, fontSize: 15, color: "var(--text-primary)" }}>Tutor Desk</p>
            <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Smart Tutor Manager</p>
          </div>
        </div>
      </div>

      {/* User */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div style={{ background: "var(--bg-hover)", borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: "hidden" }}>
            <p style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userName}</p>
            <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Solo Tutor</p>
          </div>
        </div>
      </div>

      {/* Nav - scrollable */}
      <nav style={{ padding: "10px", flex: 1, overflowY: "auto" }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", padding: "6px 12px 4px" }}>Menu</p>
        {navItems.map(item => (
          <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
            className={`nav-item ${isActive(item) ? "active" : ""}`}
            style={{ padding: "8px 12px", marginBottom: 1 }}>
            <span className="icon" style={{ width: 28, height: 28, fontSize: 14 }}>{item.icon}</span>
            <span style={{ fontSize: 13 }}>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Settings — fixed at bottom */}
      <div style={{ borderTop: "1px solid var(--border)", padding: "12px", flexShrink: 0 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", padding: "0 10px 8px" }}>Settings</p>

        {/* Dark Mode */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: 8, marginBottom: 4, background: "var(--bg-hover)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>{isDark ? "☀️" : "🌙"}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>{isDark ? "Light Mode" : "Dark Mode"}</span>
          </div>
          <Toggle enabled={isDark} onToggle={handleThemeToggle} />
        </div>

        {/* Notifications */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: 8, marginBottom: 10, background: "var(--bg-hover)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>🔔</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>Notifications</span>
          </div>
          <Toggle enabled={notifEnabled} onToggle={handleNotificationToggle} />
        </div>

        {/* Logout */}
        <button onClick={handleLogout} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          🚪 Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile header */}
      <div className="mobile-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", color: "white", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13 }}>TD</div>
          <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Tutor Desk</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={handleThemeToggle} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>
            {isDark ? "☀️" : "🌙"}
          </button>
          <button onClick={handleNotificationToggle} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>
            {notifEnabled ? "🔔" : "🔕"}
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
