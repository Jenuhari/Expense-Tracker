import React, { useEffect, useState } from "react";
import "./index.css";
import {
  fetchCategories,
  createCategory,
  fetchExpenses,
  createExpense,
  deleteExpense,
  fetchMonthlyStats,
  signup,
  login,
  getMe,
} from "./api";

import ExpenseForm from "./components/ExpenseForm";
import ExpenseList from "./components/ExpenseList";
import MonthlyChart from "./components/MonthlyChart";
import AuthForm from "./components/AuthForm";

function App() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState("");

  // category validation + shake state
  const [categoryError, setCategoryError] = useState("");
  const [categoryShake, setCategoryShake] = useState(false);

  // salary for this month
  const [salary, setSalary] = useState("");

  const isLoggedIn = !!user;

  const triggerCategoryShake = () => {
    setCategoryShake(true);
    setTimeout(() => setCategoryShake(false), 400);
  };

  // derived totals
  const totalExpenses = React.useMemo(
    () => expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0),
    [expenses]
  );

  const remaining = React.useMemo(
    () => Number(salary || 0) - totalExpenses,
    [salary, totalExpenses]
  );

  // ------------- Auth -------------

  const loadCurrentUser = async () => {
    try {
      const res = await getMe();
      setUser(res.data);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      loadCurrentUser();
    }
  }, []);

  const handleLogin = async (identifier, password) => {
    const res = await login(identifier, password);
    localStorage.setItem("token", res.data.access_token);
    await loadCurrentUser();
  };

  const handleSignup = async (payload) => {
    await signup(payload);
    await handleLogin(payload.email, payload.password);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setExpenses([]);
    setStats(null);
    setSalary("");
  };

  // ------------- Data -------------

  const loadCategories = async () => {
    try {
      const res = await fetchCategories();
      setCategories(res.data);
    } catch (err) {
      console.error("loadCategories error", err);
    }
  };

  const loadExpenses = async () => {
    try {
      const res = await fetchExpenses({ year, month });
      setExpenses(res.data);
    } catch (err) {
      console.error("loadExpenses error", err);
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetchMonthlyStats(year, month);
      setStats(res.data);
    } catch (err) {
      console.error("loadStats error", err);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadCategories();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchAll = async () => {
      await loadExpenses();
      await loadStats();
    };

    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, isLoggedIn]);

  const handleAddExpense = async (exp) => {
    try {
      await createExpense(exp);
      await loadExpenses();
      await loadStats();
    } catch (err) {
      console.error("createExpense error", err);
      alert("Failed to add expense");
    }
  };

  const handleDeleteExpense = async (id) => {
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this expense?"
    );
    if (!isConfirmed) return;

    try {
      await deleteExpense(id);
      await loadExpenses();
      await loadStats();
    } catch (err) {
      console.error("deleteExpense error", err);
      alert("Failed to delete expense");
    }
  };

  // Add Category with validation + shake
  const handleAddCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      setCategoryError("Category name is required");
      triggerCategoryShake();
      return;
    }

    try {
      await createCategory({ name: trimmed });
      setNewCategoryName("");
      setCategoryError("");
      await loadCategories();
    } catch (err) {
      console.error("createCategory error", err);
      setCategoryError("Failed to add category");
      triggerCategoryShake();
    }
  };

  const months = Array.from({ length: 12 }).map((_, idx) => ({
    value: idx + 1,
    label: new Date(2000, idx, 1).toLocaleString("default", {
      month: "short",
    }),
  }));

  // ------------- Render -------------

  if (!isLoggedIn) {
    return (
      <div className="app">
        <header>
          <h1>Expense Tracker</h1>
        </header>

        {authError && (
          <div
            className="card"
            style={{ maxWidth: 400, margin: "0 auto", color: "red" }}
          >
            {authError}
          </div>
        )}

        <AuthForm
          onLoginSuccess={handleLogin}
          onSignupSuccess={handleSignup}
          onError={setAuthError}
        />
      </div>
    );
  }

  return (
    <div className="app">
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>Expense Tracker</h1>
        <div>
          <span style={{ marginRight: "0.75rem", fontSize: "0.9rem" }}>
            {user?.full_name || user?.email}
          </span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main>
        {/* Financial Dashboard card */}
        <section className="filters card">
          <h3>Financial Dashboard</h3>

          <div
            className="filters-row"
            style={{
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "2rem",
            }}
          >
            {/* LEFT: Year + Month */}
            <div style={{ display: "flex", gap: "1rem" }}>
              <div>
                <label>Year</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) =>
                    setYear(
                      parseInt(e.target.value || today.getFullYear(), 10)
                    )
                  }
                />
              </div>
              <div>
                <label>Month</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* RIGHT: Salary + totals */}
            <div style={{ minWidth: "260px" }}>
              {/* Monthly Salary (TOP) */}
              <div style={{ marginBottom: "0.75rem" }}>
                <label>Monthly Salary</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Enter salary"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  style={{ width: "200px" }}
                />
              </div>

              {/* Total + Remaining (BOTTOM in same line) */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  gap: "4rem",
                }}
              >
                <div>
                  <label>Total Expenses</label>
                  <div style={{ fontWeight: 600 }}>
                    ₹ {totalExpenses.toFixed(2)}
                  </div>
                </div>

                <div>
                  <label>Remaining</label>
                  <div
                    style={{
                      fontWeight: 600,
                      color: remaining < 0 ? "#b91c1c" : "#16a34a",
                    }}
                  >
                    ₹ {remaining.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main layout */}
        <section className="layout">
          <div className="left-column">
            <ExpenseForm categories={categories} onAdd={handleAddExpense} />

            {/* Add Category card */}
            <div className={`card ${categoryShake ? "shake" : ""}`}>
              <h3>Add Category</h3>
              <div className="form-row">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => {
                    setNewCategoryName(e.target.value);
                    setCategoryError("");
                  }}
                  placeholder="e.g. Groceries"
                  className={categoryError ? "input-error" : ""}
                />
              </div>
              {categoryError && (
                <div className="field-error">{categoryError}</div>
              )}
              <button
                type="button"
                style={{ marginTop: "0.5rem", width: "100%" }}
                onClick={handleAddCategory}
              >
                Add
              </button>
            </div>
          </div>

          <div className="right-column">
            <ExpenseList expenses={expenses} onDelete={handleDeleteExpense} />
            <MonthlyChart stats={stats} />
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
