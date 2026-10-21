# Credits and licences

This file lists every third-party asset in the template and where it comes from.

## Pictures

The download ships **generated placeholder pictures** (`public/images/**` .jpg and .png). They are made by `scripts/images.mjs` from the sizes in `assets/placeholders.json`: flat neutral blocks with the size printed. They carry no copyright. Replace them with your own photos using the same file names and sizes (see the documentation).

The live preview uses licensed photos (`npm run images:real`, build flag `NEXT_PUBLIC_DEMO_IMAGES=real`). They are not part of the download. Each one is listed below.

| File | Photo | Author | Licence | Link | Used on |
|---|---|---|---|---|---|
| _none yet (preview photos are chosen in TF5-T04)_ | | | | | |

## Icons and marks

- UI icons, benefit icons, arrows, dividers and the logo mark (`public/images/**.svg`): drawn for this template's design.
- Payment marks (Visa, Mastercard, American Express, Discover, PayPal, Bitcoin): used unmodified as indicators of accepted methods. The marks belong to their owners.
- Social marks: the shapes follow each service's public brand guidelines and are used only to link to the service.

## Fonts

All three are open fonts under the SIL Open Font License 1.1, installed from npm (`@fontsource`). Licence texts are in `licenses/`.

| Font | Use | Licence text |
|---|---|---|
| Instrument Sans | Interface text | `licenses/FONT-Instrument-Sans-OFL.txt` |
| Prata | Display headings | `licenses/FONT-Prata-OFL.txt` |
| Allura | Script accents | `licenses/FONT-Allura-OFL.txt` |

## Code

`licenses/THIRD-PARTY.txt` lists every package that ships in the production build with its licence (regenerate with `npm run licenses`). No package under a GPL or AGPL licence is used. The `@img/sharp-libvips-*` packages are LGPL-3.0 binaries that Next.js can use to resize images; they are installed by npm, not copied into this template.
