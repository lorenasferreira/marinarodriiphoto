/**
 * Public, client-approved records only. Internal drafts are imported only by
 * the artistic review routes.
 * Images: { id, src, width, height, alt, translations: { en: { alt } } }.
 * translations: { en: { title, subtitle, description, credits, awardDetails } }.
 * Keep official text as supplied; missing translations use the original text.
 */
export const personalProjects = [];

export function isPublishable(project) {
  return project.status === "published" && project.releaseAuthorized === true &&
    Boolean(project.id && project.slug && project.title && project.coverImage?.src &&
      project.coverImage?.alt && project.galleryImages?.length) &&
    project.galleryImages.every(image => image.src && image.alt && image.width > 0 && image.height > 0);
}
const sectionIds = ["magazines", "personal", "honorableMention", "exhibitions"];

export function projectSections(projects) {
  return sectionIds.map(id => ({
    id,
    entries: projects.filter(project => (project.section ?? "personal") === id)
      .sort((a, b) => a.displayOrder - b.displayOrder),
  })).filter(section => section.entries.length);
}

export function publishedProjects(records = personalProjects) {
  return records.filter(isPublishable).sort((a, b) => a.displayOrder - b.displayOrder);
}
export function projectContent(project, language = "pt") {
  return { ...project, ...project.translations?.[language.split("-")[0]] };
}
