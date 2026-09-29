import { formatDate } from "@/lib/formatDate";

// Plain-text versions of the Privacy Policy / Terms of Service copy shown on
// app/privacy/[userId] and app/terms/[userId], for agents to paste verbatim
// into Mailchimp's SMS program registration form (which wants the actual
// wording, not a link to it).
export function buildPrivacyPolicyText({ name, businessName, phone }) {
  const agent = name || "This agent";
  const dba = businessName ? `, doing business as ${businessName},` : ",";

  return `Privacy Policy${businessName ? ` — ${businessName}` : ""}
Last updated: ${formatDate(new Date())}

This Privacy Policy explains how ${agent}${dba} an independent licensed insurance agent ("I," "me," or "my"), collects, uses, and protects your information when you contact me or I contact you regarding insurance products and services.

Information I Collect
When you request information, request a quote, or otherwise reach out about insurance products, I may collect your name, phone number, email address, and other details relevant to helping you find suitable coverage.

How You May Have Been Contacted
Most individuals I first speak with have called a licensed insurance carrier's phone line requesting information — whether that call was missed, disconnected, or resulted in a conversation that did not lead to a finalized policy. I may follow up with these individuals by phone about their inquiry. Phone contact alone does not enroll you in text messages — I only send text messages to individuals who have separately opted in through the online form described below.

Requesting Information Online
The only way to opt in to receive text messages from me is through my online Request Info form. You submit your name and phone number and check a box that reads: "By checking this box, I agree to receive text messages from ${agent} regarding my insurance inquiry." Checking that box is your consent to the text messaging program described below.

How I Use Your Information
I use your information solely to follow up on your insurance inquiry, answer your questions, provide quotes, and service any policy you choose to purchase through me. As an independent agent, I represent multiple insurance carriers, and will only share your information with a specific carrier if you choose to move forward with a policy through that carrier.

Campaign Use Case
This texting program is a Customer Care campaign - used only to follow up with individuals who have already reached out about insurance coverage, never for cold outreach or general marketing.

Text Messaging
If you provide your mobile number, I may contact you by text message regarding your inquiry or policy - messages may include a link back to this Privacy Policy and to my Terms of Service. Message frequency varies — typically a few messages during initial outreach, then only as needed afterward. Message and data rates may apply. You can opt out of text messages at any time by replying STOP (you'll get one confirmation message and no further texts), or get help by replying HELP.

Your mobile phone number and consent to receive texts will never be sold, rented, or shared with third parties or affiliates for marketing or promotional purposes. It is used solely to communicate with you about your own insurance inquiry.

Data Security
I take reasonable steps to protect your personal information, including secure storage of sensitive data such as Social Security numbers and banking information when provided for policy applications.

Your Choices
You can stop receiving text messages at any time by replying STOP to any text from me. For any other questions about your information, reply HELP${phone ? ` or call/text ${phone} directly` : ""}.

Contact
${agent}${businessName ? ` — ${businessName}` : ""}
Independent Insurance Agent
${phone ? `Phone: ${phone}` : ""}`;
}

export function buildTermsOfServiceText({ name, businessName, phone }) {
  const agent = name || "This agent";
  const dba = businessName ? `, doing business as ${businessName},` : ",";

  return `Terms of Service${businessName ? ` — ${businessName}` : ""}
Last updated: ${formatDate(new Date())}

These Terms of Service govern text message and phone communications between you and ${agent}${dba} an independent licensed insurance agent, regarding insurance products and services.

Who I Am
I am an independent insurance agent, not employed by or exclusively affiliated with any single carrier. I represent multiple carriers and help individuals compare and select coverage that fits their needs.

How You May Have Been Contacted
Most individuals I first speak with have called a licensed insurance carrier's phone line requesting information — whether that call was missed, disconnected, or resulted in a conversation that did not lead to a finalized policy. I may follow up with these individuals by phone about their inquiry. Phone contact alone does not enroll you in text messages — texting requires the separate online opt-in described below.

Requesting Information Online
The only way to opt in to receive text messages from me is through my online Request Info form. You submit your name and phone number and check a box that reads: "By checking this box, I agree to receive text messages from ${agent} regarding my insurance inquiry." Checking that box is your consent to the text messaging program described below.

Campaign Use Case
This texting program is a Customer Care campaign. It is used only to follow up with individuals who have opted in through the online request form described above - never for cold outreach, general marketing, or messages to people who haven't opted in.

Sample Messages
Examples of the kinds of text messages you may receive:
- "Hi [Name], this is ${agent}, the licensed insurance agent you spoke with (or tried to reach). Do you have a few minutes to go over your coverage options? Reply STOP to opt out, HELP for help."
- "Hi [Name], just following up on your insurance quote - let me know if you have any questions! Msg & data rates may apply. Reply STOP to unsubscribe."

Text Messaging Program
- By checking the consent box on my online Request Info form, you consent to receive text messages from me regarding your insurance inquiry or policy.
- Messages may include a link back to this Terms of Service page and to my Privacy Policy.
- Message frequency varies - typically a few messages during initial outreach, then only as needed afterward.
- Message and data rates may apply, based on your mobile carrier plan.
- Reply STOP at any time to opt out - you'll get one confirmation message and receive no further texts from that number unless you opt back in.
- Reply HELP for assistance${phone ? `, or call/text ${phone} directly` : ""}.
- Carriers are not liable for delayed or undelivered messages.

No Guarantee of Coverage
Contacting me, receiving a quote, or exchanging messages does not guarantee insurance coverage or approval. All policies are subject to underwriting and approval by the issuing carrier.

Your Information
See my Privacy Policy for details on how your information is collected, used, and protected. Your mobile number will never be sold or shared with third parties or affiliates for marketing or promotional purposes.

Changes to These Terms
I may update these terms from time to time. Continued communication after changes are posted constitutes acceptance of the updated terms.

Contact
${agent}${businessName ? ` — ${businessName}` : ""}
Independent Insurance Agent
${phone ? `Phone: ${phone}` : ""}`;
}
