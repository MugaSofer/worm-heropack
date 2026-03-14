// Shared mind control resistance data for Regent (and future masters/telepaths).
// Usage: var mc = implement("worm:external/mind_control");
//        mc.resistsControl(grabbed)  =>  false | reason string
//
// Categories:
//   "mindless"    — vanilla mobs with no nervous system (skeletons, slimes)
//   "robot"       — mechanical/AI heroes, no biology to hijack
//   "immune"      — hard telepathic shielding (magic helmets, cosmic entities, gods)
//   "resistant"   — strong psychic defense, not absolute (telepaths, strong wills)
//   "anatomy"     — nonstandard biology, nerve control may not apply (plants, symbiotes, ghosts)
//   "trained"     — mental discipline vs mind-READING (NOT vs body control like Regent)
//
// Currently: "mindless", "robot", "immune" block Regent's grab.
//            "resistant", "anatomy" stored for future partial-resistance / backfire mechanic.
//            "trained" does NOT affect Regent (nerves, not mind) but may affect future telepaths.

// ── Vanilla mobs with no nervous system ──────────────────────────────
var MINDLESS_MOBS = {
    "Skeleton": true,
    "Wither Skeleton": true,
    "Stray": true,
    "Slime": true,
    "Magma Cube": true
};

// ── ROBOTS — No biology at all ───────────────────────────────────────
// Mechanical, AI, or fully synthetic. No nervous system to hijack.
// Note: Piloted suits (Iron Man, War Machine) are NOT here — the human inside is vulnerable.
var ROBOTS = {
    // Built-in Fisk Heroes
    "fiskheroes:vision": true,
    // Fisk Rework
    "fiskrework:vision_rework": true,
    // JMCT Heroes
    "jmctheroes:ultron_mk1": true,
    "jmctheroes:ultimate_ultron": true,
    "jmctheroes:ultron_prime": true,
    "jmctheroes:iron_legion": true,
    // Harpack
    "harpack:infinity_ultron": true,
    // TG Heroes
    "tgheroes:sentinel": true,
    // Omniverse
    "emo:vision": true,
    "emo:ultron": true,
    "emo:grid": true,
    // Superman & Lois
    "sl:red_tornado_cw": true,
    // Harpack
    "harpack:springtrap": true         // animatronic
};

// ── ELECTRONIC VISION — Sees through cameras/HUDs, not biological eyes ──
var ELECTRONIC_VISION = {
    "fiskheroes:iron_man": true,
    "fiskheroes:iron_man_mk50": true,
    "fiskheroes:iron_man_mk85": true,
    "fiskrework:iron_man_rework": true,
    "fiskrework:iron_man_mk50_rework": true,
    "emo:ironman_omega": true,
    "tmf:iron_man_mk1_aa": true,
    "tmf:iron_man_mk1_aa_backpack": true,
    "tmf:iron_man_space_aa": true,
    "tmf:iron_man_stealth_aa": true,
    "tmf:iron_man_silver_centurion_aa": true,
    "jmctheroes:war_machine_mk1": true,
    "jmctheroes:war_machine_mk2": true,
    "jmctheroes:war_machine_mk3": true,
    "hom:spider_man_iron": true,
    "emo:spider": true,
    "loriatpack:cyborg": true,
    "tmhp:cyborg": true,
    "loriatpack:bat_beyond": true,
    "soulhp:batman_beyond": true,
    "loriatpack:batwing": true,
    "jmctheroes:arkham_knight": true,
    "tgheroes:doctor_doom": true,
    "sabri:doctor_doom_comics": true,
    "sabri:doctor_doom_f4": true,
    "soulhp:doctor_doom": true,
    "diabolical:doctor_doom": true,
    "emo:lexo": true,
    "sl:steel": true,
    "fiskheroes:black_manta_dceu": true,
    "fiskrework:black_manta_dceu_rework": true
};

// ── IMMUNE — Hard telepathic shielding ───────────────────────────────
// These have specific, reliable protection that blocks neural interference outright.
// Magic artifacts, cosmic-tier beings, literal gods.
var TELEPATHY_IMMUNE = {
    // -- Worm pack --
    "worm:alexandria": true,

    // -- Magneto's helmet (iconic hard counter) --
    "soulhp:magneto": true,
    "tgheroes:magneto": true,

    // -- Juggernaut's helmet --
    "soulhp:juggernaut": true,
    "tgheroes:jugger": true,

    // -- Doctor Fate / Helmet of Nabu --
    "loriatpack:doctor_fate": true,    // dcuniverse
    "tmhp:doctor_fate": true,
    "jmctheroes:doctor_fate": true,
    "hom:doctor_fate_dceu": true,

    // -- Doctor Doom (magic + tech + willpower) --
    "tgheroes:doctor_doom": true,
    "sabri:doctor_doom_comics": true,
    "sabri:doctor_doom_f4": true,
    "soulhp:doctor_doom": true,
    "diabolical:doctor_doom": true,

    // -- Gods / cosmic entities --
    "dmh:god": true,
    "dmh:death": true,
    "dmh:lucifer": true,
    "dmh:michael": true,
    "soulhp:lucifer": true,
    "emo:lucifer": true,
    "gowhp:odin": true,
    "emo:odin": true,
    "jmctheroes:darkseid": true,
    "tgheroes:galactus": true,
    "dhhp:galactus": true,
    "tgheroes:apocalypse": true,
    "soulhp:arishem": true,          // Celestial
    "soulhp:adamwarlock": true,
    "stellar:dr_manhattan": true,

    // -- Doctor Strange (magic wards) --
    "fiskrework:doctor_strange_rework": true,
    "diabolical:defender_strange": true,

    // -- Scarlet Witch (reality warper) --
    "hom:scarlet_witch": true,
    "tgheroes:s_witch": true,

    // -- Zatanna (magic) --
    "yj:zatanna": true,

    // -- Spawn (supernatural entity) --
    "loriatpack:spawn": true,
    "stellar:spawn": true
};

// ── RESISTANT — Strong psychic defense, not absolute ─────────────────
// Telepaths who can fight back, extremely strong-willed characters.
// Future: partial resistance / slower control buildup / backfire chance.
var TELEPATHY_RESISTANT = {
    // -- Telepaths (can detect and push back against neural interference) --
    "tgheroes:psylocke": true,
    "tgheroes:jean": true,
    "tgheroes:emma_frost": true,
    "tgheroes:proff_x": true,
    "misc:charles_xavier": true,
    "tgheroes:madelyne": true,        // Madelyne Pryor, Jean Grey clone
    "loriatpack:martian_manhunter": true,
    "tmhp:miss_martian": true,
    "tmhp:miss_martian_s2": true,
    "yj:miss_martian": true,
    "tmhp:raven": true,
    "dhhp:raven": true,
    "diabolical:mastermind": true,
    "misc:mind_stone": true,           // Infinity Stone of the mind

    // -- Cosmic-tier willpower / alien psychic resistance --
    "tgheroes:silver_surfer": true,
    "sabri:silver_surfer_f4": true,
    "dmh:sentry": true,
    "emo:sentry": true,
    "hom:sentry_mcu": true,
    "sabri:thanos": true,
    "hom:thanos": true,
    "dmh:king_thanos": true,

    // -- Deadpool (chaotic mind, unpredictable neural patterns) --
    "tgheroes:deadpool": true,
    "diabolical:deadpool_comics": true,
    "diabolical:deadpool_mcu": true,
    "fiskrework:deadpool_xmen_rework": true,
    "harpack:deadpool": true,
    "hom:deadpool_mcu": true,
    "diabolical:weapon_11": true,      // Weapon XI / Deadpool variant

    // -- Flash / Speed Force (vibrating molecules resist control) --
    "loriatpack:flash": true,
    "hom:flash_cw": true,
    "hom:flash_cw_v2": true,
    "hom:flash_cw_v3": true,
    "hom:flash_dceu": true,
    "hom:flash_dceu_v2": true,
    "hom:flash_rebirth": true,
    "hom:future_flash_new52": true,
    "jmctheroes:flash": true,
    "jmctheroes:flash_dceu": true,
    "jmctheroes:jay_garrick": true,
    "jmctheroes:wally_west": true,
    "dmh:flash": true,
    "emo:flash": true,
    "diabolical:kid_flash": true,
    "diabolical:accelerated_man": true,
    "diabolical:johnny_quick": true,
    "diabolical:red_racer": true,
    "fiskrework:the_flash_rework": true,
    "fiskrework:the_flash_hunter_rework": true,
    "fiskrework:the_flash_jay_rework": true,
    "fiskrework:kid_flash_rework": true,
    "fiskrework:reverse_flash_rework": true,
    "fiskrework:savitar_rework": true,
    "fiskrework:trajectory_rework": true,
    "fiskrework:godspeed_comics_rework": true,
    "fiskrework:august_heart_comics_rework": true,
    "tmhp:the_flash": true,
    "tmhp:the_flash_isue40": true,
    "tmhp:the_flash_wally": true,
    "tmhp:the_flash_yearone": true,
    "tmhp:kid_flash": true,
    "tmhp:kid_flash_bart": true,
    "tmhp:kid_flash_yj": true,
    "tmhp:impulse": true,
    "tmhp:xs": true,
    "yj:flash": true,
    "yj:kid_flash": true,
    "hom:kid_flash_cw": true,
    "hom:xs_cw": true,
    "hom:reverse_flash_cw": true,
    "hom:reverse_flash_cw_v2": true,
    "hom:godspeed_cw": true,
    "hom:godspeed_cw_v2": true,
    "hom:savitar_cw": true,
    "hom:zoom_cw": true,
    "hom:cobalt_blue_cw": true,
    "hom:black_flash_cw": true,
    "jmctheroes:reverse_flash": true,
    "jmctheroes:red_death": true,
    "sl:the_flash_dceu": true,
    "sl:cobalt_blue": true,
    "soulhp:wally_west": true,
    "soulhp:wwflash": true,
    "emo:zoom": true,
    "emo:zoom2": true,
    "emo:impulse": true,
    "fiskrework:zoom_rework": true,
    "fiskrework:the_rival_rework": true,
    "diabolical:quicksilver": true,
    "tgheroes:quicksilver": true,
    "sabri:quicksilver_xmen": true,
    "soulhp:quicksilver": true,
    "harpack:quicksilver": true,
    "diabolical:makkari": true,

    // -- Hulk (rage disrupts mental control) --
    "emo:hulk": true,
    "hom:hulk_comic": true,
    "dmh:maestro": true,               // future Hulk

    // -- Voldemort (master Occlumens) --
    "dmh:voldemort": true,

    // -- Gojo (Infinity blocks everything) --
    "dhhp:gojo": true,
    "jjkp:gojo": true
};

// ── NONSTANDARD ANATOMY — Biology that may not respond to nerve control ──
// Plants, symbiotes, ectoplasmic beings, shapeshifters with alien biology.
// Future: partial resistance, possibly scaling with how alien the body is.
var NONSTANDARD_ANATOMY = {
    // -- Plant-based --
    "jmctheroes:groot": true,
    "loriatpack:poison_ivy": true,     // plant hybrid

    // -- Symbiotes (alien biology, two minds in one body) --
    "pwt:venom": true,
    "pwt:carnage": true,
    "pwt:riot": true,
    "pwt:toxin": true,
    "jmctheroes:venom": true,
    "diabolical:venom": true,
    "emo:hybrid": true,

    // -- Cyborg (half human, half machine — nervous system is partially synthetic) --
    "loriatpack:cyborg": true,
    "tmhp:cyborg": true,

    // -- Shapeshifters with alien biology --
    "loriatpack:clayface": true,       // living clay

    // -- Ghost / ectoplasmic --
    "tmhp:danny_phantom": true,
    "tmhp:danny_phantom_5yl": true,
    "tmhp:dani_phantom": true,
    "tmhp:dark_danny": true,
    "tmhp:vlad_plasmius": true,
    "stellar:danny_phantom": true,
    "diabolical:deadman": true,        // disembodied spirit

    // -- Demonic / magical body --
    "jmctheroes:hellboy": true,        // half-demon
    "loriatpack:azrael": true,         // supernatural body
    "diabolical:extremis": true,       // techno-organic
    "emo:firestorm_matrix": true,      // nuclear fusion being

    // -- Chainsaw Man (devil hybrid) --
    "jmctheroes:chainsaw_man": true,
    "jmctheroes:katana_man": true
};

// ── TRAINED — Mental discipline vs mind-reading ──────────────────────
// Does NOT affect Regent (he controls nerves, not thoughts).
// Stored for future Worm telepaths (Simurgh, Cherish, etc.)
var TELEPATHY_TRAINED = {
    // -- Batman family (trained mental defenses) --
    "loriatpack:batman": true,
    "loriatpack:bat_beyond": true,
    "loriatpack:batgirl": true,
    "loriatpack:batwoman": true,
    "loriatpack:nightwing": true,
    "loriatpack:robin": true,
    "loriatpack:red_hood": true,
    "loriatpack:red_robin": true,
    "tmhp:batman": true,
    "tmhp:batman_fp": true,
    "tmhp:nightwing": true,
    "tmhp:nightwing_yj": true,
    "tmhp:red_robin": true,
    "tmhp:robin_yj": true,
    "tmhp:robin_yj_tim": true,
    "tmhp:robin_demian": true,
    "yj:batman": true,
    "yj:dick_robin": true,
    "jmctheroes:batman_comics": true,
    "jmctheroes:arkham_knight": true,
    "jmctheroes:red_hood": true,
    "dhhp:nightwing": true,
    "dhhp:red_hood": true,
    "dhhp:red_x": true,
    "diabolical:batman_adam_west": true,
    "diabolical:batman_animated": true,
    "diabolical:batman_arkham": true,
    "diabolical:batman_arkham_city": true,
    "diabolical:batman_arkham_knight": true,
    "diabolical:batman_arkham_origins": true,
    "diabolical:batman_dark_knight_returns": true,
    "diabolical:batman_keaton": true,
    "diabolical:batman_pattinson": true,
    "diabolical:red_hood": true,
    "diabolical:red_robin": true,
    "diabolical:robin": true,
    "hell:hush": true,
    "diabolical:hush": true,
    "soulhp:batman_beyond": true,
    "pwt:batman_cyberpunk": true,
    "pwt:robin_cyberpunk": true,
    "emo:nightwing": true,
    "fiskrework:batman_dceu_rework": true,
    "loriatpack:deathstroke": true,    // trained assassin
    "fiskrework:deathstroke_dceu_rework": true,
    "loriatpack:signal": true,
    "loriatpack:talon": true,
    "loriatpack:huntress": true,
    "loriatpack:catwoman": true,

    // -- Wolverine (Xavier-installed psychic defenses) --
    "tgheroes:wolverine": true,
    "tgheroes:x_23": true,
    "sabri:wolverine_xmen": true,
    "hom:wolverine_mcu": true,
    "diabolical:wolverine": true,
    "diabolical:sabretooth": true,
    "dmh:wolverine_rivals": true,

    // -- Force users (mental discipline) --
    "swhp:kenobi": true,
    "swhp:anakinskywalker": true,
    "swhp:darthvader": true,
    "swhp:darthmaul": true,
    "swhp:darthrevan": true,
    "swhp:revan": true,
    "swhp:windu": true,
    "swhp:ahsoka": true,
    "tmhp:anakin_skywalker": true,
    "emo:jedi": true,
    "emo:sith": true,
    "harpack:starkiller": true,

    // -- God of War (divine willpower) --
    "gowhp:kratos": true,
    "gowhp:kratos_upgraded": true,
    "gowhp:kratos_ragnarok": true,
    "gowhp:kratos_allfather": true,
    "gowhp:thor": true,
    "harpack:kratos_gow3": true
};

// ── Main API ─────────────────────────────────────────────────────────

// Returns true if entity has non-humanoid biology (harder for Regent to control).
// Non-humanoid = nonstandard anatomy heroes, or vanilla mobs without hero suits.
function isNonHumanoid(entity) {
    var resistance = resistsControl(entity);
    if (resistance == "anatomy") return true;
    // Vanilla mobs without hero suits have non-human nervous systems
    try {
        var helm = entity.getEquipmentInSlot(4);
        if (helm == null || helm.isEmpty()) return true;
        var heroType = helm.nbt().getString("HeroType");
        if (heroType == null || heroType == "") return true;
    } catch (e) {
        return true; // can't read equipment → probably a mob
    }
    return false;
}

// Check if entity is wearing a robot hero suit (no nervous system).
// Used by Imp's visibility system — robots can detect her.
function seesElectronically(entity) {
    try {
        var helm = entity.getEquipmentInSlot(4);
        if (helm != null && !helm.isEmpty()) {
            var heroType = helm.nbt().getString("HeroType");
            if (heroType != null && heroType != "") {
                return ROBOTS[heroType] === true || ELECTRONIC_VISION[heroType] === true;
            }
        }
    } catch (e) {}
    return false;
}

// Returns false if the entity can be controlled, or a category string.
// Priority order: mindless > robot > immune > resistant > anatomy > trained
function resistsControl(grabbed) {
    // Mindless mobs (by display name)
    if (MINDLESS_MOBS[grabbed.getName()] === true) return "mindless";

    // Check hero suit on players
    try {
        var helm = grabbed.getEquipmentInSlot(4); // 4 = helmet slot
        if (helm != null && !helm.isEmpty()) {
            var heroType = helm.nbt().getString("HeroType");
            if (heroType != null && heroType != "") {
                if (ROBOTS[heroType] === true) return "robot";
                if (TELEPATHY_IMMUNE[heroType] === true) return "immune";
                if (TELEPATHY_RESISTANT[heroType] === true) return "resistant";
                if (NONSTANDARD_ANATOMY[heroType] === true) return "anatomy";
                if (TELEPATHY_TRAINED[heroType] === true) return "trained";
            }
        }
    } catch (e) {
        // nbt() may not be available on mob entities — that's fine
    }

    return false;
}
