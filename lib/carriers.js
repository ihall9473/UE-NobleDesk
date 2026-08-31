// Static phone directory for the carriers UE NobleDesk agents write business
// with. Logos are pulled live from a favicon service based on each domain -
// no image assets to maintain. Phone numbers are the best publicly-listed
// agent/producer lines found for each carrier; if one is wrong or a carrier
// changes a line, just edit it here.
export const CARRIERS = [
  {
    id: "aflac",
    name: "Aflac",
    domain: "aflac.com",
    phones: {
      agentCommissions: "833-504-0336",
      policyServices: "800-992-3522",
      policyInformation: "800-992-3522",
      agentSupport: "833-504-0336",
    },
  },
  {
    id: "american-amicable",
    name: "American Amicable",
    domain: "americanamicable.com",
    phones: {
      agentCommissions: "800-736-7311 (Opt 1, 1, 4)",
      policyServices: "800-736-7311 (Opt 1, 1, 1)",
      policyInformation: "800-736-7311",
      agentSupport: "800-736-7311 (Opt 1, 1, 2)",
    },
  },
  {
    id: "american-home-life",
    name: "American Home Life",
    domain: "amhomelife.com",
    phones: {
      agentCommissions: "833-504-0334",
      policyServices: "800-876-0199",
      policyInformation: "800-876-0199",
      agentSupport: "785-235-6276",
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
      agentSupport: "866-214-0054",
    },
  },
  {
    id: "corebridge",
    name: "Corebridge",
    domain: "corebridgefinancial.com",
    phones: {
      agentCommissions: "877-246-4501",
      policyServices: "800-448-2542",
      policyInformation: "888-280-1243",
      agentSupport: "877-246-4501",
    },
  },
  {
    id: "ethos",
    name: "Ethos",
    domain: "ethos.com",
    passwordNote: "Sends 6-Digit Code To Sign In",
    phones: {
      agentCommissions: "415-797-0864",
      policyServices: "415-915-0665",
      policyInformation: "415-915-0665",
      agentSupport: "415-322-2037",
    },
  },
  {
    id: "mutual-of-omaha",
    name: "Mutual of Omaha",
    domain: "mutualofomaha.com",
    phones: {
      agentCommissions: "800-693-6083",
      policyServices: "800-775-6000",
      policyInformation: "800-775-6000",
      agentSupport: "877-202-2676",
    },
  },
  {
    id: "occidental",
    name: "Occidental",
    domain: "occidentallife.com",
    phones: {
      agentCommissions: "800-736-7311 (Opt 1, 1, 4)",
      policyServices: "800-736-7311 (Opt 1, 1, 1)",
      policyInformation: "800-736-7311",
      agentSupport: "800-736-7311 (Opt 1, 1, 2)",
    },
  },
  {
    id: "royal-neighbors",
    name: "Royal Neighbors",
    domain: "royalneighbors.org",
    loginHint: "Download \"2FAS Auth\" App on Mobile Device For Login Code",
    phones: {
      agentCommissions: "800-627-4762 (Opt 1, 2)",
      policyServices: "866-733-9758 (Opt 1)",
      policyInformation: "800-627-4762",
      agentSupport: "309-788-4561 (Opt 1, then 5)",
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
      policyServices: "866-301-2473",
      policyInformation: "800-851-9777",
      agentSupport: "877-234-4848",
    },
  },
];

export const PHONE_CATEGORIES = [
  { key: "agentCommissions", label: "Agent Commissions" },
  { key: "policyServices", label: "Policy Services (Cancel / Change)" },
  { key: "policyInformation", label: "Policy Information" },
  { key: "agentSupport", label: "Agent Support" },
];
