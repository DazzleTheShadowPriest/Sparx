// ==UserScript==
// @name         Sparx - Своя тема для соцсети "Стрекоза"
// @namespace    dragonfly-custom-css
// @version      1.3
// @description  Приветствуйте Sparx, кастомный скрипт, который позволяет настраивать тему Стрекозы под себя. Он позволяет настраивать свой фон, ввиде ссылки на изображение, менять цвет и прозрачность, менять шрифты и его цвет из предложенных, а также встраивать свой собственный ввиде ссылки на него, а также делать углы менее острыми. Короче, сделаю свою Стрекозу максимально своей.
// @author       DazzleThePriest aka TheDoctorCrow (https://www.dragonfly-flash.ru/?id=DazzleThePriest)
// @match        https://dragonfly-flash.ru/*
// @match        http://dragonfly-flash.ru/*
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
  const OLD_POPUP_KEY = 'df-v56-popup-opaque-settings';
  const WALLPAPER_LAYER_ID =
    `${ID}-wallpaper-layer`;

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

  /*
   * В Sparx 1.0 радиус намеренно ограничен 8px.
   * Это также нормализует старые сохранённые
   * значения из предыдущих версий скрипта.
   */
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

  let themeStyle;
  let uiStyle;
  let rebuildTimer;
  let dynamicRefreshTimer;
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

  /*
   * Исходные inline-свойства текста сохраняются,
   * чтобы выключение настройки полностью возвращало
   * оформление сайта без перезагрузки.
   */
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

    popupOpen:
      `${ID}-popup-open`,
  };

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

      /*
       * Важное исправление:
       * фон сайта местами хранится
       * в CSS-переменных.
       */
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
            `${rule.selectorText}` +
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
          // Недоступный импорт.
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
    const active =
      settings.enabled &&
      settings.wallpaperEnabled &&
      Boolean(
        String(
          settings.wallpaper ||
          ''
        ).trim()
      );

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

      /*
       * Слой находится внутри body,
       * но фиксирован относительно окна.
       * Поэтому он не заканчивается вместе
       * с короткой оболочкой страницы.
       */
      document.body.prepend(
        layer
      );
    }

    return layer;
  }

  function wallpaperCss() {
    if (
      !settings
        .wallpaperEnabled ||
      !String(
        settings.wallpaper
      ).trim()
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
      /*
       * html остаётся страховочным чёрным
       * холстом, а body становится прозрачным.
       * Само изображение рисуется отдельным
       * фиксированным слоем на весь viewport.
       */
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
            String(
              settings.wallpaper
            ).trim()
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
          fontFormat(
            settings
              .customFontUrl
          );

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
        html body button,
        html body input,
        html body select,
        html body textarea,
        html body option {
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
        /*
         * Это запасное правило. Основное назначение
         * цвета выполняется inline с !important —
         * так цвет срабатывает даже против исходных
         * селекторов сайта с ID и собственным !important.
         */
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
            LIVE.canvas,
            LIVE.shell,
            LIVE.round,
            LIVE.hoverRound,
            LIVE.roundClip,
            LIVE.text,
            LIVE.canvasImage,
            LIVE.neutralImage
          );
        }
      );
  }

  function markSelectors(
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
          document
            .querySelectorAll(
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
          // Неподдерживаемый селектор.
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
    /*
     * На внутренних страницах структура сайта
     * различается. Сначала ищем настоящий Explorer
     * через адресную строку, чтобы случайно не
     * назначить shell музыкальному списку, сообщениям
     * или другому большому содержимому страницы.
     */
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

  function markIndependentRoundables() {
    if (
      !settings.roundedEnabled
    ) {
      return;
    }

    document.body
      .querySelectorAll('*')
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

  function markTextElements() {
    if (
      !settings.textColorEnabled ||
      !/^#[\da-f]{6}$/i.test(
        settings.textColor
      )
    ) {
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

    document.body
      .querySelectorAll('*')
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
  }

  function markLiveSurfaces(
    statistics
  ) {
    clearLiveClasses();

    markSelectors(
      statistics.surface,
      LIVE.surface
    );

    markSelectors(
      statistics.blue,
      LIVE.surface,
      LIVE.blue
    );

    markSelectors(
      statistics.neutral,
      LIVE.surface,
      LIVE.neutral
    );

    markSelectors(
      statistics.canvas,
      LIVE.surface,
      LIVE.canvas
    );

    /*
     * Дополнительная проверка реальных
     * вычисленных цветов нужна для
     * элементов с CSS-переменными.
     */
    document.body
      .querySelectorAll('*')
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

          const control =
            element.matches(`
              button,
              input,
              select,
              textarea,
              option,
              [role="button"]
            `);

          /*
           * Белые карточки и серо-бежевый холст
           * используют близкие цвета. Поэтому
           * нейтральный fallback применяется лишь
           * к элементам, похожим именно на карточку
           * или панель, а не ко всей странице.
           */
          const neutralSurface =
            !control &&
            /(?:card|panel|post|entry|profile|box|window|dialog|modal|notification|message|sidebar|feed|wall|item|content)/i
              .test(
                signature
              );

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
            blueDistance <= 78 &&
            blueDistance <=
              neutralDistance &&
            blueDistance <=
              canvasDistance
          ) {
            element.classList.add(
              LIVE.surface,
              LIVE.blue
            );
          } else if (
            neutralSurface &&
            neutralDistance <= 64 &&
            neutralDistance <=
              blueDistance
          ) {
            element.classList.add(
              LIVE.surface,
              LIVE.neutral
            );
          } else if (
            canvasDistance <= 78
          ) {
            element.classList.add(
              LIVE.surface,
              LIVE.canvas
            );
          }
        }
      );

    /*
     * Скругление больше не зависит от
     * палитры серо-бежевого фона.
     */
    markIndependentRoundables();
    markTextElements();

    document
      .querySelectorAll(
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

    document
      .querySelectorAll(
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
      findWindowShell();

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
    if (
      settings.wallpaperEnabled &&
      String(
        settings.wallpaper
      ).trim()
    ) {
      return (
        `url(` +
        `${JSON.stringify(
          String(
            settings.wallpaper
          ).trim()
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
        : INTEGRATED.popupComposer
    );

    header?.classList.add(
      INTEGRATED.popupTitle
    );

    if (
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

    /*
     * Aero больше не задаёт собственную
     * цветную подложку. Прозрачностью синего
     * управляет только blueTransparency,
     * поэтому включение размытия не делает
     * панели визуально плотнее.
     */
    const bandOpacity =
      Math.max(
        0.22,
        blueOpacity *
        0.72
      );

    let css = `
      /*
       * Внешняя оболочка больше не получает
       * overflow:hidden: именно он блокировал
       * вертикальную прокрутку и обрезал окна.
       * Скругление выполняется на конкретных
       * поверхностях и слоях заголовка.
       */
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

      /*
       * Aero раньше случайно исправлял прокрутку,
       * потому что назначал корню Explorer
       * position:relative. Теперь это правило
       * работает всегда, независимо от Aero.
       */
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

      /*
       * Окно уведомлений временно снимает
       * отсечение с собственных предков.
       */
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

    /*
     * Safe hotfix 1.4: синяя прозрачность
     * больше не копирует обои внутрь панели.
     */
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
      settings.neutralEnabled &&
      Number(
        settings
          .neutralTransparency
      ) > 0
    ) {
      css += `
        /*
         * Прозрачность светлых карточек отделена
         * от синего интерфейса, основного холста
         * и элементов управления.
         */
        .${LIVE.neutral}:not(
          .${LIVE.blue}
        ):not(
          .${LIVE.canvas}
        ):not(
          .${INTEGRATED.popupRoot}
        ) {
          background-color:
            ${rgbaFromHex(
              settings.neutralMiddle,
              neutralOpacity
            )} !important;

          background-clip:
            padding-box !important;
        }

        /*
         * Однотонные градиенты убираются,
         * но настоящие изображения сохраняются.
         */
        .${LIVE.neutral}:not(
          .${LIVE.blue}
        ):not(
          .${LIVE.canvas}
        ):not(
          .${INTEGRATED.popupRoot}
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

        /*
         * У однотонных серо-бежевых панелей
         * убирается мешающий непрозрачный градиент.
         * Настоящие фоновые изображения с url(...)
         * сохраняются на Музыке, в Сообщениях,
         * Друзьях и Сообществах.
         */
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

          /*
           * Цвет и альфа уже находятся на
           * .${LIVE.blue}. Этот слой отвечает
           * только за backdrop-filter, иначе
           * две полупрозрачные подложки
           * складывались и убирали прозрачность.
           *
           * Почти нулевая альфа нужна лишь как
           * триггер для реализаций браузеров,
           * которым требуется нарисованный фон
           * для стабильного backdrop-filter.
           */
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

        /*
         * Финальный барьер от конфликтов:
         * Aero не получает opacity, filter
         * или дополнительный непрозрачный фон
         * на самих синих элементах.
         */
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

    /*
     * Верхняя рамка Explorer намеренно всегда
     * остаётся прямоугольной. Общая настройка
     * закруглений влияет только на содержимое сайта.
     * Здесь также нет overflow:hidden, чтобы рамка
     * не вмешивалась в прокрутку и уведомления.
     */
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

        button,
        input,
        select,
        textarea {
          border-radius:
            ${controlRadius}px !important;
        }
      `;
    }

    /*
     * Защита от общих правил закругления:
     * заголовок Explorer остаётся острым даже
     * после динамического пересканирования DOM.
     */
    css += `
      .${INTEGRATED.explorerFrame},
      .${INTEGRATED.explorerRoot},
      .${INTEGRATED.explorerTitle},
      .${INTEGRATED.explorerTitleLayer} {
        border-radius:
          0 !important;
      }
    `;

    /*
     * Последнее правило намеренно идёт после
     * Explorer и shell: открытое уведомление
     * не должно обрезаться их overflow:hidden.
     */
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

  function refreshDynamicTheme() {
    dynamicRefreshTimer = 0;

    if (
      !settings.enabled ||
      !lastStatistics
    ) {
      return;
    }

    /*
     * Во время набора не снимаем и не назначаем
     * классы заново. Даже краткое переустройство
     * CSS вокруг textarea может изменить расчёт
     * её высоты на один кадр и вызвать дёргание.
     */
    if (userIsEditing()) {
      scheduleDynamicRefresh(
        180
      );
      return;
    }

    markLiveSurfaces(
      lastStatistics
    );

    applyAddressBarColor();
    applyIntegratedFixes();
  }

  function scheduleDynamicRefresh(
    delay = 80
  ) {
    clearTimeout(
      dynamicRefreshTimer
    );

    dynamicRefreshTimer =
      window.setTimeout(
        refreshDynamicTheme,
        delay
      );
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

    syncWallpaperLayer();

    if (
      !settings.enabled
    ) {
      lastStatistics = null;
      themeStyle.textContent = '';
      clearLiveClasses();
      clearIntegratedClasses();
      applyAddressBarColor();
      return;
    }

    let customFontSource = '';

    if (
      settings.font ===
      'custom'
    ) {
      customFontSource =
        await loadCustomFont(
          settings
            .customFontUrl
        );

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

    let css =
      fontCss(
        customFontSource
      );

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

    /*
     * Фон добавляется после стилей сайта.
     * Это не даёт исходному background
     * снова проявиться ниже оболочки.
     */
    const wallpaper =
      wallpaperCss();

    /*
     * Сначала применяется обычная палитра.
     * Затем находятся реальные элементы,
     * включая использующие CSS-переменные.
     */
    themeStyle.textContent =
      css +
      wallpaper;

    /*
     * Статистика селекторов сохраняется для
     * лёгкого обновления динамического DOM.
     * Такое обновление не переписывает @font-face
     * и не заставляет браузер заново считать
     * метрики кастомного шрифта при каждом вводе.
     */
    lastStatistics =
      statistics;

    markLiveSurfaces(
      statistics
    );

    /*
     * После определения элементов
     * применяется стекло и закругление.
     * Фон остаётся последним CSS-блоком.
     */
    themeStyle.textContent =
      css +
      effectsCss() +
      wallpaper;

    applyAddressBarColor();
    applyIntegratedFixes();
  }

  function userInterfaceCss() {
    return `
      #${ID}-button {
        all:
          initial !important;

        position:
          fixed !important;

        right:
          16px !important;

        bottom:
          14px !important;

        z-index:
          2147483646 !important;

        width:
          46px !important;

        height:
          42px !important;

        border:
          2px outset
          #fff !important;

        background:
          #ece9d8 !important;

        color:
          #111 !important;

        font:
          21px/38px
          Tahoma,
          sans-serif !important;

        text-align:
          center !important;

        cursor:
          pointer !important;

        box-shadow:
          0 2px 9px
          #0006 !important;
      }

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

      @media (
        max-width:
          700px
      ) {
        #${ID}-panel .grid {
          grid-template-columns:
            1fr !important;
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
        Sparx — Своя тема для соцсети «Стрекоза» v1.3
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
              Кастомный по ссылке
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

      <div class="actions">
        <button
          id="${ID}-preview"
          type="button"
        >
          Проверить
        </button>

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

    setFontStatus(
      fontCache.status
    );

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

    get('preview').onclick =
      () => {
        settings =
          readSettings();

        void rebuild();
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
            'Сбросить все настройки Sparx?'
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

    const button =
      document.createElement(
        'button'
      );

    button.id =
      `${ID}-button`;

    button.type =
      'button';

    button.textContent =
      '🎨';

    button.title =
      'Настроить тему';

    button.onclick =
      openPanel;

    document.body.append(
      button
    );

    /*
     * Пересобирает тему,
     * когда сайт добавляет новый CSS.
     */
    new MutationObserver(
      (mutations) => {
        const added =
          mutations.some(
            (mutation) =>
              [
                ...mutation
                  .addedNodes,
              ].some(
                (node) =>
                  node instanceof
                    HTMLStyleElement ||
                  (
                    node instanceof
                      HTMLLinkElement &&
                    node.rel ===
                      'stylesheet'
                  )
              )
          );

        if (added) {
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
      }
    );

    /*
     * Новые записи и панели получают классы
     * через лёгкое обновление DOM. Полная
     * пересборка CSS здесь запрещена: она
     * удаляла и заново добавляла @font-face
     * во время ввода и вызывала дёргание окна.
     */
    new MutationObserver(
      (mutations) => {
        if (integratedApplying) {
          return;
        }

        const relevant =
          mutations.filter(
            (mutation) =>
              [
                ...mutation
                  .addedNodes,

                ...mutation
                  .removedNodes,
              ].some(
                (node) =>
                  node instanceof
                    HTMLElement &&
                  node.id !==
                    WALLPAPER_LAYER_ID &&
                  !node.classList?.contains(
                    INTEGRATED.glassLayer
                  )
              )
          );

        if (!relevant.length) {
          return;
        }

        const editorMutation =
          relevant.some(
            mutationTouchesEditor
          );

        /*
         * Сайт может перерисовывать редактор
         * после каждой буквы. Пока идёт ввод,
         * такие мутации полностью игнорируются.
         */
        if (
          editorMutation ||
          userIsEditing()
        ) {
          noteTyping(
            900
          );
          return;
        }

        scheduleIntegratedApply(
          25
        );

        scheduleDynamicRefresh(
          80
        );
      }
    ).observe(
      document.body,

      {
        childList:
          true,

        subtree:
          true,
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
            120
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

      () =>
        scheduleIntegratedApply(
          20
        ),

      {
        passive: true,
      }
    );

    document.addEventListener(
      'click',

      () => {
        for (
          const delay
          of [
            0,
            40,
            140,
            360,
          ]
        ) {
          window.setTimeout(
            applyIntegratedFixes,
            delay
          );
        }
      },

      true
    );

    GM_registerMenuCommand(
      '🎨 Настроить тему',
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

    setTimeout(
      () =>
        void rebuild(),

      120
    );

    setTimeout(
      () =>
        scheduleIntegratedApply(0),

      180
    );

    setTimeout(
      () =>
        void rebuild(),

      1300
    );
  }

  start();
})();