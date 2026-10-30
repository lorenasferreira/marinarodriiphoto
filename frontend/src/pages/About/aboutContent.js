// Source: biography and creative disciplines already published in the locale files.
// Marina must confirm the professional start year and completed-project total.
// Null values render XX in development, an ellipsis in production, and a visible
// pending-confirmation note in both. Labels are provisional until Marina approves them.
export const aboutContent = {
  baseKey: "about.editorial.location",
  portraitLocation: "Barcelona",
  disciplinesKey: "about.editorial.disciplines",
  statistics: [
    { id: "experience", value: null, developmentPlaceholder: "XX", labelKey: "about.stats.experience.label" },
    { id: "projects", value: null, developmentPlaceholder: "XX", labelKey: "about.stats.projects.label" },
  ],
  stories: [
    { id: "one", image: "story-1.webp", place: "Santos", categoryKey: "about.editorial.origin" },
    { id: "two", image: "story-2.webp", place: null, categoryKey: "about.editorial.journey" },
    { id: "three", image: "story-3.webp", place: "Barcelona", categoryKey: "about.editorial.home" },
  ],
};
