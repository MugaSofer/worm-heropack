// Shared Undersiders team logic.
// Usage: var team = implement("worm:external/undersiders");
//        team.tick(entity, manager)       — call from each Undersider's tick handler
//        team.isUndersider(entity)        — check if entity wears an Undersider suit
//        team.isModifierEnabled(entity, modifier) — gate shared modifiers
//
// Features:
//   1. isUndersider() — for Skitter AoE skip, future team checks
//   2. TT proximity — sets worm:dyn/tt_nearby when a Tattletale player is within range
//   3. TT scanned target boost — sets worm:dyn/tt_target_scanned when looking at a
//      target that Tattletale has scanned (read from her chestplate NBT)
//   4. Tinker weapons — USE_GUN gated on tt_nearby (handled per-hero)

var UNDERSIDERS = {
    "worm:skitter": true,
    "worm:tattletale": true,
    "worm:grue": true,
    "worm:imp": true,
    "worm:regent": true,
    "worm:bitch": true,
    "worm:foil": true
};

var TT_RANGE = 64;
var TT_CHECK_INTERVAL = 20;  // ticks between TT proximity checks (1 second)
var SCAN_CONE = 10;          // degrees — match TT's own scan cone

// Per-entity state (keyed by entity, reset each check cycle)
var ttCheckTimer = 0;
var scannedUUIDs = {};
var hasTTNearby = false;

function isUndersider(entity) {
    try {
        var helm = entity.getEquipmentInSlot(4);
        if (helm != null && !helm.isEmpty()) {
            return UNDERSIDERS[helm.nbt().getString("HeroType")] === true;
        }
    } catch (e) {}
    return false;
}

function tick(entity, manager) {
    // Periodic TT proximity + scanned list update
    ttCheckTimer++;
    if (ttCheckTimer >= TT_CHECK_INTERVAL) {
        ttCheckTimer = 0;
        hasTTNearby = false;
        scannedUUIDs = {};

        var nearby = entity.world().getEntitiesInRangeOf(entity.pos(), TT_RANGE);
        for (var i = 0; i < nearby.length; i++) {
            var other = nearby[i];
            if (other.equals(entity)) continue;
            try {
                var helm = other.getEquipmentInSlot(4);
                if (helm != null && !helm.isEmpty()) {
                    if (helm.nbt().getString("HeroType") === "worm:tattletale") {
                        hasTTNearby = true;
                        // Read her scanned list from chestplate NBT
                        var chest = other.getWornChestplate();
                        if (chest != null && !chest.isEmpty()) {
                            var scannedStr = chest.nbt().getString("tt_scanned") || "";
                            if (scannedStr !== "") {
                                var entries = scannedStr.split(",");
                                for (var j = 0; j < entries.length; j++) {
                                    var colonPos = entries[j].indexOf(":");
                                    var uuid = colonPos >= 0 ? entries[j].substring(0, colonPos) : entries[j];
                                    scannedUUIDs[uuid] = true;
                                }
                            }
                        }
                        break;  // only need one TT
                    }
                }
            } catch (e) {}
        }
    }

    manager.setData(entity, "worm:dyn/tt_nearby", hasTTNearby);

    // Check if currently looking at a scanned target
    var targetScanned = false;
    if (hasTTNearby) {
        targetScanned = checkLookingAtScanned(entity);
    }
    manager.setData(entity, "worm:dyn/tt_target_scanned", targetScanned);
}

function checkLookingAtScanned(entity) {
    var lookVec = entity.getLookVector();
    if (lookVec == null) return false;

    var nearby = entity.world().getEntitiesInRangeOf(entity.pos(), 48);
    var bestAngle = SCAN_CONE;
    var bestUUID = null;

    for (var i = 0; i < nearby.length; i++) {
        var other = nearby[i];
        if (other.equals(entity)) continue;
        if (!other.isLivingEntity()) continue;

        var toOther = other.eyePos().subtract(entity.eyePos()).normalized();
        var dot = lookVec.dot(toOther);
        var angle = Math.acos(Math.max(-1, Math.min(1, dot))) * (180 / Math.PI);

        if (angle < bestAngle) {
            bestAngle = angle;
            bestUUID = "" + other.getUUID();
        }
    }

    return bestUUID != null && scannedUUIDs[bestUUID] === true;
}

function isModifierEnabled(entity, modifier) {
    if (modifier.name() == "fiskheroes:damage_bonus" && modifier.id() == "tt_intel") {
        return entity.getData("worm:dyn/tt_target_scanned");
    }
    if (modifier.name() == "fiskheroes:damage_immunity" && modifier.id() == "swarm") {
        return true;  // always active
    }
    return null;  // null = not handled, let hero's own logic decide
}
