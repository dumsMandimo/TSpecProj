import { db } from './firebase';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import emailjs from '@emailjs/browser';

const EMAILJS_SERVICE_ID  = process.env.REACT_APP_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY  = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;

export async function getAdminDashboard() {
  try {
    const opportunitiesRef = collection(db, 'opportunities');
    const usersRef         = collection(db, 'users');

    const [totalOppsSnap, pendingProvidersSnap, approvedProvidersSnap] = await Promise.all([
      getDocs(opportunitiesRef),
      getDocs(query(usersRef, where('role', '==', 'provider'), where('status', '==', 'pending'))),
      getDocs(query(usersRef, where('role', '==', 'provider'), where('status', '==', 'approved'))),
    ]);

    return {
      totalOpportunities: totalOppsSnap.size,
      pendingApprovals:   pendingProvidersSnap.size,
      totalProviders:     approvedProvidersSnap.size,
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

export async function approveProvider(uid, provider) {
  try {
    
    if (!provider) {
      throw new Error('approveProvider: provider object is missing.');
    }

    if (provider.role !== 'provider') {
      throw new Error(
        `approveProvider: expected role "provider" but got "${provider.role}" for uid "${uid}". ` +
        `Fix this user's role in Firestore before approving.`
      );
    }
    
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      throw new Error(
        'approveProvider: One or more EmailJS env vars are missing. ' +
        'Check REACT_APP_EMAILJS_SERVICE_ID, REACT_APP_EMAILJS_TEMPLATE_ID, ' +
        'and REACT_APP_EMAILJS_PUBLIC_KEY in your .env file.'
      );
    }
   

    
    await updateDoc(doc(db, 'users', uid), { status: 'approved' });
  
    const templateParams = {
      email:             provider.email,
      contact_name:      provider.contactName,
      organisation_name: provider.organisationName,
      app_url:           window.location.origin,
    };

    console.log('Sending EmailJS approval:', { uid, templateParams });

    await emailjs.send(
      REACT_APP_EMAILJS_SERVICE_ID,
      REACT_APP_EMAILJS_TEMPLATE_ID,
      templateParams,
      REACT_APP_EMAILJS_PUBLIC_KEY
    );
   

    console.log(`approveProvider: uid "${uid}" approved and notified successfully.`);
  } catch (error) {
    console.error('approveProvider error:', {
      message: error.message,
      status:  error.status,
      text:    error.text,   
    });
    throw error;
  }
}

export async function rejectProvider(uid) {
  try {
    
    if (!uid) {
      throw new Error('rejectProvider: uid is missing.');
    }
    

    await updateDoc(doc(db, 'users', uid), { status: 'rejected' });

    console.log(`rejectProvider: uid "${uid}" rejected successfully.`);
  } catch (error) {
    console.error('rejectProvider error:', {
      message: error.message,
      status:  error.status,
      text:    error.text,
    });
    throw error;
  }
}