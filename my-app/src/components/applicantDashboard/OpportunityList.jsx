import { useEffect, useMemo, useState } from "react";
import { db, auth } from "../../firebase";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  Timestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import "./OpportunityList.css";

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeList(values) {
  if (Array.isArray(values)) {
    return values.map(normalizeText).filter(Boolean);
  }

  if (typeof values === "string" && values.trim()) {
    return values.split(",").map(normalizeText).filter(Boolean);
  }

  return [];
}

function getApplicantNqfLevel(applicant) {
  if (!applicant) return null;

  if (typeof applicant.nqfLevel === "number") {
    return applicant.nqfLevel;
  }

  const qualificationText = applicant.qualification || "";
  const match = String(qualificationText).match(/NQF\s*(?:Level\s*)?(\d+)/i);

  return match ? Number(match[1]) : null;
}

function getMatchDetails(applicant, opportunity) {
  if (!applicant) {
    return {
      score: 0,
      label: "Login to check match",
      className: "neutral",
      matchedRequiredSkills: [],
      missingRequiredSkills: [],
      matchedPreferredSkills: [],
      reasons: [],
    };
  }

  let score = 0;
  const reasons = [];

  const applicantNqfLevel = getApplicantNqfLevel(applicant);
  const minimumNqfLevel = opportunity.minimumNqfLevel
    ? Number(opportunity.minimumNqfLevel)
    : null;

  const applicantSkills = normalizeList(
    applicant.normalizedSkills || applicant.skills || applicant.skillsText,
  );

  const requiredSkills = normalizeList(
    opportunity.normalizedRequiredSkills ||
      opportunity.requiredSkills ||
      opportunity.requiredSkillsText,
  );

  const preferredSkills = normalizeList(
    opportunity.normalizedPreferredSkills ||
      opportunity.preferredSkills ||
      opportunity.preferredSkillsText,
  );

  const matchedRequiredSkills = requiredSkills.filter((skill) =>
    applicantSkills.includes(skill),
  );

  const missingRequiredSkills = requiredSkills.filter(
    (skill) => !applicantSkills.includes(skill),
  );

  const matchedPreferredSkills = preferredSkills.filter((skill) =>
    applicantSkills.includes(skill),
  );

  if (
    applicant.sector &&
    opportunity.sector &&
    applicant.sector === opportunity.sector
  ) {
    score += 30;
    reasons.push("Sector match");
  }

  if (minimumNqfLevel && applicantNqfLevel) {
    if (applicantNqfLevel >= minimumNqfLevel) {
      score += 25;
      reasons.push(`Meets minimum NQF ${minimumNqfLevel}`);
    } else {
      score -= 20;
      reasons.push(`Below minimum NQF ${minimumNqfLevel}`);
    }
  }

  if (
    opportunity.preferredLearningArea &&
    (applicant.saqaLearningArea === opportunity.preferredLearningArea ||
      applicant.learningSubfield === opportunity.preferredLearningArea)
  ) {
    score += 20;
    reasons.push("Learning area match");
  }

  if (opportunity.requiredQualificationId && applicant.saqaQualificationId) {
    if (opportunity.requiredQualificationId === applicant.saqaQualificationId) {
      score += 25;
      reasons.push("Specific qualification match");
    }
  } else if (
    opportunity.requiredQualificationTitle &&
    applicant.qualificationTitle &&
    normalizeText(opportunity.requiredQualificationTitle) ===
      normalizeText(applicant.qualificationTitle)
  ) {
    score += 20;
    reasons.push("Specific qualification match");
  }

  if (requiredSkills.length > 0) {
    score += matchedRequiredSkills.length * 10;

    if (matchedRequiredSkills.length === requiredSkills.length) {
      score += 15;
      reasons.push("All required skills matched");
    } else if (matchedRequiredSkills.length > 0) {
      reasons.push(
        `${matchedRequiredSkills.length}/${requiredSkills.length} required skills matched`,
      );
    } else {
      reasons.push("Required skills missing");
    }
  }

  if (preferredSkills.length > 0 && matchedPreferredSkills.length > 0) {
    score += matchedPreferredSkills.length * 5;
    reasons.push(`${matchedPreferredSkills.length} preferred skill match`);
  }

  let label = "Partial match";
  let className = "partial";

  if (score >= 80) {
    label = "Strong match";
    className = "strong";
  } else if (score >= 50) {
    label = "Good match";
    className = "good";
  } else if (
    minimumNqfLevel &&
    applicantNqfLevel &&
    applicantNqfLevel < minimumNqfLevel
  ) {
    label = "Below NQF requirement";
    className = "low";
  } else if (score < 25) {
    label = "Low match";
    className = "low";
  }

  return {
    score,
    label,
    className,
    matchedRequiredSkills,
    missingRequiredSkills,
    matchedPreferredSkills,
    reasons,
  };
}

function OpportunityList(props) {
  const [opportunities, setOpportunities] = useState([]);
  const [user, setUser] = useState(null);
  const [applicantProfile, setApplicantProfile] = useState(null);

  const [fetchedAppliedIds, setFetchedAppliedIds] = useState(new Set());
  const [sessionApplied, setSessionApplied] = useState(new Set());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setFetchedAppliedIds(new Set());
    setSessionApplied(new Set());
    setApplicantProfile(null);
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const fetchApplicantProfile = async () => {
      try {
        const profileSnap = await getDoc(doc(db, "applicants", user.uid));

        if (profileSnap.exists()) {
          setApplicantProfile(profileSnap.data());
        }
      } catch (error) {
        console.error("Error fetching applicant profile:", error);
      }
    };

    fetchApplicantProfile();
  }, [user]);

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const q = query(
          collection(db, "opportunities"),
          where("status", "==", "approved"),
        );

        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((opportunityDoc) => ({
          id: opportunityDoc.id,
          ...opportunityDoc.data(),
        }));

        setOpportunities(data);
      } catch (error) {
        console.error("Error fetching opportunities:", error);
      }
    };

    fetchOpportunities();
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchApps = async () => {
      const q = query(
        collection(db, "applications"),
        where("userId", "==", user.uid),
      );

      const snapshot = await getDocs(q);
      const ids = new Set(
        snapshot.docs.map(
          (applicationDoc) => applicationDoc.data().opportunityId,
        ),
      );

      setFetchedAppliedIds(ids);
    };

    fetchApps();
  }, [user]);

  const handleApply = async (opportunity) => {
    if (!user) {
      alert("Please log in first");
      return;
    }

    if (
      fetchedAppliedIds.has(opportunity.id) ||
      sessionApplied.has(opportunity.id)
    ) {
      alert("You already applied for this opportunity");
      return;
    }

    try {
      const stages = [
        "Submitted",
        "Received",
        "Under Evaluation",
        "Final Decision",
      ];
      const newStatus = "Submitted";
      const stageIndex = stages.indexOf(newStatus);

      const applicationData = {
        userId: user.uid,
        opportunityId: opportunity.id,
        title: opportunity.title || "",
        company: opportunity.company || opportunity.companyName || "",
        status: newStatus,
        stageIndex: stageIndex,
        appliedAt: Timestamp.now(),
      };

      const docRef = await addDoc(
        collection(db, "applications"),
        applicationData,
      );

      await addDoc(collection(db, "notifications"), {
        userId: user.uid,
        title: "Application submitted",
        body: `Your application for ${opportunity.title} has been submitted.`,
        read: false,
        type: "status_update",
        createdAt: Timestamp.now(),
      });

      setSessionApplied((prev) => new Set([...prev, opportunity.id]));

      const newApp = { id: docRef.id, ...applicationData };

      if (props.onApplicationAdded) {
        props.onApplicationAdded(newApp);
      }

      alert("Application submitted!");
    } catch (error) {
      console.error("Error applying:", error);
      alert("Failed to submit application. Please try again.");
    }
  };

  const visibleOpportunities = useMemo(() => {
    return opportunities
      .filter(
        (opp) => !fetchedAppliedIds.has(opp.id) && !sessionApplied.has(opp.id),
      )
      .map((opportunity) => ({
        ...opportunity,
        match: getMatchDetails(applicantProfile, opportunity),
      }))
      .sort((a, b) => b.match.score - a.match.score);
  }, [opportunities, fetchedAppliedIds, sessionApplied, applicantProfile]);

  return (
    <section className="opportunities-page">
      <header className="opportunities-header">
        <p className="eyebrow">Opportunities</p>
        <h1 className="opportunities-title">Available Opportunities</h1>
        <p className="opportunities-subtitle">
          Find and apply for learnerships, internships and apprenticeships
        </p>
      </header>

      <section className="opportunities-grid">
        {opportunities.length === 0 && (
          <p>No opportunities available at the moment.</p>
        )}

        {visibleOpportunities.map((opportunity) => (
          <article key={opportunity.id} className="opportunity-card">
            <div className="opportunity-card__header">
              <h3 className="opportunity-card__title">{opportunity.title}</h3>

              <div className="opportunity-card__badges">
                {opportunity.type && (
                  <span className="opportunity-card__type">
                    {opportunity.type}
                  </span>
                )}

                <span
                  className={`opportunity-card__match opportunity-card__match--${opportunity.match.className}`}
                >
                  {opportunity.match.label}
                </span>
              </div>
            </div>

            <div className="opportunity-card__meta">
              <p className="opportunity-card__provider">
                {opportunity.company || opportunity.companyName}
              </p>

              {opportunity.location && (
                <p className="opportunity-card__location">
                  📍 {opportunity.location}
                </p>
              )}

              {opportunity.stipend && (
                <p className="opportunity-card__stipend">
                  💰 {opportunity.stipend}
                </p>
              )}

              {opportunity.sector && (
                <p className="opportunity-card__location">
                  🧭 Sector: {opportunity.sector}
                </p>
              )}

              {opportunity.minimumNqfLevel && (
                <p className="opportunity-card__location">
                  🎓 Minimum NQF: {opportunity.minimumNqfLevel}
                </p>
              )}

              {opportunity.requiredQualificationTitle && (
                <p className="opportunity-card__location">
                  📘 Qualification: {opportunity.requiredQualificationTitle}
                </p>
              )}

              {opportunity.preferredLearningArea && (
                <p className="opportunity-card__location">
                  🧩 Learning area: {opportunity.preferredLearningArea}
                </p>
              )}
            </div>

            {opportunity.description && (
              <p className="opportunity-card__description">
                {opportunity.description}
              </p>
            )}

            {opportunity.requiredSkills?.length > 0 && (
              <div className="opportunity-card__skills">
                <p className="opportunity-card__skills-label">
                  Required skills:
                </p>
                <ul className="opportunity-card__chip-list">
                  {opportunity.requiredSkills.map((skill) => (
                    <li
                      key={normalizeText(skill)}
                      className={`opportunity-card__chip ${
                        opportunity.match.matchedRequiredSkills.includes(
                          normalizeText(skill),
                        )
                          ? "opportunity-card__chip--matched"
                          : "opportunity-card__chip--missing"
                      }`}
                    >
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {opportunity.preferredSkills?.length > 0 && (
              <div className="opportunity-card__skills">
                <p className="opportunity-card__skills-label">
                  Preferred skills:
                </p>
                <ul className="opportunity-card__chip-list">
                  {opportunity.preferredSkills.map((skill) => (
                    <li
                      key={normalizeText(skill)}
                      className={`opportunity-card__chip ${
                        opportunity.match.matchedPreferredSkills.includes(
                          normalizeText(skill),
                        )
                          ? "opportunity-card__chip--matched"
                          : ""
                      }`}
                    >
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {opportunity.match.reasons.length > 0 && (
              <p className="opportunity-card__match-reasons">
                {opportunity.match.reasons.slice(0, 3).join(" • ")}
              </p>
            )}

            {opportunity.companyUrl && (
              <a
                href={opportunity.companyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="opportunity-card__link"
              >
                More about {opportunity.company || "this provider"}
              </a>
            )}

            <div className="opportunity-card__footer">
              {opportunity.closingDate && (
                <p
                  className="opportunity-card__location"
                  style={{ marginBottom: "0.5rem" }}
                >
                  📅 Closes: {opportunity.closingDate}
                </p>
              )}

              <button
                className="opportunity-card__apply-btn"
                onClick={() => handleApply(opportunity)}
                disabled={sessionApplied.has(opportunity.id)}
              >
                {sessionApplied.has(opportunity.id) ? "Applied" : "Apply Now"}
              </button>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}

export default OpportunityList;
