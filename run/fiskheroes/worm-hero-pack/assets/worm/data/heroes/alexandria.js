var super_boost = implement("fiskheroes:external/super_boost");
var falcon_base = implement("fiskheroes:external/falcon_base");
var landing = implement("fiskheroes:external/superhero_landing");

function isInFront(entity, other) {
    return entity.getLookVector().dot(entity.pos().subtract(other.pos())) < 0;
}

function findClosest(entity, pairs) {
    var closest = pairs[0];
    for (var i = 1; i < pairs.length; i++) {
        if (pairs[i][1] < closest[1]) {
            closest = pairs[i];
        }
    }
    return closest;
}

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
    hero.addKeyBind("ROUNDHOUSEKICK", "Kick", 4);
    hero.addKeyBind("ROUNDHOUSEKICK_STOP", "\u00A7mKick", 4);


    hero.setHasProperty(hasProperty);

    hero.addDamageProfile("PUNCH", {
        "types": {
            "BLUNT": 1.0
        },
        "properties": {
            "ADD_KNOCKBACK": 3.0
        }
    });
    hero.addDamageProfile("ROUNDHOUSEKICK", {
        "types": {
            "BLUNT": 1.0
        },
        "properties": {
            "HIT_COOLDOWN": 20,
            "ADD_KNOCKBACK": 2.0
        }
    });
    hero.setDamageProfile(getDamageProfile);

    hero.addAttributeProfile("ROUNDHOUSEKICK", function (profile) {
        profile.inheritDefaults();
        profile.addAttribute("JUMP_HEIGHT", -10, 0);
        profile.addAttribute("SPRINT_SPEED", -100, 0);
        profile.addAttribute("BASE_SPEED", -100, 0);
    });
    hero.setAttributeProfile(getAttributeProfile);

    hero.setModifierEnabled(isModifierEnabled);
    hero.setKeyBindEnabled(isKeyBindEnabled);

    falcon_base.init(hero, super_boost, "2", 0.25, function (entity, manager) {
        landing.tick(entity, manager);

        // Kick damage logic
        if (entity.getData("worm:dyn/kick_timer") == 1) {
            manager.setData(entity, "worm:dyn/kick", false);
        }
        if (entity.getData("worm:dyn/kick") && entity.getData("worm:dyn/kick_timer") > 0.5 && entity.getData("worm:dyn/kick_timer") < 0.6) {
            var targets = [];
            entity.world().getEntitiesInRangeOf(entity.eyePos(), 3.5).forEach(function (other) {
                if (!entity.equals(other) && other.isLivingEntity() && isInFront(entity, other) && entity.canSee(other)) {
                    targets.push([other, other.pos().distanceTo(entity.pos())]);
                }
            });
            if (targets.length > 0) {
                var target = findClosest(entity, targets)[0];
                target.hurtByAttacker(hero, "ROUNDHOUSEKICK", "%s was kicked to death by %s", 15.0, entity);
            }
        }


    });
}

function getDamageProfile(entity) {
    return "PUNCH";
}

function getAttributeProfile(entity) {
    if (entity.getData("worm:dyn/kick") && entity.getData("worm:dyn/kick_timer") < 0.5) {
        return "ROUNDHOUSEKICK";
    }
    return null;
}

function isModifierEnabled(entity, modifier) {
    return super_boost.isModifierEnabled(entity, modifier);
}

function isKeyBindEnabled(entity, keyBind) {
    var kicking = entity.getData("worm:dyn/kick") && entity.getData("worm:dyn/kick_timer") < 0.5;
    switch (keyBind) {
    case "ROUNDHOUSEKICK":
        return entity.getData("worm:dyn/kick_timer") == 0;
    case "ROUNDHOUSEKICK_STOP":
        return entity.getData("worm:dyn/kick_timer") != 0;
    default:
        return super_boost.isKeyBindEnabled(entity, keyBind);
    }
}

function hasProperty(entity, property) {
    return property == "BREATHE_SPACE";
}
