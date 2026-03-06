function init(hero) {
    hero.setName("Imp");
    hero.setTier(2);

    hero.setHelmet("Mask");
    hero.setChestplate("Top");
    hero.setLeggings("Pants");
    hero.setBoots("Boots");

    hero.setHasProperty(function (entity, property) { return property == "MASK_TOGGLE"; });

    hero.addPowers("worm:imp_powers");
    hero.addAttribute("PUNCH_DAMAGE", 2.0, 0);
    hero.addAttribute("SPRINT_SPEED", 0.05, 1);
    hero.addAttribute("FALL_RESISTANCE", 1.0, 0);

    hero.addKeyBind("HEAT_VISION", "Reveal Self", 1);

    hero.addDamageProfile("PUNCH", {
        "types": {
            "BLUNT": 1.0
        }
    });
    hero.setDamageProfile(getDamageProfile);

    hero.setTickHandler(function (entity, manager) {
        // Visible when holding reveal (heat_vision active) or punching
        var revealing = entity.getData("fiskheroes:heat_vision");
        var punching = entity.isPunching();
        manager.setDataWithNotify(entity, "fiskheroes:invisible", !revealing && !punching);
        return false;
    });
}

function getDamageProfile(entity) {
    return "PUNCH";
}
