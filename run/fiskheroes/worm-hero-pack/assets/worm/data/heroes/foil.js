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

    // Rapier — auto-equip
    hero.addPrimaryEquipment("fisktag:weapon{WeaponType:worm:rapier}", true, function (item) {
        return item.nbt().getString("WeaponType") == "worm:rapier";
    });

    // Sting mode cycling: 0=off, 1=pinning, 2=lethal, 3=climbing (slot 1)
    hero.addKeyBindFunc("STING_0", function (entity, manager) {
        manager.setData(entity, "worm:dyn/foil_sting", 1);
        return true;
    }, "\u00A7fSting: \u00A77Off \u00A78>", 1);

    hero.addKeyBindFunc("STING_1", function (entity, manager) {
        manager.setData(entity, "worm:dyn/foil_sting", 2);
        return true;
    }, "\u00A7fSting: \u00A7ePinning \u00A78>", 1);

    hero.addKeyBindFunc("STING_2", function (entity, manager) {
        manager.setData(entity, "worm:dyn/foil_sting", 3);
        return true;
    }, "\u00A7fSting: \u00A7cLethal \u00A78>", 1);

    hero.addKeyBindFunc("STING_3", function (entity, manager) {
        manager.setData(entity, "worm:dyn/foil_sting", 0);
        return true;
    }, "\u00A7fSting: \u00A7bClimbing \u00A78>", 1);

    // Throwing darts (slot 2)
    hero.addKeyBind("UTILITY_BELT", "Throwing Darts", 2);

    // Crossbow (slot 3)
    hero.addKeyBind("AIM", "Crossbow", 3);
    hero.supplyFunction("canAim", function (entity) {
        return entity.getHeldItem().isEmpty();
    });

    hero.setKeyBindEnabled(function (entity, keyBind) {
        var mode = Number(entity.getData("worm:dyn/foil_sting"));
        if (keyBind == "STING_0") return mode == 0;
        if (keyBind == "STING_1") return mode == 1;
        if (keyBind == "STING_2") return mode == 2;
        if (keyBind == "STING_3") return mode == 3;
        return true;
    });

    // Gate equipment variants on sting mode
    hero.setModifierEnabled(function (entity, modifier) {
        var mode = Number(entity.getData("worm:dyn/foil_sting"));
        if (modifier.name() == "fiskheroes:equipment") {
            if (modifier.id() == "normal") return mode == 0;
            if (modifier.id() == "pinning") return mode == 1;
            if (modifier.id() == "lethal") return mode == 2;
        }
        if (modifier.name() == "fiskheroes:repulsor_blast") {
            if (modifier.id() == "normal") return mode == 0;
            if (modifier.id() == "pinning") return mode == 1;
            if (modifier.id() == "lethal") return mode == 2;
        }
        if (modifier.name() == "fiskheroes:controlled_flight") {
            if (mode != 3) return false;
            // Only allow flight when adjacent to a wall
            var pos = entity.pos();
            return entity.world().getBlock(pos.add(1, 0, 0)) != "minecraft:air"
                || entity.world().getBlock(pos.add(-1, 0, 0)) != "minecraft:air"
                || entity.world().getBlock(pos.add(0, 0, 1)) != "minecraft:air"
                || entity.world().getBlock(pos.add(0, 0, -1)) != "minecraft:air";
        }
        return true;
    });

    // Tick handler — disable flying when not next to a wall in climbing mode
    hero.setTickHandler(function (entity, manager) {
        var mode = Number(entity.getData("worm:dyn/foil_sting"));
        if (mode == 3 && entity.getData("fiskheroes:flying")) {
            var pos = entity.pos();
            var nearWall = entity.world().getBlock(pos.add(1, 0, 0)) != "minecraft:air"
                || entity.world().getBlock(pos.add(-1, 0, 0)) != "minecraft:air"
                || entity.world().getBlock(pos.add(0, 0, 1)) != "minecraft:air"
                || entity.world().getBlock(pos.add(0, 0, -1)) != "minecraft:air";
            if (!nearWall) {
                manager.setData(entity, "fiskheroes:flying", false);
            }
        }
    });

    // Attribute profiles per sting mode
    hero.addAttributeProfile("PINNING", function (profile) {
        profile.inheritDefaults();
    });

    hero.addAttributeProfile("LETHAL", function (profile) {
        profile.inheritDefaults();
        profile.addAttribute("WEAPON_DAMAGE", 999.0, 0);
    });

    hero.setAttributeProfile(function (entity) {
        var mode = Number(entity.getData("worm:dyn/foil_sting"));
        if (mode == 1) return "PINNING";
        if (mode == 2) return "LETHAL";
        return null;
    });

    // Damage profiles
    hero.addDamageProfile("PUNCH", {
        "types": { "BLUNT": 1.0 }
    });
    hero.addDamageProfile("RAPIER", {
        "types": { "SHARP": 1.0 }
    });
    hero.addDamageProfile("LETHAL_PUNCH", {
        "types": { "SHARP": 0.5, "SPACE": 0.5 }
    });
    hero.addDamageProfile("LETHAL_RAPIER", {
        "types": { "SHARP": 0.5, "SPACE": 0.5 }
    });

    hero.setDamageProfile(function (entity) {
        var mode = Number(entity.getData("worm:dyn/foil_sting"));
        var holding = entity.getHeldItem().name() == "fisktag:weapon";
        if (mode == 2 && holding) return "LETHAL_RAPIER";
        if (mode == 2) return "LETHAL_PUNCH";
        if (holding) return "RAPIER";
        return "PUNCH";
    });
}
