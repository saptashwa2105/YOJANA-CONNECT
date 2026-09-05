function chunkScheme(scheme) {
  const sections = [
    ['Overview', scheme.description],
    ['Benefits', scheme.benefits],
    ['Eligibility', scheme.eligibility],
    ['Documents', scheme.documents],
    ['Application', scheme.application_process],
  ];

  return sections
    .filter(([, content]) => typeof content === 'string' && content.trim())
    .map(([section, content]) => ({
      id: `${scheme.id}:${section.toLowerCase()}`,
      text: `Scheme: ${scheme.name}\nSection: ${section}\n${content}`,
      metadata: {
        schemeId: scheme.id,
        schemeName: scheme.name,
        section,
        sourceUrl: scheme.source_url,
        officialUrl: scheme.official_url,
      },
    }));
}

module.exports = {
  chunkScheme,
};

