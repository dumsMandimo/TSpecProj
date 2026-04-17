import Sidebar from "../../components/admin/adminSidebar";
import { Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <main style={{ display: "flex" }}>
      
      <aside>
        <Sidebar />
      </aside>
      <section style={{ flex: 1, padding: "20px" }}>
        <Outlet />
      </section>

    </main>
  );
}