import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "./firebase";

/**
 * ================================
 * GET USER ROLE
 * ================================
 */
export const getUserRole = async (uid) => {
  try {
    const userRef = doc(db, "users", uid);
    const snapshot = await getDoc(userRef);
    if (snapshot.exists()) return snapshot.data().role;
    return null;
  } catch (error) {
    console.error("Error fetching user role:", error);
    return null;
  }
};

/**
 * ================================
 * GET USER PROFILE
 * ================================
 */
export const getUserProfile = async (uid) => {
  try {
    const userRef = doc(db, "users", uid);
    const snapshot = await getDoc(userRef);
    if (snapshot.exists()) return { id: snapshot.id, ...snapshot.data() };
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

/**
 * ================================
 * FETCH ALL OPPORTUNITIES (for applicants to browse)
 * ================================
 * Returns a real-time listener — call unsubscribe() on cleanup.
 */
export const subscribeToOpportunities = (onData, onError) => {
  const q = query(
    collection(db, "opportunities"),
    where("status", "==", "approved")  // ✅ applicants only see admin-approved listings
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const opportunities = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      onData(opportunities);
    },
    onError
  );
};

/**
 * ================================
 * FETCH THIS USER'S APPLICATIONS (real-time)
 * ================================
 * Scoped to the logged-in applicant by applicantId.
 * Returns unsubscribe function — call it in useEffect cleanup.
 */
export const subscribeToMyApplications = (onData, onError) => {
  const user = auth.currentUser;
  if (!user) {
    onData([]);
    return () => {};
  }

  const q = query(
    collection(db, "applications"),
    where("applicantId", "==", user.uid)   // ✅ correct field — matches what applyToOpportunity saves
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const apps = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      onData(apps);
    },
    onError
  );
};

/**
 * ================================
 * APPLY TO AN OPPORTUNITY
 * ================================
 * Saves ALL fields needed by both applicant and provider dashboards.
 */
export const applyToOpportunity = async (opportunity) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated.");

  // Prevent duplicate applications
  const existingQuery = query(
    collection(db, "applications"),
    where("applicantId", "==", user.uid),
    where("opportunityId", "==", opportunity.id)
  );
  const existingSnap = await getDocs(existingQuery);
  if (!existingSnap.empty) throw new Error("Already applied to this opportunity.");

  // Fetch applicant's name from users collection
  const userSnap = await getDoc(doc(db, "users", user.uid));
  const applicantName =
    userSnap.exists()
      ? userSnap.data().name || user.displayName || user.email
      : user.displayName || user.email;

  await addDoc(collection(db, "applications"), {
    // --- Links (the bridge between applicant & provider) ---
    applicantId:      user.uid,                                        // ✅ who applied
    opportunityId:    opportunity.id,                                  // ✅ what they applied to
    providerUid:      opportunity.providerUid,                         // ✅ whose listing it is

    // --- Display fields for ApplicationsPanel (provider sees these) ---
    applicantName:    applicantName,                                   // ✅ shown in provider's ApplicationsPanel
    opportunityTitle: opportunity.title,                               // ✅ shown in provider's ApplicationsPanel

    // --- Display fields for MyApplications (applicant sees these) ---
    title:            opportunity.title,                               // ✅ shown on applicant's application card
    company:          opportunity.providerName || "Unknown Provider",  // ✅ shown on applicant's application card
    location:         opportunity.location || "",
    type:             opportunity.type || "",

    // --- Status tracking ---
    status:           "Submitted",
    stageIndex:       0,                                               // ✅ maps to ProgressTracker stages

        appliedAt:        serverTimestamp(),  // ✅ Firestore timestamp
  });
};
