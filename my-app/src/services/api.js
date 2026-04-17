export async function getAdminDashboard() {
  const res = await fetch("http://localhost:3001/api/admin/dashboard");

  if (!res.ok) {
    throw new Error("Failed to fetch dashboard");
  }

  return res.json();
}