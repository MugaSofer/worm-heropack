var team = implement("worm:external/undersiders");

var SWARM_RADIUS = 100.0;
var SWARM_DAMAGE = 1.0;
var DRAIN_PER_HIT = 0.001;  // drain per tick for targeted
var DRAIN_AOE = 0.002;      // flat drain per tick for AoE
var heroRef = null;

var METHOD_COUNT = 2;
var EFFECT_COUNT = 2;

var debounce_method = false;
var debounce_effect = false;
var densityAtChargeStart = 0;
var wasCharging = false;
var senseTicks = 0;
var SENSE_INTERVAL = 100;  // ticks between scans (5 seconds)

function init(hero) {
    heroRef = hero;
    hero.setName("Skitter");
    hero.setTier(5);

    hero.setHelmet("Mask");
    hero.setChestplate("Chestpiece");
    hero.setLeggings("Leggings");
    hero.setBoots("Shoes");

    hero.addPowers("worm:skitter_powers");
    hero.addPowers("worm:undersiders");
    hero.addAttribute("PUNCH_DAMAGE", 2.0, 0);
    hero.addAttribute("SPRINT_SPEED", 0.05, 1);
    hero.addAttribute("FALL_RESISTANCE", 1.0, 0);

    // Key 1: Summon Swarm (charged beam — hold to build density, click to dismiss)
    hero.addKeyBind("CHARGED_BEAM", "Summon Swarm", 1);

    // Key 2: Targeted beam (hold to direct swarm) / dismiss-only at low density
    hero.addKeyBind("HEAT_VISION", "Direct Swarm \u00A77+ \u00A7eSneak\u00A7f Dismiss", 2);
    hero.addKeyBindFunc("DISMISS_ONLY", function (entity, manager) {
        if (entity.isSneaking()) {
            manager.setData(entity, "worm:dyn/swarm_density", 0);
            manager.setData(entity, "worm:dyn/swarm_density_display", 0);
        }
        return false;
    }, "Dismiss Swarm \u00A77(\u00A7eSneak\u00A77)", 2);

    // Key 3: Cycle method (0 = Targeted, 1 = Entire Area)
    hero.addKeyBindFunc("METHOD_0", function (entity, manager) {
        if (debounce_method) return false;
        debounce_method = true;
        var current = entity.getData("worm:dyn/swarm_method");
        manager.setData(entity, "worm:dyn/swarm_method", (current + 1) % METHOD_COUNT);
        return true;
    }, "\u00A7fMethod: \u00A7aTargeted \u00A78>", 3);

    hero.addKeyBindFunc("METHOD_1", function (entity, manager) {
        if (debounce_method) return false;
        debounce_method = true;
        var current = entity.getData("worm:dyn/swarm_method");
        manager.setData(entity, "worm:dyn/swarm_method", (current + 1) % METHOD_COUNT);
        return true;
    }, "\u00A7fMethod: \u00A7cEntire Area \u00A78>", 3);

    // Key 4: Cycle effect (Biting / Stinging)
    hero.addKeyBindFunc("EFFECT_0", function (entity, manager) {
        if (debounce_effect) return false;
        debounce_effect = true;
        var current = entity.getData("worm:dyn/swarm_effect");
        manager.setData(entity, "worm:dyn/swarm_effect", (current + 1) % EFFECT_COUNT);
        return true;
    }, "\u00A7fEffect: \u00A76Biting \u00A78>", 4);

    hero.addKeyBindFunc("EFFECT_1", function (entity, manager) {
        if (debounce_effect) return false;
        debounce_effect = true;
        var current = entity.getData("worm:dyn/swarm_effect");
        manager.setData(entity, "worm:dyn/swarm_effect", (current + 1) % EFFECT_COUNT);
        return true;
    }, "\u00A7fEffect: \u00A7aStinging \u00A78>", 4);

    // Key 5: Swarm Sense toggle
    hero.addKeyBindFunc("SWARM_SENSE", function (entity, manager) {
        manager.setData(entity, "worm:dyn/swarm_sense", !entity.getData("worm:dyn/swarm_sense"));
        return true;
    }, "Swarm Sense", 5);

    hero.setKeyBindEnabled(isKeyBindEnabled);
    hero.setModifierEnabled(isModifierEnabled);
    hero.setHasPermission(function (entity, permission) {
        return team.hasPermission(entity, permission);
    });
    hero.addKeyBind("AIM", "Aim", -1);
    hero.supplyFunction("canAim", function (entity) {
        return entity.getData("worm:dyn/tt_nearby") && !entity.getHeldItem().isEmpty();
    });

    // Damage profiles for AoE mode
    hero.addDamageProfile("SWARM_BITING", {
        "types": {
            "SWARM": 1.0
        }
    });

    hero.addDamageProfile("SWARM_STINGING", {
        "types": {
            "SWARM": 1.0
        },
        "properties": {
            "EFFECTS": [
                {
                    "id": "minecraft:wither",
                    "duration": 60,
                    "amplifier": 0,
                    "chance": 1
                }
            ]
        }
    });

    hero.setTickHandler(function (entity, manager) {
        team.tick(entity, manager, heroRef);
        debounce_method = false;
        debounce_effect = false;

        // Sync beam charge → swarm density (linear fill from current level)
        var beamCharge = entity.getData("fiskheroes:beam_charge");
        var density = entity.getData("worm:dyn/swarm_density");
        var charging = beamCharge > 0;

        if (charging && !wasCharging) {
            densityAtChargeStart = density;
        }
        wasCharging = charging;

        if (charging) {
            var newDensity = densityAtChargeStart + beamCharge * (1.0 - densityAtChargeStart);
            if (newDensity > density) {
                density = newDensity;
                manager.setData(entity, "worm:dyn/swarm_density", density);
            }

        }

        // Swarm sense: only works with active swarm
        var senseOn = !entity.getData("worm:dyn/swarm_sense") && density > 0.01;
        manager.incrementData(entity, "worm:dyn/swarm_sense_timer", 10, senseOn);

        // Swarm sense: periodic entity scan via chat
        if (senseOn) {
            senseTicks++;
            if (senseTicks >= SENSE_INTERVAL) {
                senseTicks = 0;
                try {
                    var nearby = entity.world().getEntitiesInRangeOf(entity.pos(), SWARM_RADIUS);
                    var look = entity.getLookVector();
                    var detected = [];
                    for (var i = 0; i < nearby.length; i++) {
                        var other = nearby[i];
                        if (other.isLivingEntity() && other.getUUID() != entity.getUUID()) {
                            var toOther = other.pos().subtract(entity.pos());
                            var dist = other.pos().distanceTo(entity.pos());
                            // Relative direction: forward/back from dot, left/right from cross Y
                            var dot = look.x * toOther.x + look.z * toOther.z;
                            var cross = look.x * toOther.z - look.z * toOther.x;
                            var dir;
                            if (Math.abs(dot) > Math.abs(cross)) {
                                dir = dot > 0 ? "ahead" : "behind";
                            } else {
                                dir = cross > 0 ? "left" : "right";
                            }
                            // Score: nearby big mobs rank first (low score = high threat)
                            var score = dist / Math.max(other.getMaxHealth(), 1);
                            detected.push({ name: other.getName(), dist: dist, dir: dir, score: score });
                        }
                    }
                    // Sort by score (distance * maxHP), cap at 5
                    detected.sort(function (a, b) { return a.score - b.score; });
                    if (detected.length > 5) detected = detected.slice(0, 5);
                    if (detected.length > 0 && PackLoader.getSide() == "SERVER") {
                        var parts = [];
                        for (var j = 0; j < detected.length; j++) {
                            var d = detected[j];
                            parts.push("\u00A76" + d.name + " \u00A77" + Math.round(d.dist) + "m " + d.dir);
                        }
                        entity.as("PLAYER").addChatMessage("\u00A78\u00A7o[Swarm Sense] \u00A77" + parts.join("\u00A78, "));
                    }
                } catch (e) {
                    // Silently ignore errors
                }
            }
        } else {
            senseTicks = 0;
        }

        var hasSwarm = density > 0.01;
        manager.setData(entity, "worm:dyn/swarm_density_display", density);
        manager.setData(entity, "worm:dyn/swarm_active", hasSwarm);
        manager.setData(entity, "worm:dyn/swarm_timer", density);

        // Deal damage and drain swarm when dense enough
        if (density >= 0.25) {
            var method = Number(entity.getData("worm:dyn/swarm_method"));
            var effect = Number(entity.getData("worm:dyn/swarm_effect"));

            if (method == 1) {
                // AoE: damage everything in range, flat drain
                var profileName = effect == 0 ? "SWARM_BITING" : "SWARM_STINGING";
                var deathMsg = effect == 0
                    ? "%1$s was devoured by Skitter's swarm"
                    : "%1$s succumbed to Skitter's venom";

                var nearby = entity.world().getEntitiesInRangeOf(entity.pos(), SWARM_RADIUS);
                for (var i = 0; i < nearby.length; i++) {
                    var target = nearby[i];
                    if (target.isLivingEntity() && target.getUUID() != entity.getUUID() && !team.isUndersider(target)) {
                        target.hurtByAttacker(heroRef, profileName, deathMsg, SWARM_DAMAGE, entity);
                    }
                }

                density = Math.max(0, density - DRAIN_AOE);
                manager.setData(entity, "worm:dyn/swarm_density", density);
            }
            // Targeted mode (method 0): heat_vision beam handles damage
            // Drain for targeted: small constant drain while beam is firing
            if (method == 0 && entity.getData("fiskheroes:heat_vision")) {
                if (entity.isSneaking()) {
                    density = 0;
                    manager.setData(entity, "worm:dyn/swarm_density", 0);
                    manager.setData(entity, "worm:dyn/swarm_density_display", 0);
                } else {
                    density = Math.max(0, density - DRAIN_PER_HIT);
                    manager.setData(entity, "worm:dyn/swarm_density", density);
                }
            }
        }
    });
}

function isModifierEnabled(entity, modifier) {
    var method = Number(entity.getData("worm:dyn/swarm_method"));
    var effect = Number(entity.getData("worm:dyn/swarm_effect"));
    var hasSwarm = entity.getData("worm:dyn/swarm_density") > 0.01;

    if (modifier.name() == "fiskheroes:charged_beam") {
        return modifier.id() == "swarm";
    }
    if (modifier.name() == "fiskheroes:heat_vision") {
        if (entity.getData("worm:dyn/swarm_density") < 0.25 || method != 0) return false;
        var expected = effect == 0 ? "swarm_biting" : "swarm_stinging";
        return modifier.id() == expected;
    }
    return true;
}

function isKeyBindEnabled(entity, keyBind) {
    var method = entity.getData("worm:dyn/swarm_method");
    var effect = entity.getData("worm:dyn/swarm_effect");
    var hasSwarm = entity.getData("worm:dyn/swarm_density") > 0.01;
    var canAttack = entity.getData("worm:dyn/swarm_density") >= 0.25;

    switch (keyBind) {
    case "METHOD_0": return canAttack && method == 0;
    case "METHOD_1": return canAttack && method == 1;
    case "EFFECT_0": return canAttack && effect == 0;
    case "EFFECT_1": return canAttack && effect == 1;
    case "HEAT_VISION": return canAttack;
    case "DISMISS_ONLY": return hasSwarm && !canAttack;
    case "SWARM_SENSE": return hasSwarm;
    default: return true;
    }
}
