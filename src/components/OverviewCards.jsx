export default function OverviewCards() {
  const stats = [
    { label: "Listings", value: 3 },
    { label: "Applications", value: 12 },
    { label: "Shortlisted", value: 4 },
    { label: "Accepted", value: 2 }
  ];

  return (
    <section style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
      {stats.map((item, i) => (
        <article key={i} style={card}>
          <header>
            <h4 style={{ margin: 0, color: "#111827", fontSize: "14px" }}>
              {item.label}
            </h4>
          </header>

          <p style={{
            margin: "8px 0 0 0",
            fontSize: "24px",
            fontWeight: "bold",
            color: "#f97316"
          }}>
            {item.value}
          </p>

          <small style={{ color: "#6b7280" }}>
            Overview metric
          </small>
        </article>
      ))}
    </section>
  );
}



const card = {
  background: "white",
  padding: "16px",
  borderRadius: "12px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
  borderLeft: "5px solid #f97316",
  textAlign: "left"
};