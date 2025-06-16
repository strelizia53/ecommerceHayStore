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
  const [qrData, setQrData] = useState({}); // holds orderId => QR URL

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

      results.push({
        id: orderDoc.id,
        ...data,
        buyerName,
      });
    }

    setOrders(results);
    setLoading(false);
  };

  const handleAccept = async (order) => {
    const confirm = window.confirm("Accept this order and generate QR?");
    if (!confirm) return;

    const secretKey = uuidv4();
    const qrData = `orderId=${order.id}&secretKey=${secretKey}`;
    const qrImage = await QRCode.toDataURL(qrData);

    // Upload QR to Firebase Storage
    const filePath = `qrcodes/${order.id}.png`;
    const qrRef = ref(storage, filePath);
    const qrBlob = await (await fetch(qrImage)).blob();
    await uploadBytes(qrRef, qrBlob);
    const qrUrl = await getDownloadURL(qrRef);

    // Store QR info in new Firestore collection
    const qrDoc = {
      orderId: order.id,
      vendorId: vendor.uid,
      secretKey,
      qrUrl,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, "orderQRCodes", order.id), qrDoc);

    alert("QR code generated and stored.");
    setQrData((prev) => ({ ...prev, [order.id]: qrUrl }));
  };

  const handleReject = async (orderId) => {
    const confirm = window.confirm("Reject and delete this order?");
    if (!confirm) return;
    await deleteDoc(doc(db, "orders", orderId));
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    alert("Order rejected.");
  };

  const downloadPdf = async (orderId, qrUrl) => {
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

  if (!vendor)
    return <p style={{ padding: "2rem" }}>Please log in as a vendor.</p>;

  if (loading) return <p style={{ padding: "2rem" }}>Loading orders...</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>📬 Vendor Orders</h1>
      {orders.length === 0 ? (
        <p>No orders received yet.</p>
      ) : (
        orders.map((order) => (
          <div key={order.id} style={styles.orderBox}>
            <h3>Order ID: {order.id}</h3>
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
            <ul>
              {order.items.map((item, idx) => (
                <li key={idx} style={styles.item}>
                  <img src={item.image} alt={item.title} style={styles.image} />
                  <div>
                    <p>{item.title}</p>
                    <p>
                      {item.quantity} × ${item.price.toFixed(2)} = $
                      {(item.quantity * item.price).toFixed(2)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <p>
              <strong>Total:</strong> ${order.totalPrice?.toFixed(2) || "N/A"}
            </p>

            <div style={styles.actionBtns}>
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
              <div style={{ marginTop: "1rem" }}>
                <img
                  src={qrData[order.id]}
                  alt="QR Code"
                  style={{ width: "150px", marginBottom: "0.5rem" }}
                />
                <br />
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
  orderBox: {
    border: "1px solid #ccc",
    padding: "1.5rem",
    borderRadius: "8px",
    marginBottom: "2rem",
  },
  item: {
    display: "flex",
    gap: "1rem",
    alignItems: "center",
    marginBottom: "1rem",
  },
  image: {
    width: "60px",
    height: "60px",
    objectFit: "cover",
    borderRadius: "4px",
  },
  actionBtns: {
    marginTop: "1rem",
    display: "flex",
    gap: "1rem",
  },
  accept: {
    backgroundColor: "#28a745",
    color: "#fff",
    padding: "0.5rem 1rem",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  reject: {
    backgroundColor: "#dc3545",
    color: "#fff",
    padding: "0.5rem 1rem",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  downloadBtn: {
    backgroundColor: "#007bff",
    color: "#fff",
    padding: "0.4rem 1rem",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};
