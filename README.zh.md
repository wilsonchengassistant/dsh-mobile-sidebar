# dsh-mobile-sidebar

把手機畫面嘅左邊欄收埋，騰多啲空間畀對話。

## 佢做咩

喺 **1024px 以下**（同 `dsh-client-ui-layout` 自動摺起側欄嘅闊度一樣），
stock web 版唔係完全收起側欄，而係留咗一條 **56px 嘅 icon rail** ——
只有 macOS desktop 同 Windows titlebar 嗰兩個 shell 先係傳 0 咗。
喺 390px 嘅手機上面，呢條窄條食咗 14% 畫面闊度，而且乜都睇唔到。

呢個 plugin 喺同一個闊度以下做三件事：

| | 原本 | 加咗之後 |
|---|---|---|
| 390px 嘅 frame tracks | `56px 334px 0px` | `0px 390px 0px` |
| 收起咗嘅側欄 | 56px icon rail | 冇 track、冇畫面 |
| 打開側欄 | 迫住中間嗰欄剩返 110px | 300px 抽屜浮喺 390px 中間欄上面，撳外面就收 |
| 頁首 | 冇掣 | 頁首左上角有個 panel-left 掣 |
| ≥ 1024px | — | 完全唔變（`280px 1000px 0px`，兩個掣都唔出現） |

## 安裝

```bash
dsh plugin --profile web add file:/path/to/dsh-mobile-sidebar
```

`dsh plugin add` 會自己加落 `dsh.profile.bundles` 同即刻 hot-mount；
browser 只需要 **重新整理** 就會載入新嘅 client combo，唔使重啟 `dsh web`。

想移除：喺 `~/.dsh/profiles/<profile>/package.json` 嘅 `bundles` 刪走
`"dsh-mobile-sidebar"`，或者喺 Plugins 頁面停用。

## 點解係咁實作

1. **把側欄 track 歸零。** React 係用 inline style 寫 `grid-template-columns`，
   media query 改唔到入面其中一格。一個 `MutationObserver` 會睇住 frame 每次
   重算，將個值重寫成**淨係換走第一格**，再經 custom property 發佈出嚟 ——
   因為 800 至 1024px 之間右邊嗰個 panel 仲係解到真實嘅第三格，唔可以整死佢。
2. **收起嗰陣唔會離開個 grid。** 用 `visibility: hidden`，唔用 `display: none`：
   `display: none` 嘅 box 唔再係 grid item，auto-placement 會將中間欄推入
   而家闊 0 嘅第一格，成個對話就 0px 闊咗。
3. **打開係抽屜。** 側欄留喺佢 0px 嘅 track 入面，靠 overflow 突出嚟，
   所以中間欄闊度永遠唔會變。抽屜背後有個 scrim，撳外面就收返。
4. **個掣** 喺 `conversation.header.leading`，叫 `ctx.layout.toggleSidebar()`。

## 全域面板（Plugins、Automation tasks…）

**只有** Conversation 有頁首 slot。其他全域面板都入咗 keyed `main` slot
（`{name:"main", key:"plugins"}`、`key:"schedules"`），而且每個都自己砌個標題 ——
冇嘢可以注入。所以個掣會喺 `shell.overlay`（root scope，always mounted）另外畫
一個，咁樣連將來新增嘅面板都覆蓋到。兩條規則保證佢唔會古靈精怪：

- **喺 Conversation 佢會讓路。** `[frame]:not(:has([data-dsh-mobile-sidebar-button]))`
  就係嚟 Hide 佢喺嗰度，所以頁首掣同浮動掣永遠唔會一齊出現。
- **佢有自己嘅一行。** 面板標題一律離頂 28px、離左 24px，所以浮動掣會撞到
  標題；只要佢喺度，就會幫標題加 40px `padding-inline-start`。

| 位置 | 個掣 |
|---|---|
| Conversation | `conversation.header.leading` slot |
| Plugins / Schedules / 任何將來嘅面板 | `shell.overlay` 入面嘅浮動掣 |
| ≥ 1024px | 兩個都冇 |

## 語言

`zh`（簡體）、`en`、同 `zh-Hant`（繁體）三份字典，跟住 app 嘅語言設定行。
繁體嗰份係為咗 `dsh-zh-hant` 語言包加嘅 `zh-Hant` locale：locale service 會沿
`zh-Hant` → `zh` → `en` 呢條 chain 搵 key，冇繁體字典就會跌返去**簡體**。

## 升級

呢個 plugin 淨係用原始碼寫出嚟嘅 attribute，唔用 shell 嗰啲 CSS-module class
名（`pI_x6G_frame` 呢啲係 build hash 嚟嘅，DSH 一升級就會變）：

- `[data-shell-overlay]` — frame 係佢嘅 parent
- `[data-slot="sidebar"]` — 側欄欄位係佢嘅 parent
- `[data-sidebar-collapsed]` 喺 frame 上 — 收起定打開

## License

MIT
