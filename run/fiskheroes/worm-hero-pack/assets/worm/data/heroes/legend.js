var super_boost = implement("fiskheroes:external/super_boost");
var falcon_base = implement("fiskheroes:external/falcon_base");

var METHOD_COUNT = 5;
var EFFECT_COUNT = 5;
var METHOD_NAMES = ["basic", "aoe", "staccato", "invisible", "swarm"];
var EFFECT_NAMES = ["concussive", "cutting", "heat", "cold", "disintegration"];

var debounce_method = false;
var debounce_effect = false;
var wasTeleporting = false;

function init(hero) {
    hero.setName("Legend");
    hero.setTier(9);

    hero.setHelmet("Mask");
    hero.setChestplate("Shirt");
    hero.setLeggings("Tights");
    hero.setBoots("Boots");

    hero.addPowers("worm:legend_powers");
    hero.addAttribute("PUNCH_DAMAGE", 6.0, 0);
    hero.addAttribute("WEAPON_DAMAGE", 1.0, 0);
    hero.addAttribute("FALL_RESISTANCE", 1.0, 1);
    hero.addAttribute("SPRINT_SPEED", 0.4, 1);
    hero.addAttribute("JUMP_HEIGHT", 0.8, 0);
    hero.addAttribute("KNOCKBACK", 0.3, 0);

    // Key 1: Cycle method — beam shape/delivery
    hero.addKeyBindFunc("METHOD_0", function (entity, manager) {
        if (debounce_method) return false;
        debounce_method = true;
        var current = entity.getData("worm:dyn/laser_method");
        manager.setData(entity, "worm:dyn/laser_method", (current + 1) % METHOD_COUNT);
        return true;
    }, "\u00A7fMethod: \u00A7fBasic \u00A78>", 1);

    hero.addKeyBindFunc("METHOD_1", function (entity, manager) {
        if (debounce_method) return false;
        debounce_method = true;
        var current = entity.getData("worm:dyn/laser_method");
        manager.setData(entity, "worm:dyn/laser_method", (current + 1) % METHOD_COUNT);
        return true;
    }, "\u00A7fMethod: \u00A7cFat AoE \u00A78>", 1);

    hero.addKeyBindFunc("METHOD_2", function (entity, manager) {
        if (debounce_method) return false;
        debounce_method = true;
        var current = entity.getData("worm:dyn/laser_method");
        manager.setData(entity, "worm:dyn/laser_method", (current + 1) % METHOD_COUNT);
        return true;
    }, "\u00A7fMethod: \u00A76Staccato \u00A78>", 1);

    hero.addKeyBindFunc("METHOD_3", function (entity, manager) {
        if (debounce_method) return false;
        debounce_method = true;
        var current = entity.getData("worm:dyn/laser_method");
        manager.setData(entity, "worm:dyn/laser_method", (current + 1) % METHOD_COUNT);
        return true;
    }, "\u00A7fMethod: \u00A78Invisible \u00A78>", 1);

    hero.addKeyBindFunc("METHOD_4", function (entity, manager) {
        if (debounce_method) return false;
        debounce_method = true;
        var current = entity.getData("worm:dyn/laser_method");
        manager.setData(entity, "worm:dyn/laser_method", (current + 1) % METHOD_COUNT);
        return true;
    }, "\u00A7fMethod: \u00A7eSwarm \u00A78>", 1);

    // Key 2: Cycle effect — damage type/properties
    hero.addKeyBindFunc("EFFECT_0", function (entity, manager) {
        if (debounce_effect) return false;
        debounce_effect = true;
        var current = entity.getData("worm:dyn/laser_effect");
        manager.setData(entity, "worm:dyn/laser_effect", (current + 1) % EFFECT_COUNT);
        return true;
    }, "\u00A7fEffect: \u00A77Concussive \u00A78>", 2);

    hero.addKeyBindFunc("EFFECT_1", function (entity, manager) {
        if (debounce_effect) return false;
        debounce_effect = true;
        var current = entity.getData("worm:dyn/laser_effect");
        manager.setData(entity, "worm:dyn/laser_effect", (current + 1) % EFFECT_COUNT);
        return true;
    }, "\u00A7fEffect: \u00A7fCutting \u00A78>", 2);

    hero.addKeyBindFunc("EFFECT_2", function (entity, manager) {
        if (debounce_effect) return false;
        debounce_effect = true;
        var current = entity.getData("worm:dyn/laser_effect");
        manager.setData(entity, "worm:dyn/laser_effect", (current + 1) % EFFECT_COUNT);
        return true;
    }, "\u00A7fEffect: \u00A7cHeat \u00A78>", 2);

    hero.addKeyBindFunc("EFFECT_3", function (entity, manager) {
        if (debounce_effect) return false;
        debounce_effect = true;
        var current = entity.getData("worm:dyn/laser_effect");
        manager.setData(entity, "worm:dyn/laser_effect", (current + 1) % EFFECT_COUNT);
        return true;
    }, "\u00A7fEffect: \u00A7bCold \u00A78>", 2);

    hero.addKeyBindFunc("EFFECT_4", function (entity, manager) {
        if (debounce_effect) return false;
        debounce_effect = true;
        var current = entity.getData("worm:dyn/laser_effect");
        manager.setData(entity, "worm:dyn/laser_effect", (current + 1) % EFFECT_COUNT);
        return true;
    }, "\u00A7fEffect: \u00A74Disintegration \u00A78>", 2);

    // Key 3: Fire laser (charged_beam for most methods, energy_projection for staccato)
    hero.addKeyBind("CHARGED_BEAM", "Fire", 3);
    hero.addKeyBind("ENERGY_PROJECTION", "Fire", 3);

    // Key 4: Bombardment (ground slam + heat_vision beam VFX)
    hero.addKeyBind("GROUND_SMASH", "Bombardment", 4);
    hero.addKeyBind("GROUND_SMASH_VISUAL", "Bombardment", 4);
    hero.addKeyBind("HEAT_VISION", "Bombardment", 4);

    hero.setHasProperty(hasProperty);
    hero.setModifierEnabled(isModifierEnabled);
    hero.setKeyBindEnabled(isKeyBindEnabled);

    hero.addDamageProfile("PUNCH", {
        "types": {
            "BLUNT": 1.0
        }
    });
    hero.setDamageProfile(getDamageProfile);

    // Key 5: Relativistic teleport (energy form only)
    hero.addKeyBind("TELEPORT", "Relativistic", 5);

    falcon_base.init(hero, super_boost, "4", 0.25, function (entity, manager) {
        debounce_method = false;
        debounce_effect = false;

        // Bombardment state
        var isBombarding = entity.getData("worm:dyn/bombardment_active");
        var bombTimer = entity.getData("worm:dyn/bombardment_timer");
        var cooldown = entity.getData("worm:dyn/bombardment_cooldown");

        // Detect click while holding bombardment key (cooldown gate prevents retrigger)
        if (!isBombarding && entity.getData("worm:dyn/bombardment_held") && entity.getPunchTimer() > 0 && cooldown == 0) {
            manager.setData(entity, "worm:dyn/bombardment_active", true);
        }

        // Increment timer while active, reset when done
        manager.incrementData(entity, "worm:dyn/bombardment_timer", 5, isBombarding);
        if (bombTimer >= 1.0) {
            manager.setData(entity, "worm:dyn/bombardment_active", false);
            manager.setData(entity, "worm:dyn/bombardment_cooldown", 60);
        }

        // Count down bombardment cooldown
        if (cooldown > 0) {
            manager.setData(entity, "worm:dyn/bombardment_cooldown", cooldown - 1);
        }

        // Re-enable flight after teleporting
        var teleportDelay = entity.getData("fiskheroes:teleport_delay");
        if (teleportDelay > 0) {
            wasTeleporting = true;
        } else if (wasTeleporting) {
            wasTeleporting = false;
            if (!entity.getData("fiskheroes:flying")) {
                manager.setData(entity, "fiskheroes:flying", true);
            }
        }
    });

    hero.addAttributeProfile("BOMBARDMENT", bombardmentProfile);
    hero.setAttributeProfile(getAttributeProfile);
}

function getDamageProfile(entity) {
    return "PUNCH";
}

function getMethodName(m) {
    if (m == 0) return "basic";
    if (m == 1) return "aoe";
    if (m == 2) return "staccato";
    if (m == 3) return "invisible";
    if (m == 4) return "swarm";
    return "basic";
}

function getEffectName(e) {
    if (e == 0) return "concussive";
    if (e == 1) return "cutting";
    if (e == 2) return "heat";
    if (e == 3) return "cold";
    if (e == 4) return "disintegration";
    return "concussive";
}

function bombardmentProfile(profile) {
    profile.inheritDefaults();
    profile.addAttribute("REACH_DISTANCE", 40.0, 0);
}

function getAttributeProfile(entity) {
    return entity.getData("worm:dyn/bombardment_held") ? "BOMBARDMENT" : null;
}

function isModifierEnabled(entity, modifier) {
    var effect = entity.getData("worm:dyn/laser_effect");
    var effectName = getEffectName(effect);
    var method = entity.getData("worm:dyn/laser_method");
    var isBoosting = entity.isSprinting() && entity.getData("fiskheroes:flying");

    if (modifier.name() == "fiskheroes:healing_factor") {
        return isBoosting;
    }
    if (modifier.name() == "fiskheroes:teleportation") {
        return isBoosting;
    }
    if (modifier.name() == "fiskheroes:damage_immunity") {
        var id = modifier.id();
        if (id == "energy_boost" || id == "explosion_boost" || id == "cold_boost") {
            return isBoosting;
        }
    }
    if (modifier.name() == "fiskheroes:charged_beam") {
        // Charged beam handles all methods except staccato (which uses energy_projection)
        if (method == 2) return false;
        var expected = getMethodName(method) + "_" + effectName;
        return modifier.id() == expected;
    }
    if (modifier.name() == "fiskheroes:energy_projection") {
        // Staccato uses energy_projection for continuous fire
        if (method == 2) {
            return modifier.id() == "staccato_" + effectName;
        }
        return false;
    }
    if (modifier.name() == "fiskheroes:heat_vision") {
        // Bombardment beam VFX — small beam when mining, big beam on right-click burst
        return entity.getData("worm:dyn/bombardment_held")
            && (entity.getData("worm:dyn/bombardment_active") || entity.isPunching())
            && modifier.id() == "bombardment_" + effectName;
    }
    return super_boost.isModifierEnabled(entity, modifier);
}

function isKeyBindEnabled(entity, keyBind) {
    var method = entity.getData("worm:dyn/laser_method");
    var effect = entity.getData("worm:dyn/laser_effect");
    var isBoosting = entity.isSprinting() && entity.getData("fiskheroes:flying");

    switch (keyBind) {
    case "METHOD_0": return method == 0;
    case "METHOD_1": return method == 1;
    case "METHOD_2": return method == 2;
    case "METHOD_3": return method == 3;
    case "METHOD_4": return method == 4;
    case "EFFECT_0": return effect == 0;
    case "EFFECT_1": return effect == 1;
    case "EFFECT_2": return effect == 2;
    case "EFFECT_3": return effect == 3;
    case "EFFECT_4": return effect == 4;
    case "CHARGED_BEAM": return method != 2;
    case "ENERGY_PROJECTION": return method == 2;
    case "GROUND_SMASH": return !isBoosting;
    case "GROUND_SMASH_VISUAL": return !isBoosting;
    case "HEAT_VISION": return !isBoosting;
    case "TELEPORT": return isBoosting;
    default:
        return super_boost.isKeyBindEnabled(entity, keyBind);
    }
}

function hasProperty(entity, property) {
    if (property == "NIGHT_VISION") {
        return entity.world().getDimension() != 2595;
    }
    return property == "BREATHE_SPACE";
}
