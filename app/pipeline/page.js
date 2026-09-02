"use client";
import { useEffect, useState } from "react";
import { PIPELINE_STAGES } from "@/lib/pipelineStages";

export default function PipelinePage() {
  const [leads, setLeads] = useState(null);
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch("/api/contacts?type=lead");
    const data = await res.json();
    setLeads(data.contacts || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function moveTo(id, stage) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, pipeline_stage: stage } : l)));
    const res = await fetch("/api/contacts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, pipelineStage: stage }),
    });
    if (!res.ok) {
      setMessage("Couldn't move that lead - try again.");
      load();
    }
  }

  if (leads === null) return <p>Loading...</p>;

  return (
    <div>
      <h1>Lead Pipeline</h1>
      <p className="subtitle">Track every lead's stage from first contact to issued policy.</p>
      {message && <p className="error">{message}</p>}

      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
        {PIPELINE_STAGES.map((stage) => {
          const stageLeads = leads.filter((l) => (l.pipeline_stage || "new") === stage.value);
          return (
            <div key={stage.value} style={{ minWidth: 220, flex: 1 }}>
              <div className="label-caps" style={{ marginBottom: 8, textAlign: "center" }}>
                {stage.label} ({stageLeads.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 60 }}>
                {stageLeads.map((lead) => {
                  const currentIndex = PIPELINE_STAGES.findIndex((s) => s.value === stage.value);
                  const prevStage = PIPELINE_STAGES[currentIndex - 1];
                  const nextStage = PIPELINE_STAGES[currentIndex + 1];
                  return (
                    <div key={lead.id} className="card" style={{ padding: "10px 12px", marginBottom: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        <a href={`/clients/${lead.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                          {lead.name}
                        </a>
                      </div>
                      <div style={{ color: "#9a9a9a", fontSize: 12, marginBottom: 8 }}>{lead.phone}</div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {prevStage && (
                          <button
                            type="button"
                            onClick={() => moveTo(lead.id, prevStage.value)}
                            style={{ width: "auto", flex: 1, fontSize: 11, padding: "4px 6px", marginBottom: 0, background: "#232323", color: "#9a9a9a" }}
                          >
                            &larr;
                          </button>
                        )}
                        {nextStage && (
                          <button
                            type="button"
                            onClick={() => moveTo(lead.id, nextStage.value)}
                            style={{ width: "auto", flex: 1, fontSize: 11, padding: "4px 6px", marginBottom: 0 }}
                          >
                            {nextStage.label} &rarr;
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {leads.length === 0 && <p className="subtitle" style={{ marginTop: 16 }}>No leads yet - add some on the Leads page.</p>}
    </div>
  );
}
