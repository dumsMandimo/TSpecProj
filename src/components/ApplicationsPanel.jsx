export default function ApplicationsPanel() {
  const applications = [
    { name: "John Doe", status: "Received" },
    { name: "Sarah Kim", status: "Shortlisted" }
  ];

  return (
    <section>
      <header style={{ marginBottom: "15px" }}>
        <h3 style={{ margin: 0, color: "#111827" }}>Applications</h3>
        <small style={{ color: "#6b7280" }}>
          Review and manage applicant submissions
        </small>
      </header>

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {applications.map((a, i) => (
          <li key={i}>
            <article
              style={{
                background: "white",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "12px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                borderLeft: "5px solid #f97316", // ORANGE accent
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              {/* LEFT SIDE */}
              <header>
                <h4 style={{ margin: 0, color: "#111827" }}>
                  {a.name}
                </h4>
                <small style={{ color: "#6b7280" }}>
                  {a.status}
                </small>
              </header>

              {/* RIGHT SIDE ACTIONS */}
              <nav style={{ display: "flex", gap: "8px" }}>
                <button style={btnOrange}>Accept</button>
                <button style={btnDark}>Reject</button>
                <button style={btnOutline}>Shortlist</button>
              </nav>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* =========================
   THEME BUTTON STYLES
========================= */

const baseBtn = {
  padding: "6px 10px",
  borderRadius: "8px",
  fontSize: "12px",
  fontWeight: "bold",
  cursor: "pointer",
  border: "none"
};

const btnOrange = {
  ...baseBtn,
  background: "#f97316",
  color: "white"
};

const btnDark = {
  ...baseBtn,
  background: "#111827",
  color: "white"
};

const btnOutline = {
  ...baseBtn,
  background: "transparent",
  border: "1px solid #f97316",
  color: "#f97316"
};