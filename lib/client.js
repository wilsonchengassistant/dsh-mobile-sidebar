/**
 * dsh-mobile-sidebar — browser half.
 *
 * WHAT THE SHELL DOES ON ITS OWN
 * ------------------------------
 * `@deepseek-ai/dsh-client-ui-layout` owns the three-column frame. Below its
 * `SIDEBAR_AUTO_COLLAPSE` (1024px) breakpoint the sidebar reports itself
 * collapsed, and `computeColumns()` resolves the collapsed track to
 * `collapsedWidth` — which is 56px on the web, because only macOS desktop and
 * the Windows titlebar shell pass 0 (a full hide). So a phone still loses a
 * 56px icon rail: 14% of a 390px viewport, permanently, for a column nobody
 * can read anything in.
 *
 * WHAT THIS PLUGIN CHANGES
 * -----------------------
 * Under 1024px it does three things, all reversible by removing the bundle:
 *
 *  1. The frame's first grid track becomes `0px`, so the collapsed rail costs
 *     nothing. The track value is *derived* from whatever React just wrote,
 *     with only the first track replaced (see `syncFrame`), because the centre
 *     and right tracks still matter between 800px and 1024px.
 *  2. The collapsed sidebar column is `display: none`, so none of it paints.
 *  3. An expanded sidebar becomes a floating drawer over the conversation
 *     (absolutely positioned, 78vw capped at 300px) behind a scrim that closes
 *     it on tap — because squeezing a 280px track out of a 390px viewport would
 *     leave the conversation 110px wide.
 *
 * The toggle button lives in `conversation.header.leading` and is hidden above
 * the breakpoint, so the desktop layout is untouched.
 *
 * WHY THE ELEMENTS ARE FOUND BY ATTRIBUTE, NOT BY CLASS NAME
 * ---------------------------------------------------------
 * The shell's CSS-module class names (`pI_x6G_frame`, `wSkVaW_header`) are
 * build-hashed and change between DSH releases. `[data-shell-overlay]` and
 * `[data-slot="sidebar"]` are written by the source, so they survive an
 * upgrade. The frame is the overlay layer's parent and the sidebar column is
 * the sidebar slot's parent; each is tagged with a stable data attribute that
 * the stylesheet above targets.
 */
window.__ModuleLoader__.load({
	id: "dsh-mobile-sidebar",
	factory(require) {
		// The loader hands the factory a bare `require` and expects a CommonJS
		// shape back: declare the wrapper here and return `module.exports`.
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		const { Button, Tooltip, IconPanelLeftOutlineRegular } = require("@deepseek-ai/dsh-client-ui-primitives");
		// The `react` seed module carries the hooks but no `createElement`; every
		// other client bundle builds elements through the JSX runtime instead.
		const h = require("react/jsx-runtime").jsx;

		/** Locale namespace for this plugin's two strings. */
		const NS = "mobile-sidebar";
		/** Upper bound of the narrow range; `ui-layout` collapses below 1024. */
		const NARROW_MAX = 1023;
		/** Custom property carrying the rewritten `grid-template-columns`. */
		const COLS_VAR = "--dsh-mobile-frame-cols";
		/** Frame attribute: set on the shell's three-column grid. */
		const FRAME_ATTR = "data-dsh-mobile-frame";
		/** Sidebar column attribute: set on the frame's first grid child. */
		const SIDEBAR_ATTR = "data-dsh-mobile-sidebar";
		/** Scrim attribute: set on our own overlay-layer button. */
		const SCRIM_ATTR = "data-dsh-mobile-scrim";
		/** Button attribute: set on our own header button. */
		const BUTTON_ATTR = "data-dsh-mobile-sidebar-button";
		/** Floating-control attribute: the panel fallback for the header button. */
		const FAB_ATTR = "data-dsh-mobile-fab";
		/** Fallback track value if the inline one has not been read yet. */
		const DEFAULT_COLS = "0px minmax(0px, 1fr) minmax(0px, 0px)";
		/** Style tag identity, matching how the shell tags its own CSS. */
		const STYLE_ID = "dsh-mobile-sidebar";

		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = { "sidebar.open": "打开侧边栏", "sidebar.close": "收起侧边栏" };
		/** English dictionary for the same keys. */
		const en = { "sidebar.open": "Open sidebar", "sidebar.close": "Close sidebar" };

		const css = [
			/*
			 * BASE STATE — everything this plugin owns is off at every width.
			 *
			 * `shell.overlay` is always mounted and `conversation.header.leading`
			 * is root-scoped, so all three controls exist in the DOM on desktop
			 * too. Their `display:none` resets therefore have to live OUTSIDE
			 * the narrow media query. A reset scoped to `max-width` only hides
			 * below the breakpoint: above it the bare `<button>` falls back to
			 * the UA's `buttonface` background and collapses to a ~16x6 grey chip
			 * in the frame's top-left corner — which is exactly the artefact this
			 * comment exists to prevent. Each narrow rule below then re-enables
			 * one control, and each is prefixed with the frame selector so it
			 * outranks these resets on specificity rather than on source order.
			 */
			`[${SCRIM_ATTR}],[${FAB_ATTR}],[${BUTTON_ATTR}]{display:none}`,
			`@media (max-width:${NARROW_MAX}px){`,
			/* Only the FIRST track is zeroed; the centre and right tracks are
			   whatever ui-layout solved, republished through --${COLS_VAR}. */
			`[${FRAME_ATTR}]{grid-template-columns:var(${COLS_VAR},${DEFAULT_COLS})!important}`,
			/* Closed: nothing paints and nothing takes a tap, but the column stays
			   a grid item. `display:none` would be the obvious way to hide it and
			   it is a trap: a display:none box is not a grid item, so auto-
			   placement moves the centre column into the (now zero) first track
			   and the whole conversation collapses to 0px wide. */
			`[${FRAME_ATTR}][data-sidebar-collapsed]>[${SIDEBAR_ATTR}]{visibility:hidden;pointer-events:none}`,
			/* Open: the track stays 0px and the column simply overflows it, so the
			   drawer floats over a centre column that never changed width. Taking
			   it out of flow (position:absolute) would reintroduce the same
			   auto-placement shift. */
			`[${FRAME_ATTR}]:not([data-sidebar-collapsed])>[${SIDEBAR_ATTR}]{position:relative;z-index:30;width:min(78vw,300px);border-right:.5px solid var(--dsw-alias-border-l3);box-shadow:0 8px 32px rgb(0 0 0/.25);animation:dshMobileSidebarIn .18s var(--ds-ease-in-out)}`,
			/* The sidebar root carries its own inline width; the drawer sets it. */
			`[${FRAME_ATTR}]:not([data-sidebar-collapsed])>[${SIDEBAR_ATTR}]>[data-slot]>*{width:100%!important}`,
			/* Tap anywhere outside the drawer to close it. This is the only rule
			   in the stylesheet that ever shows the scrim. */
			`[${FRAME_ATTR}]:not([data-sidebar-collapsed]) [${SCRIM_ATTR}]{display:block;position:absolute;z-index:25;inset:0;margin:0;padding:0;border:0;background:rgb(0 0 0/.34);cursor:pointer;-webkit-tap-highlight-color:transparent}`,
			/* Dragging a drawer's edge to resize it makes no sense on a phone. */
			`[data-side=sidebar]{display:none!important}`,
			/* The in-header toggle, only on the Conversation. */
			`[${FRAME_ATTR}] [${BUTTON_ATTR}]{display:inline-flex;margin-right:10px}`,
			/*
			 * Global panels build their own header and expose no header slot, so
			 * the toggle falls back to a fixed control over the panel. It steps
			 * aside wherever the real header button is rendered — that is the
			 * `:has()` guard below, and it is what keeps the two from doubling.
			 *
			 * `display` is deliberately absent: it is the one property the
			 * stylesheet has to own, and an inline value would outrank it. The
			 * rest is inline so no button-variant rule can repaint it.
			 */
			`[${FRAME_ATTR}]:not(:has([${BUTTON_ATTR}])) [${FAB_ATTR}]{display:inline-flex}`,
			/* Every panel heading starts 28px down and 24px in, so the floating
			   control would sit on its shoulder; give it a lane of its own. */
			`[${FRAME_ATTR}]:has([${FAB_ATTR}]:not([hidden])) :is([data-plugin-panel]>header,[class*=pageHead],[class*=pageHeading]){padding-inline-start:40px}`,
			`@keyframes dshMobileSidebarIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}`,
			`}`,
			`@media (prefers-reduced-motion:reduce){[${FRAME_ATTR}]:not([data-sidebar-collapsed])>[${SIDEBAR_ATTR}]{animation:none}}`,
		].join("");

		/** Insert the stylesheet once, tagged the way the shell tags its own. */
		function installCss() {
			if (document.querySelector(`style[data-plugin-css="${STYLE_ID}"]`) !== null) return;
			const tag = document.createElement("style");
			tag.dataset.plugin = STYLE_ID;
			tag.dataset.pluginCss = STYLE_ID;
			tag.textContent = css;
			document.head.appendChild(tag);
		}

		/**
		 * Index of the first space sitting at grid-track depth zero.
		 * @param value - a `grid-template-columns` value.
		 * @returns the separator index, or -1 when there is only one track.
		 */
		function firstTrackEnd(value) {
			let depth = 0;
			for (let i = 0; i < value.length; i++) {
				const ch = value[i];
				if (ch === "(") depth++;
				else if (ch === ")") depth--;
				else if (ch === " " && depth === 0) return i;
			}
			return -1;
		}

		/**
		 * Republish the frame's solved tracks with the sidebar track zeroed.
		 *
		 * React writes `grid-template-columns` as an inline style, so a media
		 * query cannot override a single track of it. Rewriting the whole value
		 * is safe because only the first track changes; between 800px and 1024px
		 * the right panel still solves a real third track that must survive.
		 * @param frame - the shell frame element.
		 */
		function syncFrame(frame) {
			const solved = frame.style.gridTemplateColumns;
			if (solved === "") return;
			const end = firstTrackEnd(solved);
			const next = end < 0 ? DEFAULT_COLS : `0px ${solved.slice(end).trim()}`.trim();
			// Guarded so writing the property cannot re-trigger our own observer.
			if (frame.style.getPropertyValue(COLS_VAR) === next) return;
			frame.style.setProperty(COLS_VAR, next);
		}

		/**
		 * Locate and mark the frame and its sidebar column.
		 * @returns true once both elements are found.
		 */
		function markFrame() {
			const frame = document.querySelector("[data-shell-overlay]")?.parentElement;
			const sidebarCol = document.querySelector('[data-slot="sidebar"]')?.parentElement;
			if (frame == null || sidebarCol == null || !frame.contains(sidebarCol)) return false;
			frame.setAttribute(FRAME_ATTR, "");
			sidebarCol.setAttribute(SIDEBAR_ATTR, "");
			syncFrame(frame);
			return true;
		}

		/**
		 * Watch the frame's inline style and republish the rewritten tracks.
		 * @param frame - the marked frame element.
		 * @returns a disposer.
		 */
		function watchFrameStyle(frame) {
			const observer = new MutationObserver((records) => {
				for (const record of records) syncFrame(record.target);
			});
			observer.observe(frame, { attributes: true, attributeFilter: ["style"] });
			return () => observer.disconnect();
		}

		/**
		 * Mark the shell as soon as it exists, then keep its tracks in step.
		 *
		 * The client module can be evaluated before the shell has mounted, so
		 * the first pass falls back to watching document mutations and hands
		 * over to a narrow style observer once the frame appears.
		 * @returns a disposer.
		 */
		function bindFrame() {
			if (markFrame()) {
				return watchFrameStyle(document.querySelector(`[${FRAME_ATTR}]`));
			}
			const observer = new MutationObserver(() => {
				if (!markFrame()) return;
				observer.disconnect();
				watchFrameStyle(document.querySelector(`[${FRAME_ATTR}]`));
			});
			observer.observe(document.documentElement, { childList: true, subtree: true });
			return () => observer.disconnect();
		}

		/** Client plugin body. */
		function apply(ctx) {
			installCss();
			const t = ctx.locale.bind(NS);
			ctx.effect(() => ctx.locale.register(NS, { zh, en }), "mobile-sidebar: locale");
			ctx.effect(() => bindFrame(), "mobile-sidebar: frame binding");

			/**
			 * Header button: opens or closes the sidebar.
			 *
			 * Children go in the props object rather than as extra arguments:
			 * this React's `jsx()` reads its third parameter as the key, so a
			 * variadic child would be swallowed. `Tooltip` reads `children.ref`
			 * directly, which turns that mistake into a crash.
			 */
			function SidebarButton() {
				return h(Tooltip, {
					label: t("sidebar.open"),
					delayMs: 500,
					side: "bottom",
					children: h(Button, {
						variant: "ghost",
						size: "sm",
						"aria-label": t("sidebar.open"),
						[BUTTON_ATTR]: "",
						onClick: () => ctx.layout.toggleSidebar(),
						children: h(IconPanelLeftOutlineRegular, { size: 16 }),
					}),
				});
			}

			/** Scrim: a full-frame tap target that closes the open drawer. */
			function DrawerScrim() {
				return h("button", {
					type: "button",
					tabIndex: -1,
					"aria-hidden": "true",
					[SCRIM_ATTR]: "",
					onClick: () => ctx.layout.toggleSidebar(),
				});
			}

			/**
			 * Panel fallback for the header button.
			 *
			 * Global panels (Plugins, Schedules, and anything a third-party
			 * bundle adds) register into the `main` slot and each builds its own
			 * heading — none of them declares a header slot, so there is nothing
			 * to inject into. Rendering the toggle in `shell.overlay` covers all
			 * of them at once, including panels that do not exist yet; the
			 * stylesheet hides it whenever the Conversation's real header button
			 * is mounted, so the two never appear together.
			 */
			function PanelSidebarButton() {
				return h("div", {
					[FAB_ATTR]: "",
					style: {
						position: "absolute",
						zIndex: "22",
						top: "6px",
						left: "6px",
						alignItems: "center",
						justifyContent: "center",
						borderRadius: "12px",
						background: "var(--dsw-alias-bg-base)",
						boxShadow: "0 1px 4px rgb(0 0 0 / .1)",
						WebkitAppRegion: "no-drag",
					},
					children: h(Button, {
						variant: "ghost",
						size: "sm",
						"aria-label": t("sidebar.open"),
						onClick: () => ctx.layout.toggleSidebar(),
						children: h(IconPanelLeftOutlineRegular, { size: 16 }),
					}),
				});
			}

			const disposals = [];
			const register = (slot, options, component) => {
				ctx.slots.inject(slot, () => {
					try {
						disposals.push(ctx.slots.register(options, component));
					} catch (error) {
						// `conversation.header.leading` is a single-kind seat: another
						// bundle may already own it, and this plugin is optional.
						console.warn(`[${NS}] could not register "${slot}"`, error);
					}
				});
			};
			register("conversation.header.leading", { name: "conversation.header.leading", locale: NS }, SidebarButton);
			// `shell.overlay` is a list-kind seat, which requires an entry id.
			register("shell.overlay", { name: "shell.overlay", id: "mobile-sidebar-scrim" }, DrawerScrim);
			register("shell.overlay", { name: "shell.overlay", id: "mobile-sidebar-fab", locale: NS }, PanelSidebarButton);

			return () => {
				for (const dispose of disposals) dispose();
				disposals.length = 0;
			};
		}

		exports.inject = ["slots", "locale", "layout"];
		exports.apply = apply;

		return module.exports;
	}
});
