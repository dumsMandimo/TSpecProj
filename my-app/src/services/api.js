import { db } from './firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export async function getAdminDashboard() {
  try {
    const opportunitiesRef = collection(db, 'opportunities');

    // Fetch all three counts in parallel
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