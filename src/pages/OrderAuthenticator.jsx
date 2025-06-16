import React, { useRef, useState } from "react";
import jsQR from "jsqr";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
} from "firebase/firestore";

export default function OrderAuthenticator() {
  const [imageFile, setImageFile] = useState(null);
  const [result, setResult] = useState(null);
  const [scanStatus, setScanStatus] = useState("");
  const [orderDetails, setOrderDetails] = useState(null);
  const canvasRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    setResult(null);
    setOrderDetails(null);
    setScanStatus("Processing...");

    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = async () => {
        const canvas = canvasRef.current;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, canvas.width, canvas.height);

        if (code?.data) {
          const params = new URLSearchParams(code.data);
          const orderId = params.get("orderId");
          const secretKey = params.get("secretKey");

          const qrRef = doc(db, "orderQRCodes", orderId);
          const qrSnap = await getDoc(qrRef);

          if (qrSnap.exists()) {
            const data = qrSnap.data();
            if (data.secretKey === secretKey) {
              const orderSnap = await getDoc(doc(db, "orders", orderId));
              const orderData = orderSnap.exists() ? orderSnap.data() : null;

              setOrderDetails({
                ...orderData,
                matched: true,
                orderId,
              });
            } else {
              setOrderDetails({ matched: false });
            }
          } else {
            setOrderDetails({ matched: false });
          }
        } else {
          setOrderDetails({ matched: false });
        }
      };
    };
    reader.readAsDataURL(file);

    // Upload to damage-checking API
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        "https://backendqrcodehayyan-production.up.railway.app/scan",
        {
          method: "POST",
          body: formData,
        }
      );
      const json = await response.json();
      setScanStatus(json.result);
    } catch (err) {
      setScanStatus("API scan failed");
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🔐 Order Authenticator</h1>

      <label style={styles.uploadLabel}>
        Upload QR Image:
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={styles.fileInput}
        />
      </label>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      {scanStatus && (
        <p style={styles.scanResult}>
          🧪 Damage Scan Result:{" "}
          <strong
            style={{
              color:
                scanStatus === "undamageQR"
                  ? "green"
                  : scanStatus === "damageQR"
                  ? "red"
                  : "#555",
            }}
          >
            {scanStatus === "undamageQR"
              ? "✅ Undamaged"
              : scanStatus === "damageQR"
              ? "❌ Damaged"
              : scanStatus}
          </strong>
        </p>
      )}

      {orderDetails && (
        <div style={styles.resultBox}>
          {orderDetails.matched ? (
            <>
              <h3 style={{ color: "green" }}>✅ Order Verified</h3>
              <p>
                <strong>Order ID:</strong> {orderDetails.orderId}
              </p>
              <p>
                <strong>Status:</strong> {orderDetails.status}
              </p>
              <p>
                <strong>Total:</strong> ${orderDetails.totalPrice.toFixed(2)}
              </p>
              <ul style={styles.itemList}>
                {orderDetails.items.map((item, i) => (
                  <li key={i} style={styles.item}>
                    <span>{item.title}</span>
                    <span>
                      {item.quantity} × ${item.price.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p style={styles.errorText}>❌ Order could not be authenticated</p>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "2rem",
    maxWidth: "700px",
    margin: "0 auto",
    fontFamily: "'Segoe UI', Tahoma, sans-serif",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "600",
    marginBottom: "1.5rem",
  },
  uploadLabel: {
    display: "block",
    marginBottom: "1rem",
    fontSize: "1rem",
    fontWeight: "500",
  },
  fileInput: {
    display: "block",
    marginTop: "0.5rem",
  },
  scanResult: {
    marginTop: "1rem",
    fontSize: "1rem",
  },
  resultBox: {
    marginTop: "2rem",
    border: "1px solid #ddd",
    backgroundColor: "#f9f9f9",
    padding: "1.5rem",
    borderRadius: "10px",
  },
  errorText: {
    color: "red",
    fontSize: "1.1rem",
  },
  itemList: {
    listStyle: "none",
    padding: 0,
    marginTop: "1rem",
  },
  item: {
    display: "flex",
    justifyContent: "space-between",
    padding: "0.5rem 0",
    borderBottom: "1px solid #eee",
    fontSize: "0.95rem",
  },
};
