import { supabaseAdmin } from "@/lib/supabaseAdmin";
import RequestInfoForm from "@/app/components/RequestInfoForm";

export default async function RequestInfoPage({ params }) {
  const { userId } = params;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("name")
    .eq("id", userId)
    .single();

  const agentName = profile?.name || "This agent";

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "60px 20px" }}>
      <h1>Request Insurance Info</h1>
      <p className="subtitle">
        Fill this out and {agentName}, an independent licensed insurance agent, will reach out
        to help with your coverage options.
      </p>
      <RequestInfoForm userId={userId} agentName={agentName} />
    </div>
  );
}
