import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 240, padding: "32px", background: "#F8FAFF", minHeight: "100vh" }}>
        {children}
      </main>
    </div>
  );
}
