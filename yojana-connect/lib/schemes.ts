import fs from "node:fs";
import path from "node:path";
import { resolveCanonicalSchemeId } from "./ai/schemeIdHelper";

export { resolveCanonicalSchemeId };

export interface SchemeMetadata {
  id: string;
  name: string;
  category: string;
  description: string;
  benefits?: string | string[] | Record<string, unknown>;
  eligibility?: string | string[] | Record<string, unknown>;
  documents?: string | string[];
  applicationProcess?: string;
  application_process?: string;
  officialUrl?: string;
  official_url?: string;
  sourceUrl?: string;
  source_url?: string;
  tags?: string[];
  eligibility_criteria?: {
    occupations?: string[];
    states?: string[];
    categories?: string[];
    min_age?: number;
    max_age?: number;
    max_annual_income?: number;
  };
}

export interface SchemeEvaluation {
  matchScore: number;
  eligible: boolean;
  matchReasons: string[];
  whyEligible: string;
  tags: string[];
}

export interface UserProfileCriteria {
  id?: number | string | null;
  age?: number | null;
  state?: string | null;
  occupation?: string | null;
  annualIncome?: number | null;
  language?: string;
}

let schemesCache: SchemeMetadata[] | null = null;
let lastCacheTime = 0;

function resolveSchemesDir(): string {
  const candidatePaths = [
    path.join(process.cwd(), "data/schemes"),
    path.join(process.cwd(), "yojana-connect/data/schemes"),
    path.resolve(__dirname, "../data/schemes"),
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  return path.join(process.cwd(), "data/schemes");
}

export function loadSchemeDataset(): SchemeMetadata[] {
  const now = Date.now();
  if (schemesCache && now - lastCacheTime < 60000) {
    return schemesCache;
  }

  const dir = resolveSchemesDir();
  if (!fs.existsSync(dir)) {
    return [];
  }

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  const schemes: SchemeMetadata[] = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(dir, file), "utf8");
      const data = JSON.parse(content);
      schemes.push({
        ...data,
        officialUrl: data.official_url || data.officialUrl,
        sourceUrl: data.source_url || data.sourceUrl,
        applicationProcess: data.application_process || data.applicationProcess,
      });
    } catch (err: unknown) {
      console.warn(
        `[schemes] Failed to parse scheme JSON ${file}:`,
        err instanceof Error ? err.message : err
      );
    }
  }

  schemesCache = schemes;
  lastCacheTime = now;
  return schemes;
}

export function getSchemeById(id: string): SchemeMetadata | null {
  if (!id) return null;
  const canonicalId = resolveCanonicalSchemeId(id) || id;
  const schemes = loadSchemeDataset();
  return schemes.find((s) => s.id === canonicalId || s.id === id) || null;
}

export const normalize = (str?: string | null): string => (str || "").trim().toLowerCase();

export const parseIncome = (val: unknown): number | null => {
  if (val === null || val === undefined || val === "") return null;
  if (typeof val === "number") return isNaN(val) ? null : val;

  const str = String(val).toLowerCase();
  if (str.includes("prefer not to say")) return null;

  if (str.includes("below") || str.includes("under") || str.includes("less than")) {
    const match = str.match(/(\d+[\d,]*)/);
    if (match) {
      return parseFloat(match[1].replace(/,/g, "")) * 0.75;
    }
    return 75000;
  }

  if (str.includes("above") || str.includes("more than")) {
    const match = str.match(/(\d+[\d,]*)/);
    if (match) {
      return parseFloat(match[1].replace(/,/g, "")) * 1.25;
    }
    return 1200000;
  }

  const numbers = str.match(/(\d+[\d,]*)/g);
  if (numbers && numbers.length >= 2) {
    const n1 = parseFloat(numbers[0].replace(/,/g, ""));
    const n2 = parseFloat(numbers[1].replace(/,/g, ""));
    return (n1 + n2) / 2;
  }
  if (numbers && numbers.length === 1) {
    return parseFloat(numbers[0].replace(/,/g, ""));
  }

  return null;
};

export const parseAge = (val: unknown): number | null => {
  if (val === null || val === undefined || val === "") return null;
  if (typeof val === "number") return isNaN(val) ? null : val;
  const str = String(val).trim().toLowerCase();
  if (str.includes("under 18")) return 16;
  if (str.includes("60+")) return 65;
  const match = str.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
};

export const getOccupationPersona = (occStr?: string | null): string | null => {
  const norm = normalize(occStr);
  if (!norm) return null;

  if (
    norm.includes("student") ||
    norm.includes("vidyarthi") ||
    norm.includes("scholar") ||
    norm.includes("college") ||
    norm.includes("school") ||
    norm.includes("education")
  ) {
    return "student";
  }
  if (
    norm.includes("farmer") ||
    norm.includes("kisan") ||
    norm.includes("agri") ||
    norm.includes("cultivat") ||
    norm.includes("sharecropper")
  ) {
    return "farmer";
  }
  if (
    norm.includes("artisan") ||
    norm.includes("craft") ||
    norm.includes("vishwakarma") ||
    norm.includes("karigar")
  ) {
    return "artisan";
  }
  if (
    norm.includes("vendor") ||
    norm.includes("street") ||
    norm.includes("hawker") ||
    norm.includes("thela")
  ) {
    return "vendor";
  }
  if (
    norm.includes("senior") ||
    norm.includes("retire") ||
    norm.includes("old age") ||
    norm.includes("pensioner") ||
    norm.includes("elderly")
  ) {
    return "senior";
  }
  if (
    norm.includes("self-employed") ||
    norm.includes("business") ||
    norm.includes("entrepreneur") ||
    norm.includes("msme") ||
    norm.includes("shopkeeper")
  ) {
    return "business";
  }
  if (norm.includes("homemaker") || norm.includes("housewife")) {
    return "homemaker";
  }
  if (
    norm.includes("daily wage") ||
    norm.includes("labor") ||
    norm.includes("mazdoor") ||
    norm.includes("worker") ||
    norm.includes("unorganized")
  ) {
    return "worker";
  }
  if (norm.includes("unemployed") || norm.includes("job seeker")) {
    return "unemployed";
  }
  if (norm.includes("salaried") || norm.includes("employee")) {
    return "salaried";
  }
  return norm;
};

export function evaluateOccupationCompatibility(
  scheme: SchemeMetadata,
  userPersona: string | null,
  rawOccupation?: string | null
): { compatible: boolean; score: number; isDirect: boolean; reason: string } {
  if (!userPersona) {
    return { compatible: true, score: 25, isDirect: false, reason: "Open to general occupations" };
  }

  const category = normalize(scheme.category);
  const criteria = scheme.eligibility_criteria || {};
  const targetOccupations = (criteria.occupations || []).map(normalize);
  const targetCategories = (criteria.categories || []).map(normalize);

  const isUniversal = targetOccupations.some(
    (o) => o === "all" || o === "universal" || o.includes("all citizen") || o.includes("any occupation")
  );

  if (userPersona === "student") {
    const isEduCategory =
      category.includes("education") ||
      category.includes("scholarship") ||
      targetCategories.some((c) => c.includes("education") || c.includes("scholarship"));
    const isSkillCategory =
      category.includes("skill") || targetCategories.some((c) => c.includes("skill"));
    const hasStudentOcc = targetOccupations.some(
      (o) => o.includes("student") || o.includes("youth") || o.includes("scholar")
    );

    const isProhibited =
      category.includes("agriculture") ||
      category.includes("clean cooking") ||
      category.includes("housing") ||
      category.includes("social welfare") ||
      category.includes("social security") ||
      category.includes("food security") ||
      category.includes("insurance") ||
      (category.includes("financial inclusion") && !hasStudentOcc);

    if (isProhibited && !hasStudentOcc) {
      return {
        compatible: false,
        score: 0,
        isDirect: false,
        reason: "Agricultural, pension, housing, or business scheme not applicable to Students",
      };
    }

    if (isEduCategory && hasStudentOcc) {
      return {
        compatible: true,
        score: 50,
        isDirect: true,
        reason: "Dedicated student scholarship / higher education scheme",
      };
    }
    if (isEduCategory || hasStudentOcc) {
      return {
        compatible: true,
        score: 45,
        isDirect: true,
        reason: "Educational scheme for students",
      };
    }
    if (isSkillCategory && hasStudentOcc) {
      return {
        compatible: true,
        score: 35,
        isDirect: false,
        reason: "Youth skill development and training program",
      };
    }

    return {
      compatible: false,
      score: 0,
      isDirect: false,
      reason: "Not an educational scholarship or student youth program",
    };
  }

  if (userPersona === "farmer") {
    const isAgriCategory =
      category.includes("agriculture") ||
      targetCategories.some((c) => c.includes("agriculture") || c.includes("farming"));
    const hasFarmerOcc = targetOccupations.some(
      (o) =>
        o.includes("farmer") ||
        o.includes("cultivat") ||
        o.includes("sharecropper") ||
        o.includes("agri")
    );

    if (isAgriCategory || hasFarmerOcc) {
      return {
        compatible: true,
        score: 50,
        isDirect: true,
        reason: "Dedicated agricultural support and crop assistance scheme",
      };
    }
    if (
      category.includes("housing") &&
      targetOccupations.some((o) => o.includes("agri") || o.includes("rural"))
    ) {
      return {
        compatible: true,
        score: 45,
        isDirect: true,
        reason: "Rural housing assistance for farmer and rural households",
      };
    }
    if (category.includes("food") || category.includes("healthcare")) {
      return {
        compatible: true,
        score: 40,
        isDirect: false,
        reason: "Universal nutrition and health security for rural agricultural households",
      };
    }
    return { compatible: false, score: 0, isDirect: false, reason: "Non-agricultural scheme excluded for farmers" };
  }

  if (userPersona === "artisan") {
    const isArtisanCategory =
      category.includes("skill") || category.includes("handicraft") || category.includes("artisan");
    const hasArtisanOcc = targetOccupations.some(
      (o) =>
        o.includes("artisan") ||
        o.includes("craft") ||
        o.includes("vishwakarma") ||
        o.includes("karigar")
    );

    if (hasArtisanOcc || isArtisanCategory) {
      return {
        compatible: true,
        score: 50,
        isDirect: true,
        reason: "Dedicated traditional artisan and craftsperson scheme",
      };
    }
    if (category.includes("financial") || category.includes("insurance")) {
      return {
        compatible: true,
        score: 40,
        isDirect: false,
        reason: "Credit and social security for artisans and self-employed creators",
      };
    }
    return { compatible: false, score: 0, isDirect: false, reason: "Non-artisan scheme excluded" };
  }

  if (userPersona === "senior") {
    const isSeniorCategory =
      category.includes("welfare") ||
      category.includes("pension") ||
      category.includes("social security");
    const hasSeniorOcc = targetOccupations.some(
      (o) => o.includes("senior") || o.includes("elderly") || o.includes("retire")
    );

    if (hasSeniorOcc || isSeniorCategory) {
      return {
        compatible: true,
        score: 50,
        isDirect: true,
        reason: "Dedicated old age pension and senior citizen welfare scheme",
      };
    }
    if (category.includes("health") || category.includes("food")) {
      return {
        compatible: true,
        score: 45,
        isDirect: true,
        reason: "Healthcare and food security allowance for senior citizens",
      };
    }
    return { compatible: false, score: 0, isDirect: false, reason: "Non-senior scheme excluded" };
  }

  if (userPersona === "vendor") {
    const hasVendorOcc = targetOccupations.some(
      (o) => o.includes("vendor") || o.includes("hawker") || o.includes("street")
    );
    if (hasVendorOcc) {
      return {
        compatible: true,
        score: 50,
        isDirect: true,
        reason: "Dedicated street vendor micro-credit and working capital scheme",
      };
    }
    if (category.includes("financial") || category.includes("insurance")) {
      return {
        compatible: true,
        score: 42,
        isDirect: false,
        reason: "Micro-credit and insurance support for urban vendors",
      };
    }
    return { compatible: false, score: 0, isDirect: false, reason: "Not applicable for street vendors" };
  }

  if (userPersona === "business") {
    const isBusinessCategory =
      category.includes("financial inclusion") ||
      category.includes("business") ||
      category.includes("msme");
    const hasBusinessOcc = targetOccupations.some(
      (o) =>
        o.includes("business") ||
        o.includes("entrepreneur") ||
        o.includes("self-employed") ||
        o.includes("msme")
    );

    if (hasBusinessOcc || isBusinessCategory) {
      return {
        compatible: true,
        score: 50,
        isDirect: true,
        reason: "Business loan and MSME entrepreneurship development scheme",
      };
    }
    return { compatible: false, score: 0, isDirect: false, reason: "Non-business scheme excluded" };
  }

  if (userPersona === "worker") {
    const hasWorkerOcc = targetOccupations.some(
      (o) =>
        o.includes("daily wage") ||
        o.includes("worker") ||
        o.includes("labor") ||
        o.includes("unorganized") ||
        o.includes("poor")
    );
    const isTargetCategory =
      category.includes("social security") ||
      category.includes("food") ||
      category.includes("healthcare") ||
      category.includes("housing") ||
      category.includes("insurance") ||
      category.includes("skill");

    if (hasWorkerOcc && isTargetCategory) {
      return {
        compatible: true,
        score: 50,
        isDirect: true,
        reason:
          "Dedicated direct benefit and social protection for daily wage and unorganized workers",
      };
    }
    if (hasWorkerOcc || isTargetCategory) {
      return {
        compatible: true,
        score: 45,
        isDirect: true,
        reason: "Welfare, insurance, or shelter support for unorganized workers",
      };
    }
    return {
      compatible: false,
      score: 0,
      isDirect: false,
      reason: "Not targeted at unorganized / daily wage workers",
    };
  }

  if (userPersona === "salaried") {
    const hasSalariedOcc = targetOccupations.some(
      (o) => o.includes("salaried") || o.includes("employee") || o.includes("urban")
    );
    const isAllowedCategory =
      category.includes("housing") ||
      category.includes("insurance") ||
      category.includes("social security") ||
      category.includes("financial");

    if (hasSalariedOcc) {
      return {
        compatible: true,
        score: 50,
        isDirect: true,
        reason: "Dedicated housing subsidy or employee social security scheme",
      };
    }
    if (isAllowedCategory && !category.includes("agriculture") && !category.includes("food")) {
      return {
        compatible: true,
        score: 40,
        isDirect: false,
        reason: "Housing, financial, or insurance facility accessible to salaried individuals",
      };
    }
    return {
      compatible: false,
      score: 0,
      isDirect: false,
      reason: "Excluded: Scheme targeted exclusively at rural or unorganized segments",
    };
  }

  if (userPersona === "unemployed") {
    const isSkillOrJob =
      category.includes("skill") ||
      category.includes("training") ||
      category.includes("welfare") ||
      category.includes("food");
    const hasUnempOcc = targetOccupations.some(
      (o) => o.includes("unemployed") || o.includes("youth") || o.includes("job seeker")
    );

    if (hasUnempOcc || isSkillOrJob) {
      return {
        compatible: true,
        score: 48,
        isDirect: true,
        reason: "Skill development and basic livelihood welfare assistance for job seekers",
      };
    }
    if (category.includes("financial") || category.includes("insurance")) {
      return {
        compatible: true,
        score: 38,
        isDirect: false,
        reason: "Micro-financial inclusion support for unemployed citizens",
      };
    }
    return {
      compatible: false,
      score: 0,
      isDirect: false,
      reason: "Not targeted at unemployed job seekers",
    };
  }

  if (userPersona === "homemaker") {
    const isFamilyWomen =
      category.includes("clean cooking") ||
      category.includes("women") ||
      category.includes("child") ||
      category.includes("food");
    const hasHomemakerOcc = targetOccupations.some(
      (o) =>
        o.includes("homemaker") ||
        o.includes("woman") ||
        o.includes("women") ||
        o.includes("mother")
    );

    if (hasHomemakerOcc || isFamilyWomen) {
      return {
        compatible: true,
        score: 50,
        isDirect: true,
        reason: "Dedicated clean cooking fuel, nutrition, and maternal/child welfare program",
      };
    }
    if (category.includes("insurance") || category.includes("healthcare")) {
      return {
        compatible: true,
        score: 40,
        isDirect: false,
        reason: "Family healthcare and insurance coverage",
      };
    }
    return { compatible: false, score: 0, isDirect: false, reason: "Not applicable to homemakers" };
  }

  if (isUniversal) {
    return {
      compatible: true,
      score: 35,
      isDirect: false,
      reason: "Universal government initiative open to all citizens",
    };
  }

  const rawNorm = normalize(rawOccupation);
  if (targetOccupations.some((o) => o.includes(rawNorm) || rawNorm.includes(o))) {
    return {
      compatible: true,
      score: 40,
      isDirect: true,
      reason: `Matches your occupation (${rawOccupation})`,
    };
  }

  return { compatible: false, score: 0, isDirect: false, reason: `Not targeted at ${rawOccupation}` };
}

export function evaluateStateCompatibility(
  scheme: SchemeMetadata,
  userState?: string | null
): { compatible: boolean; score: number; reason: string } {
  if (!userState) {
    return { compatible: true, score: 25, reason: "Nationwide coverage (no state selected)" };
  }

  const criteria = scheme.eligibility_criteria || {};
  const targetStates = (criteria.states || ["All"]).map(normalize);
  const normState = normalize(userState);

  const hasAll = targetStates.some((s) => s === "all" || s.includes("all india"));
  const isDirectStateMatch = targetStates.some(
    (s) => s === normState || normState.includes(s) || s.includes(normState)
  );

  if (isDirectStateMatch && !hasAll) {
    return { compatible: true, score: 30, reason: `Exclusively active in your state (${userState})` };
  }
  if (isDirectStateMatch && hasAll) {
    return { compatible: true, score: 30, reason: `Actively disbursed in your state (${userState})` };
  }
  if (hasAll) {
    return {
      compatible: true,
      score: 25,
      reason: `Central Sector nationwide scheme active in ${userState}`,
    };
  }

  return {
    compatible: false,
    score: 0,
    reason: `Only active in: ${targetStates.join(", ")} (not ${userState})`,
  };
}

export function evaluateAgeCompatibility(
  scheme: SchemeMetadata,
  userAge?: number | null
): { compatible: boolean; score: number; reason: string } {
  const criteria = scheme.eligibility_criteria || {};
  const minAge = criteria.min_age !== undefined ? criteria.min_age : null;
  const maxAge = criteria.max_age !== undefined ? criteria.max_age : null;

  if (userAge === null || userAge === undefined) {
    return { compatible: true, score: 10, reason: "Age criteria satisfied" };
  }

  if (minAge !== null && userAge < minAge) {
    return {
      compatible: false,
      score: 0,
      reason: `Requires minimum age of ${minAge} (profile age is ${userAge})`,
    };
  }
  if (maxAge !== null && userAge > maxAge) {
    return {
      compatible: false,
      score: 0,
      reason: `Requires maximum age of ${maxAge} (profile age is ${userAge})`,
    };
  }

  return {
    compatible: true,
    score: 10,
    reason: `Age ${userAge} falls within the eligible bracket (${minAge || 0}–${maxAge || "no limit"} years)`,
  };
}

export function evaluateIncomeCompatibility(
  scheme: SchemeMetadata,
  userIncome?: number | null
): { compatible: boolean; score: number; reason: string } {
  const criteria = scheme.eligibility_criteria || {};
  const maxIncome = criteria.max_annual_income !== undefined ? criteria.max_annual_income : null;

  if (userIncome === null || userIncome === undefined) {
    return { compatible: true, score: 10, reason: "Income requirement satisfied" };
  }

  if (maxIncome !== null) {
    if (userIncome <= maxIncome) {
      const formattedIncome = `₹${Math.round(userIncome).toLocaleString("en-IN")}`;
      const formattedMax = `₹${Math.round(maxIncome).toLocaleString("en-IN")}`;
      return {
        compatible: true,
        score: 10,
        reason: `Annual income of ${formattedIncome} meets the ceiling of ${formattedMax}`,
      };
    }
    const formattedIncome = `₹${Math.round(userIncome).toLocaleString("en-IN")}`;
    const formattedMax = `₹${Math.round(maxIncome).toLocaleString("en-IN")}`;
    return {
      compatible: false,
      score: 0,
      reason: `Annual income of ${formattedIncome} exceeds the ceiling of ${formattedMax}`,
    };
  }

  return { compatible: true, score: 10, reason: "No income ceiling restriction" };
}

export function evaluateSchemeMatch(
  scheme: SchemeMetadata,
  profile: UserProfileCriteria
): SchemeEvaluation {
  const userPersona = getOccupationPersona(profile.occupation);
  const rawOccupation = profile.occupation;
  const userState = profile.state;
  const userAge = profile.age;
  const userIncome = profile.annualIncome;

  const reasons: string[] = [];
  const whyParts: string[] = [];

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
  whyParts.push(
    `As an active ${rawOccupation || "citizen"}, you qualify for this ${scheme.category} program.`
  );

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
    const formattedIncome = `₹${Math.round(userIncome).toLocaleString("en-IN")}`;
    whyParts.push(`Your annual income (${formattedIncome}) is within the permissible limit.`);
  }

  // Total score calculation (Max 100)
  const totalScore = Math.min(
    100,
    occResult.score + stateResult.score + ageResult.score + incomeResult.score
  );

  const dynamicTags = Array.from(
    new Set([
      scheme.category,
      rawOccupation || "Universal",
      userState || "All India",
      ...(scheme.tags || []),
    ])
  ).slice(0, 6);

  return {
    matchScore: totalScore,
    eligible: true,
    matchReasons: reasons,
    whyEligible: whyParts.join(" "),
    tags: dynamicTags,
  };
}

export function filterSchemesDynamically(
  schemes: SchemeMetadata[],
  filters: {
    occupation?: string | null;
    state?: string | null;
    category?: string | null;
    search?: string | null;
    q?: string | null;
  } = {}
): SchemeMetadata[] {
  const normOcc = normalize(filters.occupation);
  const userOccCat = getOccupationPersona(normOcc);
  const normState = normalize(filters.state);
  const normCategory = normalize(filters.category);
  const searchTerm = normalize(filters.q || filters.search);

  return schemes.filter((scheme) => {
    const criteria = scheme.eligibility_criteria || {};
    const targetOccupations = criteria.occupations || [];
    const targetStates = criteria.states || ["All"];
    const targetCategories = criteria.categories || [scheme.category];

    // 1. Occupation Filter
    if (normOcc && normOcc !== "all") {
      if (userOccCat === "student") {
        const isEdu =
          targetCategories.some(
            (c) => normalize(c).includes("education") || normalize(c).includes("scholarship")
          ) ||
          normalize(scheme.category).includes("education") ||
          normalize(scheme.category).includes("scholarship") ||
          targetOccupations.some(
            (o) => normalize(o).includes("student") || normalize(o).includes("youth")
          );
        if (!isEdu) return false;
      } else if (userOccCat === "farmer") {
        const isAgri =
          targetCategories.some(
            (c) => normalize(c).includes("agriculture") || normalize(c).includes("farming")
          ) ||
          normalize(scheme.category).includes("agriculture") ||
          targetOccupations.some(
            (o) =>
              normalize(o).includes("farmer") ||
              normalize(o).includes("agri") ||
              normalize(o).includes("cultivat")
          );
        if (!isAgri) return false;
      } else if (userOccCat === "artisan") {
        const isArtisan = targetOccupations.some(
          (o) =>
            normalize(o).includes("artisan") ||
            normalize(o).includes("craft") ||
            normalize(o).includes("vishwakarma")
        );
        if (!isArtisan) return false;
      } else if (userOccCat === "vendor") {
        const isVendor = targetOccupations.some(
          (o) => normalize(o).includes("vendor") || normalize(o).includes("hawker")
        );
        if (!isVendor) return false;
      } else if (userOccCat === "senior") {
        const isSenior = targetOccupations.some(
          (o) =>
            normalize(o).includes("senior") ||
            normalize(o).includes("elderly") ||
            normalize(o).includes("retire")
        );
        if (!isSenior) return false;
      } else if (userOccCat === "business") {
        const isBiz = targetOccupations.some(
          (o) =>
            normalize(o).includes("business") ||
            normalize(o).includes("entrepreneur") ||
            normalize(o).includes("self-employed")
        );
        if (!isBiz) return false;
      }
    }

    // 2. State Filter
    if (normState && normState !== "all" && normState !== "all india") {
      const stateList = Array.isArray(targetStates) ? targetStates : [targetStates];
      const stateMatches = stateList.some((s) => {
        const sNorm = normalize(s);
        return (
          sNorm === "all" ||
          sNorm === "all india" ||
          sNorm === normState ||
          sNorm.includes(normState) ||
          normState.includes(sNorm)
        );
      });
      if (!stateMatches) return false;
    }

    // 3. Category Filter
    if (normCategory && normCategory !== "all categories" && normCategory !== "all") {
      const schemeCat = normalize(scheme.category);
      if (!schemeCat.includes(normCategory) && !normCategory.includes(schemeCat)) {
        return false;
      }
    }

    // 4. Search Keyword Filter
    if (searchTerm) {
      const canonicalSearch = resolveCanonicalSchemeId(searchTerm);
      const name = normalize(scheme.name);
      const desc = normalize(scheme.description);
      const cat = normalize(scheme.category);
      const id = normalize(scheme.id);
      const tags = (scheme.tags || []).map(normalize);

      const matchesSearch =
        name.includes(searchTerm) ||
        desc.includes(searchTerm) ||
        cat.includes(searchTerm) ||
        id.includes(searchTerm) ||
        (canonicalSearch && id === canonicalSearch) ||
        tags.some((t) => t.includes(searchTerm));

      if (!matchesSearch) return false;
    }

    return true;
  });
}
