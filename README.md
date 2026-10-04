# Jimuel Lopez — Personal Portfolio

Live portfolio: https://jimzstone.github.io/

A responsive HTML portfolio with a Vite production build, a React/TypeScript project filter, Tailwind utilities, Framer Motion, locally hosted GSAP/ScrollTrigger and Anime.js. Content covers the professional profile, hiring rationale, experience, projects, skills, tools, safety training and contact details.

## Development

Run `npm ci`, then `npm run dev` for the local site. Run `npm run lint` for code checks and `npm run build` for the production output in `dist`. Use `npm run preview` to inspect that build. Opening the HTML directly or using a plain static server against source does not compile the React island.

GitHub Actions builds and publishes `dist` after changes to `main`. Vite copies local vendor scripts, assets and effects.json through the static-assets build plugin.

## Interactions

- Navigation scrolls to sections and can be interrupted by wheel, touch or navigation keys.
- Text fades in and out in both scroll directions; timing responds to smoothed scrolling speed.
- `effects.json` contains bounded scroll timing, filter timing and pointer settings. Invalid scroll settings retain safe defaults.
- Native details use one reversible animation controller, supporting rapid repeated clicks without competing scroll animations.
- Code previews open and close explicitly with accessible controls and measured content heights.
- Project platforms are identified by `data-platform`, independent of document order. Filter animations are cancelled when selection changes.
- Reduced-motion mode removes positional scroll movement; user-requested opacity fades remain. The CV download retains its three-second countdown.

## Content and privacy

Professional information is based on the supplied résumé and project documentation. Project interface illustrations are illustrative, not live measurements. The authorized CV download is `assets/Jimuel_Lopez.pdf`. The portrait uses the approved gradient version. Public contact buttons include Discord, LinkedIn, DeviantArt, Facebook, Telegram and email. No credentials or reference contact information should be added to the repository.

## Verification limits

Responsive checks use the in-app browser at phone, tablet and desktop widths. Actual iOS/Android scrolling and app-specific external links require device verification. Vendored third-party library internals are not maintained as portfolio source.

