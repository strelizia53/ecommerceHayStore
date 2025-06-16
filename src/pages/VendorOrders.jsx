import React, { useEffect, useState } from "react";
import { db, auth, storage } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import jsPDF from "jspdf";

export default function VendorOrders() {
  const [orders, setOrders] = useState([]);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState({});

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setVendor(u);
        await fetchOrders(u.uid);
      }
    });
    return () => unsub();
  }, []);

  const fetchOrders = async (vendorId) => {
    const q = query(
      collection(db, "orders"),
      where("vendorId", "==", vendorId)
    );
    const snapshot = await getDocs(q);
    const results = [];

    for (const orderDoc of snapshot.docs) {
      const data = orderDoc.data();
      const buyerRef = doc(db, "users", data.buyerId);
      const buyerSnap = await getDoc(buyerRef);
      const buyerName = buyerSnap.exists()
        ? buyerSnap.data().username
        : "Unknown";
      results.push({ id: orderDoc.id, ...data, buyerName });
    }

    setOrders(results);
    setLoading(false);
  };

  const handleAccept = async (order) => {
    if (!window.confirm("Accept this order and generate QR?")) return;

    const secretKey = uuidv4();
    const qrContent = `orderId=${order.id}&secretKey=${secretKey}`;
    const qrImage = await QRCode.toDataURL(qrContent);

    const filePath = `qrcodes/${order.id}.png`;
    const qrRef = ref(storage, filePath);
    const qrBlob = await (await fetch(qrImage)).blob();
    await uploadBytes(qrRef, qrBlob);
    const qrUrl = await getDownloadURL(qrRef);

    await setDoc(doc(db, "orderQRCodes", order.id), {
      orderId: order.id,
      vendorId: vendor.uid,
      secretKey,
      qrUrl,
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    alert("QR code generated and stored.");
    setQrData((prev) => ({ ...prev, [order.id]: qrUrl }));
  };

  const handleReject = async (orderId) => {
    if (!window.confirm("Reject and delete this order?")) return;
    await deleteDoc(doc(db, "orders", orderId));
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    alert("Order rejected.");
  };

  const downloadPdf = (orderId, qrUrl) => {
    const pdf = new jsPDF();
    pdf.setFontSize(16);
    pdf.text("Order QR Code", 20, 20);
    const img = new Image();
    img.src = qrUrl;
    img.onload = () => {
      pdf.addImage(img, "PNG", 20, 30, 100, 100);
      pdf.save(`order-${orderId}-QR.pdf`);
    };
  };

  if (!vendor) return <p style={styles.center}>Please log in as a vendor.</p>;
  if (loading) return <p style={styles.center}>Loading orders...</p>;

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>📬 Vendor Orders</h1>
      {orders.length === 0 ? (
        <p style={styles.center}>No orders received yet.</p>
      ) : (
        orders.map((order) => (
          <div key={order.id} style={styles.orderBox}>
            <div style={styles.meta}>
              <h3>
                Order ID: <span>{order.id}</span>
              </h3>
              <p>
                <strong>Buyer:</strong> {order.buyerName}
              </p>
              <p>
                <strong>Status:</strong> {order.status}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {order.orderDate?.toDate?.().toLocaleString() || "Unknown"}
              </p>
            </div>

            <ul style={styles.itemList}>
              {order.items.map((item, idx) => (
                <li key={idx} style={styles.item}>
                  <img src={item.image} alt={item.title} style={styles.image} />
                  <div>
                    <p style={styles.itemTitle}>{item.title}</p>
                    <p style={styles.itemPrice}>
                      {item.quantity} × ${item.price.toFixed(2)} = $
                      {(item.quantity * item.price).toFixed(2)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <p style={styles.total}>
              <strong>Total:</strong> ${order.totalPrice?.toFixed(2) || "N/A"}
            </p>

            <div style={styles.actions}>
              <button style={styles.accept} onClick={() => handleAccept(order)}>
                ✅ Accept & Generate QR
              </button>
              <button
                style={styles.reject}
                onClick={() => handleReject(order.id)}
              >
                ❌ Reject
              </button>
            </div>

            {qrData[order.id] && (
              <div style={styles.qrSection}>
                <img
                  src={qrData[order.id]}
                  alt="QR Code"
                  style={styles.qrImage}
                />
                <button
                  onClick={() => downloadPdf(order.id, qrData[order.id])}
                  style={styles.downloadBtn}
                >
                  📥 Download PDF
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "2rem",
    maxWidth: "900px",
    margin: "0 auto",
    fontFamily: "'Segoe UI', Tahoma, sans-serif",
  },
  heading: {
    fontSize: "2rem",
    fontWeight: "600",
    marginBottom: "2rem",
  },
  center: {
    textAlign: "center",
    padding: "2rem",
  },
  orderBox: {
    border: "1px solid #ddd",
    borderRadius: "10px",
    padding: "1.5rem",
    marginBottom: "2rem",
    backgroundColor: "#fafafa",
    boxShadow: "0 3px 8px rgba(0,0,0,0.05)",
  },
  meta: {
    marginBottom: "1rem",
  },
  itemList: {
    listStyle: "none",
    padding: 0,
    margin: "1rem 0",
  },
  item: {
    display: "flex",
    gap: "1rem",
    alignItems: "center",
    marginBottom: "1rem",
  },
  image: {
    width: "70px",
    height: "70px",
    objectFit: "cover",
    borderRadius: "6px",
  },
  itemTitle: {
    fontSize: "1rem",
    fontWeight: "500",
  },
  itemPrice: {
    fontSize: "0.95rem",
    color: "#555",
  },
  total: {
    fontSize: "1.1rem",
    fontWeight: "bold",
    marginTop: "1rem",
  },
  actions: {
    marginTop: "1.5rem",
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
  },
  accept: {
    backgroundColor: "#28a745",
    color: "#fff",
    padding: "0.6rem 1.2rem",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
  },
  reject: {
    backgroundColor: "#dc3545",
    color: "#fff",
    padding: "0.6rem 1.2rem",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
  },
  qrSection: {
    marginTop: "1.5rem",
    textAlign: "center",
  },
  qrImage: {
    width: "160px",
    marginBottom: "1rem",
  },
  downloadBtn: {
    backgroundColor: "#007bff",
    color: "#fff",
    padding: "0.5rem 1rem",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
};
