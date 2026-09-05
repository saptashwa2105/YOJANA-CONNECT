/**
 * Canonical Scheme ID Mapping and Alias Resolution Utility
 * 
 * Ensures consistent scheme identifiers across SQLite database and RAG vector store.
 */

// All canonical scheme IDs
const CANONICAL_SCHEME_IDS = [
  'pm-kisan',
  'pmay-g',
  'pmay-u',
  'pmuy',
  'pmmy',
  'pmjay',
  'apy',
  'ssy',
  'kcc',
  'pm-svanidhi',
  'pm-vishwakarma',
  'pm-poshan',
  'ignoaps',
  'stand-up-india',
  'pm-daksh',
  'pmfby',
  'pmgkay',
  'pmjjby',
  'pmsby',
  'post-matric-scholarship',
  'higher-education-grant',
];

// Map of alias / legacy ID -> canonical scheme ID
const SCHEME_ALIASES = {
  // Scholarships
  'post-matric': 'post-matric-scholarship',
  'mp-scholarship': 'post-matric-scholarship',
  'nsp-scholarship': 'post-matric-scholarship',
  'scholarship': 'post-matric-scholarship',
  'higher-education': 'higher-education-grant',
  'pm-scholarship': 'higher-education-grant',
  'college-scholarship': 'higher-education-grant',

  // PMUY
  'pm-ujjwala-yojana': 'pmuy',
  'pm-ujjwala': 'pmuy',
  'ujjwala': 'pmuy',

  // PMMY
  'pm-mudra-yojana': 'pmmy',
  'pm-mudra': 'pmmy',
  'mudra': 'pmmy',

  // PMJAY
  'ayushman-bharat-pmjay': 'pmjay',
  'ayushman-bharat': 'pmjay',
  'ab-pmjay': 'pmjay',
  'pm-jay': 'pmjay',

  // APY
  'atal-pension-yojana': 'apy',

  // SSY
  'sukanya-samriddhi-yojana': 'ssy',

  // KCC
  'kisan-credit-card': 'kcc',

  // IGNOAPS / NSAP
  'nsap-ignops': 'ignoaps',
  'nsap-ignoaps': 'ignoaps',
  'ignoaps-nsap': 'ignoaps',
  'nsap': 'ignoaps',

  // PMAY-G & PMAY-U
  'pmayg': 'pmay-g',
  'pmayu': 'pmay-u',

  // PM SVANidhi
  'pmsvanidhi': 'pm-svanidhi',

  // PM Vishwakarma
  'pmvishwakarma': 'pm-vishwakarma',

  // PM POSHAN
  'pmposhan': 'pm-poshan',
  'mid-day-meal': 'pm-poshan',

  // Stand-Up India
  'standup-india': 'stand-up-india',

  // PM-DAKSH
  'pmdaksh': 'pm-daksh',

  // PMFBY
  'pm-fasal-bima-yojana': 'pmfby',

  // PMGKAY
  'pm-garib-kalyan-anna-yojana': 'pmgkay',

  // PMJJBY
  'pm-jeevan-jyoti-bima-yojana': 'pmjjby',

  // PMSBY
  'pm-suraksha-bima-yojana': 'pmsby',
};

/**
 * Keywords mapping to identify schemes mentioned in conversation context or messages
 */
const SCHEME_KEYWORDS = [
  { id: 'pm-kisan', terms: ['pm-kisan', 'pm kisan', 'pmkisan', 'kisan samman', 'किसान सम्मान', 'किसान सन्मान', 'किसान', 'शेतकरी', 'விவசாயி', 'கிசான்'] },
  { id: 'pmuy', terms: ['pmuy', 'pm-ujjwala', 'ujjwala', 'उज्ज्वला', 'उज्वला', 'lpg', 'gas cylinder', 'cooking fuel', 'गॅस'] },
  { id: 'pmmy', terms: ['pmmy', 'pm-mudra', 'mudra', 'मुद्रा', 'shishu', 'kishor', 'tarun'] },
  { id: 'pmjay', terms: ['pmjay', 'pm-jay', 'ayushman', 'आयुष्मान', 'golden card', 'jan arogya', 'health insurance', 'आरोग्य', 'மருத்துவக் காப்பீடு'] },
  { id: 'apy', terms: ['apy', 'atal pension', 'अटल पेंशन', 'अटल पेन्शन'] },
  { id: 'ssy', terms: ['ssy', 'sukanya', 'सुकन्या', 'girl child'] },
  { id: 'kcc', terms: ['kcc', 'kisan credit', 'किसान क्रेडिट'] },
  { id: 'pm-svanidhi', terms: ['pm-svanidhi', 'svanidhi', 'स्वनिधि', 'स्वनिधी', 'street vendor', 'रेहड़ी', 'फेरीवाले'] },
  { id: 'pm-vishwakarma', terms: ['pm-vishwakarma', 'vishwakarma', 'विश्वकर्मा', 'artisan', 'कारागीर'] },
  { id: 'pm-poshan', terms: ['pm-poshan', 'poshan', 'पोषण', 'mid day meal', 'mid-day meal', 'माध्यान्ह भोजन'] },
  { id: 'ignoaps', terms: ['ignoaps', 'nsap', 'old age pension', 'वृद्धावस्था पेंशन', 'वृद्धापकाळ पेन्शन'] },
  { id: 'stand-up-india', terms: ['stand-up-india', 'standup india', 'stand up india'] },
  { id: 'pm-daksh', terms: ['pm-daksh', 'daksh', 'दक्ष'] },
  { id: 'pmfby', terms: ['pmfby', 'fasal bima', 'फसल बीमा', 'पिक विमा', 'crop insurance'] },
  { id: 'pmgkay', terms: ['pmgkay', 'garib kalyan anna', 'गरीब कल्याण अन्न', 'free ration', 'मोफत धान्य'] },
  { id: 'pmjjby', terms: ['pmjjby', 'jeevan jyoti', 'जीवन ज्योति', 'जीवन ज्योती'] },
  { id: 'pmsby', terms: ['pmsby', 'suraksha bima', 'सुरक्षा बीमा', 'सुरक्षा विमा'] },
  { id: 'pmay-g', terms: ['pmay-g', 'pmayg', 'awas yojana gramin', 'आवास योजना ग्रामीण', 'घरकुल ग्रामीण'] },
  { id: 'pmay-u', terms: ['pmay-u', 'pmayu', 'awas yojana urban', 'आवास योजना शहरी', 'घरकुल शहरी'] },
];

/**
 * Resolves a given scheme ID or alias to its canonical ID.
 * If the ID is already canonical or unknown, returns the normalized lowercase string.
 * 
 * @param {string} id - The scheme ID or alias to resolve
 * @returns {string} The canonical scheme ID
 */
function resolveCanonicalSchemeId(id) {
  if (!id || typeof id !== 'string') return id;
  const normalized = id.trim().toLowerCase();
  return SCHEME_ALIASES[normalized] || normalized;
}

/**
 * Extracts a canonical scheme ID if mentioned in text
 * 
 * @param {string} text - Message or turn content
 * @returns {string|null} Canonical scheme ID or null
 */
function extractSchemeIdFromText(text) {
  if (!text || typeof text !== 'string') return null;
  const lower = text.toLowerCase();

  for (const { id, terms } of SCHEME_KEYWORDS) {
    for (const term of terms) {
      if (lower.includes(term.toLowerCase())) {
        return id;
      }
    }
  }
  return null;
}

/**
 * Scans conversation turns backwards to identify the most recently discussed scheme
 * 
 * @param {Array} conversation - Array of { role, content } objects
 * @returns {string|null} Canonical scheme ID or null
 */
function extractSchemeIdFromConversation(conversation = []) {
  if (!Array.isArray(conversation) || conversation.length === 0) return null;
  for (let i = conversation.length - 1; i >= 0; i--) {
    const item = conversation[i];
    if (item && item.content) {
      const found = extractSchemeIdFromText(item.content);
      if (found) return found;
    }
  }
  return null;
}

module.exports = {
  CANONICAL_SCHEME_IDS,
  SCHEME_ALIASES,
  SCHEME_KEYWORDS,
  resolveCanonicalSchemeId,
  extractSchemeIdFromText,
  extractSchemeIdFromConversation,
};
