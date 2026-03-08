var mc = implement("worm:external/mind_control");

// Electronic vision detection config
var SCAN_RANGE = 32;           // blocks
var SCAN_ANGLE = 65;           // degrees — electronic FOV cone for detection

function scanForElectronicVision(entity) {
    var nearby = entity.world().getEntitiesInRangeOf(entity.pos(), SCAN_RANGE);
    for (var i = 0; i < nearby.length; i++) {
        var other = nearby[i];
        if (other.equals(entity)) continue;
        if (!mc.seesElectronically(other)) continue;

        // Check if they're looking at Imp
        var lookVec = other.getLookVector();
        if (lookVec == null) continue;
        var toImp = entity.eyePos().subtract(other.eyePos()).normalized();
        var dot = lookVec.dot(toImp);
        var angle = Math.acos(Math.max(-1, Math.min(1, dot))) * (180 / Math.PI);

        if (angle < SCAN_ANGLE && entity.world().isUnobstructed(other.eyePos(), entity.eyePos())) {
            return true;
        }
    }
    return false;
}

function init(hero) {
    hero.setName("Imp");
    hero.setTier(2);

    hero.setHelmet("Mask & Scarf");
    hero.setChestplate("Top");
    hero.setLeggings("Pants");
    hero.setBoots("Boots");

    hero.setHasProperty(function (entity, property) { return property == "MASK_TOGGLE"; });

    hero.addPowers("worm:imp_powers");
    hero.addAttribute("PUNCH_DAMAGE", 2.0, 0);
    hero.addAttribute("SPRINT_SPEED", 0.05, 1);
    hero.addAttribute("FALL_RESISTANCE", 1.0, 0);

    hero.addKeyBind("HEAT_VISION", "Reveal Self", 1);

    hero.addDamageProfile("PUNCH", {
        "types": {
            "BLUNT": 1.0
        }
    });
    hero.setDamageProfile(getDamageProfile);

    hero.setTickHandler(function (entity, manager) {
        var revealing = entity.getData("fiskheroes:heat_vision");
        var punching = entity.isPunching();
        var detected = !revealing && scanForElectronicVision(entity);

        // Smooth fade for detection (3-tick transition)
        manager.incrementData(entity, "worm:dyn/imp_visible_timer", 1, detected);

        // Invisible unless revealing, punching, or detected
        manager.setDataWithNotify(entity, "fiskheroes:invisible", !revealing && !punching && !detected);
        return false;
    });
}

function getDamageProfile(entity) {
    return "PUNCH";
}
