import { useState } from "react";
import { createOpportunity } from "../../../services/providerService";
import { auth } from "../../../services/firebase";
import "./CreateOpportunityForm.css";

const EMPTY_FORM = {
  title:       "",
  location:    "",
  stipend:     "",
  description: "",
  type:        "learnership",
};

export default function CreateOpportunityForm() {
  const [form, setForm]         = useState(EMPTY_FORM);
  const [errors, setErrors]     = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const validate = () => {
    const next = {};
    if (!form.title.trim())       next.title       = "Title is required.";
    if (!form.location.trim())    next.location    = "Location is required.";
    if (!form.description.trim()) next.description = "Description is required.";
    return next;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setSuccessMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      const uid = auth.currentUser?.uid;
      await createOpportunity({ ...form, providerUid: uid, status: "pending" });
      setForm(EMPTY_FORM);
      setSuccessMsg("Opportunity posted successfully and is pending review.");
    }  catch (err) {
  console.error("Create opportunity error:", err);
  setErrors({ submit: "Failed to post opportunity. Please try again." });
}
    finally {
      setSubmitting(false);
    }
  };

  return (
    <section aria-label="Post new opportunity">
      <header className="create-form__header">
        <h2 className="create-form__title">Post New Opportunity</h2>
        <p className="create-form__subtitle">Fill in the details below to post a learnership or internship.</p>
      </header>

      {successMsg && (
        <p className="create-form__success" role="status">{successMsg}</p>
      )}
      {errors.submit && (
        <p className="create-form__error" role="alert">{errors.submit}</p>
      )}

      <form className="create-form__form" onSubmit={handleSubmit} noValidate>
        <fieldset className="create-form__fieldset">
          <legend className="create-form__legend">Opportunity details</legend>

          <section className="create-form__row create-form__row--half">
            <label className="create-form__label" htmlFor="opp-title">
              Title <span aria-hidden="true">*</span>
            </label>
            <input
              id="opp-title"
              className={`create-form__input${errors.title ? " create-form__input--error" : ""}`}
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Software Development Learnership"
              aria-required="true"
              aria-describedby={errors.title ? "opp-title-err" : undefined}
            />
            {errors.title && (
              <p id="opp-title-err" className="create-form__field-error" role="alert">{errors.title}</p>
            )}
          </section>

          <section className="create-form__row create-form__row--half">
            <label className="create-form__label" htmlFor="opp-type">
              Type
            </label>
            <select
              id="opp-type"
              className="create-form__select"
              name="type"
              value={form.type}
              onChange={handleChange}
            >
              <option value="learnership">Learnership</option>
              <option value="internship">Internship</option>
              <option value="apprenticeship">Apprenticeship</option>
              <option value="graduate">Graduate Programme</option>
            </select>
          </section>

          <section className="create-form__row create-form__row--half">
            <label className="create-form__label" htmlFor="opp-location">
              Location <span aria-hidden="true">*</span>
            </label>
            <input
              id="opp-location"
              className={`create-form__input${errors.location ? " create-form__input--error" : ""}`}
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="e.g. Johannesburg, Gauteng"
              aria-required="true"
              aria-describedby={errors.location ? "opp-location-err" : undefined}
            />
            {errors.location && (
              <p id="opp-location-err" className="create-form__field-error" role="alert">{errors.location}</p>
            )}
          </section>

          <section className="create-form__row create-form__row--half">
            <label className="create-form__label" htmlFor="opp-stipend">
              Stipend (optional)
            </label>
            <input
              id="opp-stipend"
              className="create-form__input"
              type="text"
              name="stipend"
              value={form.stipend}
              onChange={handleChange}
              placeholder="e.g. R3 500/month"
            />
          </section>

          <section className="create-form__row">
            <label className="create-form__label" htmlFor="opp-description">
              Description <span aria-hidden="true">*</span>
            </label>
            <textarea
              id="opp-description"
              className={`create-form__textarea${errors.description ? " create-form__input--error" : ""}`}
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe responsibilities, requirements, and duration..."
              rows={5}
              aria-required="true"
              aria-describedby={errors.description ? "opp-desc-err" : undefined}
            />
            {errors.description && (
              <p id="opp-desc-err" className="create-form__field-error" role="alert">{errors.description}</p>
            )}
          </section>
        </fieldset>

        <footer className="create-form__footer">
          <button
            className="create-form__submit-btn"
            type="submit"
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? "Posting..." : "Post Opportunity"}
          </button>
        </footer>
      </form>
    </section>
  );
}
