// Private Supabase Storage bucket for license PDFs (see schema.sql for the
// bucket + RLS policies). Each file lives at "<owner_id>/<state>.pdf" -
// deterministic, so re-uploading a state's PDF just overwrites it, and the
// owner_id prefix is what the storage RLS policies key off of.
export const LICENSE_DOCUMENTS_BUCKET = "license-documents";

export function licenseDocumentPath(ownerId, state) {
  return `${ownerId}/${state}.pdf`;
}
