// Eidolon — 3 slots drawing from shared power pool
//
// Power indices (unified):
//   Key 4 group: 0=Gravity Control, 1=Energy Absorption, 2=Lightning Storm, 3=Conjure Tech
//   Key 5 group: 4=Chronokinesis, 5=Aerokinesis, 6=Bubble, 7=Illusions
//   Passive:     8=Damage Reflection, 9=Energy Form, 10=Crystal Armor, 11=Intangibility, 12=Flicker Regen, 13=Danger Sense, 14=Plant Growth, 15=Ice Formation
//
// Any power can go in any slot. Constraint: at most one Key 4 power and one Key 5 power across all slots.

// Situational needs — Eidolon's shard gives him what he needs
// Critical needs (FALLING, SUFFOCATING, VERY_HURT) restrict pool to only powers answering them
// Otherwise, pool = all powers answering any active need, 1 copy per need answered
var NEED_CRITICAL = { FALLING: true, SUFFOCATING: true, VERY_HURT: true };

function getActiveNeeds(entity) {
    var needs = {};
    // Critical
    if (!entity.isOnGround() && entity.motionY() < -0.5) needs.FALLING = true;
    if (entity.getAir() < 200) needs.SUFFOCATING = true;
    if (entity.getHealth() < entity.getMaxHealth() * 0.35) needs.VERY_HURT = true;
    // High
    if (entity.getData("fiskheroes:time_since_damaged") < 40) needs.HURT = true;
    var inCombat = entity.getData("fiskheroes:time_since_damaged") < 100;
    if (inCombat) needs.COMBAT = true;
    // Low
    if (!hasFlightPower(entity)) needs.GROUNDED = true;
    if (entity.isInWater()) needs.WATER = true;
    if (!inCombat) needs.PEACE = true;
    // Capes — nearby entities wearing superhero chestplates
    var nearby = entity.world().getEntitiesInRangeOf(entity.pos(), 16.0);
    for (var i = 0; i < nearby.length; i++) {
        var other = nearby[i];
        if (other.getUUID() != entity.getUUID() && other.isLivingEntity()) {
            var chest = other.getEquipmentInSlot(3);
            if (chest != null && chest.name() == "fiskheroes:superhero_chestplate") {
                needs.CAPES = true;
                break;
            }
        }
    }
    return needs;
}

var POWERS = [
    { label: "\u00A7aGravity Control", keyGroup: 4, answers: ["COMBAT", "FALLING", "GROUNDED"] },
    { label: "\u00A7bEnergy Absorb", keyGroup: 4, answers: ["COMBAT", "HURT", "WATER"] },
    { label: "\u00A7eLightning Storm", keyGroup: 4, answers: ["COMBAT", "FALLING", "GROUNDED"] },
    { label: "\u00A7bConjure Tech", keyGroup: 4, answers: ["COMBAT", "PEACE", "WATER"] },
    { label: "\u00A7eChronokinesis", keyGroup: 5, answers: ["COMBAT"] },
    { label: "\u00A7fAerokinesis", keyGroup: 5, answers: ["COMBAT", "FALLING", "GROUNDED"] },
    { label: "\u00A79Bubble", keyGroup: 5, answers: ["COMBAT", "HURT", "VERY_HURT", "CAPES"] },
    { label: "\u00A7dIllusions", keyGroup: 5, answers: ["COMBAT", "CAPES"] },
    { label: "\u00A76Dmg Reflect", keyGroup: 0, answers: ["COMBAT", "HURT"] },
    { label: "\u00A7dEnergy Form", keyGroup: 0, answers: ["COMBAT", "VERY_HURT", "FALLING", "GROUNDED", "SUFFOCATING"] },
    { label: "\u00A73Crystal Armor", keyGroup: 0, answers: ["COMBAT", "HURT", "VERY_HURT"] },
    { label: "\u00A78Intangibility", keyGroup: 0, answers: ["VERY_HURT", "FALLING", "GROUNDED", "SUFFOCATING"] },
    { label: "\u00A7aFlicker Regen", keyGroup: 0, answers: ["HURT", "VERY_HURT"] },
    { label: "\u00A7eDanger Sense", keyGroup: 0, answers: ["PEACE", "CAPES"] },
    { label: "\u00A72Plant Growth", keyGroup: 0, answers: ["PEACE", "COMBAT", "CAPES"] },
    { label: "\u00A7bIce Formation", keyGroup: 0, answers: ["WATER", "PEACE", "CAPES"] }
];
var POWER_COUNT = POWERS.length;
var SLOT_KEYS = ["worm:dyn/slot1", "worm:dyn/slot2", "worm:dyn/slot3"];
var HIST_KEYS = ["worm:dyn/eidolon_hist0", "worm:dyn/eidolon_hist1", "worm:dyn/eidolon_hist2", "worm:dyn/eidolon_hist3", "worm:dyn/eidolon_hist4"];
var HIST_EMPTY = 99; // sentinel: no history entry (BYTEs init to 0, so we set these in tick)
var DEFAULT_POWERS = [0, 4, 8]; // Gravity, Chrono, Dmg Reflect

var speedster_base = implement("fiskheroes:external/speedster_base");

var heroRef = null;
var prevHealth = -1;
var dangerSenseTicks = 99; // start near threshold so first scan fires quickly
var DANGER_SENSE_INTERVAL = 100; // 5 seconds
var DANGER_SENSE_RANGE = 16.0;
// Equipment slot count — register enough air slots for all item-giving powers combined
var EQUIPMENT_SLOTS = 16;

// Items granted by each power index (only powers that give items need entries)
var POWER_ITEMS = {};
POWER_ITEMS[3] = [  // Conjure Tech
    "fiskheroes:cold_gun",
    "fiskheroes:heat_gun",
    "fiskheroes:grappling_gun",
    "fiskheroes:holographic_display_stand",
    ["minecraft:tnt", 0, 64],
    ["minecraft:piston", 0, 64],
    ["minecraft:dispenser", 0, 64],
    ["minecraft:stone_pressure_plate", 0, 64]
];

POWER_ITEMS[14] = [  // Plant Growth
    ["minecraft:log", 0, 64],
    ["minecraft:leaves", 0, 64],
    ["minecraft:sapling", 0, 64],
    ["minecraft:vine", 0, 64],
    ["minecraft:cactus", 0, 64],
    ["minecraft:melon_block", 0, 64],
    ["minecraft:waterlily", 0, 64]
];

POWER_ITEMS[15] = [  // Ice Formation (always)
    ["minecraft:snow", 0, 64],
    ["minecraft:snowball", 0, 16],
    ["minecraft:snow_layer", 0, 64],
    ["fiskheroes:ice_layer", 0, 64]
];

// Extra items granted when in water (keyed by same power index)
var POWER_ITEMS_WATER = {};
POWER_ITEMS_WATER[15] = [  // Ice Formation (water only — freezing water into solid ice)
    ["minecraft:ice", 0, 64],
    ["minecraft:packed_ice", 0, 64]
];

// Track which item-giving powers were active last tick
var prevItemPowers = {};
var prevInWater = false;
var prevHadFlight = false;

// Count how many items all active item-giving powers should provide
function expectedItemCount(entity) {
    var count = 0;
    var inWater = entity.isInWater();
    for (var p in POWER_ITEMS) {
        if (hasPower(entity, Number(p))) {
            count += POWER_ITEMS[p].length;
            if (inWater && POWER_ITEMS_WATER[p]) {
                count += POWER_ITEMS_WATER[p].length;
            }
        }
    }
    return Math.min(count, EQUIPMENT_SLOTS);
}

// Append items from a list to equipment NBT
function appendItems(items, equipment, manager, idx) {
    for (var i = 0; i < items.length && idx < EQUIPMENT_SLOTS; i++) {
        // Entries: "item_name" | ["item_name", damage] | ["item_name", damage, count]
        var entry = items[i];
        var itemName = typeof entry == "string" ? entry : entry[0];
        var dmg = typeof entry == "string" ? 0 : entry[1];
        var count = (typeof entry != "string" && entry.length > 2) ? entry[2] : 1;
        var itemId = typeof itemName == "number" ? itemName : PackLoader.getNumericalItemId(itemName);
        var tag = manager.newCompoundTag("{Index:" + idx + ",Item:{id:" + itemId + "s,Count:" + count + ",Damage:" + dmg + "}}");
        manager.appendTag(equipment, tag);
        idx++;
    }
    return idx;
}

// Rebuild equipment from all active item-giving powers, packed sequentially
function rebuildEquipment(entity, manager) {
    var nbt = entity.getWornChestplate().nbt();
    manager.setTagList(nbt, "Equipment", manager.newTagList("[]"));
    var equipment = nbt.getTagList("Equipment");
    var inWater = entity.isInWater();
    var idx = 0;
    for (var p in POWER_ITEMS) {
        if (hasPower(entity, Number(p))) {
            idx = appendItems(POWER_ITEMS[p], equipment, manager, idx);
            if (inWater && POWER_ITEMS_WATER[p]) {
                idx = appendItems(POWER_ITEMS_WATER[p], equipment, manager, idx);
            }
        }
    }
}

// Check if any slot has a given power
function hasPower(entity, powerIndex) {
    for (var i = 0; i < 3; i++) {
        if (Number(entity.getData(SLOT_KEYS[i])) == powerIndex) return true;
    }
    return false;
}

// Check if any power with the given keyGroup is in a flight-granting state
function hasFlightPower(entity) {
    // Flight powers: Gravity(0), Lightning(2), Aero(5), Energy Form(9), Intangibility(11)
    return hasPower(entity, 0) || hasPower(entity, 2) || hasPower(entity, 5) || hasPower(entity, 9) || hasPower(entity, 11);
}

// Build list of valid power indices when cycling a slot
function getValidPowers(entity, slotIndex) {
    var otherPowers = [];
    var usedKeyGroups = {};
    for (var i = 0; i < 3; i++) {
        if (i == slotIndex) continue;
        var p = Number(entity.getData(SLOT_KEYS[i]));
        otherPowers.push(p);
        var kg = POWERS[p].keyGroup;
        if (kg > 0) usedKeyGroups[kg] = true;
    }

    var valid = [];
    for (var i = 0; i < POWER_COUNT; i++) {
        // Can't pick a power already in another slot
        var inOther = false;
        for (var j = 0; j < otherPowers.length; j++) {
            if (otherPowers[j] == i) { inOther = true; break; }
        }
        if (inOther) continue;
        // Can't pick a power whose keyGroup conflicts with another slot
        var kg = POWERS[i].keyGroup;
        if (kg > 0 && usedKeyGroups[kg]) continue;
        valid.push(i);
    }
    return valid;
}

// Shift history data vars and push new entry (all via synced setData)
function pushHistory(entity, manager, powerIndex) {
    for (var i = HIST_KEYS.length - 1; i > 0; i--) {
        manager.setData(entity, HIST_KEYS[i], Number(entity.getData(HIST_KEYS[i - 1])));
    }
    manager.setData(entity, HIST_KEYS[0], powerIndex);
}

// Hard-filter recently-discarded powers from candidates (if enough remain)
function filterHistory(entity, valid) {
    var filtered = [];
    for (var i = 0; i < valid.length; i++) {
        var inHistory = false;
        for (var j = 0; j < HIST_KEYS.length; j++) {
            if (valid[i] == Number(entity.getData(HIST_KEYS[j]))) { inHistory = true; break; }
        }
        if (!inHistory) filtered.push(valid[i]);
    }
    return filtered.length >= 2 ? filtered : valid;
}

// Build needs-weighted pool from valid candidates
// Each power gets 1 copy per active need it answers; powers answering nothing are excluded
// If critical needs are active, only powers answering critical needs are included
function buildNeedsPool(entity, valid) {
    var needs = getActiveNeeds(entity);

    // Check if any critical need is active
    var hasCritical = false;
    for (var n in needs) {
        if (NEED_CRITICAL[n]) { hasCritical = true; break; }
    }

    var pool = [];
    for (var i = 0; i < valid.length; i++) {
        var power = POWERS[valid[i]];
        var copies = 0;
        for (var a = 0; a < power.answers.length; a++) {
            var need = power.answers[a];
            if (needs[need]) {
                if (hasCritical) {
                    // Only count critical needs when critical needs are active
                    if (NEED_CRITICAL[need]) copies++;
                } else {
                    copies++;
                }
            }
        }
        for (var c = 0; c < copies; c++) {
            pool.push(valid[i]);
        }
    }
    return pool;
}

// Synced PRNG: pick from needs-weighted pool, excluding recent history (integer math only)
function nextRandomFromPool(entity, current, valid) {
    if (valid.length == 0) return current;
    if (valid.length == 1) return valid[0];

    // Build needs-weighted pool
    var weighted = buildNeedsPool(entity, valid);
    // Fallback to unweighted if no needs matched (shouldn't happen — PEACE/COMBAT always active)
    var candidates = weighted.length > 0 ? weighted : valid;

    // Hard-exclude recent history (but only from unique entries for the check)
    var unique = [];
    var seen = {};
    for (var i = 0; i < candidates.length; i++) {
        if (!seen[candidates[i]]) {
            seen[candidates[i]] = true;
            unique.push(candidates[i]);
        }
    }
    var filtered = filterHistory(entity, unique);
    // If history filtering removed options, rebuild weighted pool from filtered set
    if (filtered.length < unique.length && filtered.length >= 2) {
        var filteredSet = {};
        for (var i = 0; i < filtered.length; i++) filteredSet[filtered[i]] = true;
        var newCandidates = [];
        for (var i = 0; i < candidates.length; i++) {
            if (filteredSet[candidates[i]]) newCandidates.push(candidates[i]);
        }
        candidates = newCandidates.length > 0 ? newCandidates : candidates;
    }

    if (candidates.length == 1) return candidates[0];

    var s1 = Number(entity.getData("worm:dyn/slot1"));
    var s2 = Number(entity.getData("worm:dyn/slot2"));
    var s3 = Number(entity.getData("worm:dyn/slot3"));
    var hash = ((s1 * 7 + s2 * 31 + s3 * 127 + current * 13) * 1103515245 + 12345) >> 8;
    var idx = (hash & 0x7FFF) % candidates.length;
    // Avoid picking the same power we already have
    if (candidates[idx] == current && candidates.length > 1) {
        idx = (idx + 1) % candidates.length;
    }
    return candidates[idx];
}

function init(hero) {
    heroRef = hero;
    hero.setName("Eidolon");
    hero.setTier(3);

    hero.setHelmet("Cloak & Mask");
    hero.setChestplate("Top");
    hero.setLeggings("Tights");
    hero.setBoots("Boots");

    hero.addPowers("worm:eidolon_powers");
    hero.addAttribute("PUNCH_DAMAGE", 6.0, 0);
    hero.addAttribute("WEAPON_DAMAGE", 1.0, 0);
    hero.addAttribute("FALL_RESISTANCE", 0.5, 1);
    hero.addAttribute("SPRINT_SPEED", 0.2, 1);
    hero.addAttribute("JUMP_HEIGHT", 0.5, 0);
    hero.addAttribute("BASE_SPEED_LEVELS", 3.0, 0);

    // Register cycle keybinds: POWER_COUNT labels per slot, 3 slots
    // Callback only sets a "cycle requested" flag; actual computation is in tick handler
    for (var slot = 0; slot < 3; slot++) {
        for (var p = 0; p < POWER_COUNT; p++) {
            (function (s, pi) {
                hero.addKeyBindFunc("SLOT" + (s + 1) + "_CYCLE_" + pi, function (entity, manager) {
                    if (entity.getData("worm:dyn/eidolon_cycle") != 0) return false;
                    manager.setData(entity, "worm:dyn/eidolon_cycle", s + 1); // 1, 2, or 3
                    return true;
                }, POWERS[pi].label + " \u00A78> (Discard)", s + 1);
            })(slot, p);
        }
    }

    // Key 4: Active abilities (Key 4 group powers)
    hero.addKeyBind("GRAVITY_MANIPULATION", "Gravity Control", 4);
    hero.addKeyBind("GROUND_SMASH", "Gravity Slam \u00A77+ \u00A7eScroll\u00A7f Raise/Lower", 4);
    hero.addKeyBind("HEAT_VISION", "Expel Energy", 4);
    hero.addKeyBind("ENERGY_PROJECTION", "Lightning Storm", 4);
    hero.addKeyBind("UTILITY_BELT", "Grenades", 4);

    // Equipment slots for item-giving powers (air placeholders, filled dynamically)
    for (var e = 0; e < EQUIPMENT_SLOTS; e++) {
        hero.addPrimaryEquipment("minecraft:air", false);
    }
    hero.addKeyBind("AIM", "Aim", -1);
    hero.supplyFunction("canAim", function (entity) {
        if (!hasPower(entity, 3)) return false;
        var held = entity.getHeldItem().name();
        return held == "fiskheroes:cold_gun" || held == "fiskheroes:heat_gun" || held == "fiskheroes:grappling_gun";
    });
    hero.setHasPermission(function (entity, permission) {
        if (!hasPower(entity, 3)) return false;
        return permission == "USE_COLD_GUN" || permission == "USE_HEAT_GUN" || permission == "USE_GRAPPLING_GUN";
    });

    // Key 5: Active abilities (Key 5 group powers)
    hero.addKeyBind("SUPER_SPEED", "Slow Time", 5);
    hero.addKeyBind("SLOW_MOTION", "Slow Time", 5);
    hero.addKeyBind("TELEKINESIS", "Tornado", 5);
    hero.addKeyBind("SONIC_WAVES", "Tornado", 5);
    hero.addKeyBind("SHIELD", "Bubble", 5);
    hero.addKeyBind("SPELL_MENU", "key.illusionMenu", 5);

    hero.setTickHandler(function (entity, manager) {
        var s1 = Number(entity.getData("worm:dyn/slot1"));
        var s2 = Number(entity.getData("worm:dyn/slot2"));
        var s3 = Number(entity.getData("worm:dyn/slot3"));

        // Initialize on first equip (all zeros = uninitialized, since 0 in all 3 is invalid)
        if (s1 == 0 && s2 == 0 && s3 == 0) {
            manager.setData(entity, "worm:dyn/slot1", DEFAULT_POWERS[0]);
            manager.setData(entity, "worm:dyn/slot2", DEFAULT_POWERS[1]);
            manager.setData(entity, "worm:dyn/slot3", DEFAULT_POWERS[2]);
            // Initialize history to sentinel
            for (var h = 0; h < HIST_KEYS.length; h++) {
                manager.setData(entity, HIST_KEYS[h], HIST_EMPTY);
            }
            // Clear equipment added by addPrimaryEquipment (no item powers active at start)
            if (PackLoader.getSide() == "SERVER") {
                rebuildEquipment(entity, manager);
            }
            return false;
        }

        // Process cycle request (set by keybind callback)
        var cycleReq = Number(entity.getData("worm:dyn/eidolon_cycle"));
        if (cycleReq >= 1 && cycleReq <= 3) {
            var slotIdx = cycleReq - 1;
            var current = Number(entity.getData(SLOT_KEYS[slotIdx]));
            var valid = getValidPowers(entity, slotIdx);
            var next = nextRandomFromPool(entity, current, valid);
            // Debug: show active needs and selection
            if (PackLoader.getSide() == "SERVER") {
                var needs = getActiveNeeds(entity);
                var needNames = [];
                for (var n in needs) needNames.push(n);
                var pool = buildNeedsPool(entity, valid);
                var poolNames = [];
                for (var pi = 0; pi < pool.length; pi++) poolNames.push(POWERS[pool[pi]].label);
                entity.as("PLAYER").addChatMessage("\u00A78[Needs] \u00A77" + needNames.join(", "));
                entity.as("PLAYER").addChatMessage("\u00A78[Pool] \u00A77" + poolNames.join(", "));
            }
            pushHistory(entity, manager, current);
            manager.setData(entity, SLOT_KEYS[slotIdx], next);
            manager.setData(entity, "worm:dyn/eidolon_cycle", 0);
            // Re-read slot values after change
            s1 = Number(entity.getData("worm:dyn/slot1"));
            s2 = Number(entity.getData("worm:dyn/slot2"));
            s3 = Number(entity.getData("worm:dyn/slot3"));
        }

        // Clamp out-of-range values
        if (s1 < 0 || s1 >= POWER_COUNT) { manager.setData(entity, "worm:dyn/slot1", DEFAULT_POWERS[0]); s1 = DEFAULT_POWERS[0]; }
        if (s2 < 0 || s2 >= POWER_COUNT) { manager.setData(entity, "worm:dyn/slot2", DEFAULT_POWERS[1]); s2 = DEFAULT_POWERS[1]; }
        if (s3 < 0 || s3 >= POWER_COUNT) { manager.setData(entity, "worm:dyn/slot3", DEFAULT_POWERS[2]); s3 = DEFAULT_POWERS[2]; }

        // Auto-activate flight when gaining a flight power
        var hasFlight = hasFlightPower(entity);
        if (hasFlight && !prevHadFlight && !entity.getData("fiskheroes:flying")) {
            manager.setData(entity, "fiskheroes:flying", true);
        }
        prevHadFlight = hasFlight;

        // Rebuild equipment when any item-giving power changes or water state changes (server only)
        if (PackLoader.getSide() == "SERVER") {
            var needsRebuild = false;
            for (var p in POWER_ITEMS) {
                var active = hasPower(entity, Number(p));
                if (active != prevItemPowers[p]) {
                    needsRebuild = true;
                    prevItemPowers[p] = active;
                }
            }
            // Water state change triggers rebuild for water-conditional items
            var inWater = entity.isInWater();
            if (inWater != prevInWater) {
                prevInWater = inWater;
                // Only rebuild if a power with water items is active
                for (var p in POWER_ITEMS_WATER) {
                    if (hasPower(entity, Number(p))) { needsRebuild = true; break; }
                }
            }
            if (needsRebuild) {
                rebuildEquipment(entity, manager);
            }

            // Replenish items taken out (every 2 seconds)
            if (!needsRebuild && entity.ticksExisted() % 40 == 0) {
                var expected = expectedItemCount(entity);
                if (expected > 0 && entity.getWornChestplate().nbt().getTagList("Equipment").tagCount() < expected) {
                    rebuildEquipment(entity, manager);
                }
            }
        }

        // Energy Absorption (1): charge when taking damage
        var hasEnergyAbsorb = hasPower(entity, 1);
        var timeSinceDamaged = entity.getData("fiskheroes:time_since_damaged");
        if (hasEnergyAbsorb && timeSinceDamaged < 20) {
            manager.setData(entity, "worm:dyn/eidolon_absorb", true);
        } else {
            manager.setData(entity, "worm:dyn/eidolon_absorb", false);
        }

        // Drain charge while firing heat vision
        if (hasEnergyAbsorb && entity.getData("fiskheroes:heat_vision")) {
            var charge = entity.getData("worm:dyn/eidolon_charge");
            if (charge > 0) {
                manager.setData(entity, "worm:dyn/eidolon_charge", Math.max(0, charge - 0.005));
            }
        }

        // Reset charge when Energy Absorption not active
        if (!hasEnergyAbsorb) {
            manager.setData(entity, "worm:dyn/eidolon_absorb", false);
            manager.setData(entity, "worm:dyn/eidolon_charge", 0);
        }

        // Energy Form (9): force shadowform on/off
        var hasEnergyForm = hasPower(entity, 9);
        var isShadow = entity.getData("fiskheroes:shadowform");
        if (hasEnergyForm && !isShadow) {
            manager.setData(entity, "fiskheroes:shadowform", true);
        } else if (!hasEnergyForm && isShadow) {
            manager.setData(entity, "fiskheroes:shadowform", false);
        }

        // Intangibility (11): force intangible + flight on/off
        var hasIntang = hasPower(entity, 11);
        var isIntang = entity.getData("fiskheroes:intangible");
        if (hasIntang && !isIntang) {
            manager.setData(entity, "fiskheroes:intangible", true);
            manager.setData(entity, "fiskheroes:flying", true);
        } else if (!hasIntang && isIntang) {
            manager.setData(entity, "fiskheroes:intangible", false);
        }

        // Keep flight on while intangible
        if (hasIntang && !entity.getData("fiskheroes:flying")) {
            manager.setData(entity, "fiskheroes:flying", true);
        }

        // Chronokinesis (4): sync super speed with slow motion
        var hasChrono = hasPower(entity, 4);
        var isSpeeding = entity.getData("fiskheroes:speeding");
        var isSlowMo = entity.getData("fiskheroes:slow_motion");
        if (hasChrono) {
            if (isSlowMo && !isSpeeding) {
                manager.setData(entity, "fiskheroes:speeding", true);
            } else if (!isSlowMo && isSpeeding) {
                manager.setData(entity, "fiskheroes:speeding", false);
            }
        } else if (isSpeeding) {
            manager.setData(entity, "fiskheroes:speeding", false);
        }

        speedster_base.tick(entity, manager);

        // Energy Form (9): contact damage
        if (hasEnergyForm) {
            var nearby = entity.world().getEntitiesInRangeOf(entity.pos(), 3.0);
            for (var i = 0; i < nearby.length; i++) {
                var target = nearby[i];
                if (target.isLivingEntity() && target.getUUID() != entity.getUUID()) {
                    target.hurt(heroRef, "ENERGY_FORM", "%1$s was torn apart by Eidolon", 4.0);
                }
            }
        }

        // Lightning Storm (2): electric aura damage
        if (hasPower(entity, 2)) {
            var nearby = entity.world().getEntitiesInRangeOf(entity.pos(), 2.0);
            for (var i = 0; i < nearby.length; i++) {
                var target = nearby[i];
                if (target.isLivingEntity() && target.getUUID() != entity.getUUID()) {
                    target.hurt(heroRef, "LIGHTNING_AURA", "%1$s was shocked by Eidolon", 1.0);
                }
            }
        }

        // Flicker Regen (12): detect healing and trigger flicker visual
        var currentHealth = entity.getHealth();
        if (hasPower(entity, 12) && prevHealth >= 0 && currentHealth > prevHealth) {
            manager.setData(entity, "worm:dyn/eidolon_flicker", true);
        } else if (entity.getData("worm:dyn/eidolon_flicker")) {
            manager.setData(entity, "worm:dyn/eidolon_flicker", false);
        }
        prevHealth = currentHealth;

        // Danger Sense (13): exact copy of Skitter's swarm sense scan
        if (hasPower(entity, 13) && entity.ticksExisted() % DANGER_SENSE_INTERVAL == 0) {
            var nearby = entity.world().getEntitiesInRangeOf(entity.pos(), DANGER_SENSE_RANGE);
            var look = entity.getLookVector();
            var detected = [];
            for (var i = 0; i < nearby.length; i++) {
                var other = nearby[i];
                if (other.isLivingEntity() && other.getUUID() != entity.getUUID()) {
                    var toOther = other.pos().subtract(entity.pos());
                    var dist = other.pos().distanceTo(entity.pos());
                    var dot = look.x() * toOther.x() + look.z() * toOther.z();
                    var cross = look.x() * toOther.z() - look.z() * toOther.x();
                    var dir;
                    if (Math.abs(dot) > Math.abs(cross)) {
                        dir = dot > 0 ? "ahead" : "behind";
                    } else {
                        dir = cross > 0 ? "left" : "right";
                    }
                    var score = dist / Math.max(other.getMaxHealth(), 1);
                    detected.push({ name: other.getName(), dist: dist, dir: dir, score: score });
                }
            }
            detected.sort(function (a, b) { return a.score - b.score; });
            if (detected.length > 5) detected = detected.slice(0, 5);
            if (detected.length > 0 && PackLoader.getSide() == "SERVER") {
                var parts = [];
                for (var j = 0; j < detected.length; j++) {
                    var d = detected[j];
                    parts.push("\u00A76" + d.name + " \u00A77" + Math.round(d.dist) + "m " + d.dir);
                }
                entity.as("PLAYER").addChatMessage("\u00A78\u00A7o[Danger Sense] \u00A77" + parts.join("\u00A78, "));
            }
        }

        // Bubble (6): continuous damage while shield is active
        var shieldTimer = entity.getData("fiskheroes:shield_blocking_timer");
        if (hasPower(entity, 6) && shieldTimer > 0) {
            var nearby = entity.world().getEntitiesInRangeOf(entity.pos(), 2.5);
            for (var i = 0; i < nearby.length; i++) {
                var target = nearby[i];
                if (target.isLivingEntity() && target.getUUID() != entity.getUUID()) {
                    target.hurt(heroRef, "BUBBLE_PULSE", "%1$s was crushed by Eidolon's forcefield", 1.0);
                }
            }
        }

        return false;
    });

    hero.setHasProperty(hasProperty);
    hero.setModifierEnabled(isModifierEnabled);
    hero.setKeyBindEnabled(isKeyBindEnabled);

    hero.addDamageProfile("PUNCH", { "types": { "BLUNT": 1.0 } });
    hero.addDamageProfile("ENERGY_FORM", { "types": { "ENERGY": 1.0 } });
    hero.addDamageProfile("LIGHTNING_AURA", { "types": { "ELECTRICITY": 1.0 } });
    hero.addDamageProfile("BUBBLE_PULSE", { "types": { "BLUNT": 1.0 } });
    hero.setDamageProfile(getDamageProfile);

    hero.addAttributeProfile("GRAVITY", gravityProfile);
    hero.setAttributeProfile(getAttributeProfile);
}

function gravityProfile(profile) {
    profile.inheritDefaults();
    profile.addAttribute("REACH_DISTANCE", 50.0, 0);
}

function getAttributeProfile(entity) {
    return hasPower(entity, 0) && entity.getData("fiskheroes:gravity_manip") && entity.getHeldItem().isEmpty() ? "GRAVITY" : null;
}

function getDamageProfile(entity) {
    return "PUNCH";
}

function isModifierEnabled(entity, modifier) {
    switch (modifier.name()) {
    // Gravity Control (0)
    case "fiskheroes:gravity_manipulation": return hasPower(entity, 0);
    case "fiskheroes:ground_smash": return hasPower(entity, 0);
    // Energy Absorption (1)
    case "fiskheroes:heat_vision": return hasPower(entity, 1) && entity.getData("worm:dyn/eidolon_charge") > 0.1;
    case "fiskheroes:frost_walking": return hasPower(entity, 1);
    case "fiskheroes:cooldown": return hasPower(entity, 1);
    case "fiskheroes:damage_immunity": return hasPower(entity, 1);
    case "fiskheroes:damage_resistance": return hasPower(entity, 1);
    // Lightning Storm (2)
    case "fiskheroes:energy_projection": return hasPower(entity, 2);
    // Conjure Tech (3) — grenades
    case "fiskheroes:equipment": return hasPower(entity, 3);
    // Chronokinesis (4)
    case "fiskheroes:super_speed": return hasPower(entity, 4);
    case "fiskheroes:slow_motion": return hasPower(entity, 4);
    case "fiskheroes:arrow_catching": return hasPower(entity, 4) && entity.getData("fiskheroes:slow_motion");
    // Aerokinesis (5)
    case "fiskheroes:telekinesis": return hasPower(entity, 5);
    case "fiskheroes:sonic_waves": return hasPower(entity, 5);
    // Bubble (6)
    case "fiskheroes:shield": return hasPower(entity, 6);
    // Illusions (7)
    case "fiskheroes:spellcasting": return hasPower(entity, 7);
    // Flight: Gravity(0), Lightning(2), Aero(5), Energy Form(9), Intangibility(11)
    case "fiskheroes:controlled_flight": return hasFlightPower(entity);
    // Damage Reflection (8)
    case "fiskheroes:thorns": return hasPower(entity, 8);
    // Energy Form (9)
    case "fiskheroes:shadowform": return hasPower(entity, 9);
    case "fiskheroes:healing_factor":
        if (hasPower(entity, 9) && modifier.id() == "energy_form") return true;
        if (hasPower(entity, 12) && modifier.id() == "flicker_regen") return true;
        return false;
    // Crystal Armor (10)
    case "fiskheroes:metal_skin": return hasPower(entity, 10);
    // Shared immunities: Energy Absorb(1) or Crystal Armor(10)
    case "fiskheroes:projectile_immunity": return hasPower(entity, 1) || hasPower(entity, 10);
    case "fiskheroes:fire_immunity": return hasPower(entity, 1) || hasPower(entity, 10);
    // Intangibility (11)
    case "fiskheroes:intangibility": return hasPower(entity, 11);
    // Water breathing: Energy Form (9) or Intangibility (11)
    case "fiskheroes:water_breathing": return hasPower(entity, 9) || hasPower(entity, 11);

    default: return true;
    }
}

function isKeyBindEnabled(entity, keyBind) {
    // Cycle labels: parse "SLOT{N}_CYCLE_{P}" dynamically
    if (keyBind.indexOf("SLOT") == 0 && keyBind.indexOf("_CYCLE_") > 0) {
        var parts = keyBind.split("_CYCLE_");
        var slotNum = parseInt(parts[0].substring(4));
        var powerIdx = parseInt(parts[1]);
        return Number(entity.getData(SLOT_KEYS[slotNum - 1])) == powerIdx;
    }

    switch (keyBind) {
    // Key 4 activation keybinds
    case "GRAVITY_MANIPULATION": return hasPower(entity, 0);
    case "GROUND_SMASH": return hasPower(entity, 0);
    case "HEAT_VISION": return hasPower(entity, 1) && entity.getData("worm:dyn/eidolon_charge") > 0.1;
    case "ENERGY_PROJECTION": return hasPower(entity, 2);
    case "UTILITY_BELT": return hasPower(entity, 3);
    // Key 5 activation keybinds
    case "SUPER_SPEED": return hasPower(entity, 4);
    case "SLOW_MOTION": return hasPower(entity, 4);
    case "TELEKINESIS": return hasPower(entity, 5);
    case "SONIC_WAVES": return hasPower(entity, 5);
    case "SHIELD": return hasPower(entity, 6);
    case "SPELL_MENU": return hasPower(entity, 7);
    default: return true;
    }
}

function hasProperty(entity, property) {
    if (property == "BREATHE_SPACE" || property == "BREATHE_WATER") {
        return hasPower(entity, 9) || hasPower(entity, 11);
    }
    return false;
}
