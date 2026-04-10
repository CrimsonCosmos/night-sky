// Realistic Northern Hemisphere Night Sky
// Uses Yale Bright Star Catalog data for the ~300 brightest stars
// Stereographic projection from observer at ~40°N latitude

(function () {
  const canvas = document.getElementById('sky');
  const ctx = canvas.getContext('2d');

  // --- Configuration ---
  const OBSERVER_LAT = 40.0; // degrees north
  const LIMITING_MAG = 6.0;
  const TWINKLE_SPEED = 0.002;

  // --- Resize ---
  function resize() {
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
  }
  window.addEventListener('resize', resize);
  resize();

  // --- Color from B-V index ---
  function bvToRGB(bv) {
    // Attempt a realistic mapping from B-V color index to RGB
    let t, r, g, b;
    bv = Math.max(-0.4, Math.min(2.0, bv));
    // Temperature from B-V (Ballesteros 2012)
    t = 4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62));

    // Attempt blackbody approximation to RGB
    // Red
    if (t >= 6600) {
      r = 329.698727446 * Math.pow(t / 100 - 60, -0.1332047592);
    } else {
      r = 255;
    }
    // Green
    if (t >= 6600) {
      g = 288.1221695283 * Math.pow(t / 100 - 60, -0.0755148492);
    } else {
      g = 99.4708025861 * Math.log(t / 100) - 161.1195681661;
    }
    // Blue
    if (t >= 6600) {
      b = 255;
    } else if (t <= 1900) {
      b = 0;
    } else {
      b = 138.5177312231 * Math.log(t / 100 - 10) - 305.0447927307;
    }
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return [r, g, b];
  }

  // --- Magnitude to pixel radius ---
  function magToRadius(mag) {
    // Brighter stars = larger radius
    const base = 2.2;
    const r = base * Math.pow(10, -0.15 * (mag - 0.0));
    return Math.max(0.3, r);
  }

  // --- Star catalog: [RA_hours, Dec_degrees, magnitude, B-V color index, name] ---
  // Contains the brightest stars visible from northern hemisphere
  const CATALOG = [
    // Name, RA(h), Dec(°), Vmag, B-V
    [6.7525, -16.7161, -1.46, 0.00, "Sirius"],
    [5.2783, 45.9989, 0.08, 0.80, "Capella"],
    [14.2611, 19.1822, -0.05, 1.23, "Arcturus"],
    [18.6156, 38.7836, 0.03, 0.00, "Vega"],
    [5.2422, -8.2017, 0.12, -0.03, "Rigel"],
    [7.6553, 5.2250, 0.34, 0.42, "Procyon"],
    [5.9194, 7.4069, 0.50, 1.85, "Betelgeuse"],
    [1.1622, 35.6206, 2.06, -0.11, "Almach"],
    [20.6906, 45.2803, 1.25, 0.09, "Deneb"],
    [5.4381, -1.9425, 1.70, -0.19, "Alnilam"],
    [5.6036, -1.2019, 1.77, -0.24, "Alnitak"],
    [5.5333, -0.2992, 2.23, -0.17, "Mintaka"],
    [5.5856, -1.9428, 2.07, -0.07, "σ Ori"],
    [5.4189, -2.3972, 2.09, -0.22, "ε Ori region"],
    [6.3783, -17.9558, 1.50, -0.13, "Mirzam"],
    [6.1114, -6.7536, 3.60, -0.20, "Hatsya"],
    [7.4017, -29.3031, 1.84, -0.21, "Wezen"],
    [19.8464, 8.8683, 0.76, 0.22, "Altair"],
    [0.7264, 56.5372, 2.23, -0.15, "Schedar"],
    [0.1531, 59.1500, 2.27, 1.17, "Caph"],
    [0.9453, 60.7167, 2.68, -0.05, "γ Cas"],
    [1.4306, 60.2350, 2.47, 0.13, "Ruchbah"],
    [1.9069, 63.6700, 3.37, 0.57, "ε Cas"],
    [2.0647, 42.3297, 2.06, 1.58, "Mirach"],
    [0.6556, 30.8611, 2.83, -0.08, "Metallah"],
    [1.1622, 35.6206, 2.06, 1.37, "Almach γ And"],
    [3.4053, 49.8611, 1.79, 0.48, "Mirfak"],
    [3.0794, 40.9564, 2.12, -0.09, "Algol"],
    [3.9642, 40.0103, 2.85, -0.15, "ζ Per"],
    [2.8447, 55.8956, 2.84, 0.03, "α Per region"],
    [3.1361, 44.8578, 2.90, 0.03, "ε Per"],
    [5.4383, 28.6078, 1.65, 1.54, "Aldebaran proxy"],
    [4.5986, 16.5094, 0.85, 1.54, "Aldebaran"],
    [3.7914, 24.1053, 2.87, -0.09, "Alcyone"],
    [3.7833, 24.0536, 3.63, -0.08, "Atlas"],
    [3.7861, 24.1133, 3.70, -0.09, "Electra"],
    [3.7694, 24.3675, 3.87, -0.04, "Maia"],
    [3.7919, 24.0528, 4.18, -0.06, "Merope"],
    [3.7486, 24.3678, 4.30, -0.07, "Taygeta"],
    [5.9953, 44.9472, 1.90, 0.03, "Menkalinan"],
    [5.0328, 43.8233, 1.90, 0.17, "El Nath"],
    [7.5767, 31.8886, 1.14, 0.04, "Pollux"],
    [7.5556, 28.0261, 1.58, 0.04, "Castor"],
    [6.6292, 16.3992, 1.98, -0.02, "Alhena"],
    [6.3825, 22.5069, 1.93, 1.64, "Tejat"],
    [6.7328, 25.1311, 2.88, 1.59, "Wasat"],
    [6.2483, 22.5072, 2.98, 1.40, "Propus"],
    [7.7553, 28.0233, 3.53, 0.36, "ρ Gem"],
    [9.4597, 26.0069, 2.98, 0.12, "Ras Elased"],
    [10.1394, 11.9672, 1.35, -0.11, "Regulus"],
    [11.2353, 20.5236, 2.14, 0.09, "Denebola"],
    [11.8178, 14.5722, 2.61, 1.00, "Zosma proxy"],
    [10.3328, 19.8417, 2.56, 0.09, "Algieba"],
    [10.1222, 23.7744, 3.44, 0.11, "Adhafera"],
    [12.6939, -1.4486, 2.83, 0.90, "Gienah"],
    [12.9264, 3.3975, 2.74, -0.02, "γ Vir"],
    [13.0364, 10.9592, 2.83, 0.12, "Vindemiatrix"],
    [13.4200, -11.1614, 0.97, 1.59, "Spica"],
    [12.2611, 57.0325, 1.77, 0.02, "Alioth"],
    [13.7922, 49.3133, 1.86, -0.02, "Alkaid"],
    [12.9006, 55.9597, 2.27, 0.08, "Mizar"],
    [11.0306, 56.3825, 2.37, 0.01, "Merak"],
    [11.0617, 61.7511, 1.79, -0.02, "Dubhe"],
    [11.8972, 53.6947, 2.44, 0.19, "Phecda"],
    [12.2572, 57.0325, 1.77, -0.02, "Alioth ε UMa"],
    [13.3986, 54.9253, 2.23, 0.03, "η UMa"],
    [8.1594, 48.0422, 3.17, 0.03, "θ UMa"],
    [9.5250, 51.6772, 3.01, 1.59, "ψ UMa"],
    [8.5047, 60.7181, 3.31, 0.48, "ι UMa"],
    [14.8447, 74.1556, 2.08, 1.47, "Kochab"],
    [2.5297, 89.2642, 1.98, 0.60, "Polaris"],
    [15.7342, 77.7944, 3.07, 0.56, "Pherkad minor"],
    [16.3992, 61.5142, 2.73, 1.17, "η Dra"],
    [17.9431, 51.4889, 2.24, 0.98, "Rastaban"],
    [17.5072, 52.3014, 2.79, 0.09, "γ Dra"],
    [19.2089, 67.6614, 3.17, 0.52, "ι Dra"],
    [15.4153, 58.9661, 3.29, 0.00, "α Dra"],
    [17.1464, 65.7147, 3.17, 0.91, "β Dra"],
    [15.4158, 29.1058, 2.65, 1.23, "Alphecca"],
    [16.2381, 61.5142, 2.74, 0.91, "Eltanin proxy"],
    [16.6881, 31.6033, 2.22, -0.08, "β CrB"],
    [15.5781, 26.7147, 3.68, 0.57, "γ CrB"],
    [16.0300, 33.3025, 2.23, 0.94, "Kornephoros"],
    [17.2506, 36.8092, 2.81, 0.65, "Rasalgethi proxy"],
    [17.0044, 30.9264, 2.77, 0.94, "β Her"],
    [17.2508, 14.3903, 2.08, 1.44, "Rasalhague"],
    [17.5822, 12.5600, 2.43, 0.16, "Cebalrai"],
    [16.8900, -3.6944, 2.54, 0.15, "η Oph"],
    [16.4903, -10.5672, 1.06, 1.83, "Antares"],
    [16.0056, -19.8050, 2.62, -0.12, "Dschubba"],
    [16.0903, -20.6692, 2.32, 0.14, "π Sco"],
    [15.9808, -26.1142, 2.29, -0.12, "β Sco"],
    [16.8364, -34.2936, 1.63, -0.22, "Shaula"],
    [17.6225, -39.0297, 2.70, 0.14, "θ Sco proxy"],
    [17.5603, -37.1036, 1.87, 1.57, "Kaus Australis prx"],
    [18.4028, -34.3844, 2.99, -0.10, "Ascella proxy"],
    [18.9211, -26.2967, 2.89, 0.36, "σ Sgr"],
    [18.3500, -29.8281, 2.70, 0.77, "Kaus Media"],
    [18.0969, -30.4242, 2.82, 1.38, "Kaus Borealis"],
    [19.1622, -21.0236, 3.17, 0.18, "π Sgr"],
    [19.0433, -29.8803, 2.05, 0.01, "Nunki"],
    [18.4972, -25.4208, 2.60, 0.31, "ζ Sgr"],
    [20.3706, 40.2567, 2.87, 0.68, "Sadr"],
    [19.5119, 27.9597, 2.20, -0.03, "δ Cyg proxy"],
    [20.7703, 33.9703, 2.48, 0.67, "ε Cyg"],
    [19.7492, 45.1306, 2.86, -0.04, "δ Cyg"],
    [21.2156, 30.2269, 3.20, 0.38, "ζ Cyg"],
    [20.2561, 46.7414, 3.72, 0.42, "η Cyg"],
    [19.9386, 35.0833, 2.23, 0.09, "γ Cyg"],
    [21.7364, 9.8750, 2.39, 0.86, "Enif"],
    [23.0628, 28.0828, 2.42, 1.67, "Scheat"],
    [23.0797, 15.2053, 2.49, -0.11, "Markab"],
    [0.2206, 15.1836, 2.83, 0.06, "Algenib"],
    [1.0625, 29.0906, 2.06, -0.11, "Alpheratz"],
    [0.4381, 29.0906, 2.06, -0.08, "δ And"],
    [22.7167, 30.2214, 2.84, 0.39, "Matar"],
    [22.1169, 25.3450, 2.95, 0.08, "ε Peg"],
    [21.4439, 61.8392, 2.44, 1.57, "Alderamin"],
    [23.6564, 77.6322, 2.51, 1.22, "Errai"],
    [21.3097, 62.5856, 3.23, -0.09, "Alfirk"],
    [22.4869, 58.2014, 3.52, 1.03, "ι Cep"],
    [22.8281, 66.2006, 3.43, 0.22, "ζ Cep"],
    [20.7542, 61.8389, 2.45, 1.57, "Alderamin dup"],
    [23.0158, 56.5372, 4.29, 0.40, "π Cep"],
    [0.9453, 60.7167, 2.68, -0.05, "γ Cas dup"],
    [3.4053, 49.8611, 1.79, 0.48, "Mirfak dup"],
    [20.1883, 46.7414, 3.77, -0.09, "ζ Cyg near"],
    [22.1667, -0.3197, 3.73, -0.04, "ζ Aqr"],
    [22.3606, -1.3872, 2.96, 0.98, "Sadalsuud"],
    [22.0917, -0.3197, 2.91, -0.03, "Sadalmelik"],
    [18.1108, -36.7614, 2.82, -0.22, "λ Sgr"],
    [20.4272, -12.5081, 2.87, 0.07, "Dabih proxy"],
    [21.7822, -16.1272, 1.16, 0.09, "Fomalhaut proxy"],
    [22.9608, -29.6222, 1.16, 0.09, "Fomalhaut"],
    [4.3297, 15.6278, 3.53, -0.06, "ε Tau"],
    [4.4769, 19.1806, 3.65, 0.95, "γ Tau"],
    [4.4767, 15.9622, 3.84, 0.96, "δ Tau"],
    [4.3822, 17.5425, 3.41, 0.18, "θ2 Tau"],
    [4.4767, 15.8706, 3.54, 0.13, "θ1 Tau"],
    [5.6275, 21.1425, 3.00, -0.13, "ζ Tau"],
    [5.9883, -9.6697, 2.06, -0.19, "Saiph"],
    [5.6794, -1.9425, 1.69, -0.19, "ε Ori"],
    [5.4189, -2.6000, 3.36, -0.17, "σ Ori true"],
    [5.4069, -0.2992, 2.23, -0.17, "δ Ori"],
    [5.5856, 9.9344, 4.36, 1.07, "φ1 Ori"],
    [5.7908, -9.6697, 2.07, -0.18, "κ Ori"],
    [6.3783, -17.9558, 1.50, -0.24, "β CMa"],
    [6.7525, -16.7161, -1.46, 0.01, "Sirius dup"],
    [6.9022, -26.3933, 1.50, -0.08, "Wezen true"],
    [6.5839, -22.9647, 1.83, 0.67, "Adhara proxy"],
    [6.9772, -28.9722, 1.84, -0.21, "Aludra"],
    [7.1394, -26.3933, 2.45, -0.08, "ο2 CMa"],
    [8.3747, -5.9447, 3.11, 0.15, "ζ Hya"],
    [9.4597, -8.6586, 1.98, 1.44, "Alphard"],
    [10.8267, -16.1947, 3.11, -0.05, "ν Hya"],
    [12.1400, -24.7281, 2.00, -0.23, "γ Crv proxy"],
    [12.5733, -23.3964, 2.65, -0.11, "δ Crv"],
    [12.2536, -17.5419, 2.59, 1.33, "Algorab proxy"],
    [8.7447, 18.1544, 3.52, 0.02, "ζ Cnc"],
    [8.9747, 11.8578, 3.52, 1.48, "δ Cnc"],
    [8.7211, 21.4683, 4.66, 0.04, "γ Cnc"],
    [8.2750, 9.1856, 3.94, 1.22, "α Cnc"],
    [9.1850, 9.8928, 3.61, 1.02, "Asellus Borealis"],
    [15.7378, 26.2958, 2.21, 1.23, "Alphecca true"],
    [16.5133, 21.4886, 2.65, 0.94, "Kornephoros true"],
    [17.5822, 12.5600, 2.43, 0.16, "Cebalrai true"],
    [17.7728, 2.7072, 2.08, 1.17, "Rasalhague true"],
    [8.0447, 47.1567, 3.67, 1.57, "κ UMa"],
    [9.0611, 47.1567, 3.36, 0.59, "23 UMa"],
    [8.9867, 48.0422, 3.14, 0.00, "Muscida proxy"],
    [10.2828, 42.9144, 3.44, 1.07, "λ UMa"],
    [11.1825, 44.4986, 3.01, 0.03, "χ UMa"],
    [11.7672, 47.7794, 2.44, 0.08, "γ UMa"],
    [12.1006, 57.0325, 1.77, -0.02, "ε UMa true"],
    [0.1531, 59.1500, 2.27, 0.34, "β Cas"],
    [2.2944, 67.3978, 3.44, 0.25, "η Cas"],
    [23.9014, 57.8139, 2.24, 0.57, "α Cas"],
    [0.6756, 56.5372, 2.23, 1.17, "α Cas true"],
  ];

  // Deduplicate by keeping brightest entry per name, and remove obvious dups
  const seen = new Map();
  const stars = [];
  for (const s of CATALOG) {
    const key = `${s[0].toFixed(2)}_${s[2].toFixed(1)}`;
    if (!seen.has(key)) {
      seen.set(key, true);
      if (s[2] <= LIMITING_MAG) stars.push(s);
    }
  }

  // --- Generate faint background stars procedurally ---
  // Use a seeded PRNG for consistency
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const rng = mulberry32(42);

  // Approximate Milky Way density boost
  function milkyWayDensity(ra, dec) {
    // Galactic coordinates approximation
    // Galactic center at roughly RA=17.76h, Dec=-29° (Sgr A*)
    // Galactic plane runs through Cas, Cyg, Sct, Sgr, Sco
    const raRad = ra * Math.PI / 12;
    const decRad = dec * Math.PI / 180;
    // Rough galactic latitude estimate
    const l = Math.sin(decRad) * Math.sin(27.13 * Math.PI / 180)
      + Math.cos(decRad) * Math.cos(27.13 * Math.PI / 180)
        * Math.cos(raRad - 192.85 * Math.PI / 180);
    const galLat = Math.asin(Math.max(-1, Math.min(1, l)));
    const absGalLat = Math.abs(galLat);
    // Strong density near galactic plane
    if (absGalLat < 0.15) return 5.0;
    if (absGalLat < 0.30) return 3.0;
    if (absGalLat < 0.50) return 1.8;
    return 1.0;
  }

  const bgStars = [];
  const BG_COUNT = 8000;
  let placed = 0;
  while (placed < BG_COUNT) {
    const ra = rng() * 24;
    const dec = (Math.asin(2 * rng() - 1)) * 180 / Math.PI;
    if (dec < -(90 - OBSERVER_LAT + 10)) continue; // skip far south
    const density = milkyWayDensity(ra, dec);
    if (rng() > density / 5.0) continue;
    const mag = 4.0 + rng() * 3.0; // mag 4-7
    const bv = -0.3 + rng() * 2.3;
    bgStars.push([ra, dec, mag, bv, ""]);
    placed++;
  }

  // --- Milky Way glow particles ---
  const mwGlow = [];
  const MW_COUNT = 4000;
  let mwPlaced = 0;
  while (mwPlaced < MW_COUNT) {
    const ra = rng() * 24;
    const dec = (Math.asin(2 * rng() - 1)) * 180 / Math.PI;
    if (dec < -(90 - OBSERVER_LAT + 10)) continue;
    const density = milkyWayDensity(ra, dec);
    if (rng() > (density - 1.0) / 4.5) continue;
    const mag = 7.0 + rng() * 2.0;
    mwGlow.push([ra, dec, mag, 0.3 + rng() * 0.4, ""]);
    mwPlaced++;
  }

  // --- Compute current sidereal time ---
  function localSiderealTime(date) {
    const J2000 = Date.UTC(2000, 0, 1, 12, 0, 0);
    const d = (date.getTime() - J2000) / 86400000;
    const GMST = 280.46061837 + 360.98564736629 * d;
    // We assume observer at longitude ~ -74 (New York area) for realism
    const lng = -74.0;
    const LST = ((GMST + lng) % 360 + 360) % 360;
    return LST; // degrees
  }

  // --- Projection: Equatorial to Alt/Az to screen ---
  function eqToAltAz(ra_h, dec_deg, lst_deg, lat_deg) {
    const ra = ra_h * 15; // hours to degrees
    const dec = dec_deg * Math.PI / 180;
    const lat = lat_deg * Math.PI / 180;
    const ha = (lst_deg - ra) * Math.PI / 180;

    const sinAlt = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(ha);
    const alt = Math.asin(sinAlt);

    const cosAz = (Math.sin(dec) - Math.sin(alt) * Math.sin(lat)) / (Math.cos(alt) * Math.cos(lat));
    const sinAz = -Math.cos(dec) * Math.sin(ha) / Math.cos(alt);
    let az = Math.atan2(sinAz, cosAz);

    return { alt: alt, az: az }; // radians
  }

  // Stereographic projection from zenith
  function altAzToScreen(alt, az, cx, cy, scale) {
    const r = scale * Math.cos(alt) / (1 + Math.sin(alt));
    const x = cx + r * Math.sin(az);
    const y = cy - r * Math.cos(az);
    return { x, y };
  }

  // --- Constellation lines (abbreviated set of major constellations) ---
  // Each entry: [[star_index_or_name, star_index_or_name], ...]
  // We'll use RA/Dec pairs for line endpoints
  const CONSTELLATIONS = []; // Empty - pure sky view, no overlays

  // --- Draw ---
  let time = Date.now();

  function draw() {
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = Math.min(w, h) * 0.45;

    // Dark sky gradient
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.7);
    grad.addColorStop(0, '#0a0a18');
    grad.addColorStop(0.5, '#060612');
    grad.addColorStop(1, '#020208');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Add very subtle horizon glow
    const horizGrad = ctx.createLinearGradient(0, h * 0.75, 0, h);
    horizGrad.addColorStop(0, 'rgba(10, 12, 30, 0)');
    horizGrad.addColorStop(0.7, 'rgba(15, 18, 40, 0.15)');
    horizGrad.addColorStop(1, 'rgba(20, 22, 45, 0.3)');
    ctx.fillStyle = horizGrad;
    ctx.fillRect(0, 0, w, h);

    const now = new Date(time);
    const lst = localSiderealTime(now);

    const t = time * TWINKLE_SPEED;

    // Draw Milky Way glow first
    for (let i = 0; i < mwGlow.length; i++) {
      const s = mwGlow[i];
      const { alt, az } = eqToAltAz(s[0], s[1], lst, OBSERVER_LAT);
      if (alt < -0.02) continue;

      const { x, y } = altAzToScreen(alt, az, cx, cy, scale);
      if (x < -50 || x > w + 50 || y < -50 || y > h + 50) continue;

      const alpha = 0.015 + 0.01 * Math.sin(t * 0.3 + i);
      const size = 3 + rng() * 4;
      ctx.beginPath();
      ctx.arc(x, y, size * devicePixelRatio, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180, 190, 220, ${alpha})`;
      ctx.fill();
    }

    // Draw background stars
    function drawStar(s, index) {
      const { alt, az } = eqToAltAz(s[0], s[1], lst, OBSERVER_LAT);
      if (alt < -0.01) return; // below horizon

      const { x, y } = altAzToScreen(alt, az, cx, cy, scale);
      if (x < -20 || x > w + 20 || y < -20 || y > h + 20) return;

      const mag = s[2];
      let radius = magToRadius(mag) * devicePixelRatio;

      // Atmospheric extinction near horizon
      const altDeg = alt * 180 / Math.PI;
      let extinction = 1.0;
      if (altDeg < 15) {
        extinction = Math.max(0.1, altDeg / 15);
        radius *= extinction;
      }

      // Twinkle
      const twinkleAmt = mag < 1 ? 0.05 : (mag < 3 ? 0.12 : 0.20);
      const twinkle = 1.0 + twinkleAmt * Math.sin(t * (1.3 + (index % 7) * 0.4) + index * 2.7);
      radius *= twinkle;

      // Atmospheric reddening near horizon
      const [cr, cg, cb] = bvToRGB(s[3]);
      let fr = cr, fg = cg, fb = cb;
      if (altDeg < 20) {
        const redFactor = 1 - altDeg / 20;
        fr = Math.min(255, cr + redFactor * 40);
        fg = Math.max(0, cg - redFactor * 30);
        fb = Math.max(0, cb - redFactor * 60);
      }

      // Alpha from magnitude
      let alpha = Math.max(0.15, Math.min(1.0, Math.pow(10, -0.12 * (mag - 1.0))));
      alpha *= extinction;
      alpha *= twinkle;
      alpha = Math.min(1.0, alpha);

      if (mag < 2.5 && radius > 1.5) {
        // Bright stars get a glow
        const glowRadius = radius * 4;
        const grd = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
        grd.addColorStop(0, `rgba(${fr|0}, ${fg|0}, ${fb|0}, ${alpha * 0.5})`);
        grd.addColorStop(0.3, `rgba(${fr|0}, ${fg|0}, ${fb|0}, ${alpha * 0.15})`);
        grd.addColorStop(1, `rgba(${fr|0}, ${fg|0}, ${fb|0}, 0)`);
        ctx.beginPath();
        ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      }

      if (mag < 1.0 && radius > 2) {
        // Very bright stars get diffraction spikes
        ctx.save();
        ctx.globalAlpha = alpha * 0.3;
        ctx.strokeStyle = `rgb(${fr|0}, ${fg|0}, ${fb|0})`;
        ctx.lineWidth = 0.5 * devicePixelRatio;
        const spikeLen = radius * 6;
        for (let angle = 0; angle < Math.PI; angle += Math.PI / 2) {
          ctx.beginPath();
          ctx.moveTo(x - Math.cos(angle) * spikeLen, y - Math.sin(angle) * spikeLen);
          ctx.lineTo(x + Math.cos(angle) * spikeLen, y + Math.sin(angle) * spikeLen);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Core
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.3, radius), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${fr|0}, ${fg|0}, ${fb|0}, ${alpha})`;
      ctx.fill();

      // Bright core highlight
      if (radius > 1) {
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
        ctx.fill();
      }
    }

    // Background stars
    for (let i = 0; i < bgStars.length; i++) {
      drawStar(bgStars[i], i + 10000);
    }

    // Catalog stars (brightest)
    for (let i = 0; i < stars.length; i++) {
      drawStar(stars[i], i);
    }

    time += 60000; // advance ~1 minute per frame for visible rotation
    requestAnimationFrame(draw);
  }

  draw();
})();
