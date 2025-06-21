import React, { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import Webcam from "react-webcam";
import { db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function OrderAuthenticator() {
  const canvasRef = useRef(null);
  const webcamRef = useRef(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [useCamera, setUseCamera] = useState(false);
  const [canComplete, setCanComplete] = useState(false);
  const [shouldStopCamera, setShouldStopCamera] = useState(false);
  const [scanStatus, setScanStatus] = useState("");

  useEffect(() => {
    let interval;
    if (useCamera && !shouldStopCamera) {
      interval = setInterval(() => {
        captureAndScan();
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [useCamera, shouldStopCamera]);

  const captureAndScan = async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    const img = new Image();
    img.src = imageSrc;
    img.onload = async () => {
      const canvas = canvasRef.current;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height);
      const qrData = code?.data;

      const blob = await (await fetch(imageSrc)).blob();
      const formData = new FormData();
      formData.append("file", blob, "snapshot.jpg");

      let damageResult = "";
      try {
        const response = await fetch(
          "https://backendqrcodehayyan-production.up.railway.app/scan",
          {
            method: "POST",
            body: formData,
          }
        );
        const json = await response.json();
        damageResult = json.result;
        setScanStatus(json.result);
      } catch {
        damageResult = "API scan failed";
        setScanStatus("API scan failed");
      }

      if (qrData && damageResult === "undamageQR") {
        await processQR(qrData);
      }
    };
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
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
        const qrData = code?.data;

        const formData = new FormData();
        formData.append("file", file);

        let damageResult = "";
        try {
          const response = await fetch(
            "https://backendqrcodehayyan-production.up.railway.app/scan",
            {
              method: "POST",
              body: formData,
            }
          );
          const json = await response.json();
          damageResult = json.result;
          setScanStatus(json.result);
        } catch {
          damageResult = "API scan failed";
          setScanStatus("API scan failed");
        }

        if (qrData && damageResult === "undamageQR") {
          await processQR(qrData);
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const processQR = async (data) => {
    const params = new URLSearchParams(data);
    const orderId = params.get("orderId");
    const secretKey = params.get("secretKey");

    const qrRef = doc(db, "orderQRCodes", orderId);
    const qrSnap = await getDoc(qrRef);
    if (!qrSnap.exists()) return;

    const qrData = qrSnap.data();
    if (qrData.secretKey !== secretKey) {
      setOrderDetails({ matched: false });
      return;
    }

    const orderSnap = await getDoc(doc(db, "orders", orderId));
    if (!orderSnap.exists()) return;

    const orderData = orderSnap.data();

    setOrderDetails({
      ...orderData,
      matched: true,
      orderId,
    });

    setCanComplete(true);
    setShouldStopCamera(true);
  };

  const completeOrder = async () => {
    if (!orderDetails || !orderDetails.orderId) return;
    const orderId = orderDetails.orderId;

    for (const item of orderDetails.items) {
      const productRef = doc(db, "products", item.productId);
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
        const product = productSnap.data();
        const newStock = Math.max((product.stock || 0) - item.quantity, 0);
        await updateDoc(productRef, { stock: newStock });
      }
    }

    await updateDoc(doc(db, "orders", orderId), { status: "Completed" });

    alert("✅ Order completed and stock updated.");
    setCanComplete(false);
    setOrderDetails((prev) => ({ ...prev, status: "Completed" }));
  };

  return (
    <div style={styles.container}>
      <h1>🔐 Order Authenticator</h1>

      <label style={styles.toggle}>
        <input
          type="checkbox"
          checked={useCamera}
          onChange={() => {
            setUseCamera((prev) => !prev);
            setOrderDetails(null);
            setScanStatus("");
            setShouldStopCamera(false);
          }}
        />
        Use Camera Scanner
      </label>

      {useCamera ? (
        <Webcam
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: "environment" }}
          style={{ width: "100%", maxWidth: "500px", borderRadius: "10px" }}
        />
      ) : (
        <label style={styles.uploadLabel}>
          Upload QR Image:
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={styles.fileInput}
          />
        </label>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />

      {scanStatus && (
        <p>
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
            {scanStatus}
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
              <ul>
                {orderDetails.items.map((item, i) => (
                  <li key={i}>
                    {item.title} — {item.quantity} × ${item.price.toFixed(2)}
                  </li>
                ))}
              </ul>
              {canComplete && (
                <button
                  onClick={completeOrder}
                  style={{
                    marginTop: "1rem",
                    padding: "0.6rem 1.2rem",
                    backgroundColor: "#000",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  ✅ Complete Order
                </button>
              )}
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
  container: {
    padding: "2rem",
    maxWidth: "700px",
    margin: "0 auto",
    fontFamily: "'Segoe UI', sans-serif",
  },
  toggle: {
    marginBottom: "1rem",
    display: "block",
  },
  uploadLabel: {
    display: "block",
    marginBottom: "1rem",
  },
  fileInput: {
    display: "block",
    marginTop: "0.5rem",
  },
  resultBox: {
    marginTop: "2rem",
    backgroundColor: "#f9f9f9",
    padding: "1rem",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },
};
