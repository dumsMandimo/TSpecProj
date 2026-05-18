import { db } from './firebase';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import emailjs from '@emailjs/browser';                                        // <-- ADDED

const EMAILJS_SERVICE_ID  = process.env.REACT_APP_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY  = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;

export async function getAdminDashboard() {
  try {
    const opportunitiesRef = collection(db, 'opportunities');

    const [totalSnap, pendingSnap, approvedSnap] = await Promise.all([
      getDocs(opportunitiesRef),
      getDocs(query(opportunitiesRef, where('status', '==', 'pending'))),
      getDocs(query(opportunitiesRef, where('status', '==', 'approved'))),
    ]);

    return {
      total: totalSnap.size,
      pending: pendingSnap.size,
      approved: approvedSnap.size,
    };
  } catch (error) {
    console.error('getAdminDashboard error:', error);
    throw error;
  }
}

export async function getPendingProviders() {
  try {
    const snap = await getDocs(
      query(collection(db, 'users'), where('role', '==', 'provider'), where('status', '==', 'pending'))
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('getPendingProviders error:', error);
    throw error;
  }
}

export async function approveProvider(uid, provider) {                         // <-- ADDED provider param
  try {
    await updateDoc(doc(db, 'users', uid), { status: 'approved' });

    await emailjs.send(                                                        // <-- ADDED
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        to_email:          provider.email,
        contact_name:      provider.contactName,
        organisation_name: provider.organisationName,
        app_url:           window.location.origin,
      },
      EMAILJS_PUBLIC_KEY
    );
  } catch (error) {
    console.error('approveProvider error:', error);
    throw error;
  }
}

export async function rejectProvider(uid) {
  try {
    await updateDoc(doc(db, 'users', uid), { status: 'rejected' });
  } catch (error) {
    console.error('rejectProvider error:', error);
    throw error;
  }
}