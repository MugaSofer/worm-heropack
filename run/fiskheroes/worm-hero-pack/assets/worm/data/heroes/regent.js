// How many blocks above ground the entity at pos is (max 10)
function heightAboveGround(world, pos) {
    for (var i = 0; i < 10; i++) {
        if (world.blockAt(pos.add(0, -i, 0)).isSolid()) {
            return i;
        }
    }
    return 10;
}

// Entities Regent cannot control (no nervous system)
// Keys are getName() return values - may need adjustment after in-game testing
var MINDLESS = {
    "Skeleton": true,
    "Wither Skeleton": true,
    "Stray": true,
    "Slime": true,
    "Magma Cube": true
};

// Control buildup config
var CONTROL_PER_TICK = 0.0014;  // ~12 grabs to fill
var MAX_GRAB_TICKS = 60;        // 3 seconds max grab before full control
var FULL_CONTROL = 1.0;

// Per-entity control map (keyed by entity UUID)
var controlMap = {};

function init(hero) {
    hero.setName("Regent");
    hero.setTier(2);

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
        var grabTicks = entity.getData("worm:dyn/tk_grab_ticks");

        if (cooldown > 0) {
            manager.setData(entity, "worm:dyn/tk_cooldown", cooldown - 1);
        }

        if (grabId > -1) {
            var grabbed = entity.world().getEntityById(grabId);
            if (grabbed != null) {
                // Release mindless entities immediately
                if (MINDLESS[grabbed.getName()] === true) {
                    manager.setDataWithNotify(entity, "fiskheroes:telekinesis", false);
                    manager.setDataWithNotify(entity, "fiskheroes:grab_id", -1);
                    manager.setDataWithNotify(entity, "fiskheroes:grab_distance", 0);
                    return false;
                }

                // Anti-lift check
                var height = heightAboveGround(entity.world(), grabbed.pos());
                if (height > 1) {
                    manager.setDataWithNotify(entity, "fiskheroes:telekinesis", false);
                    manager.setDataWithNotify(entity, "fiskheroes:grab_id", -1);
                    manager.setDataWithNotify(entity, "fiskheroes:grab_distance", 0);
                    manager.setData(entity, "worm:dyn/tk_cooldown", 40);
                    manager.setData(entity, "worm:dyn/tk_grab_ticks", 0);
                    return false;
                }

                // Look up control for this entity
                var uuid = grabbed.getUUID();
                var control = controlMap[uuid] || 0;

                // Build up control while grabbing
                control = Math.min(FULL_CONTROL, control + CONTROL_PER_TICK);
                controlMap[uuid] = control;

                // Mirror to Regent for HUD display
                manager.setData(entity, "worm:dyn/tk_control_display", control);

                // If not fully controlled, enforce grab duration limit
                if (control < FULL_CONTROL) {
                    grabTicks = grabTicks + 1;
                    manager.setData(entity, "worm:dyn/tk_grab_ticks", grabTicks);
                    if (grabTicks >= MAX_GRAB_TICKS) {
                        manager.setDataWithNotify(entity, "fiskheroes:telekinesis", false);
                        manager.setDataWithNotify(entity, "fiskheroes:grab_id", -1);
                        manager.setDataWithNotify(entity, "fiskheroes:grab_distance", 0);
                        manager.setData(entity, "worm:dyn/tk_cooldown", 40);
                        manager.setData(entity, "worm:dyn/tk_grab_ticks", 0);
                    }
                }
                // If fully controlled, no time limit
            }
        } else {
            if (grabTicks != 0) {
                manager.setData(entity, "worm:dyn/tk_grab_ticks", 0);
            }
            // Fade HUD when not grabbing
            var display = entity.getData("worm:dyn/tk_control_display");
            if (display > 0) {
                manager.setData(entity, "worm:dyn/tk_control_display", 0);
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
