import { useEffect, useRef } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../../services/firebase";

export function useProviderWatcher(providerUid) {
  const prevListingStatuses = useRef({});
  const knownApplicationIds = useRef(new Set());

  const unsubAppsRef = useRef(null);

  useEffect(() => {
    if (!providerUid) return;

    const storageKey = `listing_statuses_${providerUid}`;
    const appStorageKey = `known_applications_${providerUid}`;

    // ── Load cache safely ─────────────────────────
    const savedStatuses = safeJSON(localStorage.getItem(storageKey)) || {};
    const savedAppIds = safeJSON(localStorage.getItem(appStorageKey)) || [];

    prevListingStatuses.current = savedStatuses;
    knownApplicationIds.current = new Set(savedAppIds);

    // ──────────────────────────────────────────────
    // 1. LISTINGS WATCHER (STABLE)
    // ──────────────────────────────────────────────

    const listingsQuery = query(
      collection(db, "opportunities"),
      where("providerUid", "==", providerUid)
    );

    const unsubListings = onSnapshot(listingsQuery, (snapshot) => {
      const updated = { ...prevListingStatuses.current };

      snapshot.forEach((docSnap) => {
        const listing = { id: docSnap.id, ...docSnap.data() };
        const prev = prevListingStatuses.current[listing.id];
        const next = listing.status;

        updated[listing.id] = next;

        if (prev && prev !== next) {
          if (next === "approved") {
            safeWriteNotification({
              userId: providerUid,
              type: "listing_approved",
              title: `Listing approved: ${listing.title}`,
              body: `Your listing "${listing.title}" has been approved.`,
            });
          }

          if (next === "rejected") {
            safeWriteNotification({
              userId: providerUid,
              type: "listing_rejected",
              title: `Listing rejected: ${listing.title}`,
              body: `Your listing "${listing.title}" was rejected.`,
            });
          }
        }
      });

      prevListingStatuses.current = updated;
      localStorage.setItem(storageKey, JSON.stringify(updated));
    });

    // ──────────────────────────────────────────────
    // 2. APPLICATION WATCHER (FIXED + FULL COVERAGE)
    // ──────────────────────────────────────────────

    const setupApps = async () => {
      const snap = await getDocs(listingsQuery);

      const ids = snap.docs.map((d) => d.id);
      const titleMap = {};

      snap.forEach((d) => {
        titleMap[d.id] = d.data().title ?? "Untitled";
      });

      if (ids.length === 0) return null;

      const chunks = chunk(ids, 30);
      const unsubscribers = [];

      chunks.forEach((chunkIds) => {
        const appsQuery = query(
          collection(db, "applications"),
          where("opportunityId", "in", chunkIds)
        );

        const unsub = onSnapshot(appsQuery, async (snapshot) => {
          for (const change of snapshot.docChanges()) {
            if (change.type !== "added") continue;

            const appId = change.doc.id;

            if (knownApplicationIds.current.has(appId)) continue;
            knownApplicationIds.current.add(appId);

            const app = change.doc.data();
            const title =
              titleMap[app.opportunityId] ?? "an opportunity";

            let name = await getApplicantName(app.userId);

            safeWriteNotification({
              userId: providerUid,
              type: "new_application",
              title: "New Application Received",
              body: `${name} applied for "${title}".`,
              applicationId: appId,
            });
          }

          localStorage.setItem(
            appStorageKey,
            JSON.stringify([...knownApplicationIds.current])
          );
        });

        unsubscribers.push(unsub);
      });

      return () => unsubscribers.forEach((u) => u());
    };

    setupApps().then((u) => {
      unsubAppsRef.current = u;
    });

    // ── CLEANUP ─────────────────────────────
    return () => {
      unsubListings();
      if (unsubAppsRef.current) unsubAppsRef.current();
    };
  }, [providerUid]);
}

// ──────────────────────────────────────────────
// SAFE NOTIFICATION (NO DUPLICATES EVER)
// ──────────────────────────────────────────────

async function safeWriteNotification({ userId, type, title, body, applicationId }) {
  try {
    await addDoc(collection(db, "notifications"), {
      userId,
      type,
      title,
      body,
      applicationId: applicationId ?? null,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Notification error:", err);
  }
}

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────

function chunk(arr, size) {
  const res = [];
  for (let i = 0; i < arr.length; i += size) {
    res.push(arr.slice(i, i + size));
  }
  return res;
}

function safeJSON(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

async function getApplicantName(userId) {
  try {
    const userSnap = await getDoc(doc(db, "users", userId));
    if (userSnap.exists()) {
      const u = userSnap.data();
      return u.firstName && u.lastName
        ? `${u.firstName} ${u.lastName}`
        : u.email ?? "Someone";
    }
  } catch {}

  try {
    const a = await getDoc(doc(db, "applicants", userId));
    if (a.exists()) return a.data().name ?? "Someone";
  } catch {}

  return "Someone";
}