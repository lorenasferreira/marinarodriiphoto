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
- Confirm the spelling of *Pure Colours*, the preferred Ticiani title and the provisional association of the red-lit and monochrome Rosalía photographs with the two acts. The PhotoVogue entry records the different wording shown on the supplied screenshot.
- Confirm the final cuts, embedded subtitles, music and publication rights for the three supplied films. Request the Rosalía short film and Melanina documentary if Marina wants them included.
- Confirm whether the separately filed `Concurso` images under the What's Your Story? source folder belong in its gallery. The *Mudar* series uses the clearly identified embassy competition set and two supporting images from the honourable mention folder.

## Promote approved records

Add only explicitly approved entries to `frontend/src/data/personalProjects.js`, set `status` to `published` and `releaseAuthorized` to `true`, and move or copy the approved web derivatives to a public release directory outside `assets/artistic/`. Update all media paths in the public records. The draft directory can remain excluded while other entries are awaiting approval.

Run the frontend tests and build, review the production output for approved files and route metadata, and verify the published routes in all four languages before the release PR. The commercial Portfolio inventory and hosted importer workflow are independent of this release.
