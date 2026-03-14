var team = implement("worm:external/undersiders");
var mc = implement("worm:external/mind_control");

// How many blocks above ground the entity at pos is (max 10)
function heightAboveGround(world, pos) {
    for (var i = 0; i < 10; i++) {
        if (world.blockAt(pos.add(0, -i, 0)).isSolid()) {
            return i;
        }
    }
    return 10;
}

// Control buildup config
var CONTROL_PER_TICK = 0.0014;  // ~12 grabs to fill
var MAX_GRAB_TICKS = 60;        // 3 seconds max grab before full control
var FULL_CONTROL = 1.0;

// Strain (backfire) config
var STRAIN_BUILD_TK = 0.003;     // per tick while grabbing without full control (~17s to fill)
var STRAIN_BUILD_NERVE = 0.025;  // per tick while nerve attacking (~2s to fill)
var STRAIN_DRAIN = 0.001;        // per tick while idle (~50s to drain)
var STRAIN_BACKFIRE_THRESHOLD = 0.5;
var BACKFIRE_DAMAGE = 2.0;

// Per-entity control map (keyed by entity UUID), persisted in chestplate NBT
var controlMap = {};
var controlMapLoaded = false;
var resistMsgCooldown = 0;
var backfireMsgCooldown = 0;

// Load controlMap from chestplate NBT (format: "uuid:control,uuid:control,...")
function loadControlMap(entity) {
    var nbt = entity.getWornChestplate().nbt();
    var str = nbt.getString("regent_control") || "";
    controlMap = {};
    if (str === "") return;
    var entries = str.split(",");
    for (var i = 0; i < entries.length; i++) {
        var colonPos = entries[i].indexOf(":");
        if (colonPos >= 0) {
            var uuid = entries[i].substring(0, colonPos);
            var val = parseFloat(entries[i].substring(colonPos + 1));
            if (!isNaN(val)) controlMap[uuid] = val;
        }
    }
}

// Save controlMap to chestplate NBT
function saveControlMap(entity, manager) {
    var parts = [];
    for (var uuid in controlMap) {
        // Round to 3 decimal places to keep string short
        parts.push(uuid + ":" + Math.round(controlMap[uuid] * 1000) / 1000);
    }
    var nbt = entity.getWornChestplate().nbt();
    manager.setString(nbt, "regent_control", parts.join(","));
}

function init(hero) {
    hero.setName("Regent");
    hero.setTier(2);

    hero.setHelmet("Mask & Crown");
    hero.setChestplate("Shirt");
    hero.setLeggings("Leggings");
    hero.setBoots("Boots");

    hero.addPowers("worm:regent_powers");
    hero.addPowers("worm:undersiders");
    hero.addAttribute("PUNCH_DAMAGE", 3.0, 0);
    hero.addAttribute("SPRINT_SPEED", 0.05, 1);
    hero.addAttribute("FALL_RESISTANCE", 1.0, 0);

    hero.addKeyBind("HEAT_VISION", "Nerve Attack", 1);
    hero.addKeyBind("TELEKINESIS", "Body Control", 2);

    hero.setModifierEnabled(isModifierEnabled);
    hero.setKeyBindEnabled(isKeyBindEnabled);
    hero.setHasPermission(function (entity, permission) {
        return team.hasPermission(entity, permission);
    });
    hero.addKeyBind("AIM", "Aim", -1);
    hero.supplyFunction("canAim", function (entity) {
        return entity.getData("worm:dyn/tt_nearby") && !entity.getHeldItem().isEmpty();
    });

    var heroRef = hero;
    hero.addDamageProfile("BACKFIRE", {
        "types": {
            "TELEPATHIC": 1.0
        },
        "properties": {
            "ADD_KNOCKBACK": -0.2
        }
    });

    hero.setTickHandler(function (entity, manager) {
        team.tick(entity, manager, heroRef);

        // Load persistent control map from NBT on first tick
        if (!controlMapLoaded && PackLoader.getSide() == "SERVER") {
            loadControlMap(entity);
            controlMapLoaded = true;
        }

        var grabId = entity.getData("fiskheroes:grab_id");
        var cooldown = entity.getData("worm:dyn/tk_cooldown");
        var grabTicks = entity.getData("worm:dyn/tk_grab_ticks");

        if (cooldown > 0) {
            manager.setData(entity, "worm:dyn/tk_cooldown", cooldown - 1);
        }
        if (resistMsgCooldown > 0) resistMsgCooldown--;
        if (backfireMsgCooldown > 0) backfireMsgCooldown--;

        if (grabId > -1) {
            var grabbed = entity.world().getEntityById(grabId);
            if (grabbed != null) {
                // Release entities that resist control
                var resistance = mc.resistsControl(grabbed);
                // Hard blocks: mindless mobs, robots, and immune heroes
                // "resistant", "anatomy", "trained" pass through for now (future: backfire mechanic)
                if (resistance == "mindless" || resistance == "robot" || resistance == "immune") {
                    manager.setDataWithNotify(entity, "fiskheroes:telekinesis", false);
                    manager.setDataWithNotify(entity, "fiskheroes:grab_id", -1);
                    manager.setDataWithNotify(entity, "fiskheroes:grab_distance", 0);
                    manager.setData(entity, "worm:dyn/tk_cooldown", 40);
                    manager.setData(entity, "worm:dyn/tk_grab_ticks", 0);
                    if (PackLoader.getSide() == "SERVER" && resistMsgCooldown <= 0) {
                        var p = entity.as("PLAYER");
                        if (p != null) {
                            var msg = resistance == "mindless" ? "No nervous system to hijack."
                                    : resistance == "immune"  ? "Their mind resists your control."
                                    : "Nothing organic to control.";
                            p.addChatMessage("\u00A77\u00A7o" + msg);
                            resistMsgCooldown = 60;
                        }
                    }
                    return false;
                }

                // Anti-lift: check if grabbed entity is near ground (including adjacent blocks for edges)
                var gp = grabbed.pos();
                var nearGround = heightAboveGround(entity.world(), gp) <= 1
                    || heightAboveGround(entity.world(), gp.add(1, 0, 0)) <= 1
                    || heightAboveGround(entity.world(), gp.add(-1, 0, 0)) <= 1
                    || heightAboveGround(entity.world(), gp.add(0, 0, 1)) <= 1
                    || heightAboveGround(entity.world(), gp.add(0, 0, -1)) <= 1;
                if (!nearGround) {
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
                if (PackLoader.getSide() == "SERVER") saveControlMap(entity, manager);

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

        // Strain mechanic: builds while using powers, drains when idle
        var strain = entity.getData("worm:dyn/regent_strain");
        var usingTK = grabId > -1;
        var usingNerve = entity.getData("fiskheroes:heat_vision");

        // Check if current target is fully controlled (for strain reduction)
        var targetFullControl = false;
        if (usingTK && grabId > -1) {
            var strainTarget = entity.world().getEntityById(grabId);
            if (strainTarget != null) targetFullControl = (controlMap[strainTarget.getUUID()] || 0) >= FULL_CONTROL;
        } else if (usingNerve) {
            // Check nearest entity in beam direction for full control
            var nearby = entity.world().getEntitiesInRangeOf(entity.pos(), 10.0);
            var look = entity.getLookVector();
            for (var ni = 0; ni < nearby.length; ni++) {
                var other = nearby[ni];
                if (other.getUUID() == entity.getUUID() || !other.isLivingEntity()) continue;
                var toOther = other.pos().subtract(entity.pos()).normalized();
                var dot = look.x() * toOther.x() + look.y() * toOther.y() + look.z() * toOther.z();
                if (dot > 0.95 && (controlMap[other.getUUID()] || 0) >= FULL_CONTROL) {
                    targetFullControl = true;
                    break;
                }
            }
        }

        if (usingTK) {
            strain = targetFullControl ? strain : Math.min(0.95, strain + STRAIN_BUILD_TK);
        } else if (usingNerve) {
            strain = targetFullControl ? strain : Math.min(0.95, strain + STRAIN_BUILD_NERVE);
        } else {
            strain = Math.max(0, strain - STRAIN_DRAIN);
        }
        manager.setData(entity, "worm:dyn/regent_strain", strain);

        // Backfire: above threshold, periodic self-damage while using powers
        // Interval shrinks as strain increases: 60 ticks at 0.5 → 15 ticks at 0.95
        if (strain > STRAIN_BACKFIRE_THRESHOLD && (usingTK || usingNerve)) {
            var intensity = (strain - STRAIN_BACKFIRE_THRESHOLD) / (0.95 - STRAIN_BACKFIRE_THRESHOLD);
            var interval = Math.max(15, Math.round(60 - intensity * 45));
            if (entity.ticksExisted() % interval == 0) {
                entity.hurtByAttacker(heroRef, "BACKFIRE", "%s lost control of their power", BACKFIRE_DAMAGE, entity);
                if (PackLoader.getSide() == "SERVER" && backfireMsgCooldown <= 0) {
                    entity.as("PLAYER").addChatMessage("\u00A7c\u00A7o*Your power surges back against you*");
                    backfireMsgCooldown = 60;
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
