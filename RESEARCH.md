# Worm Hero Pack for Fisk's Superheroes -- Research Document

## Executive Summary

**No Worm/Parahumans hero pack exists for Fisk's Superheroes.** This would be a first-of-its-kind project. The mod's power system (90+ abilities) covers ~70% of Worm's major characters reasonably well. Characters like Alexandria, Legend, Grue, and Imp are near-trivial to implement. The hardest characters (Skitter, Vista, Coil) have powers that resist translation to Minecraft mechanics, but creative approximations can capture their flavor.

---

## 1. About Fisk's Superheroes Mod

### Key Facts
- **Platform**: Minecraft Java Edition, **1.7.10 only** (Forge)
- **Latest version**: 2.4.0 (September 2024)
- **Downloads**: 4.5M+ on CurseForge
- **Base content**: 65+ suits, 90+ unique powers
- **No Java coding required** for hero packs -- JSON + JavaScript only

### Hero Pack Format
Hero packs are a custom addon format (not resource packs or mods). They're `.zip` files placed in `.minecraft/fiskheroes/`.

```
MyHeroPack/
  heropack.json          -- Pack metadata (name, description, domain, packFormat)
  heropack.png           -- 256x256 icon
  credits.txt
  assets/
    <domain>/
      data/heroes/       -- Hero definition JSON files
      models/heroes/     -- 3D models (optional)
      renderers/heroes/  -- JavaScript renderer files (animations, effects)
      textures/heroes/   -- Skin textures
      events/sounds/     -- Custom sounds
```

### Skills Needed
| Skill | Required? | Notes |
|-------|-----------|-------|
| JSON editing | Essential | Hero definitions, power configs |
| JavaScript | Yes (rendering) | Suit appearance, animations, effects |
| Pixel art / textures | Essential | Suit skins on player model UV map |
| 3D modeling | Optional | Most packs use texture overlays only |
| Java | No | Heropack API avoids this entirely |

### Key Resources
- [Fisk Heroes Wiki -- HeroPack Tutorial](https://fiskheroes.fandom.com/wiki/Tutorials/HeroPack)
- [Rules Commands / Powers Reference](https://fiskheroes.fandom.com/wiki/Rules_Commands)
- [Heropack Central Discord](https://discord.com/invite/heropack-central-984928066478424154) -- primary community hub
- [Casa de Heroes (open-source reference pack on GitHub)](https://github.com/TheRealJackK/casadeheroes)
- Extracting the base mod `.jar` is the recommended way to learn the internal structure

### Important Limitation
The mod is **locked to Minecraft 1.7.10** (released 2014). This means old Forge, old Java, and old world generation. All hero packs must target 1.7.10.

---

## 2. Available Powers in the Mod

### Movement
| Power | Description |
|-------|-------------|
| Controlled Flight | Full directional (Superman/Iron Man style) |
| Gliding | With configurable boost speed |
| Leaping | Enhanced jump |
| Super Speed | Speedster movement (tachyon system) |
| Web Swinging / Web Zip | Grapple-style movement |
| Teleportation | Instant relocation |
| Intangibility | Phase through blocks |
| Quantum Realm | Shrink to subatomic |

### Ranged Offense
| Power | Description |
|-------|-------------|
| Energy Blast / Bolt | Generic energy projectiles |
| Charged Beam | Charged beam with configurable charge time |
| Heat Vision | Superman-style continuous beams |
| Repulsor Blast | Iron Man repulsors |
| Lightning Cast | Chain lightning with configurable radius |
| Fireball / Flame Blast | Fire attacks |
| Cryoball / Icicles | Ice attacks |

### Melee / AoE
| Power | Description |
|-------|-------------|
| Charged Punch | Enhanced melee with charge |
| Ground Smash | AoE ground slam |
| Earthquake | Seismic area attack |
| Sonic Waves | Sound attack (can break glass) |
| Spike Burst | Spike projectile burst |
| Tentacles | Tentacle attacks |

### Utility / Defensive
| Power | Description |
|-------|-------------|
| Size Manipulation | Grow/shrink |
| Telekinesis | Move objects/entities at range |
| Gravity Manipulation | Alter gravity |
| Shadow Dome | Create darkness dome |
| Shield / Shield Throwing | Defensive barrier |
| Thorns | Reflect contact damage |
| Healing Factor | Regeneration |
| Slow-Motion Vision | Enhanced perception |
| Invisibility | Via intangibility system |

### Equipment
Batarangs, throwing stars, grenades, freeze grenades, smoke pellets, firearms (Desert Eagle, Beretta), various web types, lightsaber, cold/heat guns.

### Configuration Options
Powers support: `isToggle`, `radius`, `range`, `cooldownTime`, `boostSpeed`, `chainRadius`, `chargeTime`, `canDoGriefing`, damage profiles, damage types.

---

## 3. Existing Hero Pack Landscape

### Major Packs (by downloads)
| Pack | Downloads | Content |
|------|-----------|---------|
| Secret Heroes (ShueShue) | 1.0M+ | One Punch Man, Homelander, Moon Knight, Hulk |
| The Pack With Things (Maxime) | 854K+ | Miles Morales, Soldier Boy, Batman (Arkham) |
| JMCT's Heropack | 791K+ | Marvel, MCU, DC, DCEU |
| Unconventional Heropack | 784K+ | Ronin, Red Guardian, Miles variants |
| Eighth's Heroes | 342K+ | Various |
| Diabolical Heroes | 31.7K+ | Invincible, Peacemaker, Wolverine, Watchmen |

### Franchises Covered
- **Marvel/MCU**: Extensive (Iron Man every suit, Spider-Man variants, X-Men, FF)
- **DC/DCEU/Arrowverse**: Superman, Batman (multiple), Wonder Woman, Flash
- **The Boys**: Homelander, Soldier Boy, etc.
- **Invincible**: Dedicated pack
- **Anime**: Naruto, JJK, One Punch Man, DBZ, MHA, Tokyo Ghoul, Demon Slayer, One Piece
- **Other**: Star Wars, God of War, Ben 10, Transformers
- **Worm/Parahumans**: **NOTHING EXISTS** -- wide open

### Existing Worm Minecraft Content (non-Fisk)
- Individual Parahumans player skins on Planet Minecraft (cosmetic only)
- Worm mods exist for other games (Sentinels of the Multiverse, TABS) but not Minecraft
- Worm x Minecraft fanfiction exists (Maincraft, Building Bridges) -- stories, not mods

---

## 4. Worm Character Roster -- Power Mappings & Feasibility

### TIER 1: EASY (Standard superhero archetypes, near-direct mapping)

| Character | Faction | Core Powers | Fisk Equivalent |
|-----------|---------|-------------|-----------------|
| **Alexandria** | Protectorate | Flight + invulnerability + super strength | Superman archetype -- Controlled Flight, Super Strength, max Damage Reduction |
| **Legend** | Protectorate | Lasers (heat/cold/concussive) + extreme flight | Controlled Flight + Charged Beam + Energy Bolt + Cryoball |
| **Purity** | E88/Indep. | Light projection + flight | Controlled Flight + Charged Beam (high damage) |
| **Glory Girl** | New Wave | Flight + strength + skintight forcefield (breaks on hit, recharges) + awe aura | Controlled Flight + Charged Punch + Shield (use health/recoveryDelay for break-and-recharge behavior) + Earthquake or Sonic Waves for aura? |
| **Kid Win** | Wards | Hoverboard + laser pistols | Controlled Flight + Energy Bolt |
| **Aegis** | Wards | Flight + adaptive redundant biology | Controlled Flight + Healing Factor + high durability |
| **Shadow Stalker** | Wards | Shadow phasing + crossbow | Intangibility toggle + projectile weapon + gliding/jump |
| **Imp** | Undersiders | Perception blocking (invisibility) | Invisibility toggle, melee only |
| **Scion** | N/A | Everything maxed (god-tier) | All stats maxed, Controlled Flight + Charged Beam + Healing Factor |
| **Dragon** | Protectorate | Mech suits with flight/weapons | Controlled Flight + Fireball + Energy Blast + Shield (Iron Man archetype) |
| **Contessa** | Cauldron | Path to Victory (perfect combat) | Slow-Motion Vision + high melee stats (skill-based fighter) |
| **Sundancer** | Travelers | Miniature sun creation | Fireball + Flame Blast |
| **Tattletale** | Undersiders | Enhanced intuition (non-combat) | Slow-Motion Vision + Night Vision (utility/support, underwhelming) |
| **Panacea** | New Wave | Biokinesis healing (others only, not self; touch range) | No good mapping -- heropack powers are player-focused, no "heal allies" modifier exists. Essentially unimplementable as a gameplay character. Cosmetic/flavor only. |

### TIER 2: MEDIUM (Creative combinations needed)

| Character | Faction | Core Powers | Approach | Challenge |
|-----------|---------|-------------|----------|-----------|
| **Grue** | Undersiders | Darkness generation | **Shadow Dome** + Blindness effects | Shadow Dome is nearly a perfect match |
| **Armsmaster/Defiant** | Protectorate | Multi-tool halberd, tinker tech | Custom weapon + Web Zip (grapple) + utility abilities | Multi-function weapon needs multiple suit abilities |
| **Miss Militia** | Protectorate | Shifting energy weapon (any mundane weapon) | Multiple suit ability slots cycling weapon types | Weapon switching elegance |
| **Clockblocker** | Wards | Time freeze on touch | Freeze Grenade at melee range + defensive self-freeze | Not exactly right but approximates |
| **Regent** | Undersiders | Muscle control / body hijacking | Telekinesis + Slowness/Weakness debuffs | No true body control mechanic |
| **Bitch/Hellhound** | Undersiders | Dog enhancement/enlargement | Transformation (DeLorean-style dog mount) + tentacle-dogs (Grogu technique) + melee brute stats | One rideable dog (player becomes dog) + 1-2 tentacle-head companion dogs for pack feel. Not a true pack but captures the core. |
| **Lung** | ABB | Escalating dragon transformation | Multiple ability tiers + Size Manipulation + Fireball + Flight | Escalation mechanic is the challenge |
| **Kaiser** | E88 | Metal blade/wall projection | Spike Burst + Icicles reskinned as metal | Core concept works |
| **Hookwolf** | E88 | Metal hook/blade shapeshifting | Thorns + Spike Burst + high melee damage | Cosmetic shapeshifting only |
| **Bakuda** | ABB | Exotic bombs (time-stop, gravity, glass, etc.) | Multiple grenade types (freeze, fire, gravity) | Most grenade types exist |
| **Eidolon** | Protectorate | Any 3 powers at once | Multi-ability loadout with mode switching | "Any power" is hard, multi-slot covers it |
| **Behemoth** | Endbringer | Dynakinesis, lightning, earthquakes | Size Manipulation + Lightning Cast + Earthquake + Fireball | Making it feel massive |
| **Simurgh** | Endbringer | Telekinesis, precognition, psychic song | Controlled Flight + Telekinesis + Sonic Waves | Precog/manipulation is flavor only |
| **Jack Slash** | S9 | Extended blade range | Charged Beam reskinned as cutting line, or long-reach melee | Extended melee range is tricky |

### TIER 3: HARD (Powers don't translate well to Minecraft)

| Character | Faction | Core Powers | Best Approximation | Why It's Hard |
|-----------|---------|-------------|---------------------|---------------|
| **Skitter/Weaver** | Undersiders | Bug swarm control, silk constructs | DoT cloud + custom particles + spider-silk armor model | The signature power (distributed swarm AI) has no equivalent. The protagonist MUST be included despite this. |
| **Vista** | Wards | Space warping / geometry bending | Teleportation + Telekinesis | Nothing in Minecraft can warp space |
| **Coil** | Indep. | Timeline splitting/collapsing | Slow-Motion Vision + equipment (guns, grenades, smoke) | Fundamentally impossible mechanic |
| **Leviathan** | Endbringer | Large-scale hydrokinesis, water echo | Super Speed + AoE + Size Manipulation + Cryoball | Water doesn't behave dynamically in MC |
| **Bonesaw** | S9 | Biological modification, plagues | Poison effects + Healing Factor | Core identity is lost |

---

## 5. Existing Packs with Reusable Power Configurations

These existing hero pack characters have power sets that closely mirror Worm characters, meaning their configurations could serve as references:

| Existing Character | Pack | Maps To (Worm) | Shared Powers |
|-------------------|------|-----------------|---------------|
| Superman | DCUniverse / base mod | Alexandria | Flight + strength + invulnerability |
| Iron Man (any suit) | Iron Maniac / base mod | Dragon / Armsmaster | Flight + energy blasts + armor |
| Green Goblin / glider heroes | Various | Kid Win | Hoverboard flight + projectiles |
| Homelander | Secret Heroes / Boys | Legend / Alexandria | Flight + heat vision + super strength |
| Moon Knight | Secret Heroes | Shadow Stalker | Stealth + melee + projectiles |
| Flash | Base mod / DCUniverse | N/A (no Worm speedsters, but useful for super speed reference) | Super Speed framework |
| Ant-Man | Base mod | Lung (size change), Vista (shrinking) | Size Manipulation |
| Doctor Strange | Various | Eidolon | Multiple power types, mode switching |
| Ghost (Ant-Man) | Various | Shadow Stalker / Imp | Intangibility |
| Hulk | Secret Heroes | Lung (escalation concept) | Size change + strength scaling |
| Captain Cold | Base mod (Cold Gun) | Clockblocker (freeze concept) | Freeze mechanics |
| Wolverine | TG Heroes / Diabolical | Hookwolf (melee brute) | Healing + melee focus + thorns |

---

## 6. Recommended Development Phases

### Phase 1: Core Cast (Easy wins, iconic characters) -- ~7 characters
1. **Alexandria** -- Flagship Brute/Mover, trivial to implement
2. **Legend** -- Flagship Blaster, energy projection + flight
3. **Grue** -- Shadow Dome is nearly purpose-built for him
4. **Imp** -- Intangibility toggle, fan-favorite
5. **Shadow Stalker** -- Phasing + crossbow, simple
6. **Purity** -- Energy projector, easy
7. **Scion** -- Max-stat god character, fun to include

### Phase 2: Expanded Roster (Medium difficulty, high demand) -- ~8 characters
8. **Lung** -- Escalating fire brute, iconic villain
9. **Armsmaster/Defiant** -- Tinker melee, custom halberd
10. **Skitter/Weaver** -- Approximate with DoT cloud (protagonist, must include)
11. **Miss Militia** -- Weapon cycling
12. **Eidolon** -- Multi-power loadout
13. **Kaiser** -- Metal spike burst
14. **Bakuda** -- Grenade specialist
15. **Glory Girl** -- Flying brick

### Phase 3: Ambitious Additions -- ~8 characters
16. **Behemoth** -- Massive AoE Endbringer
17. **Simurgh** -- Telekinesis/sonic Endbringer
18. **Leviathan** -- Speed/AoE Endbringer
19. **Clockblocker** -- Freeze mechanic
20. **Hookwolf** -- Thorns brute
21. **Contessa** -- Stat-based fighter
22. **Dragon** -- Iron Man archetype
23. **Vista** -- Teleportation proxy

### Optional / Flavor Characters
Tattletale, Regent, Bitch, Coil, Kid Win, Aegis, Sundancer, Jack Slash, Bonesaw, Panacea

---

## 7. Feasibility Assessment

### Overall Verdict: VERY FEASIBLE

**Strengths:**
- The mod's power system is surprisingly well-suited for Worm's diverse power set
- No Java required -- JSON + JS is more accessible
- Active community (Heropack Central Discord) for support
- Open-source reference pack (Casa de Heroes) available
- Nobody has done Worm yet -- first-mover advantage in the community

**Challenges:**
- Locked to Minecraft 1.7.10 (old version, small but dedicated player base)
- Skitter (the protagonist) has one of the hardest powers to represent
- Advanced documentation is sparse -- Discord community is the primary knowledge base
- Texture/pixel art for 20+ unique costumes is significant art effort
- Some Worm powers (space warping, timeline splitting, bug swarm AI) are fundamentally impossible

**Estimated Effort:**
- Phase 1 (7 easy characters): Moderate -- primarily texture work + JSON config. A few weekends for someone familiar with the tooling.
- Phase 2 (8 medium characters): Significant -- requires creative power combinations and JavaScript renderer work.
- Phase 3 (8 ambitious characters): Large -- Endbringers especially need careful balancing and custom effects.
- Full pack (23+ characters): Major project, likely months of work.

**Recommended First Steps:**
1. Join the Heropack Central Discord and introduce the project
2. Download the mod and extract the `.jar` to study the internal structure
3. Download Casa de Heroes from GitHub as a template
4. Start with Alexandria (simplest character, proves the pipeline works)
5. Progress through Phase 1 to build skills before tackling harder characters

---

## 8. Technical Deep-Dive: The Power System Architecture

### Three-Layer Architecture

The heropack system uses three layers working together:

1. **Hero Definition Scripts** (`/data/heroes/*.js`) -- JavaScript files with an `init(hero)` function that configures the hero object
2. **Power Set Files** (`/data/powers/*.json`) -- JSON files defining which modifiers a hero has and how they're configured
3. **Renderer Scripts** (`/renderers/heroes/*.js`) -- JavaScript files controlling visual presentation

### Layer 1: Hero Definition API

Each hero is a JS file. Example structure (based on Casa de Heroes' Technodrone):

```javascript
function init(hero) {
    hero.setName("Technodrone");
    hero.setTier(7);
    hero.setHelmet("Helmet");
    hero.setChestplate("Chestplate");
    hero.setLeggings("Leggings");
    hero.setBoots("Boots");

    hero.addPowers("cdh:technodrone_armor");  // references power JSON
    hero.addAttribute("PUNCH_DAMAGE", 5.0, 0);
    hero.addAttribute("WEAPON_DAMAGE", 1.0, 0);
    hero.addAttribute("FALL_RESISTANCE", 8.0, 0);

    hero.addKeyBind("AIM", "key.aim", 1);
    hero.addKeyBind("SENTRY_MODE", "key.sentryMode", 3);

    hero.setTickHandler((entity, manager) => {
        var flying = entity.getData("fiskheroes:flying");
        manager.incrementData(entity, "fiskheroes:dyn/booster_timer", 2, flying);
    });
}
```

**Key hero API methods:**
- `hero.setName()`, `hero.setVersion()`, `hero.setTier()`
- `hero.setHelmet/Chestplate/Leggings/Boots()` -- armor piece definitions
- `hero.addPowers()` -- references power JSON files
- `hero.addAttribute()` -- PUNCH_DAMAGE, WEAPON_DAMAGE, FALL_RESISTANCE, JUMP_HEIGHT, SPRINT_SPEED, STEP_HEIGHT, IMPACT_DAMAGE
- `hero.addKeyBind()` / `hero.addKeyBindFunc()` -- keybinds (latter takes a callback)
- `hero.setModifierEnabled(callback)` -- conditionally enable/disable modifiers per tick
- `hero.setKeyBindEnabled(callback)` -- conditionally enable/disable keybinds
- `hero.setHasProperty(callback)` -- dynamic properties (MASK_TOGGLE, BREATHE_SPACE, etc.)
- `hero.supplyFunction(name, callback)` -- register named functions (e.g., "canAim")
- `hero.setTickHandler(callback)` -- per-tick logic with data manager access
- `hero.setAttributeProfile()` / `hero.setDamageProfile()` -- dynamic stat switching
- `hero.setHasPermission(callback)` -- permission checks like "USE_GUN"
- `hero.addPrimaryEquipment()` -- multiple equipment slots
- `hero.addSoundEvent()` / `hero.addSoundOverrides()` -- sound configuration

### Layer 2: Power Sets (JSON)

Power sets define modifier bundles with deep configuration. Example (trimmed):

```json
{
  "name": "Technodrone Armor",
  "modifiers": {
    "fiskheroes:controlled_flight": {
      "speed": 0.1,
      "boostSpeed": 0.21,
      "canBoost": true,
      "barrelRoll": { "duration": 10, "speed": 0.15, "drag": 0.06 },
      "collision": {
        "blocks": { "stopFlying": false, "takeDamage": true },
        "entities": { "stopFlying": false, "dealDamage": true }
      }
    },
    "fiskheroes:repulsor_blast": {
      "damageProfile": {
        "damage": 6.0,
        "types": { "ENERGY": 1.0 },
        "properties": { "ADD_KNOCKBACK": 1.0, "HIT_COOLDOWN": 10 }
      },
      "range": 48.0, "speed": 20.0, "spread": 0.0, "radius": 0.1, "cooldownTime": 2
    },
    "fiskheroes:fire_immunity": {},
    "fiskheroes:regeneration": { "factor": 1.0 },
    "fiskheroes:potion_immunity": { "potionEffects": ["minecraft:nausea", "minecraft:poison"] }
  }
}
```

Power sets can also include **HUD definitions**:
```json
"hud": [
    { "type": "CIRCLE", "color": "fiskheroes:charged_beam", "data": "fiskheroes:beam_charge" },
    { "type": "PROGRESS", "texture": "fiskheroes:textures/gui/bars/giant_mode.png", "data": "fiskheroes:dyn/giant_mode_cooldown" }
]
```

### Layer 3: Renderers (JS)

Renderer scripts control visuals -- glowing elements, animated parts, particles, beams:

```javascript
extend("fiskheroes:hero_basic");
var utils = implement("fiskheroes:external/utils");

function initEffects(renderer) {
    repulsor = renderer.createEffect("fiskheroes:overlay");
    helmet = iron_man_helmet.createFolding(renderer, "mask", "mask_lights", "fiskheroes:mask_open_timer2");
    utils.addCameraShake(renderer, 0.015, 1.5, "fiskheroes:flight_boost_timer");
    utils.bindParticles(renderer, "fiskheroes:iron_man").setCondition(...);
    utils.bindBeam(renderer, "fiskheroes:repulsor_blast", "fiskheroes:repulsor_blast",
                   "rightArm", 0xDC4153, [
        { "firstPerson": [-4.5, 3.75, -7.0], "offset": [-0.5, 9.0, 0.0], "size": [1.5, 1.5] }
    ]);
}
```

### The Damage Profile System

One of the most flexible areas. Allows fine-grained damage configuration:

```json
"damageProfile": {
    "damage": 12.0,
    "types": { "ELECTRICITY": 1.0 },
    "properties": {
        "COOK_ENTITY": true,
        "LIGHTNING_STRIKE": 0.15,
        "ADD_KNOCKBACK": 1.0,
        "HIT_COOLDOWN": 10,
        "DAMAGE_DROPOFF": 0.6
    }
}
```

**Built-in damage types:** ENERGY, EXPLOSION, COLD, ELECTRICITY, SHARP, BLUNT, SHURIKEN, BULLET
**Custom damage types** can be registered in `heropack.json` via the `damageTypes` field (added v2.1.0), enabling custom vulnerability/resistance systems.

### Modifier Variants

Modifiers support pipe `|` syntax for variants: `fiskheroes:size_manipulation|small` and `fiskheroes:size_manipulation|giant` allow the same modifier type to appear multiple times with different configs.

### Transformation & State System

The `fiskheroes:transformation` and `fiskheroes:cooldown` modifiers provide a state machine:
- Toggle data, timer data, and cooldown tracking
- Enables form-switching mechanics (relevant for Lung's escalation, Eidolon's mode switching)

### Custom Data Variables

The `fiskheroes:dyn/` namespace lets pack creators define persistent data variables:
- Incremented over time in tick handlers
- Used as animation drivers in renderers
- Bound to HUD elements
- Configurable with `resetWithoutSuit` and `resetOnDeath`

### Sound Event Hooks

Comprehensive trigger system per modifier:
- **Suit-level:** EQUIP, UNEQUIP, MASK_OPEN, MASK_CLOSE, AIM_START, AIM_STOP, STEP
- **Flight:** ENABLE, DISABLE, BOOST, IMPACT_BLOCK, IMPACT_ENTITY, ROLL, DIVE
- **Speed:** MOVE, SPRINT, STOP
- **Shield:** BLOCK_START, BLOCK_STOP, DEFLECT, DISARM
- **Tentacles:** ENABLE, DISABLE, ANCHOR, UNANCHOR, JAB_START, GRAB_START, STRIKE_START, STRIKE_CHARGED

---

## 9. Can You Create "New" Powers? (Critical Question)

### Short Answer: No new mechanics, but massive combinatorial flexibility.

The heropack system is a **composition framework**, not a general-purpose programming environment. You compose from ~90+ built-in modifiers with extensive parameterization and JS conditional logic. You **cannot** create fundamentally new ability mechanics.

### The Customization Spectrum

| Level | What You Can Do | Example |
|-------|----------------|---------|
| **Basic** | Select built-in modifiers with defaults | `"fiskheroes:fire_immunity": {}` |
| **Intermediate** | Deep parameter configuration | Custom flight speeds, damage profiles, equipment loadouts |
| **Advanced** | JS conditional logic | Disable water breathing when mask is open; switch profiles based on state |
| **Expert** | Tick handlers + custom data + HUD + conditional modifiers + renderers | Full Iron Man suit with boosters, sentry mode, aim, mask animations, cooldown bars |
| **Impossible** | New modifier mechanics, new entities, arbitrary world interaction | Time travel, portals, NPC companions, new projectile physics |

### What Hero Packs CANNOT Do (requires Java mod code)

1. **Create new modifier types** -- no "time rewind", "mind control", or "portal" powers. The "Advanced FiskHeroes" addon exists as a **separate Java mod** specifically because it needed new abilities (Omega Beam, Super Breath) impossible through heropacks alone.
2. **Add new items or blocks** -- weapons and equipment are built into the base mod
3. **Modify entity AI** -- no NPC behavior, companion spawning, or mob changes
4. **Add new entity types** -- no new mobs, projectile types, or vehicles
5. **Custom particle systems** -- can bind/trigger built-in particles, but not define new particle behaviors
6. **World manipulation** -- no arbitrary block placement beyond what `canDoGriefing` provides
7. **Custom GUIs** -- HUD limited to CIRCLE and PROGRESS bar types
8. **Access Java classes** -- `Java.type()` was **removed** in v2.2.1 for security

### Implications for Worm Characters

This confirms our earlier feasibility tiers but adds nuance:

- **Skitter's bug swarm**: Cannot spawn/control entities. Best option is a reskinned damage cloud (Shadow Dome variant? DoT field?) -- the swarm is purely cosmetic/particle-based at best.
- **Bitch's dogs**: Cannot spawn companion wolves. Rachel would be a melee brute with no dogs, which loses her identity.
- **Lung's escalation**: Actually MORE feasible than expected -- the transformation/state system with tick handlers and custom data variables can track fight duration and progressively enable more modifiers (fire > flight > size increase).
- **Eidolon's power switching**: Transformation system supports mode switching between different modifier loadouts. Very doable.
- **Vista's space warping**: Confirmed impossible. Teleportation is the only option.
- **Clockblocker's time freeze**: No new mechanics possible, but freeze grenade at melee range with the equipment system is a reasonable workaround.

### The "Advanced FiskHeroes" Escape Hatch

There is a separate **Java mod** called "Advanced FiskHeroes" that adds new modifier types not possible through heropacks (Omega Beam, Super Breath, etc.). If the Worm pack needed truly novel mechanics, creating a companion Java mod addon is precedented -- but dramatically increases the technical bar (requires Java + Forge modding knowledge).

### Key Additional Resources
- [Casa de Heroes GitHub](https://github.com/TheRealJackK/casadeheroes) -- real code examples of power configuration
- [FiskHeroes Mapping Viewer](https://github.com/FiskFille/FiskHeroes-Mapping-Viewer) -- tool for examining mod internals
- [Advanced FiskHeroes (Minecraft Forum)](https://www.minecraftforum.net/forums/mapping-and-modding-java-edition/minecraft-mods/3157891-advanced-fiskheroes) -- precedent for Java addon extending heropack capabilities

---

## 10. Findings from Examining Downloaded Hero Packs

### Downloaded Packs Examined
- Casa de Heroes (GitHub, open source)
- Harpack 3.0.1 (includes Marty McFly / DeLorean)
- Sabri Enhanced HP 2.0.6 (Silver Surfer, Kang, Wolverine, Thor)
- Star Wars HeroPack 3.0.0 (Mandalorian, Grogu, Clone Troopers)
- DC Universe 2.0.0 (full DC roster)
- Diabolical Heroes (Invincible, Watchmen, etc.)
- TG Heroes 4.2.0 (X-Men, Fantastic Four)
- DMH v1.3.2 (God, Amara -- item conjuration)
- God of War, Fisk Rework, Miscellaneous Heropack, SH Heropack

### CRITICAL FINDING: "Vehicles" and "Summons" Are Renderer Tricks

The earlier research concluded that hero packs cannot spawn entities. This is **correct** -- but pack creators have found clever workarounds using the renderer system:

#### The DeLorean (Harpack -- Marty McFly)
The DeLorean is **NOT a spawned entity**. It's a cosmetic 3D model rendered around the player:

1. A `fiskheroes:transformation` toggle with keybind "Summon Delorean" flips `harpack:dyn/delorean` to true
2. The renderer loads a custom 3D model via `renderer.createResource("MODEL", "harpack:delorean")`
3. It creates a visual effect via `renderer.createEffect("fiskheroes:model").setModel(deloreanModel)`
4. The model is anchored to the player's body and rendered around them
5. When "transformed," the player gets `fiskheroes:super_speed` -- so the **player IS the car**
6. Includes a gear system (P, 1-4) via custom data variables driving different speed profiles

**Technical recipe:**
```
Powers: fiskheroes:transformation + fiskheroes:super_speed + fiskheroes:teleportation + fiskheroes:shape_shifting
Renderer: createResource("MODEL") + createEffect("fiskheroes:model") + anchor to body
Data: custom dyn/ variables for toggle state, timer, gear
HUD: CHARGE type elements showing current gear
```

#### Silver Surfer's Surfboard & Kang's Platform (Sabri Enhanced)
Same technique -- "summon" and "unsummon" are just **sound effect names** triggered on flight ENABLE/DISABLE. The surfboard/platform is a 3D model rendered beneath the player when flying. No entities involved.

#### Grogu (Star Wars HeroPack -- Mandalorian)
Even more creative: "Summon Grogu" is keybind `TENTACLES`. They **repurposed the tentacle modifier** -- the tentacle model/renderer is replaced with a baby Yoda model that floats near the player. The tentacle mechanics (grab, strike) presumably still function but are visually disguised.

#### Wolverine's Claws (Sabri Enhanced)
Custom 3D claw models attached to both arms via `createResource("MODEL", "sabri:wolverine_claws")` + `createEffect("fiskheroes:model")`, anchored to left and right arm positions.

### Built-in Modifier: `fiskheroes:shape_shifting`

This is a **base mod modifier** we hadn't documented. It appears in several packs:
- Used in Harpack's DeLorean (lets player enter the SHAPE_SHIFT menu to pick a "date"/disguise)
- Used in DMH's God character for "Item Conjuration" (combined with NBT tag manipulation to give items)
- Sets `fiskheroes:disguise` data (the selected disguise target)
- Has related data keys: `fiskheroes:shape_shifting_to`, `fiskheroes:shape_shift_timer`

This modifier lets a hero **disguise as another hero** -- opening a selection menu. This is how the Marty McFly "Set Date" feature works (it reuses the shape-shift UI to pick a destination).

### NBT Tag Manipulation

The DMH God pack reveals that hero scripts can **manipulate NBT tags** on armor items:
```javascript
var nbt = entity.getWornChestplate().nbt();
manager.setTagList(nbt, "Equipment", equipment);
```
This is more powerful than expected -- it means hero packs can read/write persistent data on the suit item itself, not just the transient `dyn/` data variables.

### Additional HUD Types Discovered

Beyond CIRCLE and PROGRESS, packs also use:
- `CHARGE` -- charge indicator bound to JS expressions (used by Harpack for gear display)
- HUD data fields can contain **JS expressions**, not just data key references: `"data": "Number(entity.getData('harpack:dyn/gear') == 0)"`

### Implications for Worm Characters

These renderer tricks significantly change feasibility for several characters:

| Character | Previous Assessment | Updated Assessment |
|-----------|--------------------|--------------------|
| **Armsmaster** | Medium | **Easier** -- Halberd as a custom 3D model attached to arm via `createResource("MODEL")`. Multi-tool aspects via transformation toggles. |
| **Bitch/Hellhound** | Medium (limited companion control) | **Doable as combined form** -- Use DeLorean technique: transformation toggle renders a large dog model around/beneath the player. Player IS the dog. Mounted mode gets size increase, super strength, leaping, sprint speed, ground smash (pounce). Can add 1-2 extra tentacle-dogs (Grogu technique: `tentacles.setHeadModel()`) for pack feel, with functional tentacle-strike damage at the dog head endpoints. Not a true pack, but captures the fantasy. |
| **Hookwolf** | Medium (cosmetic only) | **Better** -- Transformation system + custom model could show the metal wolf form as a full body replacement model. |
| **Lung** | Medium (escalation challenge) | **Better** -- Transformation system with multiple stages, each adding more model elements (scales, wings, tail) and enabling more modifiers. Gear system from DeLorean is a perfect precedent for escalation tiers. |
| **Dragon** | Easy (Iron Man type) | **Even easier** -- Multiple suit variants as separate heroes, each with different 3D model elements. |
| **Endbringers** | Medium | **Better** -- Size manipulation + custom models. The DeLorean proves you can render very large models around the player. |
| **Skitter** | Hard | **Slightly better** -- Could render a cosmetic swarm cloud as a model effect around the player, but still no functional bug AI. Shadow Dome + DoT particles + decorative bug model remains the best approximation. |

### Deep Dive: How Grogu (Tentacle Companion) Actually Works

Grogu is the best example of a "companion" in the heropack system. Understanding exactly how it works is critical for characters like Bitch.

**Power layer** (`grogu.json`): A single `fiskheroes:tentacles` modifier with one tentacle at position `[1.0, 0, 0.4]`. That's all the gameplay logic.

**Renderer layer** (`mandalorian.js`):
```javascript
var grogu = utils.createModel(renderer, "swhp:grogu", "grogu");
grogu.bindAnimation("swhp:grogu").setData((entity, data) => {
    var t = entity.as("TENTACLE");
    data.load(0, 1 - Math.min(t.getCaster().getInterpolatedData("fiskheroes:tentacle_extend_timer") * 2, 1));
    data.load(1, t.getIndex());
});

var tentacles = renderer.bindProperty("fiskheroes:tentacles").setTentacles([
    { "offset": [10.0, -4.5, -2.0], "direction": [13.0, 0.0, -10.0] }
]);
tentacles.anchor.set("body");
tentacles.setHeadModel(grogu);  // Replaces tentacle tip with Grogu model
```

**Key details:**
- `tentacles.setHeadModel(grogu)` replaces the tentacle tip geometry with a custom 3D model (Tabula `.tbl` format)
- The tentacle arm/rope itself is invisible -- only the "head" model renders
- Grogu has **no independent hitbox** -- purely visual
- Tentacle strike mechanics still function: damage dealt at the tentacle endpoint (where Grogu floats)
- Animation is driven by `tentacle_extend_timer` data
- Only supports **one companion per tentacle definition** (though multiple tentacle entries in the array could theoretically mean multiple companions)
- Activated by keybind mapped to `TENTACLES` (player must be sneaking to summon, per `isKeyBindEnabled`)

**Model files:** `.tbl` (Tabula modeler format) for the 3D model, `.fsk` for animations, `.png` for texture.

### Other Discovered Modifiers & Features

From examining all packs, additional modifiers not in previous documentation:

- `fiskheroes:shape_shifting` -- Disguise as another hero (opens selection menu)
- `fiskheroes:blade` -- Toggleable melee weapon mode (used extensively)
- `fiskheroes:arrow_catching` -- Catch incoming projectiles
- `fiskheroes:damage_immunity` -- with `damageType` tag for specific immunities
- `fiskheroes:damage_resistance` -- with `damageType` and `factor` tags
- `fiskheroes:frost_walking` -- Freeze water beneath feet
- `fiskheroes:leaping` -- with `leapAmount` configuration
- `hero.setDefaultScale()` -- Set default size of the hero
- `hero.addKeyBindFunc()` -- Arbitrary JS callback on keypress (very powerful)
- `manager.newTagList()` / `manager.setTagList()` -- NBT tag manipulation
- `renderer.createResource("MODEL")` -- Load custom 3D models
- `renderer.createResource("PARTICLE_EMITTER")` -- Custom particle emitters
- `renderer.createResource("CAPE_PHYSICS")` -- Cape physics simulation
- `renderer.createEffect("fiskheroes:model")` -- Render arbitrary 3D models on the player
- `renderer.createEffect("fiskheroes:overlay")` -- Glowing overlay effects
- `renderer.createEffect("fiskheroes:metal_heat")` -- Metal heating visual
- `renderer.createEffect("fiskheroes:chest")` -- Chest arc reactor style effect
- `renderer.createEffect("fiskheroes:shield")` -- Shield visual effect
- `renderer.createEffect("fiskheroes:wingsuit")` -- Web-wing/wingsuit rendering
- `renderer.bindProperty("fiskheroes:forcefield")` -- Spherical forcefield effect with `.color`, `.setShape()`, `.setOffset()`, `.setScale()`, `.opacity`, `.setCondition()`
- `utils.bindTrail(renderer, "domain:trail_name")` -- Speed/movement trails with `.setCondition()`

---

## 11. Complete Modifier Reference (from base mod classes)

All 57 modifier types available in FiskHeroes 2.4.0, extracted from the Java class names. These are the building blocks for all hero powers — hero packs compose and configure them but cannot create new modifier types.

| Modifier Class | JSON Key | Description |
|---|---|---|
| Archery | `fiskheroes:archery` | Bow/arrow combat |
| ArrowCatching | `fiskheroes:arrow_catching` | Catch incoming arrows |
| Blade | `fiskheroes:blade` | Retractable melee weapon (claws, sword, etc.) |
| ChargedBeam | `fiskheroes:charged_beam` | Charge-up continuous beam (heat vision) |
| ChargedPunch | `fiskheroes:charged_punch` | Charge-up melee attack |
| ControlledFlight | `fiskheroes:controlled_flight` | Full 3D flight with boost, barrel roll, dive |
| Cooldown | `fiskheroes:cooldown` | Timed toggle with cooldown/recovery |
| CryoCharge | `fiskheroes:cryo_charge` | Cold/ice charged attack |
| DamageBonus | `fiskheroes:damage_bonus` | Passive damage increase |
| EnergyManipulation | `fiskheroes:energy_manipulation` | Energy absorption/redirection |
| EnergyProjection | `fiskheroes:energy_projection` | Continuous energy beam |
| Equipment | `fiskheroes:equipment` | Equippable items/weapons |
| EterniumWeakness | `fiskheroes:eternium_weakness` | Vulnerability to eternium |
| FireImmunity | `fiskheroes:fire_immunity` | Complete fire immunity |
| FireResistance | `fiskheroes:fire_resistance` | Partial fire resistance |
| FireWeakness | `fiskheroes:fire_weakness` | Vulnerability to fire |
| FlameBlast | `fiskheroes:flame_blast` | Fire projectile |
| Flight | `fiskheroes:flight` | Simple upward flight |
| FrostWalking | `fiskheroes:frost_walking` | Freezes water underfoot |
| Gliding | `fiskheroes:gliding` | Elytra-style gliding + cape |
| GravityManipulation | `fiskheroes:gravity_manipulation` | Alter gravity for self/area |
| HealingFactor | `fiskheroes:healing_factor` | Passive health regeneration |
| HeatVision | `fiskheroes:heat_vision` | Eye beam attack |
| Hover | `fiskheroes:hover` | Stationary hovering |
| Immunity | `fiskheroes:damage_immunity` | Immunity to specific damage types |
| Intangibility | `fiskheroes:intangibility` | Phase through blocks |
| Invisibility | `fiskheroes:invisibility` | Turn invisible |
| MetalSkin | `fiskheroes:metal_skin` | Armored skin (damage reduction) |
| PotionImmunity | `fiskheroes:potion_immunity` | Immunity to specific potion effects |
| PotionRetention | `fiskheroes:potion_retention` | Keep potion effects longer |
| ProjectileImmunity | `fiskheroes:projectile_immunity` | Deflect/ignore projectiles |
| PropelledFlight | `fiskheroes:propelled_flight` | Jetpack-style flight |
| Regeneration | `fiskheroes:regeneration` | Health regen (configurable factor) |
| Resistance | `fiskheroes:damage_resistance` | Partial damage type resistance |
| SentryMode | `fiskheroes:sentry_mode` | Stationary turret/guard mode |
| ShadowDome | `fiskheroes:shadowdome` | Darkness sphere (Grue-perfect) |
| ShadowForm | `fiskheroes:shadowform` | Shadow/wraith form |
| ShapeShifting | `fiskheroes:shape_shifting` | Disguise as another hero |
| Shield | `fiskheroes:shield` | Directional damage blocking with health/regen/cooldown |
| SizeManipulation | `fiskheroes:size_manipulation` | Grow/shrink (Ant-Man/Giant-Man) |
| SlowMotion | `fiskheroes:slow_motion` | Time perception slowdown |
| SonicWaves | `fiskheroes:sonic_waves` | Sound-based AoE attack |
| SpeedDisintegration | `fiskheroes:speed_disintegration` | Speed-based phasing/disintegration |
| Spellcasting | `fiskheroes:spellcasting` | Key-sequence spell system (duplication, drones, blindness, etc.) |
| SuperSpeed | `fiskheroes:super_speed` | Enhanced ground movement speed |
| Telekinesis | `fiskheroes:telekinesis` | Grab and move entities/items at range |
| Teleportation | `fiskheroes:teleportation` | Blink/teleport to target location |
| Tentacles | `fiskheroes:tentacles` | Doc Ock arms / tentacle appendages |
| Thorns | `fiskheroes:thorns` | Reflect damage to attackers |
| Transformation | `fiskheroes:transformation` | State toggle with timer (form switching) |
| WallCrawling | `fiskheroes:wall_crawling` | Climb walls |
| WaterBreathing | `fiskheroes:water_breathing` | Breathe underwater |
| Weakness | `fiskheroes:damage_weakness` | Vulnerability to specific damage types |
| WebSwinging | `fiskheroes:web_swinging` | Grapple/swing locomotion |

**Additional built-in features** (not modifiers but usable in powers):
- `fiskheroes:energy_bolt` — single-shot energy projectile (via energy projection modifier)
- `fiskheroes:repulsor_blast` — Iron Man-style ranged bolt
- `fiskheroes:spike_burst` / `fiskheroes:icicles` — area burst projectiles
- `fiskheroes:ground_smash` / `fiskheroes:earthquake` — ground-pound attacks
- `fiskheroes:leaping` — enhanced jump height
- HUD elements: `CHARGE`, `CIRCLE`, `PROGRESS` bar types for UI display

---

## 12. Specific Technical Questions

### Can Powers Place Blocks?

**No, not through the heropack API.** The only block interactions available are:

- `canDoGriefing: true` on modifiers like `ground_smash`, `earthquake`, `charged_beam`, `flame_blast` -- this **destroys** blocks but cannot place them
- `canBreakGlass: true` on `sonic_waves` -- specifically breaks glass blocks
- `fiskheroes:frost_walking` -- the one exception: this **places ice blocks** beneath the player's feet when walking on water, like vanilla Frost Walker enchantment. It's a built-in modifier, not an arbitrary block-placement API.

There is no way to place arbitrary blocks (e.g., Kaiser's metal walls, Vista's reshaped terrain) through the heropack system. The `frost_walking` modifier proves the engine *can* place blocks, but it's hardcoded behavior -- not something pack creators can extend.

**Implications for Worm:**
- **Kaiser** (metal projection): Cannot actually create metal walls/blades as blocks. Spike Burst + Icicles as reskinned projectiles remain the best option -- the "blades" are damage effects, not placed geometry.
- **Vista** (space warping): Cannot reshape terrain. Confirmed impossible.
- **Skitter** (silk constructs): Cannot place web blocks. Cosmetic only.

### Can Powers Invoke Custom Shaders?

**No custom shaders are available.** The renderer system operates within a fixed set of visual effects. No GLSL, no post-processing, no screen-space distortion.

What IS available for visual trickery:

1. **Trails** (`utils.bindTrail()`) -- Afterimage/motion blur effects behind the player. Configured via JSON in `/models/trails/`:
   ```json
   {
     "fade": 2,
     "lightning": { "color": "0x484848", "density": 4, "differ": 0.5, "opacity": 0.5 },
     "blur": { "color": "0x484848", "opacity": 0.6 }
   }
   ```
   Supports `lightning` (branching energy trails) and `blur` (afterimage ghost) components. Conditional via `.setCondition()`. Used by speedsters (Flash, A-Train, Quicksilver) and flyers (Thor).

2. **Forcefield** (`renderer.bindProperty("fiskheroes:forcefield")`) -- A spherical energy bubble around the player. Configurable color, shape (segments), offset, scale, opacity, and condition. Black Panther uses this for kinetic energy pulses. This is the closest thing to a "spatial distortion" visual.

3. **Overlay effects** (`renderer.createEffect("fiskheroes:overlay")`) -- Texture overlays with variable opacity on any body part. Can pulse, glow, or animate via data variables.

4. **Particles** (`utils.bindParticles()`) -- Built-in particle effects bound to conditions. Can't create new particle types but can trigger existing ones conditionally.

5. **Shadow Dome** -- The darkness sphere effect. Already identified for Grue.

**Implications for Vista:**
Vista's space-warping would need a visual representation. The `forcefield` property is actually the best candidate -- a translucent, tinted sphere around her could suggest a "warped space" zone, especially with animated opacity. Combined with teleportation (for the mechanical "move through warped space" effect) and telekinesis (for "pulling distant things closer"), the visual identity is... not great, but not nothing either. A custom forcefield sphere with a warping color pattern is the ceiling.

### How Do Existing Packs Handle Martial Arts / Melee Combat?

Several packs implement sophisticated melee combat, which is directly relevant to Contessa:

#### The `dual_punch` Animation System (Sabri Enhanced)
Used by **Black Panther**, **Wolverine**, and **Black Widow** (via her batons):
```javascript
addAnimation(renderer, "black_panther.PUNCH", "sabri:dual_punch")
    .setData((entity, data) => {
        data.load(entity.isPunching() ? entity.getInterpolatedData("fiskheroes:blade_timer") : 0);
    }).priority = -8;
```
This replaces the default punch animation with a custom dual-strike animation driven by `blade_timer`. When the player punches (`entity.isPunching()`), the animation plays a two-handed striking motion. Combined with the `blade` modifier for claws/batons, this creates a fast martial-arts feel.

#### Kratos / God of War -- Weapon Cycling + Combo System
The most sophisticated melee implementation in our reference packs:
- Multiple weapon modes cycled via keybinds (Leviathan Axe, Blades of Chaos, Draupnir Spear, bare fists)
- Each weapon has its own animations: unholster, first-person idle, throw aim, special attacks
- `dualwield` animation plays during `isPunching()` in Spartan Rage / Blades mode
- Weapon-specific runic attack cycles (cycling through special moves per weapon)
- Custom weapon 3D models attached to hands/back

#### DC Universe -- Alternating Punch Animations
The DC pack uses `punch_int` data to track punch state, enabling alternating left/right strikes. The Miscellaneous pack goes further with:
- `punch_right` / `punch_left` (BOOLEAN toggles)
- `punch_right_timer` / `punch_left_timer` (FLOAT_INTERP for animation blending)
- `punch_decider` (BYTE -- picks which punch comes next)

This creates an alternating combo system where each punch visually differs.

#### Key Animation APIs
- `addAnimation(renderer, name, animationFile)` -- register custom animation
- `addAnimationWithData(renderer, name, animationFile, dataKey)` -- animation driven by data
- `.setData((entity, data) => { data.load(...) })` -- programmatic animation control
- `.setCondition(entity => ...)` -- conditional animation activation
- `.priority` -- animation priority (higher overrides lower)
- `renderer.removeCustomAnimation("basic.BLOCKING")` -- remove default animations
- `entity.isPunching()` -- detect when player is attacking
- `entity.isSprinting()`, `entity.isSneaking()` -- movement state
- Custom `.fsk` animation files define the actual keyframed bone transforms

#### What This Means for Contessa
Contessa is actually quite implementable as a martial arts character:
- **High PUNCH_DAMAGE attribute** -- represents perfect strikes
- **`dual_punch` or custom alternating punch animation** -- fluid combat style
- **Slow-Motion Vision** -- represents Path to Victory awareness (world slows during combat)
- **Blade modifier** (optional) -- could represent a knife, toggled with custom animation
- **Custom dodge/evasion animation** -- could use sprint animation + high speed stats
- **Firearm** -- she canonically carries a gun; USE_GUN permission + pistol weapon
- No flight, no energy blasts, no super durability -- pure melee/gun skill character

The `dual_punch` system from Sabri (used by Black Panther/Wolverine) is the ideal starting point. The animation file itself (`sabri:dual_punch`) could even be reused or adapted.

Black Widow from Sabri Enhanced is actually the closest existing analog to Contessa -- skilled human fighter with batons/guns, no superpowers, custom dual melee animations. Her batons renderer (`black_widow_batons.js`) even shows how to add a `dual_punch` player animation to a weapon item.

### Can Powers Buff or Heal Allies?

**No direct heal/buff methods exist**, but `manager.setData` on other players is **theoretically possible** (untested by any existing pack). This was confirmed by decompiling the base mod JAR.

#### What's Available on Other Entities (JSEntityLiving API)

The `entity.world().getEntitiesInRangeOf(entity.pos(), range)` API returns nearby entities wrapped as `JSEntity` objects. Many packs use it for AoE damage. Full confirmed API on iterated entities:

**Read methods:**
- `other.isLivingEntity()`, `other.isPlayer()`, `other.is(type)`, `other.equals(entity)` -- type/identity checks
- `other.getHealth()`, `other.getMaxHealth()`, `other.getAbsorptionAmount()` -- health
- `other.getUUID()`, `other.getName()`, `other.getEntityName()` -- identity
- `other.pos()`, `other.eyePos()`, `other.motion()`, `other.getLookVector()` -- position/movement
- `other.hasPotionEffect(id)`, `other.hasStatusEffect(name)` -- read potion effects (but NOT apply them)
- `other.getData(key)`, `other.getInterpolatedData(key)` -- read Fisk data variables
- `other.isSneaking()`, `other.isSprinting()`, `other.isBurning()`, `other.isOnGround()`, etc.
- `other.isWearingFullSuit()`, `other.isPunching()`, `other.canSee(entity)`
- `other.team()` -- team info

**Action methods:**
- `other.hurtByAttacker(hero, type, msg, dmg, attacker)` / `other.hurt(hero, type, msg, dmg)` -- deal damage
- `other.playSound(sound, volume, pitch)` -- play sound at their location

**NOT exposed (no method on JSEntityLiving):**
- No `heal()`, `setHealth()`, `addPotionEffect()`, `setMotion()`, `setPosition()`, `teleport()`

#### The manager.setData Question (DECOMPILED)

Decompiling `JSDataManager.class`, `DataVar.class`, `DataVarDynamic.class`, `DataContainer.class`, and multiple built-in `DataVar` subclasses from the base mod JAR (`FiskHeroes-1.7.10-2.4.0.jar`) reveals that cross-player data manipulation is architecturally supported, and the scope is broader than just custom flags.

**The call chain:**

1. **`manager.setData(jsEntity, key, value)`** (`JSDataManager`) -- takes any `JSEntity`, no ownership check. Unwraps to vanilla `Entity` via `AccessorType.getEntity()` and passes to `setDataInternal()`
2. **`setDataInternal(entity, key, value, interpolated)`** -- looks up the `DataVar` by name string, coerces the value to the correct type (Float, Integer, Byte, Boolean, etc.), then calls `dataVar.set(entity, value)`. No permissions check at this level.
3. **`DataVar.set(entity, value)`** -- calls `legalUpdate(entity)`. If it passes, calls `setWithBypass()` which stores the value in the entity's `DataContainer` and syncs
4. **`legalUpdate(entity)`** -- checks two **optional** predicates:
   - `canSetE` (`Predicate<Entity>`) -- entity-level restriction
   - `canSetH` (`DataPredicate`) -- hero/suit-level restriction (checks via `HeroTracker.iter(entity)`)
   - Both are null-checked before testing. **If null, legalUpdate returns true** (no restriction)
5. **`DataContainer.get(entity)`** -- returns a valid container for any `EntityPlayer` (via `SHPlayerData`), returns **null for non-player mobs** (silently no-ops)

**Are predicates set on built-in variables?**

Decompiling the built-in `DataVar` subclasses (`DataVarAiming`, `DataVarBarrelRoll`, `DataVarSoundBool`, `DataVarSoundFloat`, `DataVarSoundFloatToggle`, `DataVarScopeTimer`, `DataVarSizeState`, `DataVarIntangible`, `DataVarShadowform`, `DataVarId`) reveals that **none of them call `pred()` or `pred2()` in their constructors**. They only call `super(defaultValue)` and optionally `setListener()`.

`DataVarInterp` declares `pred()`, `pred2()`, and `revokePerms()` as overrides for fluent chaining, meaning predicates *can* be set on interpolated timer variables -- but this would happen at registration time (builder pattern), not in the class itself. Without finding the exact registration class, we can't confirm which specific built-in variables have predicates set. However, the constructor evidence strongly suggests **most built-in variables have no entity predicates**.

**What this means: it's not just custom flags.**

`setDataInternal` resolves ANY registered data variable by name. This means you could potentially set built-in game-state variables on other players:

```javascript
// All of these pass through the same unrestricted path
manager.setData(other, "fiskheroes:flying", true);        // toggle flight state
manager.setData(other, "fiskheroes:intangible", true);     // toggle phasing
manager.setData(other, "fiskheroes:mask_open", true);      // toggle mask
manager.setData(other, "mypack:dyn/custom_flag", true);    // custom flag
manager.incrementData(other, "mypack:dyn/buff_timer", 20, true);  // custom timer
```

**Critical caveat**: setting a data variable on another player only produces a visible effect if that player's hero suit is actively reading and responding to that variable. Setting `fiskheroes:flying` on a player who isn't wearing a suit with `controlled_flight` would store the value but produce no gameplay effect. For players wearing suits from the same pack, however, the possibilities are significant.

**Limitations that remain hard:**
- No `heal()`, `setHealth()`, `addPotionEffect()` on the JSEntityLiving API -- cannot directly restore health or apply potion effects
- `DataContainer.get()` returns null for non-player mobs -- only works player-to-player
- Even if you set `fiskheroes:flying` on a suitless player, nothing reads it
- Some built-in vars may have predicates set at registration time that block external modification (unknown which ones without finding the registration class)

#### Implications for Worm

The cross-player `manager.setData` discovery significantly changes the feasibility picture for support characters, though everything here is **untested in practice**:

- **Panacea**: No direct heal method, but a pack-internal workaround is plausible. Panacea's tick handler could iterate nearby players with `getEntitiesInRangeOf`, and when she activates a keybind on a target, set `dyn/panacea_healed` on them + potentially set built-in vars to enable their `healing_factor` modifier or switch their `attributeProfile` to one with boosted `MAX_HEALTH`. The target hero's tick handler reads the flag and responds. Requires both heroes in the same pack.
- **Othala** (grants temporary powers): The most natural fit for this system. Could set flags/timers on allies that their tick handlers read to temporarily switch attribute profiles (boosted speed, damage, durability). The "power granting" maps cleanly to setting data that changes the target's `getAttributeProfile()` return value.
- **Glory Girl's awe aura**: Visual-only is fine thematically. But could also set a `dyn/inspired` flag on nearby allies that their suits read for a minor stat boost. Enemies could get a `dyn/fearful` flag that their suit reads to reduce stats -- though this only works if enemies are also wearing pack suits.
- **Regent** (body control): Still fundamentally impossible -- no APIs to control movement, facing direction, or force actions. Could potentially toggle `fiskheroes:intangible` or `fiskheroes:flying` on a target (griefing them), but that's not body control.
- **General support archetype**: Now theoretically possible within a single hero pack. The pattern is: Hero A sets data on Hero B → Hero B's tick handler detects the data and modifies its own behavior (attribute profiles, modifier enabling, timers). This is a cooperative system -- both heroes must be from the same pack and designed to interact.
- The `manager.setData` cross-player technique is **completely uncharted territory** -- no existing pack has attempted it. Would need real in-game testing to confirm it works as the bytecode suggests.

### Spellcasting System and Duplication

The `fiskheroes:spellcasting` modifier provides a built-in spell system activated via directional key sequences. Mysterio (Fisk Rework pack) uses it. Configuration is JSON-only:

```json
"fiskheroes:spellcasting": {
  "spells": {
    "fiskheroes:duplication": { "sequence": "ddaas", "cooldown": 120, "quantity": 5 },
    "fiskheroes:drones": { "sequence": "dwasdsa", "cooldown": 600, "quantity": 2, "range": 24.0, "damageProfile": {...} },
    "fiskheroes:blindness": { "sequence": "ssda", "cooldown": 100, "duration": 400, "range": 24.0 }
  }
}
```

**Built-in spell types** (all hardcoded in Java, not extensible):
- **`duplication`** -- spawns `EntitySpellDuplicate` entities that visually clone the player and circle around them. Configurable `quantity` and `cooldown`. These are actual spawned entities (one of the few cases), not renderer tricks.
- **`drones`** -- spawns attack drone entities with configurable damage profiles
- **`blindness`** -- applies blindness to nearby enemies within range
- **`earth_swallow`** -- ground-based trap/attack
- **`atmospheric`** -- weather/environment manipulation
- **`whip`** -- projectile whip attack

**Implications for Worm:**
- **Oni Lee** (clone teleporter): The `duplication` spell is a near-perfect match. Oni Lee creates clones that briefly persist. Combine `duplication` (creates circling copies) + `teleportation` for his signature move. The clones are visual decoys, not independently acting -- which matches Oni Lee's clones being short-lived and largely non-functional after he teleports away.
- The spellcasting system's key-sequence activation could also work for characters with complex power activations.

**Empty spell sequences are possible.** Red Robin (DC Universe pack) uses `"sequence": ""` for his drone spell, meaning it activates immediately via the SPELL_MENU keybind without requiring a directional combo. This is significant for Worm characters -- abilities can be mapped to a single button press rather than forcing awkward key sequences.

**Drone spell details:**
Drones are autonomous attack entities that orbit the player at `centerDist` and fire at enemies within `range`. Configurable: `quantity` (number of drones), `centerDist` (orbit radius), `range` (attack range), `cooldown`, and full `damageProfile` for their attacks. Both Mysterio and Red Robin use BULLET damage type. Drones are spell-only entities.

**Wonder Woman's "Whip" is NOT the spell whip.**
The DC Universe pack's Wonder Woman uses `fiskheroes:telekinesis` (grab mechanic) reskinned as a lasso:
- A `fiskheroes:transformation` toggle (key "LASSO") switches into lasso mode using the `fiskheroes:dyn/nanites` data flag
- When lasso mode is active, telekinesis and aim keybinds become available
- Damage profile changes to MAGIC/BLUNT with +5.0 reach distance
- Sound events use shadowchain sounds to create a whip/lasso feel
- This is a creative non-spell workaround: telekinesis grab = lasso grab, with renderer visuals doing the rest

This proves that the spell whip (`fiskheroes:whip`) remains a spell-only mechanic. However, a whip-like *grab* effect can be approximated using telekinesis with custom sounds and visuals.

**Implications for Skitter (Swarm Powers):**
Skitter is one of the most important Worm characters and several spell types are directly relevant:
- **Swarm clones** → `fiskheroes:duplication` -- spawns visual copies that circle around Skitter. These would represent her bug-clone decoys. Use empty sequence `""` for instant activation.
- **Swarm blindness** → `fiskheroes:blindness` -- applies blindness to nearby enemies within range. Perfect for Skitter's signature "cover someone's face in bugs" tactic. Configurable `range` and `duration`.
- **Swarm attacks** → `fiskheroes:drones` -- autonomous attack entities that orbit and fire at enemies. Could represent swarms of attacking insects. Configurable quantity, range, and damage.
- All three can be combined under a single `fiskheroes:spellcasting` modifier, giving Skitter three distinct swarm abilities from one power set.
- The spell system means Skitter requires spellcasting to access her most thematic abilities. This is a trade-off: the mechanic doesn't feel like "insect control," but the functional result (decoys, blinding, autonomous attacks) maps well to her canon powers.

### Telekinesis System (DECOMPILED)

The `fiskheroes:telekinesis` modifier is a **hardcoded Java system** with limited JSON configuration:

**Configurable via JSON:**
- `range` (float) -- grab distance (10-48 blocks in existing packs)
- `canGrab` -- what can be grabbed: `mobs`, `items`, `projectiles`, `inanimates` (all booleans)
- `telekinesis` -- interaction options: `crushMelons`, `crushThrowables`, `squeezeChickens`, `explodeCreepers`, `destroyInanimates`
- `soundEvents` -- grab sounds
- Scroll wheel controls distance of held entity

**Movement is hardcoded (decompiled from `ModifierTelekinesis.onUpdate`):**
The grabbed entity's motion is set on all three axes simultaneously:
```
entity.motionX = entity.motionX * 0.2 + lookVector.x * 0.2
entity.motionY = entity.motionY * 0.2 + lookVector.y * 0.2
entity.motionZ = entity.motionZ * 0.2 + lookVector.z * 0.2
```
There is **no config option to restrict to horizontal-only movement**. The look vector drives all three axes equally, and this is Java code, not overridable from heropacks.

**Can heropack JS access the grabbed entity?** Yes -- `entity.getData("fiskheroes:grab_id")` returns the ID, and `entity.world().getEntityById(id)` retrieves it. Multiple packs use this to apply damage to the grabbed entity (squeeze-to-death mechanic). But the movement itself is handled by the Java modifier and cannot be customized.

**Implications for Regent:**
Telekinesis cannot selectively "walk" a target around (horizontal only). The grab lifts them into the air along wherever you look. Regent's puppet control remains impossible through standard telekinesis. The best approximation would be telekinesis for the "grab and hold" visual combined with custom tick handler damage/effects on the grabbed entity.

### Complete JS API Surface (DECOMPILED)

Full method lists from decompiling the base mod JAR classes:

#### JSWorld (`entity.world()`)
- `getDimension()` -- dimension ID (0=overworld, -1=nether, 1=end)
- `name()` -- world name
- `isDaytime()`, `isRaining()`, `isThundering()` -- weather/time
- `blockAt(x, y, z)` / `blockAt(JSVector3)` -- returns `JSBlock` at position
- `getBlock(x, y, z)` / `getBlock(JSVector3)` -- returns block name string
- `getBlockMetadata(x, y, z)` -- block metadata
- `getEntityById(id)` -- retrieve entity by numeric ID
- `getLocation(x, y, z)` -- returns `JSLocation` with biome info
- `getEntitiesInRangeOf(pos, radius)` -- entity iteration
- `isUnobstructed(pos1, pos2)` -- line-of-sight check

#### JSBlock (`world.blockAt(x,y,z)`)
- `name()` -- block registry name (e.g., "minecraft:stone")
- `metadata()` -- block metadata/variant
- `hardness()` -- block hardness value
- `isSolid()` -- solidity check
- `isEmpty()` -- air check
- `matches(otherBlock)` -- comparison
- `item()` -- corresponding item
- `itemDropped()` -- what it drops

#### JSPlayer (`entity.as("PLAYER")`)
Extends JSEntityLiving with:
- `isCreativeMode()` -- gamemode check
- `getFoodLevel()`, `getFoodSaturation()` -- hunger
- `getExperience()`, `getExperienceLevel()` -- XP
- `isUsingItem()`, `isBlocking()` -- action state
- `addChatMessage(message)` -- send chat message to player
- `isInControlPoint()`, `getControlPointIn()` -- FiskTag game mode

#### JSLocation (`world.getLocation(x,y,z)`)
- `biome()` -- biome name
- `canSnow()`, `canRain()`, `isHighHumidity()` -- climate
- `getTemperature()`, `getRainfall()` -- biome stats
- `getStructure()` -- structure name if in a structure

#### JSVector3
Full 3D vector math: `add`, `subtract`, `multiply`, `dot`, `normalized`, `distanceTo`, `squareDistanceTo`, `length`, component accessors (`x()`, `y()`, `z()`), and 2D projections (`xy()`, `xz()`, etc.)

#### JSItem (`entity.getHeldItem()`, `entity.getWornChestplate()`, etc.)
- `name()`, `displayName()`, `stackSize()`, `damage()`, `maxDamage()`
- `isWeapon()`, `isRifle()`, `isGun()`, `isLaserGun()`, `doesNeedTwoHands()`
- `isEnchanted()`, `hasEnchantment(id)`, `getEnchantmentLevel(id)`
- `isRenamed()`, `suitType()`
- `nbt()` -- access NBT data for persistent storage
- `isEmpty()`, `matches(otherItem)`

#### JSDisplayEntity (`entity.as("DISPLAY")`)
Used for armor stands and display cases in-game:
- `isStatic()` -- whether the display is a static prop
- `getDisplayType()` -- type string (e.g., "HOLOGRAM", "DISPLAY_STAND")
- `isInGui()` -- whether being rendered in a GUI
- `isSkinShown()` -- skin visibility

#### Notable API Gaps
- **No block placement** (`world` is read-only -- `blockAt`/`getBlock` can read but not write)
- **No entity spawning** (duplication spell spawns entities but that's hardcoded Java)
- **No entity healing/buffing** (only `hurt`/`hurtByAttacker` on other entities)
- **No motion setting** on entities from JS (only readable via `motion()`, `motionX()`, etc.)
- **No potion effect application** (only readable via `hasPotionEffect`/`hasStatusEffect`)
- **No inventory manipulation** (can read items but not modify them, except NBT on worn suit pieces)
- **No homing/tracking projectiles** (all projectiles are straight-line, see below)

### Are Homing/Tracking Projectiles Possible?

**No.** All projectile types in FiskHeroes are straight-line. Decompiling `EntityEnergyBolt` confirms it extends `EntityThrowable` with no target tracking, course correction, or lock-on logic. No `ModifierHoming` or similar class exists in the base mod.

**Available ranged attack modifiers** (all fire in a straight line from the player's aim):
- `repulsor_blast` -- single energy bolt. Config: `damage`, `range`, `speed`, `spread`, `radius`, `cooldownTime`
- `energy_bolt` -- similar straight-line projectile
- `energy_projection` -- continuous beam
- `charged_beam` -- charge-up beam (heat vision style). Config: `chargeTime`, `duration`, `cooldownTime`, `range`, `radius`
- `spike_burst` / `icicles` -- area burst projectiles
- `flame_blast` -- flame projectile
- `sonic_waves` -- sound-based attack

None of these support homing, tracking, or curved trajectories. There is no JSON property to enable target-seeking behavior on any projectile type.

**Visual workaround for Legend:**
Legend's signature curved/homing lasers can't mechanically track targets, but the visual impression could be partially faked. The `energy_projection` or `repulsor_blast` modifiers still produce satisfying laser effects -- Legend would play as a flying energy blaster who fires powerful straight-line lasers. The actual damage output (high damage, long range, rapid fire via low `cooldownTime`) can be very Legend-appropriate even without homing.

For the "visual homing" impression, renderer-side tricks could help:
- **Trail effects** (`utils.bindTrail()`) with energy-colored afterimages could suggest rapid repositioning/curving
- **Multiple projectile types** (e.g., `repulsor_blast` for single target, `spike_burst` for area saturation) could approximate his versatility
- **Overlay effects** during aiming could suggest target lock-on visually even though projectiles fly straight
- The `spread` parameter on `repulsor_blast` could create a shotgun-like spray that visually suggests multiple tracking beams hitting a wide area

---

# Session Research Notes (Ongoing)

## Entity API — Methods Available on Other Entities

Retrieved via `entity.world().getEntitiesInRangeOf(entity.pos(), range)`.

### Identification
- `getName()` — player name or custom name; "unknown" for invalid entities
- `getEntityName()` — entity type: "zombie", "skeleton", "creeper" etc.
- `getUUID()` — unique identifier
- `is("PLAYER")` / `isPlayer()` — type check
- `as("PLAYER")` — cast to player type
- `isLivingEntity()` — living entity check
- `isAlive()` — health > 0

### Position & Movement
- `pos()` / `posX()` / `posY()` / `posZ()` — position
- `eyePos()` — head/eye position
- `motion()` / `motionX()` / `motionY()` / `motionZ()` — velocity vector
- `motionInterpolated()` — smoothed velocity
- `getLookVector()` — direction entity is looking
- `rotYaw()` / `rotPitch()` / `rotation()` — rotation angles

### State
- `isSneaking()`, `isSprinting()`, `isInvisible()`, `isOnGround()`, `isInWater()`, `isPunching()`
- `hasPotionEffect(id)` — check for potion effect
- `getData(key)` — read data vars (works cross-entity)

### Health & Equipment
- `getHealth()` / `getMaxHealth()`
- `getWornHelmet()` / `getWornChestplate()` / `getWornLeggings()` / `getWornBoots()` — armor items
- `getEquipmentInSlot(slot)` — 0=helmet, 1=chest, 2=legs, 3=boots
- `getHeldItem()` — held item
- NBT access: `getWornChestplate().nbt().getString("HeroType")` — reads hero ID from suit

### World & Interaction
- `world()` — world object
- `world().getBlock(position)` / `world().getBlockMetadata(position)`
- `world().isUnobstructed(pos1, pos2)` — line of sight check
- `world().getDimension()` — dimension ID (0=overworld, 2595=moon)
- `world().getEntitiesInRangeOf(pos, range)` — entity detection
- `canSee(other)` — line of sight + visibility check
- `equals(other)` — identity check

### Actions on Other Entities
- `other.hurt(heroRef, profileName, deathMsg, damage)` — deal damage
- `other.playSound(soundId, volume, pitch)` — play sound at their location
- `entity.as("PLAYER").addChatMessage(text)` — send chat message (to self only)

---

## Rendering Effects on Other Entities (UNSOLVED)

**Problem**: Renderer effects (glowerlay, overlay, booster, model, lines, particles) all anchor to the HERO's body parts. No built-in way to render at another entity's position.

**Hack approach — dynamic offset calculation**:
In `render()`, calculate world-space delta between hero and target, convert to model space (×16), counter-rotate by hero's yaw to cancel body-part rotation:
```javascript
var dx = (other.posX() - entity.posX()) * 16;
var dz = (other.posZ() - entity.posZ()) * 16;
var dy = (other.posY() - entity.posY()) * 16;
var yaw = entity.rotYaw() * Math.PI / 180;
var rx = dx * Math.cos(yaw) + dz * Math.sin(yaw);
var rz = -dx * Math.sin(yaw) + dz * Math.cos(yaw);
effect.setOffset(rx, dy + bodyOffset, rz);
effect.render();
```

**Unknowns (need testing)**:
1. Can renderer call `entity.world().getEntitiesInRangeOf()`? (works in tick handler, untested in renderer)
2. Can `setOffset()` be called dynamically each frame? (effects created in initEffects, offset set in render)
3. Does the coordinate math line up? (model space units, anchor rotation, body offset)
4. Performance with multiple targets?

**Alternative approaches**:
- Apply Glowing potion effect to targets (server-side, visible to all players)
- Audio ping only (Daredevil/Spider-Man pattern)
- Chat readout with entity names/health
- Radar ring effect on hero pointing toward threats

---

## Detection Patterns (from reference packs)

### Daredevil Radar Sense (hells-kitchen pack)
- Passive detection: 10 blocks, plays sound on first detection
- Active detection: 64 blocks with mask open, chat readout of names + health
- Visual: `fiskheroes:lines` effect with circle shape, expands on detection
- Data var: `hell:dyn/sensed` (FLOAT_INTERP) drives visual fade

### Spider-Man Spider Sense (hells-kitchen pack)
- Passive: 8 blocks, detects living entities AND projectiles (arrows)
- Arrow detection: checks `getEntityName()` contains "arrow"
- Sound: quiet ping at 0.1 volume
- Visual: custom model on head

### Common Detection Filter
```javascript
var isNull = other.getName() == "unknown" && other.getEntityName() == null;
if (!entity.equals(other) && other.isLivingEntity() && !isNull) { ... }
```

---

## Miscellaneous Discoveries

### Dimension IDs
- 0 = Overworld
- 2595 = Moon
- Night vision glitches on moon (permanent darkness → black blocks). Fix: disable via `setCondition` in renderer checking `getDimension() != 2595`.

### Healing Factor vs Regeneration
- `fiskheroes:regeneration` — multiplies vanilla hunger-gated regen. Useless at low hunger.
- `fiskheroes:healing_factor` — passive regen independent of hunger. `delay` = ticks after last damage before healing starts (NOT interval between heals).
- Pipe syntax for variants: `"fiskheroes:healing_factor|energy_form"`, gate with `modifier.id() == "energy_form"`

### Teleportation
- `fiskheroes:teleportation` modifier with `range` and `canReachMoon` options
- Cancels flight on teleport. Attempted fix: detect `fiskheroes:teleport_delay` going from >0 to 0 in tick handler, then `manager.setData(entity, "fiskheroes:flying", true)`. STATUS: untested, may not work.
- Sound: `"fiskheroes:breach"` is the default teleport sound

### Flight State
- `manager.setData(entity, "fiskheroes:flying", true/false)` — programmatically enable/disable flight from tick handler
- Used by multiple reference packs (Skayr always-fly, Spider-Man jump kick, Pixie shield-disables-flight)

---

## Dynamic Offset Experiment (Entity Marker Rendering)

### What works
- `fiskheroes:shield` effect supports `setOffset()` called dynamically every frame in `render()` (confirmed by Agent Liberty reference + our testing)
- `entity.world().getEntitiesInRangeOf()` WORKS in the renderer context
- Shield effect renders in 1st person when anchored to "rightArm" (but only when arm is visible / empty hand)
- `setScale()` works dynamically on `fiskheroes:lines` effects (Daredevil radar)

### What doesn't work
- `setOffset()` does NOT update dynamically on `fiskheroes:lines` or `fiskheroes:particles`
- `fiskheroes:glowerlay` cannot be offset at all (tied to hero skin texture, crashes if you try anchor.set)
- `fiskheroes:booster` with invalid icon resource crashes the whole renderer/pack

### Yaw counter-rotation (UNSOLVED)
The offset is in model space, rotating with the body anchor's yaw. Counter-rotating by `entity.rotYaw()` partially works but has drift — the marker moves when turning the camera even when the target is stationary. The rotation matrix needs more work, possibly accounting for body vs head yaw, interpolation, or a different coordinate basis.

### Test code (shield marker tracking nearest entity)
```javascript
// In initEffects:
senseMarker = renderer.createEffect("fiskheroes:shield");
senseMarker.anchor.set("rightArm");
senseMarker.setRotation(0, 90, 0);

// In render():
try {
    var nearby = entity.world().getEntitiesInRangeOf(entity.pos(), 16);
    var closest = null;
    var closestDist = 999;
    for (var i = 0; i < nearby.length; i++) {
        var other = nearby[i];
        if (!entity.equals(other) && other.isLivingEntity()) {
            var tdx = other.posX() - entity.posX();
            var tdz = other.posZ() - entity.posZ();
            var dist = tdx * tdx + tdz * tdz;
            if (dist < closestDist) {
                closestDist = dist;
                closest = other;
            }
        }
    }
    if (closest != null) {
        var dx = (closest.posX() - entity.posX()) * 16;
        var dy = (closest.posY() - entity.posY()) * 16;
        var dz = (closest.posZ() - entity.posZ()) * 16;
        var yaw = entity.rotYaw() * Math.PI / 180;
        var rx = dx * Math.cos(yaw) - dz * Math.sin(yaw);
        var rz = dx * Math.sin(yaw) + dz * Math.cos(yaw);
        senseMarker.setOffset(rx, dy + 12, rz);
        senseMarker.unfold = 1.0;
    } else {
        senseMarker.unfold = 0.0;
    }
    senseMarker.render();
} catch (e) {}
```

---

## Entity Look-At Detection (Crosshair Targeting)

Can identify what entity the player is looking at using dot product of look vector vs direction to entity:

```javascript
// From Bullseye (hells-kitchen pack) — angle between crosshair and entity
var angle = Math.acos(Math.max(-1, Math.min(1,
    entity.getLookVector().dot(
        other.eyePos().add(0, 0.55, 0).subtract(entity.eyePos()).normalized()
    )
))) * (180 / Math.PI);
// angle < 5 = basically looking right at them
```

### Available vector methods on pos/lookVector
- `pos().subtract(other.pos())` — vector subtraction
- `.normalized()` — unit vector
- `.dot(other)` — dot product
- `.x()`, `.y()`, `.z()` — component access
- `.add(x, y, z)` — vector addition

### Directional helper (from hells-kitchen useful.js)
```javascript
function getDirection(playerPos, entityPos, playerLookVector) {
    var directionToEntity = entityPos.subtract(playerPos).normalized();
    var dot = playerLookVector.x() * directionToEntity.x()
            + playerLookVector.y() * directionToEntity.y()
            + playerLookVector.z() * directionToEntity.z();
    dot = Math.max(-1, Math.min(dot, 1));
    var angle = Math.acos(dot) * (180 / Math.PI);
    var crossProduct = (playerLookVector.x() * directionToEntity.z())
                     - (playerLookVector.z() * directionToEntity.x());
    return (crossProduct < 0 ? -angle : angle) / 180;
    // Returns -1 to 1: 0 = directly ahead, ±1 = behind, ±0.5 = left/right
}
```

### Potential uses
- Danger Sense: detect entity under crosshair, display info via chat/HUD
- Target lock: identify aimed-at entity for special attacks
- Skitter's swarm sense: highlight entity being looked at

---

### Remaining issues to solve if revisited
1. Yaw drift — need correct rotation matrix for body space
2. 1st person visibility requires rightArm anchor (only visible with empty hand)
3. Renders a chunk of the hero's own texture — would need a custom texture
4. No way to render on multiple targets simultaneously (one shield effect = one marker)

### Lines effect (`fiskheroes:lines`) — pointer test
- `setRotation` DOES update dynamically each frame
- But rotation axis mapping is unclear — angle applied to Y or Z both produced wrong behavior (vertical spinning, erratic rotation)
- Color `.color.set()` didn't apply (showed white despite setting green) — unknown why, works in other packs
- Lines are 3rd-person only (not visible in 1st person)
- Primarily designed for cosmetic auras (lightning arcs, spell circles, radar pulses), not directional indicators
- **Verdict**: Not suitable for entity-tracking pointers

### Screen-space effects available
- `fiskheroes:night_vision` — brightness boost, has `.factor` and `.firstPersonOnly`
- `fiskheroes:camera_shake` — screen vibration, has `.factor` and `.intensity`
- `fiskheroes:opacity` — full-body transparency (invisibility)
- `fiskheroes:shadowdome` — dark dome overlay with custom texture
- **No general-purpose HUD drawing API exists**

### Forcefield as screen tint (Daredevil "World on Fire" trick)
Hell's Kitchen pack uses small forcefields colored `0x5a1a1a` (dark red) placed on camera as a first-person-only screen tint. Combined with `night_vision.factor = 1` for the "world on fire" red vision effect. Could be repurposed as a proximity warning tint (flash screen edges when enemies nearby), but no directional info.

### Spider Sense / Danger Sense implementations (Hell's Kitchen pack)
Best reference: `hells-kitchen-1-4-3/assets/hell/data/heroes/spider_man.js` and `hell/renderers/heroes/spider_man.js`

**Detection (tick handler, hero data side):**
```javascript
entity.world().getEntitiesInRangeOf(entity.pos(), 8).forEach((other, index) => {
    var isNull = other.getName() == "unknown" && other.getEntityName() == null;
    var main_cond = other.isLivingEntity() && !isNull;
    var arrow_cond = false;
    if (String(other.getEntityName()).toLowerCase().indexOf("arrow") > -1) {
        arrow_cond = other.world().getBlock(other.eyePos().add(other.motion().normalized())) == "minecraft:air";
    }
    if (!entity.equals(other) && (main_cond || arrow_cond) && entity.getData("hell:dyn/sensed") == 0) {
        entity.playSound("hell:spider_man.sense", 0.1, 1.15 - Math.random() * 0.3);
        manager.setInterpolatedData(entity, "hell:dyn/sensed", 1);
    }
});
manager.incrementData(entity, "hell:dyn/radar", 5, 40, entity.getData("hell:dyn/sensed") > 0.8);
manager.incrementData(entity, "hell:dyn/sensed", 170, false);
```
- Runs in tick handler (hero data JS), not renderer
- Detects living entities + incoming arrows within 8 blocks
- Sets `sensed` to 1 on detection, decays over 170 ticks
- `radar` ramps up to 40 over 5 ticks while `sensed > 0.8`, used for visual fade-in

**Visual (renderer side):**
- 3D model overlay on head: `renderer.createEffect("fiskheroes:model")` with custom spider sense mesh
- Fades in/out based on `hell:dyn/radar` interpolated data
- Only renders in HELMET renderLayer

**Audio:**
- `entity.playSound(soundName, volume, pitch)` — plays once on first detection
- Pitch randomized: `1.15 - Math.random() * 0.3`

**Daredevil variant** — also prints entity names + health to chat:
```javascript
var getName = other.getName().split('').map(c => "\u00A74" + c).join('');
// prints red-colored entity list with health values
if (PackLoader.getSide() == "SERVER") {
    entity.as("PLAYER").addChatMessage(print);
}
```

**Key takeaway**: Detection runs server-side in tick handler, visual is just a model fade. No directional indicators — just "danger nearby" pulse. Daredevil adds info readout via chat. This is the best existing pattern for Eidolon's Danger Sense.

---

## Potion Effects via Beam Damage Profiles

Beams (and any modifier with a `damageProfile`) can apply potion effects on hit via the `EFFECTS` property:

```json
"damageProfile": {
    "damage": 4.0,
    "types": { "COLD": 1.0 },
    "properties": {
        "EFFECTS": [{ "id": "minecraft:slowness", "duration": 300, "amplifier": 8, "chance": 1 }]
    }
}
```
- `duration` = ticks (20 ticks = 1 second)
- `amplifier` = level minus 1 (amplifier 8 = Slowness IX)
- `chance` = 0.0–1.0 probability per hit
- Multiple effects can be stacked in the array

### All Minecraft 1.7.10 Potion Effects

| ID | Effect | +/- | Notes |
|----|--------|-----|-------|
| `minecraft:speed` | Speed | + | Movement speed boost |
| `minecraft:slowness` | Slowness | - | Used by Legend's ice beams |
| `minecraft:haste` | Haste | + | Faster mining/attack speed |
| `minecraft:mining_fatigue` | Mining Fatigue | - | Slower mining/attack |
| `minecraft:strength` | Strength | + | Melee damage boost |
| `minecraft:instant_health` | Instant Health | + | Immediate HP restore |
| `minecraft:instant_damage` | Instant Damage | - | Immediate HP loss |
| `minecraft:jump_boost` | Jump Boost | + | Higher jumps, less fall damage |
| `minecraft:nausea` | Nausea | - | Screen wobble/distortion |
| `minecraft:regeneration` | Regeneration | + | HP over time |
| `minecraft:resistance` | Resistance | + | Damage reduction |
| `minecraft:fire_resistance` | Fire Resistance | + | Immunity to fire/lava |
| `minecraft:water_breathing` | Water Breathing | + | No drowning |
| `minecraft:invisibility` | Invisibility | + | Transparent player |
| `minecraft:blindness` | Blindness | - | Reduced vision range |
| `minecraft:night_vision` | Night Vision | + | Full brightness |
| `minecraft:hunger` | Hunger | - | Food bar drains faster |
| `minecraft:weakness` | Weakness | - | Reduced melee damage |
| `minecraft:poison` | Poison | - | DoT (can't kill, stops at 1 HP) |
| `minecraft:wither` | Wither | - | DoT (CAN kill) |
| `minecraft:health_boost` | Health Boost | + | Extra max HP |
| `minecraft:absorption` | Absorption | + | Yellow bonus hearts |
| `minecraft:saturation` | Saturation | + | Restores food/saturation |

### Potion Particles
No way to hide potion particles in 1.7.10 — the `ambient`/`showParticles` flag was added in 1.8. Swirling particles are hardcoded to active potion effects. Untested whether Fisk's mod patches this.

### Applications for Worm Characters
- **Blindness**: Grue's darkness, Imp's stranger effect on targets
- **Nausea**: Labyrinth's space warping, psychic attacks
- **Weakness + Slowness**: Clockblocker's touch (extreme amplifier = near-frozen)
- **Wither**: Bonesaw's plagues, Crawler's acid
- **Poison**: Skitter's bug venom
- **Strength**: Brute powers (Lung ramping up)
- **Resistance**: Adaptive defenses (Crawler, Lung)
- **Instant Damage**: Flechette's sting, Foil's power
- **Mining Fatigue**: Could simulate power-dampening effects
