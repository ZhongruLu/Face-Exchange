/**
 * Material Library for Face Exchange
 * ───────────────────────────────────
 * Edit the values below to change textures and material settings.
 * Each entry defines:
 *   texture  – path to the texture file (relative to /public)
 *   repeat   – [wrapS, wrapT] tiling values
 *   color    – fallback/tint colour as hex string
 *   opacity  – material opacity (0–1)
 *
 * When a texture file doesn't exist the library falls back
 * to a plain coloured material so the build never breaks.
 */

export const materialLibrary = {

  // Optional source image for the 2.5D entrance backdrop.  Keep this image
  // below 2048px wide and place it at this exact path when it is available.
  // The Three scene has a procedural fallback, so a missing source never
  // blocks the entrance from rendering.
  entranceReference: {
    texture: '/assets/entrance/layers/entrance_architecture_base.png',
    color: '#ffffff',
    opacity: 1,
  },

  // ══════════════════════════════════════════════
  //  FLOOR TEXTURE
  //  ─────────────────────────────────────────────
  //  Put your floor texture file in:
  //    public/assets/textures/floor/
  //  Then edit the values below.
  // ══════════════════════════════════════════════
  floor: {
    texture: '/assets/textures/corridor/floor_black_marble.png',
    repeat: [5, 54],
    color: '#ffffff',
    opacity: 1,
  },

  // ══════════════════════════════════════════════
  //  WALL TEXTURE
  //  ─────────────────────────────────────────────
  //  Put your wall texture file in:
  //    public/assets/textures/wall/
  //  Then edit the values below.
  // ══════════════════════════════════════════════
  wall: {
    texture: '/assets/textures/corridor/wall_black_gold.png',
    repeat: [18, 1],
    color: '#ffffff',
    opacity: 1,
  },

  // ══════════════════════════════════════════════
  //  CEILING TEXTURE
  //  ─────────────────────────────────────────────
  //  Put your ceiling texture file in:
  //    public/assets/textures/ceiling/
  //  Then edit the values below.
  // ══════════════════════════════════════════════
  ceiling: {
    texture: '/assets/textures/corridor/ceiling_gold_coffer.png',
    repeat: [1, 18],
    color: '#ffffff',
    opacity: 1,
  },

  carpet: {
    texture: '/assets/textures/corridor/red_carpet.png',
    repeat: [1, 24],
    color: '#ffffff',
    opacity: 1,
  },

  identityFrame: {
    texture: '/assets/textures/corridor/identity_frame.png',
    repeat: [1, 1],
    color: '#ffffff',
    opacity: 1,
  },

  // Each corridor station has its own two-leaf artwork. The renderer crops
  // the left and right halves onto separate hinged meshes.
  stationDoors: [
    '/assets/textures/doors/stations/01-threshold.png',
    '/assets/textures/doors/stations/02-offering.png',
    '/assets/textures/doors/stations/03-reframing.png',
    '/assets/textures/doors/stations/04-judgement.png',
    '/assets/textures/doors/stations/05-covenant.png',
    '/assets/textures/doors/stations/06-ritual.png',
    '/assets/textures/doors/stations/07-relic.png',
    '/assets/textures/doors/stations/08-afterlife.png',
    '/assets/textures/doors/stations/09-reflection.png',
  ],

  // ══════════════════════════════════════════════
  //  DOOR TEXTURE (face node panels)
  //  ─────────────────────────────────────────────
  //  Put your door texture file in:
  //    public/assets/textures/doors/
  //  Then edit the values below.
  // ══════════════════════════════════════════════
  door: {
    texture: '/assets/textures/doors/door-panel.webp',
    repeat: [1, 1],
    color: '#171b18',
    opacity: 0.06,
  },

  // ══════════════════════════════════════════════
  //  FACE NODE OVERLAY TEXTURE
  //  ─────────────────────────────────────────────
  //  Put your face node texture file in:
  //    public/assets/textures/faces/
  //  Then edit the values below.
  // ══════════════════════════════════════════════
  faceNode: {
    texture: '/assets/textures/faces/face-node.webp',
    repeat: [1, 1],
    color: '#171b18',
    opacity: 0.08,
  },

  // ══════════════════════════════════════════════
  //  POSTER / PANEL TEXTURE
  //  ─────────────────────────────────────────────
  //  Put your poster texture file in:
  //    public/assets/textures/posters/
  //  Then edit the values below.
  // ══════════════════════════════════════════════
  poster: {
    texture: '/assets/textures/posters/poster-grid.webp',
    repeat: [1, 1],
    color: '#5f7d67',
    opacity: 0.12,
  },

  // ══════════════════════════════════════════════
  //  ENTRANCE GATE PANEL TEXTURE
  //  ─────────────────────────────────────────────
  //  Put your entrance gate texture file in:
  //    public/assets/textures/doors/
  //  Then edit the values below.
  // ══════════════════════════════════════════════
  entrancePanel: {
    texture: '/assets/textures/doors/entrance-panel.webp',
    repeat: [1, 1],
    color: '#171b18',
    opacity: 0.14,
  },

  // ══════════════════════════════════════════════
  //  AUCTION / MARKET PANEL TEXTURE
  //  ─────────────────────────────────────────────
  //  Put your auction panel texture file in:
  //    public/assets/textures/posters/
  //  Then edit the values below.
  // ══════════════════════════════════════════════
  auctionPanel: {
    texture: '/assets/textures/posters/auction-panel.webp',
    repeat: [1, 1],
    color: '#5f7d67',
    opacity: 0.1,
  },
};
