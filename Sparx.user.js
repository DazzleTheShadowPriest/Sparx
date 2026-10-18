// ==UserScript==
// @name         Sparx - Своя тема для соцсети "Стрекоза"
// @namespace    dragonfly-custom-css
// @version      1.6.12
// @description  Sparx — настройщик темы Стрекозы. 1.6.12.
// @author       Dazzle_TheShadowPriest (https://dragonfly-flash.com/?id=Dazzle_TheShadowPriest)
// @homepageURL  https://github.com/DazzleTheShadowPriest/Sparx
// @supportURL   https://github.com/DazzleTheShadowPriest/Sparx/issues
// @updateURL    https://raw.githubusercontent.com/DazzleTheShadowPriest/Sparx/main/Sparx.user.js
// @downloadURL  https://raw.githubusercontent.com/DazzleTheShadowPriest/Sparx/main/Sparx.user.js
// @match        https://dragonfly-flash.com/*
// @match        http://dragonfly-flash.com/*
// @match        https://www.dragonfly-flash.com/*
// @match        http://www.dragonfly-flash.com/*
// @run-at       document-idle
// @noframes
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @connect      *
// ==/UserScript==

(() => {
  'use strict';

  const ID = 'df-theme-v56';
  const KEY = 'df-theme-v56-settings';
  const LOCAL_WALLPAPER_KEY =
    'df-theme-v56-local-wallpaper';
  const LOCAL_FONT_KEY =
    'df-theme-v56-local-font';
  const LOCAL_BANNER_KEY =
    'df-theme-v56-local-banner';
  const THEME_SLOTS_KEY =
    'df-theme-v56-theme-slots';
  const THEME_SLOT_COUNT = 5;
  const THEME_SLOT_WALLPAPER_PREFIX =
    'df-theme-v56-slot-wallpaper-';
  const THEME_SLOT_BANNER_PREFIX =
    'df-theme-v56-slot-banner-';
  const THEME_SLOT_FONT_PREFIX =
    'df-theme-v56-slot-font-';
  const THEME_SHARE_FORMAT =
    'sparx-theme';
  const THEME_SHARE_VERSION = 1;
  const THEME_SHARE_CODE_PREFIX =
    'SPARX1:';
  const OLD_POPUP_KEY = 'df-v56-popup-opaque-settings';
  const WALLPAPER_LAYER_ID =
    `${ID}-wallpaper-layer`;
  const FONT_STYLE_ID =
    `${ID}-font`;

  const NEUTRAL_FALLBACK_VAR =
    `--${ID}-neutral-fallback-color`;

  const OLD_KEYS = [
    'df-theme-v51-settings',
    'df-theme-v52-settings',
    'df-theme-v54-settings',
    'df-theme-v541-settings',
    'df-theme-v55-settings',
  ];

  const GROUPS = [
    'blue',
    'yellow',
    'neutral',
    'canvas',
    'controls',
  ];

  const DEFAULTS = {
    enabled: false,

    wallpaperEnabled: false,
    wallpaper:
      'https://files.catbox.moe/qq0th0.png',
    wallpaperMode: 'cover',
    wallpaperPosition: 'center center',

    bannerEnabled: false,
    banner: '',
    bannerMode: 'cover',
    bannerPosition: 'center center',

    viewerEnabled: false,
    viewerDark: '#0b46b8',
    viewerMiddle: '#4f8de0',
    viewerLight: '#dce8fb',
    viewerCanvas: '#f4f4f4',
    viewerText: '#000000',

    blueEnabled: false,
    blueDark: '#0000ff',
    blueMiddle: '#007fff',
    blueLight: '#7f9fe8',
    blueTransparency: 0,

    blueAeroEnabled: false,
    blueBlur: 14,
    blueSaturation: 125,

    yellowEnabled: false,
    yellowDark: '#d88900',
    yellowMiddle: '#ffc000',
    yellowLight: '#ffdd55',

    neutralEnabled: false,
    neutralDark: '#d4d0c8',
    neutralMiddle: '#ece9d8',
    neutralLight: '#ffffff',
    neutralTransparency: 0,

    canvasEnabled: false,
    canvasDark: '#d4d0c8',
    canvasMiddle: '#ece9d8',
    canvasLight: '#f5f2e8',
    canvasTransparency: 0,

    controlsEnabled: false,
    controlsDark: '#b7b7b7',
    controlsMiddle: '#e5e5e5',
    controlsLight: '#ffffff',

    roundedEnabled: false,
    cornerRadius: 8,

    font: 'original',
    fontScale: 100,

    customFontUrl: '',
    customFontFallback: 'sans-serif',

    textColorEnabled: false,
    textColor: '#0000ee',

    popupOpaqueEnabled: false,
    popupColor: '#ece9d8',

  };

  const FONTS = {
    original: '',

    comic:
      '"Comic Sans MS", "Comic Sans", cursive',

    tahoma:
      'Tahoma, Geneva, sans-serif',

    trebuchet:
      '"Trebuchet MS", Arial, sans-serif',

    verdana:
      'Verdana, Geneva, sans-serif',

    arial:
      'Arial, Helvetica, sans-serif',

    georgia:
      'Georgia, "Times New Roman", serif',

    times:
      '"Times New Roman", Times, serif',

    courier:
      '"Courier New", Courier, monospace',

    lucida:
      '"Lucida Console", Monaco, monospace',
  };

  const inherited =
    OLD_KEYS.reduce(
      (result, key) => ({
        ...result,
        ...GM_getValue(
          key,
          {}
        ),
      }),

      {}
    );

  const inheritedPopup =
    GM_getValue(
      OLD_POPUP_KEY,
      {}
    );

  let settings = {
    ...DEFAULTS,
    ...inherited,

    popupOpaqueEnabled:
      inheritedPopup.enabled ??
      DEFAULTS.popupOpaqueEnabled,

    popupColor:
      inheritedPopup.color ??
      DEFAULTS.popupColor,

    ...GM_getValue(
      KEY,
      {}
    ),
  };

  settings.cornerRadius =
    Math.max(
      0,
      Math.min(
        8,
        Number(
          settings.cornerRadius
        ) || 0
      )
    );

  let fontStyle;
  let lastFontCss = '';
  let themeStyle;
  let effectsStyle;
  let uiStyle;
  let rebuildTimer;
  let dynamicRefreshTimer;
  let dynamicFullRefresh = false;
  const dynamicRoots = new Set();
  let settledRefreshTimer = 0;
  let settledRefreshLateTimer = 0;
  let generation = 0;
  let integratedTimer;
  let integratedApplying = false;
  let lastStatistics = null;
  let typingUntil = 0;
  let compositionActive = false;

  const popupInlineState =
    new WeakMap();

  const popupTouched =
    new Set();

  const textInlineState =
    new WeakMap();

  const textTouched =
    new Set();

  const TEXT_PROPERTIES = [
    'color',
    '-webkit-text-fill-color',
    'text-decoration-color',
  ];

  const fontCache = {
    url: '',
    objectUrl: '',
    promise: null,

    status:
      'Кастомный шрифт не выбран.',
  };

  const LOCAL_FILE_LIMITS = {
    wallpaper:
      24 * 1024 * 1024,

    banner:
      24 * 1024 * 1024,

    font:
      12 * 1024 * 1024,
  };

  function readStoredAsset(
    key
  ) {
    const stored =
      GM_getValue(
        key,
        ''
      );

    if (!stored) {
      return null;
    }

    try {
      const asset =
        typeof stored ===
          'string'
          ? JSON.parse(stored)
          : stored;

      if (
        asset &&
        typeof asset ===
          'object' &&
        typeof asset.dataUrl ===
          'string' &&
        asset.dataUrl.startsWith(
          'data:'
        )
      ) {
        return asset;
      }
    } catch {
    }

    return null;
  }

  let localWallpaperAsset =
    readStoredAsset(
      LOCAL_WALLPAPER_KEY
    );

  let localFontAsset =
    readStoredAsset(
      LOCAL_FONT_KEY
    );

  let localBannerAsset =
    readStoredAsset(
      LOCAL_BANNER_KEY
    );

  const localAssetUrls = {
    wallpaper: '',
    banner: '',
    font: '',
  };

  function assetFor(
    kind
  ) {
    if (kind === 'wallpaper') {
      return localWallpaperAsset;
    }

    if (kind === 'banner') {
      return localBannerAsset;
    }

    return localFontAsset;
  }

  function assetKeyFor(
    kind
  ) {
    if (kind === 'wallpaper') {
      return LOCAL_WALLPAPER_KEY;
    }

    if (kind === 'banner') {
      return LOCAL_BANNER_KEY;
    }

    return LOCAL_FONT_KEY;
  }

  function revokeLocalAssetUrl(
    kind
  ) {
    const url =
      localAssetUrls[kind];

    if (url) {
      if (
        url.startsWith(
          'blob:'
        )
      ) {
        URL.revokeObjectURL(
          url
        );
      }

      localAssetUrls[kind] =
        '';
    }
  }

  function dataUrlToBlob(
    dataUrl
  ) {
    const match =
      String(
        dataUrl ||
        ''
      ).match(
        /^data:([^;,]*)(;base64)?,(.*)$/s
      );

    if (!match) {
      return null;
    }

    const type =
      match[1] ||
      'application/octet-stream';

    const encoded =
      match[3] ||
      '';

    try {
      if (match[2]) {
        const binary =
          atob(encoded);

        const bytes =
          new Uint8Array(
            binary.length
          );

        for (
          let index = 0;
          index < binary.length;
          index += 1
        ) {
          bytes[index] =
            binary.charCodeAt(
              index
            );
        }

        return new Blob(
          [bytes],
          { type }
        );
      }

      return new Blob(
        [
          decodeURIComponent(
            encoded
          ),
        ],
        { type }
      );
    } catch {
      return null;
    }
  }

  function localAssetObjectUrl(
    kind
  ) {
    const asset =
      assetFor(kind);

    if (!asset) {
      return '';
    }

    if (
      localAssetUrls[kind]
    ) {
      return localAssetUrls[
        kind
      ];
    }

    const blob =
      dataUrlToBlob(
        asset.dataUrl
      );

    if (!blob) {
      return '';
    }

    try {
      localAssetUrls[kind] =
        URL.createObjectURL(
          blob
        );

      return localAssetUrls[kind];
    } catch {
      return asset.dataUrl;
    }
  }

  function currentWallpaperSource() {
    return (
      localAssetObjectUrl(
        'wallpaper'
      ) ||
      String(
        settings.wallpaper ||
        ''
      ).trim()
    );
  }

  function currentBannerSource() {
    return (
      localAssetObjectUrl(
        'banner'
      ) ||
      String(
        settings.banner ||
        ''
      ).trim()
    );
  }

  function currentFontFormat() {
    return fontFormat(
      localFontAsset?.name ||
      settings.customFontUrl ||
      ''
    );
  }

  function formatFileSize(
    bytes
  ) {
    const size =
      Number(bytes) || 0;

    if (size < 1024) {
      return `${size} Б`;
    }

    if (
      size <
      1024 * 1024
    ) {
      return `${(
        size / 1024
      ).toFixed(1)} КБ`;
    }

    return `${(
      size /
      (1024 * 1024)
    ).toFixed(1)} МБ`;
  }

  function fileToDataUrl(
    file
  ) {
    return new Promise(
      (resolve, reject) => {
        const reader =
          new FileReader();

        reader.onload =
          () =>
            resolve(
              String(
                reader.result ||
                ''
              )
            );

        reader.onerror =
          () =>
            reject(
              reader.error ||
              new Error(
                'Не удалось прочитать файл.'
              )
            );

        reader.readAsDataURL(
          file
        );
      }
    );
  }

  async function storeLocalAsset(
    kind,
    file
  ) {
    if (!file) {
      return false;
    }

    const limit =
      LOCAL_FILE_LIMITS[kind];

    if (
      limit &&
      file.size > limit
    ) {
      window.alert(
        kind === 'wallpaper'
          ? 'Файл обоев слишком большой. Максимум — 24 МБ.'
          : kind === 'banner'
            ? 'Файл баннера слишком большой. Максимум — 24 МБ.'
            : 'Файл шрифта слишком большой. Максимум — 12 МБ.'
      );

      return false;
    }

    let dataUrl = '';

    try {
      dataUrl =
        await fileToDataUrl(
          file
        );
    } catch (error) {
      console.error(
        '[Sparx] Не удалось прочитать локальный файл:',
        error
      );

      window.alert(
        'Не удалось прочитать выбранный файл.'
      );

      return false;
    }

    const asset = {
      name:
        file.name ||
        'local-file',

      type:
        file.type ||
        'application/octet-stream',

      size:
        file.size || 0,

      dataUrl,
    };

    try {
      GM_setValue(
        assetKeyFor(kind),
        JSON.stringify(asset)
      );
    } catch (error) {
      console.error(
        '[Sparx] Не удалось сохранить локальный файл:',
        error
      );

      window.alert(
        'Не удалось сохранить файл в хранилище менеджера скриптов. Попробуй файл меньшего размера.'
      );

      return false;
    }

    revokeLocalAssetUrl(
      kind
    );

    if (kind === 'wallpaper') {
      localWallpaperAsset =
        asset;
    } else if (kind === 'banner') {
      localBannerAsset =
        asset;
    } else {
      localFontAsset =
        asset;
    }

    return true;
  }

  function clearLocalAsset(
    kind
  ) {
    revokeLocalAssetUrl(
      kind
    );

    GM_deleteValue(
      assetKeyFor(kind)
    );

    if (kind === 'wallpaper') {
      localWallpaperAsset =
        null;
    } else if (kind === 'banner') {
      localBannerAsset =
        null;
    } else {
      localFontAsset =
        null;
    }
  }

  function writeStoredAsset(
    key,
    asset
  ) {
    if (
      asset &&
      typeof asset === 'object' &&
      typeof asset.dataUrl === 'string' &&
      asset.dataUrl.startsWith('data:')
    ) {
      GM_setValue(
        key,
        JSON.stringify(asset)
      );
    } else {
      GM_deleteValue(key);
    }
  }

  function cloneThemeSettings(
    source
  ) {
    const safe = {};

    if (source && typeof source === 'object') {
      for (const key of Object.keys(DEFAULTS)) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          safe[key] = source[key];
        }
      }
    }

    const next = {
      ...DEFAULTS,
      ...safe,
    };

    next.cornerRadius = Math.max(
      0,
      Math.min(8, Number(next.cornerRadius) || 0)
    );

    for (const key of [
      'blueTransparency',
      'neutralTransparency',
      'canvasTransparency',
    ]) {
      next[key] = Math.max(0, Math.min(100, Number(next[key]) || 0));
    }

    return next;
  }

  function loadThemeSlots() {
    const stored =
      GM_getValue(
        THEME_SLOTS_KEY,
        ''
      );

    let raw = [];

    try {
      raw =
        typeof stored ===
          'string'
          ? JSON.parse(
              stored || '[]'
            )
          : stored;
    } catch {
      raw = [];
    }

    if (!Array.isArray(raw)) {
      raw = [];
    }

    return Array.from(
      {
        length:
          THEME_SLOT_COUNT,
      },
      (_, index) => {
        const slot =
          raw[index];

        if (
          !slot ||
          typeof slot !==
            'object' ||
          !slot.settings ||
          typeof slot.settings !==
            'object'
        ) {
          return null;
        }

        return {
          name:
            String(
              slot.name ||
              `Тема ${index + 1}`
            ).slice(0, 48),

          settings:
            cloneThemeSettings(
              slot.settings
            ),

          savedAt:
            Number(
              slot.savedAt
            ) || 0,
        };
      }
    );
  }

  let themeSlots =
    loadThemeSlots();

  function saveThemeSlots() {
    GM_setValue(
      THEME_SLOTS_KEY,
      JSON.stringify(
        themeSlots
      )
    );
  }

  function themeSlotAssetKey(
    kind,
    index
  ) {
    const prefix =
      kind === 'wallpaper'
        ? THEME_SLOT_WALLPAPER_PREFIX
        : kind === 'banner'
          ? THEME_SLOT_BANNER_PREFIX
          : THEME_SLOT_FONT_PREFIX;

    return `${prefix}${index}`;
  }

  function saveCurrentAssetsToThemeSlot(
    index
  ) {
    writeStoredAsset(
      themeSlotAssetKey(
        'wallpaper',
        index
      ),
      localWallpaperAsset
    );

    writeStoredAsset(
      themeSlotAssetKey(
        'banner',
        index
      ),
      localBannerAsset
    );

    writeStoredAsset(
      themeSlotAssetKey(
        'font',
        index
      ),
      localFontAsset
    );
  }

  function applyThemeSlotAssets(
    index
  ) {
    revokeLocalAssetUrl(
      'wallpaper'
    );

    revokeLocalAssetUrl(
      'banner'
    );

    revokeLocalAssetUrl(
      'font'
    );

    localWallpaperAsset =
      readStoredAsset(
        themeSlotAssetKey(
          'wallpaper',
          index
        )
      );

    localBannerAsset =
      readStoredAsset(
        themeSlotAssetKey(
          'banner',
          index
        )
      );

    localFontAsset =
      readStoredAsset(
        themeSlotAssetKey(
          'font',
          index
        )
      );

    writeStoredAsset(
      LOCAL_WALLPAPER_KEY,
      localWallpaperAsset
    );

    writeStoredAsset(
      LOCAL_BANNER_KEY,
      localBannerAsset
    );

    writeStoredAsset(
      LOCAL_FONT_KEY,
      localFontAsset
    );

    clearFontCache();
  }

  function clearThemeSlot(
    index
  ) {
    themeSlots[index] =
      null;

    saveThemeSlots();

    GM_deleteValue(
      themeSlotAssetKey(
        'wallpaper',
        index
      )
    );

    GM_deleteValue(
      themeSlotAssetKey(
        'banner',
        index
      )
    );

    GM_deleteValue(
      themeSlotAssetKey(
        'font',
        index
      )
    );
  }

  function sharedAsset(
    asset,
    kind
  ) {
    if (!asset) {
      return null;
    }

    if (
      typeof asset !== 'object' ||
      typeof asset.dataUrl !== 'string' ||
      !asset.dataUrl.startsWith('data:')
    ) {
      throw new Error('Некорректный локальный файл в теме.');
    }

    const limit = LOCAL_FILE_LIMITS[kind] || 0;
    const maximumDataUrlLength = Math.ceil(limit * 4 / 3) + 8192;

    if (limit && asset.dataUrl.length > maximumDataUrlLength) {
      throw new Error(
        kind === 'font'
          ? 'Шрифт внутри темы превышает лимит Sparx.'
          : kind === 'banner'
            ? 'Баннер внутри темы превышает лимит Sparx.'
            : 'Обои внутри темы превышают лимит Sparx.'
      );
    }

    if (
      (kind === 'wallpaper' || kind === 'banner') &&
      !/^data:image\//i.test(asset.dataUrl)
    ) {
      throw new Error(
        kind === 'banner'
          ? 'В теме находится неподдерживаемый файл баннера.'
          : 'В теме находится неподдерживаемый файл обоев.'
      );
    }

    if (
      kind === 'font' &&
      !/^data:(?:font\/|application\/(?:octet-stream|font|x-font-))/i.test(
        asset.dataUrl
      )
    ) {
      throw new Error('В теме находится неподдерживаемый файл шрифта.');
    }

    return {
      name: String(
        asset.name ||
        (kind === 'font' ? 'font' : kind === 'banner' ? 'banner' : 'wallpaper')
      ).slice(0, 160),
      type: String(asset.type || 'application/octet-stream').slice(0, 100),
      size: Math.max(0, Number(asset.size) || 0),
      dataUrl: asset.dataUrl,
    };
  }

  function safeThemeFilename(
    name
  ) {
    return (
      String(name || 'Sparx-theme')
        .replace(/[<>:"/\\|?*\x00-\x1f]/g, '-')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 80) ||
      'Sparx-theme'
    );
  }

  function buildSharedTheme(
    sourceSettings = settings,
    includeAssets = true,
    name = 'Sparx theme'
  ) {
    const payload = {
      format: THEME_SHARE_FORMAT,
      formatVersion: THEME_SHARE_VERSION,
      sparxVersion: '1.6.12',
      name: String(name || 'Sparx theme').slice(0, 80),
      settings: cloneThemeSettings(sourceSettings),
      exportedAt: new Date().toISOString(),
    };

    if (includeAssets) {
      payload.assets = {
        wallpaper: sharedAsset(localWallpaperAsset, 'wallpaper'),
        banner: sharedAsset(localBannerAsset, 'banner'),
        font: sharedAsset(localFontAsset, 'font'),
      };
    }

    return payload;
  }

  function parseSharedTheme(
    input
  ) {
    const payload =
      typeof input === 'string'
        ? JSON.parse(input)
        : input;

    if (
      !payload ||
      typeof payload !== 'object' ||
      payload.format !== THEME_SHARE_FORMAT ||
      Number(payload.formatVersion) !== THEME_SHARE_VERSION ||
      !payload.settings ||
      typeof payload.settings !== 'object'
    ) {
      throw new Error('Это не поддерживаемая тема Sparx.');
    }

    const assets =
      payload.assets && typeof payload.assets === 'object'
        ? payload.assets
        : {};

    return {
      name: String(payload.name || 'Импортированная тема').slice(0, 80),
      settings: cloneThemeSettings(payload.settings),
      assets: {
        wallpaper: sharedAsset(assets.wallpaper, 'wallpaper'),
        banner: sharedAsset(assets.banner, 'banner'),
        font: sharedAsset(assets.font, 'font'),
      },
    };
  }

  function applyImportedTheme(
    payload,
    hasAssets = true
  ) {
    const imported = parseSharedTheme(payload);

    settings = imported.settings;
    GM_setValue(KEY, settings);

    revokeLocalAssetUrl('wallpaper');
    revokeLocalAssetUrl('banner');
    revokeLocalAssetUrl('font');

    localWallpaperAsset = hasAssets ? imported.assets.wallpaper : null;
    localBannerAsset = hasAssets ? imported.assets.banner : null;
    localFontAsset = hasAssets ? imported.assets.font : null;

    writeStoredAsset(LOCAL_WALLPAPER_KEY, localWallpaperAsset);
    writeStoredAsset(LOCAL_BANNER_KEY, localBannerAsset);
    writeStoredAsset(LOCAL_FONT_KEY, localFontAsset);

    clearFontCache();
    return imported;
  }

  function downloadSharedTheme(
    sourceSettings,
    name
  ) {
    const payload = buildSharedTheme(sourceSettings, true, name);
    const blob = new Blob(
      [JSON.stringify(payload)],
      { type: 'application/json;charset=utf-8' }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeThemeFilename(payload.name)}.sparx`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function utf8ToBase64(
    value
  ) {
    const bytes = new TextEncoder().encode(String(value));
    let binary = '';

    for (let offset = 0; offset < bytes.length; offset += 0x8000) {
      binary += String.fromCharCode(
        ...bytes.subarray(offset, Math.min(offset + 0x8000, bytes.length))
      );
    }

    return btoa(binary);
  }

  function base64ToUtf8(
    value
  ) {
    const binary = atob(String(value));
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    return new TextDecoder().decode(bytes);
  }

  function currentThemeShareCode(
    sourceSettings,
    name
  ) {
    return (
      THEME_SHARE_CODE_PREFIX +
      utf8ToBase64(
        JSON.stringify(
          buildSharedTheme(sourceSettings, false, name)
        )
      )
    );
  }

  function parseThemeShareCode(
    code
  ) {
    const clean = String(code || '').trim();

    if (!clean.startsWith(THEME_SHARE_CODE_PREFIX)) {
      throw new Error('Код темы должен начинаться с SPARX1:.');
    }

    return JSON.parse(
      base64ToUtf8(clean.slice(THEME_SHARE_CODE_PREFIX.length))
    );
  }

  async function copyText(
    value
  ) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return true;
      }
    } catch {
    }

    const area = document.createElement('textarea');
    area.value = value;
    area.style.position = 'fixed';
    area.style.left = '-99999px';
    document.body.append(area);
    area.select();

    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch {
      copied = false;
    }

    area.remove();
    return copied;
  }

  const probe =
    document.createElement(
      'span'
    );

  probe.style.cssText = [
    'position:fixed',
    'left:-99999px',
    'top:-99999px',
    'visibility:hidden',
    'pointer-events:none',
  ].join(';');

  const LIVE = {
    surface:
      `${ID}-surface`,

    blue:
      `${ID}-blue`,

    neutral:
      `${ID}-neutral`,

    neutralFallback:
      `${ID}-neutral-fallback`,

    canvas:
      `${ID}-canvas`,

    shell:
      `${ID}-shell`,

    round:
      `${ID}-round`,

    hoverRound:
      `${ID}-hover-round`,

    roundClip:
      `${ID}-round-clip`,

    text:
      `${ID}-text`,

    canvasImage:
      `${ID}-canvas-image`,

    neutralImage:
      `${ID}-neutral-image`,
  };

  const INTEGRATED = {
    glassRoot:
      `${ID}-glass-root`,

    glassLayer:
      `${ID}-glass-layer`,

    explorerFrame:
      `${ID}-explorer-frame`,

    explorerRoot:
      `${ID}-explorer-root`,

    explorerTitle:
      `${ID}-explorer-title`,

    explorerTitleLayer:
      `${ID}-explorer-title-layer`,

    explorerBand:
      `${ID}-explorer-band`,

    explorerAddress:
      `${ID}-explorer-address`,

    popupRoot:
      `${ID}-popup-root`,

    popupTitle:
      `${ID}-popup-title`,

    popupBody:
      `${ID}-popup-body`,

    popupComposer:
      `${ID}-popup-composer`,

    popupNotice:
      `${ID}-popup-notice`,

    popupRadio:
      `${ID}-popup-radio`,

    popupOpen:
      `${ID}-popup-open`,
  };

  const NATIVE = {
    root: `${ID}-native-zone`,
    viewer: `${ID}-native-viewer`,
    viewerShell: `${ID}-native-viewer-shell`,
    control: `${ID}-native-window-control`,
    banner: `${ID}-profile-banner`,
    bannerHost: `${ID}-profile-banner-host`,
    bannerNative: `${ID}-profile-banner-native`,
    avatarFrame: `${ID}-native-avatar-frame`,
    viewerBlueStrong: `${ID}-native-viewer-blue-strong`,
    viewerBlueSoft: `${ID}-native-viewer-blue-soft`,
    viewerNeutral: `${ID}-native-viewer-neutral`,
    viewerCanvas: `${ID}-native-viewer-canvas`,
    viewerControlSurface: `${ID}-native-viewer-control-surface`,
  };

  function isNativeZone(
    element
  ) {
    return Boolean(
      element instanceof Element &&
      (
        element.closest(`.${NATIVE.root}`) ||
        element.closest(`.${NATIVE.avatarFrame}`) ||
        element.classList.contains(NATIVE.banner)
      )
    );
  }

  const clamp = (
    value,
    minimum = 0,
    maximum = 1
  ) =>
    Math.max(
      minimum,

      Math.min(
        maximum,
        value
      )
    );

  function hexToRgba(
    value
  ) {
    let hex =
      String(value)
        .replace(
          '#',
          ''
        )
        .trim();

    if (
      hex.length === 3 ||
      hex.length === 4
    ) {
      hex =
        [...hex]
          .map(
            (character) =>
              character +
              character
          )
          .join('');
    }

    if (
      !/^[\da-f]{6}([\da-f]{2})?$/i
        .test(hex)
    ) {
      return null;
    }

    const number =
      Number.parseInt(
        hex,
        16
      );

    if (
      hex.length === 8
    ) {
      return {
        r:
          (
            number >>>
            24
          ) &
          255,

        g:
          (
            number >>>
            16
          ) &
          255,

        b:
          (
            number >>>
            8
          ) &
          255,

        a:
          (
            number &
            255
          ) /
          255,
      };
    }

    return {
      r:
        (
          number >>>
          16
        ) &
        255,

      g:
        (
          number >>>
          8
        ) &
        255,

      b:
        number &
        255,

      a: 1,
    };
  }

  function parseColor(
    token
  ) {
    if (
      /^#[\da-f]{3,8}$/i
        .test(token)
    ) {
      return hexToRgba(
        token
      );
    }

    if (
      !probe.isConnected &&
      document.body
    ) {
      document.body.append(
        probe
      );
    }

    probe.style.color = '';
    probe.style.color =
      token;

    if (
      !probe.style.color
    ) {
      return null;
    }

    const match =
      getComputedStyle(
        probe
      )
        .color
        .match(
          /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?/i
        );

    if (!match) {
      return null;
    }

    return {
      r:
        Number(
          match[1]
        ),

      g:
        Number(
          match[2]
        ),

      b:
        Number(
          match[3]
        ),

      a:
        match[4] ===
        undefined
          ? 1
          : Number(
              match[4]
            ),
    };
  }

  function rgbToHsl({
    r,
    g,
    b,
  }) {
    r /= 255;
    g /= 255;
    b /= 255;

    const maximum =
      Math.max(
        r,
        g,
        b
      );

    const minimum =
      Math.min(
        r,
        g,
        b
      );

    const lightness =
      (
        maximum +
        minimum
      ) /
      2;

    if (
      maximum === minimum
    ) {
      return {
        h: 0,
        s: 0,
        l: lightness,
      };
    }

    const difference =
      maximum -
      minimum;

    const saturation =
      lightness > 0.5
        ? difference /
          (
            2 -
            maximum -
            minimum
          )
        : difference /
          (
            maximum +
            minimum
          );

    let hue;

    if (
      maximum === r
    ) {
      hue =
        (
          g - b
        ) /
        difference +
        (
          g < b
            ? 6
            : 0
        );
    } else if (
      maximum === g
    ) {
      hue =
        (
          b - r
        ) /
        difference +
        2;
    } else {
      hue =
        (
          r - g
        ) /
        difference +
        4;
    }

    return {
      h:
        hue *
        60,

      s:
        saturation,

      l:
        lightness,
    };
  }

  function mixColors(
    first,
    second,
    amount,
    alpha
  ) {
    const position =
      clamp(
        amount
      );

    return {
      r:
        Math.round(
          first.r +
          (
            second.r -
            first.r
          ) *
          position
        ),

      g:
        Math.round(
          first.g +
          (
            second.g -
            first.g
          ) *
          position
        ),

      b:
        Math.round(
          first.b +
          (
            second.b -
            first.b
          ) *
          position
        ),

      a:
        alpha,
    };
  }

  function paletteColor(
    group,
    position,
    alpha
  ) {
    const dark =
      hexToRgba(
        settings[
          `${group}Dark`
        ]
      );

    const middle =
      hexToRgba(
        settings[
          `${group}Middle`
        ]
      );

    const light =
      hexToRgba(
        settings[
          `${group}Light`
        ]
      );

    if (
      !dark ||
      !middle ||
      !light
    ) {
      return null;
    }

    if (
      position < 0.5
    ) {
      return mixColors(
        dark,
        middle,
        position * 2,
        alpha
      );
    }

    return mixColors(
      middle,
      light,

      (
        position -
        0.5
      ) *
      2,

      alpha
    );
  }

  function colorToCss(
    color
  ) {
    if (
      color.a < 0.999
    ) {
      return (
        `rgba(` +
        `${color.r},` +
        `${color.g},` +
        `${color.b},` +
        `${Number(
          color.a.toFixed(3)
        )}` +
        `)`
      );
    }

    return (
      `rgb(` +
      `${color.r},` +
      `${color.g},` +
      `${color.b}` +
      `)`
    );
  }

  const CONTROL_RE =
    /(?:^|[\s>+~,.:#\[])(?:button|input|select|textarea|option|btn|control|action|like|comment|share|repost|vote|tab|toolbar|player|play|pause)(?:$|[\s>+~,.:#\[\]_-])/i;

  const PAGE_RE =
    /(?:^|[\s>+~,.:#\[])(?:html|body|app|root|page|background|backdrop|wrapper|layout|shell|viewport)(?:$|[\s>+~,.:#\[\]_-])/i;

  const COLOR_RE =
    /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|\b(?:aqua|beige|bisque|blue|cadetblue|cornflowerblue|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgrey|darkkhaki|darkslateblue|deepskyblue|dodgerblue|gainsboro|gold|goldenrod|gray|grey|ivory|khaki|lavender|lightblue|lightcyan|lightgray|lightgrey|lightgoldenrodyellow|lightskyblue|lightsteelblue|mediumblue|mediumslateblue|midnightblue|navy|oldlace|palegoldenrod|powderblue|royalblue|skyblue|slateblue|steelblue|tan|wheat|white|whitesmoke|yellow)\b/gi;

  function isTextProperty(
    property
  ) {
    const name =
      String(property)
        .toLowerCase();

    return (
      name === 'color' ||
      name ===
        'caret-color' ||
      name ===
        'text-shadow' ||
      name.endsWith(
        'text-decoration-color'
      )
    );
  }

  function isSurfaceProperty(
    property
  ) {
    const name =
      String(property)
        .toLowerCase();

    return (
      name === 'background' ||
      name ===
        'background-color' ||
      name ===
        'background-image' ||

      name.startsWith('--')
    );
  }

  function classifyColor(
    color,
    property,
    selector = ''
  ) {
    const {
      h,
      s,
      l,
    } =
      rgbToHsl(
        color
      );

    const text =
      isTextProperty(
        property
      );

    const control =
      CONTROL_RE.test(
        selector
      );

    const page =
      PAGE_RE.test(
        selector
      );

    if (
      settings.blueEnabled &&
      h >= 175 &&
      h <= 265 &&
      s >= 0.16
    ) {
      return {
        group:
          'blue',

        position:
          clamp(
            (
              l -
              0.06
            ) /
            0.88
          ),
      };
    }

    if (
      settings.yellowEnabled &&
      h >= 20 &&
      h <= 70 &&
      s >= 0.55 &&
      l >= 0.16 &&
      (
        l <= 0.82 ||
        control ||
        /active|selected|highlight|warning|yellow|orange|rank|star/i
          .test(
            selector
          )
      )
    ) {
      return {
        group:
          'yellow',

        position:
          clamp(
            (
              l -
              0.16
            ) /
            0.74
          ),
      };
    }

    if (
      settings.controlsEnabled &&
      !text &&
      control &&
      l >= 0.42 &&
      l <= 1 &&
      (
        s <= 0.30 ||
        (
          h >= 20 &&
          h <= 75 &&
          s <= 0.48
        )
      )
    ) {
      return {
        group:
          'controls',

        position:
          clamp(
            (
              l -
              0.42
            ) /
            0.58
          ),
      };
    }

    if (
      settings.canvasEnabled &&
      !text &&
      !control &&
      l >= 0.55 &&
      l <= 1 &&
      (
        (
          h >= 20 &&
          h <= 80 &&
          s >= 0.08 &&
          s <= 0.48
        ) ||
        (
          page &&
          s <= 0.18
        )
      )
    ) {
      return {
        group:
          'canvas',

        position:
          clamp(
            (
              l -
              0.55
            ) /
            0.45
          ),
      };
    }

    if (
      settings.neutralEnabled &&
      !text &&
      !control &&
      s <= 0.14 &&
      l >= 0.72
    ) {
      return {
        group:
          'neutral',

        position:
          clamp(
            (
              l -
              0.72
            ) /
            0.28
          ),
      };
    }

    return null;
  }

  function groupOpacity(
    group,
    property
  ) {
    if (
      !isSurfaceProperty(
        property
      )
    ) {
      return 1;
    }

    if (
      group === 'blue'
    ) {
      return (
        1 -
        clamp(
          Number(
            settings
              .blueTransparency
          ) || 0,

          0,
          100
        ) /
        100
      );
    }

    if (
      group === 'neutral'
    ) {
      return (
        1 -
        clamp(
          Number(
            settings
              .neutralTransparency
          ) || 0,

          0,
          100
        ) /
        100
      );
    }

    if (
      group === 'canvas'
    ) {
      return (
        1 -
        clamp(
          Number(
            settings
              .canvasTransparency
          ) || 0,

          0,
          100
        ) /
        100
      );
    }

    return 1;
  }

  function transformValue(
    value,
    property,
    selector,
    statistics
  ) {
    return String(value)
      .replace(
        COLOR_RE,

        (token) => {
          const color =
            parseColor(
              token
            );

          const information =
            color &&
            color.a
              ? classifyColor(
                  color,
                  property,
                  selector
                )
              : null;

          if (
            !information
          ) {
            return token;
          }

          const mapped =
            paletteColor(
              information.group,
              information.position,

              color.a *
              groupOpacity(
                information.group,
                property
              )
            );

          if (!mapped) {
            return token;
          }

          statistics.groups[
            information.group
          ] += 1;

          if (
            isSurfaceProperty(
              property
            ) &&
            selector &&
            !selector
              .trim()
              .startsWith('@')
          ) {
            statistics.surface
              .add(
                selector
              );

            if (
              information.group ===
              'blue'
            ) {
              statistics.blue
                .add(
                  selector
                );
            }

            if (
              information.group ===
              'neutral'
            ) {
              statistics.neutral
                .add(
                  selector
                );
            }

            if (
              information.group ===
              'canvas'
            ) {
              statistics.canvas
                .add(
                  selector
                );
            }
          }

          return colorToCss(
            mapped
          );
        }
      );
  }

  function scaleFont(
    value,
    property
  ) {
    const factor =
      clamp(
        Number(
          settings.fontScale
        ) || 100,

        60,
        200
      ) /
      100;

    if (
      factor === 1
    ) {
      return value;
    }

    if (
      property ===
      'font-size'
    ) {
      return String(value)
        .replace(
          /(-?\d*\.?\d+)(px|pt|rem|em|%)/i,

          (
            whole,
            number,
            unit
          ) =>
            `${Number(
              (
                Number(number) *
                factor
              ).toFixed(3)
            )}${unit}`
        );
    }

    if (
      property ===
      'font'
    ) {
      return String(value)
        .replace(
          /(-?\d*\.?\d+)(px|pt|rem|em|%)(?=\s*(?:\/|[\s"']))/i,

          (
            whole,
            number,
            unit
          ) =>
            `${Number(
              (
                Number(number) *
                factor
              ).toFixed(3)
            )}${unit}`
        );
    }

    return value;
  }

  function absoluteUrls(
    value,
    baseUrl
  ) {
    return String(value)
      .replace(
        /url\((['"]?)(.*?)\1\)/gi,

        (
          whole,
          quote,
          url
        ) => {
          if (
            !baseUrl ||
            /^(?:data:|blob:|https?:|\/\/|#)/i
              .test(url)
          ) {
            return whole;
          }

          try {
            return (
              `url(` +
              `${JSON.stringify(
                new URL(
                  url,
                  baseUrl
                ).href
              )}` +
              `)`
            );
          } catch {
            return whole;
          }
        }
      );
  }

  function declarations(
    style,
    baseUrl,
    selector,
    statistics
  ) {
    const changed = [];

    for (
      let index = 0;
      index < style.length;
      index += 1
    ) {
      const property =
        style[index];

      const original =
        style.getPropertyValue(
          property
        );

      let transformed =
        transformValue(
          original,
          property,
          selector,
          statistics
        );

      transformed =
        scaleFont(
          transformed,
          property
        );

      transformed =
        absoluteUrls(
          transformed,
          baseUrl
        );

      if (
        transformed !== original
      ) {
        changed.push(
          `${property}:` +
          `${transformed}` +
          `!important`
        );
      }
    }

    return changed.join(
      ';'
    );
  }

  function splitSelectorList(
    selectorText
  ) {
    const result = [];
    let part = '';
    let round = 0;
    let square = 0;
    let quote = '';
    let escaped = false;

    for (const character of String(selectorText || '')) {
      if (escaped) {
        part += character;
        escaped = false;
        continue;
      }

      if (character === '\\') {
        part += character;
        escaped = true;
        continue;
      }

      if (quote) {
        part += character;
        if (character === quote) quote = '';
        continue;
      }

      if (character === '"' || character === "'") {
        quote = character;
        part += character;
        continue;
      }

      if (character === '(') round += 1;
      if (character === ')') round = Math.max(0, round - 1);
      if (character === '[') square += 1;
      if (character === ']') square = Math.max(0, square - 1);

      if (character === ',' && round === 0 && square === 0) {
        result.push(part.trim());
        part = '';
      } else {
        part += character;
      }
    }

    if (part.trim()) result.push(part.trim());
    return result;
  }

  function topLevelPseudoElementIndex(
    selector
  ) {
    let round = 0;
    let square = 0;
    let quote = '';
    let escaped = false;

    for (let index = 0; index < selector.length - 1; index += 1) {
      const character = selector[index];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (character === '\\') {
        escaped = true;
        continue;
      }

      if (quote) {
        if (character === quote) quote = '';
        continue;
      }

      if (character === '"' || character === "'") {
        quote = character;
        continue;
      }

      if (character === '(') round += 1;
      else if (character === ')') round = Math.max(0, round - 1);
      else if (character === '[') square += 1;
      else if (character === ']') square = Math.max(0, square - 1);
      else if (
        character === ':' &&
        selector[index + 1] === ':' &&
        round === 0 &&
        square === 0
      ) {
        return index;
      }
    }

    return -1;
  }

  function protectSelectorText(
    selectorText
  ) {
    const guard =
      `:not(.${NATIVE.root}):not(.${NATIVE.root} *):not(.${NATIVE.banner})`;

    return splitSelectorList(selectorText)
      .map((selector) => {
        if (!selector || selector.includes(`.${NATIVE.root}`)) {
          return selector;
        }

        const pseudoIndex = topLevelPseudoElementIndex(selector);

        return pseudoIndex >= 0
          ? `${selector.slice(0, pseudoIndex)}${guard}${selector.slice(pseudoIndex)}`
          : `${selector}${guard}`;
      })
      .join(', ');
  }

  function serializeRules(
    rules,
    baseUrl,
    statistics
  ) {
    let output = '';

    for (
      const rule
      of rules
    ) {
      if (
        rule.type ===
        CSSRule.STYLE_RULE
      ) {
        const body =
          declarations(
            rule.style,
            baseUrl,

            rule.selectorText ||
              '',

            statistics
          );

        if (body) {
          output +=
            `${protectSelectorText(rule.selectorText)}` +
            `{${body}}\n`;
        }

        continue;
      }

      if (
        rule.type ===
        CSSRule.KEYFRAMES_RULE
      ) {
        let frames = '';

        for (
          const frame
          of rule.cssRules
        ) {
          const body =
            declarations(
              frame.style,
              baseUrl,

              `@keyframes ${rule.name}`,

              statistics
            );

          if (body) {
            frames +=
              `${frame.keyText}` +
              `{${body}}`;
          }
        }

        if (frames) {
          output +=
            `@keyframes ` +
            `${rule.name}` +
            `{${frames}}\n`;
        }

        continue;
      }

      if (
        rule.type ===
          CSSRule.IMPORT_RULE &&
        rule.styleSheet
      ) {
        try {
          output +=
            serializeRules(
              rule.styleSheet
                .cssRules,

              rule.href ||
                baseUrl,

              statistics
            );
        } catch {
        }

        continue;
      }

      if (
        rule.cssRules
      ) {
        const nested =
          serializeRules(
            rule.cssRules,
            baseUrl,
            statistics
          );

        const brace =
          rule.cssText
            .indexOf('{');

        if (
          nested &&
          brace >= 0
        ) {
          output +=
            `${rule.cssText.slice(
              0,
              brace
            )}` +
            `{${nested}}\n`;
        }
      }
    }

    return output;
  }

  function readableSheets() {
    return [
      ...document.styleSheets,
    ].filter(
      (sheet) => {
        if (
          [
            `${ID}-theme`,
            `${ID}-effects`,
            `${ID}-ui`,
          ].includes(
            sheet.ownerNode?.id
          )
        ) {
          return false;
        }

        if (
          sheet.href
        ) {
          try {
            if (
              new URL(
                sheet.href,
                location.href
              ).origin !==
              location.origin
            ) {
              return false;
            }
          } catch {
            return false;
          }
        }

        try {
          void sheet.cssRules;
          return true;
        } catch {
          return false;
        }
      }
    );
  }

  function syncWallpaperLayer() {
    const source =
      currentWallpaperSource();

    const active =
      settings.enabled &&
      settings.wallpaperEnabled &&
      Boolean(source);

    let layer =
      document.getElementById(
        WALLPAPER_LAYER_ID
      );

    if (!active) {
      layer?.remove();
      return null;
    }

    if (!layer) {
      layer =
        document.createElement(
          'div'
        );

      layer.id =
        WALLPAPER_LAYER_ID;

      layer.setAttribute(
        'aria-hidden',
        'true'
      );

      document.body.prepend(
        layer
      );
    }

    return layer;
  }

  function wallpaperCss() {
    const source =
      currentWallpaperSource();

    if (
      !settings
        .wallpaperEnabled ||
      !source
    ) {
      return '';
    }

    const modes = {
      cover: [
        'cover',
        'no-repeat',
      ],

      contain: [
        'contain',
        'no-repeat',
      ],

      stretch: [
        '100% 100%',
        'no-repeat',
      ],

      repeat: [
        'auto',
        'repeat',
      ],
    };

    const [
      size,
      repeat,
    ] =
      modes[
        settings
          .wallpaperMode
      ] ||
      modes.cover;

    return `
      html {
        min-height:
          100% !important;

        background:
          #000 !important;
      }

      body {
        min-height:
          100vh !important;

        background-color:
          transparent !important;

        background-image:
          none !important;

        isolation:
          isolate !important;
      }

      #${WALLPAPER_LAYER_ID} {
        position:
          fixed !important;

        inset:
          0 !important;

        width:
          100vw !important;

        height:
          100vh !important;

        z-index:
          -1 !important;

        display:
          block !important;

        pointer-events:
          none !important;

        user-select:
          none !important;

        background-color:
          #000 !important;

        background-image:
          url(${JSON.stringify(
            source
          )}) !important;

        background-size:
          ${size} !important;

        background-repeat:
          ${repeat} !important;

        background-position:
          ${
            settings
              .wallpaperPosition ||
            'center center'
          } !important;

        background-origin:
          border-box !important;

        background-clip:
          border-box !important;
      }
    `;
  }

  function fontFormat(
    url
  ) {
    const clean =
      String(url)
        .split(
          /[?#]/
        )[0]
        .toLowerCase();

    if (
      clean.endsWith(
        '.woff2'
      )
    ) {
      return 'woff2';
    }

    if (
      clean.endsWith(
        '.woff'
      )
    ) {
      return 'woff';
    }

    if (
      clean.endsWith(
        '.ttf'
      )
    ) {
      return 'truetype';
    }

    if (
      clean.endsWith(
        '.otf'
      )
    ) {
      return 'opentype';
    }

    return '';
  }

  function fontMime(
    url
  ) {
    const formats = {
      woff2:
        'font/woff2',

      woff:
        'font/woff',

      truetype:
        'font/ttf',

      opentype:
        'font/otf',
    };

    return (
      formats[
        fontFormat(url)
      ] ||
      'application/octet-stream'
    );
  }

  function setFontStatus(
    text
  ) {
    fontCache.status =
      text;

    const box =
      document.getElementById(
        `${ID}-font-status`
      );

    if (box) {
      box.textContent =
        text;
    }
  }

  function clearFontCache() {
    if (
      fontCache.objectUrl
    ) {
      URL.revokeObjectURL(
        fontCache.objectUrl
      );
    }

    fontCache.url = '';
    fontCache.objectUrl = '';
    fontCache.promise = null;
  }

  function loadCustomFont(
    url
  ) {
    const source =
      String(
        url ||
        ''
      ).trim();

    if (!source) {
      setFontStatus(
        'Укажи прямую ссылку на файл шрифта.'
      );

      return Promise.resolve(
        ''
      );
    }

    if (
      fontCache.url === source &&
      fontCache.objectUrl
    ) {
      return Promise.resolve(
        fontCache.objectUrl
      );
    }

    if (
      fontCache.url === source &&
      fontCache.promise
    ) {
      return fontCache.promise;
    }

    clearFontCache();

    fontCache.url =
      source;

    setFontStatus(
      'Загрузка кастомного шрифта…'
    );

    fontCache.promise =
      new Promise(
        (resolve) => {
          GM_xmlhttpRequest({
            method:
              'GET',

            url:
              source,

            responseType:
              'arraybuffer',

            timeout:
              20000,

            onload(
              response
            ) {
              const successful =
                (
                  response.status >=
                    200 &&
                  response.status <
                    400
                ) ||
                response.status ===
                  0;

              if (
                successful &&
                response.response
                  ?.byteLength
              ) {
                const blob =
                  new Blob(
                    [
                      response
                        .response,
                    ],

                    {
                      type:
                        fontMime(
                          source
                        ),
                    }
                  );

                fontCache.objectUrl =
                  URL.createObjectURL(
                    blob
                  );

                setFontStatus(
                  'Кастомный шрифт загружен.'
                );

                resolve(
                  fontCache.objectUrl
                );

                return;
              }

              setFontStatus(
                'Не удалось скачать шрифт; используется прямая ссылка.'
              );

              resolve(
                source
              );
            },

            onerror() {
              setFontStatus(
                'Не удалось скачать шрифт; используется прямая ссылка.'
              );

              resolve(
                source
              );
            },

            ontimeout() {
              setFontStatus(
                'Загрузка шрифта превысила 20 секунд.'
              );

              resolve(
                source
              );
            },
          });
        }
      );

    return fontCache.promise;
  }

  function syncFontStyle(
    css = ''
  ) {
    if (!fontStyle) {
      fontStyle =
        document.createElement(
          'style'
        );

      fontStyle.id =
        FONT_STYLE_ID;

      document
        .documentElement
        .append(
          fontStyle
        );
    }

    const next =
      String(css || '');

    if (next !== lastFontCss) {
      fontStyle.textContent = next;
      lastFontCss = next;
    }
  }

  function fontCss(
    source = ''
  ) {
    let stack =
      FONTS[
        settings.font
      ] ||
      '';

    let fontFace = '';

    if (
      settings.font ===
      'custom'
    ) {
      stack =
        `"Dragonfly Custom Font",` +
        `${
          settings
            .customFontFallback ||
          'sans-serif'
        }`;

      if (source) {
        const format =
          currentFontFormat();

        fontFace = `
          @font-face {
            font-family:
              "Dragonfly Custom Font";

            src:
              url(${JSON.stringify(
                source
              )})${
                format
                  ? ` format("${format}")`
                  : ''
              };

            font-display:
              swap;

            font-style:
              normal;

            font-weight:
              normal;
          }
        `;
      }
    }

    let css =
      fontFace;

    if (stack) {
      css += `
        html body,
        html body :where(
          a,
          p,
          span,
          div,
          li,
          td,
          th,
          label,
          legend,
          strong,
          b,
          em,
          small,
          time,
          summary,
          h1,
          h2,
          h3,
          h4,
          h5,
          h6,
          button,
          input,
          select,
          textarea,
          option
        ):not([class*="icon" i]):not([class*="fa-" i]):not([class^="fa" i]):not(.${NATIVE.control}):not(.${NATIVE.control} *) {
          font-family:
            ${stack} !important;
        }

      `;
    }

    if (
      settings.textColorEnabled &&
      /^#[\da-f]{6}$/i.test(
        settings.textColor
      )
    ) {
      css += `
        html body .${LIVE.text} {
          color:
            ${settings.textColor} !important;

          -webkit-text-fill-color:
            ${settings.textColor} !important;

          text-decoration-color:
            ${settings.textColor} !important;
        }
      `;
    }

    return css;
  }

  function rememberTextInline(
    element
  ) {
    if (
      textInlineState.has(
        element
      )
    ) {
      return;
    }

    const state = {};

    for (
      const property
      of TEXT_PROPERTIES
    ) {
      state[property] = {
        value:
          element.style
            .getPropertyValue(
              property
            ),

        priority:
          element.style
            .getPropertyPriority(
              property
            ),
      };
    }

    textInlineState.set(
      element,
      state
    );

    textTouched.add(
      element
    );
  }

  function restoreTextInline(
    element
  ) {
    const state =
      textInlineState.get(
        element
      );

    if (!state) {
      return;
    }

    for (
      const [
        property,
        previous,
      ]
      of Object.entries(
        state
      )
    ) {
      if (previous.value) {
        element.style.setProperty(
          property,
          previous.value,
          previous.priority
        );
      } else {
        element.style.removeProperty(
          property
        );
      }
    }

    textInlineState.delete(
      element
    );

    textTouched.delete(
      element
    );
  }

  function clearTextPaint() {
    for (
      const element
      of [...textTouched]
    ) {
      restoreTextInline(
        element
      );
    }
  }

  function paintTextElement(
    element
  ) {
    if (
      !(
        element instanceof
        HTMLElement
      ) ||
      isNativeZone(element) ||
      !settings.textColorEnabled ||
      !/^#[\da-f]{6}$/i.test(
        settings.textColor
      )
    ) {
      return;
    }

    rememberTextInline(
      element
    );

    element.style.setProperty(
      'color',
      settings.textColor,
      'important'
    );

    element.style.setProperty(
      '-webkit-text-fill-color',
      settings.textColor,
      'important'
    );

    element.style.setProperty(
      'text-decoration-color',
      settings.textColor,
      'important'
    );
  }

  function clearLiveClasses() {
    clearTextPaint();

    document
      .querySelectorAll(`
        .${LIVE.surface},
        .${LIVE.blue},
        .${LIVE.neutral},
        .${LIVE.neutralFallback},
        .${LIVE.canvas},
        .${LIVE.shell},
        .${LIVE.round},
        .${LIVE.hoverRound},
        .${LIVE.roundClip},
        .${LIVE.text},
        .${LIVE.canvasImage},
        .${LIVE.neutralImage}
      `)
      .forEach(
        (element) => {
          element.classList.remove(
            LIVE.surface,
            LIVE.blue,
            LIVE.neutral,
            LIVE.neutralFallback,
            LIVE.canvas,
            LIVE.shell,
            LIVE.round,
            LIVE.hoverRound,
            LIVE.roundClip,
            LIVE.text,
            LIVE.canvasImage,
            LIVE.neutralImage
          );

          element.style.removeProperty(
            NEUTRAL_FALLBACK_VAR
          );
        }
      );
  }

  function stripLiveThemeFromSubtree(
    root
  ) {
    if (!(root instanceof Element)) {
      return;
    }

    const elements = [
      root,
      ...root.querySelectorAll('*'),
    ];

    for (const element of elements) {
      stripLiveThemeFromElement(element);
    }
  }

  function stripLiveThemeFromElement(
    element,
    keepRound = false
  ) {
    if (!(element instanceof HTMLElement)) {
      return;
    }

    const classes = [
      LIVE.surface,
      LIVE.blue,
      LIVE.neutral,
      LIVE.neutralFallback,
      LIVE.canvas,
      LIVE.shell,
      LIVE.hoverRound,
      LIVE.roundClip,
      LIVE.text,
      LIVE.canvasImage,
      LIVE.neutralImage,
    ];

    if (!keepRound) {
      classes.push(LIVE.round);
    }

    element.classList.remove(...classes);
    element.style.removeProperty(NEUTRAL_FALLBACK_VAR);
    restoreTextInline(element);
  }

  function scopedElements(
    root,
    selector = '*'
  ) {
    const scope =
      root instanceof Element ||
      root instanceof Document ||
      root instanceof DocumentFragment
        ? root
        : document.body;

    const elements = [];

    if (
      scope instanceof Element
    ) {
      try {
        if (
          scope.matches(selector)
        ) {
          elements.push(scope);
        }
      } catch {
        return elements;
      }
    }

    try {
      elements.push(
        ...scope.querySelectorAll(
          selector
        )
      );
    } catch {
    }

    return elements;
  }

  function markSelectors(
    root,
    selectors,
    ...classes
  ) {
    for (
      const combined
      of selectors
    ) {
      for (
        let selector
        of String(combined)
          .split(',')
      ) {
        selector =
          selector
            .replace(
              /::(?:before|after|marker|selection|placeholder|file-selector-button)/gi,
              ''
            )
            .trim();

        if (
          !selector ||
          /^(?:html|body|:root)$/i
            .test(selector)
        ) {
          continue;
        }

        try {
          scopedElements(
            root,
            selector
          )
            .forEach(
              (element) => {
                if (
                  element instanceof
                    HTMLElement &&
                  !element.closest(
                    `#${ID}-panel`
                  ) &&
                  !isNativeZone(element) &&
                  element.id !==
                    `${ID}-button`
                ) {
                  element.classList.add(
                    ...classes
                  );
                }
              }
            );
        } catch {
        }
      }
    }
  }

  function colorDistance(
    first,
    second
  ) {
    return Math.hypot(
      first.r -
        second.r,

      first.g -
        second.g,

      first.b -
        second.b
    );
  }

  function paletteDistance(
    color,
    group
  ) {
    const colors = [
      settings[
        `${group}Dark`
      ],

      settings[
        `${group}Middle`
      ],

      settings[
        `${group}Light`
      ],
    ]
      .map(
        hexToRgba
      )
      .filter(
        Boolean
      );

    if (
      !colors.length
    ) {
      return Infinity;
    }

    return Math.min(
      ...colors.map(
        (candidate) =>
          colorDistance(
            color,
            candidate
          )
      )
    );
  }

  function computedBackgroundColors(
    element
  ) {
    const computed =
      getComputedStyle(
        element
      );

    const source =
      `${computed.backgroundColor} ` +
      `${computed.backgroundImage}`;

    const expression =
      new RegExp(
        COLOR_RE.source,
        'gi'
      );

    const colors = [];

    for (
      const match
      of source.matchAll(
        expression
      )
    ) {
      const color =
        parseColor(
          match[0]
        );

      if (
        color &&
        color.a > 0.001
      ) {
        colors.push(
          color
        );
      }
    }

    return colors;
  }

  function findWindowShell() {
    const address =
      findAddressInput();

    const explorerRoot =
      address
        ? findChromeRoot(address)
        : null;

    if (explorerRoot) {
      return (
        findOuterFrame(explorerRoot) ||
        explorerRoot
      );
    }

    const candidates =
      [
        ...document.body.children,
      ]
        .filter(
          (element) =>
            element instanceof HTMLElement &&
            ![
              'SCRIPT',
              'STYLE',
              'LINK',
            ].includes(element.tagName) &&
            ![
              `${ID}-button`,
              `${ID}-panel`,
            ].includes(element.id)
        )
        .filter(
          (element) => {
            const rect =
              element.getBoundingClientRect();

            const text =
              normalizedText(element);

            return (
              rect.width >= innerWidth * 0.6 &&
              rect.height >= 100 &&
              (
                text.includes(
                  'Microsoft Internet Explorer'
                ) ||
                Boolean(
                  element.querySelector(
                    'input[type="url"], input[type="text"]'
                  )
                )
              )
            );
          }
        );

    candidates.sort(
      (first, second) => {
        const firstRect =
          first.getBoundingClientRect();

        const secondRect =
          second.getBoundingClientRect();

        return (
          secondRect.width * secondRect.height -
          firstRect.width * firstRect.height
        );
      }
    );

    return candidates[0] || null;
  }

  function computedAlpha(
    value
  ) {
    const color =
      parseColor(
        String(
          value ||
          ''
        )
      );

    return color
      ? color.a
      : 0;
  }

  function hasVisibleSurface(
    element
  ) {
    const computed =
      getComputedStyle(
        element
      );

    const borderWidth =
      (
        parseFloat(
          computed.borderTopWidth
        ) || 0
      ) +
      (
        parseFloat(
          computed.borderRightWidth
        ) || 0
      ) +
      (
        parseFloat(
          computed.borderBottomWidth
        ) || 0
      ) +
      (
        parseFloat(
          computed.borderLeftWidth
        ) || 0
      );

    return (
      computedAlpha(
        computed.backgroundColor
      ) > 0.001 ||
      (
        computed.backgroundImage &&
        computed.backgroundImage !==
          'none'
      ) ||
      borderWidth > 0 ||
      (
        computed.boxShadow &&
        computed.boxShadow !==
          'none'
      )
    );
  }

  function isIndependentRoundCandidate(
    element
  ) {
    if (
      !(
        element instanceof
        HTMLElement
      ) ||
      element.closest(
        `#${ID}-panel`
      ) ||
      element.id ===
        `${ID}-button` ||
      isNativeZone(element) ||
      [
        'HTML',
        'BODY',
        'SCRIPT',
        'STYLE',
        'LINK',
        'META',
        'IMG',
        'SVG',
        'PATH',
        'BR',
      ].includes(
        element.tagName
      )
    ) {
      return false;
    }

    const rect =
      element
        .getBoundingClientRect();

    if (
      rect.width < 12 ||
      rect.height < 12 ||
      (
        rect.width >=
          innerWidth * 0.995 &&
        rect.height >=
          innerHeight * 0.78
      )
    ) {
      return false;
    }

    const computed =
      getComputedStyle(
        element
      );

    if (
      computed.display ===
        'inline' ||
      computed.display ===
        'contents' ||
      computed.display ===
        'none' ||
      computed.visibility ===
        'hidden'
    ) {
      return false;
    }

    const interactive =
      element.matches(`
        a,
        button,
        input,
        select,
        textarea,
        [role="button"]
      `);

    const largeLayout =
      rect.width >= innerWidth * 0.90 &&
      rect.height >= innerHeight * 0.45;

    const pageLike =
      /(?:^|[\s_-])(?:app|root|page|layout|viewport|wrapper|shell)(?:$|[\s_-])/i
        .test(
          `${element.id} ${element.className}`
        );

    if (largeLayout || pageLike) {
      return false;
    }

    return (
      hasVisibleSurface(element) ||
      (
        interactive &&
        (
          rect.width >= 35 ||
          rect.height >= 20
        )
      )
    );
  }

  function directInteractiveRows(
    container
  ) {
    return [
      ...container.children,
    ].filter(
      (child) => {
        if (
          !(
            child instanceof
            HTMLElement
          )
        ) {
          return false;
        }

        const rect =
          child
            .getBoundingClientRect();

        if (
          rect.width < 20 ||
          rect.height < 14
        ) {
          return false;
        }

        return (
          child.matches(`
            a,
            button,
            li,
            tr,
            [role="button"],
            [role="menuitem"]
          `) ||
          Boolean(
            child.querySelector(`
              :scope > a,
              :scope > button,
              :scope > [role="button"],
              :scope > [role="menuitem"]
            `)
          )
        );
      }
    );
  }

  function markIndependentRoundables(
    root = document.body
  ) {
    if (
      !settings.roundedEnabled
    ) {
      return;
    }

    scopedElements(
      root,
      '*'
    )
      .forEach(
        (element) => {
          if (
            !isIndependentRoundCandidate(
              element
            )
          ) {
            return;
          }

          element.classList.add(
            LIVE.round
          );

          if (
            element.matches(`
              a,
              button,
              [role="button"],
              [role="menuitem"]
            `)
          ) {
            element.classList.add(
              LIVE.hoverRound
            );
          }

          const rows =
            directInteractiveRows(
              element
            );

          if (
            rows.length >= 3
          ) {
            const rect =
              element
                .getBoundingClientRect();

            const computed =
              getComputedStyle(
                element
              );

            const text =
              normalizedText(
                element
              );

            const verticallyScrollable =
              ['auto', 'scroll']
                .includes(
                  computed.overflowY
                ) ||
              element.scrollHeight >
                element.clientHeight + 6;

            const popupLike =
              text.includes(
                'Уведомления'
              ) ||
              text.includes(
                'Создание записи'
              ) ||
              /notif|notification|popup|modal|dialog/i
                .test(
                  `${element.id} ${element.className}`
                );

            const narrowNavigation =
              !verticallyScrollable &&
              !popupLike &&
              rect.width <=
                Math.min(
                  360,
                  innerWidth * 0.36
                ) &&
              rect.left <=
                innerWidth * 0.42 &&
              rect.height <=
                Math.max(
                  760,
                  innerHeight * 1.05
                ) &&
              rows.every(
                (row) => {
                  const rowRect =
                    row.getBoundingClientRect();

                  return (
                    rowRect.width >=
                      rect.width * 0.68 &&
                    rowRect.height >= 18 &&
                    rowRect.height <= 96
                  );
                }
              );

            if (narrowNavigation) {
              element.classList.add(
                LIVE.roundClip
              );

              rows.forEach(
                (row) => {
                  row.classList.add(
                    LIVE.hoverRound
                  );

                  row
                    .querySelectorAll(`
                      :scope > a,
                      :scope > button,
                      :scope > [role="button"],
                      :scope > [role="menuitem"]
                    `)
                    .forEach(
                      (control) =>
                        control.classList.add(
                          LIVE.hoverRound
                        )
                    );
                }
              );
            }
          }
        }
      );
  }

  function markTextElements(
    root = document.body
  ) {
    const colorEnabled =
      settings.textColorEnabled &&
      /^#[\da-f]{6}$/i.test(
        settings.textColor
      );

    if (!colorEnabled) {
      return;
    }

    const textTags =
      new Set([
        'A',
        'P',
        'SPAN',
        'LI',
        'TD',
        'TH',
        'LABEL',
        'LEGEND',
        'STRONG',
        'B',
        'EM',
        'I',
        'SMALL',
        'TIME',
        'SUMMARY',
        'H1',
        'H2',
        'H3',
        'H4',
        'H5',
        'H6',
      ]);

    const semanticText =
      /(?:^|[\s_-])(?:user|username|nickname|name|author|title|caption|label|date|time|status|online|notification|notice|message-text|profile-name)(?:$|[\s_-])/i;

    scopedElements(
      root,
      '*'
    )
      .forEach(
        (element) => {
          if (
            !(
              element instanceof
              HTMLElement
            ) ||
            element.closest(
              `#${ID}-panel`
            ) ||
            isNativeZone(element) ||
            isRadioTitleText(element) ||
            element.id ===
              `${ID}-button` ||
            [
              'SCRIPT',
              'STYLE',
              'LINK',
              'META',
              'SVG',
              'PATH',
              'IMG',
              'VIDEO',
              'AUDIO',
              'CANVAS',
            ].includes(
              element.tagName
            )
          ) {
            return;
          }

          const text =
            normalizedText(
              element
            );

          if (!text) {
            return;
          }

          const directText =
            [...element.childNodes]
              .some(
                (node) =>
                  node.nodeType ===
                    Node.TEXT_NODE &&
                  Boolean(
                    String(
                      node.textContent ||
                      ''
                    ).trim()
                  )
              );

          const signature =
            `${element.id || ''} ` +
            `${element.className || ''}`;

          const control =
            element.matches(`
              button,
              input:not([type="color"]),
              textarea,
              select,
              option,
              [role="button"],
              [role="link"]
            `);

          const textElement =
            textTags.has(
              element.tagName
            ) &&
            (
              directText ||
              element.tagName === 'A' ||
              element.children.length <= 3
            );

          const semanticLeaf =
            semanticText.test(
              signature
            ) &&
            element.children.length <= 4;

          const safeLeaf =
            directText &&
            element.children.length === 0 &&
            element.getBoundingClientRect()
              .height <= 100;

          if (
            control ||
            textElement ||
            semanticLeaf ||
            safeLeaf
          ) {
            element.classList.add(
              LIVE.text
            );

            paintTextElement(
              element
            );
          }
        }
      );

    const walkerRoot =
      root instanceof Node
        ? root
        : document.body;

    const walker =
      document.createTreeWalker(
        walkerRoot,
        NodeFilter.SHOW_TEXT
      );

    let textNode;

    while (
      (
        textNode =
          walker.nextNode()
      )
    ) {
      if (
        !String(
          textNode.textContent ||
          ''
        ).trim()
      ) {
        continue;
      }

      const element =
        textNode.parentElement;

      if (
        !(
          element instanceof
          HTMLElement
        ) ||
        element.closest(
          `#${ID}-panel`
        ) ||
        isNativeZone(element) ||
        isRadioTitleText(element) ||
        element.id ===
          `${ID}-button` ||
        [
          'HTML',
          'BODY',
          'SCRIPT',
          'STYLE',
          'LINK',
          'META',
          'SVG',
          'PATH',
          'TITLE',
          'NOSCRIPT',
        ].includes(
          element.tagName
        )
      ) {
        continue;
      }

      element.classList.add(
        LIVE.text
      );

      if (colorEnabled) {
        paintTextElement(
          element
        );
      }
    }
  }

  function markLiveSurfaces(
    statistics,
    reset = true,
    root = document.body
  ) {
    if (root instanceof Element && isNativeZone(root)) {
      stripLiveThemeFromSubtree(root);
      return;
    }

    if (reset) {
      clearLiveClasses();
    }

    markSelectors(
      root,
      statistics.surface,
      LIVE.surface
    );

    markSelectors(
      root,
      statistics.blue,
      LIVE.surface,
      LIVE.blue
    );

    markSelectors(
      root,
      statistics.neutral,
      LIVE.surface,
      LIVE.neutral
    );

    markSelectors(
      root,
      statistics.canvas,
      LIVE.surface,
      LIVE.canvas
    );

    scopedElements(
      root,
      '*'
    )
      .forEach(
        (element) => {
          if (
            !(
              element instanceof
              HTMLElement
            ) ||
            element.closest(
              `#${ID}-panel`
            ) ||
            isNativeZone(element) ||
            element.id ===
              `${ID}-button`
          ) {
            return;
          }

          const rect =
            element
              .getBoundingClientRect();

          if (
            rect.width < 3 ||
            rect.height < 3
          ) {
            return;
          }

          const colors =
            computedBackgroundColors(
              element
            );

          if (
            !colors.length
          ) {
            return;
          }

          const blueDistance =
            settings.blueEnabled
              ? Math.min(
                  ...colors.map(
                    (color) =>
                      paletteDistance(
                        color,
                        'blue'
                      )
                  )
                )
              : Infinity;

          const neutralDistance =
            settings.neutralEnabled
              ? Math.min(
                  ...colors.map(
                    (color) =>
                      paletteDistance(
                        color,
                        'neutral'
                      )
                  )
                )
              : Infinity;

          const canvasDistance =
            settings.canvasEnabled
              ? Math.min(
                  ...colors.map(
                    (color) =>
                      paletteDistance(
                        color,
                        'canvas'
                      )
                  )
                )
              : Infinity;

          const signature =
            `${element.id || ''} ` +
            `${element.className || ''}`;

          const originalMatches =
            colors
              .map(
                (color) => ({
                  color,

                  information:
                    classifyColor(
                      color,
                      'background-color',
                      signature
                    ),
                })
              )
              .filter(
                (match) =>
                  Boolean(
                    match.information
                  )
              );

          const originalBlue =
            originalMatches.some(
              (match) =>
                match.information
                  .group ===
                'blue'
            );

          const originalNeutralMatch =
            originalMatches.find(
              (match) =>
                match.information
                  .group ===
                'neutral'
            );

          const originalNeutral =
            Boolean(
              originalNeutralMatch
            );

          const originalCanvas =
            originalMatches.some(
              (match) =>
                match.information
                  .group ===
                'canvas'
            );

          const control =
            element.matches(`
              button,
              input,
              select,
              textarea,
              option,
              [role="button"]
            `);

          const neutralSurface =
            !control &&
            /(?:card|panel|post|entry|profile|box|window|dialog|modal|notification|message|sidebar|feed|wall|item|content)/i
              .test(
                signature
              );

          const largePageSurface =
            rect.width >=
              innerWidth * 0.98 &&
            rect.height >=
              innerHeight * 0.72;

          if (
            element.classList.contains(
              LIVE.blue
            ) ||
            element.classList.contains(
              LIVE.neutral
            ) ||
            element.classList.contains(
              LIVE.canvas
            )
          ) {
            return;
          }

          if (
            originalBlue ||
            (
              blueDistance <= 78 &&
              blueDistance <=
                neutralDistance &&
              blueDistance <=
                canvasDistance
            )
          ) {
            element.classList.add(
              LIVE.surface,
              LIVE.blue
            );
          } else if (
            !largePageSurface &&
            (
              originalNeutral ||
              (
                neutralSurface &&
                neutralDistance <= 64 &&
                neutralDistance <=
                  blueDistance
              )
            )
          ) {
            element.classList.add(
              LIVE.surface,
              LIVE.neutral
            );

            if (
              originalNeutralMatch
            ) {
              const mappedNeutral =
                paletteColor(
                  'neutral',

                  originalNeutralMatch
                    .information
                    .position,

                  originalNeutralMatch
                    .color
                    .a *
                  groupOpacity(
                    'neutral',
                    'background-color'
                  )
                );

              if (mappedNeutral) {
                element.classList.add(
                  LIVE.neutralFallback
                );

                element.style.setProperty(
                  NEUTRAL_FALLBACK_VAR,
                  colorToCss(
                    mappedNeutral
                  )
                );
              }
            }
          } else if (
            originalCanvas ||
            canvasDistance <= 78
          ) {
            element.classList.add(
              LIVE.surface,
              LIVE.canvas
            );
          }
        }
      );

    markIndependentRoundables(
      root
    );
    markTextElements(
      root
    );

    scopedElements(
      root,
      `.${LIVE.canvas}`
    )
      .forEach(
        (element) => {
          const image =
            getComputedStyle(element)
              .backgroundImage;

          if (
            image &&
            /url\(/i.test(image)
          ) {
            element.classList.add(
              LIVE.canvasImage
            );
          }
        }
      );

    scopedElements(
      root,
      `.${LIVE.neutral}`
    )
      .forEach(
        (element) => {
          const image =
            getComputedStyle(element)
              .backgroundImage;

          if (
            image &&
            /url\(/i.test(image)
          ) {
            element.classList.add(
              LIVE.neutralImage
            );
          }
        }
      );

    const shell =
      reset
        ? findWindowShell()
        : null;

    if (shell) {
      shell.classList.add(
        LIVE.shell
      );

      if (
        settings.canvasEnabled &&
        Number(
          settings
            .canvasTransparency
        ) > 0
      ) {
        shell.classList.add(
          LIVE.surface,
          LIVE.canvas
        );
      }
    }
  }

  function rgbaFromHex(
    value,
    alpha
  ) {
    const color =
      hexToRgba(
        value
      );

    if (!color) {
      return 'transparent';
    }

    return (
      `rgba(` +
      `${color.r},` +
      `${color.g},` +
      `${color.b},` +
      `${Number(
        clamp(
          alpha
        ).toFixed(3)
      )}` +
      `)`
    );
  }

  function firstBackgroundUrl(
    value
  ) {
    const match =
      String(
        value ||
        ''
      ).match(
        /url\((?:"([^"]+)"|'([^']+)'|([^\)]+))\)/i
      );

    const url =
      match &&
      (
        match[1] ||
        match[2] ||
        match[3] ||
        ''
      ).trim();

    return url
      ? `url(${JSON.stringify(
          url
        )})`
      : '';
  }

  function glassBackgroundSource() {
    const wallpaperSource =
      currentWallpaperSource();

    if (
      settings.wallpaperEnabled &&
      wallpaperSource
    ) {
      return (
        `url(` +
        `${JSON.stringify(
          wallpaperSource
        )}` +
        `)`
      );
    }

    return (
      firstBackgroundUrl(
        getComputedStyle(
          document.body
        ).backgroundImage
      ) ||
      firstBackgroundUrl(
        getComputedStyle(
          document.documentElement
        ).backgroundImage
      )
    );
  }

  function normalizedText(
    element
  ) {
    return String(
      element?.textContent ||
      ''
    )
      .replace(
        /\s+/g,
        ' '
      )
      .trim();
  }

  function elementArea(
    element
  ) {
    const rect =
      element
        .getBoundingClientRect();

    return (
      rect.width *
      rect.height
    );
  }

  function elementVisible(
    element
  ) {
    if (
      !(
        element instanceof
          HTMLElement
      )
    ) {
      return false;
    }

    const rect =
      element
        .getBoundingClientRect();

    const computed =
      getComputedStyle(
        element
      );

    return (
      rect.width > 2 &&
      rect.height > 2 &&
      computed.display !==
        'none' &&
      computed.visibility !==
        'hidden'
    );
  }

  function findAddressInput() {
    return (
      [
        ...document
          .querySelectorAll(`
            input[type="text"],
            input[type="url"],
            input:not([type])
          `),
      ].find(
        (input) => {
          const value =
            String(
              input.value ||
              input.getAttribute(
                'value'
              ) ||
              ''
            ).trim();

          return (
            /^https?:\/\//i
              .test(value) ||
            value.includes(
              'dragonfly-flash.com'
            ) ||
            value.includes(
              'dragonfly-flash.ru'
            )
          );
        }
      ) ||
      null
    );
  }

  function findChromeRoot(
    address
  ) {
    if (!address) {
      return null;
    }

    const candidates = [];
    let current =
      address.parentElement;

    while (
      current &&
      current !==
        document.body
    ) {
      if (
        current instanceof
          HTMLElement &&
        elementVisible(
          current
        )
      ) {
        const rect =
          current
            .getBoundingClientRect();

        const text =
          normalizedText(
            current
          );

        const hasIdentity =
          text.includes(
            'Microsoft Internet Explorer'
          ) &&
          text.includes(
            'Стрекоза'
          );

        const hasMenu =
          [
            'File',
            'Edit',
            'View',
            'Favorites',
            'Tools',
            'Help',
          ].filter(
            (token) =>
              text.includes(
                token
              )
          ).length >= 4;

        const hasToolbar =
          [
            'Back',
            'Search',
            'Favorites',
            'Media',
          ].filter(
            (token) =>
              text.includes(
                token
              )
          ).length >= 3;

        if (
          hasIdentity &&
          hasMenu &&
          hasToolbar &&
          rect.width >=
            innerWidth *
            0.55 &&
          rect.height >= 110 &&
          rect.height <= 380 &&
          rect.top <= 90
        ) {
          candidates.push(
            current
          );
        }
      }

      current =
        current.parentElement;
    }

    candidates.sort(
      (
        first,
        second
      ) =>
        elementArea(first) -
        elementArea(second)
    );

    return (
      candidates[0] ||
      null
    );
  }

  function sameOuterGeometry(
    inner,
    outer
  ) {
    const first =
      inner
        .getBoundingClientRect();

    const second =
      outer
        .getBoundingClientRect();

    return (
      Math.abs(
        first.left -
        second.left
      ) <= 12 &&

      Math.abs(
        first.right -
        second.right
      ) <= 12 &&

      Math.abs(
        first.top -
        second.top
      ) <= 12 &&

      second.bottom <=
        first.bottom +
        28 &&

      second.width >=
        first.width *
        0.97 &&

      second.width <=
        first.width *
        1.04 &&

      second.height >=
        first.height *
        0.97 &&

      second.height <=
        first.height *
        1.12
    );
  }

  function findOuterFrame(
    root
  ) {
    let frame = root;
    let current =
      root?.parentElement ||
      null;

    let depth = 0;

    while (
      current &&
      current !==
        document.body &&
      current !==
        document.documentElement &&
      depth < 4
    ) {
      if (
        !elementVisible(
          current
        ) ||
        !sameOuterGeometry(
          frame,
          current
        )
      ) {
        break;
      }

      frame = current;
      current =
        current.parentElement;
      depth += 1;
    }

    return frame;
  }

  function findSmallestWideMatch(
    root,
    predicate
  ) {
    if (!root) {
      return null;
    }

    const rootRect =
      root
        .getBoundingClientRect();

    return (
      [
        ...root
          .querySelectorAll('*'),
      ]
        .filter(
          (element) =>
            element instanceof
              HTMLElement
        )
        .filter(
          (element) => {
            if (
              !elementVisible(
                element
              ) ||
              element.closest(
                `#${ID}-panel`
              ) ||
              element.id ===
                `${ID}-button`
            ) {
              return false;
            }

            const rect =
              element
                .getBoundingClientRect();

            return (
              rect.width >=
                rootRect.width *
                0.55 &&
              rect.height >= 14 &&
              rect.height <= 105 &&
              rect.top >=
                rootRect.top -
                4 &&
              rect.top <=
                rootRect.top +
                330 &&
              predicate(
                element,
                rect
              )
            );
          }
        )
        .sort(
          (
            first,
            second
          ) =>
            elementArea(first) -
            elementArea(second)
        )[0] ||
      null
    );
  }

  function findAddressBand(
    address,
    root
  ) {
    if (
      !address ||
      !root
    ) {
      return null;
    }

    const rootRect =
      root
        .getBoundingClientRect();

    let current = address;

    for (
      let depth = 0;
      depth < 7 &&
      current;
      depth += 1
    ) {
      const rect =
        current
          .getBoundingClientRect();

      if (
        current !== root &&
        rect.width >=
          rootRect.width *
          0.58 &&
        rect.height >= 18 &&
        rect.height <= 90
      ) {
        return current;
      }

      if (current === root) {
        break;
      }

      current =
        current.parentElement;
    }

    return address;
  }

  function addBandAndWrappers(
    collection,
    band,
    root,
    excluded = null
  ) {
    if (
      !(
        band instanceof
          HTMLElement
      ) ||
      band === excluded
    ) {
      return;
    }

    collection.add(band);

    const rootRect =
      root
        .getBoundingClientRect();

    let current =
      band.parentElement;

    for (
      let depth = 0;
      depth < 3 &&
      current &&
      current !== root;
      depth += 1
    ) {
      if (
        current === excluded ||
        current.contains(
          excluded
        )
      ) {
        break;
      }

      const rect =
        current
          .getBoundingClientRect();

      if (
        rect.width >=
          rootRect.width *
          0.72 &&
        rect.height <= 108 &&
        rect.top <=
          rootRect.top +
          330
      ) {
        collection.add(
          current
        );
      }

      current =
        current.parentElement;
    }
  }

  function findExplorerTitleParts(
    root
  ) {
    if (!root) {
      return {
        title: null,
        layers: [],
      };
    }

    const rootRect =
      root.getBoundingClientRect();

    const menuTokens = [
      'File',
      'Edit',
      'View',
      'Favorites',
      'Tools',
      'Help',
    ];

    const candidates =
      [...root.querySelectorAll('*')]
        .filter(
          (element) => {
            if (
              !(
                element instanceof
                HTMLElement
              ) ||
              !elementVisible(
                element
              )
            ) {
              return false;
            }

            const rect =
              element.getBoundingClientRect();

            const text =
              normalizedText(
                element
              );

            const menuHits =
              menuTokens.filter(
                (token) =>
                  text.includes(
                    token
                  )
              ).length;

            return (
              text.includes(
                'Microsoft Internet Explorer'
              ) &&
              menuHits === 0 &&
              rect.top >=
                rootRect.top - 5 &&
              rect.top <=
                rootRect.top + 16 &&
              rect.width >=
                rootRect.width * 0.55 &&
              rect.height >= 18 &&
              rect.height <= 70
            );
          }
        )
        .sort(
          (first, second) => {
            const firstRect =
              first.getBoundingClientRect();

            const secondRect =
              second.getBoundingClientRect();

            return (
              secondRect.width -
              firstRect.width
            );
          }
        );

    const title =
      candidates[0] ||
      findSmallestWideMatch(
        root,
        (element) =>
          normalizedText(
            element
          ).includes(
            'Microsoft Internet Explorer'
          )
      );

    if (!title) {
      return {
        title: null,
        layers: [],
      };
    }

    const titleRect =
      title.getBoundingClientRect();

    const layers =
      new Set([
        title,
      ]);

    title.querySelectorAll('*')
      .forEach(
        (element) => {
          if (
            !(
              element instanceof
              HTMLElement
            ) ||
            !elementVisible(
              element
            )
          ) {
            return;
          }

          const rect =
            element.getBoundingClientRect();

          const fillsTitle =
            Math.abs(
              rect.left -
              titleRect.left
            ) <= 5 &&
            Math.abs(
              rect.right -
              titleRect.right
            ) <= 5 &&
            Math.abs(
              rect.top -
              titleRect.top
            ) <= 5 &&
            Math.abs(
              rect.bottom -
              titleRect.bottom
            ) <= 6;

          if (fillsTitle) {
            layers.add(
              element
            );
          }
        }
      );

    return {
      title,
      layers:
        [...layers],
    };
  }

  function findExplorerParts(
    root,
    address
  ) {
    const titleInformation =
      findExplorerTitleParts(
        root
      );

    const title =
      titleInformation.title;

    const bands =
      new Set();

    const menu =
      findSmallestWideMatch(
        root,

        (element) => {
          const text =
            normalizedText(
              element
            );

          return (
            [
              'File',
              'Edit',
              'View',
              'Favorites',
              'Tools',
              'Help',
            ].filter(
              (token) =>
                text.includes(
                  token
                )
            ).length >= 4
          );
        }
      );

    const toolbar =
      findSmallestWideMatch(
        root,

        (element) => {
          const text =
            normalizedText(
              element
            );

          return (
            [
              'Back',
              'Search',
              'Favorites',
              'Media',
            ].filter(
              (token) =>
                text.includes(
                  token
                )
            ).length >= 3
          );
        }
      );

    const addressBand =
      findAddressBand(
        address,
        root
      );

    const addressBottom =
      address
        .getBoundingClientRect()
        .bottom;

    const siteBand =
      findSmallestWideMatch(
        root,

        (
          element,
          rect
        ) =>
          normalizedText(
            element
          ).includes(
            'Стрекоза'
          ) &&
          rect.top >=
            addressBottom -
            10
      );

    addBandAndWrappers(
      bands,
      menu,
      root,
      title
    );

    addBandAndWrappers(
      bands,
      toolbar,
      root,
      title
    );

    addBandAndWrappers(
      bands,
      addressBand,
      root,
      title
    );

    addBandAndWrappers(
      bands,
      siteBand,
      root,
      title
    );

    return {
      title,
      titleLayers:
        titleInformation.layers,
      addressBand,
      bands:
        [...bands].filter(
          (element) =>
            element !== root &&
            element !== title &&
            !element.contains(
              title
            )
        ),
    };
  }

  function removeGlassLayer() {
    document
      .querySelectorAll(
        `.${INTEGRATED.glassLayer}`
      )
      .forEach(
        (element) =>
          element.remove()
      );
  }

  function ensureGlassLayer(
    root
  ) {
    removeGlassLayer();

    if (
      !(
        root instanceof
          HTMLElement
      )
    ) {
      return;
    }

    const layer =
      document.createElement(
        'div'
      );

    layer.className =
      INTEGRATED.glassLayer;

    layer.setAttribute(
      'aria-hidden',
      'true'
    );

    root.classList.add(
      INTEGRATED.glassRoot
    );

    root.prepend(layer);
  }

  const POPUP_PROPERTIES = [
    'background',
    'background-color',
    'background-image',
    'background-blend-mode',
    'opacity',
    '-webkit-backdrop-filter',
    'backdrop-filter',
    'filter',
    'mix-blend-mode',
  ];

  function rememberPopupInline(
    element,
    properties =
      POPUP_PROPERTIES
  ) {
    if (
      popupInlineState.has(
        element
      )
    ) {
      return;
    }

    const state = {};

    for (
      const property
      of properties
    ) {
      state[property] = {
        value:
          element.style
            .getPropertyValue(
              property
            ),

        priority:
          element.style
            .getPropertyPriority(
              property
            ),
      };
    }

    popupInlineState.set(
      element,
      state
    );

    popupTouched.add(
      element
    );
  }

  function restorePopupInline(
    element
  ) {
    const state =
      popupInlineState.get(
        element
      );

    if (!state) {
      return;
    }

    for (
      const [
        property,
        previous,
      ]
      of Object.entries(
        state
      )
    ) {
      if (previous.value) {
        element.style
          .setProperty(
            property,
            previous.value,
            previous.priority
          );
      } else {
        element.style
          .removeProperty(
            property
          );
      }
    }

    popupInlineState.delete(
      element
    );

    popupTouched.delete(
      element
    );
  }

  function clearPopupPaint() {
    for (
      const element
      of [...popupTouched]
    ) {
      restorePopupInline(
        element
      );
    }
  }

  function paintOpaque(
    element,
    color
  ) {
    if (
      !(
        element instanceof
          HTMLElement
      )
    ) {
      return;
    }

    rememberPopupInline(
      element
    );

    element.style.setProperty(
      'background',
      color,
      'important'
    );

    element.style.setProperty(
      'background-color',
      color,
      'important'
    );

    element.style.setProperty(
      'background-image',
      'none',
      'important'
    );

    element.style.setProperty(
      'background-blend-mode',
      'normal',
      'important'
    );

    element.style.setProperty(
      'opacity',
      '1',
      'important'
    );

    element.style.setProperty(
      '-webkit-backdrop-filter',
      'none',
      'important'
    );

    element.style.setProperty(
      'backdrop-filter',
      'none',
      'important'
    );

    element.style.setProperty(
      'filter',
      'none',
      'important'
    );

    element.style.setProperty(
      'mix-blend-mode',
      'normal',
      'important'
    );
  }

  function opaqueCssColors(
    value
  ) {
    return String(value || '')
      .replace(
        COLOR_RE,
        (token) => {
          const color =
            parseColor(token);

          if (
            !color ||
            color.a <= 0 ||
            color.a >= 0.999
          ) {
            return token;
          }

          return colorToCss({
            ...color,
            a: 1,
          });
        }
      );
  }

  function makeRadioPopupOpaque(
    root
  ) {
    if (
      !(
        root instanceof
          HTMLElement
      )
    ) {
      return;
    }

    const elements = [
      root,
      ...root.querySelectorAll('*'),
    ];

    for (const element of elements) {
      if (!(element instanceof HTMLElement)) {
        continue;
      }

      const computed =
        getComputedStyle(element);

      const color =
        parseColor(
          computed.backgroundColor
        );

      const opaqueImage =
        opaqueCssColors(
          computed.backgroundImage
        );

      const imageChanged =
        computed.backgroundImage !== 'none' &&
        opaqueImage !== computed.backgroundImage;

      const colorChanged =
        color &&
        color.a > 0 &&
        color.a < 0.999;

      const opacityChanged =
        Number(computed.opacity) < 0.999;

      if (
        !imageChanged &&
        !colorChanged &&
        !opacityChanged
      ) {
        continue;
      }

      rememberPopupInline(
        element
      );

      if (colorChanged) {
        element.style.setProperty(
          'background-color',
          colorToCss({
            ...color,
            a: 1,
          }),
          'important'
        );
      }

      if (imageChanged) {
        element.style.setProperty(
          'background-image',
          opaqueImage,
          'important'
        );
      }

      if (opacityChanged) {
        element.style.setProperty(
          'opacity',
          '1',
          'important'
        );
      }
    }
  }

  function restoreRadioTitleText(
    header
  ) {
    if (!(header instanceof HTMLElement)) {
      return;
    }

    const elements = [
      header,
      ...header.querySelectorAll('*'),
    ];

    for (const element of elements) {
      if (!(element instanceof HTMLElement)) {
        continue;
      }

      element.classList.remove(
        LIVE.text
      );

      restoreTextInline(
        element
      );
    }
  }

  function isRadioTitleText(
    element
  ) {
    if (!(element instanceof Element)) {
      return false;
    }

    const titleBand =
      element.closest(
        `.${INTEGRATED.popupTitle}`
      );

    return Boolean(
      titleBand &&
      titleBand.closest(
        `.${INTEGRATED.popupRadio}`
      )
    );
  }

  function findExactText(
    text
  ) {
    const candidates =
      [
        ...document
          .querySelectorAll('*'),
      ]
        .filter(
          (element) =>
            element instanceof
              HTMLElement &&
            !element.closest(
              `#${ID}-panel`
            ) &&
            normalizedText(
              element
            ) === text
        )
        .sort(
          (
            first,
            second
          ) =>
            elementArea(first) -
            elementArea(second)
        );

    return (
      candidates[0] ||
      null
    );
  }

  function findPopupRoot(
    title,
    type
  ) {
    if (!title) {
      return null;
    }

    const candidates = [];
    let current = title;

    for (
      let depth = 0;
      depth < 10 &&
      current.parentElement;
      depth += 1
    ) {
      current =
        current.parentElement;

      if (
        current ===
        document.body
      ) {
        break;
      }

      const rect =
        current
          .getBoundingClientRect();

      const text =
        normalizedText(
          current
        );

      const plausibleSize =
        rect.width >= 180 &&
        rect.width <=
          Math.min(
            980,
            innerWidth *
            0.98
          ) &&
        rect.height >= 55 &&
        rect.height <=
          Math.max(
            innerHeight *
            1.4,
            1000
          );

      if (!plausibleSize) {
        continue;
      }

      const contentMatches =
        type === 'notice'
          ? (
            current
              .querySelectorAll('a')
              .length >= 2 ||
            /оценил|комментар|ответил|заявк/i
              .test(text)
          )
          : type === 'radio'
            ? (
              text.includes(
                'Радиостанции в эфире'
              ) &&
              (
                /\bFM\b/i.test(text) ||
                current.querySelectorAll(
                  'a,button'
                ).length >= 1
              )
            )
            : (
              Boolean(
                current.querySelector(
                  'textarea'
                )
              ) ||
              (
                text.includes(
                  'Опубликовать'
                ) &&
                text.includes(
                  'Отмена'
                )
              )
            );

      if (contentMatches) {
        candidates.push(
          current
        );
      }
    }

    candidates.sort(
      (
        first,
        second
      ) =>
        elementArea(first) -
        elementArea(second)
    );

    return (
      candidates[0] ||
      null
    );
  }

  function findPopupTitleBand(
    root,
    title
  ) {
    if (
      !root ||
      !title
    ) {
      return null;
    }

    const rootRect =
      root
        .getBoundingClientRect();

    let current = title;
    let best = title;

    while (
      current &&
      current !== root &&
      current.parentElement
    ) {
      const rect =
        current
          .getBoundingClientRect();

      if (
        rect.width >=
          rootRect.width *
          0.6 &&
        rect.height >= 16 &&
        rect.height <= 72
      ) {
        best = current;
      }

      current =
        current.parentElement;
    }

    return best;
  }

  function headerAppearance(
    header
  ) {
    if (
      !(
        header instanceof
          HTMLElement
      )
    ) {
      return null;
    }

    const computed =
      getComputedStyle(
        header
      );

    return {
      background:
        computed.background,

      backgroundColor:
        computed.backgroundColor,

      backgroundImage:
        computed.backgroundImage,

      opacity:
        computed.opacity,
    };
  }

  function restoreHeaderAppearance(
    header,
    appearance
  ) {
    if (
      !(
        header instanceof
          HTMLElement
      ) ||
      !appearance
    ) {
      return;
    }

    rememberPopupInline(
      header,
      [
        'background',
        'background-color',
        'background-image',
        'opacity',
      ]
    );

    header.style.setProperty(
      'background',
      appearance.background,
      'important'
    );

    header.style.setProperty(
      'background-color',
      appearance.backgroundColor,
      'important'
    );

    header.style.setProperty(
      'background-image',
      appearance.backgroundImage,
      'important'
    );

    header.style.setProperty(
      'opacity',
      appearance.opacity ||
      '1',
      'important'
    );
  }

  function popupIsOpen(
    popup
  ) {
    if (
      !(
        popup instanceof
          HTMLElement
      ) ||
      !popup.isConnected
    ) {
      return false;
    }

    const computed =
      getComputedStyle(
        popup
      );

    const rect =
      popup
        .getBoundingClientRect();

    return (
      computed.display !==
        'none' &&
      computed.visibility !==
        'hidden' &&
      rect.width > 2 &&
      rect.height > 2
    );
  }

  function markUnclippedPopup(
    popup
  ) {
    document
      .querySelectorAll(`
        .${LIVE.shell},
        .${INTEGRATED.explorerFrame},
        .${INTEGRATED.explorerRoot}
      `)
      .forEach(
        (element) =>
          element.classList.add(
            INTEGRATED.popupOpen
          )
      );

    let current =
      popup?.parentElement ||
      null;

    for (
      let depth = 0;
      current &&
      current !==
        document.body &&
      depth < 16;
      depth += 1
    ) {
      const computed =
        getComputedStyle(
          current
        );

      const clips =
        computed.overflow !==
          'visible' ||
        computed.overflowX !==
          'visible' ||
        computed.overflowY !==
          'visible' ||
        computed.clip !==
          'auto' ||
        computed.clipPath !==
          'none' ||
        computed.contain !==
          'none';

      if (clips) {
        current.classList.add(
          INTEGRATED.popupOpen
        );
      }

      current =
        current.parentElement;
    }
  }

  function paintPopup(
    type,
    titleText,
    color
  ) {
    const title =
      findExactText(
        titleText
      );

    const root =
      findPopupRoot(
        title,
        type
      );

    if (
      !title ||
      !root
    ) {
      return null;
    }

    const header =
      findPopupTitleBand(
        root,
        title
      );

    [
      root,
      ...root.querySelectorAll(
        `.${LIVE.roundClip}`
      ),
    ].forEach(
      (element) =>
        element.classList.remove(
          LIVE.roundClip
        )
    );

    root.classList.add(
      INTEGRATED.popupRoot,

      type === 'notice'
        ? INTEGRATED.popupNotice
        : type === 'radio'
          ? INTEGRATED.popupRadio
          : INTEGRATED.popupComposer
    );

    header?.classList.add(
      INTEGRATED.popupTitle
    );

    if (type === 'radio') {
      restoreRadioTitleText(
        header
      );
    }

    if (
      type !== 'radio' &&
      settings.popupOpaqueEnabled &&
      /^#[\da-f]{6}$/i
        .test(color)
    ) {
      const appearance =
        headerAppearance(
          header
        );

      paintOpaque(
        root,
        color
      );

      restoreHeaderAppearance(
        header,
        appearance
      );

      root
        .querySelectorAll(`
          .${LIVE.canvas}:not(.${LIVE.blue}),
          .${LIVE.neutral}:not(.${LIVE.blue}),
          [class*="${ID}-canvas"]:not(.${LIVE.blue}),
          [class*="${ID}-neutral"]:not(.${LIVE.blue})
        `)
        .forEach(
          (surface) =>
            paintOpaque(
              surface,
              color
            )
        );

      if (type === 'composer') {
        root
          .querySelectorAll(`
            textarea,
            input[type="text"],
            input[type="url"],
            [contenteditable="true"]
          `)
          .forEach(
            (field) =>
              paintOpaque(
                field,
                color
              )
          );
      }
    }

    if (
      type === 'radio' &&
      settings.popupOpaqueEnabled
    ) {
      makeRadioPopupOpaque(
        root
      );
    }

    if (
      type === 'notice' &&
      popupIsOpen(
        root
      )
    ) {
      markUnclippedPopup(
        root
      );
    }

    return root;
  }

  const bannerInlineState = new WeakMap();
  let activeBannerElement = null;
  let activeBannerProfileId = '';
  const activeBannerTouched = new Set();

  function rememberBannerInline(
    element
  ) {
    if (bannerInlineState.has(element)) {
      return;
    }

    const properties = [
      'background',
      'background-image',
      'background-size',
      'background-position',
      'background-repeat',
      'background-color',
      'background-blend-mode',
      'object-fit',
      'object-position',
      'opacity',
      'visibility',
      'overflow',
      'overflow-x',
      'overflow-y',
      'clip',
      'clip-path',
      'contain',
      'position',
      '--df-theme-v56-banner-image',
      '--df-theme-v56-banner-size',
      '--df-theme-v56-banner-position',
      '--df-theme-v56-banner-height',
      '--df-theme-v56-banner-fallback',
    ];

    const state = {
      src:
        element instanceof HTMLImageElement
          ? element.getAttribute('src')
          : null,
      properties: {},
    };

    for (const property of properties) {
      state.properties[property] = {
        value: element.style.getPropertyValue(property),
        priority: element.style.getPropertyPriority(property),
      };
    }

    bannerInlineState.set(element, state);
  }

  function restoreBannerInline(
    element
  ) {
    const state = bannerInlineState.get(element);
    if (!state) return;

    if (element instanceof HTMLImageElement) {
      if (state.src === null) element.removeAttribute('src');
      else element.setAttribute('src', state.src);
    }

    for (const [property, previous] of Object.entries(state.properties)) {
      if (previous.value) {
        element.style.setProperty(property, previous.value, previous.priority);
      } else {
        element.style.removeProperty(property);
      }
    }

    bannerInlineState.delete(element);
  }

  function currentProfileId() {
    try {
      const id = new URL(location.href).searchParams.get('id');
      return String(id || '').trim();
    } catch {
      return '';
    }
  }

  function restoreBannerTouchedOnly() {
    for (const element of [...activeBannerTouched]) {
      if (element instanceof HTMLElement) {
        restoreBannerInline(element);
        element.classList.remove(
          NATIVE.banner,
          NATIVE.bannerHost,
          NATIVE.bannerNative
        );
      }
    }

    activeBannerTouched.clear();
  }

  function restoreActiveBannerCustomization() {
    restoreBannerTouchedOnly();
    activeBannerElement = null;
    activeBannerProfileId = '';
  }

  function bannerColorLooksDecorative(
    color
  ) {
    const parsed = parseColor(String(color || ''));

    if (!parsed || parsed.a < 0.08) {
      return false;
    }

    const hsl = rgbToHsl(parsed);
    const hue = (((hsl.h % 1) + 1) % 1) * 360;

    const greenLike =
      hue >= 55 &&
      hue <= 165 &&
      hsl.s >= 0.22 &&
      hsl.l >= 0.16 &&
      hsl.l <= 0.88;

    const whiteLike =
      hsl.s <= 0.18 &&
      hsl.l >= 0.78;

    return greenLike || whiteLike;
  }

  function bannerLayerHasProfileContent(
    element
  ) {
    if (!(element instanceof HTMLElement)) {
      return true;
    }

    const text = normalizedText(element).trim();

    if (text.length > 8) {
      return true;
    }

    if (
      element.querySelector(
        'a[href],button,input,textarea,select,[contenteditable="true"],[role="button"]'
      )
    ) {
      return true;
    }

    const contentImage = [
      ...element.querySelectorAll('img')
    ].some((image) => {
      const rect = image.getBoundingClientRect();
      const ratio = rect.width / Math.max(1, rect.height);

      return (
        rect.width >= 24 &&
        rect.height >= 24 &&
        rect.width <= 260 &&
        rect.height <= 260 &&
        ratio >= 0.55 &&
        ratio <= 1.8
      );
    });

    return contentImage;
  }

  function bannerVisualLayers(
    host,
    referenceWidth
  ) {
    if (!(host instanceof HTMLElement)) return [];

    const hostRect = host.getBoundingClientRect();
    const width = Math.max(1, referenceWidth || hostRect.width);
    const topLimit =
      hostRect.top +
      Math.min(
        235,
        Math.max(
          120,
          hostRect.height
        )
      );

    return [
      ...host.querySelectorAll(
        'div,section,header,aside,figure,picture,img'
      ),
    ].filter((element) => {
      if (
        !(element instanceof HTMLElement) ||
        element === host ||
        element.closest(`#${ID}-panel`)
      ) {
        return false;
      }

      const rect = element.getBoundingClientRect();
      const ratio = rect.width / Math.max(1, rect.height);

      if (
        rect.width < width * 0.68 ||
        rect.height < 8 ||
        rect.height > 190 ||
        ratio < 2.7 ||
        rect.top < hostRect.top - 8 ||
        rect.top > topLimit ||
        rect.bottom > hostRect.top + 245
      ) {
        return false;
      }

      if (bannerLayerHasProfileContent(element)) {
        return false;
      }

      if (element instanceof HTMLImageElement) {
        return true;
      }

      try {
        const computed = getComputedStyle(element);
        const signature = `${element.id || ''} ${element.className || ''}`;

        const painted =
          String(computed.backgroundImage || 'none') !== 'none' ||
          bannerColorLooksDecorative(computed.backgroundColor);

        const named =
          /banner|cover|grass|cloud|sky|landscape|profile[-_ ]?bg/i
            .test(signature);

        const emptyWideStrip =
          rect.width >= width * 0.78 &&
          rect.height <= 165;

        return painted || named || emptyWideStrip;
      } catch {
        return false;
      }
    });
  }

  function bannerHostFor(
    primary
  ) {
    if (!(primary instanceof HTMLElement)) {
      return { host: primary, layers: primary ? [primary] : [] };
    }

    const primaryRect = primary.getBoundingClientRect();
    let node = primary.parentElement;
    let fallback = null;

    for (
      let depth = 0;
      node &&
      node !== document.body &&
      depth < 6;
      depth += 1
    ) {
      const rect = node.getBoundingClientRect();

      const plausible =
        rect.width >= primaryRect.width * 0.88 &&
        rect.width <= primaryRect.width * 1.14 &&
        rect.height >= primaryRect.height &&
        rect.height <= 390 &&
        rect.top <= primaryRect.top + 16 &&
        rect.top >= primaryRect.top - 42 &&
        rect.bottom >= primaryRect.bottom - 4;

      if (plausible) {
        const layers = bannerVisualLayers(node, primaryRect.width);

        if (layers.length >= 2) {
          return { host: node, layers };
        }

        if (!fallback && layers.length >= 1) {
          fallback = { host: node, layers };
        }
      }

      if (rect.height > 480) {
        break;
      }

      node = node.parentElement;
    }

    if (fallback) {
      return fallback;
    }

    return {
      host: primary,
      layers: primary instanceof HTMLImageElement ? [primary] : [],
    };
  }

  function bannerRegionHeight(
    host,
    primary,
    layers
  ) {
    if (!(host instanceof HTMLElement)) {
      return 0;
    }

    const hostRect = host.getBoundingClientRect();
    const rects = [];

    if (primary instanceof HTMLElement && primary !== host) {
      rects.push(primary.getBoundingClientRect());
    }

    for (const layer of layers || []) {
      if (
        layer instanceof HTMLElement &&
        layer !== host
      ) {
        rects.push(layer.getBoundingClientRect());
      }
    }

    let bottom =
      rects.length
        ? Math.max(...rects.map((rect) => rect.bottom))
        : hostRect.top + Math.min(180, hostRect.height);

    let height =
      bottom -
      hostRect.top;

    height = Math.max(
      70,
      Math.min(
        245,
        hostRect.height,
        height
      )
    );

    return height;
  }

  function likelyProfileBanner() {
    if (!document.body || !currentProfileId()) return null;

    const candidates = [];
    const nodes = [
      ...document.querySelectorAll(`
        [class*="banner" i],
        [id*="banner" i],
        [class*="cover" i],
        [id*="cover" i],
        [class*="profile" i][class*="header" i],
        [id*="profile" i][id*="header" i],
        img
      `),
    ];

    nodes.push(
      ...[...document.querySelectorAll('div,section,header')]
        .filter((element) => {
          try {
            return getComputedStyle(element).backgroundImage !== 'none';
          } catch {
            return false;
          }
        })
    );

    for (const element of new Set(nodes)) {
      if (
        !(element instanceof HTMLElement) ||
        element.closest(`#${ID}-panel`) ||
        element.closest(`.${NATIVE.viewer}`)
      ) {
        continue;
      }

      const rect = element.getBoundingClientRect();
      const ratio = rect.width / Math.max(1, rect.height);

      if (
        rect.width < Math.min(520, innerWidth * 0.5) ||
        rect.height < 55 ||
        rect.height > 280 ||
        ratio < 4 ||
        rect.bottom < 0 ||
        rect.top > Math.min(innerHeight * 0.65, 620)
      ) {
        continue;
      }

      const signature = `${element.id || ''} ${element.className || ''}`;
      let score = rect.width / Math.max(1, innerWidth) * 20;

      if (/banner|cover/i.test(signature)) score += 35;
      if (/profile|header/i.test(signature)) score += 8;
      if (element instanceof HTMLImageElement) score += 5;

      try {
        if (getComputedStyle(element).backgroundImage !== 'none') score += 12;
      } catch {}

      candidates.push({ element, score, area: rect.width * rect.height });
    }

    candidates.sort((a, b) =>
      (b.score - a.score) || (b.area - a.area)
    );

    return candidates[0]?.element || null;
  }

  function applyBannerCustomization(
    primary
  ) {
    if (!(primary instanceof HTMLElement)) return;

    const source = currentBannerSource();

    if (!currentProfileId()) {
      restoreActiveBannerCustomization();
      return;
    }

    if (!settings.bannerEnabled || !source) {
      restoreBannerTouchedOnly();
      primary.classList.add(NATIVE.banner);
      stripLiveThemeFromElement(primary, true);
      return;
    }

    const { host, layers } = bannerHostFor(primary);
    if (!(host instanceof HTMLElement)) return;

    const touched = new Set([host, ...layers]);

    for (const old of [...activeBannerTouched]) {
      if (!touched.has(old)) {
        restoreBannerInline(old);
        old.classList.remove(
          NATIVE.banner,
          NATIVE.bannerHost,
          NATIVE.bannerNative
        );
        activeBannerTouched.delete(old);
      }
    }

    const mode = String(settings.bannerMode || 'cover');
    const position =
      String(settings.bannerPosition || 'center center').trim() ||
      'center center';

    for (const element of touched) {
      if (!(element instanceof HTMLElement)) continue;

      rememberBannerInline(element);
      activeBannerTouched.add(element);
      element.classList.add(NATIVE.banner);

      stripLiveThemeFromElement(element, true);

      if (element === host) {
        element.classList.add(NATIVE.bannerHost);
        element.classList.remove(NATIVE.bannerNative);
      } else {
        element.classList.add(NATIVE.bannerNative);
        element.classList.remove(NATIVE.bannerHost);
      }
    }

    host
      .querySelectorAll(`.${LIVE.roundClip}`)
      .forEach((element) =>
        element.classList.remove(LIVE.roundClip)
      );

    if (host instanceof HTMLImageElement) {
      const current = String(host.currentSrc || host.src || '');

      if (current !== source) {
        host.src = source;
      }

      host.style.setProperty(
        'object-fit',
        mode === 'stretch' ? 'fill' : mode,
        'important'
      );
      host.style.setProperty(
        'object-position',
        position,
        'important'
      );

      return;
    }

    host.style.setProperty(
      'background-color',
      settings.neutralEnabled
        ? settings.neutralLight
        : '#ffffff',
      'important'
    );
    host.style.setProperty(
      'background-image',
      `url(${JSON.stringify(source)})`,
      'important'
    );
    host.style.setProperty(
      'background-size',
      mode === 'stretch'
        ? '100% 100%'
        : mode,
      'important'
    );
    host.style.setProperty(
      'background-position',
      position,
      'important'
    );
    host.style.setProperty(
      'background-repeat',
      'no-repeat',
      'important'
    );
    host.style.setProperty(
      'background-blend-mode',
      'normal',
      'important'
    );

    for (const layer of layers) {
      if (
        !(layer instanceof HTMLElement) ||
        layer === host
      ) {
        continue;
      }

      if (bannerLayerHasProfileContent(layer)) {
        continue;
      }

      if (layer instanceof HTMLImageElement) {
        layer.style.setProperty(
          'opacity',
          '0',
          'important'
        );
      } else {
        layer.style.setProperty(
          'background',
          'transparent',
          'important'
        );
        layer.style.setProperty(
          'background-image',
          'none',
          'important'
        );
        layer.style.setProperty(
          'background-color',
          'transparent',
          'important'
        );
        layer.style.setProperty(
          'background-blend-mode',
          'normal',
          'important'
        );
      }
    }
  }

  function findRecordViewerRoot() {
    const addressInputs = [
      ...document.querySelectorAll(`
        input[type="text"],
        input[type="url"],
        input:not([type])
      `),
    ].filter((input) => {
      const value = String(
        input.value || input.getAttribute('value') || ''
      ).trim();

      return (
        /^[a-z]:\\/i.test(value) &&
        /(?:стрекоза|dragonfly|пользователи|записи|запись_)/i.test(value)
      );
    });

    const roots = [];

    for (const input of addressInputs) {
      let current = input.parentElement;

      for (let depth = 0; current && current !== document.body && depth < 10; depth += 1) {
        if (!(current instanceof HTMLElement) || !elementVisible(current)) {
          current = current?.parentElement || null;
          continue;
        }

        const rect = current.getBoundingClientRect();
        const text = normalizedText(current);
        const looksLikeViewer =
          /(?:обсуждение|comments\.log|user information|text tasks|media player tasks|комментировать|объект\(ы\)|—\s*запись|просмотр записи)/i.test(text);

        if (
          looksLikeViewer &&
          rect.width >= Math.min(620, innerWidth * 0.48) &&
          rect.height >= Math.min(360, innerHeight * 0.42) &&
          rect.width <= innerWidth * 0.98 &&
          rect.height <= innerHeight * 0.98
        ) {
          roots.push(current);
        }

        current = current.parentElement;
      }
    }

    if (!roots.length) {
      const titleCandidate = [...document.querySelectorAll('div,span,strong,b')]
        .find((element) => {
          if (!(element instanceof HTMLElement) || !elementVisible(element)) return false;
          const text = normalizedText(element);
          return /(?:просмотр записи\s*-\s*проводник|—\s*запись)$/i.test(text);
        });

      let current = titleCandidate?.parentElement || null;
      for (let depth = 0; current && current !== document.body && depth < 9; depth += 1) {
        const rect = current.getBoundingClientRect();
        if (
          elementVisible(current) &&
          rect.width >= Math.min(620, innerWidth * 0.48) &&
          rect.height >= Math.min(360, innerHeight * 0.42)
        ) {
          roots.push(current);
        }
        current = current.parentElement;
      }
    }

    roots.sort((a, b) => elementArea(a) - elementArea(b));
    return roots[0] || null;
  }

  function looksLikeProfileAvatarImage(
    image
  ) {
    if (!(image instanceof HTMLImageElement)) return false;

    const rect = image.getBoundingClientRect();
    if (
      rect.width < 18 ||
      rect.height < 18 ||
      rect.width > 220 ||
      rect.height > 220
    ) {
      return false;
    }

    const ratio = rect.width / Math.max(1, rect.height);
    if (ratio < 0.60 || ratio > 1.65) return false;

    const src = String(image.currentSrc || image.src || '');
    const alt = String(image.alt || '');
    const signature = `${image.id || ''} ${image.className || ''}`;
    const profileLink = image.closest('a[href*="?id="], a[href*="&id="], a[href*="/id/"]');

    return Boolean(
      profileLink ||
      /avatar|ava|userpic|profile|photo/i.test(`${src} ${alt} ${signature}`)
    );
  }

  function findAvatarFrameHost(
    image
  ) {
    if (!(image instanceof HTMLImageElement)) return null;

    const imageRect = image.getBoundingClientRect();
    let best = image.parentElement;
    let node = image.parentElement;

    for (
      let depth = 0;
      node &&
      node !== document.body &&
      depth < 5;
      depth += 1,
      node = node.parentElement
    ) {
      if (!(node instanceof HTMLElement)) continue;

      const rect = node.getBoundingClientRect();
      const ratio = rect.width / Math.max(1, rect.height);

      if (
        rect.width < imageRect.width * 0.92 ||
        rect.height < imageRect.height * 0.92 ||
        rect.width > Math.max(240, imageRect.width * 2.6) ||
        rect.height > Math.max(240, imageRect.height * 2.6) ||
        ratio < 0.58 ||
        ratio > 1.72
      ) {
        continue;
      }

      const text = normalizedText(node);
      if (
        text.length > 18 &&
        rect.width > imageRect.width * 1.55
      ) {
        continue;
      }

      best = node;

      const computed = getComputedStyle(node);
      const hasDecor =
        /url\(/i.test(String(computed.backgroundImage || '')) ||
        (computed.borderStyle !== 'none' && parseFloat(computed.borderWidth) > 0) ||
        (computed.boxShadow && computed.boxShadow !== 'none') ||
        node.querySelectorAll('img').length > 1 ||
        /frame|ramk|avatar|photo|ava/i.test(`${node.id || ''} ${node.className || ''}`);

      if (hasDecor) break;
    }

    return best instanceof HTMLElement ? best : image;
  }

  function protectAvatarFrames(
    root = document
  ) {
    const scope =
      root instanceof Document ||
      root instanceof Element
        ? root
        : document;

    let images = [];

    try {
      images = [
        ...(scope instanceof HTMLImageElement ? [scope] : []),
        ...scope.querySelectorAll('img'),
      ];
    } catch {
      return;
    }

    for (const image of images) {
      if (!looksLikeProfileAvatarImage(image)) continue;

      const host = findAvatarFrameHost(image);
      if (!(host instanceof HTMLElement)) continue;

      host.classList.add(
        NATIVE.root,
        NATIVE.avatarFrame
      );

      stripLiveThemeFromSubtree(host);
    }
  }

  function protectViewerIconControls(
    viewer
  ) {
    if (!(viewer instanceof HTMLElement)) return;

    const candidates = [
      ...viewer.querySelectorAll(`
        button,
        a,
        [role="button"],
        input[type="button"],
        input[type="image"]
      `),
    ];

    for (const element of candidates) {
      if (!(element instanceof HTMLElement)) continue;

      const rect = element.getBoundingClientRect();
      if (
        rect.width < 10 ||
        rect.height < 10 ||
        rect.width > 76 ||
        rect.height > 62
      ) {
        continue;
      }

      let computed;
      try {
        computed = getComputedStyle(element);
      } catch {
        continue;
      }

      const text = normalizedText(element);
      const hasImage = Boolean(element.querySelector('img,svg,canvas'));
      const hasBackgroundImage = /url\(/i.test(String(computed.backgroundImage || ''));
      const inputImage = element.matches('input[type="image"]');
      const compactIconLabel =
        text.length <= 4 &&
        Boolean(
          element.getAttribute('title') ||
          element.getAttribute('aria-label') ||
          element.matches('button,a,[role="button"]')
        );

      if (!(hasImage || hasBackgroundImage || inputImage || compactIconLabel)) {
        continue;
      }

      element.classList.add(
        NATIVE.root,
        NATIVE.control
      );

      element.classList.remove(
        NATIVE.viewerBlueStrong,
        NATIVE.viewerBlueSoft,
        NATIVE.viewerNeutral,
        NATIVE.viewerCanvas,
        NATIVE.viewerControlSurface
      );

      stripLiveThemeFromSubtree(element);
    }
  }

  function protectWindowControls(
    root
  ) {
    if (!(root instanceof HTMLElement)) return;

    const rootRect = root.getBoundingClientRect();

    [...root.querySelectorAll('button,a,div,span,input')]
      .filter((element) => element instanceof HTMLElement)
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return (
          rect.width >= 12 && rect.width <= 44 &&
          rect.height >= 12 && rect.height <= 44 &&
          rect.top >= rootRect.top - 2 &&
          rect.top <= rootRect.top + 48 &&
          rect.right >= rootRect.right - 145 &&
          rect.right <= rootRect.right + 4
        );
      })
      .forEach((element) => {
        element.classList.add(NATIVE.root, NATIVE.control);
        element.classList.remove(
          NATIVE.viewerBlueStrong,
          NATIVE.viewerBlueSoft,
          NATIVE.viewerNeutral,
          NATIVE.viewerCanvas,
          NATIVE.viewerControlSurface
        );
        stripLiveThemeFromSubtree(element);
      });
  }

  function clearNativeViewerThemeClasses(
    root = document
  ) {
    const selector = `
      .${NATIVE.viewerBlueStrong},
      .${NATIVE.viewerBlueSoft},
      .${NATIVE.viewerNeutral},
      .${NATIVE.viewerCanvas},
      .${NATIVE.viewerControlSurface}
    `;

    try {
      const targets = [
        ...(root instanceof Element && root.matches(selector) ? [root] : []),
        ...root.querySelectorAll(selector),
      ];

      targets.forEach((element) => {
        element.classList.remove(
          NATIVE.viewerBlueStrong,
          NATIVE.viewerBlueSoft,
          NATIVE.viewerNeutral,
          NATIVE.viewerCanvas,
          NATIVE.viewerControlSurface
        );
      });
    } catch {}
  }

  function applyNativeViewerTheme(
    viewer
  ) {
    if (!(viewer instanceof HTMLElement)) return;

    clearNativeViewerThemeClasses(viewer);

    if (
      !settings.enabled ||
      !settings.viewerEnabled
    ) {
      return;
    }

    const rootRect =
      viewer.getBoundingClientRect();

    viewer.classList.add(
      NATIVE.viewerCanvas
    );

    const rootArea =
      Math.max(
        1,
        rootRect.width *
        rootRect.height
      );

    const elements = [
      viewer,
      ...viewer
        .querySelectorAll('*'),
    ];

    for (
      const element
      of elements
    ) {
      if (
        !(
          element instanceof
          HTMLElement
        ) ||
        element === viewer ||
        element.classList.contains(
          NATIVE.control
        ) ||
        element.closest(
          `#${ID}-panel`
        ) ||
        [
          'SCRIPT',
          'STYLE',
          'LINK',
          'META',
          'IMG',
          'VIDEO',
          'AUDIO',
          'CANVAS',
          'SVG',
          'PATH',
        ].includes(
          element.tagName
        )
      ) {
        continue;
      }

      const rect =
        element
          .getBoundingClientRect();

      if (
        rect.width < 3 ||
        rect.height < 3
      ) {
        continue;
      }

      if (
        element.matches(`
          button,
          input,
          select,
          textarea,
          [role="button"]
        `)
      ) {
        element.classList.add(
          NATIVE.viewerControlSurface
        );
        continue;
      }

      let computed;

      try {
        computed =
          getComputedStyle(
            element
          );
      } catch {
        continue;
      }

      if (
        /url\(/i.test(
          String(
            computed
              .backgroundImage ||
            ''
          )
        )
      ) {
        continue;
      }

      const colors =
        computedBackgroundColors(
          element
        );

      if (!colors.length) {
        continue;
      }

      const hsl =
        colors.map(
          rgbToHsl
        );

      const blueLike =
        hsl.some(
          (color) =>
            color.s >= 0.12 &&
            color.h >= 165 &&
            color.h <= 285
        );

      const nearTop =
        rect.top <=
          rootRect.top +
          150;

      const wideBand =
        rect.width >=
          rootRect.width *
          0.28 &&
        rect.height >= 14 &&
        rect.height <= 100;

      if (
        blueLike ||
        (
          nearTop &&
          wideBand &&
          hsl.some(
            (color) =>
              color.s >= 0.08 &&
              color.l <= 0.88
          )
        )
      ) {
        const strong =
          rect.top <=
            rootRect.top +
            64 &&
          rect.height <= 82 &&
          rect.width >=
            rootRect.width *
            0.28;

        element.classList.add(
          strong
            ? NATIVE.viewerBlueStrong
            : NATIVE.viewerBlueSoft
        );

        continue;
      }

      const lightest =
        Math.max(
          ...hsl.map(
            (color) =>
              color.l
          )
        );

      const leastSaturated =
        Math.min(
          ...hsl.map(
            (color) =>
              color.s
          )
        );

      const area =
        rect.width *
        rect.height;

      const largeSurface =
        area >=
          rootArea *
          0.055 ||
        (
          rect.width >=
            rootRect.width *
            0.42 &&
          rect.height >=
            rootRect.height *
            0.18
        );

      if (
        lightest >= 0.88 &&
        leastSaturated <= 0.32
      ) {
        element.classList.add(
          largeSurface
            ? NATIVE.viewerCanvas
            : NATIVE.viewerNeutral
        );

        continue;
      }

      if (
        lightest >= 0.58 &&
        leastSaturated <= 0.28
      ) {
        element.classList.add(
          NATIVE.viewerNeutral
        );
      }
    }
  }

  function refreshNativeZones() {
    protectAvatarFrames(document);

    const viewer = findRecordViewerRoot();

    if (viewer) {
      viewer.classList.add(NATIVE.root, NATIVE.viewer);
      stripLiveThemeFromSubtree(viewer);
    } else {
      clearNativeViewerThemeClasses(document);
    }

    const address = findAddressInput();
    const explorerRoot = findChromeRoot(address);

    if (explorerRoot) {
      protectWindowControls(explorerRoot);
    }

    if (viewer) {
      protectWindowControls(viewer);
      protectViewerIconControls(viewer);
      applyNativeViewerTheme(viewer);
    }

    const profileId = currentProfileId();
    let banner = null;

    if (profileId) {
      if (
        activeBannerElement?.isConnected &&
        activeBannerProfileId === profileId
      ) {
        banner = activeBannerElement;
      } else {
        banner = likelyProfileBanner();
      }
    }

    if (
      activeBannerElement &&
      (activeBannerElement !== banner || activeBannerProfileId !== profileId)
    ) {
      restoreActiveBannerCustomization();
    }

    activeBannerElement = banner;
    activeBannerProfileId = profileId;

    if (banner) {
      banner.classList.add(NATIVE.banner);
      banner.classList.remove(
        LIVE.surface,
        LIVE.blue,
        LIVE.neutral,
        LIVE.neutralFallback,
        LIVE.canvas,
        LIVE.shell,
        LIVE.round,
        LIVE.hoverRound,
        LIVE.roundClip,
        LIVE.text,
        LIVE.canvasImage,
        LIVE.neutralImage
      );
      banner.style.removeProperty(NEUTRAL_FALLBACK_VAR);
      restoreTextInline(banner);
      applyBannerCustomization(banner);
    } else if (!profileId || !settings.bannerEnabled) {
      restoreActiveBannerCustomization();
    }
  }

  function clearIntegratedClasses() {
    removeGlassLayer();
    clearPopupPaint();

    document
      .querySelectorAll(`
        .${INTEGRATED.glassRoot},
        .${INTEGRATED.explorerFrame},
        .${INTEGRATED.explorerRoot},
        .${INTEGRATED.explorerTitle},
        .${INTEGRATED.explorerTitleLayer},
        .${INTEGRATED.explorerBand},
        .${INTEGRATED.explorerAddress},
        .${INTEGRATED.popupRoot},
        .${INTEGRATED.popupTitle},
        .${INTEGRATED.popupBody},
        .${INTEGRATED.popupComposer},
        .${INTEGRATED.popupNotice},
        .${INTEGRATED.popupRadio},
        .${INTEGRATED.popupOpen}
      `)
      .forEach(
        (element) =>
          element.classList.remove(
            INTEGRATED.glassRoot,
            INTEGRATED.explorerFrame,
            INTEGRATED.explorerRoot,
            INTEGRATED.explorerTitle,
            INTEGRATED.explorerTitleLayer,
            INTEGRATED.explorerBand,
            INTEGRATED.explorerAddress,
            INTEGRATED.popupRoot,
            INTEGRATED.popupTitle,
            INTEGRATED.popupBody,
            INTEGRATED.popupComposer,
            INTEGRATED.popupNotice,
            INTEGRATED.popupRadio,
            INTEGRATED.popupOpen
          )
      );
  }

  function applyIntegratedFixes() {
    if (
      integratedApplying ||
      !document.body
    ) {
      return;
    }

    integratedApplying = true;

    try {
      refreshNativeZones();
      clearIntegratedClasses();

      if (!settings.enabled) {
        return;
      }

      const address =
        findAddressInput();

      const root =
        findChromeRoot(
          address
        );

      if (
        address &&
        root
      ) {
        const frame =
          findOuterFrame(
            root
          );

        const parts =
          findExplorerParts(
            root,
            address
          );

        root.classList.add(
          INTEGRATED.explorerRoot
        );

        frame?.classList.add(
          INTEGRATED.explorerFrame
        );

        parts.title?.classList.add(
          INTEGRATED.explorerTitle
        );

        parts.titleLayers
          ?.forEach(
            (layer) =>
              layer.classList.add(
                INTEGRATED.explorerTitleLayer
              )
          );

        parts.addressBand
          ?.classList.add(
            INTEGRATED.explorerAddress
          );

        address.classList.add(
          INTEGRATED.explorerAddress
        );

        parts.bands.forEach(
          (band) =>
            band.classList.add(
              INTEGRATED.explorerBand
            )
        );

        if (
          settings.blueEnabled &&
          settings.blueAeroEnabled
        ) {
          ensureGlassLayer(
            root
          );
        }
      }

      paintPopup(
        'notice',
        'Уведомления',
        settings.popupColor
      );

      paintPopup(
        'composer',
        'Создание записи',
        settings.popupColor
      );

      paintPopup(
        'radio',
        'Радиостанции в эфире',
        settings.popupColor
      );
    } finally {
      queueMicrotask(
        () => {
          integratedApplying = false;
        }
      );
    }
  }

  function scheduleIntegratedApply(
    delay = 40
  ) {
    clearTimeout(
      integratedTimer
    );

    integratedTimer =
      window.setTimeout(
        applyIntegratedFixes,
        delay
      );
  }

  function effectsCss() {
    const blueOpacity =
      1 -
      clamp(
        Number(
          settings
            .blueTransparency
        ) || 0,

        0,
        100
      ) /
      100;

    const neutralOpacity =
      1 -
      clamp(
        Number(
          settings
            .neutralTransparency
        ) || 0,

        0,
        100
      ) /
      100;

    const canvasOpacity =
      1 -
      clamp(
        Number(
          settings
            .canvasTransparency
        ) || 0,

        0,
        100
      ) /
      100;

    const blur =
      clamp(
        Number(
          settings.blueBlur
        ) || 0,

        0,
        30
      );

    const saturation =
      clamp(
        Number(
          settings
            .blueSaturation
        ) || 100,

        50,
        200
      );

    const radius =
      clamp(
        Number(
          settings
            .cornerRadius
        ) || 0,

        0,
        8
      );

    const controlRadius =
      Math.min(
        radius,
        8
      );

    const bandOpacity =
      Math.max(
        0.22,
        blueOpacity *
        0.72
      );

    let css = `
      .${NATIVE.viewer},
      .${NATIVE.viewer} * {
        -webkit-backdrop-filter:
          none !important;

        backdrop-filter:
          none !important;
      }

      .${NATIVE.control},
      .${NATIVE.control} * {
        -webkit-backdrop-filter:
          none !important;

        backdrop-filter:
          none !important;

        filter:
          none !important;

      }

      .${NATIVE.viewer},
      .${NATIVE.viewer} *,
      .${NATIVE.viewer} *::before,
      .${NATIVE.viewer} *::after {
        border-radius:
          0 !important;
      }

      .${NATIVE.viewer} img,
      .${NATIVE.viewer} svg,
      .${NATIVE.viewer} canvas,
      .${NATIVE.viewer} .${NATIVE.control},
      .${NATIVE.viewer} .${NATIVE.control} * {
        filter:
          none !important;

        opacity:
          1 !important;

        mix-blend-mode:
          normal !important;
      }

      .${NATIVE.viewerBlueStrong} {
        background:
          linear-gradient(
            to bottom,
            ${settings.viewerLight} 0%,
            ${settings.viewerMiddle} 54%,
            ${settings.viewerDark} 100%
          ) !important;

        background-color:
          ${settings.viewerMiddle} !important;
      }

      .${NATIVE.viewerBlueSoft} {
        background:
          linear-gradient(
            to bottom,
            ${settings.viewerLight} 0%,
            ${settings.viewerMiddle} 100%
          ) !important;

        background-color:
          ${settings.viewerLight} !important;
      }

      .${NATIVE.viewerNeutral} {
        background:
          ${settings.viewerLight} !important;

        background-color:
          ${settings.viewerLight} !important;

        background-image:
          none !important;
      }

      .${NATIVE.viewerCanvas} {
        background:
          ${settings.viewerCanvas} !important;

        background-color:
          ${settings.viewerCanvas} !important;

        background-image:
          none !important;
      }

      .${NATIVE.viewerControlSurface} {
        background-color:
          ${settings.viewerLight} !important;

        background-image:
          linear-gradient(
            to bottom,
            ${settings.viewerLight},
            ${settings.viewerMiddle}
          ) !important;
      }

      .${NATIVE.viewerBlueStrong},
      .${NATIVE.viewerBlueSoft},
      .${NATIVE.viewerNeutral},
      .${NATIVE.viewerCanvas},
      .${NATIVE.viewerControlSurface} {
        opacity:
          1 !important;

        -webkit-backdrop-filter:
          none !important;

        backdrop-filter:
          none !important;

        filter:
          none !important;

        mix-blend-mode:
          normal !important;
      }

      ${settings.viewerEnabled ? `
      .${NATIVE.viewer} :where(
        a,
        p,
        span,
        div,
        label,
        legend,
        strong,
        b,
        em,
        small,
        time,
        h1,
        h2,
        h3,
        h4,
        h5,
        h6,
        td,
        th,
        li
      ):not(.${NATIVE.control}):not(.${NATIVE.control} *) {
        color:
          ${settings.viewerText} !important;

        -webkit-text-fill-color:
          ${settings.viewerText} !important;

        text-decoration-color:
          ${settings.viewerText} !important;
      }
      ` : ''}

      .${NATIVE.bannerHost} {
        isolation:
          isolate !important;
      }

      .${NATIVE.bannerHost}::before,
      .${NATIVE.bannerHost}::after {
        background:
          none !important;

        background-image:
          none !important;

        box-shadow:
          none !important;
      }

      .${NATIVE.bannerNative}::before,
      .${NATIVE.bannerNative}::after {
        background:
          none !important;

        background-image:
          none !important;

        box-shadow:
          none !important;
      }

      .${NATIVE.bannerNative}:not(
        .${NATIVE.bannerHost}
      ) {
        background:
          transparent !important;

        background-color:
          transparent !important;

        background-image:
          none !important;

        background-blend-mode:
          normal !important;
      }

      img.${NATIVE.bannerNative} {
        opacity:
          0 !important;
      }

      .${NATIVE.bannerHost} .${LIVE.roundClip} {
        overflow:
          visible !important;

        clip:
          auto !important;

        clip-path:
          none !important;
      }

      html {
        overflow-y:
          auto !important;
      }

      body {
        min-height:
          100% !important;

        overflow-y:
          visible !important;
      }

      .${LIVE.shell} {
        clip-path:
          none !important;

        background-clip:
          padding-box !important;

        box-sizing:
          border-box !important;
      }

      .${INTEGRATED.explorerRoot} {
        position:
          relative !important;

        isolation:
          isolate !important;

        overflow:
          visible !important;

        overflow-x:
          visible !important;

        overflow-y:
          visible !important;
      }

      .${INTEGRATED.popupOpen} {
        overflow:
          visible !important;

        overflow-x:
          visible !important;

        overflow-y:
          visible !important;

        clip:
          auto !important;

        clip-path:
          none !important;

        contain:
          none !important;
      }

      .${INTEGRATED.popupRoot} {
        opacity:
          1 !important;

        -webkit-backdrop-filter:
          none !important;

        backdrop-filter:
          none !important;

        filter:
          none !important;

        mix-blend-mode:
          normal !important;
      }
    `;

    if (
      settings.blueEnabled &&
      Number(
        settings
          .blueTransparency
      ) > 0
    ) {
      css += `
        .${LIVE.blue}:not(
          .${INTEGRATED.popupNotice}
        ) {
          background-color:
            ${rgbaFromHex(
              settings.blueMiddle,
              bandOpacity
            )} !important;

          background-image:
            linear-gradient(
              to bottom,
              ${rgbaFromHex(
                settings.blueLight,
                Math.min(
                  1,
                  bandOpacity +
                  0.15
                )
              )},
              ${rgbaFromHex(
                settings.blueMiddle,
                bandOpacity
              )} 52%,
              ${rgbaFromHex(
                settings.blueDark,
                Math.min(
                  1,
                  bandOpacity +
                  0.08
                )
              )}
            ) !important;

          background-size:
            100% 100% !important;

          background-repeat:
            no-repeat !important;

          background-position:
            center center !important;

          background-attachment:
            scroll !important;

          -webkit-backdrop-filter:
            none !important;

          backdrop-filter:
            none !important;

          filter:
            none !important;

          transform:
            none !important;

          will-change:
            auto !important;

          background-clip:
            padding-box !important;
        }
      `;
    }

    if (
      settings.neutralEnabled
    ) {
      css += `
        .${LIVE.neutralFallback}:not(
          .${LIVE.blue}
        ):not(
          .${LIVE.canvas}
        ):not(
          .${INTEGRATED.popupRoot}
        ) {
          background-color:
            var(
              ${NEUTRAL_FALLBACK_VAR}
            ) !important;
        }

        .${LIVE.neutralFallback}:not(
          .${LIVE.neutralImage}
        ) {
          background-image:
            none !important;
        }
      `;
    }

    if (
      settings.neutralEnabled &&
      Number(
        settings
          .neutralTransparency
      ) > 0
    ) {
      css += `
        .${LIVE.neutral}:not(
          .${LIVE.blue}
        ):not(
          .${LIVE.canvas}
        ):not(
          .${INTEGRATED.popupRoot}
        ):not(
          .${LIVE.neutralFallback}
        ) {
          background-color:
            ${rgbaFromHex(
              settings.neutralMiddle,
              neutralOpacity
            )} !important;

          background-clip:
            padding-box !important;
        }

        .${LIVE.neutral}:not(
          .${LIVE.blue}
        ):not(
          .${LIVE.canvas}
        ):not(
          .${INTEGRATED.popupRoot}
        ):not(
          .${LIVE.neutralFallback}
        ):not(
          .${LIVE.neutralImage}
        ) {
          background-image:
            none !important;
        }
      `;
    }

    if (
      settings.canvasEnabled &&
      Number(
        settings
          .canvasTransparency
      ) > 0
    ) {
      css += `
        .${LIVE.canvas}:not(
          .${INTEGRATED.popupRoot}
        ) {
          background-color:
            ${rgbaFromHex(
              settings.canvasMiddle,
              canvasOpacity
            )} !important;

          background-clip:
            padding-box !important;
        }

        .${LIVE.canvas}:not(
          .${INTEGRATED.popupRoot}
        ):not(
          .${LIVE.canvasImage}
        ) {
          background-image:
            none !important;
        }
      `;
    }

    if (
      settings.blueEnabled &&
      settings.blueAeroEnabled
    ) {
      css += `
        .${INTEGRATED.glassRoot} {
          position:
            relative !important;

          isolation:
            isolate !important;
        }

        .${INTEGRATED.glassRoot}
        > .${INTEGRATED.glassLayer} {
          position:
            absolute !important;

          inset:
            0 !important;

          z-index:
            0 !important;

          pointer-events:
            none !important;

          background-image:
            none !important;

          background-color:
            rgba(
              0,
              0,
              0,
              0.001
            ) !important;

          opacity:
            1 !important;

          background-blend-mode:
            normal !important;

          -webkit-backdrop-filter:
            blur(${blur}px)
            saturate(${saturation}%)
            !important;

          backdrop-filter:
            blur(${blur}px)
            saturate(${saturation}%)
            !important;

          transform:
            translateZ(0) !important;

          backface-visibility:
            hidden !important;

          box-shadow:
            inset 0 1px 0
              rgba(
                255,
                255,
                255,
                0.32
              ),
            inset 0 -1px 0
              rgba(
                0,
                0,
                0,
                0.18
              ) !important;
        }

        .${INTEGRATED.glassRoot}
        > :not(
          .${INTEGRATED.glassLayer}
        ) {
          position:
            relative !important;

          z-index:
            1 !important;
        }

        .${LIVE.blue}:not(
          .${INTEGRATED.popupNotice}
        ) {
          opacity:
            1 !important;

          filter:
            none !important;

          mix-blend-mode:
            normal !important;

          background-clip:
            padding-box !important;
        }
      `;
    }

    css += `
      .${INTEGRATED.explorerFrame},
      .${INTEGRATED.explorerTitle},
      .${INTEGRATED.explorerTitleLayer} {
        border-radius:
          0 !important;

        clip-path:
          none !important;

        background-clip:
          border-box !important;

        overflow:
          visible !important;

        overflow-x:
          visible !important;

        overflow-y:
          visible !important;
      }

      .${INTEGRATED.explorerTitle}::before,
      .${INTEGRATED.explorerTitle}::after,
      .${INTEGRATED.explorerTitleLayer}::before,
      .${INTEGRATED.explorerTitleLayer}::after {
        border-radius:
          0 !important;
      }

      .${INTEGRATED.explorerRoot},
      .${INTEGRATED.explorerBand},
      .${INTEGRATED.explorerAddress},
      .${INTEGRATED.explorerAddress} input,
      input.${INTEGRATED.explorerAddress} {
        border-radius:
          0 !important;

        clip-path:
          none !important;

        background-clip:
          border-box !important;
      }
    `;

    const chromeHasTransparency =
      (
        settings.blueEnabled &&
        Number(settings.blueTransparency) > 0
      ) ||
      (
        settings.neutralEnabled &&
        Number(settings.neutralTransparency) > 0
      ) ||
      (
        settings.canvasEnabled &&
        Number(settings.canvasTransparency) > 0
      );

    if (chromeHasTransparency) {
      const chromeDark =
        settings.blueEnabled
          ? settings.blueDark
          : settings.neutralEnabled
            ? settings.neutralDark
            : settings.canvasEnabled
              ? settings.canvasDark
              : '#d4d0c8';

      const chromeMiddle =
        settings.blueEnabled
          ? settings.blueMiddle
          : settings.neutralEnabled
            ? settings.neutralMiddle
            : settings.canvasEnabled
              ? settings.canvasMiddle
              : '#ece9d8';

      const chromeLight =
        settings.blueEnabled
          ? settings.blueLight
          : settings.neutralEnabled
            ? settings.neutralLight
            : settings.canvasEnabled
              ? settings.canvasLight
              : '#ffffff';

      css += `
        .${INTEGRATED.explorerFrame},
        .${INTEGRATED.explorerRoot},
        .${INTEGRATED.explorerTitle},
        .${INTEGRATED.explorerTitleLayer},
        .${INTEGRATED.explorerBand},
        .${INTEGRATED.explorerAddress} {
          opacity:
            1 !important;

          filter:
            none !important;

          mix-blend-mode:
            normal !important;
        }

        .${INTEGRATED.explorerTitle},
        .${INTEGRATED.explorerTitleLayer},
        .${INTEGRATED.explorerBand},
        .${INTEGRATED.explorerAddress}:not(input) {
          background-color:
            ${chromeMiddle} !important;

          background-image:
            linear-gradient(
              to bottom,
              ${chromeLight},
              ${chromeMiddle} 52%,
              ${chromeDark}
            ) !important;

          background-size:
            100% 100% !important;

          background-repeat:
            no-repeat !important;

          background-position:
            center center !important;

          background-blend-mode:
            normal !important;

          -webkit-backdrop-filter:
            none !important;

          backdrop-filter:
            none !important;

          isolation:
            isolate !important;
        }

        .${INTEGRATED.explorerAddress} input,
        input.${INTEGRATED.explorerAddress} {
          background-color:
            ${chromeLight} !important;

          background-image:
            none !important;

          opacity:
            1 !important;

          -webkit-backdrop-filter:
            none !important;

          backdrop-filter:
            none !important;

          filter:
            none !important;

          mix-blend-mode:
            normal !important;
        }
      `;
    }

    if (settings.roundedEnabled) {
      css += `
        .${LIVE.round}:not(
          .${INTEGRATED.explorerFrame}
        ):not(
          .${INTEGRATED.explorerRoot}
        ):not(
          .${INTEGRATED.explorerTitle}
        ):not(
          .${INTEGRATED.explorerTitleLayer}
        ):not(
          .${INTEGRATED.explorerBand}
        ):not(
          .${INTEGRATED.explorerAddress}
        ),
        .${LIVE.hoverRound},
        .${LIVE.hoverRound}:hover,
        .${LIVE.hoverRound}:focus,
        .${LIVE.hoverRound}:focus-visible {
          border-radius:
            ${radius}px !important;

          background-clip:
            padding-box !important;

          clip-path:
            none !important;
        }

        .${LIVE.hoverRound}::before,
        .${LIVE.hoverRound}::after {
          border-radius:
            inherit !important;
        }

        .${LIVE.roundClip} {
          overflow:
            hidden !important;

          border-radius:
            ${radius}px !important;
        }

        .${LIVE.roundClip} > :first-child,
        .${LIVE.roundClip} > :first-child > a,
        .${LIVE.roundClip} > :first-child > button {
          border-top-left-radius:
            ${radius}px !important;

          border-top-right-radius:
            ${radius}px !important;
        }

        .${LIVE.roundClip} > :last-child,
        .${LIVE.roundClip} > :last-child > a,
        .${LIVE.roundClip} > :last-child > button {
          border-bottom-left-radius:
            ${radius}px !important;

          border-bottom-right-radius:
            ${radius}px !important;
        }

        .${LIVE.surface}:not(
          .${LIVE.shell}
        ):not(
          .${INTEGRATED.explorerFrame}
        ):not(
          .${INTEGRATED.explorerRoot}
        ):not(
          .${INTEGRATED.explorerTitle}
        ):not(
          .${INTEGRATED.explorerBand}
        ):not(
          .${INTEGRATED.explorerAddress}
        ) {
          border-radius:
            ${radius}px !important;

          background-clip:
            padding-box !important;

          clip-path:
            none !important;
        }

        button:not(.${NATIVE.root}):not(.${NATIVE.root} *),
        input:not(.${NATIVE.root}):not(.${NATIVE.root} *),
        select:not(.${NATIVE.root}):not(.${NATIVE.root} *),
        textarea:not(.${NATIVE.root}):not(.${NATIVE.root} *) {
          border-radius:
            ${controlRadius}px !important;
        }
      `;
    }

    css += `
      .${INTEGRATED.explorerFrame},
      .${INTEGRATED.explorerRoot},
      .${INTEGRATED.explorerTitle},
      .${INTEGRATED.explorerTitleLayer} {
        border-radius:
          0 !important;
      }
    `;

    css += `
      .${NATIVE.viewer},
      .${NATIVE.viewer} *,
      .${NATIVE.viewer} *::before,
      .${NATIVE.viewer} *::after {
        border-radius:
          0 !important;
      }

      .${NATIVE.avatarFrame},
      .${NATIVE.avatarFrame} * {
        clip-path:
          none !important;
      }
    `;

    css += `
      .${LIVE.shell}.${INTEGRATED.popupOpen},
      .${INTEGRATED.explorerFrame}.${INTEGRATED.popupOpen},
      .${INTEGRATED.explorerRoot}.${INTEGRATED.popupOpen},
      .${INTEGRATED.popupOpen} {
        overflow:
          visible !important;

        overflow-x:
          visible !important;

        overflow-y:
          visible !important;

        clip:
          auto !important;

        clip-path:
          none !important;

        contain:
          none !important;
      }
    `;

    return css;
  }

  function applyAddressBarColor() {
    document
      .querySelectorAll(`
        input[type="text"],
        input[type="url"],
        input:not([type]),
        textarea,
        [contenteditable="true"]
      `)
      .forEach(
        (element) => {
          const value =
            String(
              element.value ??
              element.getAttribute?.(
                'value'
              ) ??
              element.textContent ??
              ''
            ).trim();

          if (
            !/^https?:\/\//i
              .test(value) &&
            !value.includes(
              'dragonfly-flash.com'
            ) &&
            !value.includes(
              'dragonfly-flash.ru'
            )
          ) {
            return;
          }

          if (
            settings.enabled &&
            settings.neutralEnabled
          ) {
            element.style
              .setProperty(
                'background-color',

                settings
                  .neutralLight,

                'important'
              );

            element.style
              .setProperty(
                'background-image',
                'none',
                'important'
              );

            element.style
              .setProperty(
                'color',
                '#111111',
                'important'
              );
          } else {
            [
              'background-color',
              'background-image',
              'color',
            ].forEach(
              (property) =>
                element.style
                  .removeProperty(
                    property
                  )
            );
          }
        }
      );
  }

  function editableElement(
    value
  ) {
    const element =
      value instanceof Element
        ? value
        : value?.parentElement;

    if (
      !(
        element instanceof
        Element
      )
    ) {
      return null;
    }

    return element.closest(`
      textarea,
      input[type="text"],
      input[type="search"],
      input[type="email"],
      input[type="url"],
      input[type="password"],
      input:not([type]),
      [contenteditable="true"],
      [contenteditable="plaintext-only"],
      [role="textbox"]
    `);
  }

  function userIsEditing() {
    return (
      compositionActive ||
      Date.now() <
        typingUntil ||
      Boolean(
        editableElement(
          document.activeElement
        )
      )
    );
  }

  function noteTyping(
    duration = 900
  ) {
    typingUntil =
      Math.max(
        typingUntil,
        Date.now() +
          duration
      );
  }

  function mutationTouchesEditor(
    mutation
  ) {
    if (
      editableElement(
        mutation.target
      )
    ) {
      return true;
    }

    return [
      ...mutation.addedNodes,
      ...mutation.removedNodes,
    ].some(
      (node) => {
        if (
          editableElement(
            node
          )
        ) {
          return true;
        }

        return (
          node instanceof
            Element &&
          Boolean(
            node.querySelector?.(`
              textarea,
              input[type="text"],
              input[type="search"],
              input[type="email"],
              input[type="url"],
              input[type="password"],
              input:not([type]),
              [contenteditable="true"],
              [contenteditable="plaintext-only"],
              [role="textbox"]
            `)
          )
        );
      }
    );
  }

  function queueDynamicRoot(
    node
  ) {
    const element =
      node instanceof HTMLElement
        ? node
        : node?.parentElement;

    if (
      !element ||
      !element.isConnected ||
      element.closest?.(
        `#${ID}-panel`
      ) ||
      element.id ===
        `${ID}-button` ||
      element.id ===
        WALLPAPER_LAYER_ID ||
      element.classList?.contains(
        INTEGRATED.glassLayer
      )
    ) {
      return;
    }

    for (
      const existing
      of [...dynamicRoots]
    ) {
      if (
        existing === element ||
        existing.contains(element)
      ) {
        return;
      }

      if (
        element.contains(existing)
      ) {
        dynamicRoots.delete(
          existing
        );
      }
    }

    dynamicRoots.add(
      element
    );
  }

  function refreshDynamicTheme() {
    dynamicRefreshTimer = 0;

    if (
      !settings.enabled ||
      !lastStatistics
    ) {
      dynamicRoots.clear();
      dynamicFullRefresh = false;
      return;
    }

    if (userIsEditing()) {
      scheduleDynamicRefresh(
        180
      );
      return;
    }

    refreshNativeZones();

    const full =
      dynamicFullRefresh ||
      !dynamicRoots.size;

    const roots =
      full
        ? [document.body]
        : [...dynamicRoots];

    dynamicRoots.clear();
    dynamicFullRefresh = false;

    for (
      const root
      of roots
    ) {
      if (
        root?.isConnected
      ) {
        markLiveSurfaces(
          lastStatistics,
          false,
          root
        );
      }
    }

    applyAddressBarColor();
    scheduleIntegratedApply(
      20
    );
  }

  function scheduleDynamicRefresh(
    delay = 80,
    roots = null,
    full = false
  ) {
    if (full) {
      dynamicFullRefresh = true;
      dynamicRoots.clear();
    } else if (roots) {
      const list =
        Array.isArray(roots) ||
        roots instanceof Set
          ? roots
          : [roots];

      for (
        const root
        of list
      ) {
        queueDynamicRoot(
          root
        );
      }
    }

    clearTimeout(
      dynamicRefreshTimer
    );

    dynamicRefreshTimer =
      window.setTimeout(
        refreshDynamicTheme,
        delay
      );
  }

  function scheduleSettledFullRefresh() {
    if (!settings.enabled) return;

    clearTimeout(settledRefreshTimer);
    settledRefreshTimer = window.setTimeout(() => {
      settledRefreshTimer = 0;

      if (userIsEditing()) {
        scheduleSettledFullRefresh();
        return;
      }

      refreshNativeZones();
      scheduleDynamicRefresh(0, null, true);
      scheduleIntegratedApply(0);
    }, 180);

    if (!settledRefreshLateTimer) {
      settledRefreshLateTimer = window.setTimeout(() => {
        settledRefreshLateTimer = 0;

        if (!settings.enabled) return;
        if (userIsEditing()) {
          scheduleSettledFullRefresh();
          return;
        }

        refreshNativeZones();
        scheduleDynamicRefresh(0, null, true);
        scheduleIntegratedApply(0);
      }, 900);
    }
  }

  function scheduleSafeRebuild(
    delay = 150
  ) {
    clearTimeout(
      rebuildTimer
    );

    rebuildTimer =
      window.setTimeout(
        () => {
          if (userIsEditing()) {
            scheduleSafeRebuild(
              240
            );
            return;
          }

          void rebuild();
        },

        delay
      );
  }

  async function rebuild() {
    const currentGeneration =
      ++generation;

    if (!fontStyle) {
      syncFontStyle('');
    }

    if (!themeStyle) {
      themeStyle =
        document.createElement(
          'style'
        );

      themeStyle.id =
        `${ID}-theme`;

      document
        .documentElement
        .append(
          themeStyle
        );
    }

    if (!effectsStyle) {
      effectsStyle =
        document.createElement(
          'style'
        );

      effectsStyle.id =
        `${ID}-effects`;

      document
        .documentElement
        .append(
          effectsStyle
        );
    }

    syncWallpaperLayer();

    if (
      !settings.enabled
    ) {
      lastStatistics = null;
      syncFontStyle('');
      themeStyle.textContent = '';
      effectsStyle.textContent = '';
      clearLiveClasses();
      clearIntegratedClasses();
      refreshNativeZones();
      if (activeBannerElement || activeBannerTouched.size) {
        restoreActiveBannerCustomization();
      }
      applyAddressBarColor();
      return;
    }

    refreshNativeZones();

    let customFontSource = '';

    if (
      settings.font ===
      'custom'
    ) {
      if (localFontAsset) {
        customFontSource =
          localAssetObjectUrl(
            'font'
          );

        setFontStatus(
          customFontSource
            ? `Локальный шрифт: ${localFontAsset.name}`
            : 'Не удалось открыть локальный шрифт.'
        );
      } else {
        customFontSource =
          await loadCustomFont(
            settings
              .customFontUrl
          );
      }

      if (
        currentGeneration !==
        generation
      ) {
        return;
      }
    } else {
      setFontStatus(
        'Кастомный шрифт не выбран.'
      );
    }

    const statistics = {
      groups: {
        blue: 0,
        yellow: 0,
        neutral: 0,
        canvas: 0,
        controls: 0,
      },

      surface:
        new Set(),

      blue:
        new Set(),

      neutral:
        new Set(),

      canvas:
        new Set(),
    };

    syncFontStyle(
      fontCss(
        customFontSource
      )
    );

    let css = '';

    for (
      const sheet
      of readableSheets()
    ) {
      css +=
        serializeRules(
          sheet.cssRules,

          sheet.href ||
            location.href,

          statistics
        );
    }

    const wallpaper =
      wallpaperCss();

    themeStyle.textContent =
      css +
      wallpaper;

    refreshNativeZones();

    lastStatistics =
      statistics;

    markLiveSurfaces(
      statistics
    );

    effectsStyle.textContent =
      effectsCss();

    applyAddressBarColor();
    scheduleIntegratedApply(
      0
    );
  }

  function userInterfaceCss() {
    return `
      #${ID}-panel,
      #${ID}-panel * {
        box-sizing:
          border-box !important;

        font-family:
          Tahoma,
          Arial,
          sans-serif !important;
      }

      #${ID}-panel {
        position:
          fixed !important;

        right:
          18px !important;

        bottom:
          66px !important;

        z-index:
          2147483647 !important;

        width:
          min(
            690px,
            calc(
              100vw -
              30px
            )
          ) !important;

        max-height:
          calc(
            100vh -
            90px
          ) !important;

        overflow:
          auto !important;

        padding:
          14px !important;

        border:
          2px outset
          #fff !important;

        background:
          #ece9d8 !important;

        color:
          #111 !important;

        font-size:
          13px !important;

        box-shadow:
          0 6px 28px
          #000a !important;
      }

      #${ID}-panel .master-toggle {
        display:
          flex !important;

        align-items:
          center !important;

        justify-content:
          space-between !important;

        gap:
          14px !important;

        margin:
          10px 0 14px !important;

        padding:
          10px 12px !important;

        border:
          1px solid
          #999 !important;

        background:
          #f5f2e8 !important;
      }

      #${ID}-panel .master-toggle label {
        font-weight:
          bold !important;
      }

      #${ID}-panel .master-toggle input[type="checkbox"] {
        min-height:
          0 !important;

        margin:
          0 !important;
      }

      #${ID}-panel fieldset {
        margin:
          10px 0 !important;

        padding:
          10px !important;

        border:
          1px solid
          #999 !important;
      }

      #${ID}-panel legend {
        font-weight:
          bold !important;
      }

      #${ID}-panel .grid {
        display:
          grid !important;

        grid-template-columns:
          260px
          minmax(
            0,
            1fr
          ) !important;

        gap:
          8px 12px !important;

        align-items:
          center !important;
      }

      #${ID}-panel .palette {
        display:
          flex !important;

        gap:
          7px !important;
      }

      #${ID}-panel input,
      #${ID}-panel select {
        min-height:
          28px !important;

        border:
          2px inset
          #fff !important;

        background:
          #fff !important;

        color:
          #111 !important;
      }

      #${ID}-panel input[type="url"],
      #${ID}-panel input[type="text"],
      #${ID}-panel select {
        width:
          100% !important;
      }

      #${ID}-panel input[type="color"] {
        width:
          72px !important;
      }

      #${ID}-panel input[type="range"] {
        width:
          min(
            270px,
            100%
          ) !important;
      }

      #${ID}-panel .theme-slots {
        display:
          grid !important;

        grid-template-columns:
          repeat(
            5,
            minmax(
              108px,
              1fr
            )
          ) !important;

        gap:
          7px !important;
      }

      #${ID}-panel .theme-slot {
        min-width:
          0 !important;

        padding:
          7px !important;

        border:
          1px solid
          #999 !important;

        background:
          #f5f2e8 !important;
      }

      #${ID}-panel .theme-slot-number {
        margin-bottom:
          5px !important;

        font-weight:
          bold !important;
      }

      #${ID}-panel .theme-slot input[type="text"] {
        width:
          100% !important;

        min-width:
          0 !important;

        margin-bottom:
          5px !important;
      }

      #${ID}-panel .theme-slot-status {
        min-height:
          28px !important;

        margin-bottom:
          6px !important;

        color:
          #555 !important;

        font-size:
          11px !important;

        line-height:
          1.25 !important;
      }

      #${ID}-panel .theme-slot-actions {
        display:
          flex !important;

        gap:
          4px !important;

        flex-wrap:
          wrap !important;
      }

      #${ID}-panel .theme-slot-actions button {
        flex:
          1 1 45% !important;

        min-width:
          0 !important;

        padding:
          4px 5px !important;

        font-size:
          11px !important;
      }

      #${ID}-panel button:disabled {
        color:
          #777 !important;

        cursor:
          default !important;

        opacity:
          .65 !important;
      }

      #${ID}-panel .actions {
        display:
          flex !important;

        justify-content:
          flex-start !important;

        align-items:
          center !important;

        gap:
          8px !important;

        flex-wrap:
          wrap !important;
      }

      #${ID}-panel .share-grid {
        display: grid !important;
        grid-template-columns: 1fr 1fr !important;
        gap: 7px !important;
      }

      #${ID}-panel .share-note {
        margin-top: 7px !important;
        color: #555 !important;
        font-size: 11px !important;
      }

      #${ID}-panel .actions .reset-button {
        margin-left:
          auto !important;
      }

      #${ID}-panel button {
        padding:
          5px 9px !important;

        border:
          2px outset
          #fff !important;

        background:
          #ece9d8 !important;

        color:
          #111 !important;
      }

      #${ID}-panel .local-file {
        display:
          flex !important;

        align-items:
          center !important;

        gap:
          7px !important;

        flex-wrap:
          wrap !important;
      }

      #${ID}-panel .local-file input[type="file"] {
        width:
          min(100%, 360px) !important;

        padding:
          2px !important;
      }

      #${ID}-panel .local-file-status {
        width:
          100% !important;

        color:
          #444 !important;

        font-size:
          11px !important;

        overflow-wrap:
          anywhere !important;
      }

      @media (
        max-width:
          700px
      ) {
        #${ID}-panel .grid {
          grid-template-columns:
            1fr !important;
        }

        #${ID}-panel .theme-slots {
          grid-template-columns:
            repeat(
              2,
              minmax(
                0,
                1fr
              )
            ) !important;
        }
      }
    `;
  }

  function paletteField(
    name,
    title,
    extra = ''
  ) {
    return `
      <fieldset>
        <legend>
          ${title}
        </legend>

        <div class="grid">
          <label>
            Перекрашивать:
          </label>

          <input
            id="${ID}-${name}-enabled"
            type="checkbox"
          >

          <label>
            Тёмный / средний / светлый:
          </label>

          <div class="palette">
            <input
              id="${ID}-${name}-dark"
              type="color"
            >

            <input
              id="${ID}-${name}-middle"
              type="color"
            >

            <input
              id="${ID}-${name}-light"
              type="color"
            >
          </div>

          ${extra}
        </div>
      </fieldset>
    `;
  }

  function escapeHtml(
    value
  ) {
    return String(
      value ?? ''
    )
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function themeSlotsMarkup() {
    return Array.from(
      {
        length:
          THEME_SLOT_COUNT,
      },
      (_, index) => {
        const slot =
          themeSlots[index];

        return `
          <div
            class="theme-slot"
            data-theme-slot="${index}"
          >
            <div
              class="theme-slot-number"
            >
              Ячейка ${index + 1}
            </div>

            <input
              id="${ID}-theme-slot-name-${index}"
              type="text"
              maxlength="48"
              placeholder="Название темы"
              value="${escapeHtml(
                slot?.name || ''
              )}"
            >

            <div
              id="${ID}-theme-slot-status-${index}"
              class="theme-slot-status"
            >
              ${slot
                ? 'Сохранено'
                : 'Пусто'}
            </div>

            <div
              class="theme-slot-actions"
            >
              <button
                id="${ID}-theme-slot-save-${index}"
                type="button"
              >
                Сохранить
              </button>

              <button
                id="${ID}-theme-slot-load-${index}"
                type="button"
                ${slot
                  ? ''
                  : 'disabled'}
              >
                Применить
              </button>

              <button
                id="${ID}-theme-slot-clear-${index}"
                type="button"
                ${slot
                  ? ''
                  : 'disabled'}
              >
                Очистить
              </button>
            </div>
          </div>
        `;
      }
    ).join('');
  }

  function openPanel() {
    const existing =
      document.getElementById(
        `${ID}-panel`
      );

    if (existing) {
      existing.remove();
      return;
    }

    const panel =
      document.createElement(
        'div'
      );

    panel.id =
      `${ID}-panel`;

    const blueExtra = `
      <label>
        Прозрачность:
      </label>

      <div>
        <input
          id="${ID}-blue-transparency"
          type="range"
          min="0"
          max="100"
          step="5"
        >

        <span
          id="${ID}-blue-transparency-label"
        ></span>
      </div>

      <label>
        Aero-размытие:
      </label>

      <input
        id="${ID}-blue-aero-enabled"
        type="checkbox"
      >

      <label>
        Сила размытия:
      </label>

      <div>
        <input
          id="${ID}-blue-blur"
          type="range"
          min="0"
          max="30"
          step="1"
        >

        <span
          id="${ID}-blue-blur-label"
        ></span>
      </div>

      <label>
        Насыщенность стекла:
      </label>

      <div>
        <input
          id="${ID}-blue-saturation"
          type="range"
          min="50"
          max="200"
          step="5"
        >

        <span
          id="${ID}-blue-saturation-label"
        ></span>
      </div>
    `;

    const neutralExtra = `
      <label>
        Прозрачность:
      </label>

      <div>
        <input
          id="${ID}-neutral-transparency"
          type="range"
          min="0"
          max="100"
          step="5"
        >

        <span
          id="${ID}-neutral-transparency-label"
        ></span>
      </div>
    `;

    const canvasExtra = `
      <label>
        Прозрачность:
      </label>

      <div>
        <input
          id="${ID}-canvas-transparency"
          type="range"
          min="0"
          max="100"
          step="5"
        >

        <span
          id="${ID}-canvas-transparency-label"
        ></span>
      </div>
    `;

    panel.innerHTML = `
      <b>
        Sparx — Своя тема для соцсети «Стрекоза» v1.6.12
      </b>

      <div class="master-toggle">
        <label for="${ID}-enabled">
          Включить тему
        </label>

        <input
          id="${ID}-enabled"
          type="checkbox"
        >
      </div>

      <fieldset>
        <legend>
          Сохранённые темы
        </legend>

        <div class="theme-slots">
          ${themeSlotsMarkup()}
        </div>
      </fieldset>

      <fieldset>
        <legend>
          Шрифт
        </legend>

        <div class="grid">
          <label>
            Шрифт:
          </label>

          <select id="${ID}-font">
            <option value="original">
              Оригинальный
            </option>

            <option value="comic">
              Comic Sans MS
            </option>

            <option value="tahoma">
              Tahoma
            </option>

            <option value="trebuchet">
              Trebuchet MS
            </option>

            <option value="verdana">
              Verdana
            </option>

            <option value="arial">
              Arial
            </option>

            <option value="georgia">
              Georgia
            </option>

            <option value="times">
              Times New Roman
            </option>

            <option value="courier">
              Courier New
            </option>

            <option value="lucida">
              Lucida Console
            </option>

            <option value="custom">
              Кастомный
            </option>
          </select>

          <label>
            Размер текста:
          </label>

          <div>
            <input
              id="${ID}-font-scale"
              type="range"
              min="70"
              max="160"
              step="5"
            >

            <span
              id="${ID}-font-scale-label"
            ></span>
          </div>

          <label>
            Изменять цвет текста:
          </label>

          <input
            id="${ID}-text-color-enabled"
            type="checkbox"
          >

          <label>
            Цвет текста:
          </label>

          <input
            id="${ID}-text-color"
            type="color"
          >

          <label>
            Ссылка на шрифт:
          </label>

          <input
            id="${ID}-custom-font-url"
            type="url"
            placeholder="https://example.com/font.woff2"
          >

          <label>
            Или файл с компьютера:
          </label>

          <div class="local-file">
            <input
              id="${ID}-local-font-file"
              type="file"
              accept=".woff,.woff2,.ttf,.otf,font/*"
            >

            <button
              id="${ID}-local-font-clear"
              type="button"
            >
              Удалить локальный
            </button>

            <div
              id="${ID}-local-font-status"
              class="local-file-status"
            ></div>
          </div>

          <label>
            Запасной шрифт:
          </label>

          <select
            id="${ID}-custom-font-fallback"
          >
            <option value="sans-serif">
              sans-serif
            </option>

            <option value="serif">
              serif
            </option>

            <option value="monospace">
              monospace
            </option>

            <option value="cursive">
              cursive
            </option>

            <option value="Tahoma, sans-serif">
              Tahoma
            </option>

            <option value="Arial, sans-serif">
              Arial
            </option>
          </select>
        </div>
      </fieldset>

      <fieldset>
        <legend>
          Задний фон
        </legend>

        <div class="grid">
          <label>
            Заменять фон:
          </label>

          <input
            id="${ID}-wallpaper-enabled"
            type="checkbox"
          >

          <label>
            Прямая ссылка:
          </label>

          <input
            id="${ID}-wallpaper"
            type="url"
          >

          <label>
            Или файл с компьютера:
          </label>

          <div class="local-file">
            <input
              id="${ID}-local-wallpaper-file"
              type="file"
              accept="image/*"
            >

            <button
              id="${ID}-local-wallpaper-clear"
              type="button"
            >
              Удалить локальные обои
            </button>

            <div
              id="${ID}-local-wallpaper-status"
              class="local-file-status"
            ></div>
          </div>

          <label>
            Режим:
          </label>

          <select id="${ID}-mode">
            <option value="cover">
              Заполнить экран
            </option>

            <option value="contain">
              Показать целиком
            </option>

            <option value="stretch">
              Растянуть
            </option>

            <option value="repeat">
              Плитка
            </option>
          </select>

          <label>
            Положение:
          </label>

          <input
            id="${ID}-position"
            type="text"
          >
        </div>
      </fieldset>

      <fieldset>
        <legend>
          Баннер профиля
        </legend>

        <div class="grid">
          <label>
            Заменять баннер:
          </label>

          <input
            id="${ID}-banner-enabled"
            type="checkbox"
          >

          <label>
            Прямая ссылка:
          </label>

          <input
            id="${ID}-banner"
            type="url"
            placeholder="https://example.com/banner.png"
          >

          <label>
            Или файл с компьютера:
          </label>

          <div class="local-file">
            <input
              id="${ID}-local-banner-file"
              type="file"
              accept="image/*"
            >

            <button
              id="${ID}-local-banner-clear"
              type="button"
            >
              Удалить локальный баннер
            </button>

            <div
              id="${ID}-local-banner-status"
              class="local-file-status"
            ></div>
          </div>

          <label>
            Режим:
          </label>

          <select id="${ID}-banner-mode">
            <option value="cover">Заполнить</option>
            <option value="contain">Показать целиком</option>
            <option value="stretch">Растянуть</option>
          </select>

          <label>
            Положение:
          </label>

          <input
            id="${ID}-banner-position"
            type="text"
          >
        </div>
      </fieldset>

      <fieldset>
        <legend>
          Просмотрщик записей
        </legend>

        <div class="grid">
          <label>
            Отдельная палитра:
          </label>

          <input
            id="${ID}-viewer-enabled"
            type="checkbox"
          >

          <label>
            Заголовок — тёмный / средний / светлый:
          </label>

          <div class="palette">
            <input id="${ID}-viewer-dark" type="color">
            <input id="${ID}-viewer-middle" type="color">
            <input id="${ID}-viewer-light" type="color">
          </div>

          <label>
            Основной фон окна:
          </label>

          <input
            id="${ID}-viewer-canvas"
            type="color"
          >

          <label>
            Цвет текста:
          </label>

          <input
            id="${ID}-viewer-text"
            type="color"
          >
        </div>

        <div class="theme-share-note">
          Эта палитра применяется к окну «Просмотр записи».
          Прозрачности здесь специально нет.
        </div>
      </fieldset>

      ${paletteField(
        'blue',
        'Синие элементы',
        blueExtra
      )}

      ${paletteField(
        'yellow',
        'Жёлтые и оранжевые элементы'
      )}

      ${paletteField(
        'neutral',
        'Светлые карточки и панели',
        neutralExtra
      )}

      ${paletteField(
        'canvas',
        'Основной серо-бежевый фон',
        canvasExtra
      )}

      ${paletteField(
        'controls',
        'Кнопки и элементы управления'
      )}

      <fieldset>
        <legend>
          Всплывающие окна
        </legend>

        <div class="grid">
          <label>
            Отдельный непрозрачный фон:
          </label>

          <input
            id="${ID}-popup-opaque-enabled"
            type="checkbox"
          >

          <label>
            Цвет фона:
          </label>

          <input
            id="${ID}-popup-color"
            type="color"
          >

        </div>
      </fieldset>

      <fieldset>
        <legend>
          Закруглённые углы
        </legend>

        <div class="grid">
          <label>
            Включить:
          </label>

          <input
            id="${ID}-rounded-enabled"
            type="checkbox"
          >

          <label>
            Радиус:
          </label>

          <div>
            <input
              id="${ID}-corner-radius"
              type="range"
              min="0"
              max="8"
              step="1"
            >

            <span
              id="${ID}-corner-radius-label"
            ></span>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>
          Поделиться темой
        </legend>

        <div class="grid">
          <label>
            Название темы:
          </label>

          <input
            id="${ID}-share-name"
            type="text"
            maxlength="80"
            value="Sparx theme"
          >
        </div>

        <div class="share-grid">
          <button id="${ID}-share-code" type="button">
            Скопировать код
          </button>

          <button id="${ID}-import-code" type="button">
            Вставить код
          </button>

          <button id="${ID}-export-sparx" type="button">
            Экспорт .sparx
          </button>

          <button id="${ID}-import-sparx" type="button">
            Импорт .sparx
          </button>
        </div>

        <input
          id="${ID}-import-sparx-file"
          type="file"
          accept=".sparx,application/json"
          hidden
        >

        <div class="share-note">
          Код переносит настройки и ссылки. Файл .sparx дополнительно переносит локальные обои, баннер и шрифт.
        </div>
      </fieldset>

      <div class="actions">
        <button
          id="${ID}-close"
          type="button"
        >
          Закрыть
        </button>

        <button
          id="${ID}-save"
          type="button"
        >
          Сохранить
        </button>

        <button
          id="${ID}-reset"
          class="reset-button"
          type="button"
        >
          Сбросить
        </button>
      </div>
    `;

    document.body.append(
      panel
    );

    const get = (
      name
    ) =>
      panel.querySelector(
        `#${ID}-${name}`
      );

    get('enabled').checked =
      settings.enabled;

    get('font').value =
      settings.font;

    get('font-scale').value =
      settings.fontScale;

    get('font-scale-label')
      .textContent =
        ` ${settings.fontScale}%`;

    get('text-color-enabled')
      .checked =
        settings
          .textColorEnabled;

    get('text-color')
      .value =
        settings.textColor;

    get('custom-font-url')
      .value =
        settings.customFontUrl;

    get('custom-font-fallback')
      .value =
        settings
          .customFontFallback;

    get('wallpaper-enabled')
      .checked =
        settings
          .wallpaperEnabled;

    get('wallpaper').value =
      settings.wallpaper;

    get('mode').value =
      settings
        .wallpaperMode;

    get('position').value =
      settings
        .wallpaperPosition;

    get('banner-enabled').checked =
      settings.bannerEnabled;

    get('banner').value =
      settings.banner;

    get('banner-mode').value =
      settings.bannerMode;

    get('banner-position').value =
      settings.bannerPosition;

    get('viewer-enabled').checked =
      settings.viewerEnabled;

    get('viewer-dark').value =
      settings.viewerDark;

    get('viewer-middle').value =
      settings.viewerMiddle;

    get('viewer-light').value =
      settings.viewerLight;

    get('viewer-canvas').value =
      settings.viewerCanvas;

    get('viewer-text').value =
      settings.viewerText;

    for (
      const group
      of GROUPS
    ) {
      get(
        `${group}-enabled`
      ).checked =
        settings[
          `${group}Enabled`
        ];

      get(
        `${group}-dark`
      ).value =
        settings[
          `${group}Dark`
        ];

      get(
        `${group}-middle`
      ).value =
        settings[
          `${group}Middle`
        ];

      get(
        `${group}-light`
      ).value =
        settings[
          `${group}Light`
        ];
    }

    get('blue-transparency')
      .value =
        settings
          .blueTransparency;

    get('blue-transparency-label')
      .textContent =
        ` ${settings.blueTransparency}%`;

    get('blue-aero-enabled')
      .checked =
        settings
          .blueAeroEnabled;

    get('blue-blur').value =
      settings.blueBlur;

    get('blue-blur-label')
      .textContent =
        ` ${settings.blueBlur}px`;

    get('blue-saturation')
      .value =
        settings
          .blueSaturation;

    get('blue-saturation-label')
      .textContent =
        ` ${settings.blueSaturation}%`;

    get('neutral-transparency')
      .value =
        settings
          .neutralTransparency;

    get('neutral-transparency-label')
      .textContent =
        ` ${settings.neutralTransparency}%`;

    get('canvas-transparency')
      .value =
        settings
          .canvasTransparency;

    get('canvas-transparency-label')
      .textContent =
        ` ${settings.canvasTransparency}%`;

    get('rounded-enabled')
      .checked =
        settings
          .roundedEnabled;

    const displayedCornerRadius =
      Math.max(
        0,
        Math.min(
          8,
          Number(
            settings.cornerRadius
          ) || 0
        )
      );

    get('corner-radius')
      .value =
        displayedCornerRadius;

    get('corner-radius-label')
      .textContent =
        ` ${displayedCornerRadius}px`;

    get('popup-opaque-enabled')
      .checked =
        settings
          .popupOpaqueEnabled;

    get('popup-color')
      .value =
        settings.popupColor;

    function writeSettingsToControls(
      source
    ) {
      const values =
        cloneThemeSettings(
          source
        );

      get('enabled').checked =
        values.enabled;

      get('font').value =
        values.font;

      get('font-scale').value =
        values.fontScale;

      get('font-scale-label')
        .textContent =
          ` ${values.fontScale}%`;

      get('text-color-enabled')
        .checked =
          values.textColorEnabled;

      get('text-color')
        .value =
          values.textColor;

      get('custom-font-url')
        .value =
          values.customFontUrl;

      get('custom-font-fallback')
        .value =
          values.customFontFallback;

      get('wallpaper-enabled')
        .checked =
          values.wallpaperEnabled;

      get('wallpaper').value =
        values.wallpaper;

      get('mode').value =
        values.wallpaperMode;

      get('position').value =
        values.wallpaperPosition;

      get('banner-enabled').checked =
        values.bannerEnabled;

      get('banner').value =
        values.banner;

      get('banner-mode').value =
        values.bannerMode;

      get('banner-position').value =
        values.bannerPosition;

      get('viewer-enabled').checked =
        values.viewerEnabled;

      get('viewer-dark').value =
        values.viewerDark;

      get('viewer-middle').value =
        values.viewerMiddle;

      get('viewer-light').value =
        values.viewerLight;

      get('viewer-canvas').value =
        values.viewerCanvas;

      get('viewer-text').value =
        values.viewerText;

      for (
        const group
        of GROUPS
      ) {
        get(
          `${group}-enabled`
        ).checked =
          values[
            `${group}Enabled`
          ];

        get(
          `${group}-dark`
        ).value =
          values[
            `${group}Dark`
          ];

        get(
          `${group}-middle`
        ).value =
          values[
            `${group}Middle`
          ];

        get(
          `${group}-light`
        ).value =
          values[
            `${group}Light`
          ];
      }

      get('blue-transparency')
        .value =
          values.blueTransparency;

      get('blue-transparency-label')
        .textContent =
          ` ${values.blueTransparency}%`;

      get('blue-aero-enabled')
        .checked =
          values.blueAeroEnabled;

      get('blue-blur').value =
        values.blueBlur;

      get('blue-blur-label')
        .textContent =
          ` ${values.blueBlur}px`;

      get('blue-saturation')
        .value =
          values.blueSaturation;

      get('blue-saturation-label')
        .textContent =
          ` ${values.blueSaturation}%`;

      get('neutral-transparency')
        .value =
          values.neutralTransparency;

      get('neutral-transparency-label')
        .textContent =
          ` ${values.neutralTransparency}%`;

      get('canvas-transparency')
        .value =
          values.canvasTransparency;

      get('canvas-transparency-label')
        .textContent =
          ` ${values.canvasTransparency}%`;

      const displayedCornerRadius =
        Math.max(
          0,
          Math.min(
            8,
            Number(
              values.cornerRadius
            ) || 0
          )
        );

      get('rounded-enabled')
        .checked =
          values.roundedEnabled;

      get('corner-radius')
        .value =
          displayedCornerRadius;

      get('corner-radius-label')
        .textContent =
          ` ${displayedCornerRadius}px`;

      get('popup-opaque-enabled')
        .checked =
          values.popupOpaqueEnabled;

      get('popup-color')
        .value =
          values.popupColor;

    }

    setFontStatus(
      fontCache.status
    );

    function updateLocalFileStatus() {
      get(
        'local-font-status'
      ).textContent =
        localFontAsset
          ? `Используется локально: ${localFontAsset.name} (${formatFileSize(localFontAsset.size)})`
          : 'Локальный шрифт не выбран. При наличии файла он имеет приоритет над ссылкой.';

      get(
        'local-wallpaper-status'
      ).textContent =
        localWallpaperAsset
          ? `Используются локально: ${localWallpaperAsset.name} (${formatFileSize(localWallpaperAsset.size)})`
          : 'Локальные обои не выбраны. При наличии файла он имеет приоритет над ссылкой.';

      get(
        'local-banner-status'
      ).textContent =
        localBannerAsset
          ? `Используется локально: ${localBannerAsset.name} (${formatFileSize(localBannerAsset.size)})`
          : 'Локальный баннер не выбран. При наличии файла он имеет приоритет над ссылкой.';
    }

    updateLocalFileStatus();

    function updateThemeSlotUi(
      index
    ) {
      const slot =
        themeSlots[index];

      const nameInput =
        get(
          `theme-slot-name-${index}`
        );

      const status =
        get(
          `theme-slot-status-${index}`
        );

      const loadButton =
        get(
          `theme-slot-load-${index}`
        );

      const clearButton =
        get(
          `theme-slot-clear-${index}`
        );

      if (!slot) {
        status.textContent =
          'Пусто';

        loadButton.disabled =
          true;

        clearButton.disabled =
          true;

        return;
      }

      nameInput.value =
        slot.name ||
        `Тема ${index + 1}`;

      const hasWallpaper =
        Boolean(
          readStoredAsset(
            themeSlotAssetKey(
              'wallpaper',
              index
            )
          )
        );

      const hasBanner =
        Boolean(
          readStoredAsset(
            themeSlotAssetKey(
              'banner',
              index
            )
          )
        );

      const hasFont =
        Boolean(
          readStoredAsset(
            themeSlotAssetKey(
              'font',
              index
            )
          )
        );

      const extras = [];

      if (hasWallpaper) {
        extras.push(
          'локальные обои'
        );
      }

      if (hasBanner) {
        extras.push(
          'локальный баннер'
        );
      }

      if (hasFont) {
        extras.push(
          'локальный шрифт'
        );
      }

      status.textContent =
        extras.length
          ? `Сохранено • ${extras.join(' • ')}`
          : 'Сохранено';

      loadButton.disabled =
        false;

      clearButton.disabled =
        false;
    }

    for (
      let index = 0;
      index < THEME_SLOT_COUNT;
      index += 1
    ) {
      const nameInput =
        get(
          `theme-slot-name-${index}`
        );

      get(
        `theme-slot-save-${index}`
      ).onclick =
        () => {
          settings =
            readSettings();

          const name =
            nameInput.value
              .trim() ||
            `Тема ${index + 1}`;

          themeSlots[index] = {
            name:
              name.slice(
                0,
                48
              ),

            settings:
              cloneThemeSettings(
                settings
              ),

            savedAt:
              Date.now(),
          };

          try {
            saveCurrentAssetsToThemeSlot(
              index
            );

            saveThemeSlots();

            GM_setValue(
              KEY,
              settings
            );
          } catch (error) {
            console.error(
              '[Sparx] Не удалось сохранить ячейку темы:',
              error
            );

            window.alert(
              'Не удалось сохранить тему в эту ячейку. Если в ней используются очень большие файлы, попробуйте уменьшить их размер.'
            );

            return;
          }

          updateThemeSlotUi(
            index
          );

          void rebuild();
        };

      get(
        `theme-slot-load-${index}`
      ).onclick =
        () => {
          const slot =
            themeSlots[index];

          if (!slot) {
            return;
          }

          settings =
            cloneThemeSettings(
              slot.settings
            );

          try {
            applyThemeSlotAssets(
              index
            );

            GM_setValue(
              KEY,
              settings
            );
          } catch (error) {
            console.error(
              '[Sparx] Не удалось применить ячейку темы:',
              error
            );

            window.alert(
              'Не удалось загрузить сохранённую тему.'
            );

            return;
          }

          writeSettingsToControls(
            settings
          );

          updateLocalFileStatus();

          void rebuild();
        };

      get(
        `theme-slot-clear-${index}`
      ).onclick =
        () => {
          const slot =
            themeSlots[index];

          if (!slot) {
            return;
          }

          if (
            !window.confirm(
              `Очистить ячейку «${slot.name || `Тема ${index + 1}`}»?`
            )
          ) {
            return;
          }

          clearThemeSlot(
            index
          );

          nameInput.value = '';

          updateThemeSlotUi(
            index
          );
        };

      nameInput.onchange =
        () => {
          const slot =
            themeSlots[index];

          if (!slot) {
            return;
          }

          const nextName =
            nameInput.value
              .trim() ||
            `Тема ${index + 1}`;

          slot.name =
            nextName.slice(
              0,
              48
            );

          saveThemeSlots();

          updateThemeSlotUi(
            index
          );
        };

      updateThemeSlotUi(
        index
      );
    }

    get(
      'local-font-file'
    ).onchange =
      async () => {
        const file =
          get(
            'local-font-file'
          ).files?.[0];

        if (!file) {
          return;
        }

        const ok =
          await storeLocalAsset(
            'font',
            file
          );

        get(
          'local-font-file'
        ).value = '';

        if (ok) {
          get('font').value =
            'custom';

          settings =
            readSettings();

          GM_setValue(
            KEY,
            settings
          );

          updateLocalFileStatus();
          void rebuild();
        }
      };

    get(
      'local-font-clear'
    ).onclick =
      () => {
        clearLocalAsset(
          'font'
        );

        updateLocalFileStatus();

        settings =
          readSettings();

        void rebuild();
      };

    get(
      'local-wallpaper-file'
    ).onchange =
      async () => {
        const file =
          get(
            'local-wallpaper-file'
          ).files?.[0];

        if (!file) {
          return;
        }

        const ok =
          await storeLocalAsset(
            'wallpaper',
            file
          );

        get(
          'local-wallpaper-file'
        ).value = '';

        if (ok) {
          get(
            'wallpaper-enabled'
          ).checked = true;

          settings =
            readSettings();

          GM_setValue(
            KEY,
            settings
          );

          updateLocalFileStatus();
          void rebuild();
        }
      };

    get(
      'local-wallpaper-clear'
    ).onclick =
      () => {
        clearLocalAsset(
          'wallpaper'
        );

        updateLocalFileStatus();

        settings =
          readSettings();

        void rebuild();
      };

    get(
      'local-banner-file'
    ).onchange =
      async () => {
        const file =
          get(
            'local-banner-file'
          ).files?.[0];

        if (!file) {
          return;
        }

        const ok =
          await storeLocalAsset(
            'banner',
            file
          );

        get(
          'local-banner-file'
        ).value = '';

        if (ok) {
          get('banner-enabled').checked = true;
          settings = readSettings();
          GM_setValue(KEY, settings);
          updateLocalFileStatus();
          void rebuild();
        }
      };

    get(
      'local-banner-clear'
    ).onclick =
      () => {
        clearLocalAsset('banner');
        updateLocalFileStatus();
        settings = readSettings();
        GM_setValue(KEY, settings);
        void rebuild();
      };

    const sliders = [
      [
        'font-scale',
        '%',
      ],

      [
        'blue-transparency',
        '%',
      ],

      [
        'blue-blur',
        'px',
      ],

      [
        'blue-saturation',
        '%',
      ],

      [
        'neutral-transparency',
        '%',
      ],

      [
        'canvas-transparency',
        '%',
      ],

      [
        'corner-radius',
        'px',
      ],
    ];

    for (
      const [
        id,
        suffix,
      ]
      of sliders
    ) {
      get(id).oninput =
        () => {
          get(
            `${id}-label`
          ).textContent =
            ` ${
              get(id).value
            }${suffix}`;
        };
    }

    function readSettings() {
      const next = {
        enabled:
          get('enabled')
            .checked,

        font:
          get('font')
            .value,

        fontScale:
          Number(
            get('font-scale')
              .value
          ),

        textColorEnabled:
          get(
            'text-color-enabled'
          ).checked,

        textColor:
          get('text-color')
            .value,

        customFontUrl:
          get(
            'custom-font-url'
          )
            .value
            .trim(),

        customFontFallback:
          get(
            'custom-font-fallback'
          ).value,

        wallpaperEnabled:
          get(
            'wallpaper-enabled'
          ).checked,

        wallpaper:
          get('wallpaper')
            .value
            .trim(),

        wallpaperMode:
          get('mode')
            .value,

        wallpaperPosition:
          get('position')
            .value
            .trim() ||
          'center center',

        bannerEnabled:
          get('banner-enabled')
            .checked,

        banner:
          get('banner')
            .value
            .trim(),

        bannerMode:
          get('banner-mode')
            .value,

        bannerPosition:
          get('banner-position')
            .value
            .trim() ||
          'center center',

        viewerEnabled:
          get('viewer-enabled')
            .checked,

        viewerDark:
          get('viewer-dark')
            .value,

        viewerMiddle:
          get('viewer-middle')
            .value,

        viewerLight:
          get('viewer-light')
            .value,

        viewerCanvas:
          get('viewer-canvas')
            .value,

        viewerText:
          get('viewer-text')
            .value,

        blueTransparency:
          Number(
            get(
              'blue-transparency'
            ).value
          ),

        blueAeroEnabled:
          get(
            'blue-aero-enabled'
          ).checked,

        blueBlur:
          Number(
            get('blue-blur')
              .value
          ),

        blueSaturation:
          Number(
            get(
              'blue-saturation'
            ).value
          ),

        neutralTransparency:
          Number(
            get(
              'neutral-transparency'
            ).value
          ),

        canvasTransparency:
          Number(
            get(
              'canvas-transparency'
            ).value
          ),

        roundedEnabled:
          get(
            'rounded-enabled'
          ).checked,

        cornerRadius:
          Math.max(
            0,
            Math.min(
              8,
              Number(
                get('corner-radius')
                  .value
              ) || 0
            )
          ),

        popupOpaqueEnabled:
          get(
            'popup-opaque-enabled'
          ).checked,

        popupColor:
          get('popup-color')
            .value,

      };

      for (
        const group
        of GROUPS
      ) {
        next[
          `${group}Enabled`
        ] =
          get(
            `${group}-enabled`
          ).checked;

        next[
          `${group}Dark`
        ] =
          get(
            `${group}-dark`
          ).value;

        next[
          `${group}Middle`
        ] =
          get(
            `${group}-middle`
          ).value;

        next[
          `${group}Light`
        ] =
          get(
            `${group}-light`
          ).value;
      }

      return next;
    }

    get('enabled').onchange =
      () => {
        settings = readSettings();
        GM_setValue(KEY, settings);
        void rebuild().then(() => {
          scheduleDynamicRefresh(0, null, true);
          scheduleIntegratedApply(0);
          scheduleSettledFullRefresh();
        });
      };

    let panelPreviewTimer = 0;

    const schedulePanelPreview = () => {
      clearTimeout(panelPreviewTimer);
      panelPreviewTimer = window.setTimeout(() => {
        if (!panel.isConnected) return;
        settings = readSettings();
        void rebuild();
      }, 120);
    };

    panel.querySelectorAll(`
      input[type="checkbox"]:not(#${ID}-enabled),
      input[type="color"],
      input[type="range"],
      select
    `).forEach((control) => {
      control.addEventListener('change', schedulePanelPreview);
    });

    panel.querySelectorAll('input[type="range"]').forEach((control) => {
      control.addEventListener('input', schedulePanelPreview);
    });

    for (const id of ['wallpaper', 'position', 'banner', 'banner-position', 'custom-font-url']) {
      get(id)?.addEventListener('change', schedulePanelPreview);
    }

    get('share-code').onclick =
      async () => {
        try {
          const draft = readSettings();
          const name = get('share-name').value.trim() || 'Sparx theme';
          const code = currentThemeShareCode(draft, name);
          const copied = await copyText(code);

          if (copied) {
            window.alert(
              'Код темы скопирован. Локальные обои, баннер и шрифт в код не входят — для полного переноса используй .sparx.'
            );
          } else {
            window.prompt('Скопируй код темы:', code);
          }
        } catch (error) {
          console.error('[Sparx] Не удалось создать код темы:', error);
          window.alert(error?.message || 'Не удалось создать код темы.');
        }
      };

    get('export-sparx').onclick =
      () => {
        try {
          const draft = readSettings();
          const name = get('share-name').value.trim() || 'Sparx theme';
          downloadSharedTheme(draft, name);
        } catch (error) {
          console.error('[Sparx] Не удалось экспортировать .sparx:', error);
          window.alert(error?.message || 'Не удалось экспортировать тему.');
        }
      };

    get('import-code').onclick =
      () => {
        const code = window.prompt('Вставь код темы Sparx:');
        if (!code) return;

        try {
          const imported = applyImportedTheme(
            parseThemeShareCode(code),
            false
          );
          window.alert(`Тема «${imported.name}» импортирована. Страница будет обновлена.`);
          location.reload();
        } catch (error) {
          console.error('[Sparx] Не удалось импортировать код темы:', error);
          window.alert(error?.message || 'Не удалось импортировать код темы.');
        }
      };

    const importSparxFile = get('import-sparx-file');

    get('import-sparx').onclick =
      () => {
        importSparxFile.value = '';
        importSparxFile.click();
      };

    importSparxFile.onchange =
      async () => {
        const file = importSparxFile.files?.[0];
        if (!file) return;

        if (file.size > 64 * 1024 * 1024) {
          window.alert('Файл темы слишком большой. Максимум для импортера — 64 МБ.');
          return;
        }

        try {
          const imported = applyImportedTheme(await file.text(), true);
          window.alert(`Тема «${imported.name}» импортирована. Страница будет обновлена.`);
          location.reload();
        } catch (error) {
          console.error('[Sparx] Не удалось импортировать .sparx:', error);
          window.alert(error?.message || 'Не удалось импортировать файл темы.');
        }
      };

    get('save').onclick =
      () => {
        settings =
          readSettings();

        GM_setValue(
          KEY,
          settings
        );

        void rebuild();

        panel.remove();
      };

    get('close').onclick =
      () =>
        panel.remove();

    get('reset').onclick =
      () => {
        if (
          !window.confirm(
            'Сбросить текущую тему Sparx и локальные файлы? Сохранённые ячейки тем останутся.'
          )
        ) {
          return;
        }

        GM_deleteValue(
          KEY
        );

        GM_deleteValue(
          OLD_POPUP_KEY
        );

        clearLocalAsset(
          'wallpaper'
        );

        clearLocalAsset(
          'font'
        );

        clearLocalAsset(
          'banner'
        );

        for (
          const oldKey
          of OLD_KEYS
        ) {
          GM_deleteValue(
            oldKey
          );
        }

        clearFontCache();

        location.reload();
      };
  }

  function start() {
    uiStyle =
      document.createElement(
        'style'
      );

    uiStyle.id =
      `${ID}-ui`;

    uiStyle.textContent =
      userInterfaceCss();

    document
      .documentElement
      .append(
        uiStyle
      );

    function cleanSidebarLabel(element) {
      return normalizedText(element)
        .replace(/[⚙️⚙🎨🖌️🖼️]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    }

    function sidebarContextScore(element) {
      if (!(element instanceof HTMLElement)) return -Infinity;

      let score = 0;
      const rect = element.getBoundingClientRect();

      if (rect.left < Math.max(360, innerWidth * 0.32)) score += 8;
      if (rect.width > 40 && rect.width < 420) score += 2;

      let node = element;
      for (let depth = 0; node && depth < 6; depth += 1, node = node.parentElement) {
        const text = normalizedText(node);

        for (const token of [
          'Моя страница',
          'Новости',
          'Сообщения',
          'Друзья',
          'Сообщества',
          'Музыка',
          'Правовая информация',
        ]) {
          if (text.includes(token)) score += 5;
        }

        if (text.length > 1200) break;
      }

      return score;
    }

    function sidebarSettingsLabel() {
      const selectors =
        'a,button,[role="link"],[role="button"],[onclick],li,td,div,span';

      const candidates = [...document.querySelectorAll(selectors)]
        .filter(
          (element) =>
            element instanceof HTMLElement &&
            cleanSidebarLabel(element) === 'Настройки'
        )
        .map((element) => ({
          element,
          score: sidebarContextScore(element),
        }))
        .sort((a, b) => b.score - a.score);

      if (candidates.length) {
        return candidates[0].element;
      }

      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT
      );

      const textCandidates = [];
      let node;

      while ((node = walker.nextNode())) {
        if (String(node.nodeValue || '').replace(/\s+/g, ' ').trim() !== 'Настройки') {
          continue;
        }

        if (node.parentElement instanceof HTMLElement) {
          textCandidates.push({
            element: node.parentElement,
            score: sidebarContextScore(node.parentElement),
          });
        }
      }

      textCandidates.sort((a, b) => b.score - a.score);
      if (textCandidates.length) return textCandidates[0].element;

      return [...document.querySelectorAll('a[href]')]
        .map((element) => ({
          element,
          score: sidebarContextScore(element),
        }))
        .filter(({ element }) => {
          const href = String(element.getAttribute('href') || '');
          return /(?:settings?|options?|preferences?)/i.test(href);
        })
        .sort((a, b) => b.score - a.score)[0]?.element || null;
    }

    function sidebarRowFor(labelElement) {
      if (!(labelElement instanceof HTMLElement)) return null;

      const clickable =
        labelElement.closest(
          'a,button,[role="link"],[role="button"],[onclick]'
        ) ||
        labelElement;

      let row = clickable;
      let cursor = clickable;

      for (let depth = 0; depth < 5; depth += 1) {
        const parent = cursor.parentElement;
        if (!parent || parent === document.body || parent === document.documentElement) break;

        const parentText = cleanSidebarLabel(parent);
        if (parentText !== 'Настройки') break;

        row = parent;
        cursor = parent;
      }

      return row;
    }

    function replaceSettingsLabelWithSparx(root) {
      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT
      );

      let node;
      let replaced = false;

      while ((node = walker.nextNode())) {
        const value = String(node.nodeValue || '');
        const clean = value.replace(/[⚙️⚙🎨🖌️🖼️]/g, '').replace(/\s+/g, ' ').trim();

        if (clean === 'Настройки') {
          node.nodeValue = 'Sparx';
          replaced = true;
          break;
        }
      }

      if (!replaced) {
        const target = root.matches?.('a,button,[role="link"],[role="button"]')
          ? root
          : root.querySelector?.('a,button,[role="link"],[role="button"]') || root;

        if (target instanceof HTMLElement) {
          target.textContent = 'Sparx';
        }
      }

      root.querySelectorAll('img,svg,picture').forEach((element) => {
        element.remove();
      });

      const iconWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let iconNode;
      while ((iconNode = iconWalker.nextNode())) {
        iconNode.nodeValue = String(iconNode.nodeValue || '')
          .replace(/[⚙️⚙🎨🖌️🖼️]/g, '');
      }
    }

    function buildSidebarEntry(row) {
      const clone = row.cloneNode(true);
      clone.id = `${ID}-menu-entry`;
      clone.dataset.sparxMenuEntry = '1';
      clone.removeAttribute('onclick');
      clone.removeAttribute('href');
      clone.removeAttribute('target');

      clone.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
      clone.querySelectorAll('[onclick]').forEach((element) => element.removeAttribute('onclick'));
      clone.querySelectorAll('[href]').forEach((element) => element.removeAttribute('href'));
      clone.querySelectorAll('[target]').forEach((element) => element.removeAttribute('target'));

      replaceSettingsLabelWithSparx(clone);

      const clickable = clone.matches(
        'a,button,[role="link"],[role="button"]'
      )
        ? clone
        : clone.querySelector(
            'a,button,[role="link"],[role="button"]'
          ) || clone;

      if (clickable instanceof HTMLElement) {
        clickable.setAttribute('role', 'button');
        clickable.setAttribute('tabindex', '0');
        clickable.setAttribute('aria-label', 'Sparx');
        clickable.style.cursor = 'pointer';
      }

      const activate = (event) => {
        event.preventDefault();
        event.stopPropagation();
        openPanel();
      };

      clone.addEventListener('click', activate);
      clone.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') activate(event);
      });

      return clone;
    }

    function ensureSidebarEntry() {
      document.getElementById(`${ID}-button`)?.remove();

      const settingsLabel = sidebarSettingsLabel();
      if (!settingsLabel) return null;

      const row = sidebarRowFor(settingsLabel);
      if (!(row instanceof HTMLElement) || !row.parentElement) return null;

      const entries = [...document.querySelectorAll(`[id="${ID}-menu-entry"]`)];
      let current = entries.shift() || null;

      for (const duplicate of entries) duplicate.remove();

      const alreadyCorrect = Boolean(
        current?.isConnected &&
        current.parentElement === row.parentElement &&
        row.nextElementSibling === current &&
        cleanSidebarLabel(current) === 'Sparx'
      );

      if (alreadyCorrect) return current;

      current?.remove();
      current = buildSidebarEntry(row);
      row.insertAdjacentElement('afterend', current);
      return current;
    }

    ensureSidebarEntry();
    setTimeout(ensureSidebarEntry, 350);
    setTimeout(ensureSidebarEntry, 1200);

    window.setInterval(() => {
      if (!document.hidden) ensureSidebarEntry();
    }, 2500);

    new MutationObserver(
      (mutations) => {
        const stylesheetChanged =
          mutations.some(
            (mutation) => {
              const candidates = [
                mutation.target,
                ...mutation.addedNodes,
                ...mutation.removedNodes,
              ];

              return candidates.some(
                (node) => {
                  if (
                    node instanceof
                    HTMLStyleElement
                  ) {
                    return ![
                      `${ID}-theme`,
                      `${ID}-effects`,
                      `${ID}-ui`,
                      FONT_STYLE_ID,
                    ].includes(
                      node.id
                    );
                  }

                  return (
                    node instanceof
                      HTMLLinkElement &&
                    node.rel ===
                      'stylesheet'
                  );
                }
              );
            }
          );

        if (stylesheetChanged) {
          scheduleSafeRebuild(
            150
          );
        }
      }
    ).observe(
      document.head,

      {
        childList:
          true,

        subtree:
          true,

        attributes:
          true,

        attributeFilter: [
          'href',
          'media',
          'disabled',
          'rel',
        ],
      }
    );

    new MutationObserver(
      (mutations) => {
        const roots = [];

        for (
          const mutation
          of mutations
        ) {
          if (
            mutation.type ===
              'attributes'
          ) {
            const target =
              mutation.target;

            if (
              !(
                target instanceof
                HTMLElement
              ) ||
              target.closest(
                `#${ID}-panel`
              ) ||
              activeBannerTouched.has(target)
            ) {
              continue;
            }

            if (
              mutation.attributeName ===
                'class'
            ) {
              const clean =
                (value) =>
                  String(value || '')
                    .split(/\s+/)
                    .filter(Boolean)
                    .filter(
                      (name) =>
                        !name.startsWith(
                          `${ID}-`
                        )
                    )
                    .sort()
                    .join(' ');

              if (
                clean(
                  mutation.oldValue
                ) ===
                clean(
                  target.className
                )
              ) {
                continue;
              }
            }

            roots.push(target);
            continue;
          }

          if (
            mutation.type ===
              'characterData'
          ) {
            if (
              mutation.target
                .parentElement
            ) {
              roots.push(
                mutation.target
                  .parentElement
              );
            }

            continue;
          }

          const added =
            [...mutation.addedNodes];

          for (
            const node
            of added
          ) {
            if (
              node instanceof
                HTMLElement
            ) {
              roots.push(node);
            } else if (
              node.nodeType ===
                Node.TEXT_NODE &&
              mutation.target instanceof
                HTMLElement
            ) {
              roots.push(
                mutation.target
              );
            }
          }

          if (
            mutation.target instanceof
              HTMLElement &&
            mutation.target !==
              document.body &&
            added.length
          ) {
            roots.push(
              mutation.target
            );
          }
        }

        if (!roots.length) {
          return;
        }

        ensureSidebarEntry();

        scheduleIntegratedApply(
          25
        );

        scheduleDynamicRefresh(
          70,
          roots
        );

        scheduleSettledFullRefresh();
      }
    ).observe(
      document.body,

      {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeOldValue: true,
        attributeFilter: [
          'class',
          'hidden',
          'src',
          'open',
          'aria-hidden',
        ],
      }
    );

    document.addEventListener(
      'beforeinput',

      (event) => {
        if (
          editableElement(
            event.target
          )
        ) {
          noteTyping(
            1000
          );
        }
      },

      true
    );

    document.addEventListener(
      'input',

      (event) => {
        if (
          editableElement(
            event.target
          )
        ) {
          noteTyping(
            1000
          );
        }
      },

      true
    );

    document.addEventListener(
      'compositionstart',

      (event) => {
        if (
          editableElement(
            event.target
          )
        ) {
          compositionActive = true;
          noteTyping(
            1500
          );
        }
      },

      true
    );

    document.addEventListener(
      'compositionend',

      (event) => {
        if (
          editableElement(
            event.target
          )
        ) {
          compositionActive = false;
          noteTyping(
            500
          );
        }
      },

      true
    );

    document.addEventListener(
      'focusout',

      (event) => {
        if (
          editableElement(
            event.target
          )
        ) {
          compositionActive = false;
          typingUntil =
            Date.now() +
            80;

          scheduleDynamicRefresh(
            120,
            null,
            true
          );

          scheduleIntegratedApply(
            120
          );
        }
      },

      true
    );

    window.addEventListener(
      'resize',

      () => {
        scheduleDynamicRefresh(
          120
        );

        scheduleIntegratedApply(
          20
        );
      },

      {
        passive: true,
      }
    );

    let observedLocation =
      location.href;

    const handleNavigation =
      () => {
        if (
          location.href ===
          observedLocation
        ) {
          return;
        }

        observedLocation =
          location.href;

        scheduleSafeRebuild(
          120
        );

        scheduleDynamicRefresh(
          120,
          null,
          true
        );

        scheduleSettledFullRefresh();

        for (const delay of [320, 800, 1600]) {
          window.setTimeout(
            () => {
              ensureSidebarEntry();
              refreshNativeZones();
              scheduleDynamicRefresh(0, null, true);
              scheduleIntegratedApply(0);
            },
            delay
          );
        }
      };

    for (
      const method
      of [
        'pushState',
        'replaceState',
      ]
    ) {
      const original =
        history[method];

      if (
        typeof original ===
        'function'
      ) {
        history[method] =
          function (...args) {
            const result =
              original.apply(
                this,
                args
              );

            queueMicrotask(
              handleNavigation
            );

            return result;
          };
      }
    }

    for (
      const eventName
      of [
        'pageshow',
        'popstate',
        'hashchange',
      ]
    ) {
      window.addEventListener(
        eventName,
        handleNavigation
      );
    }

    document.addEventListener(
      'click',

      () => {
        scheduleIntegratedApply(90);
        scheduleDynamicRefresh(110, null, true);
      },

      true
    );

    GM_registerMenuCommand(
      'Sparx — Настройки',
      openPanel
    );

    GM_registerMenuCommand(
      '↻ Пересканировать CSS',

      () =>
        void rebuild()
    );

    GM_registerMenuCommand(
      'Сбросить тему',

      () => {
        GM_deleteValue(
          KEY
        );

        GM_deleteValue(
          OLD_POPUP_KEY
        );

        clearLocalAsset(
          'wallpaper'
        );

        clearLocalAsset(
          'font'
        );

        clearLocalAsset(
          'banner'
        );

        for (
          const oldKey
          of OLD_KEYS
        ) {
          GM_deleteValue(
            oldKey
          );
        }

        location.reload();
      }
    );

    document
      .querySelectorAll(
        'link[rel="stylesheet"]'
      )
      .forEach(
        (link) =>
          link.addEventListener(
            'load',
            () =>
              scheduleSafeRebuild(
                60
              ),
            { once: true }
          )
      );

    refreshNativeZones();

    setTimeout(
      () =>
        void rebuild(),

      90
    );

    setTimeout(scheduleSettledFullRefresh, 260);

    for (const delay of [180, 420, 900, 1500, 2600]) {
      setTimeout(
        () => {
          ensureSidebarEntry();
          refreshNativeZones();
          scheduleIntegratedApply(0);
          scheduleDynamicRefresh(0, null, true);
        },
        delay
      );
    }

    window.addEventListener(
      'load',
      () => {
        refreshNativeZones();
        scheduleDynamicRefresh(0, null, true);
        scheduleIntegratedApply(0);
        scheduleSettledFullRefresh();
      },
      { once: true }
    );

    document.addEventListener(
      'visibilitychange',
      () => {
        if (!document.hidden) {
          ensureSidebarEntry();
          refreshNativeZones();
          scheduleDynamicRefresh(0, null, true);
          scheduleIntegratedApply(0);
          scheduleSettledFullRefresh();
        }
      }
    );
  }

  window.addEventListener(
    'beforeunload',
    () => {
      revokeLocalAssetUrl(
        'wallpaper'
      );

      revokeLocalAssetUrl(
        'font'
      );

      revokeLocalAssetUrl(
        'banner'
      );
    }
  );

  start();
})();
