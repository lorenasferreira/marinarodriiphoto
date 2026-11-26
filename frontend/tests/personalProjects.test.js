import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { test } from "node:test";
import { isPublishable, projectContent, projectSections, publishedProjects } from "../src/data/personalProjects.js";

const drafts = JSON.parse(readFileSync(new URL("../../docs/content/personal-project-drafts.json", import.meta.url)));
const languages = ["pt", "en", "es", "ca"];

test("the review catalogue follows the requested section and project order", () => {
  assert.equal(drafts.filter(project => !project.section).length, 6);
  assert.deepEqual(projectSections(drafts).map(({ id, entries }) => [id, entries.map(project => project.slug)]), [
    ["magazines", ["vogue", "vrse", "selin"]],
    ["personal", ["rosalia", "whats-your-story", "ticiani", "danilo-pride-2026", "pure-colours", "melanina"]],
    ["honorableMention", ["mudar"]],
    ["exhibitions", ["palau", "monad"]],
  ]);
  assert.equal(new Set(drafts.map(project => project.slug)).size, drafts.length);
  assert.deepEqual(publishedProjects(drafts), []);
  assert.ok(drafts.every(project => project.status === "draft" && !project.releaseAuthorized));
  assert.ok(isPublishable({ ...drafts[0], status: "published", releaseAuthorized: true }));
});

test("every draft has localized copy, localized image text and existing responsive media", () => {
  for (const project of drafts) {
    for (const language of languages) {
      const content = projectContent(project, language);
      assert.ok(content.title && content.description, `${project.slug} (${language})`);
      if (language !== "pt") assert.ok(project.translations[language].description);
      if (project.awardTitle) assert.ok(content.awardTitle && content.awardDetails);
      if (project.slug === "mudar") assert.ok((language === "pt" ? project : project.translations[language]).subtitle);
    }
    const ids = project.galleryImages.map(image => image.id);
    assert.ok(ids.includes(project.coverImage.id));
    if (project.imageGroups) assert.deepEqual(project.imageGroups.flatMap(group => group.ids), ids);
    for (const image of project.galleryImages) {
      assert.ok(image.width > 0 && image.height > 0 && image.smallWidth > 0 && image.alt);
      for (const language of languages.slice(1)) assert.ok(image.translations[language].alt);
      assertMedia(image.src);
      assertMedia(image.small);
    }
    for (const video of project.videos ?? []) {
      assertMedia(video.src);
      assertMedia(video.poster);
    }
  }
});

function assertMedia(path) {
  assert.ok(path.startsWith("/assets/artistic/"));
  assert.ok(statSync(new URL(`../public${path}`, import.meta.url)).size > 0, path);
}
