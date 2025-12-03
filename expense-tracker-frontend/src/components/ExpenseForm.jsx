// src/components/ExpenseForm.jsx
import React, { useState } from "react";

export default function ExpenseForm({ categories, onAdd }) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [categoryId, setCategoryId] = useState("");

  // NEW: field errors + shake
  const [errors, setErrors] = useState({});
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!amount) newErrors.amount = "Amount is required";
    if (!date) newErrors.date = "Date is required";
    if (!categoryId) newErrors.categoryId = "Category is required";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      triggerShake();
      return;
    }

    onAdd({
      amount: parseFloat(amount),
      description,
      date,
      category_id: parseInt(categoryId, 10),
    });

    setAmount("");
    setDescription("");
    setDate("");
    setCategoryId("");
    setErrors({});
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`card ${shake ? "shake" : ""}`}
    >
      <h3>Add Expense</h3>

      <div className="form-row">
        <label>Amount</label>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setErrors((prev) => ({ ...prev, amount: "" }));
          }}
          className={errors.amount ? "input-error" : ""}
        />
        {errors.amount && (
          <div className="field-error">{errors.amount}</div>
        )}
      </div>

      <div className="form-row">
        <label>Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="form-row">
        <label>Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setErrors((prev) => ({ ...prev, date: "" }));
          }}
          className={errors.date ? "input-error" : ""}
        />
        {errors.date && <div className="field-error">{errors.date}</div>}
      </div>

      <div className="form-row">
        <label>Category</label>
        <select
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setErrors((prev) => ({ ...prev, categoryId: "" }));
          }}
          className={errors.categoryId ? "input-error" : ""}
        >
          <option value="">Select...</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.categoryId && (
          <div className="field-error">{errors.categoryId}</div>
        )}
      </div>

      <button type="submit">Add</button>
    </form>
  );
}
