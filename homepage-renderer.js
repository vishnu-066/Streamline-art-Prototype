/**
 * homepage-renderer.js  —  Streamline Art Dynamic Homepage
 *
 * ARCHITECTURE
 * ─────────────────────────────────────────────────────────
 * 1. Tries to fetch content from DATA_SOURCE (JSON file or API endpoint).
 * 2. Falls back to INLINE_DATA if fetch fails (file:// protocol, offline, etc.).
 * 3. Renders each section via dedicated render functions.
 * 4. Re-applies reveal animations and existing UI hooks after render.
 *
 * TO CONNECT A REAL API
 * ─────────────────────
 * Change DATA_SOURCE to your endpoint URL:
 *   const DATA_SOURCE = 'https://api.streamlineart.com/v1/homepage';
 * The JSON shape must match the schema in homepage-data.json.
 *
 * ─────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  /* ── Config ─────────────────────────────────────────── */
  var DATA_SOURCE = 'homepage-data.json';   // ← swap to API URL here
  var CACHE_TTL   = 5 * 60 * 1000;          // 5 min client-side cache

  /* ── Social SVG icons ───────────────────────────────── */
  var SOCIAL_ICONS = {
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
    facebook:  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>',
    linkedin:  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>',
    pinterest: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.236 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.598-.299-1.482c0-1.388.806-2.428 1.808-2.428.852 0 1.265.64 1.265 1.408 0 .858-.546 2.140-.828 3.33-.235.995.499 1.806 1.476 1.806 1.772 0 3.135-1.867 3.135-4.563 0-2.386-1.714-4.053-4.162-4.053-2.836 0-4.5 2.127-4.5 4.326 0 .856.33 1.773.741 2.274a.3.3 0 01.069.283c-.076.313-.244.995-.277 1.134-.044.183-.145.222-.334.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.966-.527-2.292-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>'
  };

  /* ════════════════════════════════════════════════════
     DATA LOADING
  ════════════════════════════════════════════════════ */

  function loadData(callback) {
    // Try sessionStorage cache first
    try {
      var cached = sessionStorage.getItem('hp_data');
      var ts     = sessionStorage.getItem('hp_ts');
      if (cached && ts && (Date.now() - +ts) < CACHE_TTL) {
        return callback(JSON.parse(cached));
      }
    } catch(e) {}

    // Try fetching from DATA_SOURCE
    if (typeof fetch !== 'undefined') {
      fetch(DATA_SOURCE)
        .then(function(r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function(data) {
          try {
            sessionStorage.setItem('hp_data', JSON.stringify(data));
            sessionStorage.setItem('hp_ts', Date.now().toString());
          } catch(e) {}
          callback(data);
        })
        .catch(function() {
          // Fetch failed — use inline fallback
          callback(INLINE_DATA);
        });
    } else {
      callback(INLINE_DATA);
    }
  }

  /* ════════════════════════════════════════════════════
     RENDERERS
  ════════════════════════════════════════════════════ */

  /* ── Hero ───────────────────────────────────────────── */
  function renderHero(heroes) {
    var el = document.getElementById('heroSection');
    if (!el || !heroes || !heroes.length) return;
    var h = heroes[0]; // single hero for now; extend for carousel
    el.innerHTML =
      '<a href="' + h.link + '">' +
        '<img src="' + h.image + '" alt="' + esc(h.alt) + '" loading="' + (h.loading || 'lazy') + '" />' +
      '</a>';
  }

  /* ── Highlights ─────────────────────────────────────── */
  function renderHighlights(items) {
    var el = document.getElementById('highlightsGrid');
    if (!el || !items) return;
    el.innerHTML = items.map(function(h) {
      return '<a href="' + h.link + '" class="highlight-card">' +
               '<div class="highlight-card-img">' +
                 '<img src="' + h.image + '" alt="' + esc(h.alt) + '" loading="lazy" />' +
               '</div>' +
               '<span class="highlight-card-label">' + h.label + '</span>' +
             '</a>';
    }).join('');
  }

  /* ── Catalogs ───────────────────────────────────────── */
  function renderCatalogs(items) {
    var el = document.getElementById('catalogsSection');
    if (!el || !items) return;
    var rows = [], row = [];
    items.forEach(function(c, i) {
      row.push(c);
      if (row.length === 4 || i === items.length - 1) {
        rows.push(row);
        row = [];
      }
    });
    el.innerHTML = rows.map(function(r) {
      return '<div class="catalogs-grid reveal-row">' +
        r.map(function(c) {
          return '<a href="' + c.link + '" class="catalog-card"' +
                   (c.target ? ' target="' + c.target + '" rel="noopener"' : '') + '>' +
                   '<div class="catalog-card-img">' +
                     '<img src="' + c.image + '" alt="' + esc(c.alt) + '" loading="lazy" />' +
                   '</div>' +
                   '<span class="catalog-card-label">' + c.label + '</span>' +
                 '</a>';
        }).join('') +
      '</div>';
    }).join('');
    reobserve(el);
  }

  /* ── Artists ────────────────────────────────────────── */
  function renderArtists(items) {
    var el = document.getElementById('artistsGrid');
    if (!el || !items) return;
    el.innerHTML = items.map(function(a) {
      return '<a href="' + a.link + '" class="artist-card"' +
               (a.target ? ' target="' + a.target + '" rel="noopener"' : '') + '>' +
               '<div class="artist-card-img">' +
                 '<img src="' + a.image + '" alt="' + esc(a.alt) + '" loading="lazy" />' +
               '</div>' +
               '<span class="artist-card-label">' + a.label + '</span>' +
             '</a>';
    }).join('');
  }

  /* ── Mega Menu ──────────────────────────────────────── */
  function renderMegaMenu(menus) {
    var navLinks = document.querySelector('.nav-links');
    if (!navLinks || !menus) return;

    // Find existing static list items that correspond to menu entries
    // and update their content rather than replacing the whole nav
    // (preserves hover/CSS behaviour, mobile nav wiring, etc.)
    menus.forEach(function(menu) {
      // Match by the top-level anchor href
      var anchor = navLinks.querySelector('a[href="' + menu.link + '"]');
      if (!anchor) return;
      var li = anchor.parentElement;
      var mega = li.querySelector('.mega-menu');
      if (!mega) return;

      // Update mega-img
      var imgEl  = mega.querySelector('.mega-img img');
      var lblEl  = mega.querySelector('.mega-img-label');
      if (imgEl) { imgEl.src = menu.image; imgEl.alt = menu.image_alt || ''; }
      if (lblEl) { lblEl.textContent = menu.image_label || ''; }

      // Rebuild mega-content columns
      var content = mega.querySelector('.mega-content');
      if (!content || !menu.columns) return;
      content.innerHTML = menu.columns.map(function(col) {
        return '<div class="mega-col">' +
          '<p class="mega-heading">' + col.heading + '</p>' +
          '<ul>' +
            col.links.map(function(lnk) {
              return '<li><a href="' + lnk.href + '">' + lnk.label + '</a></li>';
            }).join('') +
          '</ul>' +
        '</div>';
      }).join('');
    });
  }

  /* ── Footer ─────────────────────────────────────────── */
  function renderFooter(f) {
    if (!f) return;

    // Logo
    var logo = document.querySelector('.footer-logo');
    if (logo && f.logo) { logo.src = f.logo.src; logo.alt = f.logo.alt; }

    // Address block
    var addrEl = document.querySelector('.footer-address');
    if (addrEl && f.address) {
      var a = f.address;
      addrEl.innerHTML =
        a.street + '<br/>' + a.city +
        '<p class="footer-info-group">Hours of operation: ' + a.hours + '</p>' +
        '<p class="footer-info-group">' + a.phone + '<br/>' +
          '<a href="mailto:' + a.email + '">' + a.email.toUpperCase() + '</a>' +
        '</p>';
    }

    // Social links
    var socialEl = document.querySelector('.footer-social');
    if (socialEl && f.social) {
      socialEl.innerHTML = f.social.map(function(s) {
        return '<a href="' + s.url + '" aria-label="' + s.label + '" target="_blank" rel="noopener">' +
                 (SOCIAL_ICONS[s.platform] || '') +
               '</a>';
      }).join('');
    }

    // Footer columns
    if (f.columns) {
      var cols = document.querySelectorAll('.footer-col');
      f.columns.forEach(function(col, i) {
        if (!cols[i]) return;
        var titleEl = cols[i].querySelector('.footer-col-title');
        var ulEl    = cols[i].querySelector('ul');
        if (titleEl) titleEl.textContent = col.title;
        if (ulEl) {
          ulEl.innerHTML = col.links.map(function(lnk) {
            return '<li><a href="' + lnk.href + '">' + lnk.label + '</a></li>';
          }).join('');
        }
      });
    }

    // Legal / copyright
    if (f.legal) {
      var copy = document.querySelector('.footer-copyright');
      if (copy) copy.innerHTML = f.legal.copyright;
      var legalEl = document.querySelector('.footer-legal');
      if (legalEl) {
        legalEl.innerHTML = f.legal.links.map(function(lnk) {
          return '<a href="' + lnk.href + '">' + lnk.label + '</a>';
        }).join('');
      }
    }
  }

  /* ── Announcement Bar ───────────────────────────────── */
  function renderAnnBar(items) {
    var track = document.getElementById('annTrack');
    var dotsEl= document.getElementById('annDots');
    if (!track || !items || !items.length) return;

    track.innerHTML = items.map(function(item, i) {
      var subHtml = '';
      if (item.sub_link_href) {
        subHtml = '<span class="ann-sep"></span>' +
                  '<span class="ann-msg"><a href="' + item.sub_link_href + '">' + item.sub_link_text + '</a></span>';
      } else if (item.sub_text) {
        subHtml = '<span class="ann-sep"></span>' +
                  '<span class="ann-msg" style="color:' + (item.sub_color || 'rgba(255,255,255,0.6)') + ';font-weight:500;font-size:11px;">' +
                    item.sub_text +
                  '</span>';
      }
      return '<div class="ann-slide' + (i === 0 ? ' active' : '') + '" data-index="' + i + '">' +
               '<span class="ann-icon">' + item.icon + '</span>' +
               '<span class="ann-msg">' + item.text + '</span>' +
               subHtml +
             '</div>';
    }).join('');

    if (dotsEl) {
      dotsEl.innerHTML = items.map(function(_, i) {
        return '<div class="ann-dot' + (i === 0 ? ' active' : '') + '" data-dot="' + i + '"></div>';
      }).join('');
      // Re-wire dot clicks
      dotsEl.querySelectorAll('.ann-dot').forEach(function(dot) {
        dot.addEventListener('click', function() {
          if (window._annGoTo) window._annGoTo(+dot.dataset.dot);
        });
      });
    }
  }

  /* ════════════════════════════════════════════════════
     HELPERS
  ════════════════════════════════════════════════════ */

  function esc(str) {
    return (str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Re-trigger IntersectionObserver on dynamically added .reveal-row elements
  function reobserve(root) {
    if (!window._revealObserver) return;
    (root || document).querySelectorAll('.reveal-row').forEach(function(el) {
      window._revealObserver.observe(el);
    });
  }

  /* ════════════════════════════════════════════════════
     ORCHESTRATOR
  ════════════════════════════════════════════════════ */

  function render(data) {
    renderHero(data.hero);
    renderHighlights(data.highlights);
    renderCatalogs(data.catalogs);
    renderArtists(data.artists);
    renderMegaMenu(data.mega_menu);
    renderFooter(data.footer);
    renderAnnBar(data.announcement_bar);
    // Re-trigger reveal animation on newly created elements
    reobserve(document);
  }

  /* ════════════════════════════════════════════════════
     INLINE FALLBACK DATA  (mirrors homepage-data.json)
     Used when fetch is unavailable (file:// protocol etc.)
  ════════════════════════════════════════════════════ */

  var INLINE_DATA = {
    hero: [
      { image: 'https://www.streamlineart.com/media//wysiwyg/BANNER_MARCH2026.jpg',
        alt: 'Join us at our upcoming markets - Streamline Art',
        link: 'plp-in-stock-art.html', loading: 'eager' }
    ],
    highlights: [
      { label: 'New Releases',    image: 'https://www.streamlineart.com/media/.renditions/wysiwyg/new2026.jpg',                         alt: 'New Releases',    link: 'plp-in-stock-art.html' },
      { label: 'Best Sellers',    image: 'https://www.streamlineart.com/media/.renditions/wysiwyg/BEST_SELLERS_JUNE_2025.jpg',          alt: 'Best Sellers',    link: 'plp-in-stock-art.html' },
      { label: 'Featured Artists',image: 'https://www.streamlineart.com/media/catalog/category/FEATURED_ARTIST.jpg',                    alt: 'Featured Artists',link: 'plp-in-stock-art.html' },
      { label: 'Trends',          image: 'https://www.streamlineart.com/media/.renditions/catalog/category/trends2026a_1.jpg',          alt: 'Trends',          link: 'plp-in-stock-art.html' }
    ],
    catalogs: [
      { label: 'New Releases 2026',    image: 'https://www.streamlineart.com/media//wysiwyg/newrelease2026.jpg',             alt: 'New Releases 2026',    link: 'https://images.streamlineart.com/image/New_Releases_Spring_2026_NP.pdf', target: '_blank' },
      { label: 'Trends 2026',          image: 'https://www.streamlineart.com/media/.renditions/wysiwyg/Trends2026_1.jpg',    alt: 'Trends 2026',          link: 'https://images.streamlineart.com/Trends_2026.pdf',                       target: '_blank' },
      { label: 'InLine Everyday',      image: 'https://www.streamlineart.com/media/wysiwyg/inline.jpg',                     alt: 'InLine Everyday',      link: 'https://images.streamlineart.com/Inline_Everyday.pdf',                   target: '_blank' },
      { label: 'Juvenile 2026',        image: 'https://www.streamlineart.com/media//wysiwyg/juvenile-2026.jpg',             alt: 'Juvenile 2026',        link: 'https://images.streamlineart.com/image/JUVENILE_CATALOGUE_COMPLETE_APRIL_2026.pdf', target: '_blank' },
      { label: 'Christmas 2026',       image: 'https://www.streamlineart.com/media/wysiwyg/xmas2026.jpg',                   alt: 'Christmas 2026',       link: 'https://images.streamlineart.com/xmas2026.pdf',                         target: '_blank' },
      { label: 'Print on Demand 2025', image: 'https://www.streamlineart.com/media/wysiwyg/pod-2024.jpg',                   alt: 'Print on Demand 2025', link: 'https://images.streamlineart.com/POD2025.pdf',                          target: '_blank' },
      { label: 'Heather Gauthier',     image: 'https://www.streamlineart.com/media/wysiwyg/heatherg.jpg',                   alt: 'Heather Gauthier',     link: 'https://images.streamlineart.com/heatherg.pdf',                         target: '_blank' },
      { label: 'State Posters 2025',   image: 'https://www.streamlineart.com/media/wysiwyg/stateposter.jpg',               alt: 'State Posters 2025',   link: 'https://images.streamlineart.com/POD_STATE_POSTERS_2024_NP_NC.pdf',     target: '_blank' }
    ],
    artists: [
      { label: 'Ronald West',    image: 'https://www.streamlineart.com/media/wysiwyg/ronald.jpg',                          alt: 'Ronald West',    link: 'https://images.streamlineart.com/POD_RONALD_WEST_2024_NP_NC.pdf',      target: '_blank' },
      { label: 'Lucia Heffernan',image: 'https://www.streamlineart.com/media/catalog/category/lucia.jpg',                  alt: 'Lucia Heffernan',link: 'https://images.streamlineart.com/POD_LUCIA_HEFFERNAN_2024_NP_NC.pdf', target: '_blank' },
      { label: 'Gallery Wall Art',image:'https://www.streamlineart.com/media/.renditions/wysiwyg/Gallery_Wall_Art_COVER.jpg', alt:'Gallery Wall Art',link:'https://images.streamlineart.com/gallery_wall_art.pdf',             target: '_blank' }
    ],
    announcement_bar: [
      { icon: '&#128666;', text: 'Free Shipping on Orders Above <strong>$500</strong>',                              sub_text: 'B2B Wholesale Orders',    sub_color: 'rgba(255,255,255,0.55)' },
      { icon: '&#11088;',  text: 'Earn Exclusive <strong>Loyalty Rewards</strong> with Every Purchase',              sub_text: 'Platinum Member Benefits', sub_color: '#e8c870' },
      { icon: '&#128218;', text: 'Explore Our New <strong>Seasonal Catalog</strong> Collections',                    sub_link_text: 'Download Now &rsaquo;', sub_link_href: 'forms.html' },
      { icon: '&#127912;', text: 'Need Assistance? Contact Your <strong>Dedicated Account Representative</strong>',  sub_link_text: 'Contact Rep &rsaquo;', sub_link_href: 'customer-dashboard.html' }
    ]
  };

  /* ── Boot ───────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { loadData(render); });
  } else {
    loadData(render);
  }

})();
