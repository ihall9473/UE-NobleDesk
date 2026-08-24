export default function PrivacyPolicyPage() {
  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 20px", lineHeight: 1.7 }}>
      <h1>Privacy Policy</h1>
      <p className="subtitle">Last updated: {new Date().toLocaleDateString()}</p>

      <p>
        This Privacy Policy explains how your independent licensed insurance agent ("I," "me,"
        or "my") collects, uses, and protects your information when you contact me or I contact
        you regarding insurance products and services.
      </p>

      <h3>Information I Collect</h3>
      <p>
        When you request information, request a quote, or otherwise reach out about insurance
        products, I may collect your name, phone number, email address, and other details
        relevant to helping you find suitable coverage.
      </p>

      <h3>How You May Have Been Contacted</h3>
      <p>
        Most individuals I contact have called a licensed insurance carrier's phone line
        requesting information — whether that call was missed, disconnected, or resulted in a
        conversation that did not lead to a finalized policy. I follow up with these individuals
        by phone and text to continue assisting with their insurance inquiry.
      </p>

      <h3>How I Use Your Information</h3>
      <p>
        I use your information solely to follow up on your insurance inquiry, answer your
        questions, provide quotes, and service any policy you choose to purchase through me. As
        an independent agent, I represent multiple insurance carriers and will only share your
        information with a specific carrier if you choose to move forward with a policy through
        that carrier.
      </p>

      <h3>Text Messaging</h3>
      <p>
        If you provide your mobile number, I may contact you by text message regarding your
        inquiry or policy. <strong>Message frequency varies</strong> — typically a few messages
        during initial outreach, then only as needed afterward. <strong>Message and data rates
        may apply.</strong> You can opt out of text messages at any time by replying{" "}
        <strong>STOP</strong>, or get help by replying <strong>HELP</strong>.
      </p>
      <p>
        <strong>Your mobile phone number and consent to receive texts will never be sold,
        rented, or shared with third parties for marketing purposes.</strong> It is used solely
        to communicate with you about your own insurance inquiry.
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
        <strong>HELP</strong> or contact your agent directly using the phone number they
        texted or called you from.
      </p>

      <h3>Contact</h3>
      <p>
        Your independent insurance agent<br />
        Contact information is provided in the text messages or calls you received.
      </p>
    </div>
  );
}
