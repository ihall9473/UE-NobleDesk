import { encrypt } from "@/lib/encryption";

// Turns a plain-text client form submission into a DB row, encrypting
// SSN/bank fields along the way. Used by both create and update.
export function buildDetailsRow(body, ownerId, contactId) {
  const row = {
    contact_id: contactId,
    owner_id: ownerId,
    carrier: body.carrier || null,
    policy_product: body.policyProduct || null,
    graded: body.policyProduct === "Whole Life" && body.graded !== undefined ? !!body.graded : null,
    coverage_amount: body.coverageAmount || null,
    monthly_premium: body.monthlyPremium || null,
    policy_number: body.policyNumber || null,
    policy_type: body.policyType || null,
    original_carrier: body.policyType === "policy_flip" ? body.originalCarrier || null : null,
    draft_date: body.draftDate || null,
    // Auto-stamped with today's date the first time a client is created
    // (see the create route), but always editable after that - if the
    // form sends its own value, that wins.
    application_submitted_date: body.applicationSubmittedDate || null,
    primary_beneficiaries: body.primaryBeneficiaries || [],
    contingent_beneficiaries: body.contingentBeneficiaries || [],
    date_of_birth: body.dateOfBirth || null,
    birth_state: body.birthState || null,
    smoker: body.smoker === undefined || body.smoker === "" ? null : !!body.smoker,
    email: body.email || null,
    address_line: body.addressLine || null,
    apt_unit: body.aptUnit || null,
    city: body.city || null,
    state: body.state || null,
    zip: body.zip || null,
    health: body.health || null,
    height: body.height || null,
    weight: body.weight || null,
    is_owner: body.isOwner === undefined || body.isOwner === "" ? true : !!body.isOwner,
    owner_first_name: body.isOwner === false ? body.ownerFirstName || null : null,
    owner_last_name: body.isOwner === false ? body.ownerLastName || null : null,
    owner_relationship: body.isOwner === false ? body.ownerRelationship || null : null,
    account_type: body.accountType || null,
    bank_name: body.bankName || null,
    updated_at: new Date().toISOString(),
  };

  // Only re-encrypt if a new value was actually typed - lets the edit form
  // leave these blank to mean "don't change it."
  if (body.ssn) row.ssn_encrypted = encrypt(body.ssn);
  if (body.routingNumber) row.routing_number_encrypted = encrypt(body.routingNumber);
  if (body.accountNumber) row.account_number_encrypted = encrypt(body.accountNumber);

  return row;
}
