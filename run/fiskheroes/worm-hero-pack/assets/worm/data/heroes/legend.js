var super_boost = implement("fiskheroes:external/super_boost");
var falcon_base = implement("fiskheroes:external/falcon_base");

var LASER_MODE_COUNT = 5;
var debounce = false;

function init(hero) {
    hero.setName("Legend");
    hero.setTier(9);

    hero.setHelmet("Helmet");
    hero.setChestplate("Chestplate");
    hero.setLeggings("Leggings");
    hero.setBoots("Boots");

    hero.addPowers("worm:legend_powers");
    hero.addAttribute("PUNCH_DAMAGE", 6.0, 0);
    hero.addAttribute("WEAPON_DAMAGE", 1.0, 0);
    hero.addAttribute("FALL_RESISTANCE", 1.0, 1);
    hero.addAttribute("SPRINT_SPEED", 0.4, 1);
    hero.addAttribute("JUMP_HEIGHT", 0.8, 0);
    hero.addAttribute("KNOCKBACK", 0.3, 0);

    // Key 1: Cycle lasers — one function keybind per mode, only the active one shows
    // Uses debounce to prevent multiple function keybinds firing per keypress (infinity ultron pattern)
    hero.addKeyBindFunc("LASER_CYCLE_0", function (entity, manager) {
        if (debounce) return false;
        debounce = true;
        var current = entity.getData("worm:dyn/laser_mode");
        manager.setData(entity, "worm:dyn/laser_mode", (current + 1) % LASER_MODE_COUNT);
        return true;
    }, "\u00A7fLaser Beam \u00A78>", 1);

    hero.addKeyBindFunc("LASER_CYCLE_1", function (entity, manager) {
        if (debounce) return false;
        debounce = true;
        var current = entity.getData("worm:dyn/laser_mode");
        manager.setData(entity, "worm:dyn/laser_mode", (current + 1) % LASER_MODE_COUNT);
        return true;
    }, "\u00A7bIce Laser \u00A78>", 1);

    hero.addKeyBindFunc("LASER_CYCLE_2", function (entity, manager) {
        if (debounce) return false;
        debounce = true;
        var current = entity.getData("worm:dyn/laser_mode");
        manager.setData(entity, "worm:dyn/laser_mode", (current + 1) % LASER_MODE_COUNT);
        return true;
    }, "\u00A7cAoE Blast \u00A78>", 1);

    hero.addKeyBindFunc("LASER_CYCLE_3", function (entity, manager) {
        if (debounce) return false;
        debounce = true;
        var current = entity.getData("worm:dyn/laser_mode");
        manager.setData(entity, "worm:dyn/laser_mode", (current + 1) % LASER_MODE_COUNT);
        return true;
    }, "\u00A76Concussive Bolt \u00A78>", 1);

    hero.addKeyBindFunc("LASER_CYCLE_4", function (entity, manager) {
        if (debounce) return false;
        debounce = true;
        var current = entity.getData("worm:dyn/laser_mode");
        manager.setData(entity, "worm:dyn/laser_mode", (current + 1) % LASER_MODE_COUNT);
        return true;
    }, "\u00A7eLaser Swarm \u00A78>", 1);

    // Key 2: Fire laser
    hero.addKeyBind("CHARGED_BEAM", "Fire", 2);

    hero.setHasProperty(hasProperty);
    hero.setModifierEnabled(isModifierEnabled);
    hero.setKeyBindEnabled(isKeyBindEnabled);

    hero.addDamageProfile("PUNCH", {
        "types": {
            "BLUNT": 1.0
        }
    });
    hero.setDamageProfile(getDamageProfile);

    falcon_base.init(hero, super_boost, "2", 0.25, function (entity, manager) {
        debounce = false;
    });
}

function getDamageProfile(entity) {
    return "PUNCH";
}

function isModifierEnabled(entity, modifier) {
    var mode = entity.getData("worm:dyn/laser_mode");
    if (modifier.name() == "fiskheroes:charged_beam") {
        switch (modifier.id()) {
        case "generic":
            return mode == 0;
        case "ice":
            return mode == 1;
        case "aoe":
            return mode == 2;
        case "concussive":
            return mode == 3;
        case "swarm":
            return mode == 4;
        }
        return false;
    }
    return super_boost.isModifierEnabled(entity, modifier);
}

function isKeyBindEnabled(entity, keyBind) {
    var mode = entity.getData("worm:dyn/laser_mode");
    switch (keyBind) {
    case "LASER_CYCLE_0":
        return mode == 0;
    case "LASER_CYCLE_1":
        return mode == 1;
    case "LASER_CYCLE_2":
        return mode == 2;
    case "LASER_CYCLE_3":
        return mode == 3;
    case "LASER_CYCLE_4":
        return mode == 4;
    case "CHARGED_BEAM":
        return true;
    default:
        return super_boost.isKeyBindEnabled(entity, keyBind);
    }
}

function hasProperty(entity, property) {
    return property == "NIGHT_VISION" || property == "BREATHE_SPACE";
}
