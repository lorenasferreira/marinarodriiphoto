# Artistic preview and release

Run `npm run dev` from `frontend/` and open `/personal-projects`. The local alias `/dev/personal-projects` also works in development. The review catalogue lives in [personal-project-drafts.json](content/personal-project-drafts.json), with local static media in `frontend/public/assets/artistic/`.

## Vercel branch preview

Open `/personal-projects` on the deployment for `feature/marina-artistic-projects`. The build includes the draft catalogue and media only when Vercel exposes both `VERCEL_ENV=preview` and `VERCEL_GIT_COMMIT_REF=feature/marina-artistic-projects`. If either value is missing, the build uses the public release catalogue and excludes draft assets. Review pages use `noindex, nofollow`. Deployment access is controlled by the existing Vercel protection settings.

The Git-connected build needs access to the catalogue in `docs/content/`. If Vercel uses `frontend/` as the project root, this relies on its default access to repository files outside the root. The local media are intended for the Git-connected preview. Vercel applies a separate source-upload limit to CLI deployments. [Vercel build configuration](https://vercel.com/docs/builds/configure-a-build#root-directory) · [Vercel source-upload limits](https://vercel.com/docs/limits#static-file-uploads)

To reproduce the preview build locally from `frontend/`:

```sh
VERCEL_ENV=preview VERCEL_GIT_COMMIT_REF=feature/marina-artistic-projects npm run build
npm run preview
```

A regular `npm run build` produces the production-safe output. The three optimized films are served from the same static media directory and have embedded English subtitles. The detail pages use `preload="none"` so browsers can defer the film downloads until playback.

## Approval

- Review the four translations, gallery sequencing, publication captions and representation of the participants with Marina.
- Marina confirmed *Pure Colours* and *Ticiani: The Renaissance of Popstar*. Editorial entries retain their published titles.
- Both the red-lit and monochrome Rosalía photographs belong to Berghain. Marina will supply the La Perla photographs, official names for both acts and missing video materials.
- Melanina is a photography-only delivery. Adding the documentary or a YouTube link after official release is a separate contracted service.
- What's Your Story? includes six photographs from its own `Concurso` folder. The separately supplied embassy competition series belongs to *Mudar*.
- Confirm the final cuts, embedded subtitles, music and publication rights for the three supplied films.

## Video posters

Each film uses its own `videos[].poster` path in [the review catalogue](content/personal-project-drafts.json). The project cover uses the separate `coverImage` field. The current poster paths under `frontend/public/` are:

- What's Your Story? — `assets/artistic/whats-your-story/whats-your-story-03.jpg`
- Ticiani — `assets/artistic/ticiani/ticiani-06.jpg`
- Danilo: Pride 2026 — `assets/artistic/danilo/danilo-04.jpg`

Once Marina selects replacements, add the optimized images and update the corresponding poster paths. Playback continues to load on demand.

## Promote approved records

Add only explicitly approved entries to `frontend/src/data/personalProjects.js`, set `status` to `published` and `releaseAuthorized` to `true`, and move or copy the approved web derivatives to a public release directory outside `assets/artistic/`. Update all media paths in the public records. The draft directory can remain excluded while other entries are awaiting approval.

Run the frontend tests and build, review the production output for approved files and route metadata, and verify the published routes in all four languages before the release PR. The commercial Portfolio inventory and hosted importer workflow are independent of this release.
