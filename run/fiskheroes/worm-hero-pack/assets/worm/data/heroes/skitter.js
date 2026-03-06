var SWARM_RADIUS = 100.0;
var SWARM_DAMAGE = 1.0;
var heroRef = null;

var METHOD_COUNT = 2;
var EFFECT_COUNT = 2;

var debounce_method = false;
var debounce_effect = false;
var densityAtChargeStart = 0;
var wasCharging = false;

function init(hero) {
    heroRef = hero;
    hero.setName("Skitter");
    hero.setTier(3);

    hero.setHelmet("Mask");
    hero.setChestplate("Chestpiece");
    hero.setLeggings("Leggings");
    hero.setBoots("Shoes");

    hero.addPowers("worm:skitter_powers");
    hero.addAttribute("PUNCH_DAMAGE", 2.0, 0);
    hero.addAttribute("SPRINT_SPEED", 0.05, 1);
    hero.addAttribute("FALL_RESISTANCE", 1.0, 0);

    // Key 1: Summon Swarm (charged beam — hold to build density)
    hero.addKeyBind("CHARGED_BEAM", "Summon Swarm", 1);

    // Key 2: Cycle method (0 = Targeted, 1 = Entire Area)
    hero.addKeyBindFunc("METHOD_0", function (entity, manager) {
        if (debounce_method) return false;
        debounce_method = true;
        var current = entity.getData("worm:dyn/swarm_method");
        manager.setData(entity, "worm:dyn/swarm_method", (current + 1) % METHOD_COUNT);
        return true;
    }, "\u00A7fMethod: \u00A7aTargeted \u00A78>", 2);

    hero.addKeyBindFunc("METHOD_1", function (entity, manager) {
        if (debounce_method) return false;
        debounce_method = true;
        var current = entity.getData("worm:dyn/swarm_method");
        manager.setData(entity, "worm:dyn/swarm_method", (current + 1) % METHOD_COUNT);
        return true;
    }, "\u00A7fMethod: \u00A7cEntire Area \u00A78>", 2);

    // Key 3: Cycle effect (Biting / Stinging)
    hero.addKeyBindFunc("EFFECT_0", function (entity, manager) {
        if (debounce_effect) return false;
        debounce_effect = true;
        var current = entity.getData("worm:dyn/swarm_effect");
        manager.setData(entity, "worm:dyn/swarm_effect", (current + 1) % EFFECT_COUNT);
        return true;
    }, "\u00A7fEffect: \u00A76Biting \u00A78>", 3);

    hero.addKeyBindFunc("EFFECT_1", function (entity, manager) {
        if (debounce_effect) return false;
        debounce_effect = true;
        var current = entity.getData("worm:dyn/swarm_effect");
        manager.setData(entity, "worm:dyn/swarm_effect", (current + 1) % EFFECT_COUNT);
        return true;
    }, "\u00A7fEffect: \u00A7aStinging \u00A78>", 3);

    // Key 4: Targeted beam (hold to direct swarm)
    hero.addKeyBind("HEAT_VISION", "Direct Swarm", 4);

    hero.setKeyBindEnabled(isKeyBindEnabled);
    hero.setModifierEnabled(isModifierEnabled);

    // Damage profiles for AoE mode
    hero.addDamageProfile("SWARM_BITING", {
        "types": {
            "PIERCING": 0.6,
            "SHARP": 0.4
        }
    });

    hero.addDamageProfile("SWARM_STINGING", {
        "types": {
            "PIERCING": 1.0
        },
        "properties": {
            "EFFECTS": [
                {
                    "id": "minecraft:poison",
                    "duration": 100,
                    "amplifier": 1,
                    "chance": 1
                }
            ]
        }
    });

    hero.setTickHandler(function (entity, manager) {
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
        manager.setData(entity, "worm:dyn/swarm_density_display", density);

        var swarmActive = density > 0.9;
        manager.setData(entity, "worm:dyn/swarm_active", swarmActive);
        manager.setData(entity, "worm:dyn/swarm_timer", density);

        // AoE mode (method 1): deal damage when swarm is fully summoned
        if (swarmActive) {
            var method = Number(entity.getData("worm:dyn/swarm_method"));
            var effect = Number(entity.getData("worm:dyn/swarm_effect"));

            if (method == 1) {
                var profileName = effect == 0 ? "SWARM_BITING" : "SWARM_STINGING";
                var deathMsg = effect == 0
                    ? "%1$s was devoured by Skitter's swarm"
                    : "%1$s succumbed to Skitter's venom";

                var nearby = entity.world().getEntitiesInRangeOf(entity.pos(), SWARM_RADIUS);
                for (var i = 0; i < nearby.length; i++) {
                    var target = nearby[i];
                    if (target.isLivingEntity() && target.getUUID() != entity.getUUID()) {
                        target.hurtByAttacker(heroRef, profileName, deathMsg, SWARM_DAMAGE, entity);
                    }
                }
            }
            // Targeted mode (method 0): heat_vision beam handles damage
        }
    });
}

function isModifierEnabled(entity, modifier) {
    var method = Number(entity.getData("worm:dyn/swarm_method"));
    var effect = Number(entity.getData("worm:dyn/swarm_effect"));
    var swarmActive = entity.getData("worm:dyn/swarm_active");

    if (modifier.name() == "fiskheroes:charged_beam") {
        return modifier.id() == "swarm";
    }
    if (modifier.name() == "fiskheroes:heat_vision") {
        if (!swarmActive || method != 0) return false;
        var expected = effect == 0 ? "swarm_biting" : "swarm_stinging";
        return modifier.id() == expected;
    }
    return true;
}

function isKeyBindEnabled(entity, keyBind) {
    var method = entity.getData("worm:dyn/swarm_method");
    var effect = entity.getData("worm:dyn/swarm_effect");
    var swarmActive = entity.getData("worm:dyn/swarm_active");

    switch (keyBind) {
    case "METHOD_0": return method == 0;
    case "METHOD_1": return method == 1;
    case "EFFECT_0": return effect == 0;
    case "EFFECT_1": return effect == 1;
    case "HEAT_VISION": return swarmActive && method == 0;
    default: return true;
    }
}
