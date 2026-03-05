// Find the Y of the nearest solid block below a position
// Returns how many blocks above ground the entity at pos is (max 10)
function heightAboveGround(world, pos) {
    for (var i = 0; i < 10; i++) {
        if (world.blockAt(pos.add(0, -i, 0)).isSolid()) {
            return i;
        }
    }
    return 10;
}

function init(hero) {
    hero.setName("Regent");
    hero.setTier(3);

    hero.setHelmet("Mask & Crown");
    hero.setChestplate("Shirt");
    hero.setLeggings("Leggings");
    hero.setBoots("Boots");

    hero.addPowers("worm:regent_powers");
    hero.addAttribute("PUNCH_DAMAGE", 3.0, 0);
    hero.addAttribute("SPRINT_SPEED", 0.05, 1);
    hero.addAttribute("FALL_RESISTANCE", 1.0, 0);

    hero.addKeyBind("HEAT_VISION", "Nerve Attack", 1);
    hero.addKeyBind("TELEKINESIS", "Body Control", 2);

    hero.setModifierEnabled(isModifierEnabled);
    hero.setKeyBindEnabled(isKeyBindEnabled);

    hero.setTickHandler(function (entity, manager) {
        var grabId = entity.getData("fiskheroes:grab_id");
        var cooldown = entity.getData("worm:dyn/tk_cooldown");

        if (cooldown > 0) {
            manager.setData(entity, "worm:dyn/tk_cooldown", cooldown - 1);
        }

        if (grabId > -1) {
            var grabbed = entity.world().getEntityById(grabId);
            if (grabbed != null) {
                // Break grab if lifted more than 1 block off the ground
                var height = heightAboveGround(entity.world(), grabbed.pos());
                if (height > 1) {
                    manager.setDataWithNotify(entity, "fiskheroes:telekinesis", false);
                    manager.setDataWithNotify(entity, "fiskheroes:grab_id", -1);
                    manager.setDataWithNotify(entity, "fiskheroes:grab_distance", 0);
                    manager.setData(entity, "worm:dyn/tk_cooldown", 40);
                }
            }
        }

        return false;
    });
}

function isModifierEnabled(entity, modifier) {
    switch (modifier.name()) {
    case "fiskheroes:telekinesis":
        return !entity.getData("fiskheroes:heat_vision") && entity.getData("worm:dyn/tk_cooldown") == 0;
    case "fiskheroes:heat_vision":
        return !entity.getData("fiskheroes:telekinesis");
    default:
        return true;
    }
}

function isKeyBindEnabled(entity, keyBind) {
    switch (keyBind) {
    case "TELEKINESIS":
        return !entity.getData("fiskheroes:heat_vision") && entity.getData("worm:dyn/tk_cooldown") == 0;
    case "HEAT_VISION":
        return !entity.getData("fiskheroes:telekinesis");
    default:
        return true;
    }
}
