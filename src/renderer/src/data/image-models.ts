export interface ImageModelDef {
  id:          string
  name:        string
  description: string
  genres:      string[]
  sizeGb:      number
  nsfw:        boolean
  url:         string
  filename:    string
  preview?:    string   // emoji or color for placeholder
}

export const IMG_GENRES = [
  { id: 'all',           label: 'All',          icon: '⚡' },
  { id: 'photorealistic',label: 'Photo',         icon: '📷' },
  { id: 'anime',         label: 'Anime',         icon: '🎌' },
  { id: 'artistic',      label: 'Artistic',      icon: '🎨' },
  { id: 'fantasy',       label: 'Fantasy',       icon: '🔮' },
  { id: 'nsfw',          label: 'NSFW',          icon: '🔞' },
]

const HF = 'https://huggingface.co'
const CV = 'https://civitai.com/api/download/models'

export const IMAGE_MODELS: ImageModelDef[] = [
  // ── Photorealistic ──────────────────────────────────────────────────────────
  {
    id: 'dreamshaper-8',
    name: 'DreamShaper 8',
    description: 'Versatile model great for portraits, landscapes, and detailed scenes. Handles artistic and realistic styles.',
    genres: ['photorealistic', 'artistic'],
    sizeGb: 2.0,
    nsfw: false,
    url: `${HF}/Lykon/dreamshaper-8/resolve/main/DreamShaper_8_pruned.safetensors`,
    filename: 'dreamshaper-8.safetensors',
    preview: '🌅',
  },
  {
    id: 'realistic-vision-5',
    name: 'Realistic Vision V5.1',
    description: 'Photorealistic humans, fashion photography, editorial style. Excellent skin detail and lighting.',
    genres: ['photorealistic', 'nsfw'],
    sizeGb: 2.0,
    nsfw: true,
    url: `${HF}/SG161222/Realistic_Vision_V5.1_noVAE/resolve/main/Realistic_Vision_V5.1_fp16-no-ema.safetensors`,
    filename: 'realistic-vision-5.safetensors',
    preview: '📷',
  },
  {
    id: 'juggernaut-xl',
    name: 'Juggernaut XL v9',
    description: 'Top-rated SDXL model for photorealism. Stunning portraits with incredible detail and natural lighting.',
    genres: ['photorealistic', 'nsfw'],
    sizeGb: 6.5,
    nsfw: true,
    url: `${HF}/RunDiffusion/Juggernaut-XL-v9/resolve/main/Juggernaut-XL_v9_RunDiffusionPhoto_v2.safetensors`,
    filename: 'juggernaut-xl-v9.safetensors',
    preview: '🏆',
  },

  // ── Anime ───────────────────────────────────────────────────────────────────
  {
    id: 'anything-v5',
    name: 'Anything V5',
    description: 'Classic anime model. Clean lines, vibrant colors, great for characters and scenes.',
    genres: ['anime'],
    sizeGb: 2.1,
    nsfw: false,
    url: `${HF}/stablediffusionapi/anything-v5/resolve/main/anything-v5-PrtRE.safetensors`,
    filename: 'anything-v5.safetensors',
    preview: '🎌',
  },
  {
    id: 'animagine-xl-3',
    name: 'Animagine XL 3.1',
    description: 'Best SDXL anime model. Exceptional detail, dynamic poses, rich color palette.',
    genres: ['anime', 'nsfw'],
    sizeGb: 6.4,
    nsfw: true,
    url: `${HF}/cagliostrolab/animagine-xl-3.1/resolve/main/animagine-xl-3.1.safetensors`,
    filename: 'animagine-xl-3.1.safetensors',
    preview: '✨',
  },
  {
    id: 'counterfeit-v3',
    name: 'Counterfeit V3.0',
    description: 'Refined anime/illustration style. Soft lighting, beautiful character design.',
    genres: ['anime', 'artistic'],
    sizeGb: 1.9,
    nsfw: false,
    url: `${HF}/gsdf/Counterfeit-V3.0/resolve/main/Counterfeit-V3.0_fp16.safetensors`,
    filename: 'counterfeit-v3.safetensors',
    preview: '🌸',
  },

  // ── Artistic ────────────────────────────────────────────────────────────────
  {
    id: 'deliberate-v3',
    name: 'Deliberate V3',
    description: 'High-quality artistic model. Painterly aesthetic with photorealistic capability.',
    genres: ['artistic', 'photorealistic'],
    sizeGb: 2.0,
    nsfw: false,
    url: `${HF}/XpucT/Deliberate/resolve/main/Deliberate_v3.safetensors`,
    filename: 'deliberate-v3.safetensors',
    preview: '🎨',
  },
  {
    id: 'majicmix-v7',
    name: 'MajicMix Realistic V7',
    description: 'Asian-style portraits with cinematic quality. Excellent skin tones and hair detail.',
    genres: ['artistic', 'photorealistic', 'nsfw'],
    sizeGb: 2.0,
    nsfw: true,
    url: `${HF}/digiplay/majicMIX_realistic_v7/resolve/main/majicMIX_realistic_v7.safetensors`,
    filename: 'majicmix-v7.safetensors',
    preview: '🌺',
  },

  // ── Fantasy ─────────────────────────────────────────────────────────────────
  {
    id: 'fantasy-mix',
    name: 'FantasyMix',
    description: 'Fantasy and sci-fi worlds. Epic environments, magical characters, otherworldly atmosphere.',
    genres: ['fantasy', 'artistic'],
    sizeGb: 2.0,
    nsfw: false,
    url: `${HF}/digiplay/fantasyMix_v2/resolve/main/fantasyMix_v2.safetensors`,
    filename: 'fantasy-mix.safetensors',
    preview: '🔮',
  },
]

// ─── Style presets ────────────────────────────────────────────────────────────

export interface StylePreset {
  id:       string
  label:    string
  icon:     string
  positive: string
  negative: string
}

export const STYLE_PRESETS: StylePreset[] = [
  { id: 'none',       label: 'None',      icon: '—',  positive: '', negative: '' },
  { id: 'cinematic',  label: 'Cinematic', icon: '🎬', positive: 'cinematic lighting, film grain, shallow depth of field, anamorphic lens, movie still', negative: 'cartoon, illustration, painting' },
  { id: 'portrait',   label: 'Portrait',  icon: '🪞', positive: 'professional portrait, studio lighting, bokeh, sharp focus on face, high-end photography', negative: 'full body, landscape, bad composition' },
  { id: 'anime',      label: 'Anime',     icon: '🎌', positive: 'anime style, detailed anime illustration, vibrant colors, clean lineart, 2D', negative: 'realistic, photograph, 3D render' },
  { id: 'oil',        label: 'Oil Paint', icon: '🖼', positive: 'oil painting, textured canvas, classical art style, rich colors, brushstrokes, museum quality', negative: 'photograph, digital art, cartoon' },
  { id: 'photo',      label: 'Photo',     icon: '📷', positive: 'professional photography, DSLR camera, natural lighting, photorealistic, 8K, high resolution', negative: 'painting, illustration, cartoon, anime' },
  { id: 'fantasy',    label: 'Fantasy',   icon: '🔮', positive: 'fantasy art, magical atmosphere, ethereal glow, dramatic lighting, epic composition', negative: 'modern, realistic, mundane' },
  { id: 'watercolor', label: 'Watercolor',icon: '💧', positive: 'watercolor painting, soft edges, flowing pigment, artistic, wet-on-wet technique', negative: 'digital, sharp lines, photograph' },
  { id: 'neon',       label: 'Neon',      icon: '🌃', positive: 'cyberpunk, neon lights, night city, glowing, synthwave aesthetic, vibrant', negative: 'daytime, natural lighting, low contrast' },
]

// ─── Fix options ──────────────────────────────────────────────────────────────

export interface FixOption {
  id:            string
  label:         string
  icon:          string
  addPositive:   string
  addNegative:   string
}

export const FIX_OPTIONS: FixOption[] = [
  {
    id:          'hands',
    label:       'Hands',
    icon:        '🤚',
    addPositive: 'perfect hands, detailed hands, correct fingers',
    addNegative: 'bad hands, extra fingers, missing fingers, deformed hands, mutated hands, fused fingers, too many fingers, poorly drawn hands, malformed hands',
  },
  {
    id:          'face',
    label:       'Face',
    icon:        '😊',
    addPositive: 'perfect face, symmetric face, detailed eyes, beautiful face',
    addNegative: 'bad face, deformed face, asymmetrical eyes, crossed eyes, blurry face, disfigured face, ugly, bad eyes',
  },
  {
    id:          'body',
    label:       'Body',
    icon:        '🧍',
    addPositive: 'perfect anatomy, correct proportions, detailed body',
    addNegative: 'bad anatomy, extra limbs, missing limbs, deformed body, malformed limbs, poorly drawn body, floating limbs',
  },
  {
    id:          'hair',
    label:       'Hair',
    icon:        '💇',
    addPositive: 'detailed hair, beautiful hair, flowing hair, realistic hair',
    addNegative: 'bad hair, bald patches, messy tangled hair, unrealistic hair, poorly drawn hair',
  },
  {
    id:          'feet',
    label:       'Feet',
    icon:        '🦶',
    addPositive: 'perfect feet, detailed feet, correct toes',
    addNegative: 'bad feet, deformed feet, extra toes, missing toes, malformed feet, poorly drawn feet',
  },
]

// ─── Base quality tags ────────────────────────────────────────────────────────

export const BASE_POSITIVE = 'masterpiece, best quality, highly detailed, sharp focus'
export const BASE_NEGATIVE = 'lowres, bad quality, worst quality, jpeg artifacts, watermark, signature, text, logo, username, blurry'
