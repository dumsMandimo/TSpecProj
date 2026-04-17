import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const role = localStorage.getItem("role");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ⏳ wait for Firebase to finish loading
  if (loading) return null;

  // 1. Not logged in → redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. No role → block access
  if (!role) {
    return <Navigate to="/login" replace />;
  }

  // 3. Role mismatch → block access
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}