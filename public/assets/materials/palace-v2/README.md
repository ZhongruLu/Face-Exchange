# Palace surface textures

## Lighting update

Current walls use `ornate-wall-reference.jpg`, supplied by the user on 2026-10-13.
The original 1376x768 JPEG is preserved. The wall shader samples pixels
x=331..1324 and y=178..511 to exclude the black surround and painted door.
Horizontal repetition preserves the selected region's proportions at each wall height.
The previous `rococo-wall.jpg` remains available as a backup.

Walls use warm ivory tint and emissive intensity 0.16; ceiling intensity is 0.065.
Door uplights use amber (#ffcc78), penumbra 0.85 and 8-unit range, with a
feathered upward wall beam and no extra shadow maps. At most two nearby
corridor door pairs contribute actual spotlights.
Scene fog uses amber (#684329), exponential squared density 0.0095.
`walnut-beam.jpg` is one shared 512x512 texture for existing beams and arches.

Walnut generation prompt (built-in imagegen):
Use case: stylized-concept. Asset type: seamless PBR-style color texture for classical Western European palace timber beams. One flat orthographic square 1024x1024 texture, dark smoked walnut wood with fine continuous horizontal long grain, subtle hand-planed finish and satin oiled patina. Deep brown chocolate tones, soft warm highlights, restrained elegant natural grain, very few knots. Even flat diffuse illumination. All four edges tile seamlessly. No assembled beams, no perspective, no objects, no decorative frames, no carving symbols, no text, no white, no gold, no metal. This is a close-up material swatch to map on existing structural crossbeams.

The local development build registers its scene and renderer with the official
Three.js DevTools observation API when the Chrome extension provides it.
https://github.com/threejs/three-devtools#current-api
This is integration support, not confirmation that the extension was tested.

Generated with the built-in imagegen tool for this project using the user's
wall reference `/Users/luzr/Downloads/ac92a070-3ff1-427d-91e8-de0ada5e8710.jpeg`.
These are flat decorative textures with baked relief, not scanned PBR materials.
No additional sculpture geometry or displacement maps are used.

Previous generated assets: `rococo-wall.jpg` and `coffered-ceiling.jpg`, both 1024x1024,
JPEG quality 86. Their combined download size is approximately 1 MB.
Each texture is loaded once and reused in all scene materials.

## Wall generation prompt

Use case: stylized-concept. Asset type: tileable wall albedo texture for an existing Three.js palace corridor. Input image is STYLE REFERENCE ONLY. Generate a single flat front-facing orthographic wall module, square 1024x1024. Match the reference's intricate antique gold rococo filigree molding, dark almost-black green painted wood and deep burgundy velvet drapery. One continuous full-height wall: ornate cornice along top 12%, tall symmetrical burgundy draped panel framed in fine gold floral scrollwork in middle 65%, framed dark wood wainscot along bottom 23%. Narrow matching vertical filigree borders at left and right so modules repeat horizontally seamlessly. Rich detailed material relief rendered into the texture with even soft neutral light, subtle highlights, no harsh directional lighting. Fill image to every edge. No room perspective, no ceiling visible, no floor, NO floor reflection, no columns, no doors, no signage, no text, no people, no furniture, no floating objects. This is a directly usable wall texture, not a room scene or contact sheet.

## Ceiling generation prompt

Use case: stylized-concept. Asset type: seamless tileable ceiling albedo texture for Three.js palace. Create one square orthographic top-down texture of luxurious gold coffered ceiling. 2x2 evenly aligned recessed square coffers with dense fine rococo floral filigree borders, carved gilded cornice rails, small gold rosettes in panel centers, warm dark bronze recessed panels and polished antique gold trim. Fine detailed physically plausible carving, subtle relief shadows baked softly, even neutral soft lighting over entire tile. Make all four edges seamless tileable, matching half-rails at opposite borders; fill every edge. Palette antique warm gold with dark ochre-bronze recesses, coordinate with dark green/burgundy palace walls. STRICT flat overhead texture sheet, no perspective, no room, no walls, no floor, no reflection, no people, no furniture, no lights or bright white patches, no labels, no borders outside the pattern, no text or watermark. This is a usable repeated ceiling surface texture, NOT a render of a whole palace. Target 1024x1024.
