var SWARM_RADIUS = 100.0;
var SWARM_DAMAGE = 1.0;
var heroRef = null;


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

    hero.addKeyBindFunc("SWARM_TOGGLE", function (entity, manager) {
        manager.setData(entity, "worm:dyn/swarm_active", !entity.getData("worm:dyn/swarm_active"));
        return true;
    }, "Swarm", 1);



    hero.addDamageProfile("SWARM", {
        "types": {
            "PIERCING": 0.5,
            "BLUNT": 0.5
        }
    });

    hero.setTickHandler(function (entity, manager) {
        var active = entity.getData("worm:dyn/swarm_active");
        manager.incrementData(entity, "worm:dyn/swarm_timer", 20, active);

        // AoE damage when swarm is active
        if (active) {
            var nearby = entity.world().getEntitiesInRangeOf(entity.pos(), SWARM_RADIUS);
            for (var i = 0; i < nearby.length; i++) {
                var target = nearby[i];
                if (target.isLivingEntity() && target.getUUID() != entity.getUUID()) {
                    target.hurtByAttacker(heroRef, "SWARM", "%1$s was overwhelmed by Skitter's swarm", SWARM_DAMAGE, entity);
                }
            }
        }
    });
}
