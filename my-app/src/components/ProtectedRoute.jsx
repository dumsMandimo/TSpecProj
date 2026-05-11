import { Navigate } from "react-router-dom";
<<<<<<< HEAD
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, role, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!role) return <Navigate to="/login" replace />;
=======
import { useEffect, useState } from "react";
import { auth, db } from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (!u) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, "users", u.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          setRole(snap.data().role || null);
        } else {
          setRole(null);
        }
      } catch (err) {
        console.error("Failed to fetch role:", err);
        setRole(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Show loading state (prevents flicker / redirect bug)
  if (loading) {
    return <div>Loading...</div>;
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // No role found in Firestore
  if (!role) {
    return <Navigate to="/login" replace />;
  }

  // Role not allowed
>>>>>>> d8db91e1a2df0b0b6aaa46a41b4380a4801be230
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}