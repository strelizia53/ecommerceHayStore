import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";

export default function Profile() {
  const [username, setUsername] = useState("");
  const [userType, setUserType] = useState("");
  const [uid, setUid] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUsername(data.username);
          setUserType(data.userType);
        }
      } else {
        navigate("/login"); // redirect if not logged in
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleBecomeVendor = async () => {
    const confirm = window.confirm("Are you sure you want to become a vendor?");
    if (confirm) {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, { userType: "vendor" });
      setUserType("vendor");
      alert("You're now a vendor!");
    }
  };

  if (loading) return <p>Loading profile...</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Profile</h1>
      <p>
        Username: <strong>{username}</strong>
      </p>
      <p>
        Role: <strong>{userType}</strong>
      </p>

      <div style={{ marginTop: "1.5rem" }}>
        <Link to="/cart" style={linkStyle}>
          🛒 View Cart
        </Link>
        <br />
        <Link to="/wishlist" style={linkStyle}>
          💖 View Wishlist
        </Link>
      </div>

      {userType !== "vendor" && (
        <button onClick={handleBecomeVendor} style={{ marginTop: "1.5rem" }}>
          Become a Vendor
        </button>
      )}

      {userType === "vendor" && (
        <div style={{ marginTop: "1rem" }}>
          <Link to="/vendor">Go to Vendor Portal</Link>
        </div>
      )}
    </div>
  );
}

const linkStyle = {
  display: "inline-block",
  marginTop: "0.5rem",
  textDecoration: "none",
  color: "#0077cc",
};
