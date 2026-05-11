let opportunities = [
  { id: 1, status: "approved" },
  { id: 2, status: "pending" },
  { id: 3, status: "approved" },
  { id: 4, status: "pending" },
];

exports.getDashboardStats = (req, res) => {
  const total = opportunities.length;
  const approved = opportunities.filter(o => o.status === "approved").length;
  const pending = opportunities.filter(o => o.status === "pending").length;

  res.json({
    total,
    approved,
    pending,
  });
};