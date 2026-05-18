export default function CreateOpportunityForm() {
  const handleSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <section aria-label="Post new opportunity">
      <header className="dash-panel__header">
        <h2 className="dash-panel__title">Post New Opportunity</h2>
        <p className="dash-panel__subtitle">
          Create a learnership, internship, or apprenticeship listing
        </p>
      </header>

      <form className="dash-form" onSubmit={handleSubmit}>
        <div className="dash-field">
          <label htmlFor="opp-title">Title</label>
          <input
            id="opp-title"
            className="dash-input"
            type="text"
            placeholder="e.g. Software Development Internship"
          />
        </div>

        <div className="dash-field">
          <label htmlFor="opp-location">Location</label>
          <input
            id="opp-location"
            className="dash-input"
            type="text"
            placeholder="e.g. Johannesburg"
          />
        </div>

        <div className="dash-field">
          <label htmlFor="opp-stipend">Stipend</label>
          <input
            id="opp-stipend"
            className="dash-input"
            type="text"
            placeholder="e.g. R5 000 per month"
          />
        </div>

        <div className="dash-field">
          <label htmlFor="opp-description">Description</label>
          <textarea
            id="opp-description"
            className="dash-textarea"
            placeholder="Describe the role, requirements, and benefits..."
          />
        </div>

        <button type="submit" className="dash-btn dash-btn--primary">
          Post Opportunity
        </button>
      </form>
    </section>
  );
}
