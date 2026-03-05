function init(hero) {
    hero.setName("Imp");
    hero.setTier(2);

    hero.setHelmet("Mask");
    hero.setChestplate("Top");
    hero.setLeggings("Pants");
    hero.setBoots("Boots");

    hero.addPowers("worm:imp_powers");
    hero.addAttribute("PUNCH_DAMAGE", 2.0, 0);
    hero.addAttribute("SPRINT_SPEED", 0.05, 1);
    hero.addAttribute("FALL_RESISTANCE", 1.0, 0);

    hero.addKeyBind("REVEAL", "Reveal Self", 1);

    hero.addDamageProfile("PUNCH", {
        "types": {
            "BLUNT": 1.0
        }
    });
    hero.setDamageProfile(getDamageProfile);

    hero.setTickHandler(function (entity, manager) {
        // Invisible when not revealed and not punching
        var revealed = entity.getData("worm:dyn/imp_visible_timer") > 0;
        var punching = entity.isPunching();
        manager.setDataWithNotify(entity, "fiskheroes:invisible", !revealed && !punching);
        return false;
    });
}

function getDamageProfile(entity) {
    return "PUNCH";
}
