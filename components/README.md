# Component layers

Imports go one way: `atoms ← molecules ← organisms ← features ← app`. Biome enforces the atom and molecule limits
(`biome.json`). Only build what a page actually renders.

- **atoms/** - smallest single-purpose pieces: a styled `<input>`, a button, a heading, a label. No composition of
  other components. Third-party UI libraries are wrapped here and used nowhere else.
- **molecules/** - a small group of atoms working together as one unit (a brand mark).
- **organisms/** - a distinct, reusable section of a page, composed from atoms and molecules (a header, a footer).

Anything tied to one area of the business lives in `features/<name>/`, not here. There is no templates layer: page
structure belongs in `layout.tsx` or the feature's top component.
