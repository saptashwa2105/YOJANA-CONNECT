const fs = require('fs');
const path = require('path');
const { resolveCanonicalSchemeId } = require('../utils/schemeIdHelper');

const SCHEMES_DIR = path.resolve(__dirname, '../data/schemes');

let schemesCache = null;
let lastCacheTime = 0;

/**
 * Reads all scheme JSON files directly from data/schemes/
 */
const loadSchemesFromDisk = () => {
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
      schemes.push({
        ...data,
        officialUrl: data.official_url || data.officialUrl,
        sourceUrl: data.source_url || data.sourceUrl,
        applicationProcess: data.application_process || data.applicationProcess,
      });
    } catch (err) {
      console.warn(`[schemeController] Failed to parse scheme JSON ${file}:`, err.message);
    }
  }

  schemesCache = schemes;
  lastCacheTime = now;
  return schemes;
};

const normalize = (str) => (str || '').trim().toLowerCase();

const getOccupationCategory = (occStr) => {
  const norm = normalize(occStr);
  if (!norm) return null;

  if (norm.includes('student') || norm.includes('vidyarthi') || norm.includes('scholar') || norm.includes('college') || norm.includes('school')) {
    return 'student';
  }
  if (norm.includes('farmer') || norm.includes('kisan') || norm.includes('agri') || norm.includes('cultivat')) {
    return 'farmer';
  }
  if (norm.includes('artisan') || norm.includes('craft') || norm.includes('vishwakarma') || norm.includes('karigar')) {
    return 'artisan';
  }
  if (norm.includes('vendor') || norm.includes('street') || norm.includes('hawker') || norm.includes('thela')) {
    return 'vendor';
  }
  if (norm.includes('senior') || norm.includes('retire') || norm.includes('old age') || norm.includes('pensioner')) {
    return 'senior';
  }
  if (norm.includes('self-employed') || norm.includes('business') || norm.includes('entrepreneur') || norm.includes('msme') || norm.includes('shop')) {
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
 * Filters an array of schemes dynamically based on occupation, state, category, and keyword
 */
const filterSchemesDynamically = (schemes, { occupation, state, category, search, q } = {}) => {
  const normOcc = normalize(occupation);
  const userOccCat = getOccupationCategory(normOcc);
  const normState = normalize(state);
  const normCategory = normalize(category);
  const searchTerm = normalize(q || search);

  return schemes.filter((scheme) => {
    const criteria = scheme.eligibility_criteria || {};
    const targetOccupations = criteria.occupations || [];
    const targetStates = criteria.states || ['All'];
    const targetCategories = criteria.categories || [scheme.category];

    // 1. Occupation Filter
    if (normOcc && normOcc !== 'all') {
      if (userOccCat === 'student') {
        const isEdu = targetCategories.some((c) => normalize(c).includes('education') || normalize(c).includes('scholarship')) ||
          normalize(scheme.category).includes('education') || normalize(scheme.category).includes('scholarship') ||
          targetOccupations.some((o) => normalize(o).includes('student') || normalize(o).includes('youth'));

        if (!isEdu) return false;
      } else if (userOccCat === 'farmer') {
        const isAgri = targetCategories.some((c) => normalize(c).includes('agriculture') || normalize(c).includes('farming')) ||
          normalize(scheme.category).includes('agriculture') ||
          targetOccupations.some((o) => normalize(o).includes('farmer') || normalize(o).includes('agri') || normalize(o).includes('cultivat'));

        if (!isAgri) return false;
      } else if (userOccCat === 'artisan') {
        const isArtisan = targetOccupations.some((o) => normalize(o).includes('artisan') || normalize(o).includes('craft') || normalize(o).includes('vishwakarma'));
        if (!isArtisan) return false;
      } else if (userOccCat === 'vendor') {
        const isVendor = targetOccupations.some((o) => normalize(o).includes('vendor') || normalize(o).includes('hawker'));
        if (!isVendor) return false;
      } else if (userOccCat === 'senior') {
        const isSenior = targetOccupations.some((o) => normalize(o).includes('senior') || normalize(o).includes('elderly') || normalize(o).includes('retire'));
        if (!isSenior) return false;
      } else if (userOccCat === 'business') {
        const isBiz = targetOccupations.some((o) => normalize(o).includes('business') || normalize(o).includes('entrepreneur') || normalize(o).includes('self-employed'));
        if (!isBiz) return false;
      }
    }

    // 2. State Filter
    if (normState && normState !== 'all' && normState !== 'all india') {
      const stateList = Array.isArray(targetStates) ? targetStates : [targetStates];
      const stateMatches = stateList.some((s) => {
        const sNorm = normalize(s);
        return (
          sNorm === 'all' ||
          sNorm === 'all india' ||
          sNorm === normState ||
          sNorm.includes(normState) ||
          normState.includes(sNorm)
        );
      });
      if (!stateMatches) return false;
    }

    // 3. Category Filter
    if (normCategory && normCategory !== 'all categories' && normCategory !== 'all') {
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
};

const resolveActiveProfileFilters = (req) => {
  const query = req.query || {};
  const body = req.body || {};
  const bodyProfile = body.profile || body;
  const user = req.user || null;

  const occupation = query.occupation || bodyProfile.occupation || (user ? user.occupation : null);
  const state = query.state || bodyProfile.state || (user ? user.state : null);
  const category = query.category || bodyProfile.category || null;
  const search = query.search || query.q || bodyProfile.search || bodyProfile.q || null;

  return {
    occupation,
    state,
    category,
    search,
    user,
  };
};

// GET /api/schemes/search
const searchSchemes = async (req, res, next) => {
  try {
    const filters = resolveActiveProfileFilters(req);
    const allSchemes = loadSchemesFromDisk();
    const filteredSchemes = filterSchemesDynamically(allSchemes, filters);

    return res.status(200).json({
      success: true,
      query: filters.search || '',
      filteredBy: {
        occupation: filters.occupation || null,
        state: filters.state || null,
        category: filters.category || null,
      },
      count: filteredSchemes.length,
      data: filteredSchemes,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/schemes
const getAllSchemes = async (req, res, next) => {
  try {
    const filters = resolveActiveProfileFilters(req);
    const allSchemes = loadSchemesFromDisk();
    const filteredSchemes = filterSchemesDynamically(allSchemes, filters);

    return res.status(200).json({
      success: true,
      filteredBy: {
        occupation: filters.occupation || null,
        state: filters.state || null,
        category: filters.category || null,
      },
      count: filteredSchemes.length,
      data: filteredSchemes,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/schemes/:id
const getSchemeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const canonicalId = resolveCanonicalSchemeId(id) || id;
    const allSchemes = loadSchemesFromDisk();

    const scheme = allSchemes.find((s) => s.id === canonicalId || s.id === id);

    if (!scheme) {
      return res.status(404).json({
        success: false,
        message: `Scheme with id '${id}' not found`,
      });
    }

    return res.status(200).json({
      success: true,
      data: scheme,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchSchemes,
  getAllSchemes,
  getSchemeById,
  filterSchemesDynamically,
  loadSchemesFromDisk,
};
