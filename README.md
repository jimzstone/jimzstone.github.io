# Jimuel Lopez — Personal Portfolio

A responsive professional portfolio for Jimuel Baldelovar Lopez, Safety Officer II and beginner web and app developer. HTML content with a Vite production build, React, TypeScript, Tailwind utilities, and Framer Motion. Includes lime-to-army-green gradient styling, button shine and press effects, project card hover effects, keyboard-accessible expandable details, and a responsive mobile navigation menu. Honors reduced-motion preferences.

## Preview

Open `index.html` in a browser. A professional system font stack renders without external font downloads. For a local server, run `python -m http.server 4173 --bind 127.0.0.1` from this directory, then visit http://127.0.0.1:4173/.

## Content

- Professional profile and beginner developer journey
- All 11 roles from the supplied résumé, with earlier experience expandable
- Safety training, education (IT college undergraduate), languages, and professional strengths
- Safety On The Go: Android editions and offline safety workflows
- Ping Monitor: Windows ICMP utility
- TechLock / Smart Lock Tracker: operations prototype
- Project detail panels, technology toolkit, and contact section
- Tools I Use: 13 cards covering development, office, design, and technical support
- Original 900 × 900 résumé portrait, displayed without rotation or enlargement

Professional details were transcribed and summarized from Jimuel_Lopez_Professional_Resume_Revision_6.pdf. Project descriptions were derived from local project documentation. Decorative interface illustrations are not screenshots or live measurements. GitHub account: jimzstone. Portfolio repository: jimzstone/jimzstone.github.io. Contact information uses the résumé's email, phone numbers, Facebook, and Telegram. References' contact details, birth date, civil status, religion, and physical characteristics are not included in the public portfolio. The original résumé is not bundled as a public download.

## Personalize

Edit `index.html` to update your content and add your GitHub repository URLs, demo links, and specific contributions to each project. Edit `professional.css` for the current design; `styles.css` supplies the base layout. `script.js` controls the mobile menu and active section navigation. Keep private records, passwords, API keys, and client data out of the portfolio repository.

## Put it on GitHub Pages

1. Create a public repository named `jimzstone.github.io` in the `jimzstone` account and initialize it with a README so the `main` branch exists.
2. Upload the website files, the entire `assets` folder, and `.github/workflows/pages.yml` to the repository root. Preserve the folder structure. Do not upload review screenshots or private documents.
3. In the repository's **Settings → Pages**, select **GitHub Actions** as the source.
4. Run **Actions → Publish portfolio → Run workflow**, or push a change to `main`. The included workflow publishes only the website and its assets.
5. After a successful deployment, the portfolio will be available at `https://jimzstone.github.io/`.

All local asset links are relative, so either repository layout works. Published at https://jimzstone.github.io/.

## Review

Reviewed all seven content sections at 320, 390, 700, 768, 1024, 1280, and 1440 pixel widths. Checked images, local anchors, all expandable details, mobile menu dismissal, browser errors, and reduced-motion behavior. External contact destinations are linked but no messages or calls were sent. The ZIP contains the complete website and original portrait; review screenshots and helper scripts are excluded.

## Development

Install dependencies with npm ci. Run npm run dev for the local website, npm run lint for code checks, npm run format:check for formatting, and npm run build for production output in dist. The GitHub workflow builds and deploys dist. See REVIEW.md and effects.json for the interaction system.
