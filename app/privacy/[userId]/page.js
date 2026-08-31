import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { formatDate } from "@/lib/formatDate";

export default async function PersonalizedPrivacyPolicyPage({ params }) {
  const { userId } = params;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("name, twilio_number, business_name")
    .eq("id", userId)
    .single();

  const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
  const email = userData?.user?.email || "";

  const name = profile?.name || "This agent";
  const phone = profile?.twilio_number || "";
  const businessName = profile?.business_name || "";

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 20px", lineHeight: 1.7 }}>
      <h1>Privacy Policy{businessName ? ` — ${businessName}` : ""}</h1>
      <p className="subtitle">Last updated: {formatDate(new Date())}</p>

      <p>
        This Privacy Policy explains how {name}
        {businessName ? <>, doing business as <strong>{businessName}</strong>,</> : ","} an
        independent licensed insurance agent ("I," "me," or "my"), collects, uses, and protects
        your information when you contact me or I contact you regarding insurance products and
        services.
      </p>

      <h3>Information I Collect</h3>
      <p>
        When you request information, request a quote, or otherwise reach out about insurance
        products, I may collect your name, phone number, email address, and other details
        relevant to helping you find suitable coverage.
      </p>

      <h3>How You May Have Been Contacted</h3>
      <p>
        Most individuals I first speak with have called a licensed insurance carrier's phone
        line requesting information — whether that call was missed, disconnected, or resulted
        in a conversation that did not lead to a finalized policy. I may follow up with these
        individuals by phone about their inquiry. Phone contact alone does not enroll you in
        text messages — I only send text messages to individuals who have separately opted in
        through the online form described below.
      </p>

      <h3>Requesting Information Online</h3>
      <p>
        The only way to opt in to receive text messages from me is through my{" "}
        <a href={`/request-info/${userId}`}>online Request Info form</a>. You submit your name
        and phone number and check a box that reads: "By checking this box, I agree to receive
        text messages from {name} regarding my insurance inquiry." Checking that box is your
        consent to the text messaging program described below.
      </p>

      <h3>How I Use Your Information</h3>
      <p>
        I use your information solely to follow up on your insurance inquiry, answer your
        questions, provide quotes, and service any policy you choose to purchase through me. As
        an independent agent, I represent multiple insurance carriers, and will only share your
        information with a specific carrier if you choose to move forward with a policy through
        that carrier.
      </p>

      <h3>Campaign Use Case</h3>
      <p>
        This texting program is a <strong>Customer Care</strong> campaign - used only to follow
        up with individuals who have already reached out about insurance coverage, never for
        cold outreach or general marketing.
      </p>

      <h3>Text Messaging</h3>
      <p>
        If you provide your mobile number, I may contact you by text message regarding your
        inquiry or policy - messages may include a link back to this Privacy Policy and to my{" "}
        <a href={`/terms/${userId}`}>Terms of Service</a>.{" "}
        <strong>Message frequency varies</strong> — typically a few messages during initial
        outreach, then only as needed afterward. <strong>Message and data rates may
        apply.</strong> You can opt out of text messages at any time by replying{" "}
        <strong>STOP</strong> (you'll get one confirmation message and no further texts), or get
        help by replying <strong>HELP</strong>.
      </p>
      <p>
        <strong>Your mobile phone number and consent to receive texts will never be sold,
        rented, or shared with third parties or affiliates for marketing or promotional
        purposes.</strong> It is used solely to communicate with you about your own insurance
        inquiry.
      </p>

      <h3>Data Security</h3>
      <p>
        I take reasonable steps to protect your personal information, including secure storage
        of sensitive data such as Social Security numbers and banking information when provided
        for policy applications.
      </p>

      <h3>Your Choices</h3>
      <p>
        You can stop receiving text messages at any time by replying <strong>STOP</strong> to
        any text from me. For any other questions about your information, reply{" "}
        <strong>HELP</strong>{phone ? <> or call/text <strong>{phone}</strong> directly</> : ""}.
      </p>

      <h3>Contact</h3>
      <p>
        {name}{businessName ? <> — {businessName}</> : ""}<br />
        Independent Insurance Agent<br />
        {phone && <>Phone: {phone}</>}
      </p>
    </div>
  );
}
