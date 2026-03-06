# Fisk Heroes Hero Pack Creation Guide

An unofficial guide compiled through extensive trial, error, and reverse-engineering. The official mod documentation is sparse, so this fills the gaps.

**Mod version**: Fisk Heroes for Minecraft 1.12.2 (Forge)
**Scripting engine**: Nashorn (Java 8 JavaScript)
**Reload command**: `/fiskheroes reload` (renderer changes require a full game restart)
**Equip command**: `/fiskheroes equip domain:hero_name`

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

Keys 1-5 are available. Multiple keybinds can share a key — when multiple are enabled simultaneously, the **first one registered** (in script order) gets its label shown in the HUD. Registration order matters for display priority. For `addKeyBind`, `isKeyBindEnabled` controls BOTH visibility AND whether the action fires. For `addKeyBindFunc`, the function always fires but `isKeyBindEnabled` controls the label display.

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
| Type | Appearance |
|------|------------|
| `minecraft:cloud` | White smoke |
| `THICK_SMOKE` | Dense smoke |
| `BIG_SMOKE` | Large smoke puffs |
| `CRYO_SMOKE` | Icy blue particles |
| `FLAME` | Fire |
| `FLAME_BALL` | Larger fire |
| `FIREWORK_BACKGROUND` | Backdrop glow — `motion` field = RGB color (0-1 range) |

Etc. - this is not an exhaustive list, just some known useful ones.

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
Built-in grenade/gadget selector. Available items are configured in the powers JSON `fiskheroes:equipment` modifier. Known items: `fiskheroes:grenade`, `fiskheroes:freeze_grenade`, `fiskheroes:smoke_pellet`, `fiskheroes:batarang`.

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

#### 2. addPrimaryEquipment (weapon radial menu)
Adds weapons the hero can equip/unequip. Holding the Equip/Unequip keybind (default I) opens a radial menu if multiple weapons are registered. Each weapon goes into the player's hand when selected.

```javascript
// Built-in item
hero.addPrimaryEquipment("fiskheroes:grappling_gun", true);

// Custom fisktag weapon
hero.addPrimaryEquipment("fisktag:weapon{WeaponType:mypack:my_gun}", true);

// With condition (e.g., dual wield check)
hero.addPrimaryEquipment("fiskheroes:katana{Dual:1}", true,
    item => item.nbt().getBoolean("Dual"));

// Multiple calls = multiple weapons on the radial menu
hero.addPrimaryEquipment("fiskheroes:katana{Dual:1}", true,
    item => item.nbt().getBoolean("Dual"));
hero.addPrimaryEquipment("fiskheroes:desert_eagle{Dual:1}", true,
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

#### 4. Custom fisktag weapons
Define custom weapons in `assets/<domain>/data/fisktag/weapons/<weapon>.json`:

```json
{
  "name": "My Gun",
  "permission": "USE_MY_GUN",
  "holdingPose": "SINGLE",
  "cooldown": 40,
  "damageProfile": {
    "damage": 8.0,
    "types": { "ENERGY": 1.0 }
  },
  "spread": {
    "sprintingFactor": 1.5,
    "fallingFactor": 1.6
  },
  "recoil": {
    "amount": 0.2,
    "cameraShake": 1.5
  },
  "projectiles": [{
    "type": "BEAM",
    "spread": 1.25,
    "speed": 2.0,
    "trail": 1
  }],
  "soundEvents": {
    "SHOOT": "mypack:gun_shoot"
  }
}
```

Holding poses: `SINGLE`, `DUAL`, `RIFLE`

Melee weapons use `"melee": { "attackDamage": 9.0 }` instead of `projectiles`.

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
Reflects incoming damage back at the attacker.

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
Stationary turret/guard mode, a la Iron Man suits. *Removes* your costume and powers, separating them into an independent entity that walks around protecting you. Right-clicking on the costume will allow you to re-enter it (Iron Man suits have custom visuals for this.)

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

**Examples from reference packs:**
- dcuniverse: KRYPTONITE, LIGHTNING, TELEPATIC
- God of War: CHAOS_FLAMES, BIFROST, JORMUNGANDR_VENOM, PRIMORDIAL, GALE, LEVIATHAN_ICE
- Star Wars: FORCE
- TMF: LIGHT, ACID
- Sabri: ADAMANTIUM, TUTRIDIUM
- DMH: GOD, ANGEL, ARCHANGEL
- Superman & Lois: KRYPTONITE, XKRYPTONITE, BLUE_KRYPTONITE

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
| `minecraft:poison` | DoT, can't kill (stops at 1 HP) | |
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
entity.getEquipmentInSlot(slot)     // 0=helmet, 1=chest, 2=legs, 3=boots

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
