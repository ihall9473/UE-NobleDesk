// Shared list of lead pipeline stages - used by the Pipeline kanban board,
// the Leads list badge, and the contacts.pipeline_stage check constraint.
export const PIPELINE_STAGES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "quoted", label: "Quoted" },
  { value: "applied", label: "Applied" },
  { value: "issued", label: "Issued" },
];

export const PIPELINE_STAGE_LABELS = Object.fromEntries(PIPELINE_STAGES.map((s) => [s.value, s.label]));
