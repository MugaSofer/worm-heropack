function init(hero) {
    hero.setName("Bitch");
    hero.setTier(3);

    hero.setHelmet("Mask");
    hero.setChestplate("Coat");
    hero.setLeggings("Skirt");
    hero.setBoots("Boots");

    hero.setDefaultScale(1.75);

    hero.addAttribute("PUNCH_DAMAGE", 10.0, 0);
    hero.addAttribute("KNOCKBACK", 1.0, 0);
    hero.addAttribute("SPRINT_SPEED", 0.3, 1);
    hero.addAttribute("JUMP_HEIGHT", 3.0, 0);
    hero.addAttribute("FALL_RESISTANCE", 1.0, 1);
    hero.addAttribute("MAX_HEALTH", 20.0, 0);
    hero.addAttribute("STEP_HEIGHT", 0.5, 0);
    hero.addAttribute("SPRINT_JUMP_FACTOR", 1.5, 0);

    hero.setTickHandler(function (entity, manager) {
        if (entity.getData("fiskheroes:scale") != 1.75) {
            manager.setData(entity, "fiskheroes:scale", 1.75);
        }
    });
}
