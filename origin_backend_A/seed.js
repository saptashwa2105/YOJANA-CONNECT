const { sequelize, Scheme, User, Bookmark } = require('./models');

const schemesData = [
  {
    id: 'pm-kisan',
    name: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
    description: 'A Central Sector scheme to provide income support to all landholding farmers families across the country to supplement their agricultural inputs and domestic needs.',
    category: 'Agriculture',
    benefits: {
      financialSupport: '₹6,000 per year paid in three equal installments of ₹2,000 every four months',
      modeOfTransfer: 'Direct Benefit Transfer (DBT) directly into beneficiary bank accounts',
      specialFeatures: 'Completely central funded with no middleman involvement',
    },
    eligibility: {
      minAge: 18,
      maxAge: null,
      occupations: ['Farmer', 'Small Farmer', 'Marginal Farmer'],
      states: ['All'],
      criteria: 'All landholder farmers families who have cultivable land holding in their names.',
      exclusions: ['Institutional land holders', 'Beneficiaries paying income tax in last assessment year', 'Constitutional post holders'],
    },
    documents: [
      'Aadhaar Card (linked to active mobile number)',
      'Land Ownership / Mutation Record (Khasra/Khatauni)',
      'Active Bank Account Passbook with IFSC',
      'Citizenship Proof / Identity Card',
    ],
    applicationProcess: '1. Visit official PM-KISAN portal (pmkisan.gov.in).\n2. Navigate to "Farmers Corner" and select "New Farmer Registration".\n3. Enter Aadhaar number and select state.\n4. Fill in land ownership details and bank credentials.\n5. Submit and monitor application status via Aadhaar.',
    officialUrl: 'https://pmkisan.gov.in',
    sourceUrl: 'https://www.myscheme.gov.in/schemes/pm-kisan',
    lastUpdated: new Date('2024-01-15'),
    metadata: {
      ministry: 'Ministry of Agriculture and Farmers Welfare',
      launchedYear: 2019,
      beneficiariesTargeted: 'Small and marginal farmers nationwide',
    },
  },
  {
    id: 'pmjay',
    name: 'Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (PM-JAY)',
    description: 'The flagship national health protection scheme that provides health coverage of up to ₹5 lakh per family per year for secondary and tertiary healthcare hospitalizations.',
    category: 'Healthcare',
    benefits: {
      healthCoverage: 'Cashless and paperless inpatient hospital care up to ₹5,00,000 per family per year',
      coverageScope: 'Covers up to 3 days of pre-hospitalization and 15 days of post-hospitalization expenses',
      network: 'Valid at all empaneled public and private hospitals across India',
    },
    eligibility: {
      minAge: 0,
      maxAge: 100,
      occupations: ['All', 'Daily Wage Laborer', 'Domestic Worker', 'Artisan', 'Sanitation Worker'],
      states: ['All'],
      criteria: 'Families identified based on deprivation and occupational criteria as per SECC 2011 database.',
      familyCap: 'No restriction on family size, age, or gender.',
    },
    documents: [
      'Aadhaar Card or Ration Card',
      'Government-issued Photo ID Proof',
      'Active Mobile Number',
    ],
    applicationProcess: '1. Check eligibility on mera.pmjay.gov.in or visit a nearby CSC / Empaneled Hospital.\n2. Carry Aadhaar Card and Ration Card to the Ayushman Mitra desk.\n3. Undergo biometric e-KYC verification.\n4. Receive the Ayushman Bharat Golden Card.',
    officialUrl: 'https://pmjay.gov.in',
    sourceUrl: 'https://www.myscheme.gov.in/schemes/ab-pmjay',
    lastUpdated: new Date('2024-02-10'),
    metadata: {
      ministry: 'Ministry of Health and Family Welfare',
      launchedYear: 2018,
      beneficiariesTargeted: 'Over 50 crore low-income citizens (bottom 40% of population)',
    },
  },
  {
    id: 'pmay-g',
    name: 'Pradhan Mantri Awaas Yojana - Gramin (PMAY-G)',
    description: 'A housing scheme envisioned to provide a pucca house with basic amenities including piped water, power, and clean cooking fuel to all rural houseless and kutcha house residents.',
    category: 'Housing',
    benefits: {
      financialAssistance: '₹1,20,000 per unit in plain areas and ₹1,30,000 in hilly, difficult, and tribal areas',
      additionalPerks: '90-95 person-days of unskilled labor support under MGNREGS and ₹12,000 for toilet construction under Swachh Bharat Mission',
    },
    eligibility: {
      minAge: 18,
      maxAge: null,
      occupations: ['All', 'Agricultural Laborer', 'Homeless', 'Rural Worker'],
      states: ['All'],
      criteria: 'Families living in kutcha or dilapidated houses or houseless families as per SECC 2011 list.',
    },
    documents: [
      'Aadhaar Card',
      'Bank Account Passbook / Statement',
      'MGNREGA Job Card Number',
      'Swachh Bharat Mission (SBM) Registration ID',
    ],
    applicationProcess: '1. Beneficiaries are identified and ranked through Gram Sabha from Awaas+ list.\n2. Geo-tagging and site inspection conducted by village officials.\n3. Bank account linked for staged construction fund release.\n4. Funds disbursed in tranches according to foundation, lintel, and completion stages.',
    officialUrl: 'https://pmayg.nic.in',
    sourceUrl: 'https://www.myscheme.gov.in/schemes/pmayg',
    lastUpdated: new Date('2024-01-20'),
    metadata: {
      ministry: 'Ministry of Rural Development',
      launchedYear: 2016,
      beneficiariesTargeted: 'Rural families without adequate housing',
    },
  },
  {
    id: 'pmmy',
    name: 'Pradhan Mantri Mudra Yojana (PMMY)',
    description: 'Provides collateral-free institutional credit up to ₹10 Lakh (and up to ₹20 Lakh under enhanced category) to micro and small non-farm enterprises.',
    category: 'Financial Inclusion',
    benefits: {
      loanTiers: 'Shishu (up to ₹50,000), Kishor (₹50,001 to ₹5 Lakh), Tarun (₹5,00,001 to ₹10 Lakh), Tarun Plus (up to ₹20 Lakh)',
      collateral: 'No third-party collateral or mortgage required',
      convenience: 'Mudra debit card issued for quick working capital withdrawals',
    },
    eligibility: {
      minAge: 18,
      maxAge: 65,
      occupations: ['Entrepreneur', 'Shopkeeper', 'Artisan', 'Small Business Owner', 'Self-employed'],
      states: ['All'],
      criteria: 'Any Indian citizen with a viable business plan for non-farm income-generating activity.',
    },
    documents: [
      'Proof of Identity (Aadhaar / Voter ID / PAN Card)',
      'Proof of Residence (Electricity bill, Ration card)',
      'Business Project Report / Machinery Quotation',
      'Bank Statements for the last 6 months',
    ],
    applicationProcess: '1. Prepare a project summary and business plan.\n2. Apply online via Udyami Mitra portal (udyamimitra.in) or visit any commercial/RRB bank branch.\n3. Submit required documents and quotation for machinery/supplies.\n4. Loan sanctions disbursed directly into business loan account.',
    officialUrl: 'https://www.mudra.org.in',
    sourceUrl: 'https://www.myscheme.gov.in/schemes/pmmy',
    lastUpdated: new Date('2024-03-01'),
    metadata: {
      ministry: 'Ministry of Finance',
      launchedYear: 2015,
      beneficiariesTargeted: 'Micro-enterprises, artisans, shopkeepers, service sector starters',
    },
  },
  {
    id: 'pm-svanidhi',
    name: 'PM Street Vendors AtmaNirbhar Nidhi (PM SVANidhi)',
    description: 'A special micro-credit facility providing collateral-free affordable working capital loans to street vendors to rebuild and expand their vending businesses.',
    category: 'Financial Inclusion',
    benefits: {
      loanAmount: 'Initial working capital loan up to ₹10,000; 2nd tranche up to ₹20,000; 3rd tranche up to ₹50,000 on timely repayments',
      interestSubsidy: '7% interest subsidy credited directly to bank account quarterly',
      digitalCashback: 'Monthly cashback incentives up to ₹100 per month for accepting digital payments',
    },
    eligibility: {
      minAge: 18,
      maxAge: null,
      occupations: ['Street Vendor', 'Hawker', 'Cart Vendor'],
      states: ['All'],
      criteria: 'Urban and peri-urban street vendors possessing Certificate of Vending or Letter of Recommendation from local Urban Local Bodies.',
    },
    documents: [
      'Aadhaar Card',
      'Certificate of Vending (CoV) or Letter of Recommendation (LoR)',
      'Bank Account Passbook',
      'Mobile Number linked to Aadhaar',
    ],
    applicationProcess: '1. Visit pmsvanidhi.mohua.gov.in or nearest Common Service Center (CSC).\n2. Authenticate with Aadhaar.\n3. Enter vending certificate or LoR details.\n4. Choose preferred bank / NBFC lender and submit application.',
    officialUrl: 'https://pmsvanidhi.mohua.gov.in',
    sourceUrl: 'https://www.myscheme.gov.in/schemes/pm-svanidhi',
    lastUpdated: new Date('2024-02-18'),
    metadata: {
      ministry: 'Ministry of Housing and Urban Affairs',
      launchedYear: 2020,
      beneficiariesTargeted: 'Street vendors in urban and semi-urban areas',
    },
  },
  {
    id: 'pmuy',
    name: 'Pradhan Mantri Ujjwala Yojana (PMUY 2.0)',
    description: 'A major clean cooking fuel initiative providing deposit-free LPG connections to women in poor households to replace hazardous biomass fuel.',
    category: 'Social Welfare',
    benefits: {
      connectionSupport: 'Deposit-free LPG cylinder connection worth ₹1,600 covered by government',
      freeKit: 'First LPG refill cylinder and gas stove (hotplate) provided free of cost',
      targetedSubsidy: 'Direct targeted subsidy per domestic 14.2 kg cylinder for up to 12 refills per year',
    },
    eligibility: {
      minAge: 18,
      gender: 'Female',
      occupations: ['All', 'Homemaker', 'Daily Wage Laborer'],
      states: ['All'],
      criteria: 'Adult female member of an underprivileged household having no existing LPG connection in the same household.',
    },
    documents: [
      'Aadhaar Card of applicant and adult family members',
      'Ration Card / Proof of family composition',
      'Bank Account Details (IFSC and Account Number)',
      'Self-declaration of address / BPL proof',
    ],
    applicationProcess: '1. Apply online at pmuy.gov.in or visit any authorized LPG distributor.\n2. Submit KYC form with family Aadhaar details.\n3. Distributor performs de-duplication check.\n4. Receive new LPG gas connection and kit at home.',
    officialUrl: 'https://www.pmuy.gov.in',
    sourceUrl: 'https://www.myscheme.gov.in/schemes/pmuy',
    lastUpdated: new Date('2023-12-10'),
    metadata: {
      ministry: 'Ministry of Petroleum and Natural Gas',
      launchedYear: 2016,
      beneficiariesTargeted: 'Women from economically weaker rural & urban households',
    },
  },
  {
    id: 'apy',
    name: 'Atal Pension Yojana (APY)',
    description: 'A government-backed guaranteed pension scheme aimed at creating a universal social security system for all Indian workers in the unorganized sector.',
    category: 'Social Security',
    benefits: {
      guaranteedPension: 'Monthly pension of ₹1,000, ₹2,000, ₹3,000, ₹4,000, or ₹5,000 after attaining 60 years of age',
      spousalContinuation: 'Same monthly pension paid to spouse upon subscriber death',
      corpusReturn: 'Accumulated pension wealth returned to nominee upon demise of both subscriber and spouse',
    },
    eligibility: {
      minAge: 18,
      maxAge: 40,
      occupations: ['All', 'Unorganized Worker', 'Gig Worker', 'Daily Wage Laborer', 'Farmer', 'Self-employed'],
      states: ['All'],
      criteria: 'Indian citizen aged 18-40 having an active savings bank account. Must not be an income taxpayer.',
    },
    documents: [
      'Aadhaar Card',
      'Active Savings Bank Account Passbook',
      'Nominee Details & Contact Number',
    ],
    applicationProcess: '1. Visit the bank branch or post office where you maintain a savings account.\n2. Complete APY registration form with chosen pension tier.\n3. Set up monthly or quarterly auto-debit facility.\n4. Receive acknowledgement slip and Permanent Retirement Account Number (PRAN).',
    officialUrl: 'https://www.npscra.nsdl.co.in',
    sourceUrl: 'https://www.myscheme.gov.in/schemes/apy',
    lastUpdated: new Date('2024-01-05'),
    metadata: {
      ministry: 'Ministry of Finance',
      launchedYear: 2015,
      beneficiariesTargeted: 'Unorganized sector workers looking for old-age income security',
    },
  },
  {
    id: 'ssy',
    name: 'Sukanya Samriddhi Yojana (SSY)',
    description: 'A dedicated small deposit savings scheme launched under the Beti Bachao Beti Padhao campaign to secure the educational and marriage future of the girl child.',
    category: 'Women & Child',
    benefits: {
      attractiveInterest: 'High guaranteed interest rate (currently ~8.2% p.a. compounded annually)',
      taxBenefits: 'Triple tax exemption under Section 80C on deposit amount, accrued interest, and maturity withdrawal',
      maturityDuration: 'Matures after 21 years from account opening or upon marriage after age 18',
    },
    eligibility: {
      minAge: 0,
      maxAge: 10,
      gender: 'Female',
      occupations: ['Student', 'Child'],
      states: ['All'],
      criteria: 'Account can be opened by parents or legal guardians in the name of a girl child from her birth up to age 10.',
    },
    documents: [
      'Birth Certificate of the Girl Child',
      'Identity and Address Proof of the Parent / Guardian (Aadhaar, PAN, Voter ID)',
      'Passport size photographs of child and guardian',
    ],
    applicationProcess: '1. Visit nearest Post Office or authorized commercial bank branch.\n2. Fill SSY account opening form.\n3. Submit with birth certificate, guardian KYC, and minimum opening deposit of ₹250.\n4. Passbook is provided to track annual deposits.',
    officialUrl: 'https://www.indiapost.gov.in',
    sourceUrl: 'https://www.myscheme.gov.in/schemes/ssy',
    lastUpdated: new Date('2024-01-01'),
    metadata: {
      ministry: 'Ministry of Finance',
      launchedYear: 2015,
      beneficiariesTargeted: 'Girl children across India under 10 years of age',
    },
  },
  {
    id: 'pm-vishwakarma',
    name: 'PM Vishwakarma Scheme',
    description: 'A holistic scheme offering end-to-end support to traditional artisans and craftsmen who work with their hands and tools, honoring their cultural legacy and boosting trade.',
    category: 'Skill Development',
    benefits: {
      officialRecognition: 'PM Vishwakarma Certificate and ID Card',
      skillEnhancement: '5-7 days basic training and 15 days advanced training with ₹500/day stipend',
      toolkitGrant: '₹15,000 digital voucher grant for purchasing modern toolkits',
      concessionalCredit: 'Collateral-free loan up to ₹1 Lakh (1st tranche) and ₹2 Lakh (2nd tranche) at a concessional 5% interest rate',
    },
    eligibility: {
      minAge: 18,
      maxAge: null,
      occupations: ['Carpenter', 'Blacksmith', 'Potter', 'Sculptor', 'Cobbler', 'Mason', 'Basket Maker', 'Tailor', 'Barber', 'Artisan'],
      states: ['All'],
      criteria: 'Practitioner of one of 18 identified traditional family crafts/trades. Limited to one family member.',
    },
    documents: [
      'Aadhaar Card (linked to mobile number)',
      'Bank Account Passbook / Details',
      'Ration Card / Family Declaration',
    ],
    applicationProcess: '1. Register via CSC on pmvishwakarma.gov.in using Aadhaar biometric authentication.\n2. Three-tier verification: Gram Panchayat/ULB level, District level, and State level.\n3. Receive official ID, undergo training, and unlock toolkit grant and credit.',
    officialUrl: 'https://pmvishwakarma.gov.in',
    sourceUrl: 'https://www.myscheme.gov.in/schemes/pm-vishwakarma',
    lastUpdated: new Date('2024-02-01'),
    metadata: {
      ministry: 'Ministry of Micro, Small and Medium Enterprises',
      launchedYear: 2023,
      beneficiariesTargeted: 'Artisans and craftspeople across 18 traditional occupations',
    },
  },
  {
    id: 'kcc',
    name: 'Kisan Credit Card (KCC) Scheme',
    description: 'Ensures that farmers receive timely and adequate institutional credit for crop cultivation, farm maintenance, allied activities, and urgent post-harvest capital needs.',
    category: 'Agriculture',
    benefits: {
      creditLimit: 'Revolving credit facility up to ₹3 Lakh at an effective interest rate of 4% per annum (with prompt repayment incentive)',
      flexibility: 'Simplifies cash withdrawals via ATM-enabled KCC RuPay card',
      insurance: 'Built-in crop and asset risk insurance coverage',
    },
    eligibility: {
      minAge: 18,
      maxAge: 75,
      occupations: ['Farmer', 'Tenant Farmer', 'Sharecropper', 'Fisherman', 'Dairy Worker'],
      states: ['All'],
      criteria: 'Individual or joint borrowers who are owner cultivators, tenant farmers, oral lessees, or members of SHGs/JLGs.',
    },
    documents: [
      'Application Form filled and signed',
      'Proof of Identity (Aadhaar / Voter ID)',
      'Land Records / Cultivation proof (Pahani / Khasra)',
      'Passport size photographs',
    ],
    applicationProcess: '1. Collect KCC form from local bank branch or download from bank portal.\n2. Fill crop cultivation details and submit with land ownership documents.\n3. Bank conducts land inspection and sanctions limit within 14 working days.\n4. KCC RuPay debit card is issued.',
    officialUrl: 'https://agricoop.nic.in',
    sourceUrl: 'https://www.myscheme.gov.in/schemes/kcc',
    lastUpdated: new Date('2024-01-10'),
    metadata: {
      ministry: 'Ministry of Agriculture and Farmers Welfare',
      launchedYear: 1998,
      beneficiariesTargeted: 'Farmers, fishermen, animal husbandry and dairy rearers',
    },
  },
  {
    id: 'pm-poshan',
    name: 'PM POSHAN (Pradhan Mantri Poshan Shakti Nirman)',
    description: 'Supplies one free hot cooked nutritious meal on every school day to school children in classes I through VIII, enhancing nutritional status and school retention.',
    category: 'Education & Nutrition',
    benefits: {
      dailyNutrition: 'Nutritious hot meal: 450 calories and 12g protein for primary classes; 700 calories and 20g protein for upper primary classes',
      socialImpact: 'Combats malnutrition, improves school attendance, and fosters social equality',
    },
    eligibility: {
      minAge: 5,
      maxAge: 14,
      occupations: ['Student'],
      states: ['All'],
      criteria: 'All children enrolled in government, local authority, and government-aided primary and upper primary schools across India.',
    },
    documents: [
      'School Enrollment Record',
    ],
    applicationProcess: 'Automatic entitlement for every student upon enrollment in any participating government or government-aided school. No separate paperwork needed.',
    officialUrl: 'https://pmposhan.education.gov.in',
    sourceUrl: 'https://www.myscheme.gov.in/schemes/pm-poshan',
    lastUpdated: new Date('2023-11-25'),
    metadata: {
      ministry: 'Ministry of Education',
      launchedYear: 1995,
      beneficiariesTargeted: 'Over 11.8 crore school students across 11.2 lakh schools',
    },
  },
  {
    id: 'ignoaps',
    name: 'Indira Gandhi National Old Age Pension Scheme (IGNOAPS - NSAP)',
    description: 'A non-contributory monthly pension for elderly citizens living below the poverty line to ensure social dignity and basic financial sustenance.',
    category: 'Social Welfare',
    benefits: {
      monthlyPension: '₹200/month for ages 60-79, and ₹500/month for ages 80+, enhanced by state government contributions up to ₹1,000-₹3,000/month depending on state',
      disbursement: 'Directly credited into the beneficiary post office or bank account',
    },
    eligibility: {
      minAge: 60,
      maxAge: null,
      occupations: ['All', 'Senior Citizen', 'Retired', 'Unorganized Worker'],
      states: ['All'],
      criteria: 'Applicant must be aged 60 years or above and belong to a household verified below the poverty line (BPL).',
    },
    documents: [
      'Aadhaar Card',
      'BPL Card / Proof of BPL status',
      'Age Proof (Birth certificate, voter card, or medical officer certificate)',
      'Bank / Post Office Account Passbook',
    ],
    applicationProcess: '1. Apply at the local Gram Panchayat or Municipal Ward Office.\n2. Submit BPL certificate and proof of age.\n3. Village Administrative Officer or Social Welfare Inspector verifies details.\n4. Monthly pension starts following district sanction.',
    officialUrl: 'https://nsap.nic.in',
    sourceUrl: 'https://www.myscheme.gov.in/schemes/ignoaps',
    lastUpdated: new Date('2024-01-18'),
    metadata: {
      ministry: 'Ministry of Rural Development',
      launchedYear: 1995,
      beneficiariesTargeted: 'Impoverished senior citizens across India',
    },
  },
  {
    id: 'stand-up-india',
    name: 'Stand-Up India Scheme',
    description: 'Promotes entrepreneurship at the grassroots level by facilitating composite bank loans between ₹10 Lakh and ₹1 Crore to SC, ST, and women entrepreneurs.',
    category: 'Financial Inclusion',
    benefits: {
      compositeLoan: 'Term loan and working capital between ₹10 Lakh and ₹100 Lakh covering up to 85% of project cost',
      handholdingSupport: 'Guidance and mentoring for project formulation and business skills through SIDBI portal',
    },
    eligibility: {
      minAge: 18,
      maxAge: null,
      occupations: ['Entrepreneur', 'Business Owner', 'Self-employed'],
      states: ['All'],
      criteria: 'Scheduled Caste (SC), Scheduled Tribe (ST), or Woman entrepreneur setting up a new (greenfield) enterprise in manufacturing, services, or trading.',
    },
    documents: [
      'Identity and Address Proof (Aadhaar / Voter ID / Passport)',
      'Caste Certificate (for SC/ST applicants)',
      'Detailed Project Report (DPR)',
      'Bank Account Statements for past 6 months',
    ],
    applicationProcess: '1. Register on standupmitra.in.\n2. Access handholding support or connect directly with lenders.\n3. Submit project proposal and KYC to chosen commercial bank.\n4. Loan appraisal, sanction, and disbursement.',
    officialUrl: 'https://www.standupmitra.in',
    sourceUrl: 'https://www.myscheme.gov.in/schemes/stand-up-india',
    lastUpdated: new Date('2024-02-15'),
    metadata: {
      ministry: 'Ministry of Finance',
      launchedYear: 2016,
      beneficiariesTargeted: 'SC, ST, and women entrepreneurs launching greenfield projects',
    },
  },
  {
    id: 'pm-daksh',
    name: 'PM-DAKSH (Pradhan Mantri Dakshta Aur Kushalta Sampann Hitgrahi)',
    description: 'A National Action Plan for skill development of marginalized persons covering SCs, OBCs, EWS, DNTs, sanitation workers including waste pickers.',
    category: 'Skill Development',
    benefits: {
      freeTraining: 'Free of cost upskilling, reskilling, short term training and entrepreneurship development programmes',
      stipend: 'Stipend provided during training period to eligible participants',
      certification: 'Nationally recognized skill certification and placement assistance',
    },
    eligibility: {
      minAge: 18,
      maxAge: 45,
      occupations: ['All', 'Artisan', 'Sanitation Worker', 'Unorganized Worker', 'Youth'],
      states: ['All'],
      criteria: 'Targeted at SC, OBC, EWS, DNT, or Safai Karamcharis / waste pickers.',
    },
    documents: [
      'Aadhaar Card',
      'Caste / Community Certificate',
      'Income Certificate (if applicable)',
      'Bank Account Details',
      'Passport size photograph',
    ],
    applicationProcess: '1. Register on Skill India Digital Hub / PM-DAKSH portal.\n2. Complete profile and e-KYC.\n3. Choose preferred skill training program and training center.\n4. Attend counseling and start training.',
    officialUrl: 'https://www.myscheme.gov.in/schemes/pm-daksh',
    sourceUrl: 'https://www.myscheme.gov.in/schemes/pm-daksh',
    lastUpdated: new Date('2024-02-01'),
    metadata: {
      ministry: 'Ministry of Social Justice and Empowerment',
      launchedYear: 2020,
      beneficiariesTargeted: 'Marginalized youth and sanitation workers',
    },
  },
  {
    id: 'pmay-u',
    name: 'Pradhan Mantri Awas Yojana - Urban (PMAY-U)',
    description: 'Envisions pucca houses with basic amenities for all eligible urban families and slum dwellers in India.',
    category: 'Housing',
    benefits: {
      financialAssistance: 'Interest subsidy on home loans under CLSS or direct central assistance up to ₹1.5 Lakh per unit under BLC/AHP components',
      puccaHousing: 'Ensures all-weather pucca housing with water, electricity, and sanitation facilities in urban areas',
    },
    eligibility: {
      minAge: 18,
      maxAge: null,
      occupations: ['All', 'Daily Wage Laborer', 'Domestic Worker', 'Self-employed', 'Slum Dweller'],
      states: ['All'],
      criteria: 'Urban families belonging to EWS, LIG, or MIG categories not owning a pucca house anywhere in India.',
    },
    documents: [
      'Aadhaar Card',
      'Income Certificate / Proof of Income',
      'Bank Account Passbook',
      'Urban Residence / Slum Dweller Certificate',
      'Affidavit declaring no pucca house ownership',
    ],
    applicationProcess: '1. Visit pmay-urban.gov.in or nearest Citizen Service Center.\n2. Select Citizen Assessment and enter Aadhaar details.\n3. Fill in contact, income, and urban residential details.\n4. Submit and track assessment status.',
    officialUrl: 'https://pmay-urban.gov.in',
    sourceUrl: 'https://www.myscheme.gov.in/schemes/pmay-u',
    lastUpdated: new Date('2024-01-25'),
    metadata: {
      ministry: 'Ministry of Housing and Urban Affairs',
      launchedYear: 2015,
      beneficiariesTargeted: 'Economically weaker urban households and slum dwellers',
    },
  },
  {
    id: 'pmfby',
    name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    description: 'Comprehensive crop insurance coverage against non-preventable natural risks from pre-sowing to post-harvest stages.',
    category: 'Agriculture',
    benefits: {
      lowPremium: 'Uniform maximum premium of only 2% for Kharif crops, 1.5% for Rabi crops, and 5% for commercial/horticultural crops',
      claimPayout: 'Rapid assessment and direct bank settlement of claims for crop yield loss and localized calamities',
    },
    eligibility: {
      minAge: 18,
      maxAge: null,
      occupations: ['Farmer', 'Tenant Farmer', 'Sharecropper'],
      states: ['All'],
      criteria: 'All farmers growing notified crops in notified areas during the designated season.',
    },
    documents: [
      'Aadhaar Card',
      'Land Records (RoR / Khasra / Khatauni) or Tenancy Agreement',
      'Sowing Certificate / Declaration',
      'Bank Passbook linked to Aadhaar',
    ],
    applicationProcess: '1. Visit pmfby.gov.in or apply through bank branch / CSC / insurance agent.\n2. Select crop season and state.\n3. Provide land details and crop sown.\n4. Pay nominal farmer premium and receive policy acknowledgment.',
    officialUrl: 'https://pmfby.gov.in',
    sourceUrl: 'https://www.pmfby.gov.in/faq',
    lastUpdated: new Date('2024-02-15'),
    metadata: {
      ministry: 'Ministry of Agriculture and Farmers Welfare',
      launchedYear: 2016,
      beneficiariesTargeted: 'Farmers facing crop failure due to natural disasters',
    },
  },
  {
    id: 'pmgkay',
    name: 'Pradhan Mantri Garib Kalyan Anna Yojana (PMGKAY)',
    description: 'A major food security initiative providing free foodgrains to all NFSA beneficiaries across the country to eliminate hunger.',
    category: 'Food Security',
    benefits: {
      freeFoodgrains: '5 kg of foodgrains (wheat/rice) per person per month for Priority Households (PHH) and 35 kg per family per month for Antyodaya Anna Yojana (AAY) families',
      freeOfCost: 'Distributed completely free of cost through Fair Price Shops',
    },
    eligibility: {
      minAge: 0,
      maxAge: null,
      occupations: ['All', 'Daily Wage Laborer', 'Farmer', 'Homeless', 'Unorganized Worker'],
      states: ['All'],
      criteria: 'All beneficiaries and families covered under the National Food Security Act (NFSA - Antyodaya and Priority Households).',
    },
    documents: [
      'Ration Card (AAY or PHH category)',
      'Aadhaar Card of family members',
    ],
    applicationProcess: 'Automatic entitlement for all existing NFSA ration card holders. Visit nearest Fair Price Shop (FPS) and authenticate via biometric e-PoS device to collect ration.',
    officialUrl: 'https://www.myscheme.gov.in/schemes/pm-gkay',
    sourceUrl: 'https://www.myscheme.gov.in/schemes/pm-gkay',
    lastUpdated: new Date('2024-01-01'),
    metadata: {
      ministry: 'Ministry of Consumer Affairs, Food and Public Distribution',
      launchedYear: 2020,
      beneficiariesTargeted: 'Over 80 crore low-income citizens',
    },
  },
  {
    id: 'pmjjby',
    name: 'Pradhan Mantri Jeevan Jyoti Bima Yojana (PMJJBY)',
    description: 'A one-year renewable life insurance scheme offering ₹2 Lakh life coverage for death due to any cause at an affordable annual premium.',
    category: 'Insurance',
    benefits: {
      lifeCover: '₹2,00,000 payable to the nominee upon subscriber demise due to any cause',
      lowPremium: 'Annual premium of only ₹436 per year debited automatically from bank/post office account',
    },
    eligibility: {
      minAge: 18,
      maxAge: 50,
      occupations: ['All', 'Unorganized Worker', 'Self-employed', 'Salaried', 'Farmer'],
      states: ['All'],
      criteria: 'Any individual aged 18 to 50 years holding an active savings bank or post office account with auto-debit consent.',
    },
    documents: [
      'Aadhaar Card',
      'Bank Account / Post Office Savings Passbook',
      'Nominee Details and KYC',
    ],
    applicationProcess: '1. Visit bank branch or netbanking portal where you hold a savings account.\n2. Fill PMJJBY consent-cum-declaration form with nominee information.\n3. Authorize annual auto-debit of ₹436.\n4. Receive certificate of insurance.',
    officialUrl: 'https://financialservices.gov.in/pmjjby',
    sourceUrl: 'https://financialservices.gov.in/pmjjby',
    lastUpdated: new Date('2024-01-10'),
    metadata: {
      ministry: 'Ministry of Finance',
      launchedYear: 2015,
      beneficiariesTargeted: 'All bank account holders aged 18-50',
    },
  },
  {
    id: 'pmsby',
    name: 'Pradhan Mantri Suraksha Bima Yojana (PMSBY)',
    description: 'A one-year renewable accident insurance scheme providing affordable risk coverage against accidental death and disability.',
    category: 'Insurance',
    benefits: {
      accidentalCoverage: '₹2,00,000 for accidental death or total permanent disability, and ₹1,00,000 for partial permanent disability',
      nominalCost: 'Extremely affordable premium of only ₹20 per annum auto-debited from bank account',
    },
    eligibility: {
      minAge: 18,
      maxAge: 70,
      occupations: ['All', 'Daily Wage Laborer', 'Unorganized Worker', 'Driver', 'Farmer'],
      states: ['All'],
      criteria: 'Any individual aged 18 to 70 years having a savings bank account and giving auto-debit consent.',
    },
    documents: [
      'Aadhaar Card',
      'Savings Bank Account Passbook',
      'Nominee Details',
    ],
    applicationProcess: '1. Visit your bank branch or activate through mobile / netbanking.\n2. Submit PMSBY enrollment form with nominee declaration.\n3. Enable annual auto-debit of ₹20.\n4. Policy acknowledgement is generated.',
    officialUrl: 'https://financialservices.gov.in/pmsby',
    sourceUrl: 'https://financialservices.gov.in/pmsby',
    lastUpdated: new Date('2024-01-10'),
    metadata: {
      ministry: 'Ministry of Finance',
      launchedYear: 2015,
      beneficiariesTargeted: 'All bank account holders aged 18-70',
    },
  },
  {
    id: 'post-matric-scholarship',
    name: 'Post-Matric Scholarship Scheme for Students',
    description: 'Provides financial assistance and maintenance allowances to students studying at the post-matriculation or post-secondary stage (Class 11, Class 12, ITI, Diploma, Undergraduate, and Postgraduate degrees) to enable them to complete their education.',
    category: 'Education & Scholarships',
    benefits: {
      financialSupport: 'Covers compulsory tuition fees plus monthly maintenance allowance from ₹2,500 to ₹13,500 per year',
      modeOfTransfer: 'Direct Benefit Transfer (DBT) directly into student bank account',
      specialAllowances: 'Additional book grants, study tour allowance, and disability support',
    },
    eligibility: {
      minAge: 15,
      maxAge: 30,
      occupations: ['Student'],
      states: ['All', 'Madhya Pradesh'],
      criteria: 'Enrolled in recognized post-matric course (Class 11 through Post-Graduation). Family annual income up to ₹2,50,000.',
    },
    documents: [
      'Class 10/12 Marksheets',
      'Aadhaar Card',
      'Family Income Certificate',
      'State Domicile Certificate (e.g. Madhya Pradesh)',
      'Aadhaar-seeded Bank Passbook',
      'College Admission Receipt / Student ID',
    ],
    applicationProcess: '1. Register on National Scholarship Portal (scholarships.gov.in) or MP State Scholarship Portal 2.0 (scholarshipportal.mp.nic.in).\n2. Complete student e-KYC.\n3. Upload marksheet and income credentials.\n4. Submit for institutional verification.',
    officialUrl: 'https://scholarships.gov.in',
    sourceUrl: 'https://scholarshipportal.mp.nic.in',
    lastUpdated: new Date('2024-02-15'),
    metadata: {
      ministry: 'Ministry of Social Justice and Empowerment / State Education Depts',
      launchedYear: 2006,
      beneficiariesTargeted: 'Students pursuing higher secondary and collegiate education',
    },
  },
  {
    id: 'higher-education-grant',
    name: 'Central Sector Scheme of Scholarships for College and University Students (Higher Education Grants)',
    description: 'Merit-cum-means financial assistance grant provided by the Ministry of Education to students pursuing regular higher education graduate and postgraduate degrees in recognized colleges and universities.',
    category: 'Education & Scholarships',
    benefits: {
      graduationGrant: '₹12,000 per year for first 3 years of undergraduate study',
      postGraduationGrant: '₹20,000 per year at postgraduate level',
      disbursement: 'Paid directly into student bank account via Direct Benefit Transfer (DBT)',
    },
    eligibility: {
      minAge: 17,
      maxAge: 25,
      occupations: ['Student', 'Youth'],
      states: ['All', 'Madhya Pradesh'],
      criteria: 'Class 12 passed above 80th percentile, enrolled in regular college/university degree. Annual family income under ₹4,50,000.',
    },
    documents: [
      'Class 12 Marksheet',
      'College Admission Proof / Student ID Card',
      'Family Annual Income Certificate',
      'Aadhaar Card',
      'Bank Account Passbook / IFSC Details',
    ],
    applicationProcess: '1. Apply online via National Scholarship Portal (scholarships.gov.in).\n2. Select Central Sector Scheme of Scholarship for College and University Students.\n3. Submit academic and income verification.\n4. College verifies and forwards to State Education Authority.',
    officialUrl: 'https://scholarships.gov.in',
    sourceUrl: 'https://www.education.gov.in/scholarships',
    lastUpdated: new Date('2024-02-15'),
    metadata: {
      ministry: 'Department of Higher Education, Ministry of Education',
      launchedYear: 2008,
      beneficiariesTargeted: 'College and university students nationwide',
    },
  },
];

const seedDatabase = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await sequelize.authenticate();
    console.log('✓ Database connection confirmed.');

    // Sync database with force: true to reset tables cleanly for seeding
    await sequelize.sync({ force: true });
    console.log('✓ Database tables created/reset successfully.');

    // Seed Schemes
    console.log(`Seeding ${schemesData.length} Indian government schemes...`);
    const createdSchemes = await Scheme.bulkCreate(schemesData);
    console.log(`✓ Successfully seeded ${createdSchemes.length} schemes into database.`);

    // Seed sample user for testing
    console.log('Creating sample user / profile...');
    const sampleUser = await User.create({
      age: 35,
      state: 'Uttar Pradesh',
      occupation: 'Farmer',
      language: 'hi',
    });
    console.log(`✓ Sample user created with ID: ${sampleUser.id} (${sampleUser.occupation} from ${sampleUser.state})`);

    // Seed sample bookmark
    console.log('Creating sample bookmark for user...');
    const sampleBookmark = await Bookmark.create({
      userId: sampleUser.id,
      schemeId: 'pm-kisan',
    });
    console.log(`✓ Sample bookmark created (User #${sampleBookmark.userId} bookmarked '${sampleBookmark.schemeId}')`);

    console.log('\n--- Database seeding completed successfully! ---');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error during database seeding:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, schemesData };
