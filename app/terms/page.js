export default function TermsPage() {
  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 20px", lineHeight: 1.7 }}>
      <h1>Terms of Service</h1>
      <p className="subtitle">Last updated: {new Date().toLocaleDateString()}</p>

      <p>
        These Terms of Service govern text message and phone communications between you and
        Isaac Hall, an independent licensed insurance agent, regarding insurance products and
        services.
      </p>

      <h3>Who I Am</h3>
      <p>
        I am an independent insurance agent, not employed by or exclusively affiliated with any
        single carrier. I represent multiple carriers, including Transamerica, Mutual of Omaha,
        Americo, and Aflac, and help individuals compare and select coverage that fits their
        needs.
      </p>

      <h3>How You May Have Been Contacted</h3>
      <p>
        Most individuals I contact have called a licensed insurance carrier's phone line
        requesting information — whether that call was missed, disconnected, or resulted in a
        conversation that did not lead to a finalized policy. I follow up with these individuals
        by phone and text to continue assisting with their insurance inquiry.
      </p>

      <h3>Text Messaging Program</h3>
      <ul>
        <li>By providing your mobile number, you consent to receive text messages from me regarding your insurance inquiry or policy.</li>
        <li>Message frequency varies - typically a few messages during initial outreach, then only as needed afterward.</li>
        <li>Message and data rates may apply, based on your mobile carrier plan.</li>
        <li>Reply <strong>STOP</strong> at any time to opt out of further text messages.</li>
        <li>Reply <strong>HELP</strong> for assistance, or call/text 330-607-9473 directly.</li>
        <li>Carriers are not liable for delayed or undelivered messages.</li>
      </ul>

      <h3>No Guarantee of Coverage</h3>
      <p>
        Contacting me, receiving a quote, or exchanging messages does not guarantee insurance
        coverage or approval. All policies are subject to underwriting and approval by the
        issuing carrier.
      </p>

      <h3>Your Information</h3>
      <p>
        See my <a href="/privacy">Privacy Policy</a> for details on how your information is
        collected, used, and protected. Your mobile number will never be sold or shared for
        marketing purposes.
      </p>

      <h3>Changes to These Terms</h3>
      <p>
        I may update these terms from time to time. Continued communication after changes are
        posted constitutes acceptance of the updated terms.
      </p>

      <h3>Contact</h3>
      <p>
        Isaac Hall<br />
        Independent Insurance Agent<br />
        Phone: 330-607-9473
      </p>
    </div>
  );
}
