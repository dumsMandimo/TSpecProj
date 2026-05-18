import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  doc,
  getDocs,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import emailjs from "@emailjs/browser";

const EMAILJS_SERVICE_ID  = "service_8kh0eg8";
const EMAILJS_TEMPLATE_ID = "template_e2i8xht";
const EMAILJS_PUBLIC_KEY  = "c9_VF6jX5UlCoNBZn";

// ── Email ─────────────────────────────────────────────────────────────────────

const sendEmail = async ({ to, toName, subject, message }) => {
  try {
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      { to_email: to, to_name: toName, subject, message },
      EMAILJS_PUBLIC_KEY
    );
  } catch (err) {
    console.error("Email failed to send:", err);
  }
};

// ── Notifications ─────────────────────────────────────────────────────────────

export const writeNotification = async ({ userId, type, title, body, applicationId = null }) => {
  try {
    await addDoc(collection(db, "notifications"), {
      userId,
      type,
      title,
      body,
      read: false,
      createdAt: serverTimestamp(),
      ...(applicationId ? { applicationId } : {}),
    });
  } catch (err) {
    console.error("Failed to write notification:", err);
  }
};

export const subscribeToProviderNotifications = (providerUid, onData, onError) => {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", providerUid)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const notifications = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      onData(notifications);
    },
    onError
  );
};

export const markNotificationRead = async (notificationId) => {
  try {
    await updateDoc(doc(db, "notifications", notificationId), { read: true });
  } catch (err) {
    console.error("Failed to mark notification as read:", err);
  }
};

// ── Stats ─────────────────────────────────────────────────────────────────────

export const getProviderStats = async (providerUid) => {
  const listingsSnap = await getDocs(
    query(collection(db, "opportunities"), where("providerUid", "==", providerUid))
  );

  let approved = 0, pending = 0;

  const listingIds = listingsSnap.docs.map((d) => {
    const s = d.data().status;
    if (s === "approved") approved++;
    if (s === "pending")  pending++;
    return d.id;
  });

  if (listingIds.length === 0) {
    return { listings: 0, approved: 0, pending: 0, applications: 0, shortlisted: 0, accepted: 0 };
  }

  const chunks = [];
  for (let i = 0; i < listingIds.length; i += 30) chunks.push(listingIds.slice(i, i + 30));

  let applications = 0, shortlisted = 0, accepted = 0;

  for (const chunk of chunks) {
    const appSnap = await getDocs(
      query(collection(db, "applications"), where("opportunityId", "in", chunk))
    );
    applications += appSnap.size;
    appSnap.forEach((d) => {
      const s = d.data().status?.toLowerCase();
      if (s === "shortlisted") shortlisted++;
      if (s === "accepted")    accepted++;
    });
  }

  return { listings: listingsSnap.size, approved, pending, applications, shortlisted, accepted };
};

// ── Application counts per listing ───────────────────────────────────────────

export const getApplicationCountsForListings = async (listingIds) => {
  if (!listingIds || listingIds.length === 0) return {};

  const counts = {};
  listingIds.forEach((id) => { counts[id] = 0; });

  const chunks = [];
  for (let i = 0; i < listingIds.length; i += 30) chunks.push(listingIds.slice(i, i + 30));

  for (const chunk of chunks) {
    const snap = await getDocs(
      query(collection(db, "applications"), where("opportunityId", "in", chunk))
    );
    snap.forEach((d) => {
      const oid = d.data().opportunityId;
      if (oid in counts) counts[oid]++;
    });
  }

  return counts;
};

// ── Listings ──────────────────────────────────────────────────────────────────

export const subscribeToProviderListings = (providerUid, onData, onError) => {
  const q = query(
    collection(db, "opportunities"),
    where("providerUid", "==", providerUid)
  );
  return onSnapshot(
    q,
    (snapshot) => { onData(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))); },
    onError
  );
};

export const createOpportunity = async (data) => {
  const user = auth.currentUser;
  const docRef = await addDoc(collection(db, "opportunities"), {
    ...data,
    providerUid:  user?.uid ?? "",
    providerName: user?.displayName || user?.email || "Unknown Provider",
    status:       "pending",
    createdAt:    serverTimestamp(),
  });
  return docRef.id;
};

export const updateOpportunity = async (opportunityId, data) => {
  const ref = doc(db, "opportunities", opportunityId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
};

export const deleteOpportunity = async (opportunityId) => {
  await deleteDoc(doc(db, "opportunities", opportunityId));
};

export const autoCloseExpiredListings = async (providerUid) => {
  const now  = new Date();
  const snap = await getDocs(
    query(
      collection(db, "opportunities"),
      where("providerUid", "==", providerUid),
      where("status", "==", "approved")
    )
  );

  const promises = [];
  snap.forEach((d) => {
    const data        = d.data();
    const closingDate = data.closingDate;
    if (!closingDate) return;

    const closing = closingDate.toDate
      ? closingDate.toDate()
      : new Date(closingDate);

    if (closing < now) {
      promises.push(
        updateDoc(doc(db, "opportunities", d.id), {
          status:    "closed",
          updatedAt: serverTimestamp(),
        })
      );
    }
  });

  await Promise.all(promises);
};

// ── Applications ──────────────────────────────────────────────────────────────

export const subscribeToProviderApplications = (providerUid, onData, onError) => {
  const listingsQuery = query(
    collection(db, "opportunities"),
    where("providerUid", "==", providerUid)
  );

  const unsubscribeListings = onSnapshot(listingsQuery, (listingsSnap) => {
    const opportunityIds = listingsSnap.docs.map((d) => d.id);
    const opportunityTitleMap = {};
    listingsSnap.docs.forEach((d) => {
      opportunityTitleMap[d.id] = d.data().title ?? "Untitled";
    });

    if (opportunityIds.length === 0) { onData([]); return; }

    const chunks = [];
    for (let i = 0; i < opportunityIds.length; i += 30) chunks.push(opportunityIds.slice(i, i + 30));

    const appsQuery = query(
      collection(db, "applications"),
      where("opportunityId", "in", chunks[0])
    );

    onSnapshot(appsQuery, async (appsSnap) => {
      const apps = appsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      const enriched = await Promise.all(
        apps.map(async (app) => {
          let applicantName  = "Unknown";
          let applicantEmail = "";
          let applicantPhone = "";
          let education      = "";
          let skills         = "";
          let interests      = "";
          let cvUrl          = "";

          try {
            const userSnap = await getDoc(doc(db, "users", app.userId));
            if (userSnap.exists()) {
              const u = userSnap.data();
              applicantEmail = u.email ?? "";
              applicantName  = u.firstName && u.lastName
                ? `${u.firstName} ${u.lastName}`
                : u.email ?? "Unknown";
            }
          } catch {}

          try {
            const applicantSnap = await getDoc(doc(db, "applicants", app.userId));
            if (applicantSnap.exists()) {
              const a = applicantSnap.data();
              if (applicantName === "Unknown" && a.name) applicantName = a.name;
              applicantPhone = a.phone     ?? "";
              education      = a.education ?? "";
              skills         = a.skills    ?? "";
              interests      = a.interests ?? "";
              cvUrl          = a.cvUrl     ?? "";
            }
          } catch {}

          return {
            ...app,
            status:           app.status?.toLowerCase() ?? "submitted",
            opportunityTitle: opportunityTitleMap[app.opportunityId] ?? app.title ?? "Untitled",
            applicantName,
            applicantEmail,
            applicantPhone,
            education,
            skills,
            interests,
            cvUrl,
          };
        })
      );

      onData(enriched);
    }, onError);
  }, onError);

  return unsubscribeListings;
};

export const updateApplicationStatus = async (applicationId, newStatus) => {
  const appRef  = doc(db, "applications", applicationId);
  const appSnap = await getDoc(appRef);
  if (!appSnap.exists()) return;

  const { userId, opportunityId, title } = appSnap.data();

  let applicantEmail   = "";
  let applicantName    = "Applicant";
  let opportunityTitle = title ?? "the opportunity";

  try {
    const userSnap = await getDoc(doc(db, "users", userId));
    if (userSnap.exists()) {
      const u = userSnap.data();
      applicantEmail = u.email ?? "";
      applicantName  = u.firstName && u.lastName
        ? `${u.firstName} ${u.lastName}`
        : u.email ?? "Applicant";
    }
  } catch {}

  try {
    const oppSnap = await getDoc(doc(db, "opportunities", opportunityId));
    if (oppSnap.exists()) opportunityTitle = oppSnap.data().title ?? opportunityTitle;
  } catch {}

  await updateDoc(appRef, { status: newStatus, updatedAt: serverTimestamp() });

  const statusMessages = {
    submitted:   "Your application has been received and is pending review.",
    shortlisted: "Great news — you have been shortlisted for this opportunity!",
    accepted:    "Congratulations! Your application has been accepted.",
    rejected:    "Thank you for applying. Unfortunately your application was not successful this time.",
  };

  if (userId && statusMessages[newStatus]) {
    await writeNotification({
      userId,
      type:          "status_update",
      title:         `Application update: ${opportunityTitle}`,
      body:          statusMessages[newStatus],
      applicationId,
    });
  }

  if (applicantEmail && statusMessages[newStatus]) {
    await sendEmail({
      to:      applicantEmail,
      toName:  applicantName,
      subject: `Application update: ${opportunityTitle}`,
      message: statusMessages[newStatus],
    });
  }
};

export const notifyProviderPostStatus = async ({ providerUid, providerEmail, providerName, opportunityTitle, approved }) => {
  const subject = approved
    ? `Your post "${opportunityTitle}" has been approved`
    : `Your post "${opportunityTitle}" was removed`;
  const message = approved
    ? `Your listing "${opportunityTitle}" has been approved and is now visible to applicants.`
    : `Your listing "${opportunityTitle}" was removed by an admin.`;

  if (providerUid) {
    await writeNotification({
      userId: providerUid,
      type:   approved ? "listing_approved" : "listing_rejected",
      title:  subject,
      body:   message,
    });
  }
  if (providerEmail) {
    await sendEmail({ to: providerEmail, toName: providerName, subject, message });
  }
};

export const notifyProviderApproval = async ({ providerUid, providerEmail, providerName, approved }) => {
  const subject = approved
    ? "Your UbuntuCareers provider account has been approved"
    : "Your UbuntuCareers provider account was not approved";
  const message = approved
    ? "Your provider account has been approved. You can now log in and start posting opportunities."
    : "Unfortunately your provider account was not approved at this time. Please contact support for more information.";

  if (providerUid) {
    await writeNotification({
      userId: providerUid,
      type:   approved ? "account_approved" : "account_rejected",
      title:  subject,
      body:   message,
    });
  }
  if (providerEmail) {
    await sendEmail({ to: providerEmail, toName: providerName, subject, message });
  }
};

export const notifyProviderNewApplication = async ({ providerUid, applicantName, opportunityTitle, applicationId }) => {
  await writeNotification({
    userId:        providerUid,
    type:          "new_application",
    title:         "New Application Received",
    body:          `${applicantName} has applied for "${opportunityTitle}".`,
    applicationId,
  });
};