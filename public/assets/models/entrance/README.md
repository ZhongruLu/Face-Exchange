# Entrance models

Source files are preserved in /Users/luzr/Downloads.

## Carpet test

ornate-carpet-original.glb is an unchanged copy of /Users/luzr/Downloads/无标题.glb, containing 1,962,562 source triangles. It is now disabled and not requested by the page. The original and project copy are preserved for later experiments. The simple carpet and edge-strip fallback are also removed.

## Active door revision

ornate-door-clean.glb is now the active door asset. It contains 1,845,211 triangles and is 48,930,044 bytes. Ornate geometry is not decimated. It removes only the redundant moving rear sheets (source 35/37), which overlapped the sealed runtime backing; fixed transom portions remain. Lower source-part-14 moulding is fixed outside the opening. Frame shaft/capital fragments (9,10,11,12,16,17,20,21,34,36,38,45,52,54,56,61,63) are entirely assigned to DoorFrame so their feet/cap edges cannot swing into the passage. The backing does not receive self-shadows. This revision was checked in frame-by-frame browser screenshots through the opening and walk-through.

It drops unused metallic/roughness maps and caps normal maps at 256 pixels; color maps remain unchanged. Image count is 156. Rebuild: work/clean_door_overlaps.py. Editable file: work/entrance-door-clean.blend. Earlier memory/threshold exports are kept for comparison but are not requested by the page.

Runtime packs normals as normalized Int16 and in-range UVs as normalized Uint16, with 16-bit indices where they fit. Position arrays and triangle topology remain unchanged. Browser measurements: column attribute/index buffers 2,832,196 -> 2,431,108 bytes; door buffers 47,223,224 -> 36,000,364 bytes. These are geometry buffer counts, not total browser process memory.

Entrance reflection resolution is 512 instead of 768. Renderer pixel ratio is capped at 1.5. The relocated loop entrance remains loaded for uninterrupted looping, but is excluded from rendering until the last approach. Procedural fallback geometry is released once models load. Controller disposal releases entrance geometry, materials, textures and reflection resources; asynchronous loads cannot reattach after disposal.

Plinth source parts 15, 24, 26, 41, 46, 47, 48, 60, 62, 64, 67, 75, 76, 77 stay entirely attached to DoorFrame, including their overlapping inner faces. Their width is scaled to 68% around X = +/-0.31 and depth to 45% around Blender Y = 0.02. Their height and source tessellation are retained. Runtime pivots now sit on the rear hinge surface at Z = -0.69; offsets preserve the exact closed pose. This prevents the thick backing and bottom moulding sweeping into the walking lane.

The door opening is rectangular beneath the fixed decorative transom. The split is at X = -0.219 / 0 / 0.219 and height 0.586 (source units). All lower threshold geometry inside the opening moves with the corresponding leaf. The old curved per-face mask and 0.01 bottom exclusion are no longer used. Thin backing plates are attached to the existing hinges in the runtime.

Editable source: /Users/luzr/Documents/Codex/2026-10-05/referenced-chatgpt-conversation-this-is-an-3/work/entrance-door-clear-threshold.blend
Rebuild script: /Users/luzr/Documents/Codex/2026-10-05/referenced-chatgpt-conversation-this-is-an-3/work/repair_door.py

The older low-poly door export below remains only for comparison and is not loaded by the page.

- ornate-door-web.glb: 207,795 triangles; 11,099,468 bytes. Named groups DoorFrame, LeftDoor, RightDoor.
- classical-column-web.glb: 57,755 triangles; 3,607,728 bytes. Shared geometry is cloned for the hall columns.

Generated with Blender 4.3.2 in an isolated background process. Door decimation ratio 0.11, column ratio 0.055. Door maps capped at 256 pixels per authored part; column maps capped at 1024. JPEG export quality 85. Original UVs and normal maps are retained. No external decoder is required.

Editable Blender files and generation script:
/Users/luzr/Documents/Codex/2026-10-05/referenced-chatgpt-conversation-this-is-an-3/work/entrance-door-web.blend
/Users/luzr/Documents/Codex/2026-10-05/referenced-chatgpt-conversation-this-is-an-3/work/entrance-column-web.blend
/Users/luzr/Documents/Codex/2026-10-05/referenced-chatgpt-conversation-this-is-an-3/work/prepare_models.py

The source door has no authored animation or hinge labels. Leaves are partitioned by the inner arch and central seam. The frame remains fixed. Fine topology around the curved upper leaf edge should receive manual retopology before extreme close-up use.

Runtime material and positioning adjustments are in src/scripts/processionalEntrance.js. Original source attribution/license documents should be supplied before public release; this export does not establish redistribution rights.
