import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "./firebase";

/**
 * ================================
 * GET PROVIDER OVERVIEW STATS
 * ================================
 */
export const getProviderStats = async (providerUid) => {
  const listingsSnap = await getDocs(
    query(collection(db, "opportunities"), where("providerUid", "==", providerUid))
  );

  const listingIds = listingsSnap.docs.map((d) => d.id);

  if (listingIds.length === 0) {
    return { listings: 0, applications: 0, shortlisted: 0, accepted: 0 };
  }

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

  return { listings: listingsSnap.size, applications, shortlisted, accepted };
};

/**
 * ================================
 * REAL-TIME LISTINGS LISTENER
 * ================================
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
 * REAL-TIME APPLICATIONS LISTENER       ✅ FIXED
 * ================================
 * Step 1: get all opportunityIds owned by this provider
 * Step 2: subscribe to applications that match those ids
 */
export const subscribeToProviderApplications = (providerUid, onData, onError) => {
  // First get all this provider's opportunity IDs
  const listingsQuery = query(
    collection(db, "opportunities"),
    where("providerUid", "==", providerUid)
  );

  // We subscribe to listings first, then reactively subscribe to their applications
  const unsubscribeListings = onSnapshot(listingsQuery, (listingsSnap) => {
    const opportunityIds = listingsSnap.docs.map((d) => d.id);

    if (opportunityIds.length === 0) {
      onData([]); // provider has no listings yet, so no applications possible
      return;
    }

    // Firestore 'in' supports max 30 items — chunk if needed
    const chunks = [];
    for (let i = 0; i < opportunityIds.length; i += 30) {
      chunks.push(opportunityIds.slice(i, i + 30));
    }

    // Subscribe to applications for the first chunk
    // For most providers this is one chunk — extend if you need pagination
    const appsQuery = query(
      collection(db, "applications"),
      where("opportunityId", "in", chunks[0])  // ✅ correct field
    );

    onSnapshot(
      appsQuery,
      (appsSnap) => {
        const apps = appsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        onData(apps);
      },
      onError
    );
  }, onError);

  return unsubscribeListings;
};

/**
 * ================================
 * CREATE OPPORTUNITY               ✅ FIXED — saves providerName
 * ================================
 */
export const createOpportunity = async (data) => {
  const user = auth.currentUser;

  const docRef = await addDoc(collection(db, "opportunities"), {
    ...data,
    providerName: user?.displayName || user?.email || "Unknown Provider", // ✅ saved for applicants to see
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