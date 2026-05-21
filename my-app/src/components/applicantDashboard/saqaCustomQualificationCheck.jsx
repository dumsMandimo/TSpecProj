import { useState } from "react";
import { verifyQualificationAgainstSaqa } from "../../services/saqaVerificationService";

/**
 * Drop this component into ApplicantProfile.jsx near your SAQA qualification dropdown.
 *
 * Expected props:
 * - selectedSector: currently selected SAQA field/sector
 * - selectedNqfLevel: currently selected NQF level
 * - onUseMatch(match, result): called when the user accepts a possible SAQA match
 * - onCustomChange(customTitle): optional, keeps parent form updated with custom input
 * - onVerificationChange(result): optional, keeps parent form updated with verification status
 */
export default function SaqaCustomQualificationCheck({
  selectedSector,
  selectedNqfLevel,
  onUseMatch,
  onCustomChange,
  onVerificationChange,
}) {
  const [customQualification, setCustomQualification] = useState("");
  const [checkingSaqa, setCheckingSaqa] = useState(false);
  const [saqaCheck, setSaqaCheck] = useState(null);

  const handleCustomChange = (event) => {
    const value = event.target.value;
    setCustomQualification(value);
    setSaqaCheck(null);

    if (onCustomChange) {
      onCustomChange(value);
    }
  };

  const handleCheckCustomQualification = async () => {
    if (!customQualification.trim()) return;

    setCheckingSaqa(true);
    setSaqaCheck(null);

    try {
      const result = await verifyQualificationAgainstSaqa(customQualification, {
        selectedSector,
        selectedNqfLevel,
      });

      setSaqaCheck(result);

      if (onVerificationChange) {
        onVerificationChange(result);
      }
    } catch (error) {
      console.error("SAQA qualification check failed:", error);

      const result = {
        status: "error",
        bestMatch: null,
        matches: [],
        matchScore: 0,
      };

      setSaqaCheck(result);

      if (onVerificationChange) {
        onVerificationChange(result);
      }
    } finally {
      setCheckingSaqa(false);
    }
  };

  const bestMatchTitle =
    saqaCheck?.bestMatch?.title || saqaCheck?.bestMatch?.label || "";

  return (
    <div className="saqa-custom-check">
      <label>
        Enter qualification name
        <input
          type="text"
          value={customQualification}
          onChange={handleCustomChange}
          placeholder="e.g. Diploma in Software Development"
        />
      </label>

      <button
        type="button"
        onClick={handleCheckCustomQualification}
        disabled={checkingSaqa || !customQualification.trim()}
      >
        {checkingSaqa ? "Checking SAQA..." : "Check against SAQA records"}
      </button>

      {saqaCheck?.status === "matched" && (
        <p className="saqa-check-success">
          SAQA record match found: {bestMatchTitle}
        </p>
      )}

      {saqaCheck?.status === "possible_match" && (
        <div className="saqa-check-warning">
          <p>Possible SAQA match: {bestMatchTitle}</p>

          <button
            type="button"
            onClick={() => onUseMatch?.(saqaCheck.bestMatch, saqaCheck)}
          >
            Yes, use this SAQA match
          </button>
        </div>
      )}

      {saqaCheck?.status === "not_found" && (
        <p className="saqa-check-info">
          No SAQA record match found in the current dataset. This qualification
          can still be saved as a custom qualification for review.
        </p>
      )}

      {saqaCheck?.status === "error" && (
        <p className="saqa-check-error">
          Could not check SAQA records right now. You can still save this as a
          custom qualification.
        </p>
      )}
    </div>
  );
}
