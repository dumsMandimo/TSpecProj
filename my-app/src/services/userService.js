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

export const subscribeToOpportunities = (onData, onError) => {
  const q = query(
    collection(db, "opportunities"),
    where("status", "==", "approved")
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

export const subscribeToMyApplications = (onData, onError) => {
  const user = auth.currentUser;
  if (!user) {
    onData([]);
    return () => {};
  }

  const q = query(
    collection(db, "applications"),
    where("applicantId", "==", user.uid)
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

export const applyToOpportunity = async (opportunity) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated.");

  const existingQuery = query(
    collection(db, "applications"),
    where("applicantId", "==", user.uid),
    where("opportunityId", "==", opportunity.id)
  );
  const existingSnap = await getDocs(existingQuery);
  if (!existingSnap.empty) throw new Error("Already applied to this opportunity.");

  const userSnap = await getDoc(doc(db, "users", user.uid));
  const applicantName = userSnap.exists()
    ? userSnap.data().name || user.displayName || user.email
    : user.displayName || user.email;

  await addDoc(collection(db, "applications"), {
    applicantId: user.uid,
    opportunityId: opportunity.id,
    providerUid: opportunity.providerUid,
    applicantName,
    opportunityTitle: opportunity.title,
    title: opportunity.title,
    company: opportunity.providerName || "Unknown Provider",
    location: opportunity.location || "",
    type: opportunity.type || "",
    status: "Submitted",
    stageIndex: 0,
    appliedAt: serverTimestamp(),
  });
};
