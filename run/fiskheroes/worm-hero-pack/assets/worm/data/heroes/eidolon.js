// Eidolon — 3 slots with themed powersets
//
// Slot 1 → Key 4: 0=Gravity Control, 1=Energy Absorption, 2=Lightning Storm
// Slot 2 → Key 5: 0=Chronokinesis, 1=Aerokinesis, 2=Forcefield
// Slot 3 → passive: 0=Damage Reflection, 1=Energy Form, 2=Crystal Armor, 3=Intangibility

var SLOT1_COUNT = 3;
var SLOT2_COUNT = 3;
var SLOT3_COUNT = 4;

var speedster_base = implement("fiskheroes:external/speedster_base");

var debounce1 = false;
var debounce2 = false;
var debounce3 = false;
var heroRef = null;

function init(hero) {
    heroRef = hero;
    hero.setName("Eidolon");
    hero.setTier(3);

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
    hero.addAttribute("BASE_SPEED_LEVELS", 3.0, 0);

    // Key 1: Cycle slot 1
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

    hero.addKeyBindFunc("SLOT1_CYCLE_2", function (entity, manager) {
        if (debounce1) return false;
        debounce1 = true;
        var current = entity.getData("worm:dyn/slot1");
        manager.setData(entity, "worm:dyn/slot1", (current + 1) % SLOT1_COUNT);
        return true;
    }, "\u00A7eLightning Storm \u00A78>", 1);

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

    hero.addKeyBindFunc("SLOT2_CYCLE_2", function (entity, manager) {
        if (debounce2) return false;
        debounce2 = true;
        var current = entity.getData("worm:dyn/slot2");
        manager.setData(entity, "worm:dyn/slot2", (current + 1) % SLOT2_COUNT);
        return true;
    }, "\u00A79Forcefield \u00A78>", 2);

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

    hero.addKeyBindFunc("SLOT3_CYCLE_2", function (entity, manager) {
        if (debounce3) return false;
        debounce3 = true;
        var current = entity.getData("worm:dyn/slot3");
        manager.setData(entity, "worm:dyn/slot3", (current + 1) % SLOT3_COUNT);
        return true;
    }, "\u00A73Crystal Armor \u00A78>", 3);

    hero.addKeyBindFunc("SLOT3_CYCLE_3", function (entity, manager) {
        if (debounce3) return false;
        debounce3 = true;
        var current = entity.getData("worm:dyn/slot3");
        manager.setData(entity, "worm:dyn/slot3", (current + 1) % SLOT3_COUNT);
        return true;
    }, "\u00A78Intangibility \u00A78>", 3);

    // Key 4: Slot 1 active abilities
    hero.addKeyBind("GRAVITY_MANIPULATION", "Gravity Control", 4);
    hero.addKeyBind("GROUND_SMASH", "Gravity Blast", 4);
    hero.addKeyBind("HEAT_VISION", "Expel Energy", 4);
    hero.addKeyBind("ENERGY_PROJECTION", "Lightning Storm", 4);

    // Key 5: Slot 2 active abilities
    hero.addKeyBind("SUPER_SPEED", "Chronokinesis", 5);
    hero.addKeyBind("SLOW_MOTION", "Slow Time", 5);
    hero.addKeyBind("TELEKINESIS", "Aerokinesis", 5);
    hero.addKeyBind("SONIC_WAVES", "Tornado", 5);
    hero.addKeyBind("SHIELD", "Forcefield", 5);

    hero.setTickHandler(function (entity, manager) {
        debounce1 = false;
        debounce2 = false;
        debounce3 = false;

        var s1 = entity.getData("worm:dyn/slot1");
        var s2 = entity.getData("worm:dyn/slot2");
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
            manager.setData(entity, "worm:dyn/eidolon_charge", 0);
        }

        // Force shadowform on/off based on slot 3 selection
        var isShadow = entity.getData("fiskheroes:shadowform");
        if (s3 == 1 && !isShadow) {
            manager.setData(entity, "fiskheroes:shadowform", true);
        } else if (s3 != 1 && isShadow) {
            manager.setData(entity, "fiskheroes:shadowform", false);
        }

        // Force intangibility + flight on/off based on slot 3 selection
        var isIntang = entity.getData("fiskheroes:intangible");
        if (s3 == 3 && !isIntang) {
            manager.setData(entity, "fiskheroes:intangible", true);
            manager.setData(entity, "fiskheroes:flying", true);
        } else if (s3 != 3 && isIntang) {
            manager.setData(entity, "fiskheroes:intangible", false);
        }

        // Keep flight on while intangible (prevent falling through world)
        if (s3 == 3 && !entity.getData("fiskheroes:flying")) {
            manager.setData(entity, "fiskheroes:flying", true);
        }

        // Sync super speed with slow motion (both are "Chronokinesis")
        var isSpeeding = entity.getData("fiskheroes:speeding");
        var isSlowMo = entity.getData("fiskheroes:slow_motion");
        if (s2 == 0) {
            // Keep speeding in sync with slow motion toggle
            if (isSlowMo && !isSpeeding) {
                manager.setData(entity, "fiskheroes:speeding", true);
            } else if (!isSlowMo && isSpeeding) {
                manager.setData(entity, "fiskheroes:speeding", false);
            }
        } else if (isSpeeding) {
            // Force off when not on Chronokinesis
            manager.setData(entity, "fiskheroes:speeding", false);
        }

        // Speedster base tick for super speed
        speedster_base.tick(entity, manager);

        // Energy Form: contact damage to nearby entities
        if (s3 == 1) {
            var world = entity.world();
            var nearby = world.getEntitiesInRangeOf(entity.pos(), 3.0);
            for (var i = 0; i < nearby.length; i++) {
                var target = nearby[i];
                if (target.isLivingEntity() && target.getUUID() != entity.getUUID()) {
                    target.hurt(heroRef, "ENERGY_FORM", "%1$s was torn apart by Eidolon", 4.0);
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
    // Slot 1: Gravity Control (0), Energy Absorption (1), Lightning Storm (2)
    case "fiskheroes:gravity_manipulation":
        return s1 == 0;
    case "fiskheroes:ground_smash":
        return s1 == 0;
    case "fiskheroes:heat_vision":
        return s1 == 1 && entity.getData("worm:dyn/eidolon_charge") > 0.1;
    case "fiskheroes:frost_walking":
        return s1 == 1;
    case "fiskheroes:arrow_catching":
        return s1 == 1 || s2 == 0;
    case "fiskheroes:cooldown":
        return s1 == 1;
    case "fiskheroes:energy_projection":
        return s1 == 2;

    // Slot 2: Chronokinesis (0), Aerokinesis (1), Forcefield (2)
    case "fiskheroes:super_speed":
        return s2 == 0;
    case "fiskheroes:slow_motion":
        return s2 == 0;
    case "fiskheroes:telekinesis":
        return s2 == 1;
    case "fiskheroes:sonic_waves":
        return s2 == 1;
    case "fiskheroes:shield":
        return s2 == 2;

    // Flight: Gravity Control (s1==0), Lightning Storm (s1==2), Aerokinesis (s2==1), Energy Form (s3==1), Intangibility (s3==3)
    case "fiskheroes:controlled_flight":
        return s1 == 0 || s1 == 2 || s2 == 1 || s3 == 1 || s3 == 3;

    // Slot 3: Damage Reflection (0), Energy Form (1), Crystal Armor (2), Intangibility (3)
    case "fiskheroes:thorns":
        return s3 == 0;
    case "fiskheroes:shadowform":
        return s3 == 1;
    case "fiskheroes:regeneration":
        return s3 == 1;
    case "fiskheroes:metal_skin":
        return s3 == 2;
    case "fiskheroes:projectile_immunity":
        return s3 == 2;
    case "fiskheroes:fire_immunity":
        return s3 == 2;
    case "fiskheroes:intangibility":
        return s3 == 3;
    case "fiskheroes:damage_immunity":
        return s1 == 1;
    case "fiskheroes:damage_resistance":
        return s1 == 1;

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
    case "SLOT1_CYCLE_2":
        return s1 == 2;
    // Slot 2 display cycle (key 2)
    case "SLOT2_CYCLE_0":
        return s2 == 0;
    case "SLOT2_CYCLE_1":
        return s2 == 1;
    case "SLOT2_CYCLE_2":
        return s2 == 2;
    // Slot 3 display cycle (key 3)
    case "SLOT3_CYCLE_0":
        return s3 == 0;
    case "SLOT3_CYCLE_1":
        return s3 == 1;
    case "SLOT3_CYCLE_2":
        return s3 == 2;
    case "SLOT3_CYCLE_3":
        return s3 == 3;
    // Slot 1 active abilities (key 4)
    case "GRAVITY_MANIPULATION":
        return s1 == 0;
    case "GROUND_SMASH":
        return s1 == 0;
    case "HEAT_VISION":
        return s1 == 1 && entity.getData("worm:dyn/eidolon_charge") > 0.1;
    case "ENERGY_PROJECTION":
        return s1 == 2;
    // Slot 2 active abilities (key 5)
    case "SUPER_SPEED":
        return s2 == 0;
    case "SLOW_MOTION":
        return s2 == 0;
    case "TELEKINESIS":
        return s2 == 1;
    case "SONIC_WAVES":
        return s2 == 1;
    case "SHIELD":
        return s2 == 2;
    default:
        return true;
    }
}

function hasProperty(entity, property) {
    return property == "BREATHE_SPACE";
}
