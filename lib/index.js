/**
 * dsh-mobile-sidebar — Host half.
 *
 * Deliberately empty. Everything this plugin does is browser-side: its client
 * module styles the shell frame's grid tracks and contributes two slot entries
 * (the header button and the drawer scrim).
 *
 * The Host row exists only because `cordis.patch.yml` inserts this package by
 * name, and a DSH bundle row must name a Host module to load.
 */

/** No Cordis services are required — the client half declares its own. */
const inject = [];

/** No Host-side behaviour to set up or tear down. */
function apply() {
	// Intentionally empty.
}

export { apply, inject };
