export default function Navbar() {
  return (
    <header style={{
      height: "60px",
      background: "#f1f5f9",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "0 20px"
    }}>
      <h4>Provider Dashboard</h4>
      <button>Logout</button>
    </header>
  );
}