import { useState, useEffect } from "react";
import { getProviderStats } from "../../../services/providerService";
import { auth } from "../../../services/firebase";
import "./OverviewCards.css";

const STAT_CONFIG = [
  {
    key:         "listings",
    label:       "Total Listings",
    description: "All opportunities posted",
    tab:         "listings",
    filter:      "all",
    color:       "accent",
    icon:        "◈",
  },
  {
    key:         "approved",
    label:       "Live Listings",
    description: "Visible to applicants",
    tab:         "listings",
    filter:      "approved",
    color:       "green",
    icon:        "✦",
  },
  {
    key:         "pending",
    label:       "Pending Approval",
    description: "Awaiting admin review",
    tab:         "listings",
    filter:      "pending",
    color:       "amber",
    icon:        "◌",
  },
  {
    key:         "applications",
    label:       "Total Applications",
    description: "Received across all listings",
    tab:         "applications",
    filter:      "all",
    color:       "accent",
    icon:        "◎",
  },
  {
    key:         "shortlisted",
    label:       "Shortlisted",
    description: "Candidates shortlisted",
    tab:         "applications",
    filter:      "shortlisted",
    color:       "green",
    icon:        "◆",
  },
  {
    key:         "accepted",
    label:       "Accepted",
    description: "Offers extended",
    tab:         "applications",
    filter:      "accepted",
    color:       "green",
    icon:        "✓",
  },
];

export default function OverviewCards({
  setTab,
  setListingFilter,
  setApplicationFilter,
}) {
  const [stats, setStats]     = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;

    if (!uid) return;

    setLoading(true);

    getProviderStats(uid)
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load stats.");
        setLoading(false);
      });
  }, []);

  const handleCardClick = (tab, filter) => {
    if (tab === "listings") {
      setListingFilter?.(filter);
    }

    if (tab === "applications") {
      setApplicationFilter?.(filter);
    }

    setTab(tab);
  };

  const applicationRate =
    stats.listings > 0
      ? (stats.applications / stats.listings).toFixed(1)
      : "0.0";

  if (loading) {
    return (
      <section
        className="overview-cards__skeleton-wrap"
        aria-label="Loading overview statistics"
      >
        {[...Array(6)].map((_, i) => (
          <article
            key={i}
            className="overview-card overview-card--skeleton"
          />
        ))}
      </section>
    );
  }

  if (error) {
    return (
      <p className="overview-cards__error" role="alert">
        {error}
      </p>
    );
  }

  return (
    <section aria-label="Overview statistics">
      <header className="overview-cards__header">
        <section>
          <h2 className="overview-cards__title">
            Overview
          </h2>

          <p className="overview-cards__subtitle">
            Your dashboard at a glance
          </p>
        </section>

        <aside
          className="overview-cards__summary-chip"
          aria-label="Application summary"
        >
          <span className="overview-cards__summary-label">
            Avg. applications/listing
          </span>

          <output className="overview-cards__summary-value">
            {applicationRate}
          </output>
        </aside>
      </header>

      <ul className="overview-cards__grid">
        {STAT_CONFIG.map(
          ({
            key,
            label,
            description,
            tab,
            filter,
            color,
            icon,
          }) => (
            <li
              key={key}
              className="overview-cards__item"
            >
              <button
                className={`overview-card overview-card--${color} overview-card--clickable`}
                onClick={() => handleCardClick(tab, filter)}
                aria-label={`${label}: ${
                  stats[key] ?? 0
                }. Click to view.`}
              >
                <header className="overview-card__top">
                  <span
                    className="overview-card__icon"
                    aria-hidden="true"
                  >
                    {icon}
                  </span>

                  <span
                    className="overview-card__arrow"
                    aria-hidden="true"
                  >
                    →
                  </span>
                </header>

                <p className="overview-card__value">
                  {stats[key] ?? 0}
                </p>

                <footer className="overview-card__bottom">
                  <h3 className="overview-card__label">
                    {label}
                  </h3>

                  <small className="overview-card__description">
                    {description}
                  </small>
                </footer>
              </button>
            </li>
          )
        )}
      </ul>
    </section>
  );
}