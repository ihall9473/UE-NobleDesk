import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { LICENSE_DOCUMENTS_BUCKET, licenseDocumentPath } from "@/lib/licenseDocuments";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

// A short-lived signed URL to view/download the PDF - the bucket is
// private, so there's no permanent public link to hand out.
export async function GET(req) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const state = req.nextUrl.searchParams.get("state");
  if (!state) return NextResponse.json({ error: "Missing state" }, { status: 400 });

  const { data, error } = await supabase.storage
    .from(LICENSE_DOCUMENTS_BUCKET)
    .createSignedUrl(licenseDocumentPath(user.id, state), 60);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ url: data.signedUrl });
}

// Uploading a license PDF is entirely optional and separate from the
// licensed/not-licensed toggle - but since there's no reason to have a
// license PDF for a state you're not licensed in, this also marks the
// state licensed if it wasn't already.
export async function POST(req) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const form = await req.formData();
  const state = form.get("state");
  const file = form.get("file");
  if (!state || !file) return NextResponse.json({ error: "Missing state or file" }, { status: 400 });
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files are accepted" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "That PDF is too large - 10MB max" }, { status: 400 });
  }

  const path = licenseDocumentPath(user.id, state);
  const { error: uploadError } = await supabase.storage
    .from(LICENSE_DOCUMENTS_BUCKET)
    .upload(path, file, { contentType: "application/pdf", upsert: true });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { error } = await supabase.from("licensed_states").upsert(
    {
      owner_id: user.id,
      state,
      document_path: path,
      document_name: file.name,
      document_uploaded_at: new Date().toISOString(),
    },
    { onConflict: "owner_id,state" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// Removes just the PDF - the state stays licensed either way.
export async function DELETE(req) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { state } = await req.json();
  if (!state) return NextResponse.json({ error: "Missing state" }, { status: 400 });

  const { error: removeError } = await supabase.storage
    .from(LICENSE_DOCUMENTS_BUCKET)
    .remove([licenseDocumentPath(user.id, state)]);
  if (removeError) return NextResponse.json({ error: removeError.message }, { status: 500 });

  const { error } = await supabase
    .from("licensed_states")
    .update({ document_path: null, document_name: null, document_uploaded_at: null })
    .eq("owner_id", user.id)
    .eq("state", state);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
