const fs = require('fs');
const path = require('path');
const { Bookmark } = require('../models');
const { resolveUser } = require('../utils/userResolver');

const SCHEMES_DIR = path.resolve(__dirname, '../data/schemes');

// In-memory cache for schemes
let schemesCache = null;
let lastCacheTime = 0;

/**
 * Loads all scheme JSON files from data/schemes/
 */
const loadSchemeDataset = () => {
  const now = Date.now();
  if (schemesCache && (now - lastCacheTime < 60000)) {
    return schemesCache;
  }

  if (!fs.existsSync(SCHEMES_DIR)) {
    return [];
  }

  const files = fs.readdirSync(SCHEMES_DIR).filter((f) => f.endsWith('.json'));
  const schemes = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(SCHEMES_DIR, file), 'utf8');
      const data = JSON.parse(content);
      schemes.push(data);
    } catch (err) {
      console.warn(`[recommendationController] Failed to parse scheme JSON ${file}:`, err.message);
    }
  }

  schemesCache = schemes;
  lastCacheTime = now;
  return schemes;
};

// Normalize string helper
const normalize = (str) => (str || '').trim().toLowerCase();

/**
 * Parses income from number or range string
 */
const parseIncome = (val) => {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;

  const str = String(val).toLowerCase();
  if (str.includes('prefer not to say')) return null;

  if (str.includes('below') || str.includes('under') || str.includes('less than')) {
    const match = str.match(/(\d+[\d,]*)/);
    if (match) {
      return parseFloat(match[1].replace(/,/g, '')) * 0.75;
    }
    return 75000;
  }

  if (str.includes('above') || str.includes('more than')) {
    const match = str.match(/(\d+[\d,]*)/);
    if (match) {
      return parseFloat(match[1].replace(/,/g, '')) * 1.25;
    }
    return 1200000;
  }

  const numbers = str.match(/(\d+[\d,]*)/g);
  if (numbers && numbers.length >= 2) {
    const n1 = parseFloat(numbers[0].replace(/,/g, ''));
    const n2 = parseFloat(numbers[1].replace(/,/g, ''));
    return (n1 + n2) / 2;
  }
  if (numbers && numbers.length === 1) {
    return parseFloat(numbers[0].replace(/,/g, ''));
  }

  return null;
};

/**
 * Parses age from number or string
 */
const parseAge = (val) => {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  const str = String(val).trim().toLowerCase();
  if (str.includes('under 18')) return 16;
  if (str.includes('60+')) return 65;
  const match = str.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
};

/**
 * Maps arbitrary user occupation string into a canonical persona
 */
const getOccupationPersona = (occStr) => {
  const norm = normalize(occStr);
  if (!norm) return null;

  if (norm.includes('student') || norm.includes('vidyarthi') || norm.includes('scholar') || norm.includes('college') || norm.includes('school') || norm.includes('education')) {
    return 'student';
  }
  if (norm.includes('farmer') || norm.includes('kisan') || norm.includes('agri') || norm.includes('cultivat') || norm.includes('sharecropper')) {
    return 'farmer';
  }
  if (norm.includes('artisan') || norm.includes('craft') || norm.includes('vishwakarma') || norm.includes('karigar')) {
    return 'artisan';
  }
  if (norm.includes('vendor') || norm.includes('street') || norm.includes('hawker') || norm.includes('thela')) {
    return 'vendor';
  }
  if (norm.includes('senior') || norm.includes('retire') || norm.includes('old age') || norm.includes('pensioner') || norm.includes('elderly')) {
    return 'senior';
  }
  if (norm.includes('self-employed') || norm.includes('business') || norm.includes('entrepreneur') || norm.includes('msme') || norm.includes('shopkeeper')) {
    return 'business';
  }
  if (norm.includes('homemaker') || norm.includes('housewife')) {
    return 'homemaker';
  }
  if (norm.includes('daily wage') || norm.includes('labor') || norm.includes('mazdoor') || norm.includes('worker') || norm.includes('unorganized')) {
    return 'worker';
  }
  if (norm.includes('unemployed') || norm.includes('job seeker')) {
    return 'unemployed';
  }
  if (norm.includes('salaried') || norm.includes('employee')) {
    return 'salaried';
  }
  return norm;
};

/**
 * Strict Occupation & Category Validator
 * Checks whether the scheme belongs to the user's occupational domain
 */
const evaluateOccupationCompatibility = (scheme, userPersona, rawOccupation) => {
  if (!userPersona) {
    return { compatible: true, score: 25, isDirect: false, reason: 'Open to general occupations' };
  }

  const category = normalize(scheme.category);
  const criteria = scheme.eligibility_criteria || {};
  const targetOccupations = (criteria.occupations || []).map(normalize);
  const targetCategories = (criteria.categories || []).map(normalize);

  // Check if scheme has universal / open occupational criteria
  const isUniversal = targetOccupations.some((o) =>
    o === 'all' || o === 'universal' || o.includes('all citizen') || o.includes('any occupation')
  );

  // 1. STUDENT PERSONA
  if (userPersona === 'student') {
    const isEduCategory = category.includes('education') || category.includes('scholarship') || targetCategories.some((c) => c.includes('education') || c.includes('scholarship'));
    const isSkillCategory = category.includes('skill') || targetCategories.some((c) => c.includes('skill'));
    const hasStudentOcc = targetOccupations.some((o) => o.includes('student') || o.includes('youth') || o.includes('scholar'));

    // Prohibited categories for students
    const isProhibited =
      category.includes('agriculture') ||
      category.includes('clean cooking') ||
      category.includes('housing') ||
      category.includes('social welfare') ||
      category.includes('social security') ||
      category.includes('food security') ||
      category.includes('insurance') ||
      (category.includes('financial inclusion') && !hasStudentOcc);

    if (isProhibited && !hasStudentOcc) {
      return { compatible: false, score: 0, reason: 'Agricultural, pension, housing, or business scheme not applicable to Students' };
    }

    if (isEduCategory && hasStudentOcc) {
      return { compatible: true, score: 50, isDirect: true, reason: 'Dedicated student scholarship / higher education scheme' };
    }
    if (isEduCategory || hasStudentOcc) {
      return { compatible: true, score: 45, isDirect: true, reason: 'Educational scheme for students' };
    }
    if (isSkillCategory && hasStudentOcc) {
      return { compatible: true, score: 35, isDirect: false, reason: 'Youth skill development and training program' };
    }

    return { compatible: false, score: 0, reason: 'Not an educational scholarship or student youth program' };
  }

  // 2. FARMER PERSONA
  if (userPersona === 'farmer') {
    const isAgriCategory = category.includes('agriculture') || targetCategories.some((c) => c.includes('agriculture') || c.includes('farming'));
    const hasFarmerOcc = targetOccupations.some((o) => o.includes('farmer') || o.includes('cultivat') || o.includes('sharecropper') || o.includes('agri'));

    if (isAgriCategory || hasFarmerOcc) {
      return { compatible: true, score: 50, isDirect: true, reason: 'Dedicated agricultural support and crop assistance scheme' };
    }
    if (category.includes('housing') && targetOccupations.some((o) => o.includes('agri') || o.includes('rural'))) {
      return { compatible: true, score: 45, isDirect: true, reason: 'Rural housing assistance for farmer and rural households' };
    }
    if (category.includes('food') || category.includes('healthcare')) {
      return { compatible: true, score: 40, isDirect: false, reason: 'Universal nutrition and health security for rural agricultural households' };
    }
    return { compatible: false, score: 0, reason: 'Non-agricultural scheme excluded for farmers' };
  }

  // 3. ARTISAN PERSONA
  if (userPersona === 'artisan') {
    const isArtisanCategory = category.includes('skill') || category.includes('handicraft') || category.includes('artisan');
    const hasArtisanOcc = targetOccupations.some((o) => o.includes('artisan') || o.includes('craft') || o.includes('vishwakarma') || o.includes('karigar'));

    if (hasArtisanOcc || isArtisanCategory) {
      return { compatible: true, score: 50, isDirect: true, reason: 'Dedicated traditional artisan and craftsperson scheme' };
    }
    if (category.includes('financial') || category.includes('insurance')) {
      return { compatible: true, score: 40, isDirect: false, reason: 'Credit and social security for artisans and self-employed creators' };
    }
    return { compatible: false, score: 0, reason: 'Non-artisan scheme excluded' };
  }

  // 4. SENIOR CITIZEN PERSONA
  if (userPersona === 'senior') {
    const isSeniorCategory = category.includes('welfare') || category.includes('pension') || category.includes('social security');
    const hasSeniorOcc = targetOccupations.some((o) => o.includes('senior') || o.includes('elderly') || o.includes('retire'));

    if (hasSeniorOcc || isSeniorCategory) {
      return { compatible: true, score: 50, isDirect: true, reason: 'Dedicated old age pension and senior citizen welfare scheme' };
    }
    if (category.includes('health') || category.includes('food')) {
      return { compatible: true, score: 45, isDirect: true, reason: 'Healthcare and food security allowance for senior citizens' };
    }
    return { compatible: false, score: 0, reason: 'Non-senior scheme excluded' };
  }

  // 5. STREET VENDOR PERSONA
  if (userPersona === 'vendor') {
    const hasVendorOcc = targetOccupations.some((o) => o.includes('vendor') || o.includes('hawker') || o.includes('street'));
    if (hasVendorOcc) {
      return { compatible: true, score: 50, isDirect: true, reason: 'Dedicated street vendor micro-credit and working capital scheme' };
    }
    if (category.includes('financial') || category.includes('insurance')) {
      return { compatible: true, score: 42, isDirect: false, reason: 'Micro-credit and insurance support for urban vendors' };
    }
    return { compatible: false, score: 0, reason: 'Not applicable for street vendors' };
  }

  // 6. BUSINESS / ENTREPRENEUR PERSONA
  if (userPersona === 'business') {
    const isBusinessCategory = category.includes('financial inclusion') || category.includes('business') || category.includes('msme');
    const hasBusinessOcc = targetOccupations.some((o) => o.includes('business') || o.includes('entrepreneur') || o.includes('self-employed') || o.includes('msme'));

    if (hasBusinessOcc || isBusinessCategory) {
      return { compatible: true, score: 50, isDirect: true, reason: 'Business loan and MSME entrepreneurship development scheme' };
    }
    return { compatible: false, score: 0, reason: 'Non-business scheme excluded' };
  }

  // 7. WORKER / DAILY WAGE PERSONA
  if (userPersona === 'worker') {
    const hasWorkerOcc = targetOccupations.some((o) =>
      o.includes('daily wage') || o.includes('worker') || o.includes('labor') || o.includes('unorganized') || o.includes('poor')
    );
    const isTargetCategory =
      category.includes('social security') ||
      category.includes('food') ||
      category.includes('healthcare') ||
      category.includes('housing') ||
      category.includes('insurance') ||
      category.includes('skill');

    if (hasWorkerOcc && isTargetCategory) {
      return { compatible: true, score: 50, isDirect: true, reason: 'Dedicated direct benefit and social protection for daily wage and unorganized workers' };
    }
    if (hasWorkerOcc || isTargetCategory) {
      return { compatible: true, score: 45, isDirect: true, reason: 'Welfare, insurance, or shelter support for unorganized workers' };
    }
    return { compatible: false, score: 0, reason: 'Not targeted at unorganized / daily wage workers' };
  }

  // 8. SALARIED PERSONA
  if (userPersona === 'salaried') {
    const hasSalariedOcc = targetOccupations.some((o) =>
      o.includes('salaried') || o.includes('employee') || o.includes('urban')
    );
    const isAllowedCategory =
      category.includes('housing') ||
      category.includes('insurance') ||
      category.includes('social security') ||
      category.includes('financial');

    if (hasSalariedOcc) {
      return { compatible: true, score: 50, isDirect: true, reason: 'Dedicated housing subsidy or employee social security scheme' };
    }
    if (isAllowedCategory && !category.includes('agriculture') && !category.includes('food')) {
      return { compatible: true, score: 40, isDirect: false, reason: 'Housing, financial, or insurance facility accessible to salaried individuals' };
    }
    return { compatible: false, score: 0, reason: 'Excluded: Scheme targeted exclusively at rural or unorganized segments' };
  }

  // 9. UNEMPLOYED PERSONA
  if (userPersona === 'unemployed') {
    const isSkillOrJob = category.includes('skill') || category.includes('training') || category.includes('welfare') || category.includes('food');
    const hasUnempOcc = targetOccupations.some((o) => o.includes('unemployed') || o.includes('youth') || o.includes('job seeker'));

    if (hasUnempOcc || isSkillOrJob) {
      return { compatible: true, score: 48, isDirect: true, reason: 'Skill development and basic livelihood welfare assistance for job seekers' };
    }
    if (category.includes('financial') || category.includes('insurance')) {
      return { compatible: true, score: 38, isDirect: false, reason: 'Micro-financial inclusion support for unemployed citizens' };
    }
    return { compatible: false, score: 0, reason: 'Not targeted at unemployed job seekers' };
  }

  // 10. HOMEMAKER PERSONA
  if (userPersona === 'homemaker') {
    const isFamilyWomen = category.includes('clean cooking') || category.includes('women') || category.includes('child') || category.includes('food');
    const hasHomemakerOcc = targetOccupations.some((o) => o.includes('homemaker') || o.includes('woman') || o.includes('women') || o.includes('mother'));

    if (hasHomemakerOcc || isFamilyWomen) {
      return { compatible: true, score: 50, isDirect: true, reason: 'Dedicated clean cooking fuel, nutrition, and maternal/child welfare program' };
    }
    if (category.includes('insurance') || category.includes('healthcare')) {
      return { compatible: true, score: 40, isDirect: false, reason: 'Family healthcare and insurance coverage' };
    }
    return { compatible: false, score: 0, reason: 'Not applicable to homemakers' };
  }

  // Universal Fallback Check
  if (isUniversal) {
    return { compatible: true, score: 35, isDirect: false, reason: 'Universal government initiative open to all citizens' };
  }

  // Fallback direct string match check
  const rawNorm = normalize(rawOccupation);
  if (targetOccupations.some((o) => o.includes(rawNorm) || rawNorm.includes(o))) {
    return { compatible: true, score: 40, isDirect: true, reason: `Matches your occupation (${rawOccupation})` };
  }

  return { compatible: false, score: 0, reason: `Not targeted at ${rawOccupation}` };
};

/**
 * Strict State Evaluation
 */
const evaluateStateCompatibility = (scheme, userState) => {
  if (!userState) {
    return { compatible: true, score: 25, reason: 'Nationwide coverage (no state selected)' };
  }

  const criteria = scheme.eligibility_criteria || {};
  const targetStates = (criteria.states || ['All']).map(normalize);
  const normState = normalize(userState);

  const hasAll = targetStates.some((s) => s === 'all' || s.includes('all india'));
  const isDirectStateMatch = targetStates.some((s) => s === normState || normState.includes(s) || s.includes(normState));

  if (isDirectStateMatch && !hasAll) {
    return { compatible: true, score: 30, reason: `Exclusively active in your state (${userState})` };
  }
  if (isDirectStateMatch && hasAll) {
    return { compatible: true, score: 30, reason: `Actively disbursed in your state (${userState})` };
  }
  if (hasAll) {
    return { compatible: true, score: 25, reason: `Central Sector nationwide scheme active in ${userState}` };
  }

  return { compatible: false, score: 0, reason: `Only active in: ${targetStates.join(', ')} (not ${userState})` };
};

/**
 * Strict Age Evaluation
 */
const evaluateAgeCompatibility = (scheme, userAge) => {
  const criteria = scheme.eligibility_criteria || {};
  const minAge = criteria.min_age !== undefined ? criteria.min_age : null;
  const maxAge = criteria.max_age !== undefined ? criteria.max_age : null;

  if (userAge === null || userAge === undefined) {
    return { compatible: true, score: 10, reason: 'Age criteria satisfied' };
  }

  if (minAge !== null && userAge < minAge) {
    return { compatible: false, score: 0, reason: `Requires minimum age of ${minAge} (profile age is ${userAge})` };
  }
  if (maxAge !== null && userAge > maxAge) {
    return { compatible: false, score: 0, reason: `Requires maximum age of ${maxAge} (profile age is ${userAge})` };
  }

  return { compatible: true, score: 10, reason: `Age ${userAge} falls within the eligible bracket (${minAge || 0}–${maxAge || 'no limit'} years)` };
};

/**
 * Strict Income Ceiling Evaluation
 */
const evaluateIncomeCompatibility = (scheme, userIncome) => {
  const criteria = scheme.eligibility_criteria || {};
  const maxIncome = criteria.max_annual_income !== undefined ? criteria.max_annual_income : null;

  if (userIncome === null || userIncome === undefined) {
    return { compatible: true, score: 10, reason: 'Income requirement satisfied' };
  }

  if (maxIncome !== null) {
    if (userIncome <= maxIncome) {
      const formattedIncome = `₹${Math.round(userIncome).toLocaleString('en-IN')}`;
      const formattedMax = `₹${Math.round(maxIncome).toLocaleString('en-IN')}`;
      return { compatible: true, score: 10, reason: `Annual income of ${formattedIncome} meets the ceiling of ${formattedMax}` };
    }
    const formattedIncome = `₹${Math.round(userIncome).toLocaleString('en-IN')}`;
    const formattedMax = `₹${Math.round(maxIncome).toLocaleString('en-IN')}`;
    return { compatible: false, score: 0, reason: `Annual income of ${formattedIncome} exceeds the ceiling of ${formattedMax}` };
  }

  return { compatible: true, score: 10, reason: 'No income ceiling restriction' };
};

/**
 * Evaluates a single scheme against user profile
 * Returns { matchScore, eligible, matchReasons, whyEligible, tags }
 */
const evaluateSchemeMatch = (scheme, profile) => {
  const userPersona = getOccupationPersona(profile.occupation);
  const rawOccupation = profile.occupation;
  const userState = profile.state;
  const userAge = profile.age;
  const userIncome = profile.annualIncome;

  const reasons = [];
  const whyParts = [];

  // 1. Occupation evaluation (50 pts)
  const occResult = evaluateOccupationCompatibility(scheme, userPersona, rawOccupation);
  if (!occResult.compatible) {
    return {
      matchScore: 0,
      eligible: false,
      matchReasons: [occResult.reason],
      whyEligible: occResult.reason,
      tags: [scheme.category],
    };
  }
  reasons.push(occResult.reason);
  whyParts.push(`As an active ${rawOccupation || 'citizen'}, you qualify for this ${scheme.category} program.`);

  // 2. State evaluation (30 pts)
  const stateResult = evaluateStateCompatibility(scheme, userState);
  if (!stateResult.compatible) {
    return {
      matchScore: 0,
      eligible: false,
      matchReasons: [stateResult.reason],
      whyEligible: stateResult.reason,
      tags: [scheme.category],
    };
  }
  reasons.push(stateResult.reason);
  if (userState) {
    whyParts.push(`It is actively available in ${userState}.`);
  }

  // 3. Age evaluation (10 pts)
  const ageResult = evaluateAgeCompatibility(scheme, userAge);
  if (!ageResult.compatible) {
    return {
      matchScore: 0,
      eligible: false,
      matchReasons: [ageResult.reason],
      whyEligible: ageResult.reason,
      tags: [scheme.category],
    };
  }
  reasons.push(ageResult.reason);
  if (userAge !== null && userAge !== undefined) {
    whyParts.push(`Your age (${userAge}) satisfies the eligibility requirements.`);
  }

  // 4. Income evaluation (10 pts)
  const incomeResult = evaluateIncomeCompatibility(scheme, userIncome);
  if (!incomeResult.compatible) {
    return {
      matchScore: 0,
      eligible: false,
      matchReasons: [incomeResult.reason],
      whyEligible: incomeResult.reason,
      tags: [scheme.category],
    };
  }
  reasons.push(incomeResult.reason);
  if (userIncome !== null && userIncome !== undefined) {
    const formattedIncome = `₹${Math.round(userIncome).toLocaleString('en-IN')}`;
    whyParts.push(`Your annual income (${formattedIncome}) is within the permissible limit.`);
  }

  // Total score calculation (Max 100)
  const totalScore = Math.min(100, occResult.score + stateResult.score + ageResult.score + incomeResult.score);

  const dynamicTags = Array.from(
    new Set([
      scheme.category,
      rawOccupation || 'Universal',
      userState || 'All India',
      ...(scheme.tags || []),
    ])
  ).slice(0, 6);

  return {
    matchScore: totalScore,
    eligible: true,
    matchReasons: reasons,
    whyEligible: whyParts.join(' '),
    tags: dynamicTags,
  };
};

/**
 * Controller: GET /api/recommendations & POST /api/recommendations
 */
const getRecommendations = async (req, res, next) => {
  try {
    const user = await resolveUser(req);
    const { eligibleOnly = 'true', minScore = 0 } = { ...req.query, ...req.body };
    const shouldFilterEligible = String(eligibleOnly) !== 'false';

    const bodyProfile = req.body?.profile || req.body || {};
    const occupation = req.query.occupation || bodyProfile.occupation || user?.occupation || null;
    const state = req.query.state || bodyProfile.state || user?.state || null;
    const rawAge = req.query.age !== undefined ? req.query.age : (bodyProfile.age !== undefined ? bodyProfile.age : user?.age);
    const age = parseAge(rawAge);
    const rawIncome = req.query.annualIncome || req.query.income || req.query.incomeRange || bodyProfile.annualIncome || bodyProfile.income || bodyProfile.incomeRange || user?.annualIncome;
    const annualIncome = parseIncome(rawIncome);

    const activeProfile = {
      id: user?.id || null,
      occupation,
      state,
      age,
      annualIncome,
      language: req.query.language || bodyProfile.language || user?.language || 'en',
    };

    const dataset = loadSchemeDataset();

    let bookmarkedSet = new Set();
    if (user?.id) {
      const bookmarks = await Bookmark.findAll({
        where: { userId: user.id },
        attributes: ['schemeId'],
      });
      bookmarkedSet = new Set(bookmarks.map((b) => b.schemeId));
    }

    let recommendations = dataset.map((scheme) => {
      const evaluation = evaluateSchemeMatch(scheme, activeProfile);
      return {
        scheme: {
          id: scheme.id,
          name: scheme.name,
          category: scheme.category,
          description: scheme.description,
          benefits: scheme.benefits,
          eligibility: scheme.eligibility,
          documents: scheme.documents,
          applicationProcess: scheme.application_process || scheme.applicationProcess,
          officialUrl: scheme.official_url || scheme.officialUrl,
          sourceUrl: scheme.source_url || scheme.sourceUrl,
          tags: evaluation.tags,
        },
        matchScore: evaluation.matchScore,
        eligible: evaluation.eligible,
        matchReasons: evaluation.matchReasons,
        whyEligible: evaluation.whyEligible,
        tags: evaluation.tags,
        isBookmarked: bookmarkedSet.has(scheme.id),
      };
    });

    if (shouldFilterEligible) {
      recommendations = recommendations.filter((r) => r.eligible);
    }

    if (Number(minScore) > 0) {
      recommendations = recommendations.filter((r) => r.matchScore >= Number(minScore));
    }

    recommendations.sort((a, b) => b.matchScore - a.matchScore);

    return res.status(200).json({
      success: true,
      profile: activeProfile,
      count: recommendations.length,
      data: recommendations,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecommendations,
  evaluateSchemeMatch,
  loadSchemeDataset,
  parseIncome,
  parseAge,
};
