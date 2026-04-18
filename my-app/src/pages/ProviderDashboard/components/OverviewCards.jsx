import { useState, useEffect } from "react";
import { getProviderStats } from "../../../services/providerService";
import { auth } from "../../../services/firebase";
import "./OverviewCards.css";

const STAT_CONFIG = [
  { key: "listings",     label: "Total Listings",   description: "Opportunities posted" },
  { key: "applications", label: "Applications",     description: "Total received" },
  { key: "shortlisted",  label: "Shortlisted",      description: "Candidates shortlisted" },
  { key: "accepted",     label: "Accepted",         description: "Offers accepted" },
];

export default function OverviewCards() {
  const [stats, setStats] = useState({ listings: 0, applications: 0, shortlisted: 0, accepted: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    setLoading(true);
    getProviderStats(uid)
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load stats.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p className="overview-cards__loading">Loading stats...</p>;
  }

  if (error) {
    return <p className="overview-cards__error" role="alert">{error}</p>;
  }

  return (
    <section aria-label="Overview statistics">
      <header className="overview-cards__header">
        <h2 className="overview-cards__title">Overview</h2>
        <p className="overview-cards__subtitle">Your activity at a glance</p>
      </header>

      <ul className="overview-cards__grid">
        {STAT_CONFIG.map(({ key, label, description }) => (
          <li key={key} className="overview-cards__item">
            <article className="overview-card">
              <header className="overview-card__header">
                <h3 className="overview-card__label">{label}</h3>
              </header>
              <p className="overview-card__value" aria-label={`${label}: ${stats[key]}`}>
                {stats[key]}
              </p>
              <footer className="overview-card__footer">
                <small className="overview-card__description">{description}</small>
              </footer>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
