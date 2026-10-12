export interface PresetPrompt {
  id: string;
  category: 'commercial' | 'cinematic' | 'artistic' | 'portrait' | 'repair' | 'scifi';
  title: string;
  subtitle: string;
  icon: string;
  prompt: string;
  suggestedRatio?: string;
  badge?: string;
}

export const PRESET_PROMPTS: PresetPrompt[] = [
  {
    id: 'studio-clean',
    category: 'commercial',
    title: '攝影棚高級純色光',
    subtitle: '極簡灰白純淨背景與柔光箱頂光',
    icon: '📸',
    prompt: '將背景更換為極簡高級攝影棚微灰純淨背景，由頂部大型柔光箱投射自然散射光，主體邊緣清晰立體，地面帶有柔和羽化倒影與逼真接觸陰影，商業精品棚拍質感',
    suggestedRatio: '1:1',
    badge: '熱門',
  },
  {
    id: 'studio-marble',
    category: 'commercial',
    title: '奢華大理石展台',
    subtitle: '幾何漂浮石台與晨曦光斑',
    icon: '🏛️',
    prompt: '將主體優雅地置於懸浮的天然大理石圓形展台之上，背景為極簡柔霧暖米色幾何空間，斜射進如晨曦般的百葉窗自然光斑，輕奢高雅展示質感',
    suggestedRatio: '4:3',
  },
  {
    id: 'cinematic-teal-orange',
    category: 'cinematic',
    title: '好萊塢電影雙色調',
    subtitle: 'Teal & Orange 青橙強烈氛圍光',
    icon: '🎬',
    prompt: '好萊塢大片電影感調色，青藍色（Teal）環境陰影搭配暖金橙色（Orange）輪廓高光，精細的電影膠片顆粒感，大光圈柔和背景虛化，充滿戲劇張力',
    suggestedRatio: '16:9',
    badge: '推薦',
  },
  {
    id: 'cyberpunk-neon',
    category: 'scifi',
    title: '賽博未來霓虹街景',
    subtitle: '雨夜反光都市與全息光效',
    icon: '🌆',
    prompt: '將背景轉化為雨夜賽博朋克未來科技都會，潮濕地面反射紫粉色與青藍色霓虹招牌光芒，空氣中漂浮微弱全息投影光粒子與煙霧，科技感十足',
    suggestedRatio: '16:9',
    badge: '炫酷',
  },
  {
    id: '3d-clay-toy',
    category: 'artistic',
    title: '3D 潮流盲盒黏土風',
    subtitle: '精緻立體玩具雕塑與軟萌光澤',
    icon: '🎨',
    prompt: '將畫面主體重新塑造成精緻可愛的 3D 潮流藝術盲盒公仔玩具風格，柔和微霧面黏土材質，立體飽滿邊緣，溫暖飽和色彩，Pixar 級別立體渲染光澤',
    suggestedRatio: '1:1',
  },
  {
    id: 'anime-makoto',
    category: 'artistic',
    title: '新海誠日系清新動漫',
    subtitle: '透明感藍天雲朵與溫柔逆光',
    icon: '🌸',
    prompt: '轉化為新海誠動漫電影手繪插畫風格，澄澈透亮的藍天與層次分明的積雨雲，逆光邊緣泛起溫暖水彩金色光暈，微風感與極致浪漫唯美畫風',
    suggestedRatio: '16:9',
    badge: '高人氣',
  },
  {
    id: 'fuji-film',
    category: 'cinematic',
    title: '富士日落經典膠片',
    subtitle: 'NC 溫潤底片復古色調',
    icon: '🍃',
    prompt: '經典富士膠片 (Fujifilm Classic Chrome) 質感，黃昏落日時分的柔和微光，高光帶微紅金調，暗部呈現經典微青冷調，輕微自然底片顆粒與復古文藝氣息',
    suggestedRatio: '4:3',
  },
  {
    id: 'portrait-beauty',
    category: 'portrait',
    title: '雜誌級高級人像修圖',
    subtitle: '保留真實毛孔紋理，重塑立體光影',
    icon: '✨',
    prompt: '頂級時尚雜誌人像修飾，保留自然真實皮膚微小紋理與毛孔，精確重塑面部輪廓光與高光，眼神光明亮有神，消除眼下暗沉與雜亂瑕疵，高貴自然氣質',
    suggestedRatio: '3:4',
  },
  {
    id: 'smart-cleanup',
    category: 'repair',
    title: '智慧除雜與乾淨補景',
    subtitle: '消除背景雜人雜物，平滑填補景深',
    icon: '🪄',
    prompt: '精準識別並消除背景中所有干擾雜物、過路行人與電線雜物，根據周圍環境自然擴展並平滑填補乾淨的背景紋理與柔和景深，主體更為純粹突出',
    suggestedRatio: 'original',
    badge: '實用',
  },
  {
    id: 'cosmic-nebula',
    category: 'scifi',
    title: '深空宇宙星雲幻想',
    subtitle: '紫藍流光星際與繁星粒子',
    icon: '🌌',
    prompt: '背景替換為浩瀚深邃的宇宙深空，璀璨流動的紫粉色與青藍色星雲氣體，點綴微光閃耀的繁星與宇宙塵埃，主體邊緣沐浴在銀河微光中，震撼夢幻',
    suggestedRatio: '16:9',
  },
];

export interface AspectRatioOption {
  id: string;
  name: string;
  ratio: string;
  desc: string;
  boxW: number;
  boxH: number;
}

export const ASPECT_RATIOS: AspectRatioOption[] = [
  { id: 'original', name: '原始比例', ratio: 'original', desc: '維持上傳圖片尺寸', boxW: 24, boxH: 24 },
  { id: '1:1', name: '1:1 方形', ratio: '1:1', desc: 'IG貼文、頭像、電商', boxW: 24, boxH: 24 },
  { id: '4:3', name: '4:3 標準', ratio: '4:3', desc: '相機常用、平板規格', boxW: 28, boxH: 21 },
  { id: '3:4', name: '3:4 直式', ratio: '3:4', desc: '個人寫真、海報封面', boxW: 21, boxH: 28 },
  { id: '16:9', name: '16:9 寬螢幕', ratio: '16:9', desc: '電腦桌布、橫向影音', boxW: 32, boxH: 18 },
  { id: '9:16', name: '9:16 直屏', ratio: '9:16', desc: 'Reels、TikTok、手機桌布', boxW: 18, boxH: 32 },
];

export const QUICK_TAGS = [
  '超精細 8K 畫質',
  '精準保留主體特徵',
  '大光圈淺景深虛化',
  '純白潔淨背景',
  '溫暖黃昏金色逆光',
  '柔和自然陰影',
  '金屬與玻璃高光反射',
  '復古膠卷微粒',
];

// Curated demo sample images (base64 SVG data URLs for instant zero-network testing)
export const SAMPLE_IMAGES = [
  {
    id: 'sample-watch',
    title: '商品手錶 (電商測試)',
    promptSuggest: '攝影棚高級純色光',
    dataUrl: createDemoWatchDataUrl(),
  },
  {
    id: 'sample-portrait',
    title: '城市人像 (風格測試)',
    promptSuggest: '好萊塢電影雙色調',
    dataUrl: createDemoPortraitDataUrl(),
  },
  {
    id: 'sample-coffee',
    title: '極簡咖啡 (質感測試)',
    promptSuggest: '富士日落經典膠片',
    dataUrl: createDemoCoffeeDataUrl(),
  },
  {
    id: 'sample-robot',
    title: '科技機械 (賽博測試)',
    promptSuggest: '賽博未來霓虹街景',
    dataUrl: createDemoCyberDataUrl(),
  },
];

function createDemoWatchDataUrl(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <defs>
      <radialGradient id="bg" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#1e293b"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </radialGradient>
      <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fbbf24"/>
        <stop offset="50%" stop-color="#f59e0b"/>
        <stop offset="100%" stop-color="#d97706"/>
      </linearGradient>
      <linearGradient id="dial" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#020617"/>
      </linearGradient>
    </defs>
    <rect width="600" height="600" fill="url(#bg)"/>
    <!-- Watch Strap -->
    <rect x="250" y="50" width="100" height="500" rx="16" fill="#334155" stroke="#475569" stroke-width="4"/>
    <!-- Watch Case -->
    <circle cx="300" cy="300" r="140" fill="url(#gold)" filter="drop-shadow(0 15px 30px rgba(0,0,0,0.6))"/>
    <circle cx="300" cy="300" r="126" fill="url(#dial)"/>
    <!-- Markers -->
    <circle cx="300" cy="190" r="4" fill="#fbbf24"/>
    <circle cx="410" cy="300" r="4" fill="#fbbf24"/>
    <circle cx="300" cy="410" r="4" fill="#fbbf24"/>
    <circle cx="190" cy="300" r="4" fill="#fbbf24"/>
    <!-- Hands -->
    <line x1="300" y1="300" x2="300" y2="210" stroke="#f8fafc" stroke-width="6" stroke-linecap="round"/>
    <line x1="300" y1="300" x2="370" y2="300" stroke="#f8fafc" stroke-width="4" stroke-linecap="round"/>
    <line x1="300" y1="300" x2="250" y2="350" stroke="#06b6d4" stroke-width="2" stroke-linecap="round"/>
    <circle cx="300" cy="300" r="8" fill="#fbbf24"/>
    <text x="300" y="260" fill="#94a3b8" font-family="sans-serif" font-size="14" font-weight="600" text-anchor="middle" letter-spacing="3">CHRONO AI</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

function createDemoPortraitDataUrl(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <defs>
      <linearGradient id="pbg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#312e81"/>
        <stop offset="50%" stop-color="#1e1b4b"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
      <linearGradient id="neon" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#06b6d4"/>
        <stop offset="100%" stop-color="#ec4899"/>
      </linearGradient>
    </defs>
    <rect width="600" height="600" fill="url(#pbg)"/>
    <!-- Neon Street Elements -->
    <rect x="60" y="100" width="40" height="280" fill="#06b6d4" opacity="0.15"/>
    <rect x="500" y="140" width="35" height="320" fill="#ec4899" opacity="0.15"/>
    <!-- Portrait Silhouette -->
    <ellipse cx="300" cy="460" rx="140" ry="110" fill="#1e293b"/>
    <circle cx="300" cy="270" r="95" fill="#334155"/>
    <!-- Futuristic Visor Glasses -->
    <rect x="225" y="250" width="150" height="36" rx="18" fill="url(#neon)"/>
    <circle cx="300" cy="268" r="4" fill="#ffffff"/>
    <text x="300" y="550" fill="#38bdf8" font-family="sans-serif" font-size="16" font-weight="700" text-anchor="middle" letter-spacing="4">NEO CYBER CITIZEN</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

function createDemoCoffeeDataUrl(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <defs>
      <linearGradient id="warm" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#451a03"/>
        <stop offset="50%" stop-color="#1c1917"/>
        <stop offset="100%" stop-color="#0c0a09"/>
      </linearGradient>
    </defs>
    <rect width="600" height="600" fill="url(#warm)"/>
    <!-- Wooden Table Surface -->
    <ellipse cx="300" cy="440" rx="240" ry="70" fill="#292524"/>
    <!-- Saucer -->
    <ellipse cx="300" cy="380" rx="120" ry="32" fill="#e7e5e4" filter="drop-shadow(0 10px 20px rgba(0,0,0,0.5))"/>
    <!-- Cup -->
    <path d="M230,260 L370,260 L345,360 L255,360 Z" fill="#f5f5f4"/>
    <!-- Coffee Surface -->
    <ellipse cx="300" cy="260" rx="70" ry="20" fill="#78350f"/>
    <!-- Latte Art -->
    <path d="M300,250 C290,262 310,262 300,250" stroke="#fef3c7" stroke-width="4" fill="none"/>
    <circle cx="300" cy="260" r="10" fill="#fef3c7"/>
    <!-- Steam -->
    <path d="M280,220 Q270,180 290,150" stroke="#a8a29e" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.6"/>
    <path d="M315,220 Q330,175 310,140" stroke="#a8a29e" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.6"/>
    <text x="300" y="520" fill="#d6d3d1" font-family="sans-serif" font-size="14" font-weight="500" text-anchor="middle" letter-spacing="2">ARTISAN ROAST</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

function createDemoCyberDataUrl(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <defs>
      <linearGradient id="scifi" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#082f49"/>
        <stop offset="100%" stop-color="#020617"/>
      </linearGradient>
    </defs>
    <rect width="600" height="600" fill="url(#scifi)"/>
    <!-- Circuit lines -->
    <path d="M100,100 L250,100 L300,160 L500,160" stroke="#0284c7" stroke-width="2" fill="none" opacity="0.4"/>
    <path d="M80,480 L200,480 L280,420 L520,420" stroke="#06b6d4" stroke-width="2" fill="none" opacity="0.4"/>
    <!-- Core Reactor Orb -->
    <circle cx="300" cy="300" r="90" fill="#0f172a" stroke="#0ea5e9" stroke-width="4"/>
    <circle cx="300" cy="300" r="70" fill="#0284c7" opacity="0.3"/>
    <circle cx="300" cy="300" r="40" fill="#38bdf8" filter="drop-shadow(0 0 20px #38bdf8)"/>
    <text x="300" y="306" fill="#0f172a" font-family="monospace" font-size="16" font-weight="bold" text-anchor="middle">AI CORE</text>
    <text x="300" y="470" fill="#38bdf8" font-family="monospace" font-size="14" text-anchor="middle" letter-spacing="3">GEMINI-2.5-IMAGE</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}
