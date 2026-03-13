# Fisk Heroes Hero Pack Creation Guide

An unofficial guide compiled through extensive trial, error, and reverse-engineering. The official mod documentation is sparse, so this fills the gaps.

**Mod version**: Fisk Heroes 2.4.0 for Minecraft 1.7.10 (Forge)
**Scripting engine**: Nashorn (Java 8 JavaScript)
**Reload command**: `/fiskheroes reload` (renderer changes require a full game restart)
**Equip command**: `/suit domain:hero_name`

---

## Table of Contents

1. [Pack Structure](#1-pack-structure)
2. [heropack.json — Pack Definition](#2-heropackjson)
3. [Hero Data JS — Powers & Logic](#3-hero-data-js)
4. [Powers JSON — Modifier Definitions](#4-powers-json)
5. [Renderer JS — Visuals & Effects](#5-renderer-js)
6. [Model JSON — Textures & Custom Properties](#6-model-json)
7. [Particle Emitters](#7-particle-emitters)
8. [Equipment & Weapons](#8-equipment--weapons)
9. [Gotchas & Pitfalls](#9-gotchas--pitfalls)
10. [Built-in Modifiers Reference](#10-built-in-modifiers-reference)
11. [Built-in Attributes Reference](#11-built-in-attributes-reference)
12. [Built-in External Scripts](#12-built-in-external-scripts)
- [Appendix A: JS API Reference](#appendix-a-js-api-reference)
- [Appendix B: Tiering & Stat Reference](#appendix-b-tiering--stat-reference)

---

## 1. Pack Structure

```
worm-hero-pack/
  heropack.json                          # Pack metadata + custom data vars
  assets/<domain>/
    data/
      heroes/<hero>.js                   # Hero logic (init, keybinds, modifiers)
      powers/<powers>.json               # Modifier definitions (damage, sounds, etc.)
      fisktag/weapons/<weapon>.json      # Custom weapon definitions (optional)
    renderers/heroes/<hero>.js           # Visual effects (beams, glows, particles)
    models/
      heroes/<hero>.json                 # Model properties (textures, cape, equipment)
      particles/emitters/<emitter>.json  # Custom particle emitter definitions
    textures/heroes/<hero>/              # Texture PNG files
    sounds/<hero>/                       # Sound OGG files (optional)
```

All files reference each other by `domain:name` identifiers. Your pack's domain is set in `heropack.json`.

---

## 2. heropack.json

Defines the pack and its custom data variables.

```json
{
  "name": "My Hero Pack",
  "description": "Pack description",
  "domain": "mypack",
  "packFormat": 1,
  "dataVars": {
    "my_mode":          {"type": "BYTE",         "resetWithoutSuit": true},
    "my_flag":          {"type": "BOOLEAN",       "resetWithoutSuit": true},
    "my_timer":         {"type": "FLOAT_INTERP",  "resetWithoutSuit": true},
    "my_counter":       {"type": "INTEGER",       "resetWithoutSuit": true}
  }
}
```

### Data var types:
| Type | Use | Notes |
|------|-----|-------|
| `BYTE` | Small integers (0-127) | Used for mode/state cycling. Returns Java Byte object — see [Gotchas](#9-gotchas--pitfalls) |
| `BOOLEAN` | Flags | `true`/`false` |
| `FLOAT_INTERP` | Smooth animations | Interpolates between values for smooth visual transitions |
| `INTEGER` | Larger numbers | Cooldown counters, etc. |

**Important**: Custom data var names must NOT collide with built-in modifier names. E.g., naming a var `ground_smash` will break `fiskheroes:ground_smash` for ALL heroes in all packs.

Data vars are accessed as `domain:dyn/varname` — e.g., `mypack:dyn/my_mode`.

---

## 3. Hero Data JS

The main logic file. Defines the hero's powers, keybinds, attributes, and behavior.

### Minimal example:

```javascript
function init(hero) {
    hero.setName("My Hero");
    hero.setTier(3);  // 1-9, affects base stats

    // Armor piece names (displayed in inventory)
    hero.setHelmet("Mask");
    hero.setChestplate("Suit");
    hero.setLeggings("Pants");
    hero.setBoots("Boots");

    // Load modifier definitions from powers JSON
    hero.addPowers("mypack:my_powers");

    // Base attributes (value, mode: 0=add, 1=multiply)
    hero.addAttribute("PUNCH_DAMAGE", 6.0, 0);
    hero.addAttribute("SPRINT_SPEED", 0.2, 1);
    hero.addAttribute("JUMP_HEIGHT", 0.5, 0);
    hero.addAttribute("FALL_RESISTANCE", 0.5, 1);

    // Keybind: toggles a built-in modifier
    hero.addKeyBind("CHARGED_BEAM", "Fire Beam", 1);
}
```

### Keybinds

Two types of keybinds:

```javascript
// Type 1: addKeyBind — toggles a built-in modifier by name
// The string matches a modifier constant (GRAVITY_MANIPULATION, HEAT_VISION, etc.)
hero.addKeyBind("HEAT_VISION", "Label shown in HUD", 4);  // key 4

// Type 2: addKeyBindFunc — runs custom JavaScript
hero.addKeyBindFunc("MY_FUNC", function(entity, manager) {
    var current = entity.getData("mypack:dyn/my_mode");
    manager.setData(entity, "mypack:dyn/my_mode", (current + 1) % 3);
    return true;  // true = keybind activated, false = did nothing
}, "Label", 1);  // key 1
```

**CRITICAL:** `addKeyBindFunc` with a slot number **must return a boolean**. Returning `undefined` (no return statement) causes `ClassCastException: Undefined cannot be cast to java.lang.Boolean` and crashes the game. Always end with `return true;` (keybind activated) or `return false;` (did nothing).

Keys 1-5 are available. Multiple keybinds can share a key — when multiple are enabled simultaneously, the **last one registered** (in script order) gets its label shown in the HUD. Registration order matters for display priority. For `addKeyBind`, `isKeyBindEnabled` controls BOTH visibility AND whether the action fires. For `addKeyBindFunc`, the function always fires but `isKeyBindEnabled` controls the label display. Note: `addKeyBindFunc` labels do NOT override `addKeyBind` labels on the same slot; use fake `addKeyBind` names (e.g. `"DOG_CALL_LABEL"`) for display-only label swapping (see Rorschach in hells-kitchen pack).

### Modifier gating

```javascript
hero.setModifierEnabled(function(entity, modifier) {
    var mode = entity.getData("mypack:dyn/my_mode");
    switch (modifier.name()) {
    case "fiskheroes:heat_vision":
        return mode == 1;
    case "fiskheroes:controlled_flight":
        return true;  // always on
    default:
        return true;  // IMPORTANT: default true or ungated modifiers won't work
    }
});
```

### Keybind visibility

```javascript
hero.setKeyBindEnabled(function(entity, keyBind) {
    var mode = entity.getData("mypack:dyn/my_mode");
    switch (keyBind) {
    case "HEAT_VISION":
        return mode == 1;
    default:
        return true;
    }
});
```

### Strikethrough keybind labels

Returning `false` from `isKeyBindEnabled` hides the keybind from the HUD entirely. To show a **strikethrough** label instead (indicating the ability exists but is currently unavailable), register a second keybind on the same key slot with a `§m` prefix in the label, and swap visibility between the two:

```javascript
hero.addKeyBind("ENERGY_PROJECTION", "Darkness Blast", 2);
hero.addKeyBind("ENERGY_PROJECTION_DISABLED", "\u00A7mDarkness Blast", 2);

hero.setKeyBindEnabled(function(entity, keyBind) {
    switch (keyBind) {
    case "ENERGY_PROJECTION":
        return entity.getHeldItem().isEmpty();        // show when hand empty
    case "ENERGY_PROJECTION_DISABLED":
        return !entity.getHeldItem().isEmpty();        // strikethrough when holding item
    default:
        return true;
    }
});
```

The `§m` is Minecraft's strikethrough formatting code (`\u00A7m` in JS strings). The disabled keybind should share the same key slot so it appears in the same position. This pattern is also used for toggle states (e.g. kick active/inactive).

### Tick handler

Runs every game tick (20/sec) on **BOTH client and server**. Use for continuous logic.

**WARNING: Do NOT use `Math.random()` here (or anywhere in hero scripts).** All code runs independently on both sides — random values will differ, causing silent data var desync that breaks powers. See [Gotchas: Client/Server Desync](#clientserver-desync-critical) for details and workarounds.

```javascript
hero.setTickHandler(function(entity, manager) {
    // Force a state based on conditions
    if (someCondition) {
        manager.setData(entity, "fiskheroes:shadowform", true);
    }

    // Required for super speed to work
    speedster_base.tick(entity, manager);

    return false;  // return value not used
});
```

### Properties, attributes, and damage profiles

```javascript
// Breathing in space/water
hero.setHasProperty(function(entity, property) {
    if (property == "BREATHE_SPACE" || property == "BREATHE_WATER") return true;
    return false;
});

// Conditional attribute profiles (e.g., extended reach when using gravity)
hero.addAttributeProfile("GRAVITY", function(profile) {
    profile.inheritDefaults();
    profile.addAttribute("REACH_DISTANCE", 50.0, 0);
});
hero.setAttributeProfile(function(entity) {
    return someCondition ? "GRAVITY" : null;
});

// Damage profiles
hero.addDamageProfile("PUNCH", { "types": { "BLUNT": 1.0 } });
hero.setDamageProfile(function(entity) { return "PUNCH"; });
```

### External modules

```javascript
var speedster_base = implement("fiskheroes:external/speedster_base");
// Then call speedster_base.tick(entity, manager) in tick handler
```

---

## 4. Powers JSON

Defines the actual modifier parameters (damage, range, sounds, etc.).

```json
{
  "name": "My Powers",
  "modifiers": {
    "fiskheroes:controlled_flight": {
      "speed": 0.1,
      "boostSpeed": 0.2,
      "canBoost": true,
      "collision": {
        "blocks": { "stopFlying": false, "takeDamage": false },
        "entities": { "stopFlying": false, "dealDamage": true }
      },
      "knockback": 0.4,
      "soundEvents": {
        "ENABLE": ["fiskheroes:flight_loop", "fiskheroes:flight_cape_loop"],
        "BOOST": "fiskheroes:flight_boost"
      }
    },
    "fiskheroes:heat_vision": {
      "damageProfile": {
        "damage": 15.0,
        "types": { "ENERGY": 1.0 },
        "properties": { "COOK_ENTITY": true, "HEAT_TRANSFER": 15 }
      },
      "range": 32.0,
      "radius": 0.1,
      "soundEvents": {
        "BEAM_AMBIENT": "fiskheroes:heat_vision"
      }
    },
    "fiskheroes:healing_factor|my_regen": {
      "delay": 60,
      "amount": 1.0
    },
    "fiskheroes:sonic_waves": {
      "damage": 6.0,
      "range": 5.0
    }
  },
  "hud": [
    {
      "type": "DIAL",
      "color": "fiskheroes:gravity_manipulation",
      "data": "fiskheroes:gravity_amount",
      "condition": "fiskheroes:gravity_manip"
    }
  ]
}
```

### Pipe variants

Append `|name` to create multiple instances of the same modifier type:

```json
"fiskheroes:damage_immunity|explosion": { "damageType": "EXPLOSION" },
"fiskheroes:damage_immunity|blunt": { "damageType": "BLUNT" }
```

When checking in `isModifierEnabled`, use `modifier.name()` (returns `"fiskheroes:damage_immunity"`) and `modifier.id()` (returns `"explosion"` or `"blunt"`) to distinguish them.

---

## 5. Renderer JS

Controls all visual effects. Changes here require a full game restart.

### Basic structure:

```javascript
extend("fiskheroes:hero_basic");  // Inherit base renderer

loadTextures({
    "layer1": "mypack:hero_layer1",      // Base skin
    "layer2": "mypack:hero_layer1",      // Overlay (often same as layer1)
    "glow":   "mypack:hero_glow"         // Glow map (optional)
});

var utils = implement("fiskheroes:external/utils");
var myGlow;

function init(renderer) {
    parent.init(renderer);
}

function initAnimations(renderer) {
    parent.initAnimations(renderer);
    utils.addFlightAnimationWithLanding(renderer, "hero.FLIGHT", "fiskheroes:flight/default.anim.json");
    utils.addHoverAnimation(renderer, "hero.HOVER", "fiskheroes:flight/idle/default");
}

function initEffects(renderer) {
    // Beam weapon (heat vision, energy projection, etc.)
    utils.bindBeam(renderer, "fiskheroes:heat_vision", "fiskheroes:heat_vision", "head", 0xFF6622, [
        { "firstPerson": [2.2, 0.0, 2.0], "offset": [2.2, -3.3, -4.0], "size": [1.0, 0.5] },
        { "firstPerson": [-2.2, 0.0, 2.0], "offset": [-2.2, -3.3, -4.0], "size": [1.0, 0.5] }
    ]).setParticles(renderer.createResource("PARTICLE_EMITTER", "fiskheroes:impact_heat_vision"))
    .setCondition(function(entity) {
        return entity.getData("mypack:dyn/mode") == 1;
    });

    // Glow overlay
    myGlow = renderer.createEffect("fiskheroes:glowerlay");
    myGlow.color.set(0x44DDFF);

    // Texture overlay (e.g., crystal armor)
    var overlay = renderer.createEffect("fiskheroes:overlay");
    // Set texture in render() function

    // Particle cloud
    utils.bindCloud(renderer, "fiskheroes:particle_cloud", "mypack:my_particles")
        .setCondition(function(entity) { return someCondition; });

    // Trail effect (e.g., lightning)
    utils.bindTrail(renderer, "mypack:my_trail")
        .setCondition(function(entity) { return someCondition; });

    // Wind/ambient particles
    renderer.bindProperty("fiskheroes:particles").setParticles(
        renderer.createResource("PARTICLE_EMITTER", "mypack:my_emitter")
    ).setCondition(function(entity) {
        return entity.getData("fiskheroes:flying");
    });

    // Forcefield / shield bubble
    var forcefield = renderer.bindProperty("fiskheroes:forcefield");
    forcefield.color.set(0x44FF66);
    forcefield.setShape(36, 18).setOffset(0.0, 6.0, 0.0).setScale(1.5);

    // Gravity manipulation color
    renderer.bindProperty("fiskheroes:gravity_manipulation").color.set(0x44FF66);

    // Night vision (needs game restart, not just reload)
    renderer.bindProperty("fiskheroes:night_vision");
}

function render(entity, renderLayer, isFirstPersonArm) {
    // Dynamic glow based on state
    myGlow.opacity = someCondition ? 0.3 : 0.0;
    myGlow.render();

    // Overlay with dynamic texture
    if (someCondition) {
        overlay.texture.set("glow", null);
        overlay.opacity = 0.6;
        overlay.render();
    }
}
```

### Key renderer methods:
| Method | Purpose |
|--------|---------|
| `utils.bindBeam(renderer, modifier, beamModel, bodyPart, color, offsets)` | Beam weapons |
| `utils.bindCloud(renderer, property, emitter)` | Particle cloud around entity |
| `utils.bindTrail(renderer, trailResource)` | Trailing effect |
| `utils.bindParticles(renderer, emitter)` | Particle binding with `.setCondition()` |
| `renderer.createEffect("fiskheroes:glowerlay")` | Body glow effect |
| `renderer.createEffect("fiskheroes:overlay")` | Texture overlay |
| `renderer.bindProperty("fiskheroes:particles")` | Particle system |
| `renderer.bindProperty("fiskheroes:forcefield")` | Shield bubble |
| `renderer.bindProperty("fiskheroes:night_vision")` | Night vision |

Multiple `bindCloud` and `bindTrail` calls with different conditions work — they don't override each other.

### Useful entity methods in renderer:
- `entity.getData("domain:dyn/var")` — read data vars
- `entity.getInterpolatedData("domain:dyn/var")` — smoothly interpolated (for FLOAT_INTERP)
- `entity.getHealth()` / `entity.getMaxHealth()` — health ratio
- `entity.isPunching()` — true during punch animation
- `entity.getData("fiskheroes:flying")` — flight state

### Custom 3D Models (Tabula .tbl)

You can attach custom 3D models to body parts using `renderer.createEffect("fiskheroes:model")`. Models are `.tbl` files (Tabula format) placed in `models/tabula/`.

```javascript
// In initEffects():
var myModel = renderer.createResource("MODEL", "domain:model_name");  // loads models/tabula/model_name.tbl
myModel.texture.set("texture_key");  // from loadTextures
var effect = renderer.createEffect("fiskheroes:model").setModel(myModel);
effect.anchor.set("rightArm");  // body part: head, body, rightArm, leftArm, rightLeg, leftLeg
effect.setOffset(x, y, z);      // fine-tune position
effect.setScale(1.0);           // optional scale
effect.setRotation(x, y, z);   // optional rotation

// In render():
effect.render();
```

Model effects also support:
- `effect.opacity = 0.5` — set transparency per-frame before render()
- `model.bindAnimation("domain:anim_name")` — bind an .fsk animation to the model
- `model.texture.set("tex", "lights")` — second arg is emissive/lights texture

### Slim (Alex) Arms

To replace the default 4px Steve arms with 3px Alex-style slim arms:

1. **Get Alex arm model files** — `alex_arm_r.tbl` and `alex_arm_l.tbl` (Tabula format, available in dcuniverse and other packs). Place in `models/tabula/`.

2. **Create a "noarms" skin texture** — copy of the hero skin with arm UV regions made fully transparent:
   - Right arm main: x=40-55, y=16-31
   - Right arm overlay: x=40-55, y=32-47
   - Left arm main: x=32-47, y=48-63
   - Left arm overlay: x=48-63, y=48-63

3. **Set opacity below 1.0** — this enables transparency rendering so the blank arm regions become invisible. Without this, transparent pixels render as black.

4. **Overlay the alex arm models** textured with the original (arms-intact) skin.

```javascript
loadTextures({
    "layer1": "domain:hero_layer1_noarms",    // transparent arm regions
    "layer2": "domain:hero_layer1_noarms",
    "arm_tex": "domain:hero_layer1"           // original skin with arms
});

function initEffects(renderer) {
    // CRITICAL: opacity < 1.0 enables transparency rendering
    renderer.bindProperty("fiskheroes:opacity").setOpacity(function (entity, renderLayer) {
        return 0.9999;
    });

    // Slim right arm
    var armRModel = renderer.createResource("MODEL", "domain:alex_arm_r");
    armRModel.texture.set("arm_tex");
    alexArmR = renderer.createEffect("fiskheroes:model").setModel(armRModel);
    alexArmR.anchor.set("rightArm");
    alexArmR.setOffset(-6.0, -2.05, 0.0);

    // Slim left arm
    var armLModel = renderer.createResource("MODEL", "domain:alex_arm_l");
    armLModel.texture.set("arm_tex");
    alexArmL = renderer.createEffect("fiskheroes:model").setModel(armLModel);
    alexArmL.anchor.set("leftArm");
    alexArmL.setOffset(5.0, -2.05, 0.0);
}

function render(entity, renderLayer, isFirstPersonArm) {
    if (renderLayer == "CHESTPLATE") {
        alexArmR.render();
        alexArmL.render();
    }
}
```

### Per-Piece Texture Splitting (Partial Suit Rendering)

Without per-piece textures, wearing individual armor pieces (e.g., just boots) renders the full body skin texture on that piece's geometry, causing wrong body parts to show. The fix: create separate textures per render layer, each containing only the UV regions relevant to that piece.

**64x64 Minecraft Skin UV Layout:**
| Region | Layer 1 (Base) | Layer 2 (Overlay) |
|--------|---------------|-------------------|
| Head | (0,0)-(31,15) | (32,0)-(63,15) |
| Right Leg | (0,16)-(15,31) | (0,32)-(15,47) |
| Body | (16,16)-(39,31) | (16,32)-(39,47) |
| Right Arm | (40,16)-(55,31) | (40,32)-(55,47) |
| Left Leg | (16,48)-(31,63) | (0,48)-(15,63) |
| Left Arm | (32,48)-(47,63) | (48,48)-(63,63) |

**Split textures needed per piece** (each is a 64x64 PNG with only the relevant UV regions filled, rest transparent):
- **Mask/Helmet** — head overlay region only (32,0)-(63,15). For mask-style accessories, exclude the base head (hair/face) so it only shows with the full suit.
- **Chest** — body + arm UV regions. Use the FULL texture (with normal-width arms) for partial suit, since slim alex arm overlays only render with full suit.
- **Leggings** — leg UV regions, top portion of side faces + top cap.
- **Boots** — leg UV regions, bottom portion of side faces + sole cap. Overlap 1 row with leggings at the boundary to prevent gaps.

**Renderer pattern:**
```javascript
loadTextures({
    "layer1": "domain:hero_noarms",       // Full costume, arms transparent (full suit + SKIN base)
    "layer2": "domain:hero_noarms",
    "mask": "domain:hero_mask",           // Head overlay only
    "chest": "domain:hero_chest",         // Body + arms (with normal-width arm art)
    "leggings": "domain:hero_leggings",
    "boots": "domain:hero_boots",
    "arm_tex": "domain:hero_full"         // Full texture for alex arm overlays
});

function init(renderer) {
    parent.init(renderer);
    renderer.setTexture(function (entity, renderLayer) {
        if (entity.isWearingFullSuit()) return "layer1";
        if (renderLayer == "SKIN") return "layer1";
        if (renderLayer == "HELMET") return "mask";
        if (renderLayer == "LEGGINGS") return "leggings";
        if (renderLayer == "BOOTS") return "boots";
        return "chest";
    });
}

function render(entity, renderLayer, isFirstPersonArm) {
    // Alex arms only with full suit (partial suit uses normal arms from chest texture)
    if (renderLayer == "CHESTPLATE" && entity.isWearingFullSuit()) {
        alexArmR.render();
        alexArmL.render();
    }
}
```

**Important notes:**
- `setTexture()` only controls layer 1 (base) geometry. Body overlay UV regions (y=32-47) render on layer 2 geometry, controlled by the `"layer2"` key in `loadTextures`, not by `setTexture()`.
- **Tick handlers only run with full suit equipped.** Cannot use data vars set in tick handlers for partial suit rendering decisions.
- `entity.getEquipmentInSlot(4)` reads the helmet slot (confirmed working). `getWornHelmet()` may not exist.

### showModel — Cross-Layer Body Part Rendering

`renderer.showModel(renderLayer, ...bodyParts)` makes a render layer render additional body parts beyond its default set. This is essential when a costume piece visually spans multiple body regions (e.g., a scarf that's part of the helmet item but hangs down onto the torso).

```javascript
// Make HELMET layer also render body geometry (for scarf body pixels in mask texture)
renderer.showModel("HELMET", "head", "headwear", "body");
```

Body part names: `"head"`, `"headwear"`, `"body"`, `"rightArm"`, `"leftArm"`, `"rightLeg"`, `"leftLeg"`.

**Use case — Imp's scarf:** The scarf is part of the "Mask & Scarf" helmet item but has pixels in both head overlay (mask) and body overlay (scarf torso) UV regions. By adding `"body"` to the HELMET's showModel, the mask texture's body overlay pixels render on body geometry when the helmet is equipped.

### fixHatLayer — Render Layer Ordering

`renderer.fixHatLayer(layerA, layerB)` fixes render ordering between two armor layers. It makes the first layer's base geometry render when the second layer is equipped, but **only layer 1 (base) geometry, not layer 2 (overlay)**. It does NOT force a missing armor layer to fully render.

```javascript
renderer.fixHatLayer("HELMET", "CHESTPLATE");
```

For most cross-layer rendering needs, prefer `showModel` instead.

---

## 6. Model JSON

Defines textures, custom visual properties, and conditional rendering.

```json
{
  "parent": "fiskheroes:hero_basic",
  "resources": {
    "layer1": "mypack:hero_layer1",
    "layer2": "mypack:hero_layer2",
    "cape": "mypack:hero_cape"
  },
  "custom": {
    "fiskheroes:cape": {
      "applicable": ["CHESTPLATE"],
      "texture": "cape",
      "length": 22,
      "data": "fiskheroes:wing_animation_timer"
    },
    "fiskheroes:equipped_item": {
      "applicable": ["CHESTPLATE"],
      "items": [{
        "anchor": "body",
        "scale": 0.7,
        "offset": [-4.5, 10.5, 0.5],
        "rotation": [100.0, 5.0, 0.0]
      }]
    },
    "fiskheroes:equipment_wheel": {
      "color": "0x000000"
    }
  }
}
```

---

## 7. Particle Emitters

JSON files in `models/particles/emitters/`. Referenced as `domain:emitter_name`.

```json
{
  "particles": [
    {
      "type": "THICK_SMOKE",
      "amount": 3,
      "offset": [0.0, 1.0, 0.0],
      "motion": [0.0, 0.0, 0.0],
      "randOffset": [0.0, 0.0, 0.0],
      "randMotion": [0.3, 0.2, 0.3]
    },
    {
      "condition": "!firstPerson",
      "type": "FIREWORK_BACKGROUND",
      "amount": 1,
      "anchor": "rightArm",
      "offset": {"tp": [2.0, 8.5, 0.0], "fp": [2.0, 3.0, -6.0]},
      "motion": [0.1, 0.0, 0.2],
      "mirror": "!firstPerson",
      "lockFPYaw": true
    }
  ]
}
```

### Particle types:

**Mod-defined types:**
| Type | Appearance |
|------|------------|
| `SMOKE` | Standard smoke |
| `SMOKE_SMALL` | Tiny smoke puffs |
| `THICK_SMOKE` | Dense smoke |
| `BIG_SMOKE` | Large smoke puffs |
| `SHADOW_SMOKE` | Dark shadow particles |
| `CRYO_SMOKE` | Icy blue particles |
| `ENERGY_SMOKE` | Energy-coloured smoke |
| `MYSTERIO_SMOKE` | Green mystical smoke |
| `FLAME` | Fire |
| `FLAME_BALL` | Larger fire |
| `SHORT_FLAME` | Brief fire |
| `BLUE_FLAME` | Blue fire |
| `SPARK` | Small sparks |
| `BULLET_SPARK` | Bullet impact sparks |
| `FIREWORK_BACKGROUND` | Backdrop glow — `motion` field = RGB color (0-1 range) |
| `FREEZE_RAY` | Freeze beam particles |
| `FREEZE_SMOKE` | Cold fog |
| `ICICLE_BREAK` | Ice shard fragments |
| `QUANTUM_PARTICLE` | Quantum effect |
| `DWARF_STAR_ENERGY` | Dwarf star energy |
| `ETERNIUM_AURA` | Eternium glow |
| `SUBATOMIC_CHARGE` | Subatomic effect |

**Vanilla Minecraft types:**
| Type | Appearance |
|------|------------|
| `minecraft:cloud` | White smoke |
| `minecraft:reddust` | Coloured puffs — `motion` = RGB color |
| `minecraft:flame` | Fire particle |
| `minecraft:lava` | Lava drip |
| `minecraft:largesmoke` | Large smoke |
| `minecraft:explode` | Explosion puff |
| `minecraft:largeexplode` | Large explosion |
| `minecraft:crit` | Critical hit sparkle |
| `minecraft:portal` | Purple portal swirl |
| `minecraft:enchantmenttable` | Enchanting glyphs |
| `minecraft:heart` | Heart |
| `minecraft:bubble` | Underwater bubble |
| `minecraft:splash` | Water splash |
| `minecraft:snowshovel` | Snow fragments |
| `minecraft:depthsuspend` | Underwater depth particles |
| `minecraft:dripWater` | Water drip |
| `minecraft:angryVillager` | Angry villager cloud |
| `minecraft:happyVillager` | Happy villager sparkle |

**Item/block fragment particles:**
| Type | Appearance |
|------|------------|
| `minecraft:iconcrack_ID_META` | Fragments of item texture (e.g. `iconcrack_264_0` = diamond shards) |
| `minecraft:blockcrack_ID_META` | Fragments of block texture (e.g. `blockcrack_1_0` = stone fragments) |

`iconcrack` and `blockcrack` use vanilla item/block IDs. Useful examples: `iconcrack_375_0` (spider eye), `iconcrack_351_0` (ink sac), `blockcrack_3_0` (dirt), `blockcrack_12_0` (sand), `blockcrack_152_0` (redstone block).

### Particle visual notes (tested):
- **`minecraft:reddust`** — Tiny coloured dots. `motion` = RGB. Very low values (0.05) = near-black. Good for generic dark particles.
- **`iconcrack_375_0`** (spider eye) — Chunky red-brown viscera raining down. Good for gore/transformation effects (e.g. Bitch's dog growth).
- **`iconcrack_376_0`** (fermented spider eye) — Similar to spider eye but pinkish.
- **`iconcrack_287_0`** (string) — White wisps. Too light for dark effects.
- **`blockcrack_30_0`** (cobweb) — Wispy grey-white fragments. Works well in a mix for swarm/web effects.
- **`iconcrack_263_0`** (coal) — Black chunks falling. Heavy, not floaty.
- **`iconcrack_351_0`** (ink sac) — Black chunks falling. Similar to coal.
- **`SHADOW_SMOKE`** — Like dark reddust but slower, more lingering. Good atmosphere.
- **`SMOKE_SMALL`** — Surprisingly effective — tiny dark puffs, natural-looking.
- **`minecraft:depthsuspend`** — Tiny, floaty, ambient. Good as background filler.

### Particle fields:
| Field | Purpose |
|-------|---------|
| `type` | Particle type (see above) |
| `amount` | Particles per tick |
| `anchor` | Body part attachment: `body`, `rightArm`, `leftArm`, `head` |
| `offset` | Position offset. Can be `[x,y,z]` or `{"tp": [x,y,z], "fp": [x,y,z]}` for 3rd/1st person |
| `motion` | Velocity. For FIREWORK_BACKGROUND, this is RGB color |
| `randOffset` | Random position variation |
| `randMotion` | Random velocity variation |
| `mirror` | Mirror to opposite arm: `"!firstPerson"` = mirror in 3rd person |
| `condition` | Show condition: `"!firstPerson"` = 3rd person only |
| `lockFPYaw` | Lock particle rotation in first person |

---

## 8. Equipment & Weapons

### Three systems for items:

#### 1. Utility Belt (consumable gadget radial menu)
Built-in grenade/gadget selector. Available items are configured in the powers JSON `fiskheroes:equipment` modifier. Known items: `fiskheroes:grenade`, `fiskheroes:freeze_grenade`, `fiskheroes:smoke_pellet`, `fiskheroes:batarang`, `fiskheroes:throwing_star`.

```javascript
// In hero data JS:
hero.addKeyBind("UTILITY_BELT", "Gadgets", 4);

// In powers JSON, add the equipment modifier:
"fiskheroes:equipment": {}
```

Gate with `isModifierEnabled`:
```javascript
case "fiskheroes:equipment":
    return someCondition;
```

**Multiple equipment loadouts** — use pipe suffixes to define variants, then cycle between them with a keybind and `modifier.id()`:
```json
// In powers JSON:
"fiskheroes:equipment|basic": {
    "equipment": { "fiskheroes:batarang": { "cooldown": 40, "uses": 8, "damageProfile": { ... } } }
},
"fiskheroes:equipment|fire": {
    "equipment": { "fiskheroes:batarang": { "cooldown": 60, "uses": 3, "damageProfile": { ... } } }
},
"fiskheroes:equipment|electro": {
    "equipment": { "fiskheroes:batarang": { "cooldown": 60, "uses": 3, "damageProfile": { ... } } }
}
```
```javascript
// In hero JS — cycle with a keybind:
hero.addKeyBindFunc("func_CHANGE_BATARANG", function (entity, manager) {
    var type = entity.getData("domain:dyn/batarang_type");
    manager.setData(entity, "domain:dyn/batarang_type", type >= 3 ? 1 : type + 1);
    return true;
}, "Change Batarang", 1);

// Gate so only the active variant fires:
function isModifierEnabled(entity, modifier) {
    var type = entity.getData("domain:dyn/batarang_type");
    switch (modifier.name()) {
    case "fiskheroes:equipment":
        return modifier.id() == "basic" && type == 1
            || modifier.id() == "fire" && type == 2
            || modifier.id() == "electro" && type == 3;
    default:
        return true;
    }
}
```

#### 2. addPrimaryEquipment (weapon radial menu)
Adds weapons the hero can equip/unequip. Holding the Equip/Unequip keybind (default I) opens a radial menu if multiple weapons are registered. Each weapon goes into the player's hand when selected.

**Second parameter (`autoEquip`) is critical:**
- `false` — weapon starts holstered, "Equip/Unequip Item" keybind appears. **Use this for single weapons.**
- `true` — weapon auto-equips on suit equip, always in hand. With a single weapon, NO equip/unequip keybind is generated (no way to put it away). Only use `true` when multiple weapons are registered (the system generates a cycle keybind).

```javascript
// Single weapon — use false for equip/unequip toggle
hero.addPrimaryEquipment("fisktag:weapon{WeaponType:worm:beret_92f}", false);

// Multiple weapons — true is fine, radial menu handles cycling
hero.addPrimaryEquipment("fiskheroes:grappling_gun", true);
hero.addPrimaryEquipment("fiskheroes:desert_eagle", true);

// With condition (e.g., dual wield check)
hero.addPrimaryEquipment("fiskheroes:katana{Dual:1}", true,
    item => item.nbt().getBoolean("Dual"));
```

Gate usage with permissions:
```javascript
hero.setHasPermission(function(entity, permission) {
    return permission == "USE_GUN" || permission == "USE_SWORD";
});
```

Whether the item is equipped is tracked — if you drop it, you can't re-equip it for infinite copies.

#### 3. addEquipment (deprecated auxiliary items)
Older system that registered built-in mod items as auxiliary equipment, cycled via `UTILITY_SWITCH`/`UTILITY_RESET` keybinds. Only found in the outdated Arkham pack (`symfiskpack`); modern packs use `addPrimaryEquipment` instead. Some packs still have `addEquipment` calls as dead code (e.g. Star Lord has 3 guns registered this way with no keybind to access them).

```javascript
// Deprecated pattern — use addPrimaryEquipment instead
hero.addEquipment("fiskheroes:grappling_gun");
hero.addKeyBind("UTILITY_SWITCH", "key.utilitySwitch", 1);
hero.addKeyBind("UTILITY_RESET", "key.utilityReset", 2);
```

Known built-in item IDs (usable with both systems): `fiskheroes:grappling_gun`, `fiskheroes:captain_americas_shield`, `fiskheroes:desert_eagle`, `fiskheroes:bo_staff`, `fiskheroes:compound_bow`, `fiskheroes:quiver`, `fiskheroes:deadpools_swords`, `fiskheroes:black_canarys_tonfas`, `fiskheroes:prometheus_sword`, `fiskheroes:flash_ring`, `fiskheroes:chronos_rifle`, `fiskheroes:rip_hunters_gun`, `fiskheroes:katana`, `fiskheroes:beretta_93r`, `fiskheroes:scimitar`, `fiskheroes:tactical_tonfa`.

Note: Built-in items only work if they exist in your mod version.

#### 4. Custom FiskTag Weapons (Full Guide)

Custom weapons require **5 files** (all paths relative to `assets/<domain>/`):

1. **Weapon definition**: `data/fisktag/weapons/<name>.json` — stats, damage, sound
2. **Weapon renderer**: `renderers/fisktag/weapons/<name>.js` — 3D model, beam, crosshair
3. **Weapon texture**: `textures/fisktag/weapons/<name>.png` — skin for the 3D model
4. **Beam model**: `models/beams/<name>.json` — projectile visual (for guns)
5. **Sound event**: `events/sounds/<name>.json` — shoot sound registration

##### Weapon Definition JSON

```json
{
  "name": "Beret 92F",
  "permission": "USE_GUN",
  "holdingPose": "SINGLE",
  "cooldown": 8,
  "damageProfile": {
    "damage": 4.0,
    "types": { "BULLET": 1 }
  },
  "fisktag": { "sprintShootDelay": 4, "sprintDelay": 2 },
  "scope": { "zoom": 0.3, "allowHeadshots": true, "damageBonus": 1.3, "headshotDamageBonus": 2.0 },
  "spread": { "sprintingFactor": 1.4, "fallingFactor": 1.5, "scopingFactor": 0.5 },
  "recoil": { "amount": 0.25, "cameraShake": 1.0 },
  "projectiles": [{ "type": "BEAM", "range": 24.0, "spread": 0.3, "trail": 1 }],
  "soundEvents": { "SHOOT": "worm:pistol_shoot" }
}
```

- `permission`: Use `"USE_GUN"` for firearms (convention across packs).
- Holding poses: `SINGLE`, `DUAL`, `RIFLE`.
- Melee weapons use `"melee": { "attackDamage": 9.0 }` instead of `projectiles`.

##### Weapon Renderer JS

```javascript
loadTextures({
    "base": "worm:beret_92f",           // textures/fisktag/weapons/beret_92f.png
    "crosshair": "fisktag:crosshairs/pistol"  // built-in crosshair
});
var utils = implement("fisktag:external/utils");  // provided by FiskTag mod
var model;

function init(renderer) {
    model = utils.createModel(renderer, "fisktag:pistol", "base");  // built-in pistol model
    renderer.setModel(model);
    utils.makeDilatingCrosshair(renderer, "crosshair", 16, 8, [
        { "pos": [6, 1], "size": [5, 7] },
        { "pos": [1, 1], "size": [5, 7], "axis": [-1, 0] },
        { "pos": [11, 1], "size": [5, 7], "axis": [1, 0] }
    ], 0, 4, 12.5);
    // Beam model MUST exist or weapon silently fails (purple missing texture)
    utils.bindScopedBeam(renderer, "worm:gunshot", 0xDDCCBB, [
        { "firstPerson": [-5.0, 4.5, -18.0], "offset": [0.0, 15.0, -4.0], "size": [1.0, 1.0] }
    ], [3.0, -2.0, -2.0]);
}

function render(renderer, entity, glProxy, renderType, scopeTimer, recoil, isLeftSide) {
    glProxy.translate(0, -0.85, -0.52);
    if (renderType === "EQUIPPED_FIRST_PERSON") {
        var f = 1 - scopeTimer * 0.4;
        recoil *= 0.7;
        glProxy.rotate(-recoil * (20 - scopeTimer * 7), 1, 0, 0);
    }
    glProxy.scale(0.85);
}
```

Built-in 3D models: `"fisktag:pistol"`, `"fisktag:rifle"`, `"fisktag:sniper"`, `"fisktag:rocket_launcher"`. For custom models, use `"domain:modelname"` pointing to a `.tbl` file.

Built-in beam models: `"fiskheroes:repulsor_blast"`, `"fisktag:rocket_launcher_beam"`, `"fisktag:sniper_beam"`.

##### Sound Event JSON (`events/sounds/<name>.json`)

```json
{
  "parent": "fiskheroes:sound_base",
  "sound": "fiskheroes:item.gun.deagle.shoot"
}
```

Reference in weapon JSON as `"domain:sound_name"`. Can point to built-in sounds or custom `.ogg` files.

##### Beam Model JSON (`models/beams/<name>.json`)

```json
{
  "aspects": [{
    "type": "LASER",
    "opacity": { "start": 0.0, "end": 0.2 },
    "scale": 1.0, "spin": 0.0,
    "core": { "color": "0xFFFFFF", "additiveBlending": true },
    "bloom": { "strength": 0.5, "spread": 3.0, "dropoff": 3.0, "quality": 1.0 }
  }]
}
```

Multiple aspects create layered effects. `opacity.start`/`end` = beam lifecycle timing (0=start, 1=end). Color tint is set in the renderer's `bindScopedBeam` call.

##### Hero Script Requirements

**All of these are required** for a gun to work:

```javascript
hero.addKeyBind("AIM", "Aim", -1);  // enables aiming/firing
hero.addPrimaryEquipment("fisktag:weapon{WeaponType:worm:beret_92f}", false);
hero.setHasPermission(function(entity, permission) {
    return permission == "USE_GUN";
});
hero.supplyFunction("canAim", function(entity) {
    return entity.getHeldItem().name() == "fisktag:weapon";
});
```

- **`AIM` keybind**: Without this, weapon cannot be aimed or fired.
- **`canAim` function**: `.isGun()` only works for built-in weapons. FiskTag weapons need `.name() == "fisktag:weapon"`.
- **`GUN_RELOAD` keybind**: Optional — only add for ammo-based weapons.
- **Firing**: Right-click to aim, then left-click to fire.

##### Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Purple missing texture, no model | Beam model reference doesn't exist | Check `models/beams/<name>.json` exists, check logs for `FileNotFoundException` |
| In equipment wheel but won't fire | Missing AIM keybind, canAim, or permission | Add all three (see hero script requirements above) |
| No equip/unequip keybind | `addPrimaryEquipment` second arg is `true` with single weapon | Change to `false` |
| "Missing resource" warning | Sound event not registered | Create `events/sounds/<name>.json` |
| `.isGun()` returns false | FiskTag weapons aren't "guns" to the built-in API | Use `.name() == "fisktag:weapon"` |

#### 5. Granting Access to Non-Native Weapons (Picked Up / Found)

Heroes can be given the ability to use weapons they don't own (from other packs, creative mode, etc.) by satisfying **three requirements**:

1. **`setHasPermission`** — return `true` for the weapon's permission string. Each weapon JSON declares a `"permission"` field (e.g. `"USE_GUN"`, `"USE_COLD_GUN"`, `"USE_CHRONOS_RIFLE"`). Return `true` unconditionally to grant all weapons, or check specific strings.

2. **`addKeyBind("AIM", ...)`** — the hero MUST have an AIM keybind registered, even if hidden at slot -1. Without this, the aiming system is never initialized. **Requires a game restart** when first added to a hero.

3. **`supplyFunction("canAim", ...)`** — return `true` when the hero should be able to aim. For built-in weapons, `entity.getHeldItem().isGun()` and `entity.getHeldItem().isLaserGun()` work. For FiskTag weapons, check `entity.getHeldItem().name() == "fisktag:weapon"`. For a blanket "can aim anything held", use `!entity.getHeldItem().isEmpty()`.

**Key findings:**
- `setHasPermission` IS called for built-in weapons (e.g. cold gun checks `USE_COLD_GUN`), not just FiskTag weapons.
- `setHasPermission` alone is NOT sufficient — without `canAim` and AIM keybind, the weapon won't aim or fire even with permission granted.
- `canAim` can be conditional (e.g. only when a teammate is nearby).
- Adding AIM keybind requires a **game restart**, not just `/fiskheroes reload`.
- `addPrimaryEquipment` is NOT required to use found weapons — it only controls what auto-spawns with the suit.

```javascript
// Example: grant all weapon permissions conditionally
hero.addKeyBind("AIM", "Aim", -1);  // hidden but required
hero.setHasPermission(function (entity, permission) {
    return entity.getData("some:dyn/condition");  // dynamic gate
});
hero.supplyFunction("canAim", function (entity) {
    return entity.getData("some:dyn/condition") && !entity.getHeldItem().isEmpty();
});
```

#### 6. Equipment NBT Manipulation (Unlimited Items / Item Conjuration)

The chestplate's `Equipment` NBT tag list controls what items the hero has available. You can directly read and write this to conjure items, reset consumed items, or clear equipment entirely.

**Key API methods:**
- `entity.getWornChestplate().nbt()` — get the chestplate's NBT compound
- `nbt.getTagList("Equipment")` — read the current equipment list
- `manager.setTagList(nbt, "Equipment", newTagList)` — overwrite the equipment list
- `manager.newTagList(jsonString)` — create a new tag list from a JSON string
- `manager.setByte(itemSlot, "Count", newCount)` — modify item stack count

**CRITICAL: Item IDs must be numeric**, not string names. `id:4097` works, `id:"fiskheroes:superhero_chestplate"` fails silently. Find the right ID by reading existing equipment NBT (see debugging pattern below).

**Equipment tagCount behaviour:**
- `tagCount() == 0` — items are in their initial state (managed by `addPrimaryEquipment`), OR all items have been taken out
- `tagCount() > 0` — items have been returned/modified by the player
- Use `tagCount() == 0` to detect "item was taken out, needs refill"

**Conjure arbitrary items** (God/Doctor Manhattan pattern):
```javascript
// Write a fresh item into the equipment slot on demand
hero.addKeyBindFunc("CONJURE", function (entity, manager) {
    var nbt = entity.getWornChestplate().nbt();
    var equipment = manager.newTagList('[{Index:0,Item:{Count:1,Damage:0,id:4097,tag:{HeroType:"worm:parian_spare"}}}]');
    manager.setTagList(nbt, "Equipment", equipment);
    return true;
}, "Conjure Item", 1);
```

**Clear equipment** (reset "taken out" state):
```javascript
// Clear all equipment — items return to available-to-take-out state
var nbt = entity.getWornChestplate().nbt();
manager.setTagList(nbt, "Equipment", manager.newTagList("[]"));
```

**Read item count** (consumable tracking):
```javascript
var nbt = entity.getWornChestplate().nbt();
var equipList = nbt.getTagList("Equipment");
var itemSlot = equipList.getCompoundTag("0").getCompoundTag("Item");
var itemCount = itemSlot.getByte("Count");
manager.setByte(itemSlot, "Count", itemCount - 1);  // decrement
```

**Use cases:**
- Shaker powers that create materials (e.g. Labyrinth conjuring walls)
- Unlimited consumable gadgets (reset count after use)
- Transformation-based item swapping (different loadouts per form)
- Any power that needs to repeatedly give the player items

**Unlimited equipment** (tick-based replenishment):
```javascript
// In init: define initial equipment
hero.addPrimaryEquipment('fiskheroes:superhero_chestplate{HeroType:worm:parian_spare}', true);

// In tick handler: refill when taken out
hero.setTickHandler(function (entity, manager) {
    if (entity.ticksExisted() % 40 != 0) return;
    var nbt = entity.getWornChestplate().nbt();
    if (nbt.getTagList("Equipment").tagCount() == 0) {
        manager.setTagList(nbt, "Equipment",
            manager.newTagList('[{Index:0,Item:{Count:1,Damage:0,id:4097,tag:{HeroType:"worm:parian_spare"}}}]'));
    }
});
```

**Debug equipment NBT** (find numeric item IDs):
```javascript
// Dump equipment entry contents to chat
var equipList = nbt.getTagList("Equipment");
if (equipList.tagCount() > 0) {
    var tag = equipList.getCompoundTag(0);
    var item = tag.getCompoundTag("Item");
    entity.as("PLAYER").addChatMessage("id=" + item.getShort("id")
        + " dmg=" + item.getShort("Damage")
        + " count=" + item.getByte("Count")
        + " hero=" + item.getCompoundTag("tag").getString("HeroType"));
}
```

**Known numeric item IDs:** `4097` = `fiskheroes:superhero_chestplate`

Reference implementations: `dmh:god` (DMH-v1.3.2), `stellar:dr_manhattan` (StellarHeroes_2.0.5), `worm:parian` (unlimited equipment).

#### 7. Single-Piece Full-Body Suits

A hero can define only one armor piece (e.g. just a chestplate) while still rendering the full body using `showModel`:

```javascript
// In renderer init():
renderer.showModel("CHESTPLATE", "head", "headwear", "body", "rightArm", "leftArm", "rightLeg", "leftLeg");
```

This tells the CHESTPLATE render layer to also draw all body parts. The hero's `setTexture` callback applies to all parts. Examples: Danny Phantom (TMHP), Green Lantern (TMHP/DCUniverse), Clayface (DCUniverse), many Casa de Heroes quantum suits.

#### 8. Custom Tabula Models (.tbl)

Tabula `.tbl` files are ZIP archives containing `model.json` and optionally `texture.png`. Create programmatically:

```python
import json, zipfile
model = {
    "modelName": "ModelBiped", "authorName": "pack", "projVersion": 2,
    "textureWidth": 64, "textureHeight": 32,
    "scale": [1.0, 1.0, 1.0], "cubeGroups": [], "anims": [],
    "cubes": [{
        "name": "panel", "dimensions": [8, 10, 1],
        "position": [-4.0, 10.0, 3.0], "offset": [0.0, 0.0, 0.0],
        "rotation": [6.0, 0.0, 0.0], "scale": [1.0, 1.0, 1.0],
        "txOffset": [0, 0], "txMirror": False, "mcScale": 0.5,
        "opacity": 100.0, "hidden": False, "children": [],
        "identifier": "unique_id"
    }],
    "cubeCount": 1
}
with zipfile.ZipFile("model.tbl", "w") as zf:
    zf.writestr("model.json", json.dumps(model))
    zf.writestr("texture.png", png_bytes)  # bundled texture
```

**Key properties:**
- `mcScale`: inflates each face outward by N units (useful for making panels larger without changing UV)
- `txMirror`: flips UV horizontally (use for symmetric left/right panels with shared texture)
- `offset`: shifts geometry from rotation point without moving the pivot

**Pivot trick for `setRotation()`:** `effect.setRotation()` rotates around model origin (0,0,0), which maps to the anchor point on the player. To pivot at a custom point (e.g. waist at y=10), position the cube geometry so the desired pivot is at y=0 in model space, then use `effect.setOffset(0, 10, 0)` to translate down. Rotation then pivots at the waist.

---

## 9. Gotchas & Pitfalls

### Client/Server Desync (CRITICAL)

**`Math.random()` MUST NOT be used anywhere** — not in keybind callbacks, not in tick handlers, not in helper functions called by either. All script code runs on BOTH client and server independently with separate RNG states. The two sides compute different random values, causing data variables to silently disagree about the hero's state.

This is extremely difficult to diagnose because everything *looks* correct on the client (labels, particles, flight all work) while the server has a completely different state. The desync is invisible until you try to use a keybind-activated ability.

**Symptoms of desync:**
- Power labels show correctly but keybind actions don't fire (e.g., Tornado, grenade throw)
- Passive/visual effects work (flight, particles, menu access) but active abilities don't
- Powers that are force-toggled in the tick handler (e.g., shadowform, intangibility) still work because the tick handler overrides the desynced value every tick
- Everything works initially, then breaks after death/respawn (state resets differently on each side)
- Replacing `Math.random()` with deterministic math (e.g., `+1`) immediately fixes everything

**What we tried that DOESN'T work:**
- `Math.random()` in keybind callbacks — desync
- `Math.random()` in tick handlers — also desync (tick handler runs on both sides)
- Sentinel approach (keybind sets a flag, tick handler resolves with Math.random()) — desync because tick handler also runs on both sides
- `entity.world().isRemote` to detect server-side — not available / doesn't work in Fisk Heroes scripting
- Separate seed counter data var — desyncs on player death because reset timing differs between client and server
- `new java.util.Random()` — same problem, separate instances per side

**What DOES work:**
- Purely deterministic math: `(current + 1) % count` — both sides compute the same result
- Deterministic PRNG seeded from already-synced data vars — both sides read the same state, compute the same hash, get the same "random" result

**The golden rule:** If both client and server can compute the same result from the same inputs, it's safe. If either side could get a different result, it will desync.

Example synced PRNG (hash current game state as seed):
```javascript
function nextRandom(entity, current, count) {
    // Use already-synced data vars as entropy — both sides see the same values
    var s1 = entity.getData("mypack:dyn/slot1");
    var s2 = entity.getData("mypack:dyn/slot2");
    var s3 = entity.getData("mypack:dyn/slot3");
    var hash = ((s1 * 7 + s2 * 31 + s3 * 127 + current * 13) * 1103515245 + 12345) >> 8;
    var step = 1 + ((hash & 0x7FFF) % (count - 1));
    return (current + step) % count;
}
```

**Known limitation:** Since the hash depends only on current state, the same configuration always produces the same next value (can cause X→Y→X→Y loops). Acceptable trade-off for guaranteed sync.

### Java Byte Coercion

`entity.getData()` for BYTE vars returns a **Java Byte object**, not a JS number.

| Operation | Works? | Notes |
|-----------|--------|-------|
| `byte == 0` | Yes | `==` auto-coerces |
| `byte + 1` | Yes | Arithmetic coerces |
| `byte * 7` | Yes | Arithmetic coerces |
| `array[byte]` | **NO** | Returns `undefined`! Use `array[Number(byte)]` |
| `byte >= 4` | Yes | Comparison coerces |

### Other pitfalls:
- **Data var name collisions**: Never name a custom data var the same as a built-in modifier (e.g., `ground_smash`). It breaks that modifier for ALL heroes.
- **Night vision**: Requires a full game restart, not just `/fiskheroes reload`.
- **`isModifierEnabled` default**: Always return `true` for the `default` case, or ungated modifiers silently break.
- **`healing_factor` delay**: The `delay` field is ticks before healing STARTS after taking damage, not the interval between heals.

---

## 10. Built-in Modifiers Reference

Quick reference:

| Modifier | Type | Section |
|----------|------|---------|
| `fiskheroes:controlled_flight` | Flight | [Flight & Movement](#flight--movement) |
| `fiskheroes:super_speed` | Speed | [Flight & Movement](#flight--movement) |
| `fiskheroes:leaping` | Jump boost | [Flight & Movement](#flight--movement) |
| `fiskheroes:teleportation` | Teleport | [Flight & Movement](#flight--movement) |
| `fiskheroes:charged_beam` | Charge-then-fire beam | [Beams](#beams) |
| `fiskheroes:energy_projection` | Continuous beam | [Beams](#beams) |
| `fiskheroes:heat_vision` | Continuous beam (alt) | [Beams](#beams) |
| `fiskheroes:gravity_manipulation` | Gravity | [Combat](#combat) |
| `fiskheroes:ground_smash` | Ground slam | [Combat](#combat) |
| `fiskheroes:telekinesis` | TK grab | [Combat](#combat) |
| `fiskheroes:sonic_waves` | AoE damage | [Combat](#combat) |
| `fiskheroes:thorns` | Damage reflection | [Combat](#combat) |
| `fiskheroes:shield` | Block/forcefield | [Combat](#combat) |
| `fiskheroes:metal_skin` | Durability boost | [Defense & Passive](#defense--passive) |
| `fiskheroes:shadowform` | Flat shadow form | [Defense & Passive](#defense--passive) |
| `fiskheroes:intangibility` | Phase through blocks | [Defense & Passive](#defense--passive) |
| `fiskheroes:healing_factor` | Passive regen | [Defense & Passive](#defense--passive) |
| `fiskheroes:fire_immunity` | Fire immune | [Defense & Passive](#defense--passive) |
| `fiskheroes:projectile_immunity` | Arrow immune | [Defense & Passive](#defense--passive) |
| `fiskheroes:damage_immunity` | Type immune | [Defense & Passive](#defense--passive) |
| `fiskheroes:damage_resistance` | Type resist | [Defense & Passive](#defense--passive) |
| `fiskheroes:potion_immunity` | Potion immune | [Defense & Passive](#defense--passive) |
| `fiskheroes:slow_motion` | Time slow | [Utility](#utility) |
| `fiskheroes:arrow_catching` | Catch arrows | [Utility](#utility) |
| `fiskheroes:frost_walking` | Freeze water | [Utility](#utility) |
| `fiskheroes:equipment` | Utility belt | [Utility](#utility) |
| `fiskheroes:spellcasting` | Spell menu | [Utility](#utility) |
| `fiskheroes:cooldown` | Power cooldown | [Utility](#utility) |
| `fiskheroes:transformation` | Keybind toggle | [Utility](#utility) |

### Flight & Movement

#### `fiskheroes:controlled_flight`
Grants the hero flight. The most parameter-rich modifier.

```json
"fiskheroes:controlled_flight": {
    "speed": 0.1,                    // Base flight speed
    "boostSpeed": 0.22,              // Speed while sprinting in air
    "canBoost": true,                // Enable sprint-boost
    "barrelRoll": {                  // Optional — omit entirely to disable
        "duration": 10,              // Roll animation ticks
        "speed": 0.16,               // Speed during roll
        "drag": 0.04                 // Drag coefficient
    },
    "diveSpeedRetention": 0.6,       // How much dive momentum is kept (0-1)
    "collision": {
        "blocks": {
            "stopFlying": false,     // Stop on block impact - doesn't seem to do anything?
            "takeDamage": false      // Take damage from block impact
        },
        "entities": {
            "stopFlying": false,     // Stop on entity impact
            "dealDamage": true       // Damage entities on impact
        }
    },
    "knockback": 0.6,               // Knockback dealt on entity collision
    "soundEvents": {
        "ENABLE": ["fiskheroes:flight_loop", "fiskheroes:flight_cape_loop"],
        "BOOST": "fiskheroes:flight_boost",
        "IMPACT_ENTITY": "fiskheroes:flight_impact_entity",
        "ROLL": "fiskheroes:iron_man_flight_roll"
    }
}
```

**Notes:**
- `stopFlying: false` + `takeDamage: false` on blocks means the hero doesn't stop or take damage on block collision. Exact behavior unclear — they don't literally phase through blocks.
- `ENABLE` sound can be an array for layered sounds (e.g. engine hum + cape flap).
- Use pipe variant `|boosted` for a second flight profile activated by `super_boost` (energy form, transformed state, etc.). The hero JS uses `falcon_base.init(hero, super_boost, keySlot, speed, tickFunc)` to wire this up.
- Typical speed ranges: 0.07-0.15 normal, 0.18-0.38 boosted. Legend is the fastest at 0.14/0.38.

#### `fiskheroes:super_speed`
Speedster movement. Requires JavaScript setup to function.

```json
"fiskheroes:super_speed": {
    "canUseTreadmill": false,
    "canUseTachyons": false
}
```

**Required JS setup:**
```javascript
var speedster_base = implement("fiskheroes:external/speedster_base");
// In tick handler:
speedster_base.tick(entity, manager);
// In init:
hero.addAttribute("BASE_SPEED_LEVELS", 3.0, 0);
```

Without `speedster_base.tick()` in the tick handler, super speed will not work at all. `canUseTreadmill` and `canUseTachyons` are feature gates for Flash-specific interactables.

#### `fiskheroes:leaping`
Passive jump boost. **Only fires while sprinting** — will not activate from a standing jump.

```json
"fiskheroes:leaping": {
    "leapAmount": [1.0, 0.5]    // [vertical, horizontal]
}
```

#### `fiskheroes:teleportation`
Instant teleport to a looked-at position.

```json
"fiskheroes:teleportation": {
    "canReachMoon": true,
    "range": 4096.0,
    "soundEvents": {
        "TELEPORT": "fiskheroes:breach"
    }
}
```

**Notes:**
- Legend gates this on `isBoosting` (energy form) via `isModifierEnabled`.
- Teleporting while flying will end flight. Workaround: watch `fiskheroes:teleport_delay` in tick handler and re-enable flight after it reaches 0. Legend does this:
  ```javascript
  var teleportDelay = entity.getData("fiskheroes:teleport_delay");
  if (teleportDelay > 0) {
      wasTeleporting = true;
  } else if (wasTeleporting) {
      wasTeleporting = false;
      if (!entity.getData("fiskheroes:flying")) {
          manager.setData(entity, "fiskheroes:flying", true);
      }
  }
  ```
- "canReachMoon": true allows you to teleport to the Moon when looking at it.

### Beams

Three beam modifiers exist with different firing behaviors:

| Modifier | Behavior | Has charge? | Has duration? | Has cooldown? |
|----------|----------|-------------|---------------|---------------|
| `charged_beam` | Charge up, fire burst | Yes | Yes | Yes |
| `energy_projection` | Continuous while held | No | No | No |
| `heat_vision` | Continuous while held | No | No | No |

`energy_projection` and `heat_vision` have the same firing behavior but different default visuals and sound event names.

#### `fiskheroes:charged_beam`
Charge-then-fire beam with a fixed duration burst.

```json
"fiskheroes:charged_beam": {
    "damageProfile": {
        "damage": 5.0,
        "types": { "BLUNT": 1.0 },
        "properties": { "ADD_KNOCKBACK": 5.0 }
    },
    "chargeTime": 5,            // Ticks to charge before firing
    "duration": 40,              // How long the beam fires (ticks)
    "cooldownTime": 10,          // Ticks before you can fire again
    "range": 48.0,               // Maximum beam distance
    "radius": 0.3,               // Beam width — THIS CONTROLS AOE
    "canDoGriefing": false,      // Turn sand blocks to glass
    "soundEvents": {
        "CHARGE": "sound",
        "SHOOT": "sound",
        "SHOOT_STOP": "sound",
        "BEAM_AMBIENT": "sound"
    }
}
```

**Notes:**
- `radius` is the key parameter for beam feel. 0.3 = laser-thin, 4.0 = wide spray, 8.0 = fat AoE cone, 16.0 = shockwave.
- Alexandria's "Two-Handed Blow" uses radius=16 + duration=15 for a thunderclap shockwave, not a visible beam.
- Use pipe variants for multiple beam types. Legend has 20 variants (`|basic_heat`, `|aoe_cold`, `|swarm_disintegration`, etc.) selected by `modifier.id()` in `isModifierEnabled`.

#### `fiskheroes:energy_projection`
Continuous beam — fires as long as the keybind is held.

```json
"fiskheroes:energy_projection": {
    "damageProfile": {
        "damage": 16.0,
        "types": { "ENERGY": 1.0 },
        "properties": { "COOK_ENTITY": false, "HEAT_TRANSFER": 0 }
    },
    "range": 30.0,
    "radius": 0.3,
    "canDoGriefing": false // Can you turn sand blocks to glass
}
```

**Notes:**
- No charge, duration, or cooldown — fires instantly and continuously.
- Used for Legend's staccato mode and Eidolon's Lightning Storm.

#### `fiskheroes:heat_vision`
Continuous beam, same firing behavior as energy_projection but with different visual defaults.

```json
"fiskheroes:heat_vision": {
    "damageProfile": {
        "damage": 15.0,
        "types": { "ENERGY": 1.0 },
        "properties": { "COOK_ENTITY": true, "HEAT_TRANSFER": 15 }
    },
    "range": 32.0,
    "radius": 0.1,
    "canDoGriefing": false,
    "soundEvents": {
        "BEAM_AMBIENT": "fiskheroes:heat_vision"
    }
}
```

**Notes:**
- Default visual is twin eye beams (configured in renderer via `bindBeam`).
- Legend uses pipe variants (`|bombardment_heat`, etc.) for bombardment visual effects alongside ground_smash.
- Eidolon gates on charge level: `return s1 == 1 && entity.getData("worm:dyn/eidolon_charge") > 0.1`.
- Check `entity.getData("fiskheroes:heat_vision")` (boolean) or `entity.getData("fiskheroes:beam_shooting")` (>0) to detect active firing.

### Combat

#### `fiskheroes:gravity_manipulation`
Pull/push entities with gravity control. Lower gravity = higher jump, slower, fall, etc. High gravity may pull nearby flying players to the ground.

```json
"fiskheroes:gravity_manipulation": {
    "affectsUser": true,         // Apply gravity to self too
    "minGravity": 0.1,           // Minimum gravity multiplier
    "maxGravity": 6.0,           // Maximum gravity multiplier
    "range": 50.0,               // Distance to affect entities
    "radius": 12.0               // Radius of gravity field
}
```

**Notes:**
- Negative gravity values are used in some packs (e.g. spider web swingers at -0.45) — likely means reduced/reversed gravity but untested.
- `minGravity == maxGravity` creates a fixed gravity level (no scroll adjustment).
- `range: 0` affects only the user.
- Use `REACH_DISTANCE` attribute profile to extend activation range (Eidolon uses 50.0).
- HUD dial: add `{"type":"DIAL","color":"fiskheroes:gravity_manipulation","data":"fiskheroes:gravity_amount","condition":"fiskheroes:gravity_manip"}` to powers JSON `hud` array.
- Check `entity.getData("fiskheroes:gravity_manip")` to detect when active.

#### `fiskheroes:ground_smash`
AoE ground slam. The only modifier that can break blocks.

```json
"fiskheroes:ground_smash": {
    "damageProfile": {
        "damage": 16.0,
        "types": { "BLUNT": 1.0 }
    },
    "radius": 6.0,              // Blast radius
    "knockback": 2.0,           // Knockback strength
    "cooldownTime": 30,          // Ticks before reuse
    "canDoGriefing": true        // Break blocks on impact
}
```

**Notes:**
- Use pipe variants for different damage types (Legend has 5 bombardment variants).
- Can extend range with `REACH_DISTANCE` attribute profile — Eidolon adds 50.0, Legend adds 40.0 for ranged bombardment. Note that this is *extending your reach*, allowing for mining etc. Gate the attribute profile on keybind held + empty hand to avoid permanent extended reach, using items at range, etc.

#### `fiskheroes:telekinesis`
Grab and throw entities/items.

```json
"fiskheroes:telekinesis": {
    "telekinesis": {
        "crushMelons": false,        // Squeeze watermelons
        "crushThrowables": false,    // Crush throwable items
        "squeezeChickens": false,    // Harm chickens specifically
        "explodeCreepers": false,    // Detonate creepers
        "destroyInanimates": false   // Destroy boats, minecarts, etc.
    },
    "canGrab": {
        "mobs": true,               // Grab living entities
        "items": true,              // Grab dropped items
        "projectiles": true,        // Grab arrows mid-flight
        "inanimates": true          // Grab boats, minecarts
    },
    "range": 16.0
}
```

**Notes:**
- The 5 `telekinesis` flags are easter-egg interactions — mostly cosmetic/fun.
- `canGrab` options are independent from the telekinesis actions.
- Used for Eidolon's Tornado (Aerokinesis) — pair with `sonic_waves` for wind damage.

#### `fiskheroes:sonic_waves`
Beam of sonic-wave rings.

```json
"fiskheroes:sonic_waves": {
    "damageProfile": {
        "damage": 6.0,
        "types": { "BLUNT": 0.5, "SOUND": 0.5 }
    },
    "knockback": 0.04
}
```

**Notes:**
- Used for Eidolon's Aerokinesis alongside telekinesis for tornado + wind damage.

#### `fiskheroes:thorns`
Reflects incoming damage back at the attacker. **Note:** This only reflects damage — it does NOT proactively damage nearby entities. For passive contact damage auras (hurting nearby mobs on tick), use `getEntitiesInRangeOf` + `hurtByAttacker` in a tick handler (see Eidolon's Energy Form for a working example).

```json
"fiskheroes:thorns": {
    "damageProfile": {
        "types": { "ENERGY": 1.0 }
    },
    "factor": 0.5               // Fraction of damage reflected (0.5 = 50%)
}
```

#### `fiskheroes:shield`
Directional or omnidirectional damage shield.

```json
"fiskheroes:shield": {
    "shield": {
        "health": 400.0,            // Shield HP
        "regeneration": 10.0,       // HP recovered per tick
        "recoveryDelay": 60,        // Ticks after damage before regen starts
        "cooldown": 200             // Ticks after shield breaks before reactivation
    },
    "coverage": {
        "yawRadius": 180.0,         // Horizontal coverage (degrees)
        "pitchRadius": 180.0,       // Vertical coverage (degrees)
        "yawOffset": 0.0,           // Horizontal offset
        "pitchOffset": 0.0          // Vertical offset
    },
    "knockback": 0.5,
    "isToggle": false,               // true = toggle on/off, false = hold to block
    "soundEvents": {
        "BLOCK_START": "fiskheroes:anti_forcefield",
        "DEFLECT": "fiskheroes:anti_forcefield_deflect"
    }
}
```

**Notes:**
- `coverage` 180/180 = omnidirectional bubble (Eidolon's Forcefield). 60/35 = frontal shield.
- Check `entity.getData("fiskheroes:shield_blocking_timer")` > 0 in tick handler to detect active blocking. Eidolon uses this to deal continuous damage while the Bubble is up.

### Defense & Passive

#### `fiskheroes:metal_skin`
Grants durability boost. No parameters.

```json
"fiskheroes:metal_skin": {}
```

Visual is NOT literal metal skin despite the name — it just adds damage reduction.

#### `fiskheroes:shadowform`
Makes the entity appear flat/shadowy.

```json
"fiskheroes:shadowform": {
    "soundEvents": {
        "ENABLE": ["fiskheroes:shadowform_enable", "fiskheroes:shadowform_loop"],
        "DISABLE": "fiskheroes:shadowform_disable"
    }
}
```

**Notes:**
- Must be accompanied by particles, cloud, or similar for visuals; otherwise you're invisible.
- Will shrink the visual of a forcefield bubble while active.
- No config params beyond sounds. The visual effect is built-in.
- Force-toggle in tick handler: `manager.setData(entity, "fiskheroes:shadowform", true/false)`.
- Eidolon uses this for Energy Form visual — force-enabled when slot 3 == Energy Form.

#### `fiskheroes:intangibility`
Phase through blocks and entities.

```json
"fiskheroes:intangibility": {
    "isAbsolute": false,         // true = phase through everything, false = partial
    "soundEvents": {
        "ENABLE": "fiskheroes:vision_intang_on",
        "DISABLE": "fiskheroes:vision_intang_off"
    }
}
```

**Notes:**
- Force-toggle in tick handler: `manager.setData(entity, "fiskheroes:intangible", true/false)`.
- **Must force flight on** when intangible — otherwise the player falls through the world endlessly. Eidolon does: `manager.setData(entity, "fiskheroes:flying", true)` every tick while intangible.

#### `fiskheroes:healing_factor`
Passive health regeneration regardless of hunger level.

```json
"fiskheroes:healing_factor": {
    "delay": 180                 // Ticks AFTER damage before healing starts
}
```

**Notes:**
- `delay` is how long after taking damage before regeneration kicks in — NOT the interval between heals. Once active, it heals every tick.
- Use pipe variants for different healing speeds: Eidolon has `|energy_form` (delay=180, slow) and `|flicker_regen` (delay=20, fast).
- Distinguish variants in `isModifierEnabled` using `modifier.id()`:
  ```javascript
  case "fiskheroes:healing_factor":
      return s3 == 1 ? modifier.id() == "energy_form"
           : s3 == 4 ? modifier.id() == "flicker_regen"
           : false;
  ```

#### `fiskheroes:fire_immunity`
Full fire and lava immunity. No parameters.

#### `fiskheroes:projectile_immunity`
Arrows and projectiles bounce off the hero. No parameters.

#### `fiskheroes:damage_immunity`
Immunity to a specific damage type.

```json
"fiskheroes:damage_immunity|explosion": {
    "damageType": "EXPLOSION"
}
```

Use pipe variants for multiple immunities. Alexandria has 8 variants covering BULLET, COLD, EXPLOSION, FIRE, BLUNT, SHARP, ENERGY, ELECTRICITY.

#### `fiskheroes:damage_resistance`
Partial damage reduction for a specific type.

```json
"fiskheroes:damage_resistance|energy": {
    "damageType": "ENERGY",
    "factor": 0.75              // 0.0 = full immunity, 1.0 = no reduction
}
```

#### `fiskheroes:potion_immunity`
Immunity to specific potion effects.

```json
"fiskheroes:potion_immunity": {
    "potionEffects": ["minecraft:nausea", "minecraft:poison", "minecraft:wither"]
}
```

### Utility

#### `fiskheroes:slow_motion`
Slows time around the user. No parameters.

```json
"fiskheroes:slow_motion": {}
```

**Notes:**
- Eidolon syncs super speed state with slow motion in the tick handler — when slow_motion toggles on, force speeding on too, and vice versa.

#### `fiskheroes:arrow_catching`
Catch arrows mid-flight. No parameters.

```json
"fiskheroes:arrow_catching": {}
```

Often gated on slow_motion being active: `return entity.getData("fiskheroes:slow_motion")`.

#### `fiskheroes:frost_walking`
Freezes water blocks around the player.

```json
"fiskheroes:frost_walking": {
    "radius": 4
}
```

#### `fiskheroes:equipment`
Gadget radial menu (utility belt). Configure available items and their properties.

```json
"fiskheroes:equipment": {
    "equipment": {
        "fiskheroes:grenade": {
            "cooldown": 1,               // Uses before recharge
            "uses": 1,                   // Throws per recharge
            "damageProfile": { "damage": 30.0, "types": { "EXPLOSION": 1.0 } },
            "isInstant": false,          // Detonate on impact vs after fuse
            "affectsUser": false,        // Damage the thrower
            "fuseTime": 30,              // Ticks before explosion
            "radius": 10.0              // Blast radius
        },
        "fiskheroes:freeze_grenade": {
            "cooldown": 1, "uses": 1,
            "damageProfile": { "damage": 24.0, "types": { "COLD": 0.5, "EXPLOSION": 0.6 } }
        },
        "fiskheroes:smoke_pellet": {
            "cooldown": 1, "uses": 1     // No damage — utility only
        },
        "fiskheroes:batarang": {
            "cooldown": 13, "uses": 3,
            "damageProfile": { ... },
            "properties": { "DAMAGE_DROPOFF": 0.6 }
        },
        "fiskheroes:throwing_star": {
            "cooldown": 15, "uses": 3,
            "damageProfile": { "damage": 4.0, "types": { "SHURIKEN": 1.0 } },
            "properties": { "DAMAGE_DROPOFF": 0.6 }
        }
    },
    "soundEvents": { "SWITCH": "fiskheroes:utility_belt_switch" }
}
```

Requires `hero.addKeyBind("UTILITY_BELT", "Gadgets", keySlot)` in hero JS.

#### `fiskheroes:spellcasting`
Spell menu with directional input sequences.

```json
"fiskheroes:spellcasting": {
    "spells": {
        "fiskheroes:duplication": {
            "sequence": "",              // WASD key sequence (empty = instant)
            "cooldown": 1,
            "quantity": 5                // Number of duplicates
        },
        "fiskheroes:blindness": {
            "sequence": "",
            "cooldown": 1,
            "duration": 400,             // Effect duration in ticks
            "range": 24.0
        },
        "fiskheroes:whip": {
            "sequence": "wssds",         // W/A/S/D/X key combo
            "cooldown": 50,
            "damageProfile": { ... }
        }
    }
}
```

Requires `hero.addKeyBind("SPELL_MENU", "key.illusionMenu", keySlot)`. Eidolon uses duplication + blindness for Illusions.

**Duplication limitations:**
- Clones use the player's model/skin — cannot be reskinned to look different
- Clones do NOT inherit particle effects from the hero
- On despawn, clones play a hologram-esque colour-smear dissolve effect (not customisable)
- Still useful for decoy/distraction mechanics despite visual limitations

#### `fiskheroes:cooldown`
Ties a toggle data var to a cooldown timer — automatically manages charge/discharge.

```json
"fiskheroes:cooldown|eidolon_absorb": {
    "cooldown": {
        "toggleData": "worm:dyn/eidolon_absorb",    // What triggers the cooldown
        "cooldownData": "worm:dyn/eidolon_charge",   // The timer var (FLOAT_INTERP)
        "duration": 400,                              // Cooldown length in ticks
        "recovery": 0                                 // Regen rate (0 = no passive regen)
    }
}
```

**Notes:**
- When `toggleData` is true, `cooldownData` charges up. When false, it drains (at `recovery` rate, 0 = instant drain).
- Eidolon uses this for Energy Absorption — damage sets the toggle, charge builds up, then drains while firing heat vision.

#### `fiskheroes:transformation`
Binds a keybind to a data var toggle with an animation timer.

```json
"fiskheroes:transformation|kick": {
    "key": "ROUNDHOUSEKICK",            // Keybind name that triggers this
    "transformation": {
        "toggleData": "worm:dyn/kick",          // Boolean toggle var
        "timerData": "worm:dyn/kick_timer",     // FLOAT_INTERP timer (0→1)
        "time": 12                               // Duration in ticks
    }
}
```

**Notes:**
- When the keybind is pressed, `toggleData` becomes true and `timerData` interpolates 0→1 over `time` ticks, then `toggleData` resets to false.
- Use `isToggle: false` (default) for one-shot animations, or `isToggle: true` for hold-to-maintain.
- Alexandria uses this for her kick animation. Legend uses `isToggle: false` for bombardment held state.
- Read `timerData` in renderer for animation progress, or in tick handler to trigger effects at specific points in the animation.

### Other Modifiers (not used by us, but worth knowing)

#### `fiskheroes:icicles`
Throws icicle projectiles.

```json
"fiskheroes:icicles": {
    "damageProfile": {
        "damage": 4.0,
        "types": { "SHARP": 1.0, "COLD": 0.5 }
    }
}
```

#### `fiskheroes:regeneration`
Increases the player's **natural** hunger-based regeneration rate. NOT the same as `healing_factor` — this only works when the hunger bar is full enough for vanilla regen to kick in, then multiplies it.

```json
"fiskheroes:regeneration": {
    "factor": 4          // Multiplier on natural regen speed
}
```

Easily confused with `healing_factor`, which heals regardless of hunger. If you want "always regenerating" use `healing_factor`. If you want "heals faster when well-fed" use `regeneration`.

#### `fiskheroes:water_breathing`
Breathe underwater. No parameters. Alternative to `hasProperty` returning true for `"BREATHE_WATER"`.

#### `fiskheroes:night_vision`
Built-in night vision modifier. We use `hasProperty` with `"NIGHT_VISION"` instead (see Legend), but this exists as a modifier too.

**Tinted/coloured vision overlays** — Night vision itself has no colour options, but you can fake coloured vision using first-person-only forcefields. Bind a `fiskheroes:forcefield`, set its colour, and toggle opacity based on `isFirstPersonArm`:

```javascript
// Daredevil (hells-kitchen pack) — red-tinted FP vision:
var blind = renderer.bindProperty("fiskheroes:forcefield");
blind.color.set(0x5a1a1a);
blind.setShape(4, 8).setScale(0.6, 0.5, 0.6);

// In render():
blind.opacity = Number(isFirstPersonArm);  // visible only in first person
```

```javascript
// Wildmutt (tmf pack) — multi-layer pulsing sonar vision:
var ff1 = renderer.bindProperty("fiskheroes:forcefield");
ff1.color.set(0xBF7167);
ff1.setShape(20, 10).setOffset(0.0, 6.0, 0.0);

// In render():
if (isFirstPersonArm) {
    ff1.opacity = 0.5 + 0.2 * Math.sin(Math.PI * entity.loop(20));
} else {
    ff1.opacity = 0;
}
```

Multiple forcefields with different colours, scales, and pulse rates can create complex vision effects (thermal, sonar, etc.).

#### `fiskheroes:invisibility`
Turn invisible. No parameters. Visual handled by the mod.

#### `fiskheroes:gliding`
Elytra-style gliding + cape. Used by Batman-type characters.

#### `fiskheroes:wall_crawling`
Climb walls. Used by Spider-Man characters.

#### `fiskheroes:web_swinging`
Grapple/swing locomotion. Spider-Man web swinging.

#### `fiskheroes:blade`
Retractable melee weapon (claws, sword). Used by Wolverine, Black Panther.

#### `fiskheroes:charged_punch`
Charge-up melee attack.

#### `fiskheroes:cryo_charge`
Cold/ice charged attack. Used by Killer Frost, Captain Cold.

#### `fiskheroes:flame_blast`
Fire projectile. Can have `canDoGriefing`.

#### `fiskheroes:shadowdome`
Darkness sphere around the player. Perfect for Grue.

#### `fiskheroes:shape_shifting`
Disguise as another hero.

#### `fiskheroes:size_manipulation`
Grow/shrink (Ant-Man/Giant-Man style).

#### `fiskheroes:speed_disintegration`
Speed-based phasing/disintegration. Speedster-specific.

#### `fiskheroes:tentacles`
Doc Ock arms / tentacle appendages.

#### `fiskheroes:damage_weakness`
Vulnerability to specific damage types. Opposite of damage_resistance.

#### `fiskheroes:eternium_weakness` / `fiskheroes:fire_weakness`
Specific material/element vulnerabilities.

#### `fiskheroes:damage_bonus`
Passive damage increase.

#### `fiskheroes:energy_manipulation`
Chargable blast. Used for Hawkman, Gambit etc. in some heropacks for a short-range energy attack (though the range can be defined like any blast attack), gated behind the iconic weapon they channel energy through.

#### `fiskheroes:archery`
Bow/arrow combat system.

#### `fiskheroes:sentry_mode`
Deploys your costume as an independent AI entity (`EntityIronMan`) that targets hostile mobs and follows its owner. Right-click the sentry to re-enter the suit. Sneak+right-click toggles sentry flight.

**Setup**: Add modifier to powers JSON + `hero.addKeyBind("SENTRY_MODE", "key.sentryMode", N)` in hero JS. Optional `soundEvents` with `"OPEN"`/`"CLOSE"` keys.

**AI internals** (decompiled from mod source):
- **Ranged AI** (priority 2, 30-block engagement range): Calls `InteractionRepulsor.shoot()` which **requires `fiskheroes:repulsor_blast`** modifier. Without it, the sentry aims but fires blanks. This is the primary intended attack path — every official sentry-mode hero (Iron Man, War Machine, Steel, etc.) includes `repulsor_blast`.
- **Melee AI** (priority 3): `EntityAIAttackOnCollide` — walks up and punches. However, it shares mutex bits with the ranged AI, so it **never runs** while the ranged AI is active (which is always during combat).
- **`fiskheroes:aiming`** data var: Set automatically when the sentry has a target, regardless of whether `repulsor_blast` exists.
- **`fiskheroes:flame_blast`** is the only other modifier that works on sentries — it auto-fires via its `onUpdate` tick when `AIMING` is true. Other attack modifiers (heat_vision, energy_projection, sonic_waves) need keybind toggles that sentries can't press.

**Custom sentry melee workaround** (for non-Iron-Man heroes):
JS tick handlers DO run on sentry entities. You can detect `entity.getData("fiskheroes:aiming")` in the tick handler, use `entity.world().getEntitiesInRangeOf()` to find nearby enemies, and deal damage via `target.hurtByAttacker(heroRef, profileName, deathMsg, damage, entity)`. Pair with a custom `.fsk` punch animation driven by a data var. Note: `entity.getHero()` doesn't exist on the sentry entity — capture `heroRef` from the `init()` closure instead. FLOAT_INTERP auto-management doesn't work on sentry entities — you must manually drive the timer with `manager.incrementData(entity, timerVar, duration, condition)` in the tick handler.

**Suppressing the aiming pose**: The default `basic.AIMING` animation (registered in `hero_basic.js`) locks the right arm to point at the target using `@` (absolute set) in `fiskheroes:aiming.fsk`. This can't be overridden by priority alone. To suppress it, re-register the animation with the same key after `parent.initAnimations(renderer)`:
```javascript
addAnimationWithData(renderer, "basic.AIMING", "fiskheroes:aiming", "fiskheroes:aiming_timer")
    .setCondition(function (entity) { return false; });
addAnimationWithData(renderer, "basic.DUAL_AIMING", "fiskheroes:dual_aiming", "fiskheroes:aiming_timer")
    .setCondition(function (entity) { return false; });
```
`addCustomAnimation` replaces by key, so re-registering with a false condition effectively disables the animation. Useful for any hero that doesn't use guns/repulsors.

**Pathing limitation**: The ranged AI's 30-block engagement range is hardcoded. The sentry stops pathfinding once within 30 blocks with line-of-sight for 20+ ticks, even if the actual attack range is shorter. The sentry won't actively close to melee range — it relies on enemies approaching or the owner being nearby (follow-owner AI runs between combats).

#### `fiskheroes:hover`
Stationary hovering (not full flight).

#### `fiskheroes:flight`
Simple upward flight (not the full `controlled_flight` system).

#### `fiskheroes:propelled_flight`
Jetpack-style flight.

#### `fiskheroes:fire_resistance`
Partial fire resistance (not full immunity).

#### `fiskheroes:potion_retention`
Keep potion effects longer.

There are **57 modifier types** total in FiskHeroes 2.4.0. These are all hardcoded in Java — hero packs can configure and compose them but cannot create new modifier types.

### Damage Profiles

The `damageProfile` object appears in most combat modifiers. Structure:

```json
"damageProfile": {
    "damage": 15.0,
    "types": {
        "BLUNT": 0.5,           // Damage type weights (should sum to ~1.0)
        "ENERGY": 0.5
    },
    "properties": {
        "ADD_KNOCKBACK": 3.0,       // Extra knockback
        "REDUCE_KNOCKBACK": 0.9,    // Knockback reduction factor
        "HIT_COOLDOWN": 20,         // Min ticks between repeated hits
        "COOK_ENTITY": true,        // Set target on fire visually
        "HEAT_TRANSFER": 15,        // Heat amount applied
        "IGNITE": 3,                // Fire duration in seconds
        "DAMAGE_DROPOFF": 0.6,      // Damage reduction per block distance
        "EFFECTS": [{               // Apply potion effects
            "id": "minecraft:slowness",
            "duration": 300,
            "amplifier": 8,
            "chance": 1
        }]
    }
}
```

**Built-in damage types** (hardcoded in Java, always available):
BLUNT, SHARP, ENERGY, EXPLOSION, FIRE, COLD, BULLET, ELECTRICITY, SOUND, HEAT_VISION, COSMIC, CACTUS, MAGIC, SHURIKEN, THORNS.

#### Custom Damage Types

Heropacks can register custom damage types in `heropack.json` (added v2.1.0). **Using an unregistered damage type will crash the game.**

Register them in your `heropack.json`:
```json
"damageTypes": {
    "KRYPTONITE": "Kryptonite",
    "VENOM": "Venom Damage"
}
```

The key is the internal name (used in `damageProfile.types` and `damage_immunity`/`damage_resistance`/`damage_weakness`), the value is the display name (or a lang key like `"damage_type.force.name"`).

Once registered, use them anywhere you'd use a built-in type:
```json
"fiskheroes:damage_immunity|kryptonite": { "damageType": "KRYPTONITE" },
"fiskheroes:charged_beam": {
    "damageProfile": {
        "damage": 10.0,
        "types": { "KRYPTONITE": 1.0 }
    }
}
```

This enables custom vulnerability/resistance systems — e.g., one hero deals KRYPTONITE damage, another is weak to it.

**Complete catalog of custom damage types across 16 reference packs** (54 types total, surveyed March 2026):

**Generic / Setting-Independent** — usable in any superhero context:

| Type | Label | Packs | Notes |
|------|-------|-------|-------|
| TELEPATIC | Telepathy | 3 | De facto standard spelling (dcuniverse, Miscellaneous, tgheroes) |
| TELEPATHIC | Telepathic | 1 | Correct spelling, incompatible with above (sh-heropack) |
| LIGHTNING | Lightning | 3 | Distinct from built-in ELECTRICITY (dcuniverse, GoW3, tgheroes) |
| LIGHT | Light | 2 | Light/radiant damage (sh-heropack, tmf) |
| ACID | Acid Damage | 1 | (tmf) |
| WATER | Water | 1 | (DERPZ) |
| WIND | Wind | 1 | (supermanandlois) |
| HEAT | Heat | 1 | (supermanandlois) |
| INSTANT_DEATH | Instant Death | 1 | Lady Death's 10,000-damage touch-kill (DMH) |

**Near-duplicates of built-ins** — packs create these to distinguish thematic variants:

| Type | Label | Packs | vs Built-in | Usage |
|------|-------|-------|-------------|-------|
| EXPLODE | Explode | 2 | EXPLOSION | Energy/projectile explosions vs impact ground slams (dcuniverse, tgheroes) |
| FLAME | Flame | 2 | FIRE | Thematic fire attacks, e.g. Azrael's ignite sword (dcuniverse, tgheroes) |
| SCREAM | Scream | 2 | SOUND | Black Canary's sonic cry with debuffs (dcuniverse, tgheroes) |
| SOUND_BLAST | Sound | 1 | SOUND | Focused sonic attack; lower weakness multiplier than SOUND on symbiotes (jmcthp) |
| SHOCKWAVEM | Shockwave | 1 | SOUND | Maestro's thunderclap. The M is probably for Maestro, not a typo (DMH) |
| WITHER | Wither | 1 | (potion effect) | Decay/wither as a damage type rather than potion (tgheroes) |

**DC Universe**:

| Type | Label | Packs | Notes |
|------|-------|-------|-------|
| KRYPTONITE | Kryptonite | **9** | Most shared type in the ecosystem |
| BLUE_KRYPTONITE | Blue Kryptonite | 2 | (jmcthp, supermanandlois) |
| XKRYPTONITE | X-Kryptonite | 1 | (supermanandlois) |
| SOLAR | Solar Blast | 1 | (supermanandlois) |
| REDSOLAR | Red Solar Blast | 1 | (supermanandlois) |
| SUPERCHARGED | Super Solar Charged | 1 | (supermanandlois) |
| OMEGA | Omega Beams | 1 | Darkseid's eye beams (jmcthp) |

**Marvel**:

| Type | Label | Packs | Notes |
|------|-------|-------|-------|
| ADAMANTIUM | Adamantium | 3 | Wolverine's claws etc. (Sabri, sh-heropack, tgheroes) |
| VIBRANIUM | Vibranium | 2 | Black Panther etc. (Miscellaneous, tgheroes). Possibly unused? |
| BONE | Bone | 1 | Rogue's bone claws, X-Men (tgheroes) |
| ROGUE | Rogue | 1 | Rogue's life-drain punch; she's immune to it (tgheroes) |
| CHAOS | Chaos | 1 | Scarlet Witch? (sh-heropack) |
| VOID | The Void | 1 | Sentry's dark side; he's immune to it |

**Norse / God of War** (GoW 2.0 and 3.0 are the same franchise):

| Type | Label | Packs | Notes |
|------|-------|-------|-------|
| BIFROST | Bifrost | 2 | Rainbow bridge energy |
| PRIMORDIAL | Primordial | 2 | Ancient/primeval damage |
| GALE | Gale | 2 | Wind magic |
| JORMUNGANDR_VENOM | Eitr | 2 | World Serpent poison |
| CHAOS_FLAMES | Chaos Flames | 1 | Blades of Chaos |
| LEVIATHAN_ICE | Leviathan Ice | 1 | Leviathan Axe |
| SPARTAN_RAGE | Spartan Rage | 1 | Kratos's rage mode |
| THUNDERWAVE | Thunderwave | 1 | Thor's lightning |
| GIANT_MAGIC | Giant Magic | 1 | Jotunheim magic |
| DWARF_MAGIC | Dwarf Magic | 1 | Brok/Sindri crafting |
| ASGARD_MAGIC | Asgard Magic | 1 | Asgardian sorcery |
| ASGARD_FLAMES | Asgard Flames | 1 | Asgardian fire |

**Supernatural / Religious** (DMH):

| Type | Label | Packs | Notes |
|------|-------|-------|-------|
| GOD | Godly Powers | 1 | |
| ANGEL | Angelic Powers | 1 | |
| ARCHANGEL | Archangelic Powers | 1 | |
| DEMON | Demonic Powers | 1 | |
| THE_COLT | The Colt | 1 | Supernatural TV show weapon; demons are weak to it |
| DIVINEMAGIC | Divinemagic | 1 | (sh-heropack) |

**Anime — Jujutsu Kaisen** (jjkp):

| Type | Label | Packs | Notes |
|------|-------|-------|-------|
| POSITIVE | Positive Energy | 1 | |
| CURSED | Cursed Energy | 1 | |
| CANCEL | Technique Canceling | 1 | |

**Star Wars** (StarWarsHeroPack):

| Type | Label | Packs | Notes |
|------|-------|-------|-------|
| FORCE | The Force | 1 | Unused |

**Other**:

| Type | Label | Packs | Notes |
|------|-------|-------|-------|
| COCAINE | Cocaine | 1 | Snowflame's cocaine-fueled punch damage (supermanandlois) |
| CANCER | Cancer | 1 | Weakness type — no hero deals it, but one is vulnerable (supermanandlois) |

**Cross-compatibility note**: Registering a custom type that another loaded pack also registers is safe — both packs share the type. This lets your heroes' immunities work against other packs' attacks. The most impactful types to register for compatibility are KRYPTONITE (9 packs), TELEPATIC (3), LIGHTNING (3), ADAMANTIUM (3), and the built-in near-duplicates.

#### Potion Effects via Damage Profiles

Any modifier with a `damageProfile` can apply potion effects on hit:

```json
"properties": {
    "EFFECTS": [{
        "id": "minecraft:slowness",
        "duration": 300,        // Ticks (20 = 1 second)
        "amplifier": 8,         // Level minus 1 (8 = Slowness IX)
        "chance": 1             // 0.0-1.0 probability per hit
    }]
}
```

Multiple effects can be stacked in the array. Legend's cold beams use this for Slowness IX.

**All Minecraft 1.7.10 potion IDs:**

| ID | Effect | Notes |
|----|--------|-------|
| `minecraft:speed` | Speed boost | Movement speed |
| `minecraft:slowness` | Slow | Legend's ice beams use amplifier 8 |
| `minecraft:haste` | Fast mining/attack | |
| `minecraft:mining_fatigue` | Slow mining/attack | Could simulate power dampening |
| `minecraft:strength` | Melee damage boost | |
| `minecraft:instant_health` | Immediate HP restore | |
| `minecraft:instant_damage` | Immediate HP loss | |
| `minecraft:jump_boost` | Higher jumps | |
| `minecraft:nausea` | Screen wobble | |
| `minecraft:regeneration` | HP over time | |
| `minecraft:resistance` | Damage reduction | |
| `minecraft:fire_resistance` | Fire/lava immunity | |
| `minecraft:water_breathing` | No drowning | |
| `minecraft:invisibility` | Transparent | |
| `minecraft:blindness` | Reduced vision | |
| `minecraft:night_vision` | Full brightness | |
| `minecraft:hunger` | Food drains faster | |
| `minecraft:weakness` | Reduced melee damage | |
| `minecraft:poison` | DoT, can't kill (stops at 1 HP) | **BROKEN** — does not apply in Fisk Heroes. Use `minecraft:wither` instead. |
| `minecraft:wither` | DoT, CAN kill | |
| `minecraft:health_boost` | Extra max HP | |
| `minecraft:absorption` | Yellow bonus hearts | |
| `minecraft:saturation` | Restores food | |

Note: No way to hide potion particles in 1.7.10 — swirling particles are hardcoded. Confirmed: Fisk's mod does not patch this (tested with Mastermind's Brain Scramble).

---

## 11. Built-in Attributes Reference

Used with `hero.addAttribute(name, value, mode)` where mode 0 = add, 1 = multiply:

| Attribute | Effect |
|-----------|--------|
| `PUNCH_DAMAGE` | Unarmed damage |
| `WEAPON_DAMAGE` | Held weapon damage bonus |
| `ARROW_DAMAGE` | Bow/arrow damage |
| `SPRINT_SPEED` | Sprint speed multiplier |
| `BASE_SPEED` | Base movement speed (use mode 1 to multiply; negative = slower) |
| `BASE_SPEED_LEVELS` | Super speed levels (with speedster_base) |
| `JUMP_HEIGHT` | Jump height bonus |
| `FALL_RESISTANCE` | Fall damage reduction |
| `STEP_HEIGHT` | Max block height auto-stepped (vanilla = 0.5) |
| `KNOCKBACK` | Knockback dealt on punch (0.5 = weak, 1.5 = strong) |
| `DAMAGE_REDUCTION` | Unclear — probably incoming damage reduction, but exact mechanic untested |
| `MAX_HEALTH` | Maximum health |
| `IMPACT_DAMAGE` | Unclear — possibly collision/flight impact damage (untested) |
| `BOW_DRAWBACK` | Unclear — possibly bow draw speed (untested) |
| `REACH_DISTANCE` | Block interaction range (use via attribute profiles) |

---

## 12. Built-in External Scripts

The mod includes reusable JS modules in `assets/fiskheroes/data/heroes/external/` and `assets/fiskheroes/renderers/heroes/external/`. Import with `implement("fiskheroes:external/name")`.

### Hero Data Externals

#### `falcon_base` — Flight Framework
The standard way to set up flight with boost capability. Wraps super_boost and creates the tick handler for you.

```javascript
var super_boost = implement("fiskheroes:external/super_boost");
var falcon_base = implement("fiskheroes:external/falcon_base");

falcon_base.init(hero, super_boost, "keySlot", sprintSpeed, function(entity, manager) {
    // Your custom tick handler goes here
    // falcon_base handles flight timers and super_boost internally
});
```

**Parameters:**
- `hero` — the hero object
- `super_boost` — the super_boost module (or `super_boost_with_cooldown.create(boostTime, recoveryTime, recoveryDelay)`)
- `keySlot` — key number for the boost keybind (as string, e.g. `"2"`, `"4"`)
- `sprintSpeed` — sprint speed multiplier during boost (e.g. `0.25`)
- `tickHandler` — your custom tick function, called every tick after flight/boost logic

**What it does internally:**
- Adds a boost keybind (`func_BOOST`) on the specified key
- Creates a `SUPER_BOOST` attribute profile with the sprint speed multiplier
- Manages `fiskheroes:dyn/booster_timer`, `fiskheroes:dyn/wing_timer`, `fiskheroes:dyn/flight_super_boost_timer`
- Calls `super_boost.tick()` each tick, then your custom tick handler

**Important:** `falcon_base.init()` calls `hero.setTickHandler()` internally, so you CANNOT also call `hero.setTickHandler()` separately — pass your tick logic as the last argument.

#### `super_boost` — Energy Form / Boost Toggle
Manages the boost state toggle. Used by `falcon_base`.

```javascript
var super_boost = implement("fiskheroes:external/super_boost");
```

**How it works:**
1. Keybind sets `fiskheroes:dyn/flight_super_boost` to 1 (sentinel value)
2. `tick()` catches the 1, sets it to 2, forces flight on, restores previous flight/boost timers
3. Deactivates when player stops sprinting + flying
4. `isModifierEnabled()` switches between `controlled_flight` and `controlled_flight|boosted`

**Delegate to it from your callbacks:**
```javascript
function isModifierEnabled(entity, modifier) {
    // Your custom checks first, then:
    return super_boost.isModifierEnabled(entity, modifier);
}
function isKeyBindEnabled(entity, keyBind) {
    return super_boost.isKeyBindEnabled(entity, keyBind);
}
```

The boost keybind (`func_BOOST`) only shows when sprinting + flying + not already boosted.

#### `super_boost_with_cooldown` — Timed Boost Variant
Same as `super_boost` but the boost auto-expires and has a cooldown.

```javascript
var super_boost = implement("fiskheroes:external/super_boost_with_cooldown")
    .create(boostTime, recoveryTime, recoveryDelay);
```

- `boostTime` — how fast the boost meter fills (higher = shorter boost)
- `recoveryTime` — how fast it recovers (higher = faster recovery)
- `recoveryDelay` — ticks after boost ends before recovery starts

#### `speedster_base` — Super Speed
Required for `fiskheroes:super_speed` to function.

```javascript
var speedster_base = implement("fiskheroes:external/speedster_base");
// In tick handler:
speedster_base.tick(entity, manager);
```

`tick()` manages the sprint timer data var. Surprisingly minimal — most speed logic is in the mod's Java code.

**Additional utilities:**
- `speedster_base.createSpeedPunch(hero, damageProfile)` — adds a SPEED_PUNCH damage profile for hitting while speeding. Returns `{ get: (entity, orElse) => ... }` for use in `getDamageProfile`.
- `speedster_base.mergeSounds(powerName, sounds, profile)` — merges speed/slowmo sound events into a powers JSON profile object.
- Pre-built sound sets: `SOUNDS_BARRY`, `SOUNDS_KF`, `SOUNDS_ZOOM`, `SOUNDS_SAVITAR`, `SOUNDS_COMICS`, etc.

#### `superhero_landing` — Landing Detection
Detects boost-dive near ground and triggers a landing animation.

```javascript
var superhero_landing = implement("fiskheroes:external/superhero_landing");
// In tick handler:
superhero_landing.tick(entity, manager);
```

Triggers when: not sprinting, not on ground, falling fast (motionY < -1.25), boost timer active, solid block within 2 blocks below. Sets `fiskheroes:dyn/superhero_landing_ticks` to 12 and plays a landing sound. Alexandria's implementation expands on this with shockwave damage.

#### `utils` (hero data) — Just One Function
```javascript
var hero_utils = implement("fiskheroes:external/utils");
// In tick handler:
hero_utils.flightOnIntangibility(entity, manager);
```

Forces flight on while intangible (unless sneaking). Does exactly what we do manually for Eidolon's intangibility.

### Renderer Externals

#### `utils` (renderer) — Binding Helpers
The most commonly used renderer utility. Import in renderer JS:

```javascript
var utils = implement("fiskheroes:external/utils");
```

**Key functions:**

```javascript
// Beam setup — propertyName is usually the modifier name
utils.bindBeam(renderer, "fiskheroes:heat_vision", beamModel, "head", color, entries)

// Particle emitter — returns the property for chaining .setCondition()
utils.bindParticles(renderer, "namespace:emitter_name")

// Cloud effect (e.g. energy aura)
utils.bindCloud(renderer, "fiskheroes:energy_manipulation", "namespace:cloud_name")

// Speed trail — auto-conditioned on entity.getData("fiskheroes:speeding")
utils.bindTrail(renderer, "namespace:trail_name")

// Opacity control
utils.setOpacity(renderer, min, max, delta)
utils.setOpacityWithData(renderer, min, max, "namespace:dyn/data_var")

// Camera shake
utils.addCameraShake(renderer, factor, intensity, "namespace:dyn/data_var")

// Flight animations — priority set to -10 (overrides punch/bow at -9)
utils.addFlightAnimation(renderer, "name", "animation_key")
utils.addFlightAnimationWithLanding(renderer, "name", "animation_key")

// Hover animation — priority -9.5
utils.addHoverAnimation(renderer, "name", "animation_key")

// Weapon texture variant
utils.addLivery(renderer, "WEAPON_TYPE", "texture_name")

// Custom animation events
utils.addAnimationEvent(renderer, "EVENT_KEY", "animation_key")
// or with array: utils.addAnimationEvent(renderer, "KEY", ["anim1", {key: "anim2", weight: 0.5}])

// Create model resource
utils.createModel(renderer, "MODEL_TYPE", "texture", "textureLights")

// Energy lines effect
utils.createLines(renderer, beamModel, color, entries)
```

#### Other Renderer Externals
- `speedster_utils` — speedster-specific rendering (lightning, trails)
- `falcon_boosters` / `iron_man_boosters` — flight booster VFX
- `iron_man_helmet` — helmet open/close animation
- `body_lines` — energy line patterns on body
- `bloom_booster` — bloom/glow effects during boost
- `capes` — cape physics
- `flames` — fire/energy flame effects
- `tao_mandalas` / `mysterio_glyph` / `eldritch_sword` — magic VFX

---

## Appendix A: JS API Reference

Full API surface decompiled from FiskHeroes 2.4.0 JAR.

### Data Access (tick handler / keybind callbacks)
```javascript
entity.getData("domain:dyn/var")                          // Read data var
entity.getInterpolatedData("domain:dyn/var")               // Smoothly interpolated (for timers)
manager.setData(entity, "domain:dyn/var", val)             // Write data var
manager.setDataWithNotify(entity, "domain:dyn/var", val)   // Write + trigger listeners
manager.incrementData(entity, "domain:dyn/var", duration, condition)           // Ramp 0→1 over `duration` ticks
manager.incrementData(entity, "domain:dyn/var", upDuration, downDuration, cond)  // Asymmetric ramp
manager.setInterpolatedData(entity, "domain:dyn/var", val) // Set interpolated directly
```

### Entity (JSEntityLiving)
```javascript
// Identity
entity.getName()                    // Player name or custom name
entity.getEntityName()              // Entity type: "zombie", "skeleton", etc.
entity.getUUID()                    // Unique identifier
entity.is("PLAYER")                 // Type check
entity.as("PLAYER")                 // Cast to JSPlayer
entity.isLivingEntity()             // Is living entity
entity.isPlayer()                   // Is player
entity.isAlive()                    // Health > 0
entity.equals(other)                // Identity check

// Position & Movement
entity.pos() / posX() / posY() / posZ()    // Position (JSVector3 / float)
entity.eyePos()                              // Eye/head position
entity.motion() / motionX() / motionY() / motionZ()  // Velocity
entity.motionInterpolated()                  // Smoothed velocity
entity.getLookVector()                       // Direction facing (JSVector3)
entity.rotYaw() / rotPitch() / rotation()   // Rotation angles

// State
entity.isSneaking() / isSprinting() / isOnGround() / isInWater()
entity.isInvisible() / isBurning() / isPunching()
entity.isWearingFullSuit()
entity.canSee(other)                // Line of sight + visibility
entity.hasPotionEffect("minecraft:speed")   // Check potion (read only)
entity.team()                       // Team info

// Health & Equipment
entity.getHealth() / getMaxHealth() / getAbsorptionAmount()
entity.getHeldItem()                // JSItem
entity.getWornHelmet() / getWornChestplate() / getWornLeggings() / getWornBoots()
entity.getEquipmentInSlot(slot)     // 0=held item, 1=boots, 2=leggings, 3=chestplate, 4=helmet

// Actions (on other entities from getEntitiesInRangeOf)
other.hurt(heroRef, "PROFILE", "%1$s death message", damage)
other.hurtByAttacker(heroRef, "PROFILE", "%s was killed by %s", damage, attacker)
other.playSound("sound:id", volume, pitch)
```

### Player (JSPlayer) — extends Entity
```javascript
entity.as("PLAYER").isCreativeMode()
entity.as("PLAYER").getFoodLevel() / getFoodSaturation()
entity.as("PLAYER").getExperience() / getExperienceLevel()
entity.as("PLAYER").isUsingItem() / isBlocking()
entity.as("PLAYER").addChatMessage("text")  // Send chat to this player
```

### World (JSWorld)
```javascript
entity.world().getDimension()               // 0=overworld, -1=nether, 1=end, 2595=moon
entity.world().name()                       // World name
entity.world().isDaytime() / isRaining() / isThundering()
entity.world().blockAt(pos)                 // JSBlock at position
entity.world().getBlock(pos)                // Block name string
entity.world().getBlockMetadata(x, y, z)
entity.world().getEntityById(id)            // Entity by numeric ID
entity.world().getLocation(x, y, z)         // JSLocation with biome info
entity.world().getEntitiesInRangeOf(pos, radius)  // Nearby entities
entity.world().isUnobstructed(pos1, pos2)   // Line-of-sight check
```

### Block (JSBlock)
```javascript
block.name()        // "minecraft:stone"
block.metadata()    // Block variant
block.hardness()    // Hardness value
block.isSolid()     // Solidity check
block.isEmpty()     // Is air
```

### Location (JSLocation)
```javascript
loc.biome()                  // Biome name
loc.canSnow() / canRain() / isHighHumidity()
loc.getTemperature() / getRainfall()
loc.getStructure()           // Structure name if in one
```

### Item (JSItem)
```javascript
item.name() / displayName() / stackSize() / damage() / maxDamage()
item.isWeapon() / isRifle() / isGun() / isLaserGun() / doesNeedTwoHands()
item.isEnchanted() / hasEnchantment(id) / getEnchantmentLevel(id)
item.isEmpty() / matches(otherItem)
item.nbt()                   // NBT data access
item.nbt().getString("HeroType")  // Read hero ID from suit
```

### NBT Persistence (Storing Data on Armor Items)
Data vars reset when the suit is removed. For data that must **persist across restarts** (XP, tracked targets, unlock states), write directly to the armor item's NBT compound tag. Changes are saved automatically with the item.

**Reading NBT:**
```javascript
var nbt = entity.getWornChestplate().nbt();
nbt.getString("myKey")          // String
nbt.getByte("myKey")            // Byte (0-255)
nbt.getInteger("myKey")         // Integer
nbt.getBoolean("myKey")         // Boolean
nbt.hasKey("myKey")             // Check existence
nbt.getCompoundTag("nested")    // Sub-compound
nbt.getTagList("myList")        // Tag list
```

**Writing NBT (requires manager):**
```javascript
var nbt = entity.getWornChestplate().nbt();
manager.setByte(nbt, "level", 5);
manager.setString(nbt, "targetUUID", "abc-123-...");
manager.setCompoundTag(nbt, "display", manager.newCompoundTag("{Lore:[\"Line 1\"]}"));
manager.setTagList(nbt, "items", manager.newTagList("[{Index:0}]"));
manager.appendTag(tagList, newElement);  // Add to existing list
```

**Pattern — persistent per-target tracking:**
```javascript
// Store a target UUID on the chestplate
var nbt = entity.getWornChestplate().nbt();
manager.setString(nbt, "analyzed_target", target.getUUID());
// Read it back later (survives restarts)
var savedUUID = nbt.getString("analyzed_target");
```

Reference: TMF (Ben 10) pack uses `manager.setByte(nbt, alienId, level)` for per-alien XP that persists across sessions.

### Vector3 (JSVector3)
```javascript
vec.x() / vec.y() / vec.z()
vec.add(x, y, z) / vec.subtract(other) / vec.multiply(scalar)
vec.dot(other) / vec.normalized() / vec.length()
vec.distanceTo(other) / vec.squareDistanceTo(other)
```

### Fisk-specific Data Vars (read via getData)
```javascript
entity.getData("fiskheroes:flying")               // Is flying
entity.getData("fiskheroes:speeding")              // Is super speeding
entity.getData("fiskheroes:shadowform")            // Is in shadowform
entity.getData("fiskheroes:intangible")            // Is intangible
entity.getData("fiskheroes:slow_motion")           // Is in slow motion
entity.getData("fiskheroes:beam_shooting")         // Is firing beam (>0)
entity.getData("fiskheroes:beam_charge")           // Beam charge level
entity.getData("fiskheroes:heat_vision")           // Is firing heat vision
entity.getData("fiskheroes:shield_blocking_timer") // Shield block progress
entity.getData("fiskheroes:time_since_damaged")    // Ticks since last hit
entity.getData("fiskheroes:gravity_manip")         // Is using gravity
entity.getData("fiskheroes:flight_timer")          // Flight animation progress
entity.getData("fiskheroes:flight_boost_timer")    // Boost animation progress
entity.getData("fiskheroes:teleport_delay")        // Teleport cooldown
entity.getData("fiskheroes:grab_id")               // TK grabbed entity ID
entity.getData("fiskheroes:dyn/flight_super_boost")  // Super boost state (0/1/2)
entity.getData("fiskheroes:mask_open")             // Helmet open/closed
entity.getPunchTimer()                              // Punch animation timer
```

### Cross-Player Data (untested but decompiled)
`manager.setData` works on any entity, not just self. No ownership check in the Java code. This means you can potentially set data vars on other players:
```javascript
// Theoretically possible (untested in practice):
manager.setData(otherPlayer, "fiskheroes:flying", true);
manager.setData(otherPlayer, "mypack:dyn/buffed", true);
```
Only produces effects if the target's hero suit reads that data var. Only works on players (not mobs). This is completely uncharted territory — no existing pack has attempted it that we could find.

### Entity Look-At Detection
Identify what entity the player is looking at using dot product:
```javascript
var angle = Math.acos(Math.max(-1, Math.min(1,
    entity.getLookVector().dot(
        other.eyePos().add(0, 0.55, 0).subtract(entity.eyePos()).normalized()
    )
))) * (180 / Math.PI);
// angle < 5 = looking right at them
```

### Entity Accessor Types (`.as()` / `.is()`)
Tested via direct probing. Valid type strings for `entity.is()` and `entity.as()`:

| Type | Returns | Available On |
|------|---------|-------------|
| `"LIVING"` | `JSEntityLiving` | Any living entity (mobs, players) |
| `"PLAYER"` | `JSPlayer` | Players only |
| `"DISPLAY"` | Display wrapper | Book preview entities — `.getDisplayType()`, `.isStatic()` |
| `"TENTACLE"` | Tentacle wrapper | Tentacle entities — `.getCaster()`, `.getIndex()`, `.getGrabTimer()` |
| `"SHADOWDOME"` | Dome wrapper | Shadowdome entities — `.getContainedEntities()`, `.getCaster()` |

Invalid type strings ("MOB", "CREATURE", "MONSTER", "ZOMBIE", "ENTITY") throw `IllegalArgumentException`.

### JSEntityLiving — Confirmed Methods (via live testing)
When you get mob entities from `getEntitiesInRangeOf()`, they are `JSEntityLiving` wrappers. Only a subset of methods actually work — the wrapper returns `null` for any unknown property (proxy pattern), so `null` results don't mean the method exists.

**Confirmed working (tested directly on mobs):**
- `is(type)`, `getHealth()`, `getMaxHealth()`, `getName()` — real methods that return values
- `pos()`, `eyePos()`, `isLivingEntity()`, `canSee(other)`, `equals(other)` — inherited from base
- `hurtByAttacker(hero, profile, deathMsg, damage, attacker)` — deal damage
- `playSound(id, volume, pitch)` — play sounds

**Confirmed NOT available (throw "has no such function"):**
- Targeting: `getAttackTarget`, `setAttackTarget`, `getAITarget`, `getRevengeTarget`, `setRevengeTarget`, `getLastAttacker`
- AI: `getNavigator`, `getTasks`, `getTargetTasks`
- Effects: `addPotionEffect`, `removePotionEffect`, `clearActivePotionEffects`
- Lifecycle: `setDead`, `isEntityAlive`, `getEntityId`, `kill`
- Movement: `setPosition`, `teleport`, `setVelocity`, `addVelocity`
- NBT: `nbt()` — not available on mob entities (only on the player `entity` parameter)

### JSPlayer — Confirmed Methods (via live testing)
**Confirmed working:**
- `addChatMessage(text)` — sends text to player's chat. Accepts strings and numbers. **Best debugging tool.**
- `isUsingItem()` — whether player is using an item

**Confirmed NOT available:**
- `isCreative`, `getGameType`, `setGameType`, `setGameMode` — no game mode access
- `sendChatMessage`, `performCommand`, `runCommand` — no command execution

### JSWorld — Confirmed Unavailable Methods
- `isRemote`, `getServer`, `getMinecraftServer`, `removeEntity`, `runCommand` — none of these exist

### Testing Methodology
The wrapper objects use a proxy pattern: unknown properties return `null` (type `"object"`) rather than `undefined`. This means you cannot discover methods by checking `typeof obj.method === "function"` or enumerating with `for...in`. To test if a method exists, call it directly — real Java methods throw `"has no such function"` errors when they don't exist, while proxy-null properties silently return `null` even with `()` appended.

**Important:** Java-backed methods don't support `.apply()` or `.call()`. Always invoke directly: `living.getHealth()`, not `living.getHealth.apply(living)`.

### API Limitations
- **No block placement** — world is read-only
- **No entity spawning** — duplication spell spawns entities but that's hardcoded Java
- **No healing/buffing others** — only `hurt`/`hurtByAttacker` on other entities. (Though it can be approximated with potion effects on an attack.)
- **No motion setting** on entities — readable but not writable
- **No potion application** — only readable via `hasPotionEffect`. (Though it can be approximated with potion effects on an attack.)
- **No inventory manipulation** — can read items but not modify
- **No homing projectiles** — all projectiles are straight-line
- **No custom shaders** — no GLSL, post-processing, or screen distortion
- **No mob aggro clearing** — targeting/AI methods not exposed. Vanilla Minecraft mob aggro persists through `fiskheroes:invisible`
- **No command execution** — no way to run `/gamemode` or any server command from scripts
- **No entity removal** — cannot despawn or kill mob entities programmatically

---

## Appendix B: Tiering & Stat Reference

Empirical data from 67 official base-mod heroes and 681 community heroes across 22 packs. Use this to calibrate your hero's tier and stats against the broader ecosystem.

### What Tier Means

Tier is primarily a **durability indicator** — it directly controls passive damage reduction. Higher tier = takes less damage from all sources. It also signals to players what power level to expect.

### Tier Damage Reduction (from mod source)

Formula: `protection = round((100 - (100 - B) * F / F^tier) * 10) / 1000` where B=75 (baseline), F=1.3 (factor). Both are configurable server rules.

| Tier | Damage Reduction | Damage Taken | Effective HP (20 base) |
|------|-----------------|--------------|------------------------|
| 1 | 75.0% | 25.0% | 80 HP |
| 2 | 80.8% | 19.2% | 104 HP |
| 3 | 85.2% | 14.8% | 135 HP |
| 4 | 88.6% | 11.4% | 175 HP |
| 5 | 91.2% | 8.8% | 227 HP |
| 6 | 93.3% | 6.7% | 299 HP |
| 7 | 94.8% | 5.2% | 385 HP |
| 8 | 96.0% | 4.0% | 500 HP |
| 9 | 96.9% | 3.1% | 645 HP |
| 10 | 97.6% | 2.4% | 833 HP |

The curve has diminishing returns — each tier adds less % reduction but effectively multiplies survivability. A Tier 5 hero takes ~3x less damage than a Tier 1. A Tier 9 takes ~8x less. Combined with MAX_HEALTH additions, high-tier heroes can be nearly unkillable without specific immunities being bypassed.

| Tier | Label | Who Goes Here |
|------|-------|---------------|
| 1 | Underpowered | Joke characters, untrained civilians. Spodermen, Penguin. |
| 2 | Weak | Minor powers, support roles. Doctor Strange (no combat focus), Gambit. |
| 3 | Skilled | Trained fighters, street-level powers. Red Hood, Arsenal, Black Canary. |
| 4 | Competent | Entry-level metas, enhanced agents. Cyclops, Kid Flash, Arrow. |
| 5 | Established | Standard superhero baseline. **Largest group.** Batman, The Flash, Deadpool, Green Arrow. |
| 6 | Elite | Peak-human tech or strong powers. Batman (DCEU), Captain America, Black Lightning. |
| 7 | Superhuman | True superhumans. **Second largest group.** Spider-Man, Iron Man, Colossus, Black Panther. |
| 8 | Powerful | Top-tier powers, advanced tech. Iron Man MK50/85, Homelander, Invincible, Wonder Woman. |
| 9 | World-class | Near-invulnerable powerhouses. Superman, Shazam, Vision, Martian Manhunter. |
| 10 | Godlike | Cosmic/divine entities. Anti-Monitor, Spectre. **High variance — use sparingly.** |

### Punch Damage by Tier

Community consensus from 681 heroes (center = median, range = observed min-max):

| Tier | Center | Typical Range | Official Range |
|------|--------|---------------|----------------|
| 1 | 2.0 | 0.1 – 3.9 | 3.0 – 5.0 |
| 2 | 3.7 | 1.4 – 6.0 | 1.5 – 5.5 |
| 3 | 4.0 | 2.9 – 5.1 | 3.5 – 4.5 |
| 4 | 4.5 | 3.4 – 5.6 | 4.0 – 5.5 |
| 5 | 5.0 | 3.9 – 6.2 | 4.5 – 6.0 |
| 6 | 5.9 | 4.3 – 7.5 | 6.5 – 7.5 |
| 7 | 7.6 | 5.5 – 9.8 | 7.0 – 9.0 |
| 8 | 8.3 | 5.8 – 10.8 | 8.5 – 10.0 |
| 9 | 10.8 | 8.4 – 13.2 | 10.5 – 12.0 |
| 10 | 10.3 | 5.1 – 15.6 | 13.0 |

The biggest stat jumps are Tier 1→2 (+87%) and Tier 8→9 (+29%). Tiers 3-4 are very close. Tier 10 actually *decreases* vs Tier 9 on average due to inconsistent usage.

**Extremes**:

| | Official (fiskheroes-builtin) | Community |
|---|---|---|
| **Highest** | Anti-Monitor, Spectre (T10): 13.0 | Invincible profile (soulhp, T9): 89.0 |
| **Lowest** | Doctor Strange (T2): 1.5 | Space Stone profile (Miscellaneous, T2): 0.5 |

Note: community extremes often come from attribute *profiles* (temporary boosts), not base stats. Base stats rarely exceed 20.0 even at Tier 10.

### Beam / Special Damage

From 493 powers JSON files across all packs:

| Damage Value | Frequency | Typical Usage |
|--------------|-----------|---------------|
| 3.0 | 45 powers | Low-tier beams, debuff-focused attacks |
| 4.0 | 45 powers | Entry-level beams |
| 5.0 | 36 powers | Mid-tier energy projection |
| **7.0** | **71 powers** | **Community standard — most common beam damage** |
| 8.0 | 30 powers | Heat vision (Kryptonian-class) |
| 12.0 | 26 powers | Heavy beams, repulsor blasts |
| 15.0 | 15 powers | Charged beams, top-tier attacks |
| 20.0 | 8 powers | Ground slams, ultimate abilities |

**Rule of thumb**: If you're implementing a basic energy beam, 7.0 is the safe default. Scale up/down from there based on charge time, cooldown, and character power level.

**Extremes**:

| | Official | Community |
|---|---|---|
| **Highest** | Basic beam (various): 7.0 | Firefly charged beam (dcuniverse, T5): 10.0; Superman charged beam (various, T9): 15.0 |
| **Lowest** | Debuff-only beams: 0.01 | Near-zero debuff beams: 0.001 |

### Ground Slam / AoE Damage

| Example | Pack | Tier | Damage | Radius | Cooldown | Type |
|---------|------|------|--------|--------|----------|------|
| Earthquake (generic) | dcuniverse | — | 1.0 | 5.0 | 160 ticks | EXPLOSION |
| Ambush | casadeheroes | 4 | 15.0 | 3.0 | 40 ticks | EXPLOSION |
| Wonder Woman | dcuniverse | 8 | 15.0 | 3.0 | 80 ticks | EXPLOSION |
| Superman | dcuniverse | 9 | 20.0 | 10.0 | 120 ticks | EXPLOSION |
| Superboy | supermanandlois | 8 | 25.0 | — | — | EXPLOSION |

Ground smash damage doesn't scale strongly with tier — the difference is mostly in radius and cooldown. Community highest is 25.0 (Superboy), official highest is 20.0 (Superman/Bane kryptonian powers).

### Immunities by Tier

Strongest correlation with tier of any stat. From community data:

| Tier Range | Typical Immunities | Count |
|------------|-------------------|-------|
| 1–4 | 0–2 types | Minimal. Maybe BULLET for armored characters. |
| 5–6 | 2–4 types | BULLET + 1-2 elemental (FIRE, COLD). |
| 7 | 3–5 types | BULLET, FIRE, PROJECTILE + thematic types. |
| 8 | 4–6 types | Broad elemental + physical. EXPLOSION common. |
| 9 | 6–8+ types | Near-total. FIRE, COLD, EXPLOSION, BULLET, PROJECTILE, TELEPATHY, MAGIC. |
| 10 | 8+ types | Everything + custom types (COSMIC, GOD, KRYPTONITE). |

**Most common immunity types** (by frequency across all packs):
1. EXPLOSION (30+ heroes)
2. BULLET (25+)
3. FIRE (20+)
4. COLD (18+)
5. TELEPATHY (12+)
6. SOUND/SCREAM (8+)
7. MAGIC (6+)
8. ELECTRICITY (5+)

### Flight Speed

Flight speed is character-specific, **not** tier-correlated. A Tier 9 flyer can be anywhere from 0.07 to 0.3.

| Speed | Boost | Examples | Feel |
|-------|-------|----------|------|
| 0.05 | 0.05 | Gliders (Catwoman, Beyond suit) | Barely flight — more like gliding |
| 0.07 | 0.10 | Aquaman, Cyborg | Slow, deliberate |
| 0.10 | 0.20 | Martian Manhunter, generic flyers | Standard |
| 0.14 | 0.24 | Superman (standard) | Fast |
| 0.15 | 0.30 | Green Lantern | Very fast |
| 0.21 | 0.28 | Batwing, jet-powered | Quick tech flight |
| 0.24 | 0.31 | Superman (boosted) | Extremely fast |

Flight speed is set via `controlled_flight` in powers JSON, not `addAttribute`. No `FLIGHT_SPEED` attribute exists.

### Max Health by Tier

| Tier | Typical Addition | Examples |
|------|-----------------|----------|
| 1–3 | 0 – 2.0 | Street-level, no extra durability |
| 4–5 | 2.0 – 6.0 | Flash (+4), Green Arrow (+4) |
| 6 | 4.0 – 6.0 | Batman (+6), Deathstroke (+4) |
| 7 | 6.0 – 8.0 | Cyborg (+6), Killer Croc (+8) |
| 8 | 8.0 – 14.0 | Aquaman (+8), Wonder Woman (+14) |
| 9 | 8.0 – 16.0 | Martian Manhunter (+8), Superman (+16) |
| 10 | 20.0+ | God (+20), cosmic entities (+40) |

**Extremes**: Official heroes mostly use +2.0 across the board. Community range: Eren Yeager profile (Miscellaneous, T4): +1 to Amara/The Darkness (DMH, T10): +40.

### Other Attributes by Tier

| Attribute | Low Tier (1–4) | Mid Tier (5–7) | High Tier (8–10) |
|-----------|---------------|----------------|-----------------|
| SPRINT_SPEED | 0.05 – 0.1 (×) | 0.1 – 0.3 (×) | 0.15 – 0.8 (×) |
| JUMP_HEIGHT | 0.5 – 1.0 (+) | 1.0 – 1.5 (+) | 1.5 – 2.0 (+) |
| FALL_RESISTANCE | 0.0 – 0.5 (+) | 0.5 – 1.0 (+) | 1.0 (+, typical) |
| KNOCKBACK | 0.0 – 0.3 (+) | 0.3 – 0.5 (+) | 0.5 – 1.0 (+) |

**Extremes**:

| Stat | Official Extreme | Community Extreme |
|------|-----------------|-------------------|
| SPRINT_SPEED high | Spodermen (T1): 0.75 | Rhino profile (jmcthp, T7): 2.3 |
| SPRINT_SPEED low | Arrow + 12 others (T4): 0.1 | Various: 0.1 |
| JUMP_HEIGHT high | Spodermen (T1): 4.0 | Conquest profile (jmcthp, T9): 40.0 |
| JUMP_HEIGHT low | Atom, Black Canary (various): 0.5 | Lois Lane (supermanandlois, T1): 0.2 |
| FALL_RESISTANCE high | Spider-Man PS4/Webb (T7): 13.0 | Ezio profile (Miscellaneous, T2): 10000.0 |
| FALL_RESISTANCE typical | Most heroes: 1.0 | Most heroes: 1.0 |

Note: FALL_RESISTANCE > 1.0 is valid (it's additive damage reduction, not a cap). Official Spider-Man uses 13.0. Extreme community values come from attribute profiles.

### Worm Hero Pack Tiering Rationale

For reference, how our heroes map to this system:

| Hero | Tier | Punch | Rationale |
|------|------|-------|-----------|
| Imp | 2 | 2.0 | Teenager with a knife/axe. Power is stealth, not combat. |
| Eidolon | 3 | 6.0 | Versatile but not innately durable. Power is flexibility. |
| Grue | 3 | 3.0 | Street-level fighter with darkness. |
| Regent | 3 | 3.0 | Scepter-wielding master. Power is control, not strength. |
| Skitter | 5 | 2.0 | Protected by her costume; the bugs do the damage, not Taylor. |
| Bitch | 3 | 10.0 | Mounted on a monster dog — the dog hits hard. Scales 5–30 with size. |
| Alexandria | 9 | 12.0 | Near-invulnerable flying brick. Top-tier durability + strength. |
| Legend | 9 | 4.0 | Fragile for his tier — power is in lasers and speed, not fists. |

### Key Takeaways

1. **Tier = durability expectation.** A Tier 9 hero should be very hard to kill. A Tier 3 hero should be killable by focused fire.
2. **Punch damage loosely tracks tier** but varies widely by character concept. A Tier 3 with a giant mech can punch harder than a Tier 7 martial artist.
3. **7.0 beam damage is the community standard.** Use it as your baseline and adjust from there.
4. **Immunities scale most reliably with tier.** This is the stat where tier matters most.
5. **Flight speed is purely thematic.** Set it to match the character, not the tier.
6. **Tier 10 is inconsistent across packs.** Use Tier 9 for your strongest heroes unless they're truly cosmic.
