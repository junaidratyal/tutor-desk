"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/dashboard/students", label: "Students", icon: "👨‍🎓" },
  { href: "/dashboard/fees", label: "Fees", icon: "💰" },
  { href: "/dashboard/schedule", label: "Schedule", icon: "📅" },
  { href: "/dashboard/reminders", label: "Reminders", icon: "💬" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside style={{ width: 240, background: "white", borderRight: "1px solid #E5E7EB", display: "flex", flexDirection: "column", minHeight: "100vh", position: "fixed", top: 0, left: 0 }}>
      <div style={{ padding: "24px 20px", borderBottom: "1px solid #F3F4F6" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: "#2563EB", color: "white", borderRadius: 8, padding: "6px 10px", fontWeight: 700, fontSize: 16 }}>TD</div>
          <span style={{ fontWeight: 700, fontSize: 17, color: "#1E40AF" }}>Tutor Desk</span>
        </div>
      </div>

      <nav style={{ padding: "16px 12px", flex: 1 }}>
        {navItems.map(item => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 8, marginBottom: 4,
              background: active ? "#EFF6FF" : "transparent",
              color: active ? "#2563EB" : "#374151",
              fontWeight: active ? 600 : 500, fontSize: 14, textDecoration: "none",
              transition: "background 0.15s"
            }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: "16px 12px", borderTop: "1px solid #F3F4F6" }}>
        <button onClick={handleLogout} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", color: "#6B7280", fontSize: 14, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
          🚪 Logout
        </button>
      </div>
    </aside>
  );
}
