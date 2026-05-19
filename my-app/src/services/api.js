import { db } from './firebase';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';  // <-- ADDED doc, updateDoc

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

// <-- ADDED: fetch all pending providers
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

// <-- ADDED: approve a provider
export async function approveProvider(uid) {
  try {
    await updateDoc(doc(db, 'users', uid), { status: 'approved' });
  } catch (error) {
    console.error('approveProvider error:', error);
    throw error;
  }
}

// <-- ADDED: reject a provider
export async function rejectProvider(uid) {
  try {
    await updateDoc(doc(db, 'users', uid), { status: 'rejected' });
  } catch (error) {
    console.error('rejectProvider error:', error);
    throw error;
  }
}