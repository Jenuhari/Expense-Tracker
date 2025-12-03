// src/components/AuthForm.jsx
import React, { useState } from "react";

const HOBBY_OPTIONS = [
  "Playing cricket",
  "Listening to music",
  "Dancing",
  "Watching TV",
  "Reading books",
];

export default function AuthForm({ onLoginSuccess, onSignupSuccess, onError }) {
  const [mode, setMode] = useState("login"); // 'login' or 'signup'

  const [fullName, setFullName] = useState("");
  const [identifier, setIdentifier] = useState(""); // email or username for login; email for signup
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("");
  const [hobbies, setHobbies] = useState([]); // selected hobbies
  const [file, setFile] = useState(null);

  // NEW: field-level errors
  const [errors, setErrors] = useState({});
  // NEW: shake flag
  const [shake, setShake] = useState(false);

  const reset = () => {
    setFullName("");
    setIdentifier("");
    setPassword("");
    setGender("");
    setHobbies([]);
    setFile(null);
    setErrors({});
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  // ---------- error helper (stringify backend errors) ----------

  const getErrorMessage = (err) => {
    const detail = err?.response?.data?.detail;

    if (!detail) return "Something went wrong";

    // FastAPI validation errors: detail is an array
    if (Array.isArray(detail)) {
      return detail.map((d) => d.msg || JSON.stringify(d)).join(", ");
    }

    if (typeof detail === "string") return detail;

    // fallback for objects
    return JSON.stringify(detail);
  };

  // ---------- HOBBIES (dropdown + list) ----------

  const handleAddHobby = (e) => {
    const value = e.target.value;
    if (!value) return;

    setHobbies((prev) => (prev.includes(value) ? prev : [...prev, value]));
    // clear hobby error if user picks at least one
    setErrors((prev) => ({ ...prev, hobbies: "" }));

    // reset dropdown back to placeholder
    e.target.value = "";
  };

  const handleRemoveHobby = (hobby) => {
    setHobbies((prev) => {
      const next = prev.filter((h) => h !== hobby);
      return next;
    });
  };

  // ---------- FILE ----------

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) {
      setFile(null);
      return;
    }

    const allowedExt = ["jpg", "jpeg", "png", "pdf", "xls", "xlsx", "csv"];
    const ext = f.name.split(".").pop().toLowerCase();
    if (!allowedExt.includes(ext)) {
      setErrors((prev) => ({
        ...prev,
        file: "Invalid file type. Allowed: jpg, jpeg, png, pdf, xls, xlsx, csv",
      }));
      triggerShake();
      e.target.value = "";
      setFile(null);
      return;
    }

    if (f.size < 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        file: "File is too small. Minimum size is 1 MB.",
      }));
      triggerShake();
      e.target.value = "";
      setFile(null);
      return;
    }

    setErrors((prev) => ({ ...prev, file: "" }));
    onError?.("");
    setFile(f);
  };

  // ---------- VALIDATION HELPERS ----------

  const validateLogin = () => {
    const newErrors = {};
    if (!identifier) newErrors.identifier = "Email or username is required";
    if (!password) newErrors.password = "Password is required";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      triggerShake();
      return false;
    }
    return true;
  };

  const validateSignup = () => {
    const newErrors = {};

    if (!fullName) newErrors.fullName = "Full name is required";
    if (!identifier) newErrors.identifier = "Email is required";
    if (!password) newErrors.password = "Password is required";
    if (!gender) newErrors.gender = "Please select a gender";
    if (hobbies.length === 0)
      newErrors.hobbies = "Pick at least one hobby";
    if (!file) newErrors.file = "Please upload a file (min 1 MB)";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      triggerShake();
      return false;
    }
    return true;
  };

  // ---------- SUBMIT ----------

  const handleSubmit = async (e) => {
    e.preventDefault();
    onError?.("");

    if (mode === "login") {
      if (!validateLogin()) return;

      try {
        await onLoginSuccess(identifier, password);
        reset();
      } catch (err) {
        const msg = getErrorMessage(err);
        onError?.(msg);
        triggerShake();
      }
      return;
    }

    // SIGNUP
    if (!validateSignup()) return;

    try {
      await onSignupSuccess({
        full_name: fullName,
        email: identifier,
        password,
        gender,
        hobbies: hobbies.join(","), // send as comma-separated string
        file,
      });
      reset();
    } catch (err) {
      const msg = getErrorMessage(err);
      onError?.(msg);
      triggerShake();
    }
  };

  // ---------- UI ----------

  return (
    <div
      className={`card ${shake ? "shake" : ""}`}
      style={{ maxWidth: 400, margin: "2rem auto" }}
    >
      {/* top toggle buttons */}
      <div style={{ display: "flex", marginBottom: "1rem" }}>
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setErrors({});
            onError?.("");
          }}
          style={{
            flex: 1,
            padding: "0.75rem 0",
            border: "none",
            borderRadius: "8px 0 0 8px",
            background: mode === "login" ? "#4f46e5" : "#e5e7eb",
            color: mode === "login" ? "#fff" : "#111827",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setErrors({});
            onError?.("");
          }}
          style={{
            flex: 1,
            padding: "0.75rem 0",
            border: "none",
            borderRadius: "0 8px 8px 0",
            background: mode === "signup" ? "#4f46e5" : "#e5e7eb",
            color: mode === "signup" ? "#fff" : "#111827",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Signup
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {mode === "signup" && (
          <div className="form-row">
            <label>Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setErrors((prev) => ({ ...prev, fullName: "" }));
              }}
              placeholder="Your name"
              className={errors.fullName ? "input-error" : ""}
            />
            {errors.fullName && (
              <div className="field-error">{errors.fullName}</div>
            )}
          </div>
        )}

        <div className="form-row">
          <label>{mode === "login" ? "Email or Username" : "Email"}</label>
          <input
            type={mode === "login" ? "text" : "email"}
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              setErrors((prev) => ({ ...prev, identifier: "" }));
            }}
            className={errors.identifier ? "input-error" : ""}
          />
          {errors.identifier && (
            <div className="field-error">{errors.identifier}</div>
          )}
        </div>

        <div className="form-row">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((prev) => ({ ...prev, password: "" }));
            }}
            className={errors.password ? "input-error" : ""}
          />
          {errors.password && (
            <div className="field-error">{errors.password}</div>
          )}
        </div>

        {mode === "signup" && (
          <>
            {/* Gender dropdown */}
            <div className="form-row">
              <label>Gender</label>
              <select
                value={gender}
                onChange={(e) => {
                  setGender(e.target.value);
                  setErrors((prev) => ({ ...prev, gender: "" }));
                }}
                className={errors.gender ? "input-error" : ""}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Others">Others</option>
              </select>
              {errors.gender && (
                <div className="field-error">{errors.gender}</div>
              )}
            </div>

            {/* Hobbies dropdown + selected list */}
            <div className="form-row">
              <label>Hobbies</label>
              <select defaultValue="" onChange={handleAddHobby}>
                <option value="" disabled>
                  Select a hobby
                </option>
                {HOBBY_OPTIONS.map((hobby) => (
                  <option
                    key={hobby}
                    value={hobby}
                    disabled={hobbies.includes(hobby)}
                  >
                    {hobby}
                  </option>
                ))}
              </select>

              {errors.hobbies && (
                <div className="field-error">{errors.hobbies}</div>
              )}

              {hobbies.length > 0 && (
                <div style={{ marginTop: "0.5rem" }}>
                  {hobbies.map((hobby) => (
                    <span
                      key={hobby}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "0.15rem 0.5rem",
                        borderRadius: "999px",
                        background: "#eef2ff",
                        color: "#312e81",
                        fontSize: "0.8rem",
                        marginRight: "0.35rem",
                        marginBottom: "0.25rem",
                      }}
                    >
                      {hobby}
                      <button
                        type="button"
                        onClick={() => handleRemoveHobby(hobby)}
                        style={{
                          marginLeft: "0.35rem",
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          fontSize: "0.85rem",
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* File upload */}
            <div className="form-row">
              <label>Upload File</label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,.xls,.xlsx,.csv"
                onChange={handleFileChange}
                className={errors.file ? "input-error" : ""}
              />
              <small style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                Allowed: jpg, jpeg, png, pdf, xls, xlsx, csv – minimum size 1
                MB.
              </small>
              {errors.file && <div className="field-error">{errors.file}</div>}
            </div>
          </>
        )}

        <button
          type="submit"
          style={{
            marginTop: "0.5rem",
            width: "100%",
            padding: "0.8rem 0",
            border: "none",
            borderRadius: "8px",
            background: "#4f46e5",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {mode === "login" ? "Login" : "Create Account"}
        </button>
      </form>
    </div>
  );
}
