// Static phone directory for the carriers UE NobleDesk agents write business
// with. Logos are pulled live from a favicon service based on each domain -
// no image assets to maintain. Phone numbers are the best publicly-listed
// agent/producer lines found for each carrier, cross-checked against the
// agent's own carrier contact sheet; if one is wrong or a carrier changes a
// line, just edit it here. `emails`, where present, show under the matching
// phone number in the same category.
export const CARRIERS = [
  {
    id: "aflac",
    name: "Aflac",
    domain: "aflac.com",
    phones: {
      agentCommissions: "833-504-0336 (Opt 3, then 1)",
      policyServices: "833-504-0336 (Opt 3, then 5) - active FE policy",
      policyInformation: "800-992-3522",
      agentSupport: "833-504-0336 (Opt 3, then 3) - new/pending",
    },
    emails: {
      agentCommissions: "information@aflac.aetna.com",
    },
  },
  {
    id: "american-amicable",
    name: "American Amicable",
    domain: "americanamicable.com",
    phones: {
      agentCommissions: "800-736-7311 (Opt 1, 1, 4)",
      policyServices: "800-736-7311 (Opt 1, 1, 7)",
      policyInformation: "800-736-7311",
      agentSupport: "800-736-7311 (Opt 1, 1, 1)",
    },
    emails: {
      agentCommissions: "commissions@aatx.com",
      agentSupport: "cx@aatx.com",
    },
  },
  {
    id: "american-home-life",
    name: "American Home Life",
    domain: "amhomelife.com",
    phones: {
      agentCommissions: "833-504-0334",
      policyServices: "800-259-0468 (Final Expense)",
      policyInformation: "800-876-0199",
      agentSupport: "833-504-0334 / 833-380-2777 (New Business)",
    },
  },
  {
    id: "americo",
    name: "Americo",
    domain: "americo.com",
    phones: {
      agentCommissions: "800-231-0801",
      policyServices: "816-641-2850",
      policyInformation: "816-641-2850",
      agentSupport: "800-231-0801",
    },
    emails: {
      agentCommissions: "agent.services@americo.com",
    },
  },
  {
    id: "corebridge",
    name: "Corebridge",
    domain: "corebridgefinancial.com",
    phones: {
      agentCommissions: "877-246-4501",
      policyServices: "844-452-3832",
      policyInformation: "888-280-1243",
      agentSupport: "800-255-2702 (Opt 1)",
    },
    emails: {
      agentCommissions: "CommissionResearch@corebridgefinancial.com",
    },
  },
  {
    id: "ethos",
    name: "Ethos",
    domain: "ethos.com",
    passwordNote: "Sends 6-Digit Code To Sign In",
    phones: {
      agentCommissions: "415-797-0864",
      policyServices: "888-384-6754",
      policyInformation: "415-915-0665",
      agentSupport: "415-639-3968",
    },
    emails: {
      agentCommissions: "agents@getethos.com",
      agentSupport: "support@ethoslife.com",
    },
  },
  {
    id: "mutual-of-omaha",
    name: "Mutual of Omaha",
    domain: "mutualofomaha.com",
    phones: {
      agentCommissions: "800-693-6083",
      // Agent's confirmed number was 800-775-6000; the carrier contact
      // sheet lists 800-775-7894 (Individual Life) for this same line -
      // flagged as a conflict, not silently overwritten.
      policyServices: "800-775-6000",
      policyInformation: "800-775-6000",
      agentSupport: "800-693-6083 (Sales)",
    },
    emails: {
      agentCommissions: "broker.compensation@mutualofomaha.com",
      agentSupport: "sales.support@mutualofomaha.com",
    },
  },
  {
    id: "occidental",
    name: "Occidental",
    domain: "occidentallife.com",
    phones: {
      agentCommissions: "800-736-7311 (Opt 1, 1, 4)",
      policyServices: "800-736-7311 (Opt 1, 1, 7)",
      policyInformation: "800-736-7311",
      agentSupport: "800-736-7311 (Opt 1, 1, 1)",
    },
    emails: {
      agentCommissions: "commissions@aatx.com",
    },
  },
  {
    id: "royal-neighbors",
    name: "Royal Neighbors",
    domain: "royalneighbors.org",
    loginHint: "Download \"2FAS Auth\" App on Mobile Device For Login Code",
    phones: {
      agentCommissions: "800-627-4762 (Opt 1, 2)",
      policyServices: "800-627-4762",
      policyInformation: "800-627-4762",
      agentSupport: "309-788-4561 (Opt 1, then 5)",
    },
    emails: {
      agentCommissions: "commissions@royalneighbors.org",
    },
    extraPhones: [
      { label: "Send a Policy Packet", value: "309-788-4561 (Opt 1, 1, 1)" },
    ],
  },
  {
    id: "transamerica",
    name: "Transamerica",
    domain: "transamerica.com",
    phones: {
      agentCommissions: "877-234-4848 (Opt 2)",
      policyServices: "877-234-4848 (Opt 4)",
      policyInformation: "800-851-9777",
      agentSupport: "877-234-4848 (Opt 1, NB/UW)",
    },
    emails: {
      agentCommissions: "commissions@transamerica.com",
    },
  },
];

export const PHONE_CATEGORIES = [
  { key: "agentCommissions", label: "Agent Commissions" },
  { key: "policyServices", label: "Policy Services (Cancel / Change)" },
  { key: "policyInformation", label: "Policy Information" },
  { key: "agentSupport", label: "Agent Support" },
];
