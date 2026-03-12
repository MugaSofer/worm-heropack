var team = implement("worm:external/undersiders");

function init(hero) {
    hero.setName("Foil");
    hero.setTier(4);

    hero.setHelmet("Visor");
    hero.setChestplate("Top & Armor");
    hero.setLeggings("Tights");
    hero.setBoots("Boots");

    hero.addPowers("worm:foil_powers");
    hero.addPowers("worm:undersiders");

    // Base attributes — skilled fencer with enhanced timing
    hero.addAttribute("PUNCH_DAMAGE", 3.0, 0);
    hero.addAttribute("WEAPON_DAMAGE", 4.0, 0);
    hero.addAttribute("SPRINT_SPEED", 0.1, 1);
    hero.addAttribute("FALL_RESISTANCE", 0.5, 1);
    hero.addAttribute("JUMP_HEIGHT", 0.5, 0);

    // Rapier — auto-equip
    hero.addPrimaryEquipment("fisktag:weapon{WeaponType:worm:rapier}", true, function (item) {
        return item.nbt().getString("WeaponType") == "worm:rapier";
    });

    // Sting mode cycling: 0=off, 1=pinning, 2=lethal (slot 1)
    hero.addKeyBindFunc("STING_0", function (entity, manager) {
        manager.setData(entity, "worm:dyn/foil_sting", 1);
        return true;
    }, "\u00A7fSting: \u00A77Off \u00A78>", 1);

    hero.addKeyBindFunc("STING_1", function (entity, manager) {
        manager.setData(entity, "worm:dyn/foil_sting", 2);
        return true;
    }, "\u00A7fSting: \u00A7ePinning \u00A78>", 1);

    hero.addKeyBindFunc("STING_2", function (entity, manager) {
        manager.setData(entity, "worm:dyn/foil_sting", 0);
        return true;
    }, "\u00A7fSting: \u00A7cLethal \u00A78>", 1);

    // Throwing darts (slot 2)
    hero.addKeyBind("UTILITY_BELT", "Throwing Darts", 2);

    // Crossbow (slot 3)
    hero.addKeyBind("AIM", "Crossbow", 3);
    hero.supplyFunction("canAim", function (entity) {
        if (entity.getHeldItem().isEmpty()) return true;
        return entity.getData("worm:dyn/tt_nearby") && !entity.getHeldItem().isEmpty();
    });

    // Martial arts kick (slot 4) — cycles front flip / back flip / roundhouse
    hero.addKeyBind("ROUNDHOUSEKICK", "Kick", 4);
    hero.addKeyBind("ROUNDHOUSEKICK_STOP", "\u00A7mKick", 4);

    // Dodge (slot 5) — defensive roll/flip with damage resistance
    hero.addKeyBind("DODGE", "Dodge", 5);
    hero.addKeyBind("DODGE_STOP", "\u00A7mDodge", 5);

    hero.setKeyBindEnabled(function (entity, keyBind) {
        var mode = Number(entity.getData("worm:dyn/foil_sting"));
        if (keyBind == "STING_0") return mode == 0;
        if (keyBind == "STING_1") return mode == 1;
        if (keyBind == "STING_2") return mode == 2;
        if (keyBind == "ROUNDHOUSEKICK") return entity.getData("worm:dyn/kick_timer") == 0;
        if (keyBind == "ROUNDHOUSEKICK_STOP") return entity.getData("worm:dyn/kick_timer") != 0;
        if (keyBind == "DODGE") return entity.getData("worm:dyn/foil_dodge_timer") == 0;
        if (keyBind == "DODGE_STOP") return entity.getData("worm:dyn/foil_dodge_timer") != 0;
        return true;
    });
    hero.setHasPermission(function (entity, permission) {
        return team.hasPermission(entity, permission);
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
        if (modifier.name() == "fiskheroes:metal_skin"
            || modifier.name() == "fiskheroes:projectile_immunity"
            || modifier.name() == "fiskheroes:fire_immunity") {
            return entity.getData("worm:dyn/foil_dodge");
        }
        if (modifier.name() == "fiskheroes:controlled_flight") {
            // Always available — gated on wall adjacency only
            var pos = entity.pos();
            return entity.world().getBlock(pos.add(1, 0, 0)) != "minecraft:air"
                || entity.world().getBlock(pos.add(-1, 0, 0)) != "minecraft:air"
                || entity.world().getBlock(pos.add(0, 0, 1)) != "minecraft:air"
                || entity.world().getBlock(pos.add(0, 0, -1)) != "minecraft:air";
        }
        return true;
    });

    // Tick handler — disable flying when not next to a wall in climbing mode
    var heroRef = hero;
    hero.setTickHandler(function (entity, manager) {
        team.tick(entity, manager, heroRef);
        // Wall climbing — disable flying when not near wall
        if (entity.getData("fiskheroes:flying")) {
            var pos = entity.pos();
            var nearWall = entity.world().getBlock(pos.add(1, 0, 0)) != "minecraft:air"
                || entity.world().getBlock(pos.add(-1, 0, 0)) != "minecraft:air"
                || entity.world().getBlock(pos.add(0, 0, 1)) != "minecraft:air"
                || entity.world().getBlock(pos.add(0, 0, -1)) != "minecraft:air";
            if (!nearWall) {
                manager.setData(entity, "fiskheroes:flying", false);
            }
        }
        // Dodge: auto-cancel when timer completes
        if (entity.getData("worm:dyn/foil_dodge_timer") == 1) {
            manager.setData(entity, "worm:dyn/foil_dodge", false);
            manager.setData(entity, "worm:dyn/foil_dodge_type", (Number(entity.getData("worm:dyn/foil_dodge_type")) + 1) % 3);
        }
        // Kick: auto-cancel when timer completes
        if (entity.getData("worm:dyn/kick_timer") == 1) {
            manager.setData(entity, "worm:dyn/kick", false);
            // Alternate kick type for next press
            manager.setData(entity, "worm:dyn/foil_kick_type", (Number(entity.getData("worm:dyn/foil_kick_type")) + 1) % 3);
        }
        // Kick: deal damage at the midpoint of the animation
        if (entity.getData("worm:dyn/kick") && entity.getData("worm:dyn/kick_timer") > 0.4 && entity.getData("worm:dyn/kick_timer") < 0.6) {
            var list = entity.world().getEntitiesInRangeOf(entity.pos(), 3.0);
            list.forEach(function (target) {
                if (!entity.equals(target) && target.isLivingEntity()) {
                    target.hurtByAttacker(hero, "KICK", "%s was kicked to death by %s", 6.0, entity);
                }
            });
        }
    });

    // Attribute profiles per sting mode
    hero.addAttributeProfile("PINNING", function (profile) {
        profile.inheritDefaults();
        profile.addAttribute("ARROW_DAMAGE", 0.5, 1);
    });

    hero.addAttributeProfile("LETHAL", function (profile) {
        profile.inheritDefaults();
        profile.addAttribute("WEAPON_DAMAGE", 999.0, 0);
        profile.addAttribute("ARROW_DAMAGE", 142.0, 1);
    });

    hero.addAttributeProfile("DODGE", function (profile) {
        profile.inheritDefaults();
        profile.addAttribute("SPRINT_SPEED", 0.3, 1);
    });

    hero.setAttributeProfile(function (entity) {
        if (entity.getData("worm:dyn/foil_dodge")) return "DODGE";
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
    hero.addDamageProfile("KICK", {
        "types": { "BLUNT": 1.0 },
        "properties": { "HIT_COOLDOWN": 20 }
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
