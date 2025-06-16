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

          // check against DB
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
    <div style={{ padding: "2rem" }}>
      <h1>🔐 Order Authenticator</h1>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {scanStatus && (
        <p>
          🧪 Damage Scan Result:{" "}
          <strong>
            {scanStatus === "undamageQR" ? "✅ Undamaged" : "❌ Damaged"}
          </strong>
        </p>
      )}

      {orderDetails && (
        <div style={styles.resultBox}>
          {orderDetails.matched ? (
            <>
              <h3>✅ Order Verified</h3>
              <p>
                <strong>Order ID:</strong> {orderDetails.orderId}
              </p>
              <p>
                <strong>Status:</strong> {orderDetails.status}
              </p>
              <p>
                <strong>Total:</strong> ${orderDetails.totalPrice.toFixed(2)}
              </p>
              <ul>
                {orderDetails.items.map((item, i) => (
                  <li key={i}>
                    {item.title} – {item.quantity} × ${item.price}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p style={{ color: "red" }}>❌ Order could not be authenticated</p>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  resultBox: {
    marginTop: "2rem",
    border: "1px solid #ccc",
    padding: "1rem",
    borderRadius: "8px",
  },
};
