import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main className="main-content" style={{ flex: 1, marginLeft: 260, padding: "36px", background: "#F8FAFC", minHeight: "100vh" }}>
        <div style={{ paddingTop: 0 }}>
          {children}
        </div>
      </main>
    </div>
  );
}
