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
  const knownApplicationIds = useRef(null);

  useEffect(() => {
    if (!providerUid) return;

    // ── Load last known statuses from localStorage ────────────────────────────
    const storageKey     = `listing_statuses_${providerUid}`;
    const appStorageKey  = `known_applications_${providerUid}`;

    const savedStatuses = JSON.parse(localStorage.getItem(storageKey) || "{}");
    const savedAppIds   = JSON.parse(localStorage.getItem(appStorageKey) || "[]");

    prevListingStatuses.current  = savedStatuses;
    knownApplicationIds.current  = new Set(savedAppIds);

    // ── 1. Watch listings for status changes ──────────────────────────────────
    const listingsQuery = query(
      collection(db, "opportunities"),
      where("providerUid", "==", providerUid)
    );

    const unsubListings = onSnapshot(listingsQuery, async (snapshot) => {
      const updatedStatuses = { ...prevListingStatuses.current };

      for (const change of snapshot.docChanges()) {
        const listing    = { id: change.doc.id, ...change.doc.data() };
        const prevStatus = prevListingStatuses.current[listing.id];
        const newStatus  = listing.status;

        updatedStatuses[listing.id] = newStatus;

        // Fire if status changed from what we last knew
        // This catches changes that happened while the app was closed
        if (prevStatus && prevStatus !== newStatus) {
          if (newStatus === "approved") {
            await safeWriteNotification({
              userId: providerUid,
              type:   "listing_approved",
              title:  `Listing approved: ${listing.title}`,
              body:   `Your listing "${listing.title}" has been approved and is now visible to applicants.`,
            });
          }

          if (newStatus === "rejected") {
            await safeWriteNotification({
              userId: providerUid,
              type:   "listing_rejected",
              title:  `Listing rejected: ${listing.title}`,
              body:   `Your listing "${listing.title}" was not approved by an admin. Please review and resubmit.`,
            });
          }
        }

        // If no previous record at all, just record current status silently
        if (!prevStatus) {
          updatedStatuses[listing.id] = newStatus;
        }
      }

      // Save updated statuses to localStorage for next session
      prevListingStatuses.current = updatedStatuses;
      localStorage.setItem(storageKey, JSON.stringify(updatedStatuses));
    });

    // ── 2. Watch applications for new submissions ─────────────────────────────
    const setupApplicationWatcher = async () => {
      const listingsSnap   = await getDocs(listingsQuery);
      const opportunityIds = listingsSnap.docs.map((d) => d.id);

      if (opportunityIds.length === 0) return () => {};

      const chunks = [];
      for (let i = 0; i < opportunityIds.length; i += 30) {
        chunks.push(opportunityIds.slice(i, i + 30));
      }

      const opportunityTitleMap = {};
      listingsSnap.docs.forEach((d) => {
        opportunityTitleMap[d.id] = d.data().title ?? "Untitled";
      });

      const appsQuery = query(
        collection(db, "applications"),
        where("opportunityId", "in", chunks[0])
      );

      const unsubApps = onSnapshot(appsQuery, async (snapshot) => {
        const newIds = [];

        for (const change of snapshot.docChanges()) {
          if (change.type !== "added") continue;

          const appId = change.doc.id;

          // Already knew about this one — skip
          if (knownApplicationIds.current.has(appId)) continue;

          knownApplicationIds.current.add(appId);
          newIds.push(appId);

          const app              = change.doc.data();
          const opportunityTitle = opportunityTitleMap[app.opportunityId] ?? "an opportunity";

          let applicantName = "Someone";

          try {
            const userSnap = await getDoc(doc(db, "users", app.userId));
            if (userSnap.exists()) {
              const u = userSnap.data();
              applicantName = u.firstName && u.lastName
                ? `${u.firstName} ${u.lastName}`
                : u.email ?? "Someone";
            }
          } catch {}

          if (applicantName === "Someone") {
            try {
              const applicantSnap = await getDoc(doc(db, "applicants", app.userId));
              if (applicantSnap.exists()) {
                applicantName = applicantSnap.data().name ?? "Someone";
              }
            } catch {}
          }

          await safeWriteNotification({
            userId:        providerUid,
            type:          "new_application",
            title:         "New Application Received",
            body:          `${applicantName} has applied for "${opportunityTitle}".`,
            applicationId: appId,
          });
        }

        // Save updated known application IDs to localStorage
        if (newIds.length > 0) {
          localStorage.setItem(
            appStorageKey,
            JSON.stringify([...knownApplicationIds.current])
          );
        }
      });

      return unsubApps;
    };

    let unsubApps = () => {};
    setupApplicationWatcher().then((unsub) => {
      if (unsub) unsubApps = unsub;
    });

    return () => {
      unsubListings();
      unsubApps();
    };
  }, [providerUid]);
}

// ── Duplicate-safe notification writer ───────────────────────────────────────

async function safeWriteNotification({ userId, type, title, body, applicationId = null }) {
  try {
    const fiveMinutesAgo = Timestamp.fromMillis(Date.now() - 5 * 60 * 1000);

    const existing = await getDocs(
      query(
        collection(db, "notifications"),
        where("userId",    "==", userId),
        where("type",      "==", type),
        where("title",     "==", title),
        where("createdAt", ">",  fiveMinutesAgo)
      )
    );

    if (!existing.empty) {
      console.log("Duplicate notification skipped:", title);
      return;
    }

    await addDoc(collection(db, "notifications"), {
      userId,
      type,
      title,
      body,
      read:      false,
      createdAt: serverTimestamp(),
      ...(applicationId ? { applicationId } : {}),
    });

    console.log("Notification written:", title);
  } catch (err) {
    console.error("Failed to write notification:", err);
  }
}