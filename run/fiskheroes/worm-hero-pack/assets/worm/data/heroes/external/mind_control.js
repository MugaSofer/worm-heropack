// Shared mind control resistance data for Regent (and future masters/telepaths).
// Usage: var mc = implement("worm:external/mind_control");
//        mc.resistsControl(grabbed)  =>  false | "mindless" | "immune" | "robot"

// ── Mobs with no nervous system ──────────────────────────────────────
var MINDLESS_MOBS = {
    "Skeleton": true,
    "Wither Skeleton": true,
    "Stray": true,
    "Slime": true,
    "Magma Cube": true
};

// ── Heroes immune to telepathic damage ───────────────────────────────
// Keyed by HeroType (domain:hero_name from helmet NBT).
// Includes both TELEPATHIC and TELEPATIC immunity holders.
var TELEPATHY_IMMUNE = {
    // Worm pack
    "worm:alexandria": true,
    // DC Universe (loriatpack)
    "loriatpack:flash": true,
    // TG Heroes (X-Men)
    "tgheroes:psylocke": true
};

// Heroes with telepathy resistance (reduced, not immune)
var TELEPATHY_RESISTANT = {
    // TG Heroes — Jean Grey has 0.5 factor (takes 50% telepathic damage)
    "tgheroes:jean": true
};

// ── Non-humanoid / robotic entities ──────────────────────────────────
// No nervous system to hijack — immune to body control.
// Note: Iron Man suits are piloted by humans, so NOT listed here.
var ROBOTS = {
    // Built-in Fisk Heroes
    "fiskheroes:vision": true,
    // Fisk Rework
    "fiskrework:vision_rework": true,
    // JMCT Heroes
    "jmctheroes:ultron_mk1": true,
    "jmctheroes:ultimate_ultron": true,
    "jmctheroes:iron_legion": true,
    // Harpack
    "harpack:infinity_ultron": true,
    // DC Universe
    "loriatpack:cyborg": true,
    // TMHP
    "tmhp:cyborg": true,
    // TG Heroes
    "tgheroes:sentinel": true,
    // Omniverse
    "emo:vision": true,
    "emo:ultron": true,
    "emo:grid": true
};

// ── Main API ─────────────────────────────────────────────────────────

// Returns false if the entity can be controlled, or a reason string if not.
// Accepts any entity (mob or player).
function resistsControl(grabbed) {
    // Mindless mobs (by display name)
    if (MINDLESS_MOBS[grabbed.getName()] === true) return "mindless";

    // Check hero suit on players
    try {
        var helm = grabbed.getEquipmentInSlot(4); // 4 = helmet slot
        if (helm != null && !helm.isEmpty()) {
            var heroType = helm.nbt().getString("HeroType");
            if (heroType != null && heroType != "") {
                if (TELEPATHY_IMMUNE[heroType] === true) return "immune";
                if (ROBOTS[heroType] === true) return "robot";
            }
        }
    } catch (e) {
        // nbt() may not be available on mob entities — that's fine
    }

    return false;
}
