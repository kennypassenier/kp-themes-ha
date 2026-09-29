// Moved from kp-themes' gates/gates.test.mjs at the split (HA1).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { themes } from '../vendor/kp-themes/gates/check-invariants.mjs';
import { contrast, hsl } from '../vendor/kp-themes/gates/colour.mjs';

test('HA1: every colour a Home Assistant theme uses as ink is readable on its card', () => {
    // The mapping is not one-to-one and cannot be. Home Assistant uses
    // warning/success/info as ink; ours are plate-and-ink pairs, and
    // which half is the ink depends on the theme — pale plate with dark
    // ink in six, saturated plate with white ink in high-contrast.
    // Taking the foreground blindly put white on a white card there, at
    // 1.0, which is what this test exists to keep from coming back.
    for (const theme of themes()) {
        const yaml = readFileSync(new URL(`../themes/kp-${theme.name}.yaml`, import.meta.url), 'utf8');
        const card = hsl(theme.tokens.card);
        for (const key of ['accent-color', 'error-color', 'warning-color', 'success-color', 'info-color']) {
            const value = yaml.match(new RegExp(`${key}: "([^"]+)"`))?.[1];
            assert.ok(value, `${theme.name}: ${key} missing from the generated theme`);
            const ratio = contrast(hsl(value), card);
            assert.ok(ratio >= 3, `${theme.name}: ${key} is ${ratio.toFixed(2)} on the card, under 3`);
        }
    }
});
