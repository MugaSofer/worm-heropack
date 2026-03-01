// Eidolon — 3 slots with themed powersets
//
// Slot 1 → Key 4: 0=Gravity Control (gravity_manipulation + flight), 1=Energy Absorption (energy_projection + arrow_catching + immunities)
// Slot 2 → Key 5: 0=Chronokinesis (slow_motion), 1=Aerokinesis (flight + telekinesis)
// Slot 3 → passive: 0=Damage Reflection (thorns), 1=Energy Form (shadowform + regeneration)

var SLOT1_COUNT = 2;
var SLOT2_COUNT = 2;
var SLOT3_COUNT = 2;

var debounce1 = false;
var debounce2 = false;
var debounce3 = false;

function init(hero) {
    hero.setName("Eidolon");
    hero.setTier(10);

    hero.setHelmet("Helmet");
    hero.setChestplate("Chestplate");
    hero.setLeggings("Leggings");
    hero.setBoots("Boots");

    hero.addPowers("worm:eidolon_powers");
    hero.addAttribute("PUNCH_DAMAGE", 6.0, 0);
    hero.addAttribute("WEAPON_DAMAGE", 1.0, 0);
    hero.addAttribute("FALL_RESISTANCE", 0.5, 1);
    hero.addAttribute("SPRINT_SPEED", 0.2, 1);
    hero.addAttribute("JUMP_HEIGHT", 0.5, 0);

    // Key 1: Cycle slot 1 — display shows current powerset
    hero.addKeyBindFunc("SLOT1_CYCLE_0", function (entity, manager) {
        if (debounce1) return false;
        debounce1 = true;
        var current = entity.getData("worm:dyn/slot1");
        manager.setData(entity, "worm:dyn/slot1", (current + 1) % SLOT1_COUNT);
        return true;
    }, "\u00A7aGravity Control \u00A78>", 1);

    hero.addKeyBindFunc("SLOT1_CYCLE_1", function (entity, manager) {
        if (debounce1) return false;
        debounce1 = true;
        var current = entity.getData("worm:dyn/slot1");
        manager.setData(entity, "worm:dyn/slot1", (current + 1) % SLOT1_COUNT);
        return true;
    }, "\u00A7bEnergy Absorb \u00A78>", 1);

    // Key 2: Cycle slot 2
    hero.addKeyBindFunc("SLOT2_CYCLE_0", function (entity, manager) {
        if (debounce2) return false;
        debounce2 = true;
        var current = entity.getData("worm:dyn/slot2");
        manager.setData(entity, "worm:dyn/slot2", (current + 1) % SLOT2_COUNT);
        return true;
    }, "\u00A7eChronokinesis \u00A78>", 2);

    hero.addKeyBindFunc("SLOT2_CYCLE_1", function (entity, manager) {
        if (debounce2) return false;
        debounce2 = true;
        var current = entity.getData("worm:dyn/slot2");
        manager.setData(entity, "worm:dyn/slot2", (current + 1) % SLOT2_COUNT);
        return true;
    }, "\u00A7fAerokinesis \u00A78>", 2);

    // Key 3: Cycle slot 3
    hero.addKeyBindFunc("SLOT3_CYCLE_0", function (entity, manager) {
        if (debounce3) return false;
        debounce3 = true;
        var current = entity.getData("worm:dyn/slot3");
        manager.setData(entity, "worm:dyn/slot3", (current + 1) % SLOT3_COUNT);
        return true;
    }, "\u00A76Dmg Reflect \u00A78>", 3);

    hero.addKeyBindFunc("SLOT3_CYCLE_1", function (entity, manager) {
        if (debounce3) return false;
        debounce3 = true;
        var current = entity.getData("worm:dyn/slot3");
        manager.setData(entity, "worm:dyn/slot3", (current + 1) % SLOT3_COUNT);
        return true;
    }, "\u00A7dEnergy Form \u00A78>", 3);

    // Key 4: Slot 1 active ability
    hero.addKeyBind("GRAVITY_MANIPULATION", "Gravity Control", 4);
    hero.addKeyBind("HEAT_VISION", "Expel Energy", 4);

    // Key 5: Slot 2 active ability
    hero.addKeyBind("SLOW_MOTION", "Chronokinesis", 5);
    hero.addKeyBind("TELEKINESIS", "Aerokinesis", 5);

    hero.setTickHandler(function (entity, manager) {
        debounce1 = false;
        debounce2 = false;
        debounce3 = false;

        var s1 = entity.getData("worm:dyn/slot1");
        var s3 = entity.getData("worm:dyn/slot3");

        // Energy Absorption: charge when taking damage
        var timeSinceDamaged = entity.getData("fiskheroes:time_since_damaged");
        if (s1 == 1 && timeSinceDamaged < 20) {
            manager.setData(entity, "worm:dyn/eidolon_absorb", true);
        } else {
            manager.setData(entity, "worm:dyn/eidolon_absorb", false);
        }

        // Drain charge while firing heat vision
        if (s1 == 1 && entity.getData("fiskheroes:heat_vision")) {
            var charge = entity.getData("worm:dyn/eidolon_charge");
            if (charge > 0) {
                manager.setData(entity, "worm:dyn/eidolon_charge", Math.max(0, charge - 0.005));
            }
        }

        // Reset charge when switching away from Energy Absorption
        if (s1 != 1) {
            manager.setData(entity, "worm:dyn/eidolon_absorb", false);
        }

        // Force shadowform on/off based on slot 3 selection
        var isShadow = entity.getData("fiskheroes:shadowform");
        if (s3 == 1 && !isShadow) {
            manager.setData(entity, "fiskheroes:shadowform", true);
        } else if (s3 != 1 && isShadow) {
            manager.setData(entity, "fiskheroes:shadowform", false);
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
    hero.setDamageProfile(getDamageProfile);
}

function getDamageProfile(entity) {
    return "PUNCH";
}

function isModifierEnabled(entity, modifier) {
    var s1 = entity.getData("worm:dyn/slot1");
    var s2 = entity.getData("worm:dyn/slot2");
    var s3 = entity.getData("worm:dyn/slot3");

    switch (modifier.name()) {
    // Slot 1: Gravity Control (0) vs Energy Absorption (1)
    case "fiskheroes:gravity_manipulation":
        return s1 == 0;
    case "fiskheroes:heat_vision":
        return s1 == 1 && entity.getData("worm:dyn/eidolon_charge") > 0.1;
    case "fiskheroes:frost_walking":
        return s1 == 1;
    case "fiskheroes:arrow_catching":
        return s1 == 1;
    case "fiskheroes:fire_immunity":
        return s1 == 1;
    case "fiskheroes:damage_immunity":
        return s1 == 1;
    case "fiskheroes:damage_resistance":
        return s1 == 1;
    case "fiskheroes:cooldown":
        return s1 == 1;

    // Slot 2: Chronokinesis (0) vs Aerokinesis (1)
    case "fiskheroes:slow_motion":
        return s2 == 0;
    case "fiskheroes:telekinesis":
        return s2 == 1;

    // Flight: Gravity Control (s1==0) or Aerokinesis (s2==1)
    case "fiskheroes:controlled_flight":
        return s1 == 0 || s2 == 1;

    // Slot 3: Damage Reflection (0) vs Energy Form (1)
    case "fiskheroes:thorns":
        return s3 == 0;
    case "fiskheroes:shadowform":
        return s3 == 1;
    case "fiskheroes:regeneration":
        return s3 == 1;

    default:
        return true;
    }
}

function isKeyBindEnabled(entity, keyBind) {
    var s1 = entity.getData("worm:dyn/slot1");
    var s2 = entity.getData("worm:dyn/slot2");
    var s3 = entity.getData("worm:dyn/slot3");

    switch (keyBind) {
    // Slot 1 display cycle (key 1)
    case "SLOT1_CYCLE_0":
        return s1 == 0;
    case "SLOT1_CYCLE_1":
        return s1 == 1;
    // Slot 2 display cycle (key 2)
    case "SLOT2_CYCLE_0":
        return s2 == 0;
    case "SLOT2_CYCLE_1":
        return s2 == 1;
    // Slot 3 display cycle (key 3)
    case "SLOT3_CYCLE_0":
        return s3 == 0;
    case "SLOT3_CYCLE_1":
        return s3 == 1;
    // Slot 1 active abilities (key 4)
    case "GRAVITY_MANIPULATION":
        return s1 == 0;
    case "HEAT_VISION":
        return s1 == 1 && entity.getData("worm:dyn/eidolon_charge") > 0.1;
    // Slot 2 active abilities (key 5)
    case "SLOW_MOTION":
        return s2 == 0;
    case "TELEKINESIS":
        return s2 == 1;
    default:
        return true;
    }
}

function hasProperty(entity, property) {
    return property == "BREATHE_SPACE";
}
