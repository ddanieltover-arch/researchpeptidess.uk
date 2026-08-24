/**
 * High-Fidelity Laboratory Product Image Generator
 * Generates custom, photorealistic SVG product visuals for each compound in the catalogue.
 * Renders distinct laboratory glass vials, flip-off caps, authentic British analytical labels,
 * nasal spray bottles, BAC water bottles, and reconstitution equipment.
 */

export interface ProductVisualOptions {
  name: string;
  sku?: string;
  size?: string;
  category?: string;
  purity?: number;
  cas?: string;
  colorScheme?: 'cobalt' | 'sky' | 'teal' | 'gold' | 'emerald' | 'purple' | 'amber' | 'crimson';
  productType?: 'PEPTIDE' | 'BLEND' | 'NASAL' | 'REAGENT' | 'EQUIPMENT';
}

function getCapColors(colorScheme: string = 'cobalt') {
  switch (colorScheme) {
    case 'sky':
      return { primary: '#0284C7', secondary: '#38BDF8', rim: '#0369A1' };
    case 'teal':
      return { primary: '#0D9488', secondary: '#2DD4BF', rim: '#0F766E' };
    case 'gold':
      return { primary: '#D97706', secondary: '#FBBF24', rim: '#B45309' };
    case 'emerald':
      return { primary: '#059669', secondary: '#34D399', rim: '#047857' };
    case 'purple':
      return { primary: '#7C3AED', secondary: '#A78BFA', rim: '#6D28D9' };
    case 'amber':
      return { primary: '#EA580C', secondary: '#FB923C', rim: '#C2410C' };
    case 'crimson':
      return { primary: '#E11D48', secondary: '#FB7185', rim: '#BE123C' };
    case 'cobalt':
    default:
      return { primary: '#4353FF', secondary: '#60A5FA', rim: '#2563EB' };
  }
}

/**
 * Determine default color scheme by compound name / category
 */
export function getProductColorScheme(name: string, category: string = ''): 'cobalt' | 'sky' | 'teal' | 'gold' | 'emerald' | 'purple' | 'amber' | 'crimson' {
  const lower = name.toLowerCase();
  const catLower = category.toLowerCase();

  if (catLower.includes('blend') || lower.includes('blend') || lower.includes('+')) return 'gold';
  if (catLower.includes('nasal') || lower.includes('nasal') || lower.includes('spray')) return 'sky';
  if (catLower.includes('reagent') || lower.includes('water') || lower.includes('bacteriostatic') || lower.includes('solvent')) return 'teal';
  if (catLower.includes('equipment') || lower.includes('syringe') || lower.includes('filter')) return 'cobalt';
  
  if (lower.includes('semaglutide') || lower.includes('tirzepatide') || lower.includes('retatrutide') || lower.includes('glp')) return 'emerald';
  if (lower.includes('bpc') || lower.includes('tb-500') || lower.includes('tb500') || lower.includes('kpv') || lower.includes('ghk')) return 'cobalt';
  if (lower.includes('cjc') || lower.includes('ipamorelin') || lower.includes('sermorelin') || lower.includes('ghrp') || lower.includes('hexarelin')) return 'purple';
  if (lower.includes('nad+') || lower.includes('mot-c') || lower.includes('mots-c') || lower.includes('ss-31') || lower.includes('epithalon')) return 'sky';
  if (lower.includes('pt-141') || lower.includes('melanotan') || lower.includes('aod') || lower.includes('adipotide')) return 'amber';

  return 'cobalt';
}

/**
 * Generates an SVG Data URI representing an ultra-clean, realistic lab product render
 */
export function generateProductSvgUri(options: ProductVisualOptions): string {
  const {
    name,
    sku = 'RPUK-LAB',
    size = '10mg',
    purity = 99.4,
    colorScheme = 'cobalt',
    productType = 'PEPTIDE',
  } = options;

  const caps = getCapColors(colorScheme);
  const cleanName = name
    .replace(/Reference Standard/gi, '')
    .replace(/Peptide/gi, '')
    .replace(/\(GLP-1.*?\)/gi, '')
    .replace(/\(.*?\)/gi, '')
    .trim();

  // Shorten name if too long for label display
  const displayName = cleanName.length > 20 ? cleanName.substring(0, 18) + '...' : cleanName;

  let svgContent = '';

  if (productType === 'NASAL') {
    // Nasal Spray Bottle SVG Render
    svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F8FAFC" />
      <stop offset="100%" stop-color="#EFF6FF" />
    </linearGradient>
    <linearGradient id="bottleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#CBD5E1" />
      <stop offset="15%" stop-color="#F8FAFC" />
      <stop offset="50%" stop-color="#FFFFFF" />
      <stop offset="85%" stop-color="#E2E8F0" />
      <stop offset="100%" stop-color="#94A3B8" />
    </linearGradient>
    <linearGradient id="nozzleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#E2E8F0" />
      <stop offset="30%" stop-color="#FFFFFF" />
      <stop offset="70%" stop-color="#CBD5E1" />
      <stop offset="100%" stop-color="#94A3B8" />
    </linearGradient>
    <linearGradient id="capGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${caps.rim}" />
      <stop offset="30%" stop-color="${caps.secondary}" />
      <stop offset="70%" stop-color="${caps.primary}" />
      <stop offset="100%" stop-color="${caps.rim}" />
    </linearGradient>
    <filter id="dropShadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#0F172A" flood-opacity="0.12" />
    </filter>
    <filter id="glassReflect" x="0" y="0" width="100%" height="100%">
      <feGaussianBlur stdDeviation="2" result="blur" />
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect width="500" height="500" rx="16" fill="url(#bgGrad)" />

  <!-- Studio Ambient Floor Reflection -->
  <ellipse cx="250" cy="440" rx="110" ry="18" fill="#64748B" opacity="0.14" />
  <ellipse cx="250" cy="438" rx="75" ry="8" fill="#0F172A" opacity="0.2" />

  <!-- MAIN NASAL APPLICATOR ASSEMBLY -->
  <g filter="url(#dropShadow)">
    <!-- Protective Translucent Overcap -->
    <path d="M 234 100 L 266 100 L 270 180 L 230 180 Z" fill="#E2E8F0" opacity="0.6" stroke="#CBD5E1" stroke-width="1.5" rx="3" />

    <!-- Nozzle Tip -->
    <rect x="242" y="90" width="16" height="35" rx="4" fill="url(#nozzleGrad)" stroke="#94A3B8" stroke-width="1" />
    <circle cx="250" cy="94" r="2" fill="#475569" />

    <!-- Finger Rest Wings -->
    <path d="M 195 210 C 195 200, 230 195, 250 195 C 270 195, 305 200, 305 210 L 295 225 L 205 225 Z" fill="url(#nozzleGrad)" stroke="#94A3B8" stroke-width="1.5" />

    <!-- Collar Ring -->
    <rect x="220" y="225" width="60" height="15" rx="2" fill="url(#capGrad)" />

    <!-- Main Bottle Body -->
    <rect x="185" y="240" width="130" height="185" rx="16" fill="url(#bottleGrad)" stroke="#94A3B8" stroke-width="1.5" />

    <!-- Bottle Label -->
    <rect x="192" y="260" width="116" height="145" rx="6" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
    
    <!-- Label Header Strip -->
    <rect x="192" y="260" width="116" height="24" rx="4" fill="${caps.primary}" />
    <text x="250" y="275" font-family="system-ui, sans-serif" font-size="7.5" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">RESEARCH PEPTIDES UK</text>

    <!-- Compound Name -->
    <text x="250" y="304" font-family="system-ui, sans-serif" font-size="11" font-weight="900" fill="#0F172A" text-anchor="middle">${displayName}</text>
    <text x="250" y="318" font-family="monospace" font-size="8" font-weight="700" fill="${caps.primary}" text-anchor="middle">METERED NASAL SPRAY</text>

    <!-- Divider Line -->
    <line x1="205" y1="326" x2="295" y2="326" stroke="#E2E8F0" stroke-width="1" />

    <!-- Volume & Purity Badges -->
    <rect x="202" y="334" width="44" height="18" rx="3" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1" />
    <text x="224" y="346" font-family="monospace" font-size="7" font-weight="700" fill="#334155" text-anchor="middle">${size}</text>

    <rect x="254" y="334" width="44" height="18" rx="3" fill="#EFF6FF" stroke="#BFDBFE" stroke-width="1" />
    <text x="276" y="346" font-family="monospace" font-size="7" font-weight="800" fill="${caps.primary}" text-anchor="middle">≥${purity}%</text>

    <!-- Research Warning -->
    <rect x="198" y="364" width="104" height="18" rx="3" fill="#FEF2F2" stroke="#FECACA" stroke-width="0.8" />
    <text x="250" y="376" font-family="monospace" font-size="5.5" font-weight="700" fill="#991B1B" text-anchor="middle">FOR IN-VITRO RESEARCH ONLY</text>

    <text x="250" y="394" font-family="monospace" font-size="5.5" fill="#64748B" text-anchor="middle">SKU: ${sku} • LOT: UK26</text>
  </g>

  <!-- Specular Glass Highlights -->
  <path d="M 194 250 L 198 415" stroke="#FFFFFF" stroke-width="3" opacity="0.6" stroke-linecap="round" />
  <path d="M 306 250 L 302 415" stroke="#000000" stroke-width="1.5" opacity="0.1" stroke-linecap="round" />
</svg>
    `;
  } else if (productType === 'REAGENT') {
    // Reagent / Bacteriostatic Water Bottle SVG
    svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F0FDFA" />
      <stop offset="100%" stop-color="#E0F2FE" />
    </linearGradient>
    <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#CBD5E1" opacity="0.8" />
      <stop offset="15%" stop-color="#F8FAFC" opacity="0.9" />
      <stop offset="50%" stop-color="#FFFFFF" opacity="0.95" />
      <stop offset="85%" stop-color="#E2E8F0" opacity="0.9" />
      <stop offset="100%" stop-color="#94A3B8" opacity="0.8" />
    </linearGradient>
    <linearGradient id="liquidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#E0F2FE" opacity="0.4" />
      <stop offset="100%" stop-color="#BAE6FD" opacity="0.6" />
    </linearGradient>
    <linearGradient id="reagentCap" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0D9488" />
      <stop offset="30%" stop-color="#2DD4BF" />
      <stop offset="70%" stop-color="#14B8A6" />
      <stop offset="100%" stop-color="#0F766E" />
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="#0F172A" flood-opacity="0.14" />
    </filter>
  </defs>

  <rect width="500" height="500" rx="16" fill="url(#bgGrad)" />

  <!-- Shadow on floor -->
  <ellipse cx="250" cy="445" rx="100" ry="18" fill="#64748B" opacity="0.15" />
  <ellipse cx="250" cy="442" rx="70" ry="8" fill="#0F172A" opacity="0.22" />

  <g filter="url(#shadow)">
    <!-- Vial Stopper & Crimp -->
    <rect x="220" y="110" width="60" height="24" rx="5" fill="url(#reagentCap)" />
    <rect x="228" y="98" width="44" height="14" rx="4" fill="#0F766E" />

    <!-- Glass Neck -->
    <rect x="224" y="134" width="52" height="30" fill="url(#glassGrad)" stroke="#94A3B8" stroke-width="1.5" />

    <!-- Glass Body -->
    <rect x="175" y="164" width="150" height="260" rx="20" fill="url(#glassGrad)" stroke="#94A3B8" stroke-width="2" />
    
    <!-- Liquid Content -->
    <rect x="180" y="210" width="140" height="205" rx="14" fill="url(#liquidGrad)" />

    <!-- Reagent Label -->
    <rect x="185" y="215" width="130" height="175" rx="8" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
    
    <!-- Header Banner -->
    <rect x="185" y="215" width="130" height="30" rx="6" fill="#0D9488" />
    <text x="250" y="234" font-family="system-ui, sans-serif" font-size="8.5" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">RESEARCH PEPTIDES UK</text>

    <text x="250" y="268" font-family="system-ui, sans-serif" font-size="12" font-weight="900" fill="#0F172A" text-anchor="middle">${displayName}</text>
    <text x="250" y="284" font-family="monospace" font-size="8.5" font-weight="700" fill="#0D9488" text-anchor="middle">STERILE RECONSTITUTION</text>

    <line x1="200" y1="294" x2="300" y2="294" stroke="#E2E8F0" stroke-width="1" />

    <rect x="198" y="304" width="50" height="22" rx="4" fill="#F0FDFA" stroke="#99F6E4" stroke-width="1" />
    <text x="223" y="318" font-family="monospace" font-size="8" font-weight="700" fill="#0F766E" text-anchor="middle">${size}</text>

    <rect x="252" y="304" width="50" height="22" rx="4" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1" />
    <text x="277" y="318" font-family="monospace" font-size="7.5" font-weight="700" fill="#334155" text-anchor="middle">USP 0.9%</text>

    <rect x="195" y="340" width="110" height="20" rx="3" fill="#FEF2F2" stroke="#FECACA" stroke-width="0.8" />
    <text x="250" y="353" font-family="monospace" font-size="6" font-weight="700" fill="#991B1B" text-anchor="middle">LABORATORY SOLVENT ONLY</text>

    <text x="250" y="378" font-family="monospace" font-size="6" fill="#64748B" text-anchor="middle">EXP: 2028-12 • BATCH UK-W26</text>
  </g>

  <!-- Glass highlights -->
  <path d="M 183 175 L 183 410" stroke="#FFFFFF" stroke-width="4" opacity="0.8" stroke-linecap="round" />
  <path d="M 317 175 L 317 410" stroke="#000000" stroke-width="2" opacity="0.1" stroke-linecap="round" />
</svg>
    `;
  } else {
    // Standard Premium Lyophilized Peptide Vial (Single or Blend)
    const isBlend = productType === 'BLEND' || name.toLowerCase().includes('blend') || name.includes('+');
    
    svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F8FAFC" />
      <stop offset="60%" stop-color="#F1F5F9" />
      <stop offset="100%" stop-color="#E2E8F0" />
    </linearGradient>

    <!-- Realistic Glass Material -->
    <linearGradient id="glassBody" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#94A3B8" opacity="0.4" />
      <stop offset="10%" stop-color="#E2E8F0" opacity="0.7" />
      <stop offset="25%" stop-color="#FFFFFF" opacity="0.9" />
      <stop offset="50%" stop-color="#F8FAFC" opacity="0.5" />
      <stop offset="75%" stop-color="#FFFFFF" opacity="0.85" />
      <stop offset="90%" stop-color="#CBD5E1" opacity="0.6" />
      <stop offset="100%" stop-color="#64748B" opacity="0.5" />
    </linearGradient>

    <!-- Flip-Off Cap Gradient -->
    <linearGradient id="capPrimary" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${caps.rim}" />
      <stop offset="25%" stop-color="${caps.secondary}" />
      <stop offset="60%" stop-color="${caps.primary}" />
      <stop offset="100%" stop-color="${caps.rim}" />
    </linearGradient>

    <!-- Aluminium Crimp Seal -->
    <linearGradient id="aluminiumSeal" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#64748B" />
      <stop offset="20%" stop-color="#CBD5E1" />
      <stop offset="50%" stop-color="#F8FAFC" />
      <stop offset="80%" stop-color="#94A3B8" />
      <stop offset="100%" stop-color="#475569" />
    </linearGradient>

    <!-- Lyophilized Cake Gradient -->
    <linearGradient id="cakeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="40%" stop-color="#F8FAFC" />
      <stop offset="100%" stop-color="#E2E8F0" />
    </linearGradient>

    <!-- Shadow filters -->
    <filter id="vialShadow" x="-20%" y="-10%" width="140%" height="130%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#0F172A" flood-opacity="0.16" />
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="500" height="500" rx="16" fill="url(#bgGrad)" />

  <!-- Precision Grid / Studio Texture -->
  <g opacity="0.04" stroke="#0F172A" stroke-width="1">
    <line x1="50" y1="0" x2="50" y2="500" />
    <line x1="150" y1="0" x2="150" y2="500" />
    <line x1="250" y1="0" x2="250" y2="500" />
    <line x1="350" y1="0" x2="350" y2="500" />
    <line x1="450" y1="0" x2="450" y2="500" />
    <line x1="0" y1="100" x2="500" y2="100" />
    <line x1="0" y1="200" x2="500" y2="200" />
    <line x1="0" y1="300" x2="500" y2="300" />
    <line x1="0" y1="400" x2="500" y2="400" />
  </g>

  <!-- Contact Shadows on Studio Surface -->
  <ellipse cx="250" cy="446" rx="95" ry="18" fill="#475569" opacity="0.16" />
  <ellipse cx="250" cy="444" rx="65" ry="7" fill="#0F172A" opacity="0.25" />

  <!-- VIAL ASSEMBLY -->
  <g filter="url(#vialShadow)">
    <!-- 1. Flip-Off Plastic Top -->
    <path d="M 205 68 C 205 60, 295 60, 295 68 L 290 86 C 290 90, 210 90, 210 86 Z" fill="url(#capPrimary)" stroke="${caps.rim}" stroke-width="1" />
    <ellipse cx="250" cy="68" rx="45" ry="8" fill="${caps.secondary}" />
    <text x="250" y="71" font-family="system-ui, sans-serif" font-size="6" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">FLIP OFF</text>

    <!-- 2. Aluminium Crimp Collar -->
    <rect x="216" y="86" width="68" height="24" rx="3" fill="url(#aluminiumSeal)" stroke="#475569" stroke-width="1.2" />
    <!-- Crimp Center Hole for Septum -->
    <ellipse cx="250" cy="88" rx="14" ry="4" fill="#334155" />

    <!-- 3. Glass Neck -->
    <rect x="225" y="110" width="50" height="24" fill="url(#glassBody)" stroke="#94A3B8" stroke-width="1.2" />

    <!-- 4. Glass Vial Body -->
    <rect x="180" y="134" width="140" height="295" rx="22" fill="url(#glassBody)" stroke="#94A3B8" stroke-width="2" />

    <!-- 5. Lyophilized Pellet / Powder Cake at base -->
    <path d="M 188 385 C 188 375, 312 375, 312 385 L 312 415 C 312 422, 188 422, 188 415 Z" fill="url(#cakeGrad)" stroke="#CBD5E1" stroke-width="1" />
    <!-- Granular texture on cake -->
    <ellipse cx="250" cy="385" rx="58" ry="7" fill="#FFFFFF" />

    <!-- 6. Ultra-Crisp Laboratory Label -->
    <rect x="188" y="160" width="124" height="210" rx="8" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.2" />

    <!-- Label Top Brand Header -->
    <rect x="188" y="160" width="124" height="34" rx="6" fill="${caps.primary}" />
    <!-- UK Flag Icon Mock -->
    <g transform="translate(196, 168) scale(0.6)">
      <rect width="24" height="16" fill="#1E3A8A" rx="1" />
      <line x1="0" y1="0" x2="24" y2="16" stroke="#FFFFFF" stroke-width="3" />
      <line x1="24" y1="0" x2="0" y2="16" stroke="#FFFFFF" stroke-width="3" />
      <line x1="0" y1="0" x2="24" y2="16" stroke="#DC2626" stroke-width="1.5" />
      <line x1="24" y1="0" x2="0" y2="16" stroke="#DC2626" stroke-width="1.5" />
      <rect x="9" y="0" width="6" height="16" fill="#FFFFFF" />
      <rect x="0" y="5" width="24" height="6" fill="#FFFFFF" />
      <rect x="10" y="0" width="4" height="16" fill="#DC2626" />
      <rect x="0" y="6" width="24" height="4" fill="#DC2626" />
    </g>
    <text x="260" y="176" font-family="system-ui, -apple-system, sans-serif" font-size="7.5" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.8">RESEARCH PEPTIDES</text>
    <text x="260" y="186" font-family="system-ui, -apple-system, sans-serif" font-size="6" font-weight="700" fill="#BFDBFE" text-anchor="middle" letter-spacing="1.2">GREAT BRITAIN</text>

    <!-- Compound Name on Label -->
    <text x="250" y="218" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="900" fill="#0F172A" text-anchor="middle">${displayName}</text>
    <text x="250" y="233" font-family="monospace" font-size="8" font-weight="700" fill="${caps.primary}" text-anchor="middle">${isBlend ? 'SYNERGISTIC BLEND' : 'ANALYTICAL STANDARD'}</text>

    <line x1="202" y1="242" x2="298" y2="242" stroke="#E2E8F0" stroke-width="1" />

    <!-- Badges Row: Size & HPLC Purity -->
    <rect x="198" y="250" width="48" height="24" rx="4" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1" />
    <text x="222" y="260" font-family="monospace" font-size="5.5" font-weight="600" fill="#64748B" text-anchor="middle">STRENGTH</text>
    <text x="222" y="270" font-family="monospace" font-size="8.5" font-weight="800" fill="#0F172A" text-anchor="middle">${size}</text>

    <rect x="254" y="250" width="48" height="24" rx="4" fill="#EFF6FF" stroke="#BFDBFE" stroke-width="1" />
    <text x="278" y="260" font-family="monospace" font-size="5.5" font-weight="600" fill="${caps.primary}" text-anchor="middle">PURITY</text>
    <text x="278" y="270" font-family="monospace" font-size="8.5" font-weight="900" fill="${caps.primary}" text-anchor="middle">≥${purity}%</text>

    <!-- Safety / Compliance Box -->
    <rect x="195" y="284" width="110" height="28" rx="4" fill="#FEF2F2" stroke="#FECACA" stroke-width="0.8" />
    <text x="250" y="296" font-family="monospace" font-size="6" font-weight="800" fill="#991B1B" text-anchor="middle">IN-VITRO RESEARCH ONLY</text>
    <text x="250" y="306" font-family="system-ui, sans-serif" font-size="5" font-weight="600" fill="#7F1D1D" text-anchor="middle">NOT FOR HUMAN / VETERINARY USE</text>

    <!-- Batch & Quality QR code strip -->
    <g transform="translate(196, 322)">
      <!-- Mock Barcode -->
      <line x1="0" y1="0" x2="0" y2="18" stroke="#0F172A" stroke-width="1.5" />
      <line x1="3" y1="0" x2="3" y2="18" stroke="#0F172A" stroke-width="1" />
      <line x1="6" y1="0" x2="6" y2="18" stroke="#0F172A" stroke-width="2" />
      <line x1="10" y1="0" x2="10" y2="18" stroke="#0F172A" stroke-width="1.5" />
      <line x1="14" y1="0" x2="14" y2="18" stroke="#0F172A" stroke-width="1" />
      <line x1="18" y1="0" x2="18" y2="18" stroke="#0F172A" stroke-width="2" />
      <line x1="22" y1="0" x2="22" y2="18" stroke="#0F172A" stroke-width="1" />
      <line x1="25" y1="0" x2="25" y2="18" stroke="#0F172A" stroke-width="2.5" />
      
      <text x="65" y="8" font-family="monospace" font-size="5.5" font-weight="700" fill="#334155">SKU: ${sku}</text>
      <text x="65" y="16" font-family="monospace" font-size="5" fill="#64748B">LOT: UK-2026-B892</text>
    </g>

    <text x="250" y="360" font-family="monospace" font-size="5" fill="#94A3B8" text-anchor="middle">RESEARCH PEPTIDES UK • OXFORD SCIENCE PARK</text>
  </g>

  <!-- 7. Glass Specular Highlights (Left curve reflection + Right dark edge) -->
  <path d="M 186 145 L 186 420" stroke="#FFFFFF" stroke-width="4.5" opacity="0.85" stroke-linecap="round" />
  <path d="M 192 150 L 192 415" stroke="#FFFFFF" stroke-width="2" opacity="0.5" stroke-linecap="round" />
  <path d="M 314 145 L 314 420" stroke="#0F172A" stroke-width="2" opacity="0.15" stroke-linecap="round" />

  <!-- Top Glass Rim Highlight -->
  <ellipse cx="250" cy="134" rx="60" ry="4" fill="#FFFFFF" opacity="0.4" />
</svg>
    `;
  }

  // Convert to clean SVG data URI
  const encoded = encodeURIComponent(svgContent.trim())
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');

  return `data:image/svg+xml;utf8,${encoded}`;
}

/**
 * Returns a high-definition image for a product
 */
export function getProductImage(product: {
  name: string;
  sku?: string;
  categoryName?: string;
  categoryId?: string;
  variants?: Array<{ size?: string; purityScore?: number }>;
  productType?: any;
  purityValue?: number;
  images?: Array<{ url: string }>;
}): string {
  const size = product.variants?.[0]?.size || '10mg';
  const purity = product.purityValue || product.variants?.[0]?.purityScore || 99.4;
  const colorScheme = getProductColorScheme(product.name, product.categoryName || product.categoryId || '');
  
  let pType: 'PEPTIDE' | 'BLEND' | 'NASAL' | 'REAGENT' | 'EQUIPMENT' = 'PEPTIDE';
  const cat = (product.categoryName || product.categoryId || '').toLowerCase();
  const nameLower = product.name.toLowerCase();

  if (cat.includes('nasal') || nameLower.includes('nasal') || nameLower.includes('spray')) {
    pType = 'NASAL';
  } else if (cat.includes('reagent') || nameLower.includes('water') || nameLower.includes('bacteriostatic') || nameLower.includes('solvent')) {
    pType = 'REAGENT';
  } else if (cat.includes('blend') || nameLower.includes('blend') || nameLower.includes('+')) {
    pType = 'BLEND';
  } else if (cat.includes('equipment') || nameLower.includes('syringe') || nameLower.includes('filter')) {
    pType = 'EQUIPMENT';
  }

  return generateProductSvgUri({
    name: product.name,
    sku: product.sku,
    size,
    purity,
    colorScheme,
    productType: pType,
  });
}
