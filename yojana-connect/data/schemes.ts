export interface Scheme {
  id: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  state: string;
  tags: string[];
  benefits: string[];
  eligibility: string[];
  ministry: string;
  applicationUrl: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export const CATEGORIES: Category[] = [
  { id: "all", name: "All Schemes", icon: "🌐" },
  { id: "agriculture", name: "Agriculture & Farming", icon: "🌾" },
  { id: "healthcare", name: "Health & Wellness", icon: "🏥" },
  { id: "housing", name: "Housing & Shelter", icon: "🏠" },
  { id: "business", name: "Business & MSME", icon: "💼" },
  { id: "education", name: "Education & Skills", icon: "🎓" },
  { id: "social-welfare", name: "Social Welfare", icon: "🤝" },
];

export const STATES: string[] = [
  "All States",
  "All India",
  "Maharashtra",
  "Uttar Pradesh",
  "Karnataka",
  "Tamil Nadu",
  "Gujarat",
  "Delhi",
  "Rajasthan",
  "Madhya Pradesh",
  "Kerala",
  "West Bengal",
];

export const SCHEMES: Scheme[] = [
  {
    id: "pm-kisan",
    name: "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
    shortDescription: "Direct financial assistance of ₹6,000 per year delivered in three installments to farmer families across India.",
    fullDescription: "PM-KISAN is a central sector scheme with 100% funding from the Government of India. Under the scheme, income support of ₹6,000 per year is provided to all landholding farmer families across the country in three equal installments of ₹2,000 directly into their bank accounts via DBT.",
    category: "Agriculture & Farming",
    state: "All India",
    tags: ["Income Support", "Farmers", "Direct Benefit Transfer"],
    benefits: [
      "₹6,000 annual direct cash transfer",
      "3 equal quarterly installments of ₹2,000",
      "Direct to Aadhaar-seeded bank account",
      "No middlemen or physical documentation needed"
    ],
    eligibility: [
      "Small and marginal landholder farmer families",
      "Landholding records in state land administration system",
      "Aadhaar card mandatory"
    ],
    ministry: "Ministry of Agriculture & Farmers Welfare",
    applicationUrl: "https://pmkisan.gov.in",
  },
  {
    id: "ayushman-bharat",
    name: "Ayushman Bharat (PM-JAY)",
    shortDescription: "Flagship national health protection scheme providing ₹5,00,000 cashless secondary and tertiary care hospitalization cover.",
    fullDescription: "Pradhan Mantri Jan Arogya Yojana (AB-PMJAY) is the world's largest government-funded healthcare assurance scheme. It provides health coverage up to ₹5 lakh per family per year for secondary and tertiary care hospitalization across public and private empanelled hospitals.",
    category: "Health & Wellness",
    state: "All India",
    tags: ["Health Insurance", "Cashless Hospitalization", "Medical Cover"],
    benefits: [
      "₹5,00,000 annual health cover per family",
      "Covers 1,949 medical packages and surgical procedures",
      "100% cashless and paperless access at point of service",
      "Pre-existing conditions covered from day one"
    ],
    eligibility: [
      "Families listed under SECC 2011 database",
      "Occupational criteria for urban workers and rural deprivation criteria",
      "All senior citizens aged 70+ irrespective of income"
    ],
    ministry: "National Health Authority, Ministry of Health & Family Welfare",
    applicationUrl: "https://pmjay.gov.in",
  },
  {
    id: "pm-awas-yojana",
    name: "Pradhan Mantri Awas Yojana (PMAY)",
    shortDescription: "Affordable housing initiative providing financial assistance and credit-linked interest subsidies for pucca homes.",
    fullDescription: "PMAY addresses the housing requirement of urban and rural poor, including slum dwellers. It provides central assistance to implementing agencies and Credit Linked Subsidy Scheme (CLSS) for interest rate concession on home acquisition loans.",
    category: "Housing & Shelter",
    state: "All India",
    tags: ["Pucca House", "Interest Subsidy", "Housing For All"],
    benefits: [
      "Up to ₹2.67 lakh interest subsidy under CLSS",
      "Direct financial grant for home construction",
      "Basic amenities provided: water, sanitation, electricity",
      "Mandatory woman co-ownership empowerment"
    ],
    eligibility: [
      "Family must not own a pucca house in any part of India",
      "Annual household income under EWS, LIG, or MIG slabs",
      "Aadhaar identification of all family members"
    ],
    ministry: "Ministry of Housing and Urban Affairs",
    applicationUrl: "https://pmaymis.gov.in",
  },
  {
    id: "pm-svanidhi",
    name: "PM SVANidhi (Street Vendor's AtmaNirbhar Nidhi)",
    shortDescription: "Collateral-free working capital micro-credit up to ₹50,000 empowering urban, peri-urban, and rural street vendors.",
    fullDescription: "Launched to provide affordable working capital loans to street vendors to resume livelihoods adversely affected by economic disruptions. The scheme incentivizes digital payments through cashbacks and offers interest subsidies on timely loan servicing.",
    category: "Business & MSME",
    state: "All India",
    tags: ["Micro-credit", "Street Vendors", "Working Capital"],
    benefits: [
      "Initial working capital loan up to ₹10,000, progressing to ₹50,000",
      "7% interest subsidy credited directly to bank account",
      "Cashback up to ₹1,200 per annum on digital transactions",
      "No collateral or security deposit required"
    ],
    eligibility: [
      "Street vendors vending in urban areas on or before March 24, 2020",
      "Possession of Certificate of Vending or Identity Card issued by ULBs",
      "Vendors identified in the Urban Local Body survey"
    ],
    ministry: "Ministry of Housing and Urban Affairs",
    applicationUrl: "https://pmsvanidhi.mohua.gov.in",
  },
  {
    id: "naps-skill",
    name: "National Apprenticeship Promotion Scheme (NAPS)",
    shortDescription: "Industry-aligned vocational training initiative offering stipend support and hands-on professional apprenticeships.",
    fullDescription: "NAPS aims to promote apprenticeship training across India by reimbursing 25% of the stipend paid by employers to apprentices. The program bridges academic education and industrial skillset demands with certified national credentials.",
    category: "Education & Skills",
    state: "All India",
    tags: ["Skill Training", "Youth", "Stipend Support"],
    benefits: [
      "Government covers 25% of the prescribed apprentice stipend",
      "Real-world industrial work environment training",
      "Direct assessment and National Apprenticeship Certificate",
      "Increased placement probability post training"
    ],
    eligibility: [
      "Indian citizens aged 14 and above (18+ for hazardous trades)",
      "Educational qualification criteria as per trade standards",
      "Registered on the national apprenticeship portal"
    ],
    ministry: "Ministry of Skill Development and Entrepreneurship",
    applicationUrl: "https://www.apprenticeshipindia.gov.in",
  },
  {
    id: "mjpjay-maha",
    name: "Mahatma Jyotirao Phule Jan Arogya Yojana (MJPJAY)",
    shortDescription: "State health protection program providing comprehensive tertiary and specialized surgical treatment across Maharashtra.",
    fullDescription: "MJPJAY is the flagship health insurance scheme of Maharashtra government. It offers end-to-end cashless hospitalization across thousands of empanelled government and private healthcare facilities for identified critical ailments and surgeries.",
    category: "Health & Wellness",
    state: "Maharashtra",
    tags: ["State Health", "Critical Illness", "Maharashtra"],
    benefits: [
      "Free medical treatment and surgery coverage up to ₹5 lakh",
      "Covers 1,356 medical therapies, oncology, and transplants",
      "Cashless hospitalization network across all 36 Maharashtra districts",
      "Post-discharge consultation and medicines included"
    ],
    eligibility: [
      "Holders of Yellow, Orange, or Antyodaya Ration Cards in Maharashtra",
      "Farmers from 14 agrarian distress districts",
      "Valid Maharashtra domicile or ration card verification"
    ],
    ministry: "Public Health Department, Government of Maharashtra",
    applicationUrl: "https://www.jeevandayee.gov.in",
  },
  {
    id: "kanya-sumangala",
    name: "Mukhyamantri Kanya Sumangala Yojana",
    shortDescription: "Conditional cash transfer program providing financial milestone assistance of ₹15,000 from birth through higher education.",
    fullDescription: "A landmark social welfare program launched by the Uttar Pradesh Government to improve female child sex ratio, eradicate female feticide, and promote educational persistence of girls from low-income households through six developmental milestone grants.",
    category: "Social Welfare",
    state: "Uttar Pradesh",
    tags: ["Girl Child", "Education Grant", "Uttar Pradesh"],
    benefits: [
      "₹15,000 total financial assistance staggered across 6 life milestones",
      "Grants linked to vaccination, school entry, and graduation",
      "Direct bank transfer to girl child or mother's account",
      "Incentivizes complete school retention and graduation"
    ],
    eligibility: [
      "Resident of Uttar Pradesh with valid domicile",
      "Family annual income below ₹3,00,000",
      "Maximum of two daughters per household eligible"
    ],
    ministry: "Department of Women and Child Development, Uttar Pradesh",
    applicationUrl: "https://mksy.up.gov.in",
  },
  {
    id: "delhi-ladli",
    name: "Delhi Ladli Scheme",
    shortDescription: "Institutional milestone investment scheme ensuring financial security, education, and protection for girl children in Delhi.",
    fullDescription: "Delhi Ladli Scheme promotes the status of girl children in society. Financial deposits are made by the Delhi government in the name of the child at institutional milestones which accumulate interest and mature upon completing class 12 and turning 18.",
    category: "Social Welfare",
    state: "Delhi",
    tags: ["Financial Assistance", "Empowerment", "Delhi"],
    benefits: [
      "Up to ₹36,000 initial deposits made across educational milestones",
      "Fixed deposit accumulates interest with SBI Life",
      "Matures as a significant capital sum when the girl turns 18",
      "Financial security dedicated toward higher education"
    ],
    eligibility: [
      "Girl child born in Delhi with valid birth certificate",
      "Parents must be residents of Delhi for minimum 3 years",
      "Annual family income not exceeding ₹1,00,000"
    ],
    ministry: "Department of Social Welfare, Government of NCT of Delhi",
    applicationUrl: "https://wcd.delhi.gov.in",
  },
];

