# Component layers

Atomic design, as a convention for organizing new UI as it's added — not a
mandate to pre-build every layer. Only implement what a page actually renders.

- **atoms/** — smallest single-purpose pieces: a styled `<input>`, a button,
  a heading, a label. No composition of other components.
- **molecules/** — a small group of atoms working together as one unit (a
  brand mark, a form with its field + button + status message).
- **organisms/** — a distinct section of a page, composed from atoms and
  molecules (a header, a hero, a footer).
- **templates/** — the layout that arranges organisms into a full page. No
  page-specific copy or business logic lives here — that belongs in the
  `app/` route that renders the template.

Don't add empty folders or placeholder components for layers a page doesn't
need yet. When a new page needs a new atom/molecule/organism, add it then.
