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
} from "firebase/firestore";
import { db } from "../../../services/firebase";

export function useProviderWatcher(providerUid) {
  const prevListingStatuses = useRef({});
  const knownApplicationIds = useRef(null);

  useEffect(() => {
    if (!providerUid) return;

    // ── 1. Watch listings for status changes ──────────────────────────────────
    const listingsQuery = query(
      collection(db, "opportunities"),
      where("providerUid", "==", providerUid)
    );

    const unsubListings = onSnapshot(listingsQuery, async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        const listing    = { id: change.doc.id, ...change.doc.data() };
        const prevStatus = prevListingStatuses.current[listing.id];
        const newStatus  = listing.status;

        prevListingStatuses.current[listing.id] = newStatus;

        // Skip first load — don't fire for already-existing statuses
        if (prevStatus === undefined) continue;
        if (prevStatus === newStatus) continue;

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
        // First snapshot — just record existing IDs, don't notify
        if (knownApplicationIds.current === null) {
          knownApplicationIds.current = new Set(snapshot.docs.map((d) => d.id));
          return;
        }

        for (const change of snapshot.docChanges()) {
          if (change.type !== "added") continue;

          const appId = change.doc.id;
          if (knownApplicationIds.current.has(appId)) continue;
          knownApplicationIds.current.add(appId);

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
    // Check if an identical notification already exists — prevents duplicates
    // if the admin's code also writes the same notification
    const existing = await getDocs(
      query(
        collection(db, "notifications"),
        where("userId", "==", userId),
        where("type",   "==", type),
        where("title",  "==", title)
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
  } catch (err) {
    console.error("Failed to write notification:", err);
  }
}