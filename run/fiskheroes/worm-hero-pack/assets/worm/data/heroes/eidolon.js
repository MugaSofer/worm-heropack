// Eidolon — "Whatever You Need"
//
// 13 powers drawn randomly into 3 slots. Constraints:
//   - At most 1 KEY4 power (uses key 4 for activation)
//   - At most 1 KEY5 power (uses key 5 for activation)
//   - Unlimited passives (no activation key needed)
//   - No duplicates across slots
//   - Never repeat on cycle (always get something different)
//
// Power IDs:
//   KEY4: 0=Gravity Control, 1=Energy Absorption, 2=Lightning Storm, 3=Conjuration
//   KEY5: 4=Chronokinesis, 5=Aerokinesis, 6=Bubble, 7=Illusions
//   PASSIVE: 8=Damage Reflection, 9=Energy Form, 10=Crystal Armor, 11=Intangibility, 12=Flicker Regen

var POWER_COUNT = 13;
var EMPTY_POWER = 99; // Sentinel: slot is empty / drawing in progress

var POWER_NAMES = [
    "Gravity Control", "Energy Absorb", "Lightning Storm", "Conjuration",
    "Chronokinesis", "Aerokinesis", "Bubble", "Illusions",
    "Dmg Reflect", "Energy Form", "Crystal Armor", "Intangibility", "Flicker Regen"
];

var POWER_COLORS = [
    "\u00A7a", "\u00A7b", "\u00A7e", "\u00A7b",
    "\u00A7e", "\u00A7f", "\u00A79", "\u00A7d",
    "\u00A76", "\u00A7d", "\u00A73", "\u00A78", "\u00A7a"
];

// KEY4 = 0, KEY5 = 1, PASSIVE = 2
var POWER_TYPE = [0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 2];

var speedster_base = implement("fiskheroes:external/speedster_base");

var heroRef = null;
var prevHealth = -1;

var debounce = false; // Prevents multiple keybind functions firing on same key press
var powerDeck = [];   // Shuffled list of power IDs — draw sequentially, reshuffle when empty

function hasPower(entity, powerId) {
    return entity.getData("worm:dyn/slot1") == powerId ||
           entity.getData("worm:dyn/slot2") == powerId ||
           entity.getData("worm:dyn/slot3") == powerId;
}

function arrayContains(arr, val) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] == val) return true;
    }
    return false;
}

function shuffleDeck() {
    powerDeck = [];
    for (var i = 0; i < POWER_COUNT; i++) powerDeck.push(i);
    // Fisher-Yates shuffle
    for (var i = powerDeck.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = powerDeck[i];
        powerDeck[i] = powerDeck[j];
        powerDeck[j] = temp;
    }
}

// Draw the next valid power from the shuffled deck.
// Powers that violate constraints are skipped (stay in deck for other slots later).
// excluded = the power being discarded (never repeat immediately)
function drawFromDeck(entity, slotIndex, excluded) {
    if (powerDeck.length == 0) shuffleDeck();

    var slots = [
        Number(entity.getData("worm:dyn/slot1")),
        Number(entity.getData("worm:dyn/slot2")),
        Number(entity.getData("worm:dyn/slot3"))
    ];
    excluded = Number(excluded);

    // Check what other slots have
    var otherPowers = [];
    var otherHasKey4 = false;
    var otherHasKey5 = false;
    for (var i = 0; i < 3; i++) {
        if (i != slotIndex && slots[i] < POWER_COUNT) {
            otherPowers.push(slots[i]);
            if (POWER_TYPE[slots[i]] == 0) otherHasKey4 = true;
            if (POWER_TYPE[slots[i]] == 1) otherHasKey5 = true;
        }
    }

    // Find first valid card in deck
    for (var i = 0; i < powerDeck.length; i++) {
        var candidate = powerDeck[i];
        if (candidate == excluded) continue;
        if (arrayContains(otherPowers, candidate)) continue;
        if (otherHasKey4 && POWER_TYPE[candidate] == 0) continue;
        if (otherHasKey5 && POWER_TYPE[candidate] == 1) continue;

        // Valid — remove from deck and return
        powerDeck.splice(i, 1);
        return candidate;
    }

    // All remaining cards invalid — reshuffle full deck and try again
    shuffleDeck();
    return drawFromDeck(entity, slotIndex, excluded);
}

function initializeSlots(entity, manager) {
    shuffleDeck();
    // Draw 3 non-conflicting powers from the fresh deck
    // Temporarily set slots to EMPTY so drawFromDeck sees them as available
    manager.setData(entity, "worm:dyn/slot1", EMPTY_POWER);
    manager.setData(entity, "worm:dyn/slot2", EMPTY_POWER);
    manager.setData(entity, "worm:dyn/slot3", EMPTY_POWER);

    var p0 = drawFromDeck(entity, 0, -1);
    manager.setData(entity, "worm:dyn/slot1", p0);

    var p1 = drawFromDeck(entity, 1, -1);
    manager.setData(entity, "worm:dyn/slot2", p1);

    var p2 = drawFromDeck(entity, 2, -1);
    manager.setData(entity, "worm:dyn/slot3", p2);
}

// Called by cycle keybinds: discard current power and immediately draw a new one
function cycleSlot(entity, manager, slotIndex) {
    if (debounce) return false; // All 13 keybinds per key fire — only process the first
    debounce = true;

    var slotKey = "worm:dyn/slot" + (slotIndex + 1);
    var current = Number(entity.getData(slotKey));
    var newPower = drawFromDeck(entity, slotIndex, current);
    manager.setData(entity, slotKey, newPower);
    return true;
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

    // Key 1/2/3: Cycle keybinds — 13 per slot (one per power, only active one shown)
    for (var p = 0; p < POWER_COUNT; p++) {
        (function(powerId) {
            var label = POWER_COLORS[powerId] + POWER_NAMES[powerId] + " \u00A78> (Discard)";

            hero.addKeyBindFunc("SLOT1_P" + powerId, function (entity, manager) {
                return cycleSlot(entity, manager, 0);
            }, label, 1);

            hero.addKeyBindFunc("SLOT2_P" + powerId, function (entity, manager) {
                return cycleSlot(entity, manager, 1);
            }, label, 2);

            hero.addKeyBindFunc("SLOT3_P" + powerId, function (entity, manager) {
                return cycleSlot(entity, manager, 2);
            }, label, 3);
        })(p);
    }

    // Key 4: Active abilities for KEY4 powers
    hero.addKeyBind("GRAVITY_MANIPULATION", "Gravity Control", 4);
    hero.addKeyBind("GROUND_SMASH", "Gravity Slam \u00A77+ \u00A7eScroll\u00A7f Raise/Lower", 4);
    hero.addKeyBind("HEAT_VISION", "Expel Energy", 4);
    hero.addKeyBind("ENERGY_PROJECTION", "Lightning Storm", 4);
    hero.addKeyBind("UTILITY_BELT", "Conjure Tech", 4);

    // Key 5: Active abilities for KEY5 powers
    hero.addKeyBind("SUPER_SPEED", "Chronokinesis", 5);
    hero.addKeyBind("SLOW_MOTION", "Slow Time", 5);
    hero.addKeyBind("TELEKINESIS", "Tornado", 5);
    hero.addKeyBind("SONIC_WAVES", "Tornado", 5);
    hero.addKeyBind("SHIELD", "Bubble", 5);
    hero.addKeyBind("SPELL_MENU", "key.illusionMenu", 5);

    hero.setTickHandler(function (entity, manager) {
        debounce = false;

        var s1 = entity.getData("worm:dyn/slot1");
        var s2 = entity.getData("worm:dyn/slot2");
        var s3 = entity.getData("worm:dyn/slot3");

        // Initialize on first equip (all slots default to 0 = same value)
        if (s1 == s2 && s2 == s3) {
            initializeSlots(entity, manager);
            return false;
        }

        // Energy Absorption: charge when taking damage
        var timeSinceDamaged = entity.getData("fiskheroes:time_since_damaged");
        if (hasPower(entity, 1) && timeSinceDamaged < 20) {
            manager.setData(entity, "worm:dyn/eidolon_absorb", true);
        } else {
            manager.setData(entity, "worm:dyn/eidolon_absorb", false);
        }

        // Drain charge while firing heat vision
        if (hasPower(entity, 1) && entity.getData("fiskheroes:heat_vision")) {
            var charge = entity.getData("worm:dyn/eidolon_charge");
            if (charge > 0) {
                manager.setData(entity, "worm:dyn/eidolon_charge", Math.max(0, charge - 0.005));
            }
        }

        // Reset charge when Energy Absorption not equipped
        if (!hasPower(entity, 1)) {
            manager.setData(entity, "worm:dyn/eidolon_absorb", false);
            manager.setData(entity, "worm:dyn/eidolon_charge", 0);
        }

        // Force shadowform on/off based on Energy Form
        var isShadow = entity.getData("fiskheroes:shadowform");
        if (hasPower(entity, 9) && !isShadow) {
            manager.setData(entity, "fiskheroes:shadowform", true);
        } else if (!hasPower(entity, 9) && isShadow) {
            manager.setData(entity, "fiskheroes:shadowform", false);
        }

        // Force intangibility + flight on/off
        var isIntang = entity.getData("fiskheroes:intangible");
        if (hasPower(entity, 11) && !isIntang) {
            manager.setData(entity, "fiskheroes:intangible", true);
            manager.setData(entity, "fiskheroes:flying", true);
        } else if (!hasPower(entity, 11) && isIntang) {
            manager.setData(entity, "fiskheroes:intangible", false);
        }

        // Keep flight on while intangible
        if (hasPower(entity, 11) && !entity.getData("fiskheroes:flying")) {
            manager.setData(entity, "fiskheroes:flying", true);
        }

        // Sync super speed with slow motion (both are "Chronokinesis")
        var isSpeeding = entity.getData("fiskheroes:speeding");
        var isSlowMo = entity.getData("fiskheroes:slow_motion");
        if (hasPower(entity, 4)) {
            if (isSlowMo && !isSpeeding) {
                manager.setData(entity, "fiskheroes:speeding", true);
            } else if (!isSlowMo && isSpeeding) {
                manager.setData(entity, "fiskheroes:speeding", false);
            }
        } else if (isSpeeding) {
            manager.setData(entity, "fiskheroes:speeding", false);
        }

        // Speedster base tick for super speed
        speedster_base.tick(entity, manager);

        // Energy Form: contact damage to nearby entities
        if (hasPower(entity, 9)) {
            var world = entity.world();
            var nearby = world.getEntitiesInRangeOf(entity.pos(), 3.0);
            for (var i = 0; i < nearby.length; i++) {
                var target = nearby[i];
                if (target.isLivingEntity() && target.getUUID() != entity.getUUID()) {
                    target.hurt(heroRef, "ENERGY_FORM", "%1$s was torn apart by Eidolon", 4.0);
                }
            }
        }

        // Lightning Storm: mild electric aura damage
        if (hasPower(entity, 2)) {
            var world = entity.world();
            var nearby = world.getEntitiesInRangeOf(entity.pos(), 2.0);
            for (var i = 0; i < nearby.length; i++) {
                var target = nearby[i];
                if (target.isLivingEntity() && target.getUUID() != entity.getUUID()) {
                    target.hurt(heroRef, "LIGHTNING_AURA", "%1$s was shocked by Eidolon", 1.0);
                }
            }
        }

        // Flicker Regen: detect healing and trigger flicker visual
        var currentHealth = entity.getHealth();
        if (hasPower(entity, 12) && prevHealth >= 0 && currentHealth > prevHealth) {
            manager.setData(entity, "worm:dyn/eidolon_flicker", true);
        } else if (entity.getData("worm:dyn/eidolon_flicker")) {
            manager.setData(entity, "worm:dyn/eidolon_flicker", false);
        }
        prevHealth = currentHealth;

        // Bubble: continuous damage while shield is active
        var shieldTimer = entity.getData("fiskheroes:shield_blocking_timer");
        if (hasPower(entity, 6) && shieldTimer > 0) {
            var world = entity.world();
            var nearby = world.getEntitiesInRangeOf(entity.pos(), 2.5);
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

    hero.addDamageProfile("PUNCH", {
        "types": {
            "BLUNT": 1.0
        }
    });
    hero.addDamageProfile("ENERGY_FORM", {
        "types": {
            "ENERGY": 1.0
        }
    });
    hero.addDamageProfile("LIGHTNING_AURA", {
        "types": {
            "ELECTRICITY": 1.0
        }
    });
    hero.addDamageProfile("BUBBLE_PULSE", {
        "types": {
            "BLUNT": 1.0
        }
    });
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
    case "fiskheroes:gravity_manipulation":
        return hasPower(entity, 0);
    case "fiskheroes:ground_smash":
        return hasPower(entity, 0);

    // Energy Absorption (1)
    case "fiskheroes:heat_vision":
        return hasPower(entity, 1) && entity.getData("worm:dyn/eidolon_charge") > 0.1;
    case "fiskheroes:frost_walking":
        return hasPower(entity, 1);
    case "fiskheroes:cooldown":
        return hasPower(entity, 1);
    case "fiskheroes:damage_immunity":
        return hasPower(entity, 1);
    case "fiskheroes:damage_resistance":
        return hasPower(entity, 1);

    // Lightning Storm (2)
    case "fiskheroes:energy_projection":
        return hasPower(entity, 2);

    // Conjuration (3)
    case "fiskheroes:equipment":
        return hasPower(entity, 3);

    // Chronokinesis (4)
    case "fiskheroes:super_speed":
        return hasPower(entity, 4);
    case "fiskheroes:slow_motion":
        return hasPower(entity, 4);
    case "fiskheroes:arrow_catching":
        return hasPower(entity, 4) && entity.getData("fiskheroes:slow_motion");

    // Aerokinesis (5)
    case "fiskheroes:telekinesis":
        return hasPower(entity, 5);
    case "fiskheroes:sonic_waves":
        return hasPower(entity, 5);

    // Bubble (6)
    case "fiskheroes:shield":
        return hasPower(entity, 6);

    // Illusions (7)
    case "fiskheroes:spellcasting":
        return hasPower(entity, 7);

    // Flight: Gravity(0), Lightning(2), Aerokinesis(5), Energy Form(9), Intangibility(11)
    case "fiskheroes:controlled_flight":
        return hasPower(entity, 0) || hasPower(entity, 2) || hasPower(entity, 5) || hasPower(entity, 9) || hasPower(entity, 11);

    // Damage Reflection (8)
    case "fiskheroes:thorns":
        return hasPower(entity, 8);

    // Energy Form (9)
    case "fiskheroes:shadowform":
        return hasPower(entity, 9);
    case "fiskheroes:healing_factor":
        return hasPower(entity, 9) ? modifier.id() == "energy_form" : hasPower(entity, 12) ? modifier.id() == "flicker_regen" : false;

    // Crystal Armor (10)
    case "fiskheroes:metal_skin":
        return hasPower(entity, 10);
    case "fiskheroes:projectile_immunity":
        return hasPower(entity, 1) || hasPower(entity, 10);
    case "fiskheroes:fire_immunity":
        return hasPower(entity, 1) || hasPower(entity, 10);

    // Intangibility (11)
    case "fiskheroes:intangibility":
        return hasPower(entity, 11);

    // Flicker Regen (12) handled via healing_factor above

    default:
        return true;
    }
}

function isKeyBindEnabled(entity, keyBind) {
    // Cycle keybinds: SLOT{1,2,3}_P{0-12}
    if (keyBind.indexOf("SLOT1_P") == 0) {
        var id = parseInt(keyBind.substring(7));
        return entity.getData("worm:dyn/slot1") == id;
    }
    if (keyBind.indexOf("SLOT2_P") == 0) {
        var id = parseInt(keyBind.substring(7));
        return entity.getData("worm:dyn/slot2") == id;
    }
    if (keyBind.indexOf("SLOT3_P") == 0) {
        var id = parseInt(keyBind.substring(7));
        return entity.getData("worm:dyn/slot3") == id;
    }

    switch (keyBind) {
    // Key 4: KEY4 powers
    case "GRAVITY_MANIPULATION":
        return hasPower(entity, 0);
    case "GROUND_SMASH":
        return hasPower(entity, 0);
    case "HEAT_VISION":
        return hasPower(entity, 1) && entity.getData("worm:dyn/eidolon_charge") > 0.1;
    case "ENERGY_PROJECTION":
        return hasPower(entity, 2);
    case "UTILITY_BELT":
        return hasPower(entity, 3);

    // Key 5: KEY5 powers
    case "SUPER_SPEED":
        return hasPower(entity, 4);
    case "SLOW_MOTION":
        return hasPower(entity, 4);
    case "TELEKINESIS":
        return hasPower(entity, 5);
    case "SONIC_WAVES":
        return hasPower(entity, 5);
    case "SHIELD":
        return hasPower(entity, 6);
    case "SPELL_MENU":
        return hasPower(entity, 7);

    default:
        return true;
    }
}

function hasProperty(entity, property) {
    if (property == "BREATHE_SPACE" || property == "BREATHE_WATER") {
        return hasPower(entity, 9) || hasPower(entity, 11);
    }
    return false;
}
