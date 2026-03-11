var team = implement("worm:external/undersiders");

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
    hero.setName("Grue");
    hero.setTier(3);

    hero.setHelmet("Skull Helmet");
    hero.setChestplate("Motorcycle Jacket");
    hero.setLeggings("Riding Pants");
    hero.setBoots("Combat Boots");

    hero.addPowers("worm:grue_powers");
    hero.addPowers("worm:undersiders");
    hero.addAttribute("PUNCH_DAMAGE", 3.0, 0);
    hero.addAttribute("KNOCKBACK", 0.5, 0);
    hero.addAttribute("SPRINT_SPEED", 0.1, 1);
    hero.addAttribute("JUMP_HEIGHT", 0.5, 0);
    hero.addAttribute("FALL_RESISTANCE", 2.0, 0);

    hero.addKeyBind("SHADOWDOME", "Darkness Flood", 1);
    hero.addKeyBind("ENERGY_PROJECTION", "Blinding Blast", 2);
    hero.addKeyBind("ENERGY_PROJECTION_DISABLED", "\u00A7mBlinding Blast", 2);
    hero.addKeyBind("DARKNESS_AURA", "Darkness Aura", 3);
    hero.addKeyBind("ROUNDHOUSEKICK", "Kick", 4);
    hero.addKeyBind("ROUNDHOUSEKICK_STOP", "\u00A7mKick", 4);

    hero.addDamageProfile("PUNCH", {
        "types": {
            "BLUNT": 1.0
        }
    });
    hero.addDamageProfile("ROUNDHOUSEKICK", {
        "types": {
            "BLUNT": 1.0
        },
        "properties": {
            "HIT_COOLDOWN": 20,
            "ADD_KNOCKBACK": 0.3
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
    hero.setHasPermission(function (entity, permission) {
        return team.hasPermission(entity, permission);
    });
    hero.addKeyBind("AIM", "Aim", -1);
    hero.supplyFunction("canAim", function (entity) {
        return entity.getData("worm:dyn/tt_nearby") && !entity.getHeldItem().isEmpty();
    });

    var heroRef = hero;
    hero.setTickHandler(function (entity, manager) {
        team.tick(entity, manager, heroRef);
        // Kick: auto-cancel when timer completes
        if (entity.getData("worm:dyn/kick_timer") == 1) {
            manager.setData(entity, "worm:dyn/kick", false);
        }
        // Kick: deal damage at the midpoint of the animation
        if (entity.getData("worm:dyn/kick") && entity.getData("worm:dyn/kick_timer") > 0.5 && entity.getData("worm:dyn/kick_timer") < 0.6) {
            var targets = [];
            entity.world().getEntitiesInRangeOf(entity.eyePos(), 3.5).forEach(function (other) {
                if (!entity.equals(other) && other.isLivingEntity() && isInFront(entity, other) && entity.canSee(other)) {
                    targets.push([other, other.pos().distanceTo(entity.pos())]);
                }
            });
            if (targets.length > 0) {
                var target = findClosest(entity, targets)[0];
                target.hurtByAttacker(hero, "ROUNDHOUSEKICK", "%s was kicked to death by %s", 8.0, entity);
            }
        }
        return false;
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
    switch (modifier.name()) {
    case "fiskheroes:energy_projection":
        return !entity.getData("fiskheroes:lightsout") && entity.getHeldItem().isEmpty();
    default:
        return true;
    }
}

function isKeyBindEnabled(entity, keyBind) {
    // During shadowdome charging, only allow the dome keybind
    if (entity.getData("fiskheroes:lightsout")) {
        return keyBind == "SHADOWDOME";
    }

    switch (keyBind) {
    case "ENERGY_PROJECTION":
        return entity.getHeldItem().isEmpty();
    case "ENERGY_PROJECTION_DISABLED":
        return !entity.getHeldItem().isEmpty();
    case "ROUNDHOUSEKICK":
        return entity.getData("worm:dyn/kick_timer") == 0;
    case "ROUNDHOUSEKICK_STOP":
        return entity.getData("worm:dyn/kick_timer") != 0;
    case "DARKNESS_AURA":
        return true;
    default:
        return true;
    }
}
