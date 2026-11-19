// Development-only fictional copy and labeled frames, never client documentation.
export function placeholder(label, width = 1200, height = 1500, tone = '#d8cdbf') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="${tone}"/><rect x="50" y="50" width="${width - 100}" height="${height - 100}" fill="none" stroke="#8c8072"/><path d="M50 50 L${width - 50} ${height - 50} M${width - 50} 50 L50 ${height - 50}" stroke="#8c8072" opacity=".18"/><text x="50%" y="47%" text-anchor="middle" font-family="Georgia,serif" font-size="${width / 22}" fill="#38332c">${label}</text><text x="50%" y="54%" text-anchor="middle" font-family="Arial,sans-serif" font-size="${width / 48}" fill="#62584e">DEMONSTRATION FRAME · NO PROJECT PHOTOGRAPH</text></svg>`;
  return { id: label.toLowerCase().replaceAll(' ', '-'), src: `data:image/svg+xml,${encodeURIComponent(svg)}`, width, height, alt: `Labeled demonstration frame: ${label}. No actual project photograph.` };
}
const concepts = [
  ['honorable-mention', 'Honorable Mention', 'An exhibition sequence', 'This fictional sample considers the way a gesture can hold a memory. A small sequence moves between closeness and distance, leaving space for the viewer to build their own reading.', 'Sample award field — the awarding body, year and distinction must be verified.'],
  ['painting-collaboration', 'Painting Collaboration', 'A conversation between surfaces', 'In this fictional example, photographic light and painted surfaces share the same space. The sequence explores how a mark, a colour and a human presence might answer one another across different media.', null],
  ['rosalia', 'Rosalía', 'Rhythm, gesture and stillness', 'This fictional sample imagines a sequence shaped by rhythm and pause. Portraits and studies of movement alternate, allowing an imagined performance to linger in a still image. This is not documentation of a collaboration or endorsement.', null],
  ['melanina', 'Melanina', 'An unpublished visual study', 'This fictional sample demonstrates a place for an intimate artist statement. Light, texture and presence guide an imagined photographic sequence. The actual concept, story and images remain to be supplied and approved by Marina.', null],
];
export const demoProjects = concepts.map(([slug, title, subtitle, description, awardDetails], index) => ({
  id: `demo-${slug}`, slug, title, subtitle, description, awardDetails,
  status: 'draft', releaseAuthorized: false, displayOrder: index + 1,
  credits: ['Sample collaborator credit — name and role pending approval.'],
  coverImage: placeholder('Cover photograph', index % 2 ? 1200 : 1500, index % 2 ? 1500 : 1100),
  galleryImages: [placeholder('Exhibition view', 1600, 1000), placeholder('Portrait study', 900, 1300, '#c7c8bc'), placeholder('Artwork detail', 1000, 1200, '#cdbeb3'), placeholder('Behind the scenes', 1600, 1000, '#c2c8ca')],
  translations: Object.fromEntries(['en', 'pt', 'es', 'ca'].map(language => [language, { title, subtitle, description, credits: ['Sample collaborator credit — name and role pending approval.'] }]))
}));
