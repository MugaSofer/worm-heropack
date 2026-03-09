// Thinker Power config
var SCAN_RANGE = 64;
var SCAN_CONE = 10;           // degrees — narrow cone for deliberate targeting
var SCAN_INTERVAL = 10;       // ticks between auto-scans (0.5 seconds)
var HEADACHE_BUILD = 0.0005;  // per tick while active (~100s passive to fill)
var HEADACHE_DRAIN = 0.001;   // per tick while inactive (~50s to drain)
var HEADACHE_SCAN_SPIKE = 0.05;
var HEADACHE_DAMAGE_THRESHOLD = 0.7;
var DAMAGE_INTERVAL = 40;     // ticks between damage ticks above threshold

var scanTimer = 0;
var damageTimer = 0;
var lastScanMsg = "";

function scanTarget(entity, manager) {
    var nearby = entity.world().getEntitiesInRangeOf(entity.pos(), SCAN_RANGE);
    var lookVec = entity.getLookVector();
    if (lookVec == null) return false;

    var bestTarget = null;
    var bestAngle = SCAN_CONE;

    for (var i = 0; i < nearby.length; i++) {
        var other = nearby[i];
        if (other.equals(entity)) continue;
        if (!other.isLivingEntity()) continue;

        var toOther = other.eyePos().subtract(entity.eyePos()).normalized();
        var dot = lookVec.dot(toOther);
        var angle = Math.acos(Math.max(-1, Math.min(1, dot))) * (180 / Math.PI);

        if (angle < bestAngle && entity.world().isUnobstructed(entity.eyePos(), other.eyePos())) {
            bestAngle = angle;
            bestTarget = other;
        }
    }

    if (bestTarget == null) return false;

    // Build scan message, only send if different from last
    if (PackLoader.getSide() == "SERVER") {
        var p = entity.as("PLAYER");
        if (p != null) {
            var name = bestTarget.getName();
            var health = bestTarget.getHealth();
            var maxHealth = bestTarget.getMaxHealth();
            var pct = Math.round((health / maxHealth) * 100);

            var suitInfo = "";
            try {
                var helm = bestTarget.getEquipmentInSlot(4);
                if (helm != null && !helm.isEmpty()) {
                    var heroType = helm.nbt().getString("HeroType");
                    if (heroType != null && heroType != "") {
                        var parts = heroType.split(":");
                        var raw = parts.length > 1 ? parts[1] : parts[0];
                        suitInfo = raw.replace(/_/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); });
                    }
                }
            } catch (e) {}

            var msg = name + "|" + pct + "|" + suitInfo;
            if (msg != lastScanMsg) {
                lastScanMsg = msg;
                p.addChatMessage("\u00A7e\u00A7o[Thinker] \u00A7r\u00A7f" + name + " \u00A77\u2014 \u00A7c" + pct + "% HP");
                if (suitInfo != "") {
                    p.addChatMessage("\u00A7e\u00A7o  Suit: \u00A7r\u00A7f" + suitInfo);
                }
            }
        }
    }

    // Spike headache (both sides for sync)
    var headache = entity.getData("worm:dyn/tt_headache");
    manager.setData(entity, "worm:dyn/tt_headache", Math.min(0.95, headache + HEADACHE_SCAN_SPIKE));

    return true;
}

function init(hero) {
    hero.setName("Tattletale");
    hero.setTier(2);

    hero.setHelmet("Domino Mask");
    hero.setChestplate("Top");
    hero.setLeggings("Tights");
    hero.setBoots("Boots");

    hero.addPowers("worm:tattletale_powers");
    hero.addAttribute("PUNCH_DAMAGE", 1.0, 0);
    hero.addAttribute("SPRINT_SPEED", 0.08, 1);
    hero.addAttribute("FALL_RESISTANCE", 1.0, 0);

    hero.addKeyBind("ANALYZE", "Analyze", 1);

    hero.addDamageProfile("PUNCH", {
        "types": {
            "BLUNT": 1.0
        }
    });
    hero.addDamageProfile("HEADACHE", {
        "types": {
            "BLUNT": 1.0
        },
        "properties": {
            "ADD_KNOCKBACK": -0.2
        }
    });
    hero.setDamageProfile(getDamageProfile);

    var heroRef = hero;

    hero.setTickHandler(function (entity, manager) {
        var active = entity.getData("worm:dyn/tt_active");

        var headache = entity.getData("worm:dyn/tt_headache");

        if (active) {
            // Build headache passively
            headache = Math.min(0.95, headache + HEADACHE_BUILD);

            // Periodic scanning
            scanTimer++;
            if (scanTimer >= SCAN_INTERVAL) {
                scanTimer = 0;
                if (scanTarget(entity, manager)) {
                    headache = entity.getData("worm:dyn/tt_headache");
                }
            }

            // Damage above threshold
            if (headache > HEADACHE_DAMAGE_THRESHOLD) {
                damageTimer++;
                if (damageTimer >= DAMAGE_INTERVAL) {
                    damageTimer = 0;
                    entity.hurtByAttacker(heroRef, "HEADACHE", "%s thought too hard", 1.0, entity);
                }
            } else {
                damageTimer = 0;
            }
        } else {
            // Drain headache
            headache = Math.max(0, headache - HEADACHE_DRAIN);
            scanTimer = 0;
            damageTimer = 0;
        }

        manager.setData(entity, "worm:dyn/tt_headache", headache);

        return false;
    });
}

function getDamageProfile(entity) {
    return "PUNCH";
}
