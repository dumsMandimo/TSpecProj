import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * ================================
 * GET PROVIDER OVERVIEW STATS
 * ================================
 * Returns counts of listings, applications, shortlisted and accepted.
 */
export const getProviderStats = async (providerUid) => {
  const listingsSnap = await getDocs(
    query(collection(db, "opportunities"), where("providerUid", "==", providerUid))
  );

  const listingIds = listingsSnap.docs.map((d) => d.id);

  if (listingIds.length === 0) {
    return { listings: 0, applications: 0, shortlisted: 0, accepted: 0 };
  }

  // Firestore 'in' supports max 30 items per query
  const chunks = [];
  for (let i = 0; i < listingIds.length; i += 30) {
    chunks.push(listingIds.slice(i, i + 30));
  }

  let applications = 0;
  let shortlisted  = 0;
  let accepted     = 0;

  for (const chunk of chunks) {
    const appSnap = await getDocs(
      query(collection(db, "applications"), where("opportunityId", "in", chunk))
    );
    applications += appSnap.size;
    appSnap.forEach((d) => {
      if (d.data().status === "shortlisted") shortlisted++;
      if (d.data().status === "accepted")    accepted++;
    });
  }

  return {
    listings:     listingsSnap.size,
    applications,
    shortlisted,
    accepted,
  };
};

/**
 * ================================
 * REAL-TIME LISTINGS LISTENER
 * ================================
 * Calls onData(listings[]) whenever Firestore updates.
 * Returns unsubscribe function — call it in useEffect cleanup.
 */
export const subscribeToProviderListings = (providerUid, onData, onError) => {
  const q = query(
    collection(db, "opportunities"),
    where("providerUid", "==", providerUid)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const listings = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      onData(listings);
    },
    onError
  );
};

/**
 * ================================
 * REAL-TIME APPLICATIONS LISTENER
 * ================================
 * Returns applications for all opportunities owned by this provider.
 */
export const subscribeToProviderApplications = (providerUid, onData, onError) => {
  const q = query(
    collection(db, "applications"),
    where("providerUid", "==", providerUid)
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
 * CREATE OPPORTUNITY
 * ================================
 */
export const createOpportunity = async (data) => {
  const docRef = await addDoc(collection(db, "opportunities"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

/**
 * ================================
 * UPDATE APPLICATION STATUS
 * ================================
 */
export const updateApplicationStatus = async (applicationId, newStatus) => {
  await updateDoc(doc(db, "applications", applicationId), {
    status:    newStatus,
    updatedAt: serverTimestamp(),
  });
};
