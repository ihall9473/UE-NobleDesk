"use client";
import { useEffect, useState } from "react";

const KIND_LABELS = { note: "Note", call: "Call", meeting: "Meeting", life_event: "Life Event", text_out: "Text (sent)", text_in: "Text (received)" };

function daysUntil(dueDate) {
  if (!dueDate) return null;
  const d = new Date(dueDate + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
}

// Embedded on a contact's detail page - a timeline of notes/calls/meetings/
// life events (plus texts, if enabled) alongside that contact's own tasks.
// Kept as one component since both are scoped to a single contact_id.
export default function ActivityAndTasks({ contactId }) {
  const [activity, setActivity] = useState(null);
  const [tasks, setTasks] = useState(null);
  const [kind, setKind] = useState("note");
  const [body, setBody] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const [activityRes, tasksRes] = await Promise.all([
      fetch(`/api/activity?contactId=${contactId}`).then((r) => r.json()),
      fetch(`/api/tasks?contactId=${contactId}`).then((r) => r.json()),
    ]);
    setActivity(activityRes.activity || []);
    setTasks(tasksRes.tasks || []);
  }

  useEffect(() => {
    load();
  }, [contactId]);

  async function addActivity(e) {
    e.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    await fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId, kind, body }),
    });
    setSaving(false);
    setBody("");
    load();
  }

  async function removeActivity(id) {
    if (!confirm("Remove this entry?")) return;
    await fetch("/api/activity", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load();
  }

  async function addTask(e) {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId, title: taskTitle, dueDate: taskDue || null }),
    });
    setTaskTitle("");
    setTaskDue("");
    load();
  }

  async function toggleTask(task) {
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id, completed: !task.completed }),
    });
    load();
  }

  if (activity === null) return null;

  const openTasks = (tasks || []).filter((t) => !t.completed);

  return (
    <div className="card">
      <h3>Activity & Tasks</h3>

      {openTasks.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {openTasks.map((t) => {
            const days = daysUntil(t.due_date);
            return (
              <div key={t.id} className="checkbox-row">
                <input type="checkbox" checked={false} onChange={() => toggleTask(t)} />
                <span style={{ fontSize: 14 }}>
                  {t.title}
                  {days !== null && (
                    <span style={{ color: days < 0 ? "var(--danger)" : "#9a9a9a", marginLeft: 6, fontSize: 12 }}>
                      {days < 0 ? `(${Math.abs(days)}d overdue)` : days === 0 ? "(today)" : `(in ${days}d)`}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
      <form onSubmit={addTask} className="row" style={{ marginBottom: 16, flexWrap: "wrap" }}>
        <input placeholder="Add a task (e.g. Call back in 3 days)" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} style={{ flex: 2, minWidth: 160, marginBottom: 0 }} />
        <input type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} style={{ flex: 1, minWidth: 120, marginBottom: 0 }} />
        <button type="submit" style={{ width: "auto", marginBottom: 0 }}>Add</button>
      </form>

      <form onSubmit={addActivity} style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <select value={kind} onChange={(e) => setKind(e.target.value)} style={{ width: 140, marginBottom: 0 }}>
            <option value="note">Note</option>
            <option value="call">Call</option>
            <option value="meeting">Meeting</option>
            <option value="life_event">Life Event</option>
          </select>
          <input placeholder="What happened?" value={body} onChange={(e) => setBody(e.target.value)} style={{ flex: 1, marginBottom: 0 }} />
          <button type="submit" disabled={saving} style={{ width: "auto", marginBottom: 0 }}>Log</button>
        </div>
      </form>

      {activity.length === 0 && <p className="subtitle" style={{ marginBottom: 0 }}>No activity logged yet.</p>}
      {activity.map((a) => (
        <div key={`${a.kind}-${a.id}`} style={{ fontSize: 13, marginBottom: 8, display: "flex", justifyContent: "space-between", gap: 8 }}>
          <div>
            <span className="badge" style={{ marginRight: 6 }}>{KIND_LABELS[a.kind] || a.kind}</span>
            <span style={{ color: "#f5f5f5" }}>{a.body}</span>{" "}
            <span style={{ color: "#666" }}>— {new Date(a.created_at).toLocaleString()}</span>
          </div>
          {(a.kind === "note" || a.kind === "call" || a.kind === "meeting" || a.kind === "life_event") && (
            <button onClick={() => removeActivity(a.id)} style={{ width: "auto", marginBottom: 0, flexShrink: 0, background: "transparent", color: "#666", padding: "0 4px" }}>
              &times;
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
