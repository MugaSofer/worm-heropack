function init(hero) {
    hero.setName("Foil");
    hero.setTier(4);

    hero.setHelmet("Visor");
    hero.setChestplate("Top & Armor");
    hero.setLeggings("Tights");
    hero.setBoots("Boots");

    hero.addPowers("worm:foil_powers");

    // Base attributes — skilled fencer with enhanced timing
    hero.addAttribute("PUNCH_DAMAGE", 3.0, 0);
    hero.addAttribute("WEAPON_DAMAGE", 4.0, 0);
    hero.addAttribute("SPRINT_SPEED", 0.1, 1);
    hero.addAttribute("FALL_RESISTANCE", 2.0, 0);
    hero.addAttribute("JUMP_HEIGHT", 0.5, 0);

    // Rapier — toggle equip/unequip
    hero.addPrimaryEquipment("fisktag:weapon{WeaponType:worm:rapier}", true, function (item) {
        return item.nbt().getString("WeaponType") == "worm:rapier";
    });

    // Sting attribute profile — massive weapon damage boost
    hero.addAttributeProfile("STING", function (profile) {
        profile.inheritDefaults();
        profile.addAttribute("WEAPON_DAMAGE", 25.0, 0);
        profile.addAttribute("PUNCH_DAMAGE", 15.0, 0);
    });

    hero.setAttributeProfile(function (entity) {
        if (entity.getData("worm:dyn/foil_sting")) return "STING";
        return null;
    });

    // Damage profiles
    hero.addDamageProfile("PUNCH", {
        "types": { "BLUNT": 1.0 }
    });
    hero.addDamageProfile("STING_PUNCH", {
        "types": { "SHARP": 1.0 }
    });
    hero.addDamageProfile("RAPIER", {
        "types": { "SHARP": 1.0 }
    });
    hero.addDamageProfile("STING_RAPIER", {
        "types": { "SHARP": 1.0 }
    });

    hero.setDamageProfile(function (entity) {
        var sting = entity.getData("worm:dyn/foil_sting");
        var holding = entity.getHeldItem().name() == "fisktag:weapon";
        if (holding && sting) return "STING_RAPIER";
        if (holding) return "RAPIER";
        if (sting) return "STING_PUNCH";
        return "PUNCH";
    });

    // Sting toggle via keybind
    hero.addKeyBindFunc("STING", function (entity, manager) {
        var current = entity.getData("worm:dyn/foil_sting");
        manager.setData(entity, "worm:dyn/foil_sting", !current);
        return true;
    }, "Sting", 2);
}
