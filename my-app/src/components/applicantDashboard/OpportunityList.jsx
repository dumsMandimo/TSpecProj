import { useState } from "react";
import { applyToOpportunity } from "../../services/userService";
import { TYPE_LABELS } from "./opportunityConstants";
import "./OpportunityList.css";

export default function OpportunityList({ opportunities = [] }) {
  const [applying, setApplying] = useState(null);
  const [feedback, setFeedback] = useState({});

  const handleApply = async (opportunity) => {
    setApplying(opportunity.id);
    setFeedback((prev) => ({
      ...prev,
      [opportunity.id]: {},
    }));

    try {
      await applyToOpportunity(opportunity);

      setFeedback((prev) => ({
        ...prev,
        [opportunity.id]: {
          success: "Application submitted!",
        },
      }));
    } catch (err) {
      setFeedback((prev) => ({
        ...prev,
        [opportunity.id]: {
          error:
            err.message === "Already applied to this opportunity."
              ? "You've already applied to this opportunity."
              : "Failed to apply. Please try again.",
        },
      }));
    } finally {
      setApplying(null);
    }
  };

  return (
    <section className="applicant-panel" aria-label="Available opportunities">
      <header className="applicant-panel__header">
        <h2 className="applicant-panel__title">Available Opportunities</h2>
        <p className="applicant-panel__subtitle">
          Browse and apply to learnerships, internships and more
        </p>
      </header>

      {opportunities.length === 0 ? (
        <p className="applicant-panel__empty">
          No opportunities available yet. Check back soon!
        </p>
      ) : (
        <ul className="applicant-panel__grid">
          {opportunities.map((opp) => {
            const fb = feedback[opp.id] || {};
            const isApplying = applying === opp.id;

            return (
              <li key={opp.id}>
                <article className="opportunity-card">
                  <header className="opportunity-card__header">
                    <h3 className="opportunity-card__title">{opp.title}</h3>
                    <span className="opportunity-card__type">
                      {TYPE_LABELS[opp.type] ?? opp.type}
                    </span>
                  </header>

                  <div className="opportunity-card__meta">
                    <p className="opportunity-card__provider">
                      {opp.providerName || "Unknown Provider"}
                    </p>
                    {opp.location && (
                      <p className="opportunity-card__location">{opp.location}</p>
                    )}
                    {opp.stipend && (
                      <p className="opportunity-card__stipend">{opp.stipend}</p>
                    )}
                  </div>

                  {opp.description && (
                    <p className="opportunity-card__description">{opp.description}</p>
                  )}

                  {opp.companyUrl && (
                    <a
                      href={opp.companyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="opportunity-card__link"
                    >
                      More about {opp.providerName || "this provider"}
                    </a>
                  )}

                  <footer className="opportunity-card__footer">
                    {fb.success ? (
                      <p className="opportunity-card__success" role="status">
                        {fb.success}
                      </p>
                    ) : (
                      <>
                        {fb.error && (
                          <p className="opportunity-card__error" role="alert">
                            {fb.error}
                          </p>
                        )}
                        <button
                          className="opportunity-card__apply-btn"
                          onClick={() => handleApply(opp)}
                          disabled={isApplying}
                          aria-busy={isApplying}
                          type="button"
                        >
                          {isApplying ? "Applying..." : "Apply Now"}
                        </button>
                      </>
                    )}
                  </footer>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
