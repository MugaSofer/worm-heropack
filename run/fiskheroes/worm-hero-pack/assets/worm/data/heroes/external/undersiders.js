// Shared Undersiders team logic.
// Usage: var team = implement("worm:external/undersiders");
//        team.tick(entity, manager, hero) — call from each Undersider's tick handler
//        team.isUndersider(entity)        — check if entity wears an Undersider suit
//
// Features:
//   1. isUndersider() — for Skitter AoE skip, future team checks
//   2. TT proximity — sets worm:dyn/tt_nearby when a Tattletale player is within range
//   3. TT scanned target boost — +2 bonus damage when punching a target TT has scanned
//      (read from her chestplate NBT tt_scanned field)

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
var BONUS_DAMAGE = 2.0;
var BONUS_COOLDOWN = 10;     // ticks between bonus hits (0.5 seconds)

// Per-entity state (shared module instance — keyed by UUID for multiplayer safety)
var ttCheckTimer = 0;
var scannedUUIDs = {};
var hasTTNearby = false;
var punchCooldowns = {};     // UUID string -> ticks remaining

function isUndersider(entity) {
    try {
        var helm = entity.getEquipmentInSlot(4);
        if (helm != null && !helm.isEmpty()) {
            return UNDERSIDERS[helm.nbt().getString("HeroType")] === true;
        }
    } catch (e) {}
    return false;
}

function tick(entity, manager, hero) {
    // Periodic TT proximity + scanned list update
    ttCheckTimer++;
    if (ttCheckTimer >= TT_CHECK_INTERVAL) {
        ttCheckTimer = 0;
        hasTTNearby = false;
        scannedUUIDs = {};

        // TT always counts as her own proximity
        try {
            var selfHelm = entity.getEquipmentInSlot(4);
            if (selfHelm != null && !selfHelm.isEmpty() && selfHelm.nbt().getString("HeroType") === "worm:tattletale") {
                hasTTNearby = true;
                var selfChest = entity.getWornChestplate();
                if (selfChest != null && !selfChest.isEmpty()) {
                    var selfScanned = selfChest.nbt().getString("tt_scanned") || "";
                    if (selfScanned !== "") {
                        var selfEntries = selfScanned.split(",");
                        for (var s = 0; s < selfEntries.length; s++) {
                            var sColonPos = selfEntries[s].indexOf(":");
                            var sUuid = sColonPos >= 0 ? selfEntries[s].substring(0, sColonPos) : selfEntries[s];
                            scannedUUIDs[sUuid] = true;
                        }
                    }
                }
            }
        } catch (e) {}

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
    var scannedTarget = null;
    if (hasTTNearby) {
        scannedTarget = findScannedTarget(entity);
    }
    manager.setData(entity, "worm:dyn/tt_target_scanned", scannedTarget != null);

    // Bonus damage on punch against scanned target
    var myUUID = "" + entity.getUUID();
    if (!punchCooldowns[myUUID]) punchCooldowns[myUUID] = 0;
    if (punchCooldowns[myUUID] > 0) punchCooldowns[myUUID]--;

    var inMeleeRange = scannedTarget != null && scannedTarget.pos().distanceTo(entity.pos()) < 5;
    if (hero != null && scannedTarget != null && inMeleeRange && entity.isPunching() && punchCooldowns[myUUID] == 0) {
        scannedTarget.hurtByAttacker(hero, "PUNCH", "%1$s was outsmarted by %2$s", BONUS_DAMAGE, entity);
        punchCooldowns[myUUID] = BONUS_COOLDOWN;
        if (PackLoader.getSide() == "SERVER") {
            try {
                var targetName = scannedTarget.getName();
                var article = scannedTarget.as("PLAYER") != null ? "" : "the ";
                entity.as("PLAYER").addChatMessage("\u00A77\u00A7o+" + BONUS_DAMAGE + " damage \u2014 applying Tattletale's insight on \u00A7f" + article + targetName);
            } catch (e) {}
        }
    }
}

// Returns the scanned entity we're looking at, or null
function findScannedTarget(entity) {
    var lookVec = entity.getLookVector();
    if (lookVec == null) return null;

    var nearby = entity.world().getEntitiesInRangeOf(entity.pos(), 48);
    var bestAngle = SCAN_CONE;
    var bestEntity = null;

    for (var i = 0; i < nearby.length; i++) {
        var other = nearby[i];
        if (other.equals(entity)) continue;
        if (!other.isLivingEntity()) continue;

        var toOther = other.eyePos().subtract(entity.eyePos()).normalized();
        var dot = lookVec.dot(toOther);
        var angle = Math.acos(Math.max(-1, Math.min(1, dot))) * (180 / Math.PI);

        if (angle < bestAngle) {
            bestAngle = angle;
            bestEntity = other;
        }
    }

    if (bestEntity != null && scannedUUIDs["" + bestEntity.getUUID()] === true) {
        return bestEntity;
    }
    return null;
}

// Tinker weapons: grant all weapon permissions when TT is nearby
function hasPermission(entity, permission) {
    return entity.getData("worm:dyn/tt_nearby");
}
