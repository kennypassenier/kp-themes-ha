# kp-themes-ha

The twenty-two [kp-themes](https://github.com/kennypassenier/kp-themes) themes
as Home Assistant themes: `themes/kp-*.yaml`. To install:

1. Make sure `configuration.yaml` loads a themes directory:

    ```yaml
    frontend:
        themes: !include_dir_merge_named themes
    ```

2. Copy the files into that directory, beside the configuration, or unpack a
   release's `ha-themes.tar` there:

    ```sh
    mkdir -p /config/themes && tar -xf ha-themes.tar -C /config/themes
    ```

3. Call the `frontend.reload_themes` action (Developer tools → Actions), then
   pick a theme under your profile. They appear as "Blueprint", "Art Deco",
   "Shade (dark)" and the rest, beside whatever you already have; the `kp-`
   prefix on the file names is there so a file called `dark.yaml` cannot land
   on top of one of yours.

Where [card-mod](https://github.com/thomasloven/lovelace-card-mod) is
installed they also carry the theme's own timing, so a dashboard in terminal
snaps and one in sepia drifts. Without card-mod the two extra keys are ignored
and the colours still work.

Three of Home Assistant's variables are ink rather than plate —
`warning-color`, `success-color`, `info-color` — and which half of the kp-themes
pair that is depends on the theme, so the generator picks whichever is readable
on that theme's card. `gates/ha.test.mjs` asserts all the ink colours clear
3:1 in every theme.

## Where the colours come from

`gates/generate-ha-themes.mjs` reads the tokens of
[kp-themes](https://github.com/kennypassenier/kp-themes) from
`vendor/kp-themes/`: the unpacked `tokens.tar` of the release `vendor/PIN`
names, with its sha256. `npm run check` rebuilds that tar from the copy and
refuses a mismatch, then refuses any generated file that drifted from the
tokens. A colour change in kp-themes reaches this repository only when the pin
moves:

```sh
npm run vendor -- 8.1.0     # download, verify, unpack, rewrite vendor/PIN
npm run generate            # then read the diff and commit
```

The commit hook runs `npm run check`; enable it once per clone with
`git config core.hooksPath .githooks`.

## History

Split out of kp-themes at 8.0.0 (2026-09-29) with its history: `git log` shows
the kp-themes commits that touched these files, with their original messages
and IDs.
