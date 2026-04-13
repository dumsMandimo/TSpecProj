export default function ListingsPanel() {
  const listings = [
    { title: "Software Internship", status: "Approved" },
    { title: "Business Learnership", status: "Pending" }
  ];

  return (
    <section>
      <header style={{ marginBottom: "15px" }}>
        <h3 style={{ margin: 0 }}>My Listings</h3>
        <small style={{ color: "#6b7280" }}>
          Manage all your posted opportunities
        </small>
      </header>

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {listings.map((item, i) => (
          <li key={i}>
            <article
              style={{
                background: "white",
                padding: "16px",
                borderRadius: "12px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                borderLeft: "5px solid #f97316",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px"
              }}
            >
              <header>
                <h4 style={{ margin: 0 }}>{item.title}</h4>
                <small style={{ color: "#6b7280" }}>Listing</small>
              </header>

              <span
                style={{
                  padding: "6px 10px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "bold",
                  background:
                    item.status === "Approved"
                      ? "#dcfce7"
                      : "#fef3c7",
                  color:
                    item.status === "Approved"
                      ? "#16a34a"
                      : "#f97316"
                }}
              >
                {item.status}
              </span>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}