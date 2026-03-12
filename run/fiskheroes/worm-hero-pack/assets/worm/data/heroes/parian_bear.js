var parian = implement("worm:external/parian_base");

function init(hero) {
    hero.setName("Parian's Bear");
    hero.setTier(7);

    hero.setChestplate("Costume");

    hero.addPowers("worm:parian_powers");
    hero.addKeyBind("SENTRY_MODE", "key.sentryMode", 3);
    hero.addAttribute("PUNCH_DAMAGE", 8.0, 0);
    hero.addAttribute("SPRINT_SPEED", 0.15, 1);
    hero.addAttribute("JUMP_HEIGHT", 1.0, 0);
    hero.addAttribute("FALL_RESISTANCE", 1.0, 0);
    hero.addAttribute("KNOCKBACK", 0.5, 0);

    hero.addDamageProfile("PUNCH", {
        "types": {
            "BLUNT": 1.0
        }
    });
    hero.setDamageProfile(function (entity) {
        return "PUNCH";
    });

    parian.init(hero, "parian_bear");

    hero.setTickHandler(function (entity, manager) {
        parian.tick(entity, manager, "parian_bear", 8.0);
    });
}
