function init(hero) {
    hero.setName("Parian");
    hero.setTier(2);

    hero.setHelmet("Mask & Wig");
    hero.setChestplate("Top");
    hero.setLeggings("Skirt");
    hero.setBoots("Shoes");

    hero.addPowers("worm:parian_powers");
    hero.addAttribute("PUNCH_DAMAGE", 1.0, 0);
    hero.addAttribute("SPRINT_SPEED", 0.05, 1);
    hero.addAttribute("FALL_RESISTANCE", 1.0, 0);

    hero.addDamageProfile("PUNCH", {
        "types": {
            "BLUNT": 1.0
        }
    });
    hero.setDamageProfile(function (entity) {
        return "PUNCH";
    });
}
