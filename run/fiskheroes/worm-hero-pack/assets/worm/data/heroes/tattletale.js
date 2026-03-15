var team = implement("worm:external/undersiders");
//var heroData = implement("worm:external/hero_data");

// Thinker Power config
var SCAN_RANGE = 64;
var SCAN_CONE = 10;           // degrees — narrow cone for deliberate targeting
var SCAN_INTERVAL = 10;       // ticks between auto-scans (0.5 seconds)
var HEADACHE_BUILD = 0.0005;  // per tick while active (~100s passive to fill)
var HEADACHE_DRAIN = 0.001;   // per tick while inactive (~50s to drain)
var HEADACHE_SCAN_SPIKE = 0.05;
var HEADACHE_DAMAGE_THRESHOLD = 0.7;
var DAMAGE_INTERVAL = 40;     // ticks between damage ticks above threshold

var healthCache = {};  // UUID → last health% (session dedup for repeat scans)

// Easter egg insights for known heroes (keyed on hero ID after ":")
var INSIGHTS = {
    // Worm
    "alexandria": "Invulnerable. Flight. Enhanced cognition. But still needs to breathe...",
    "legend": "Flight, enhanced vision, lasers can bend mid-flight. But he still needs to see you to target you.",
    "eidolon": "Powers shifting... can't get a read on them. But he's hiding something.",
    "regent": "Pupil dilation suggests sociopathy.",
    "grue": "Darkness generation; muffles sound, light: inhibits radiation, microwaves, radio frequencies...",
    "imp": "It's Imp. Remember Imp?",
    "bitch": "Controls dogs. They grow. A lot. Don\u2019t threaten the dogs.",
    "skitter": "Bug control. Thousands at once, perfect multitasking. Considering betraying you, but won't.",
    "tattletale": "...That\u2019s you.",
    // DC
    "batman": "No powers. Contingency files on every ally. Paranoia is the power \u2014 and the weakness.",
    "superman": "Solar-powered. Kryptonite, magic bypasses his defenses entirely. Holds back \u2014 always.",
    "flash": "Speed Force. Vibrates through solid matter. Emotional instability at high speeds.",
    "wonder_woman": "Demigod. Millennia of combat experience. Susceptible to piercing. Lasso forces truth - avoid.",
    "aquaman": "Atlantean. Dehydration weakens him. Everyone underestimates him \u2014 that's his real advantage.",
    "green_arrow": "No powers. Trick arrows. Predictable moral code makes him easy to manipulate.",
    "arrow": "No powers. Trick arrows. Predictable moral code makes him easy to manipulate.",
    "chronos": "Assassin. Mind controlled. Access to temporal manipulation tech - separate them.",
    "daredevil": "Blind. Radar sense compensates. Overwhelm with loud noise or strong chemicals.",
    // Marvel
    "spider_man": "Precognitive danger sense \u2014 can't be ambushed. Guilt complex makes him predictable.",
    "iron_man": "Arc reactor dependency. Suit is vulnerable to EMP. Ego is the real weak point.",
    "hulk": "No strength ceiling. Angrier = stronger. Banner's still in there \u2014 appeal to him.",
    "captain_america": "Peak human. Vibranium shield absorbs all kinetic energy. Won't compromise \u2014 predictable.",
    "thor": "Asgardian. Weather manipulation. Power is internal now, not the hammer.",
    "black_panther": "Vibranium weave absorbs and redirects kinetic energy. The suit has limits.",
    "wolverine": "Adamantium skeleton. Healing factor. Memory gaps \u2014 identity is a wound.",
    "deadpool": "Healing factor. Cannot die. Knows things he shouldn't \u2014 don't ask."
};

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

    // Build scan message with NBT-persistent first-scan tracking
    if (PackLoader.getSide() == "SERVER") {
        var p = entity.as("PLAYER");
        if (p != null) {
            var uuid = "" + bestTarget.getUUID();
            var name = bestTarget.getName();
            var health = bestTarget.getHealth();
            var maxHealth = bestTarget.getMaxHealth();
            var pct = Math.round((health / maxHealth) * 100);

            // Detect suit
            var heroId = "";
            try {
                var helm = bestTarget.getEquipmentInSlot(4);
                if (helm != null && !helm.isEmpty()) {
                    var heroType = helm.nbt().getString("HeroType");
                    if (heroType != null && heroType != "") {
                        var parts = heroType.split(":");
                        heroId = parts.length > 1 ? parts[1] : parts[0];
                    }
                }
            } catch (e) {}

            // Check NBT for persistent scan history (format: "uuid:heroId,uuid:heroId,...")
            var nbt = entity.getWornChestplate().nbt();
            var scannedStr = nbt.getString("tt_scanned") || "";
            var entries = scannedStr === "" ? [] : scannedStr.split(",");

            // Find existing entry for this UUID
            var existingIdx = -1;
            var existingHeroId = "";
            for (var j = 0; j < entries.length; j++) {
                var colonPos = entries[j].indexOf(":");
                var entryUuid = colonPos >= 0 ? entries[j].substring(0, colonPos) : entries[j];
                if (entryUuid === uuid) {
                    existingIdx = j;
                    existingHeroId = colonPos >= 0 ? entries[j].substring(colonPos + 1) : "";
                    break;
                }
            }

            // Imp's Stranger power — can't remember her, always a fresh read
            var isImp = heroId === "imp";
            var isFirstScan = existingIdx === -1 || existingHeroId !== heroId || isImp;

            if (isFirstScan) {
                // Update or add NBT entry (skip Imp — can't remember her)
                if (!isImp) {
                    var entry = uuid + ":" + heroId;
                    if (existingIdx >= 0) {
                        entries[existingIdx] = entry;
                    } else {
                        entries.push(entry);
                    }
                    manager.setString(nbt, "tt_scanned", entries.join(","));
                }

                // Full scan report
                p.addChatMessage("\u00A7e\u00A7o[Thinker] \u00A7r\u00A7f" + name + " \u00A77\u2014 \u00A7c" + pct + "% HP");

                if (heroId !== "") {
                    var suitName = heroId.replace(/_/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); });
                    p.addChatMessage("\u00A7e\u00A7o  Suit: \u00A7r\u00A7f" + suitName);
                }

                // Easter egg insight — split at ". " to avoid line-wrap formatting loss
                var insight = INSIGHTS[heroId];
                if (insight) {
                    var sentences = [];
                    var remaining = insight;
                    var dotIdx;
                    while ((dotIdx = remaining.indexOf(". ")) !== -1) {
                        sentences.push(remaining.substring(0, dotIdx + 1));
                        remaining = remaining.substring(dotIdx + 2);
                    }
                    sentences.push(remaining);
                    p.addChatMessage("\u00A7e\u00A7o  Insight: \u00A77" + sentences[0]);
                    for (var k = 1; k < sentences.length; k++) {
                        p.addChatMessage("\u00A77    " + sentences[k]);
                    }
                } else if (heroId !== "") {
                    p.addChatMessage("\u00A7e\u00A7o  Insight: \u00A77Powers unclear \u2014 need more data.");
                }

                healthCache[uuid] = pct;
            } else {
                // Already scanned — only report if health changed
                if (healthCache[uuid] !== pct) {
                    healthCache[uuid] = pct;
                    p.addChatMessage("\u00A7e\u00A7o[Thinker] \u00A7r\u00A7f" + name + " \u00A77\u2014 \u00A7c" + pct + "% HP");
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
    hero.addPowers("worm:undersiders");
    hero.addAttribute("PUNCH_DAMAGE", 1.0, 0);
    hero.addAttribute("SPRINT_SPEED", 0.08, 1);
    hero.addAttribute("FALL_RESISTANCE", 1.0, 0);

    hero.addKeyBind("ANALYZE", "Analyze", 1);
    hero.addKeyBind("AIM", "Aim", -1);

    hero.addPrimaryEquipment("fisktag:weapon{WeaponType:worm:beret_92f}", true, function(item) { return item.nbt().getString("WeaponType") == "worm:beret_92f"; });
    hero.setHasPermission(function (entity, permission) {
        return permission == "USE_GUN" || team.hasPermission(entity, permission);
    });
    hero.supplyFunction("canAim", function (entity) {
        if (entity.getHeldItem().name() == "fisktag:weapon") return true;
        return entity.getData("worm:dyn/tt_nearby") && !entity.getHeldItem().isEmpty();
    });

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
        team.tick(entity, manager, heroRef);
        var active = entity.getData("worm:dyn/tt_active");

        var headache = entity.getData("worm:dyn/tt_headache");

        if (active) {
            // Build headache passively
            if (PackLoader.getSide() == "SERVER") {
                headache = Math.min(0.95, headache + HEADACHE_BUILD);
            }

            // Periodic scanning — server only, ticksExisted avoids shared-counter desync
            if (PackLoader.getSide() == "SERVER" && entity.ticksExisted() % SCAN_INTERVAL == 0) {
                if (scanTarget(entity, manager)) {
                    headache = entity.getData("worm:dyn/tt_headache");
                }
            }

            // Damage above threshold — server only to prevent double damage
            if (PackLoader.getSide() == "SERVER" && headache > HEADACHE_DAMAGE_THRESHOLD
                    && entity.ticksExisted() % DAMAGE_INTERVAL == 0) {
                entity.hurtByAttacker(heroRef, "HEADACHE", "%s thought too hard", 1.0, entity);
            }
        } else {
            // Drain headache
            if (PackLoader.getSide() == "SERVER") {
                headache = Math.max(0, headache - HEADACHE_DRAIN);
            }
        }

        manager.setData(entity, "worm:dyn/tt_headache", headache);

        return false;
    });
}

function getDamageProfile(entity) {
    return "PUNCH";
}
