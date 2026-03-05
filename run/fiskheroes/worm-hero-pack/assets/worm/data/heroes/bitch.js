function init(hero) {
    hero.setName("Bitch");
    hero.setTier(3);

    hero.setHelmet("Mask");
    hero.setChestplate("Coat");
    hero.setLeggings("Skirt");
    hero.setBoots("Boots");

    hero.addAttribute("PUNCH_DAMAGE", 10.0, 0);
    hero.addAttribute("KNOCKBACK", 1.0, 0);
    hero.addAttribute("SPRINT_SPEED", 0.3, 1);
    hero.addAttribute("JUMP_HEIGHT", 1.0, 0);
    hero.addAttribute("FALL_RESISTANCE", 1.0, 1);
    hero.addAttribute("MAX_HEALTH", 5.0, 0);
}
