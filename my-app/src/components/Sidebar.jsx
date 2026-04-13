export default function Sidebar({ setTab }) {
  return (
    <aside style={{
      width: "240px",
      background: "#111827",
      color: "white",
      padding: "20px"
    }}>
      <h2 style={{ marginBottom: "20px" }}>Provider</h2>

      <nav>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {["overview", "listings", "applications", "create"].map((t) => (
            <li key={t} style={{ marginBottom: "10px" }}>
              <button
                onClick={() => setTab(t)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  background: "#1f2937",
                  color: "white",
                  border: "none"
                }}
              >
                {t.toUpperCase()}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}