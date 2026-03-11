var SENTRY_RANGE = 3.0;
var SENTRY_DAMAGE = 5.0;
var SENTRY_COOLDOWN = 20; // ticks between punches
var PUNCH_DURATION = 12; // ticks the punch animation lasts (0.6s matches roundhouse_kick timing)
var heroRef = null;
var punchTick = {};

function init(hero) {
    heroRef = hero;
    hero.addPrimaryEquipment('fiskheroes:superhero_chestplate{HeroType:worm:parian_spare}', true);
}

function tick(entity, manager) {
    // Equipment replenishment (every 2 seconds)
    if (entity.ticksExisted() % 40 == 0) {
        var nbt = entity.getWornChestplate().nbt();
        if (nbt.getTagList("Equipment").tagCount() == 0) {
            manager.setTagList(nbt, "Equipment", manager.newTagList('[{Index:0,Item:{Count:1,Damage:0,id:4097,tag:{HeroType:"worm:parian_spare"}}}]'));
        }
    }

    var uid = entity.getUUID();

    // Track punch cooldown
    if (!punchTick[uid]) punchTick[uid] = 0;
    if (punchTick[uid] > 0) punchTick[uid]--;

    // Sentry melee attack: when aiming at a target, punch nearby enemies
    var didPunch = false;
    if (heroRef && entity.getData("fiskheroes:aiming") && punchTick[uid] == 0) {
        entity.world().getEntitiesInRangeOf(entity.pos(), SENTRY_RANGE).forEach(function (other) {
            if (!entity.equals(other) && other.isLivingEntity() && other.as("LIVING").getHealth() > 0) {
                other.hurtByAttacker(heroRef, "PUNCH", "%s was pummeled by %s", SENTRY_DAMAGE, entity);
                didPunch = true;
            }
        });
        if (didPunch) {
            punchTick[uid] = SENTRY_COOLDOWN;
            manager.setData(entity, "worm:dyn/parian_punch", true);
            // Cycle attack type: 0=left punch, 1=kick, 2=left hook
            var nextType = (Number(entity.getData("worm:dyn/parian_attack_type")) + 1) % 3;
            manager.setData(entity, "worm:dyn/parian_attack_type", nextType);
        }
    }

    // Clear punch animation after duration
    if (entity.getData("worm:dyn/parian_punch") && punchTick[uid] <= SENTRY_COOLDOWN - PUNCH_DURATION) {
        manager.setData(entity, "worm:dyn/parian_punch", false);
    }

    // Drive the animation timer manually (FLOAT_INTERP auto-management doesn't work on sentries)
    manager.incrementData(entity, "worm:dyn/parian_punch_timer", PUNCH_DURATION, entity.getData("worm:dyn/parian_punch"));
}
