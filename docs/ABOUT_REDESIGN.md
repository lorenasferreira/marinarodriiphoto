# About redesign content and validation

The About page uses the existing global Header and Footer. It follows the supplied visual reference without importing the screenshot's invented facts, numbers, ratings, dates, contact details or external links.

## Existing content retained

Biography and artistic philosophy content is retained from the existing four locale files. The visual-refinement pass replaces sentence-punctuation dashes with natural punctuation in the About page prose only. Existing website statements are the source for Santos, Brazil; Business studies; four years working aboard cruise ships; relocation to Barcelona; and experience in content creation, makeup and filmmaking. These were not independently verified outside the project. No new biography was written.

The existing portrait.webp, about-1.webp, about-2.webp and story-1.webp through story-3.webp assets are reused. They are not replaced with the reference's photographs. Image captions describe an editorial approach, not an unverified date, location or camera specification.

The final refinement replaces the initial static reviews panel with the ten exact client-supplied Google reviews and the client-supplied Google share URL. The 5.0/5 profile rating and total of 11 reviews are manually maintained in reviewProfile; ten selected reviews are included in the carousel. The contact invitation uses the existing /contact route. The shared Footer now has an ivory background, larger Marina Rodrigues branding with the existing black MR monogram, a short translated description based on existing photography disciplines, the existing contact route, and the unchanged Instagram, WhatsApp and developer URLs. Copyright and developer-credit wording are retained. Copyright uses the current JavaScript year. Narrow-viewport text wraps without widening the page.

## Marina's confirmation needed

Content configuration: frontend/src/pages/About/aboutContent.js.

- Professional start year or confirmed number of years of professional photography experience.
- Verified total of completed projects or photoshoots, and which measure Marina wants to publish.

Both statistic values are null. The local development preview displays XX with a small plus sign in each numeric slot. Production displays an ellipsis instead of XX. Both modes show a translated pending-client-confirmation indication for each unknown value. Labels for years of experience and completed projects are provisional and also require client approval. Do not replace null with guessed values. Biography for all three story cards already exists, so no story placeholders are needed.

## Implementation

- App renders one shared Header, Footer and BackToTop.
- Header uses the approved homepage branding on every route. Passive scroll events schedule one animation-frame update; 14px of directional movement after the first 100px controls hiding. Open menus and keyboard focus keep it visible. Escape closes a menu and restores its trigger's focus.
- BackToTop appears after one viewport or 600px, whichever is larger. It scrolls to the top and returns keyboard focus to the brand link. Reduced motion uses instant scrolling.
- useScrollReveal initializes IntersectionObserver before marking offscreen content pending, reveals each element once, and cleans up. Without observer support or with reduced motion, content remains visible. Only opacity and translation animate, without affecting document flow.
- Portrait frame rotation and photo scaling, plus editorial/card image zoom, apply only to fine pointers supporting hover. Reduced-motion styles disable transitions.
- All new labels, pending-confirmation notes, Footer descriptions and accessible descriptions are translated in English, Portuguese, Spanish and Catalan. Client-approved homepage copy is unchanged. Only the requested punctuation edits alter existing About prose.

## Existing warnings

The frontend build reports an unresolved CSS reference to ../../assets/images/portfolio/events-bts/bts-01.jpg in Packages.css. This predates the About changes.

The locale dictionaries have pre-existing differences in unused legacy About keys. All keys referenced by the redesigned About page and new global controls are present in all four languages.

## Validation results

- Frontend build and lint pass. The existing Packages background-image warning remains.
- All newly introduced UI keys are present in all four locales. Homepage copy is unchanged; the About prose contains no em or en dashes used as sentence punctuation.
- Browser layout checks cover 320, 390, 768, 1024 and 1440px in all four languages; all three story cards and all six photos are present.
- Browser interaction checks confirm Header hide/show, open-menu visibility, keyboard-focus visibility, Escape focus restoration, smooth and reduced-motion BackToTop, portrait hover, one-time reveal completion, and reduced-motion transitions.
- Home, Portfolio, Contact and a portfolio category retain one shared Header and their existing routes. Homepage slideshow controls and approved tagline remain present.

## Files changed

Modified:
- frontend/src/App.jsx
- frontend/src/components/Header/Header.jsx
- frontend/src/components/Header/Header.css
- frontend/src/components/Footer/Footer.css
- frontend/src/pages/About/About.jsx
- frontend/src/pages/About/About.css
- frontend/src/i18n/locales/en.json
- frontend/src/i18n/locales/pt.json
- frontend/src/i18n/locales/es.json
- frontend/src/i18n/locales/ca.json

Created:
- frontend/src/components/BackToTop/BackToTop.jsx
- frontend/src/components/BackToTop/BackToTop.css
- frontend/src/hooks/useScrollReveal.js
- frontend/src/pages/About/aboutContent.js
- docs/ABOUT_REDESIGN.md

## Visual refinement pass

- Retained the two counter slots as large dark serif XX placeholders in local development, with smaller muted plus signs and visible translated pending-confirmation notes. Values and provisional labels live in aboutContent.js.
- Polaroid caption: MARINA RODRIGUES · BARCELONA on the left; decorative 35mm / current JavaScript year on the right. The film reference is marked as decorative in code and hidden from assistive technology; it does not assert camera equipment.
- Medium precedes Base of work in the hero metadata. The base is localized as Barcelona, Spain.
- The three original story cards, images, Header, scroll reveals and hover interactions are preserved.
- Shared Footer redesigned in ivory, using only existing links and a contact route. BackToTop is a centered 46px circle with border-radius: 50%.
- Build and lint pass. One build run also emitted a Vite plugin-timing advisory; it does not prevent the build.

Files edited in this refinement pass:
- frontend/src/pages/About/About.jsx
- frontend/src/pages/About/About.css
- frontend/src/pages/About/aboutContent.js
- frontend/src/components/Footer/Footer.jsx
- frontend/src/components/Footer/Footer.css
- frontend/src/components/BackToTop/BackToTop.css
- frontend/src/i18n/locales/en.json
- frontend/src/i18n/locales/pt.json
- frontend/src/i18n/locales/es.json
- frontend/src/i18n/locales/ca.json
- docs/ABOUT_REDESIGN.md

## Final portrait and carousel implementation

### Portrait

The About hero alone now references assets/images/about/portrait-client.webp, optimized with cwebp at quality 85 from the supplied portrait.jpeg. Original: 1199 × 1600, 304,158 bytes. WebP: 960 × 1282, 63,114 bytes, approximately 79% smaller. Natural proportions are retained. The original portrait.jpeg and portrait.webp remain untouched, and the homepage image reference is unchanged.

### Avatars

The five photos were found under frontend/public/assets/images/reviews/, not frontend/public/images/reviews/. Original JPGs remain untouched. Optimized WebPs are 160px wide with preserved proportions; the UI crops them into consistent circular frames.

- mariana-moraes.jpg → mariana-moraes.webp: 885,028 → 9,764 bytes
- patricia-almeida.jpg → patricia-almeida.webp: 563,871 → 7,024 bytes
- tayna-napier.jpg → tayna-napier.webp: 392,653 → 6,996 bytes
- mariana-ferreira.jpg → mariana-ferreira.webp: 564,087 → 8,756 bytes
- jassly.jpg → jassly.webp: 332,527 → 1,854 bytes

No photo was supplied for Fernanda Barqueta, Natasha Nascimento, Leyla Carranza, Karol Costa or Fernanda Martínez. These use initials in the same circular avatar frame. Image load failures also fall back to initials.

### Data and translations

reviewsData.js stores ten verbatim originals, reviewer names, languages, five-star ratings, verified local avatar paths and the manually editable profile configuration. Automated assertions compare the originals against the supplied request, including line breaks, punctuation and emojis. reviewTranslations.js stores 30 separately authored translations, three per review. Locale dictionaries supply interface labels in all four languages. Original text is shown by default; a toggle appears only when the active language differs. Translations are explicitly labeled and have the appropriate HTML lang attribute. No external translation or reviews API is called.

The supplied Google share link could not be independently read by the web tool. The supplied rating/count are a client-provided snapshot, not an automatically updated integration.

### Interaction

ReviewsCarousel displays one review at a time. Its timeout requests 8000ms and loops through all ten reviews. Hover, keyboard focus, expansion, hidden-document state, reduced motion and the explicit Pause control suspend autoplay. Each resumption starts a fresh interval. Manual navigation resets expansion and translation state. Long text is excerpted for display only, with Read more / Read less. Short text has no unnecessary expansion button. Reserved space keeps collapsed heights consistent.

At mobile widths the three original Facts cards use CSS scroll-snap with a partial adjacent-card preview and contained horizontal scrolling. Desktop remains a three-column grid. The existing reveal observer threshold was lowered from 8% to 1% so the partial card can reveal before swiping fully into view. Portrait rotation and other image hover effects are retained. About CTAs now have color and subtle translation feedback on hover and keyboard focus, with motion disabled for reduced-motion preferences. Hero metadata now shows Base of work followed by Creative disciplines.

### Validation and limits

- Build and lint pass. The pre-existing unresolved Packages background-image warning remains; some runs also emit a Vite plugin-timing advisory.
- Layout checks cover 320, 375, 390, 768 and 1440px in all four locales without horizontal page overflow.
- Manual review navigation, looping, progress indicators, original/translated text, expansion/collapse, navigation resets, five avatar decodes and five initials fallbacks are checked in the browser.
- A fresh browser target confirms that a real eight-second wait advances from Mariana Moraes to Patricia Almeida. Additional lifecycle tests use accelerated browser timeouts while asserting that application code requests 8000ms. Hover, focus, expansion and reduced-motion pauses are checked. Hidden-tab events are simulated because headless Chrome leaves the test tabs visible; visibility-listener behavior is tested, but real tab switching remains a local manual check.
- All new interface keys and all 30 translations are present. Homepage translation strings match the branch baseline.

### Files edited in this final pass

Modified:
- frontend/src/pages/About/About.jsx
- frontend/src/pages/About/About.css
- frontend/src/hooks/useScrollReveal.js
- frontend/src/i18n/locales/en.json
- frontend/src/i18n/locales/pt.json
- frontend/src/i18n/locales/es.json
- frontend/src/i18n/locales/ca.json
- docs/ABOUT_REDESIGN.md

Created:
- frontend/src/components/ReviewsCarousel/ReviewsCarousel.jsx
- frontend/src/components/ReviewsCarousel/ReviewsCarousel.css
- frontend/src/components/ReviewsCarousel/reviewsData.js
- frontend/src/components/ReviewsCarousel/reviewTranslations.js
- frontend/public/assets/images/about/portrait-client.webp
- frontend/public/assets/images/reviews/mariana-moraes.webp
- frontend/public/assets/images/reviews/patricia-almeida.webp
- frontend/public/assets/images/reviews/tayna-napier.webp
- frontend/public/assets/images/reviews/mariana-ferreira.webp
- frontend/public/assets/images/reviews/jassly.webp

Final interaction checks also confirm native portrait hover, About CTA hover and keyboard-focus feedback, removal of CTA movement for reduced motion, keyboard scrolling of the Facts region, 46 × 46px review arrow buttons with 50% radius, and equal 680px collapsed card heights at 320px for all originals and available translations in all four site languages. All five optimized avatar images decode successfully. No commits, pushes, merges or deployments were performed.
