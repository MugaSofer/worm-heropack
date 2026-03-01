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

    hero.addKeyBind("GROUND_SMASH", "key.groundSmash", 3);

    hero.setKeyBindEnabled(isKeyBindEnabled);
    hero.setHasProperty(hasProperty);

    hero.setTickHandler(function (entity, manager) {
        landing.tick(entity, manager);
    });
}

function isKeyBindEnabled(entity, keyBind) {
    if (entity.isSprinting() && entity.getData("fiskheroes:flying")) {
        return false;
    }
    return true;
}

function hasProperty(entity, property) {
    return property == "BREATHE_SPACE";
}
