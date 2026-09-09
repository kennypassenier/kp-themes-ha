// Home Assistant themes, from the same token sources [HA1].
//
// A Home Assistant theme is a YAML file with a fixed vocabulary of
// variable names. Measured against ours on 2026-09-04: all eighteen that
// matter already have a token here, including the sidebar, so the mapping
// is nearly one to one and needs no new colours.
//
// The point is the same as everywhere else in this package — a dashboard
// and a web page that disagree about what "primary" means are two
// products. Generated rather than written by hand, and `--check` fails
// when they drift, exactly like css/themes.css.
//
// Motion rides along where card-mod is installed: the theme's own
// --fx-duration and --fx-ease become a transition on ha-card, so a
// dashboard in terminal snaps and one in sepia drifts, the same way the
// web components do.
//
// Usage:
//   node gates/generate-ha-themes.mjs           write ha/*.yaml
//   node gates/generate-ha-themes.mjs --check   exit 1 if any would change

import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import process from 'node:process';
import { themes } from './check-invariants.mjs';
import { THEMES as REGISTRY } from '../js/theme-registry.js';
import { contrast, hsl, parseHsl } from './colour.mjs';

const OUT = new URL('../ha/', import.meta.url);

/**
 * Home Assistant's variable name on the left, ours on the right.
 *
 * Only names Home Assistant actually reads. Inventing entries here would
 * produce YAML that looks thorough and changes nothing.
 */
const MAP = {
    'primary-color': 'primary',
    // Home Assistant uses these four as ink — an icon, a slider, a
    // label — not as a plate behind text. Kenny's own Neon Grid theme
    // sets them to saturated colours (#ff00ff, #ffaa00). Ours are pale
    // tints in the light themes, so mapping the plate here would have
    // produced an almost-white warning icon. The saturated half of each
    // pair is what belongs.
    'accent-color': 'fx-signal',
    'primary-background-color': 'background',
    'secondary-background-color': 'muted',
    'card-background-color': 'card',
    'primary-text-color': 'foreground',
    'secondary-text-color': 'muted-foreground',
    'disabled-text-color': 'border-strong',
    'divider-color': 'border',
    'error-color': 'destructive',
    // These three are a pair each, and which half is the ink depends on
    // the theme: pale plate with dark ink in six of them, saturated plate
    // with white ink in high-contrast. Taking the foreground blindly put
    // white on a white card there, at 1.0. `readable()` picks the half
    // that can actually be seen.
    'warning-color': ['warning', 'warning-foreground'],
    'success-color': ['success', 'success-foreground'],
    'info-color': ['info', 'info-foreground'],
    'state-icon-color': 'muted-foreground',
    'state-icon-active-color': 'primary',
    'switch-checked-color': 'primary',
    'sidebar-background-color': 'sidebar-background',
    'sidebar-text-color': 'sidebar-foreground',
    'sidebar-icon-color': 'sidebar-foreground',
    'sidebar-selected-icon-color': 'sidebar-primary',
    'sidebar-selected-text-color': 'sidebar-primary',
    'app-header-background-color': 'card',
    'app-header-text-color': 'card-foreground',
    'table-row-background-color': 'card',
    'table-row-alternative-background-color': 'muted',
    'ha-card-border-color': 'border',
};

/**
 * The expression half, for the two themes that have one [feat-ha-1].
 *
 * A Home Assistant theme carries colour. A kp-themes register carries
 * everything else, and none of it lands on a dashboard, because a
 * dashboard has no `.kp-*` class to hang it on. card-mod closes that gap
 * by injecting CSS into the view and into every card, so a theme with a
 * face can wear it.
 *
 * Two themes have one. They were written by hand onto Kenny's own
 * instance on 2026-09-09 and he approved them on 2026-09-10 after
 * looking at them there, which is the only verification available: no
 * screenshot engine is installed, so nothing here can render a dashboard
 * and check itself.
 *
 * The other twenty-three carry colour and timing only, and that
 * asymmetry is a decision rather than an unfinished list: a register is
 * a design choice per theme, and two of those choices have been made.
 *
 * Every colour and every face below comes from the same tokens as the
 * rest of the file. The hand-written originals spelled the values out;
 * here nothing is typed twice, so a token that moves moves with it.
 */
/** @type {Record<string, (t: Record<string, string>, alpha: (value: string, a: number) => string) => { root: string[]; card: string[] }>} */
const REGISTERS = {
    cyberpunk: (t, alpha) => ({
        root: [
            "/* The void behind everything, with the register's scanlines over it.",
            '   DI9 says a texture is felt and not seen: 0.06 is the ceiling and',
            '   this sits on it. */',
            'hui-view, hui-sections-view, hui-masonry-view {',
            '  position: relative;',
            '}',
            'hui-view::before, hui-sections-view::before, hui-masonry-view::before {',
            '  content: "";',
            '  position: fixed;',
            '  inset: 0;',
            '  pointer-events: none;',
            '  z-index: 0;',
            '  background: repeating-linear-gradient(',
            '    to bottom,',
            `    ${alpha(t.primary, 0.06)} 0 1px,`,
            '    transparent 1px 3px',
            '  );',
            '}',
        ],
        card: [
            '/* The notched corner and the tick: the two moves that make a surface',
            '   read as cut metal rather than as a rounded box. */',
            'ha-card {',
            '  position: relative;',
            `  border-radius: ${t.radius} !important;`,
            `  border: 1px solid ${t.border} !important;`,
            '  clip-path: polygon(',
            '    0 0,',
            '    calc(100% - 14px) 0,',
            '    100% 14px,',
            '    100% 100%,',
            '    14px 100%,',
            '    0 calc(100% - 14px)',
            '  );',
            '}',
            '/* The signal-yellow tick along the top edge: the accent as a mark,',
            '   not as a border. */',
            'ha-card::after {',
            '  content: "";',
            '  position: absolute;',
            '  top: 0;',
            '  left: 0;',
            '  width: 32px;',
            '  height: 2px;',
            `  background: ${t.primary};`,
            '  pointer-events: none;',
            '}',
            '.card-header {',
            `  font-family: ${t['theme-font-body']};`,
            '  text-transform: uppercase;',
            '  letter-spacing: 0.08em;',
            `  color: ${t.primary};`,
            '}',
        ],
    }),
    synthwave: (t, alpha) => ({
        root: [
            '/* The horizon: the night sky above, the floor below, and the glow of',
            '   the sun where they meet. Fixed, so it stays put while the dashboard',
            '   scrolls over it — the way the register treats the hero. */',
            'hui-view, hui-sections-view, hui-masonry-view {',
            '  position: relative;',
            '}',
            'hui-view::before, hui-sections-view::before, hui-masonry-view::before {',
            '  content: "";',
            '  position: fixed;',
            '  inset: 0;',
            '  pointer-events: none;',
            '  z-index: 0;',
            '  background:',
            '    radial-gradient(',
            '      60% 40% at 50% 62%,',
            `      ${alpha(t.primary, 0.22)} 0%,`,
            '      transparent 70%',
            '    ),',
            '    linear-gradient(',
            '      to bottom,',
            `      ${t.background} 0%,`,
            `      ${t.background} 58%,`,
            `      ${alpha(t.border, 0.55)} 62%,`,
            `      ${t.background} 100%`,
            '    );',
            '}',
            '/* The floor under the horizon: lines running to a vanishing point. */',
            'hui-view::after, hui-sections-view::after, hui-masonry-view::after {',
            '  content: "";',
            '  position: fixed;',
            '  inset: 62% 0 0 0;',
            '  pointer-events: none;',
            '  z-index: 0;',
            '  background: repeating-linear-gradient(',
            '    to right,',
            `    ${alpha(t.accent, 0.14)} 0 1px,`,
            '    transparent 1px 64px',
            '  );',
            '}',
        ],
        card: [
            '/* A card is a lit panel: a thin neon edge with a glow under it,',
            '   rather than a border. */',
            'ha-card {',
            '  position: relative;',
            `  border: 1px solid ${t.border} !important;`,
            '  box-shadow:',
            `    0 0 0 1px ${alpha(t.primary, 0.18)},`,
            `    0 8px 28px ${alpha(t.background, 0.75)};`,
            '}',
            '.card-header {',
            `  font-family: ${t['theme-font-display']};`,
            '  letter-spacing: 0.06em;',
            `  color: ${t.foreground};`,
            '  text-shadow:',
            `    0 0 6px ${alpha(t.primary, 0.55)},`,
            `    0 0 18px ${alpha(t.primary, 0.25)};`,
            '}',
        ],
    }),
};

/**
 * The same colour, carrying an alpha.
 *
 * The tokens are comma-form `hsl(h, s%, l%)`, which has nowhere to put
 * one, so the value is taken apart and written back in the space form.
 *
 * @param {string} value
 * @param {number} a
 */
function alpha(value, a) {
    const { h, s, l } = parseHsl(value);
    return `hsl(${h} ${s}% ${l}% / ${a})`;
}

/** @param {import('./check-invariants.mjs').Theme} theme */
function yaml(theme) {
    const t = theme.tokens;
    // The human name comes from the generated registry, which is where
    // labels live; check-invariants only carries the colours.
    const label = REGISTRY.find((r) => r.name === theme.name)?.label;
    if (label === undefined) throw new Error(`no label for theme ${theme.name}; is it in themes/order.json?`);
    /**
     * Of a plate-and-ink pair, the half that reads on this theme's card.
     * @param {string[]} pair
     */
    const readable = (pair) => {
        const card = hsl(t.card);
        return pair.map((k) => ({ k, c: contrast(hsl(t[k]), card) })).sort((a, b) => b.c - a.c)[0].k;
    };

    const lines = Object.entries(MAP).map(([ha, ours]) => {
        const token = Array.isArray(ours) ? readable(ours) : ours;
        return `      ${ha}: "${t[token]}"`;
    });

    // card-mod is optional. Where it is not installed Home Assistant
    // ignores these two keys, so the theme still works — it simply does
    // not move. That is why the motion goes here rather than into a
    // separate file a user has to remember to install.
    const cardMod = [
        `  card-mod-theme: "${label}"`,
        '  card-mod-root: |',
        '    @media (prefers-reduced-motion: no-preference) {',
        '      ha-card {',
        `        transition: background-color ${t['fx-duration']} ${t['fx-ease']}, border-color ${t['fx-duration']} ${t['fx-ease']};`,
        '      }',
        '    }',
    ];

    // The two themes that carry expression as well as colour [feat-ha-1].
    const register = REGISTERS[theme.name]?.(t, alpha);
    if (register) {
        cardMod.push(...register.root.map((line) => `    ${line}`));
        cardMod.push('  card-mod-card: |');
        cardMod.push(...register.card.map((line) => `    ${line}`));
    }

    return [
        `# Generated by gates/generate-ha-themes.mjs from themes/${theme.name}/tokens.json.`,
        '# Do not edit: `npm run gates` fails when this file and the token',
        "# source disagree. Drop it in Home Assistant's themes/ directory.",
        `${label}:`,
        ...cardMod,
        '  modes:',
        `    ${t['color-scheme'] === 'dark' ? 'dark' : 'light'}:`,
        ...lines,
        `      ha-card-border-radius: "${t.radius}"`,
        '      ha-card-border-width: "1px"',
        '',
    ].join('\n');
}

// The `kp-` prefix is not decoration: these land in the same directory as
// a user's own themes, and a file called `dark.yaml` beside theirs is an
// invitation to overwrite the wrong one. The name in the repository is
// the name on the instance, so nothing is renamed in between.
const files = themes().map(
    /** @param {import('./check-invariants.mjs').Theme} theme */ (theme) => ({
        name: `kp-${theme.name}.yaml`,
        content: yaml(theme),
    }),
);

if (process.argv.includes('--check')) {
    let stale = 0;
    let present;
    try {
        present = readdirSync(OUT);
    } catch {
        console.error('gate broke: ha/ is missing. Run `npm run generate:ha`.');
        process.exit(1);
    }
    for (const file of files) {
        let current = '';
        try {
            current = readFileSync(new URL(file.name, OUT), 'utf8');
        } catch {
            current = '';
        }
        if (current !== file.content) {
            stale++;
            console.error(`ha/${file.name} does not match its source.`);
        }
    }
    // A theme file left behind by a theme that no longer exists would go
    // on being loaded by Home Assistant, which is worse than a stale one.
    const expected = new Set(files.map(/** @param {{name: string}} f */ (f) => f.name));
    for (const file of present) {
        if (!expected.has(file)) {
            stale++;
            console.error(`ha/${file} belongs to no theme.`);
        }
    }
    if (stale > 0) {
        console.error('Run `npm run generate:ha` and commit the result.');
        process.exit(1);
    }
    console.log(`Home Assistant: ${files.length} themes match their source.`);
    process.exit(0);
}

mkdirSync(OUT, { recursive: true });
for (const file of readdirSync(OUT)) rmSync(new URL(file, OUT));
for (const file of files) writeFileSync(new URL(file.name, OUT), file.content);
console.log(`wrote ${files.length} Home Assistant themes to ha/.`);
