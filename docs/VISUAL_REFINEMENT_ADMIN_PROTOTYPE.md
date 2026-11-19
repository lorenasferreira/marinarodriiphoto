# Visual refinement and admin prototype

Continuation on `feature/frontend-completion`, 2026-11-05. This report supplements the earlier frontend completion report and supersedes its statement that there is no admin interface. No production deployment, commit, push, merge, backend modification or new dependency.

## Local routes

The existing dev server is available at `http://127.0.0.1:5173`.

| Route | Purpose |
| --- | --- |
| `/contact` | Refined public Contact design |
| `/dev/personal-projects` | All four demonstration layouts |
| `/dev/personal-projects/honorable-mention` | Honorable Mention sample |
| `/dev/personal-projects/painting-collaboration` | Painting Collaboration sample |
| `/dev/personal-projects/rosalia` | Rosalía sample |
| `/dev/personal-projects/melanina` | Unpublished Melanina sample |
| `/admin` | Studio dashboard |
| `/admin/photos` | Photography inventory and local controls |
| `/admin/projects` | Sample project editor |
| `/admin/uploads` | Upload/optimization plan |

Start locally with `npm --prefix frontend run dev -- --host 127.0.0.1`. Vite may select another port if 5173 is occupied; use its printed URL. All `/dev` and `/admin` pages require a development server. A production build renders the public not-found fallback for those URLs.

## Implemented

### Contact

Two existing Marina photographs form an offset editorial mosaic beside the introduction, with separate readable text and form areas. A six-image portrait filmstrip follows the contact section; the repeated group is decorative and hidden from assistive technology. Existing optimized 640px thumbnails are reused, original files remain untouched. The strip moves continuously, pauses on hover or via its localized button, and becomes a manually scrollable static sequence for reduced-motion users. Mobile composition stacks the intro and mosaic.

The direct WhatsApp link and expandable name/message composer retain existing localized behavior. Users review and send in WhatsApp. There is no backend form submission and no email option. EN/PT/ES/CA include new descriptive labels and motion controls.

### Personal Projects demonstration

The index contains four provisional identification labels, large labeled image frames, fictional introductions and statements. Detail pages reuse the public detail renderer with a development notice, cover, description, sample credits, optional unverified award field, exhibition/artwork/portrait/backstage frames, keyboard-accessible lightbox and previous/next sample navigation.

All sample copy is explicitly fictional. Placeholder frames are SVG illustrations created in code; they are not client photographs. No unrelated real images are assigned to projects. Development preview and management controls are in English; project content editing supports separate EN/PT/ES/CA fields. Existing English sample copy in these fields is illustrative, not approved artistic translation.

The public project data remains empty and the original internal records remain drafts. Melanina stays inaccessible on public project routes. Its prototype record cannot be switched to published. Simulated publication of other sample records only changes a dashboard badge; it never writes public records or authorizes release. Static layout previews intentionally use independent demo fixtures rather than edits in the mock manager.

### Admin

The dashboard shows a real static inventory of 89 photographs in four existing commercial categories, plus clearly labeled sample project/draft counts. These are computed from current in-memory records; local changes alter the counts. Recent activity shows operations actually performed in this prototype session, not invented server history.

Photography management includes thumbnail grid, filename/ID search, category filter, selection, larger native-dialog preview, stable category/filename identifiers, existing gallery dimensions and measured repository file sizes, known commercial usage and explicitly incomplete mapping of other page usages. Controls support local upload/replacement, metadata alt text editing, global display ordering, hiding, removal and one-step undo. Replacement preserves the local stable identifier. New local files use UUIDs. JPEG/PNG/WebP files up to 20 MB are decoded into temporary object URLs; no files leave the browser. Object URLs are released on leaving the admin workspace. This local validation is not a production security mechanism.

Project management supports create/edit, unique slug validation, four content-language tabs, title/introduction/statement/credits/award fields, cover frame selection, gallery membership, draft/simulated publication and reset/save feedback. Melanina is locked to draft. Sample edits persist across admin navigation while mounted, and reset on reload or exiting the workspace. There is no database, localStorage, API or filesystem mutation.

## Production boundary

`App.jsx` conditionally imports the prototype and previews only when `import.meta.env.DEV` is true. Vite eliminates these imports and routes for production. Prototype data, inventory, CSS and fictional project text are kept under `src/dev`, outside `public`, and are not imported by public data modules. Production runtime checks verified `/admin`, nested admin paths, `/dev/personal-projects` and its Melanina detail resolve to the generic noindex fallback without any prototype UI. Bundle scanning found no prototype code, styles or sample identifiers. No write API was created or called.

This dev flag is a build boundary, not authentication. The dev server is bound to loopback for local review. Real production administration still needs backend security.

## Backend / Cloudinary audit

Existing backend source uses Spring Boot 4.1.0, Java 21, Spring MVC/JPA, MySQL and Cloudinary HTTP5 SDK 2.3.0. Versions were read from repository configuration; no runtime server or live database/Cloudinary connection was tested.

- `Project` stores title, unique slug, description, year, recognition, cover URL/public ID, published flag, display order and ordered photo relationship.
- `Photo` stores URL, Cloudinary public ID, alt text, position and required project association.
- `User` has email, password and role fields. No Spring Security dependency, authentication controller, security filter chain or authenticated authorization setup was found. A User entity alone does not secure endpoints.
- Existing `/api/projects` controller exposes list/get/create/update/delete. Listing currently returns all records, without publication filtering. Public DTOs must exclude drafts.
- `/api/projects/{projectId}/photos` supports list/upload/delete. The deletion path passes only photo ID to the service; it does not verify the photo belongs to the path's project. Fix ownership checks before exposing authenticated management.
- Cloudinary upload reads file bytes and places assets in `marinarodriiphoto/projects`, then persists secure URL/public ID. Delete destroys the Cloudinary asset before removing its database record. There is no version/rollback transaction across these systems.
- Multipart requests/files are capped at 20 MB. Format signatures, decoded pixel limits and safe derivative policies are not implemented in the reviewed services.
- Cloudinary credentials and database connection use environment variables. No secrets were copied into frontend source. Cloudinary config does not explicitly set `secure: true`; verify HTTPS delivery configuration before production.
- Current Hibernate configuration uses `ddl-auto=update`; no versioned migrations were found. Introduce reviewed migrations before production administration.
- CORS permits the localhost development origin. CORS is not authorization. Existing unprotected write endpoints must not be publicly exposed in this state.

## Recommended production authentication

Use Spring Security with OpenID Connect login against an approved identity provider, an explicit allowlist of Marina/admin accounts and server-side role checks. Prefer a same-origin backend-for-frontend/session arrangement with Secure, HttpOnly, SameSite cookies, CSRF protection, short idle expiry, proper logout, and provider MFA. Do not put long-lived credentials in frontend storage. Require admin authorization on every mutation, including upload signing and deletion; return only published DTOs from public reads. Deny by default, validate ownership, constrain CORS to known origins, and maintain audit history. This is a recommendation, not an implementation or configured provider.

Primary references: [Spring Security OAuth2](https://docs.spring.io/spring-security/reference/servlet/oauth2/) and [CSRF protection](https://docs.spring.io/spring-security/reference/features/exploits/csrf.html).

## Database work needed

Preserve existing entities through explicit migrations. Add a stable asset entity with unique immutable ID, original filename, Cloudinary asset/public ID, version, secure URL, MIME, byte size, dimensions, checksum, lifecycle state and timestamps. Add category and ordered category-asset/project-asset relationships so shared files are not duplicated or prematurely destroyed. Store locale-specific title, statement, credits and alt text in translation records keyed by language and owner. Add project subtitle, release approval metadata, cover asset reference, optimistic locking/version, published timestamps and audit events. Model soft deletion/retention and replacement history before destructive cleanup. Match the public frontend contract through explicit DTOs instead of serializing JPA relationships.

The local inventory's stable IDs are deterministic repository keys, not claimed database primary keys. Migration should map them to asset IDs while retaining legacy filename references.

## Proposed image pipeline

1. Authenticate and authorize before accepting bytes or signing an upload. Validate extension, MIME and file signature, decode the image, apply orientation, and enforce proposed 20 MB / 50 megapixel ceilings. Reject malformed files and unsupported formats (including SVG). Browser checks only improve feedback; enforce limits on the server. Bound decode resources and add rate limits.
2. Preserve the original under a unique versioned asset key, with restricted access when needed. Record bytes, dimensions, checksum and original name. Public derivatives should exclude GPS/private metadata; review colour-profile preservation and orient output consistently. Do not destructively compress the only original.
3. Prepare thumbnails at 320/640px and display widths at 960/1440/1920/2560px as appropriate; constrain to original dimensions, preserve artistic framing/aspect ratio and avoid unapproved crops. Use `srcset`/`sizes`, automatic delivery format/quality (`f_auto`, `q_auto`), lazy loading below the fold and eager/high-priority loading only for the primary hero. Quality settings require visual approval on Marina's work.
4. Use approved named/eager transformations to constrain variant growth, warm key sizes as needed and use versioned cacheable delivery URLs. Cloudinary recommends automatic format/quality for optimized responsive delivery: [image optimization](https://cloudinary.com/documentation/image_optimization), [responsive delivery](https://cloudinary.com/documentation/responsive_html). Keep delivery transformations separate from destructive incoming processing; [incoming/eager transformation guidance](https://cloudinary.com/documentation/eager_and_incoming_transformations).
5. For replacement, upload a new immutable asset, validate derivatives, then atomically update references with optimistic locking. Keep the prior reference/version for rollback and audit. Never overwrite/delete the active original first. Use reference counts and a defined retention period (proposed 30 days, subject to approval) before asynchronous permanent deletion. Retry and reconcile Cloudinary/database partial failures.

No optimization/upload service was added in this iteration. Existing local thumbnails continue to serve public pages.

## Files in this iteration

Created:
- `frontend/src/dev/AdminPrototype.jsx`
- `frontend/src/dev/ProjectPreview.jsx`
- `frontend/src/dev/demoProjects.js`
- `frontend/src/dev/photoInventory.json` (real local file metadata snapshot)
- `frontend/src/dev/prototype.css`
- This report.

Modified:
- `frontend/src/App.jsx`: isolated development imports/routes, admin shell boundary, noindex preview titles.
- `frontend/src/pages/Contact/Contact.jsx` and `.css`: mosaic, filmstrip and motion controls, explicit absence of email.
- `frontend/src/pages/PersonalProjects/PersonalProjects.jsx`: reusable detail export, preview-only banner slot and configurable back route.
- All four locale JSON files: Contact image descriptions and motion controls.

Approved Home, About and commercial Portfolio designs, backend code and original image files were not modified by this iteration. Earlier uncommitted frontend-completion changes remain intact.

## Validation

- Build and lint: PASS. Build emitted an advisory about time spent in Vite's output-directory preparation; build completed successfully.
- `git diff --check`: PASS.
- Chrome headless at 320, 375, 390, 768, 1440px: PASS for Contact in all four languages and every preview/admin layout; no horizontal overflow.
- All four project detail layouts, index, labeled gallery frames and previous/next links rendered. Lightbox next/Escape and return focus: PASS. Existing shared lightbox focus containment is retained.
- Contact: direct localized WhatsApp URL, personalized form preparation, absence of email, pause control, continuous-animation style and reduced-motion static mode: PASS. Final optimized mosaic images decoded successfully. Actual WhatsApp messages were not sent.
- Admin: 89-image inventory, filtering, search, metadata selection, image dialog, hide/remove/undo/reorder, in-browser PNG upload, navigation persistence, replacement preserving ID/dimensions, project creation/edit/save, all four content tabs, mock publication and Melanina lock: PASS. Reload resets the fixture state.
- Network capture during prototype tests: zero `/api/` requests. JavaScript exception capture: zero uncaught exceptions.
- Production bundle scan and browser runtime at `/admin`, nested admin routes and project preview URLs: PASS; no prototype UI or sample data in production assets, routes fall back with noindex.
- Desktop/mobile screenshots captured under `/private/tmp/refinement-*`; Contact, overview and project index visually reviewed. Numeric stats use the UI font after a local display-font glyph problem was found.
- No live backend, authentication, database migration, Cloudinary integration or deployment was exercised. Local browser/build validation cannot certify those future integrations.

## Remaining production steps

Approve actual project materials/translations and release decisions; choose the identity provider; secure and test existing API reads/writes; implement DTO validation, ownership checks and publication filtering; migrate the database; implement asset processing/versioning/retention; connect the editor to authenticated endpoints; add conflict/error/retry handling and unsaved-change protection; then perform authenticated end-to-end/security and rollback testing. Regenerate the local inventory or replace it with the secured asset API as photographs evolve. The prototype is for workflow/design review and does not save production content.
