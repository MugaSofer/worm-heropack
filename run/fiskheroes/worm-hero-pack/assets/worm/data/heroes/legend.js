var super_boost = implement("fiskheroes:external/super_boost");
var falcon_base = implement("fiskheroes:external/falcon_base");

var METHOD_COUNT = 5;
var EFFECT_COUNT = 5;
var METHOD_NAMES = ["basic", "aoe", "staccato", "invisible", "swarm"];
var EFFECT_NAMES = ["concussive", "cutting", "heat", "cold", "disintegration"];

var debounce_method = false;
var debounce_effect = false;

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

    // Key 3: Fire laser
    hero.addKeyBind("CHARGED_BEAM", "Fire", 3);

    hero.setHasProperty(hasProperty);
    hero.setModifierEnabled(isModifierEnabled);
    hero.setKeyBindEnabled(isKeyBindEnabled);

    hero.addDamageProfile("PUNCH", {
        "types": {
            "BLUNT": 1.0
        }
    });
    hero.setDamageProfile(getDamageProfile);

    falcon_base.init(hero, super_boost, "3", 0.25, function (entity, manager) {
        debounce_method = false;
        debounce_effect = false;
    });
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

function isModifierEnabled(entity, modifier) {
    if (modifier.name() == "fiskheroes:charged_beam") {
        var method = entity.getData("worm:dyn/laser_method");
        var effect = entity.getData("worm:dyn/laser_effect");
        var expected = getMethodName(method) + "_" + getEffectName(effect);
        return modifier.id() == expected;
    }
    return super_boost.isModifierEnabled(entity, modifier);
}

function isKeyBindEnabled(entity, keyBind) {
    var method = entity.getData("worm:dyn/laser_method");
    var effect = entity.getData("worm:dyn/laser_effect");

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
    case "CHARGED_BEAM": return true;
    default:
        return super_boost.isKeyBindEnabled(entity, keyBind);
    }
}

function hasProperty(entity, property) {
    return property == "NIGHT_VISION" || property == "BREATHE_SPACE";
}
