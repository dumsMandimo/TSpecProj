import { useState, useEffect, useRef } from "react";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "../../../services/firebase";
import "./AnalyticsPanel.css";

// ── helpers ───────────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  submitted: "#378add",
  shortlisted: "#ef9f27",
  accepted: "#1d9e75",
  rejected: "#e24b4a",
};

function toCSV(headers, rows) {
  return [headers, ...rows].map((r) => r.join(",")).join("\n");
}

function downloadCSV(filename, csv) {
  const a = document.createElement("a");
  a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
  a.download = filename;
  a.click();
}

function openPrintWindow(title, headers, rows) {
  const w = window.open("", "_blank");

  const cells = (arr, tag) =>
    arr
      .map(
        (c) =>
          `<${tag} style="padding:8px 12px;border:1px solid #ddd;text-align:left">${c}</${tag}>`
      )
      .join("");

  const trs = rows
    .map((r) => `<tr>${cells(r, "td")}</tr>`)
    .join("");

  w.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body{
            font-family:sans-serif;
            padding:24px;
          }

          h2{
            margin-bottom:16px;
          }

          table{
            border-collapse:collapse;
            width:100%;
          }

          th{
            background:#f5f5f5;
          }
        </style>
      </head>

      <body>
        <h2>${title}</h2>

        <table>
          <thead>
            <tr>${cells(headers, "th")}</tr>
          </thead>

          <tbody>
            ${trs}
          </tbody>
        </table>
      </body>
    </html>
  `);

  w.document.close();
  w.print();
}

// ── Chart drawing ─────────────────────────────────────────────────────────────

function drawBarChart(canvas, labels, datasets) {
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  const W = (canvas.width = canvas.offsetWidth);
  const H = (canvas.height = 260);

  ctx.clearRect(0, 0, W, H);

  const pad = {
    top: 20,
    right: 20,
    bottom: 70,
    left: 40,
  };

  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;

  const totals = labels.map((_, i) =>
    datasets.reduce((s, d) => s + (d.data[i] ?? 0), 0)
  );

  const maxVal = Math.max(...totals, 1);

  const groupW = chartW / labels.length;
  const barW = groupW * 0.6;

  // gridlines
  ctx.strokeStyle = "rgba(128,128,128,0.15)";
  ctx.lineWidth = 1;

  for (let i = 0; i <= 4; i++) {
    const y = pad.top + chartH - (i / 4) * chartH;

    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + chartW, y);
    ctx.stroke();

    ctx.fillStyle = "rgba(128,128,128,0.6)";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "right";

    ctx.fillText(
      Math.round((i / 4) * maxVal),
      pad.left - 4,
      y + 4
    );
  }

  // stacked bars
  labels.forEach((label, gi) => {
    const x =
      pad.left + gi * groupW + (groupW - barW) / 2;

    let yOffset = 0;

    [...datasets].reverse().forEach((ds) => {
      const val = ds.data[gi] ?? 0;

      const barH = (val / maxVal) * chartH;

      const y =
        pad.top + chartH - yOffset - barH;

      ctx.fillStyle = ds.color;

      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, [3, 3, 0, 0]);
      ctx.fill();

      yOffset += barH;
    });

    // x labels
    ctx.save();

    ctx.translate(
      x + barW / 2,
      pad.top + chartH + 10
    );

    ctx.rotate(-Math.PI / 5);

    ctx.fillStyle = "rgba(128,128,128,0.8)";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "right";

    ctx.fillText(
      label.length > 22
        ? label.slice(0, 20) + "…"
        : label,
      0,
      0
    );

    ctx.restore();
  });
}

function drawLineChart(canvas, labels, datasets) {
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  const W = (canvas.width = canvas.offsetWidth);
  const H = (canvas.height = 220);

  ctx.clearRect(0, 0, W, H);

  const pad = {
    top: 20,
    right: 20,
    bottom: 36,
    left: 40,
  };

  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;

  const maxVal = Math.max(
    ...datasets.flatMap((d) => d.data),
    1
  );

  const px = (i) =>
    pad.left + (i / (labels.length - 1)) * chartW;

  const py = (v) =>
    pad.top + chartH - (v / maxVal) * chartH;

  // gridlines
  ctx.strokeStyle = "rgba(128,128,128,0.12)";
  ctx.lineWidth = 1;

  for (let i = 0; i <= 4; i++) {
    const y = pad.top + chartH - (i / 4) * chartH;

    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + chartW, y);
    ctx.stroke();

    ctx.fillStyle = "rgba(128,128,128,0.6)";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "right";

    ctx.fillText(
      Math.round((i / 4) * maxVal),
      pad.left - 4,
      y + 4
    );
  }

  // lines
  datasets.forEach((ds) => {
    ctx.beginPath();

    ctx.strokeStyle = ds.color;
    ctx.lineWidth = 2.5;

    if (ds.dashed) {
      ctx.setLineDash([6, 4]);
    } else {
      ctx.setLineDash([]);
    }

    ds.data.forEach((v, i) => {
      i === 0
        ? ctx.moveTo(px(i), py(v))
        : ctx.lineTo(px(i), py(v));
    });

    ctx.stroke();

    // fill
    ctx.beginPath();

    ctx.setLineDash([]);

    ds.data.forEach((v, i) => {
      i === 0
        ? ctx.moveTo(px(i), py(v))
        : ctx.lineTo(px(i), py(v));
    });

    ctx.lineTo(
      px(ds.data.length - 1),
      pad.top + chartH
    );

    ctx.lineTo(px(0), pad.top + chartH);

    ctx.closePath();

    ctx.fillStyle = ds.color + "18";
    ctx.fill();

    // dots
    ds.data.forEach((v, i) => {
      ctx.beginPath();

      ctx.arc(px(i), py(v), 4, 0, Math.PI * 2);

      ctx.fillStyle = ds.color;
      ctx.fill();
    });
  });

  // x labels
  labels.forEach((lbl, i) => {
    ctx.fillStyle = "rgba(128,128,128,0.8)";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";

    ctx.fillText(lbl, px(i), H - 10);
  });
}

function drawDonutChart(canvas, labels, values, colors) {
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  const W = (canvas.width = canvas.offsetWidth);
  const H = (canvas.height = 220);

  ctx.clearRect(0, 0, W, H);

  const total = values.reduce((s, v) => s + v, 0);

  const cx = W / 2;
  const cy = H / 2;

  const r = Math.min(W, H) * 0.38;
  const ir = r * 0.58;

  let angle = -Math.PI / 2;

  values.forEach((v, i) => {
    const slice = (v / total) * Math.PI * 2;

    ctx.beginPath();

    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle + slice);

    ctx.closePath();

    ctx.fillStyle = colors[i];
    ctx.fill();

    angle += slice;
  });

  // hole
  ctx.beginPath();
  ctx.arc(cx, cy, ir, 0, Math.PI * 2);

  ctx.fillStyle = "transparent";
  ctx.fill();

  ctx.clearRect(
    cx - ir,
    cy - ir,
    ir * 2,
    ir * 2
  );

  ctx.beginPath();
  ctx.arc(cx, cy, ir, 0, Math.PI * 2);

  ctx.fillStyle = "transparent";
  ctx.fill();

  // centre text
  ctx.textAlign = "center";

  ctx.fillStyle = "rgba(128,128,128,0.9)";
  ctx.font = "12px sans-serif";

  ctx.fillText("placement", cx, cy - 6);

  ctx.font = "bold 18px sans-serif";
  ctx.fillStyle = "rgba(100,100,100,1)";

  ctx.fillText(
    Math.round(
      values.reduce((s, v) => s + v, 0) /
        values.length
    ) + "%",
    cx,
    cy + 16
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AnalyticsPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [volData, setVolData] = useState(null);
  const [sectorData, setSectorData] = useState(null);
  const [trendData, setTrendData] = useState(null);

  const [sectorView, setSectorView] =
    useState("bar");

  const [toast, setToast] = useState("");

  const volRef = useRef(null);
  const sectorRef = useRef(null);
  const trendRef = useRef(null);

  // ── fetch data ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const uid = auth.currentUser?.uid;

    if (!uid) return;

    (async () => {
      try {
        // listings
        const listSnap = await getDocs(
          query(
            collection(db, "opportunities"),
            where("providerUid", "==", uid)
          )
        );

        const listings = listSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        const ids = listings.map((l) => l.id);

        if (ids.length === 0) {
          setVolData({
            labels: [],
            datasets: [],
          });

          setSectorData({
            labels: [],
            rates: [],
            colors: [],
          });

          setTrendData({
            months: [],
            apps: [],
            accepted: [],
          });

          setLoading(false);
          return;
        }

        // applications
        const chunks = [];

        for (let i = 0; i < ids.length; i += 30) {
          chunks.push(ids.slice(i, i + 30));
        }

        let allApps = [];

        for (const chunk of chunks) {
          const snap = await getDocs(
            query(
              collection(db, "applications"),
              where("opportunityId", "in", chunk)
            )
          );

          allApps = allApps.concat(
            snap.docs.map((d) => ({
              id: d.id,
              ...d.data(),
            }))
          );
        }

        // ── Report 1 ─────────────────────────────────────────────────────────

        const volLabels = listings.map(
          (l) => l.title ?? "Untitled"
        );

        const submitted = listings.map(
          (l) =>
            allApps.filter(
              (a) =>
                a.opportunityId === l.id &&
                a.status === "submitted"
            ).length
        );

        const shortlisted = listings.map(
          (l) =>
            allApps.filter(
              (a) =>
                a.opportunityId === l.id &&
                a.status === "shortlisted"
            ).length
        );

        const accepted = listings.map(
          (l) =>
            allApps.filter(
              (a) =>
                a.opportunityId === l.id &&
                a.status === "accepted"
            ).length
        );

        const rejected = listings.map(
          (l) =>
            allApps.filter(
              (a) =>
                a.opportunityId === l.id &&
                a.status === "rejected"
            ).length
        );

        setVolData({
          labels: volLabels,

          datasets: [
            {
              label: "Submitted",
              data: submitted,
              color: STATUS_COLORS.submitted,
            },

            {
              label: "Shortlisted",
              data: shortlisted,
              color: STATUS_COLORS.shortlisted,
            },

            {
              label: "Accepted",
              data: accepted,
              color: STATUS_COLORS.accepted,
            },

            {
              label: "Rejected",
              data: rejected,
              color: STATUS_COLORS.rejected,
            },
          ],

          raw: listings.map((l, i) => [
            l.title,
            submitted[i],
            shortlisted[i],
            accepted[i],
            rejected[i],
          ]),
        });

        // ── Report 2 ─────────────────────────────────────────────────────────

        const types = [
          "learnership",
          "internship",
          "apprenticeship",
          "graduate",
        ];

        const labels = [
          "Learnership",
          "Internship",
          "Apprenticeship",
          "Graduate",
        ];

        const colors = [
          "#5dcaa5",
          "#378add",
          "#ef9f27",
          "#7f77dd",
        ];

        const rates = types.map((type) => {
          const typedListings = listings.filter(
            (l) => l.type === type
          );

          if (!typedListings.length) return 0;

          const typeIds = typedListings.map(
            (l) => l.id
          );

          const typeApps = allApps.filter((a) =>
            typeIds.includes(a.opportunityId)
          );

          if (!typeApps.length) return 0;

          const acc = typeApps.filter(
            (a) => a.status === "accepted"
          ).length;

          return Math.round(
            (acc / typeApps.length) * 100
          );
        });

        setSectorData({
          labels,
          rates,
          colors,

          raw: labels.map((l, i) => [
            l,
            rates[i] + "%",
          ]),
        });

        // ── Report 3 ─────────────────────────────────────────────────────────

        const now = new Date();

        const months = [];
        const mApps = [];
        const mAcc = [];

        for (let m = 5; m >= 0; m--) {
          const d = new Date(
            now.getFullYear(),
            now.getMonth() - m,
            1
          );

          const label = d.toLocaleString(
            "default",
            {
              month: "short",
            }
          );

          const yr = d.getFullYear();
          const mo = d.getMonth();

          const inMonth = allApps.filter((a) => {
            if (!a.appliedAt) return false;

           const ts = a.appliedAt.toDate();

            return (
            ts.getFullYear() === yr &&
            ts.getMonth() === mo
             );
         });
           

          months.push(label);

          mApps.push(inMonth.length);

          mAcc.push(
            inMonth.filter(
              (a) => a.status === "accepted"
            ).length
          );
        }

        setTrendData({
          months,
          apps: mApps,
          accepted: mAcc,

          raw: months.map((m, i) => [
            m,
            mApps[i],
            mAcc[i],
          ]),
        });

        setLoading(false);
      } catch (err) {
        console.error(err);

        setError("Failed to load analytics.");
        setLoading(false);
      }
    })();
  }, []);

  // ── draw charts ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (volData) {
      drawBarChart(
        volRef.current,
        volData.labels,
        volData.datasets
      );
    }
  }, [volData]);

  useEffect(() => {
    if (!sectorData) return;

    if (sectorView === "bar") {
      drawBarChart(
        sectorRef.current,
        sectorData.labels,
        [
          {
            label: "Rate",
            data: sectorData.rates,
            color: "#378add",
          },
        ]
      );
    } else {
      drawDonutChart(
        sectorRef.current,
        sectorData.labels,
        sectorData.rates,
        sectorData.colors
      );
    }
  }, [sectorData, sectorView]);

  useEffect(() => {
    if (!trendData) return;

    drawLineChart(
      trendRef.current,
      trendData.months,
      [
        {
          label: "Applications",
          data: trendData.apps,
          color: "#378add",
        },

        {
          label: "Accepted",
          data: trendData.accepted,
          color: "#1d9e75",
          dashed: true,
        },
      ]
    );
  }, [trendData]);

  // ── export helpers ────────────────────────────────────────────────────────

  const showToast = (msg) => {
    setToast(msg);

    setTimeout(() => {
      setToast("");
    }, 2500);
  };

  const handleCSV = (
    title,
    headers,
    rows
  ) => {
    downloadCSV(
      title
        .toLowerCase()
        .replace(/ /g, "_") + ".csv",

      toCSV(headers, rows)
    );

    showToast("CSV downloaded");
  };

  const handlePDF = (
    title,
    headers,
    rows
  ) => {
    openPrintWindow(title, headers, rows);

    showToast("Print dialog opened");
  };

  // ── summary numbers ───────────────────────────────────────────────────────

  const totalApps =
    volData?.datasets.reduce(
      (s, d) =>
        s +
        d.data.reduce((a, b) => a + b, 0),
      0
    ) ?? 0;

  const totalAccepted =
    volData?.datasets
      .find((d) => d.label === "Accepted")
      ?.data.reduce((a, b) => a + b, 0) ?? 0;

  const totalShort =
    volData?.datasets
      .find((d) => d.label === "Shortlisted")
      ?.data.reduce((a, b) => a + b, 0) ?? 0;

  const placementPct = totalApps
    ? Math.round(
        (totalAccepted / totalApps) * 100
      )
    : 0;

  // ── render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <section className="ap-loading">
        <p>Loading analytics…</p>
      </section>
    );
  }

  if (error) {
    return (
      <aside
        className="ap-error"
        role="alert"
      >
        {error}
      </aside>
    );
  }

  return (
    <main className="analytics">

      {/* Toast */}
      {toast && (
        <aside
          className="analytics__toast"
          role="status"
        >
          {toast}
        </aside>
      )}

      {/* Header */}
      <header className="analytics__header">
        <section>
          <h2 className="analytics__title">
            Analytics
          </h2>

          <p className="analytics__subtitle">
            Reports and insights for your
            listings
          </p>
        </section>
      </header>

      {/* Summary cards */}
      <section className="analytics__metrics">

        <article className="analytics__metric">
          <span className="analytics__metric-label">
            Total applications
          </span>

          <strong className="analytics__metric-value">
            {totalApps}
          </strong>
        </article>

        <article className="analytics__metric">
          <span className="analytics__metric-label">
            Accepted
          </span>

          <strong
            className="analytics__metric-value"
            style={{ color: "#1d9e75" }}
          >
            {totalAccepted}
          </strong>
        </article>

        <article className="analytics__metric">
          <span className="analytics__metric-label">
            Shortlisted
          </span>

          <strong
            className="analytics__metric-value"
            style={{ color: "#185fa5" }}
          >
            {totalShort}
          </strong>
        </article>

        <article className="analytics__metric">
          <span className="analytics__metric-label">
            Placement rate
          </span>

          <strong className="analytics__metric-value">
            {placementPct}%
          </strong>
        </article>

      </section>

      {/* ── Report 1 ───────────────────────────────────────────────────────── */}

      <section className="analytics__section">

        <header className="analytics__section-header">

          <h3 className="analytics__section-title">
            Application volume per opportunity
          </h3>

          <nav className="analytics__export-row">

            <button
              className="analytics__export-btn"
              onClick={() =>
                handleCSV(
                  "Application Volume",
                  [
                    "Opportunity",
                    "Submitted",
                    "Shortlisted",
                    "Accepted",
                    "Rejected",
                  ],
                  volData.raw
                )
              }
            >
              ⬇ CSV
            </button>

            <button
              className="analytics__export-btn"
              onClick={() =>
                handlePDF(
                  "Application Volume",
                  [
                    "Opportunity",
                    "Submitted",
                    "Shortlisted",
                    "Accepted",
                    "Rejected",
                  ],
                  volData.raw
                )
              }
            >
              ⬇ PDF
            </button>

          </nav>
        </header>

        <nav className="analytics__legend">

          {Object.entries(STATUS_COLORS).map(
            ([k, c]) => (
              <span
                key={k}
                className="analytics__legend-item"
              >
                <span
                  className="analytics__legend-sq"
                  style={{
                    background: c,
                  }}
                />

                {k.charAt(0).toUpperCase() +
                  k.slice(1)}
              </span>
            )
          )}

        </nav>

        {volData.labels.length === 0 ? (
          <p className="analytics__empty">
            No listings yet.
          </p>
        ) : (
          <canvas
            ref={volRef}
            className="analytics__canvas"
          />
        )}

      </section>

      <hr className="analytics__divider" />

      {/* ── Report 2 ───────────────────────────────────────────────────────── */}

      <section className="analytics__section">

        <header className="analytics__section-header">

          <h3 className="analytics__section-title">
            Placement success rate by sector
          </h3>

          <nav className="analytics__export-row">

            <button
              className="analytics__export-btn"
              onClick={() =>
                handleCSV(
                  "Placement by Sector",
                  [
                    "Sector",
                    "Placement Rate",
                  ],
                  sectorData.raw
                )
              }
            >
              ⬇ CSV
            </button>

            <button
              className="analytics__export-btn"
              onClick={() =>
                handlePDF(
                  "Placement by Sector",
                  [
                    "Sector",
                    "Placement Rate",
                  ],
                  sectorData.raw
                )
              }
            >
              ⬇ PDF
            </button>

          </nav>
        </header>

        <nav className="analytics__tab-row">

          {["bar", "donut"].map((v) => (
            <button
              key={v}
              className={`analytics__tab${
                sectorView === v
                  ? " analytics__tab--active"
                  : ""
              }`}
              onClick={() =>
                setSectorView(v)
              }
            >
              {v.charAt(0).toUpperCase() +
                v.slice(1)}
            </button>
          ))}

        </nav>

        <nav className="analytics__legend">

          {sectorData.labels.map((l, i) => (
            <span
              key={l}
              className="analytics__legend-item"
            >
              <span
                className="analytics__legend-sq"
                style={{
                  background:
                    sectorData.colors[i],
                }}
              />

              {l}
            </span>
          ))}

        </nav>

        <canvas
          ref={sectorRef}
          className="analytics__canvas"
        />

      </section>

      <hr className="analytics__divider" />

      {/* ── Report 3 ───────────────────────────────────────────────────────── */}

      <section className="analytics__section">

        <header className="analytics__section-header">

          <h3 className="analytics__section-title">
            Application trend — last 6 months
          </h3>

          <nav className="analytics__export-row">

            <button
              className="analytics__export-btn"
              onClick={() =>
                handleCSV(
                  "Application Trend",
                  [
                    "Month",
                    "Applications",
                    "Accepted",
                  ],
                  trendData.raw
                )
              }
            >
              ⬇ CSV
            </button>

            <button
              className="analytics__export-btn"
              onClick={() =>
                handlePDF(
                  "Application Trend",
                  [
                    "Month",
                    "Applications",
                    "Accepted",
                  ],
                  trendData.raw
                )
              }
            >
              ⬇ PDF
            </button>

          </nav>
        </header>

        <nav className="analytics__legend">

          <span className="analytics__legend-item">
            <span
              className="analytics__legend-sq"
              style={{
                background: "#378add",
              }}
            />

            Applications received
          </span>

          <span className="analytics__legend-item">
            <span
              className="analytics__legend-sq"
              style={{
                background: "#1d9e75",
                border:
                  "1px dashed #0f6e56",
              }}
            />

            Accepted
          </span>

        </nav>

        <canvas
          ref={trendRef}
          className="analytics__canvas"
        />

      </section>

    </main>
  );
}