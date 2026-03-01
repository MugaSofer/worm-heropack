var super_boost = implement("fiskheroes:external/super_boost");
var falcon_base = implement("fiskheroes:external/falcon_base");
var landing = implement("fiskheroes:external/superhero_landing");

function init(hero) {
    hero.setName("Alexandria");
    hero.setTier(9);

    hero.setHelmet("Helmet");
    hero.setChestplate("Chestplate");
    hero.setLeggings("Leggings");
    hero.setBoots("Boots");

    hero.addPowers("worm:alexandria_powers");
    hero.addAttribute("PUNCH_DAMAGE", 12.0, 0);
    hero.addAttribute("WEAPON_DAMAGE", 2.0, 0);
    hero.addAttribute("FALL_RESISTANCE", 1.0, 1);
    hero.addAttribute("SPRINT_SPEED", 0.3, 1);
    hero.addAttribute("JUMP_HEIGHT", 1.0, 0);
    hero.addAttribute("KNOCKBACK", 0.5, 0);
    hero.addAttribute("MAX_HEALTH", 10.0, 0);

    hero.addKeyBind("CHARGED_BEAM", "Two-Handed Blow", 1);
    hero.addKeyBind("SLOW_MOTION", "Combat Thinker", 2);
    hero.addKeyBind("GROUND_SMASH", "key.groundSmash", 3);

    hero.setHasProperty(hasProperty);

    hero.addDamageProfile("PUNCH", {
        "types": {
            "BLUNT": 1.0
        },
        "properties": {
            "ADD_KNOCKBACK": 3.0
        }
    });
    hero.setDamageProfile(getDamageProfile);

    hero.setModifierEnabled(isModifierEnabled);
    hero.setKeyBindEnabled(isKeyBindEnabled);

    falcon_base.init(hero, super_boost, "2", 0.25, function (entity, manager) {
        landing.tick(entity, manager);
    });
}

function getDamageProfile(entity) {
    return "PUNCH";
}

function isModifierEnabled(entity, modifier) {
    return super_boost.isModifierEnabled(entity, modifier);
}

function isKeyBindEnabled(entity, keyBind) {
    return super_boost.isKeyBindEnabled(entity, keyBind);
}

function hasProperty(entity, property) {
    return property == "BREATHE_SPACE";
}
