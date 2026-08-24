export default function TermsPage() {
  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 20px", lineHeight: 1.7 }}>
      <h1>Terms of Service</h1>
      <p className="subtitle">Last updated: {new Date().toLocaleDateString()}</p>

      <p>
        These Terms of Service govern text message and phone communications between you and
        your independent licensed insurance agent, regarding insurance products and services.
      </p>

      <h3>Who I Am</h3>
      <p>
        I am an independent insurance agent, not employed by or exclusively affiliated with any
        single carrier. I represent multiple carriers and help individuals compare and select
        coverage that fits their needs.
      </p>

      <h3>How You May Have Been Contacted</h3>
      <p>
        Most individuals I contact have called a licensed insurance carrier's phone line
        requesting information — whether that call was missed, disconnected, or resulted in a
        conversation that did not lead to a finalized policy. I follow up with these individuals
        by phone and text to continue assisting with their insurance inquiry.
      </p>

      <h3>Requesting Information Online</h3>
      <p>
        You may also request information directly by submitting your name and phone number
        through an online form and checking a box that reads: "By checking this box, I agree to
        receive text messages from my insurance agent regarding my insurance inquiry." Checking
        that box is your consent to the text messaging program described below.
      </p>

      <h3>Campaign Use Case</h3>
      <p>
        This texting program is a <strong>Customer Care</strong> campaign. It is used only to
        follow up with individuals who have already reached out about insurance coverage - by
        phone or through the online request form described above - never for cold outreach,
        general marketing, or messages to people who haven't already made contact.
      </p>

      <h3>Sample Messages</h3>
      <p>Examples of the kinds of text messages you may receive:</p>
      <ul>
        <li>
          "Hi [Name], this is [Agent Name], the licensed insurance agent you spoke with (or
          tried to reach). Do you have a few minutes to go over your coverage options? Reply
          STOP to opt out, HELP for help."
        </li>
        <li>
          "Hi [Name], just following up on your insurance quote - let me know if you have any
          questions! Msg &amp; data rates may apply. Reply STOP to unsubscribe."
        </li>
      </ul>

      <h3>Text Messaging Program</h3>
      <ul>
        <li>By providing your mobile number - by phone or through the online form above - you consent to receive text messages from me regarding your insurance inquiry or policy.</li>
        <li>Messages may include a link back to this Terms of Service page and to my <a href="/privacy">Privacy Policy</a>.</li>
        <li>Message frequency varies - typically a few messages during initial outreach, then only as needed afterward.</li>
        <li>Message and data rates may apply, based on your mobile carrier plan.</li>
        <li>Reply <strong>STOP</strong> at any time to opt out - you'll get one confirmation message and receive no further texts from that number unless you opt back in.</li>
        <li>Reply <strong>HELP</strong> for assistance - you'll receive a message with how to reach me directly, or contact your agent directly using the phone number they texted or called you from.</li>
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
        Your independent insurance agent<br />
        Contact information is provided in the text messages or calls you received.
      </p>
    </div>
  );
}
