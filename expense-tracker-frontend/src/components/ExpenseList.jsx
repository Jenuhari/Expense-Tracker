// src/components/ExpenseList.jsx
import React from "react";

export default function ExpenseList({ expenses, onDelete }) {
  return (
    <div className="card">
      <h3>Expenses</h3>
      {expenses.length === 0 ? (
        <p>No expenses yet.</p>
      ) : (
        <table className="expenses-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Amount</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id}>
                <td>{e.date}</td>
                <td>{e.description || "-"}</td>
                <td>{e.category?.name}</td>
                <td>{parseFloat(e.amount).toFixed(2)}</td>
                <td>
                  {/* pass the whole expense to parent so it can show in modal */}
                  <button onClick={() => onDelete(e)}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
