import { useState, useEffect } from "react";
import { db } from "../services/firebase.js";
import { getDoc, doc } from "firebase/firestore";

/*

export const fetchNqfLevels = async () => {
  const docRef = doc(db, "nqfLevel", "0Na7Q5IzFg2oI24GiqS3");
  const querySnapshot = await getDoc(docRef);
  const nqf = querySnapshot.data();

  const sorted = Object.fromEntries(
    Object.entries(nqf).sort(([a], [b]) => {
      const numA = parseInt(a.match(/\d+/)?.[0]);
      const numB = parseInt(b.match(/\d+/)?.[0]);
      return numA - numB;
    }),
  );

  return sorted;
};

export const useNqfLevels = () => {
  const [nqfLevel, setNqfLevels] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sorted = await fetchNqfLevels();
        setNqfLevels(sorted);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { nqfLevel, loading, error };
};

*/
