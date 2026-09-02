"use client";
import { useEffect, useMemo, useState } from "react";

function daysUntil(dueDate) {
  if (!dueDate) return null;
  const d = new Date(dueDate + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
}

function DueBadge({ dueDate }) {
  const days = daysUntil(dueDate);
  if (days === null) return null;
  const overdue = days < 0;
  const dueToday = days === 0;
  const label = overdue
    ? `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`
    : dueToday
    ? "Due today"
    : `Due in ${days} day${days === 1 ? "" : "s"}`;
  return (
    <span
      className="badge"
      style={
        overdue || dueToday
          ? { color: "var(--danger)", borderColor: "var(--danger)", background: "rgba(248,113,113,0.08)" }
          : {}
      }
    >
      {label}
    </span>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState(null);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch("/api/tasks");
    const data = await res.json();
    setTasks(data.tasks || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function addTask(e) {
    e.preventDefault();
    if (!title.trim()) return;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, dueDate: dueDate || null }),
    });
    if (res.ok) {
      setTitle("");
      setDueDate("");
      load();
    } else {
      const d = await res.json();
      setMessage(d.error || "Something went wrong.");
    }
  }

  function quickAdd(days, label) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return async () => {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: label, dueDate: d.toISOString().slice(0, 10) }),
      });
      load();
    };
  }

  async function toggleCompleted(task) {
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id, completed: !task.completed }),
    });
    load();
  }

  async function removeTask(id) {
    if (!confirm("Remove this task?")) return;
    await fetch("/api/tasks", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load();
  }

  const sorted = useMemo(() => {
    if (!tasks) return [];
    const visible = tasks.filter((t) => showCompleted || !t.completed);
    return [...visible].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date);
    });
  }, [tasks, showCompleted]);

  const openCount = tasks ? tasks.filter((t) => !t.completed).length : 0;
  const overdueCount = tasks ? tasks.filter((t) => !t.completed && daysUntil(t.due_date) < 0).length : 0;

  return (
    <div>
      <h1>Tasks</h1>
      <p className="subtitle">Follow-up to-dos - the difference between a CRM that stores data and one that drives your day.</p>

      {message && <p className="error">{message}</p>}

      {overdueCount > 0 && (
        <div className="card" style={{ background: "rgba(248, 113, 113, 0.06)", border: "1px solid rgba(248, 113, 113, 0.35)" }}>
          <div className="label-caps" style={{ color: "var(--danger)" }}>Overdue</div>
          <p className="subtitle" style={{ marginTop: 4, marginBottom: 0 }}>
            {overdueCount} task{overdueCount === 1 ? "" : "s"} past due.
          </p>
        </div>
      )}

      <div className="card">
        <h3>Quick Add</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          <button type="button" style={{ width: "auto" }} onClick={quickAdd(1, "Call back tomorrow")}>Call back in 1 day</button>
          <button type="button" style={{ width: "auto" }} onClick={quickAdd(3, "Call back")}>Call back in 3 days</button>
          <button type="button" style={{ width: "auto" }} onClick={quickAdd(7, "Follow up")}>Follow up in 1 week</button>
        </div>

        <form onSubmit={addTask} className="row" style={{ flexWrap: "wrap" }}>
          <input placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} style={{ flex: 2, minWidth: 200 }} />
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={{ flex: 1, minWidth: 140 }} />
          <button type="submit" style={{ width: "auto", flexShrink: 0 }}>Add Task</button>
        </form>
      </div>

      <div className="row" style={{ marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>
          {showCompleted ? "All Tasks" : "Open Tasks"} ({showCompleted ? tasks?.length || 0 : openCount})
        </h3>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#9a9a9a" }}>
          <input type="checkbox" checked={showCompleted} onChange={(e) => setShowCompleted(e.target.checked)} style={{ width: "auto" }} />
          Show completed
        </label>
      </div>

      {tasks === null && <p>Loading...</p>}
      {tasks !== null && sorted.length === 0 && <p className="subtitle">Nothing here - you're caught up.</p>}

      {sorted.map((t) => (
        <div className="card row" key={t.id} style={{ flexWrap: "wrap", opacity: t.completed ? 0.55 : 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input type="checkbox" checked={t.completed} onChange={() => toggleCompleted(t)} />
            <div>
              <strong style={{ textDecoration: t.completed ? "line-through" : "none" }}>{t.title}</strong>{" "}
              {!t.completed && <DueBadge dueDate={t.due_date} />}
              {t.contacts && (
                <div style={{ color: "#9a9a9a", fontSize: 13 }}>
                  {t.contacts.type === "client" ? (
                    <a href={`/clients/${t.contact_id}`} style={{ color: "#c9a227" }}>{t.contacts.name}</a>
                  ) : (
                    <a href="/leads" style={{ color: "#c9a227" }}>{t.contacts.name}</a>
                  )}
                  {" "}&middot; {t.contacts.phone}
                </div>
              )}
            </div>
          </div>
          <button onClick={() => removeTask(t.id)} style={{ background: "#dc2626", width: "auto" }}>Remove</button>
        </div>
      ))}
    </div>
  );
}
