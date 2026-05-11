import { useState, useEffect } from "react";
import { subscribeToProviderListings } from "../../../services/providerService";
import { auth } from "../../../services/firebase";
import "./ListingsPanel.css";

const STATUS_LABELS = {
  approved: "Approved",
  pending:  "Pending",
  rejected: "Rejected",
};

export default function ListingsPanel() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const unsubscribe = subscribeToProviderListings(uid, (data) => {
      setListings(data);
      setLoading(false);
    }, (err) => {
      setError("Failed to load listings.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <p className="listings-panel__loading">Loading listings...</p>;
  if (error)   return <p className="listings-panel__error" role="alert">{error}</p>;

  return (
    <section aria-label="My listings">
      <header className="listings-panel__header">
        <h2 className="listings-panel__title">My Listings</h2>
        <p className="listings-panel__subtitle">Manage all your posted opportunities</p>
      </header>

      {listings.length === 0 ? (
        <p className="listings-panel__empty">No listings yet. Post your first opportunity.</p>
      ) : (
        <ul className="listings-panel__list">
          {listings.map((item) => (
            <li key={item.id} className="listings-panel__item">
              <article className="listing-card">
                <header className="listing-card__header">
                  <h3 className="listing-card__title">{item.title}</h3>
                  <p className="listing-card__location">{item.location}</p>
                </header>
                <footer className="listing-card__footer">
                  <span
                    className={`listing-card__badge listing-card__badge--${item.status}`}
                    aria-label={`Status: ${STATUS_LABELS[item.status] ?? item.status}`}
                  >
                    {STATUS_LABELS[item.status] ?? item.status}
                  </span>
                </footer>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
