extend("fiskheroes:hero_basic");
loadTextures({
    "layer1": "worm:eidolon_layer1",
    "layer2": "worm:eidolon_layer1",
    "helmet": "worm:eidolon_helmet",
    "chest": "worm:eidolon_chest",
    "leggings": "worm:eidolon_leggings",
    "boots": "worm:eidolon_boots",
    "crystal": "worm:eidolon_crystal",
    "crystal_cracked1": "worm:eidolon_crystal_cracked1",
    "crystal_cracked2": "worm:eidolon_crystal_cracked2",
    "crystal_cracked3": "worm:eidolon_crystal_cracked3"
});

var utils = implement("fiskheroes:external/utils");

var SLOT_KEYS = ["worm:dyn/slot1", "worm:dyn/slot2", "worm:dyn/slot3"];

// Check if any slot has a given power index
function hasPower(entity, powerIndex) {
    for (var i = 0; i < 3; i++) {
        if (Number(entity.getData(SLOT_KEYS[i])) == powerIndex) return true;
    }
    return false;
}

var energyFormGlow;
var chargeGlow;
var lightningGlow;
var crystalOverlay;
var flickerGlow;
var dangerPulses = [];
// Danger sense colors: level 1=green, 2=yellow, 3=red
var DANGER_COLORS = [0x000000, 0x44FF44, 0xFFDD22, 0xFF3322];

function init(renderer) {
    parent.init(renderer);
    renderer.showModel("HELMET", "head", "headwear", "body", "rightArm", "leftArm", "rightLeg", "leftLeg");
    renderer.setTexture(function (entity, renderLayer) {
        if (entity.isWearingFullSuit()) return "layer1";
        if (renderLayer == "SKIN") return "layer1";
        if (renderLayer == "HELMET") return "helmet";
        if (renderLayer == "LEGGINGS") return "leggings";
        if (renderLayer == "BOOTS") return "boots";
        return "chest";
    });
}

function initAnimations(renderer) {
    parent.initAnimations(renderer);
    utils.addFlightAnimationWithLanding(renderer, "eidolon.FLIGHT", "fiskheroes:flight/default.anim.json");
    utils.addHoverAnimation(renderer, "eidolon.HOVER", "fiskheroes:flight/idle/default");
}

function initEffects(renderer) {
    // Heat vision — dual eye beams, orange-red (Energy Absorption only)
    utils.bindBeam(renderer, "fiskheroes:heat_vision", "fiskheroes:heat_vision", "head", 0xFF6622, [
        { "firstPerson": [2.2, 0.0, 2.0], "offset": [2.2, -3.3, -4.0], "size": [1.0, 0.5] },
        { "firstPerson": [-2.2, 0.0, 2.0], "offset": [-2.2, -3.3, -4.0], "size": [1.0, 0.5] }
    ]).setParticles(renderer.createResource("PARTICLE_EMITTER", "fiskheroes:impact_heat_vision"))
    .setCondition(function (entity) {
        return hasPower(entity, 1);
    });

    // Lightning Storm — energy projection with lightning beam model
    utils.bindBeam(renderer, "fiskheroes:energy_projection", "worm:eidolon_lightning", "body", 0xAABBFF, [
        { "firstPerson": [0.0, 0.0, 2.0], "offset": [0.0, -3.3, -4.0], "size": [20.0, 20.0] }
    ]).setCondition(function (entity) {
        return hasPower(entity, 2);
    });

    // Gravity manipulation — AoE visual effect (default color)
    renderer.bindProperty("fiskheroes:gravity_manipulation").color.set(0x44FF66);

    // Telekinesis — cloud visual around grabbed targets (white)
    utils.bindCloud(renderer, "fiskheroes:telekinesis", "worm:eidolon_telekinesis");

    // Forcefield — green-tinted shield bubble
    var forcefield = renderer.bindProperty("fiskheroes:forcefield");
    forcefield.color.set(0x44FF66);
    forcefield.setShape(36, 18).setOffset(0.0, 6.0, 0.0).setScale(1.5);
    forcefield.setCondition(function (entity) {
        forcefield.opacity = entity.getInterpolatedData("fiskheroes:shield_blocking_timer") * 0.15;
        return hasPower(entity, 6);
    });

    // Aerokinesis — wind particles while flying
    renderer.bindProperty("fiskheroes:particles").setParticles(
        renderer.createResource("PARTICLE_EMITTER", "worm:eidolon_aerokinesis")
    ).setCondition(function (entity) {
        return hasPower(entity, 5) && entity.getData("fiskheroes:flying");
    });

    // Energy Form — azure particle cloud when in shadowform
    utils.bindCloud(renderer, "fiskheroes:particle_cloud", "worm:eidolon_energy").setCondition(function (entity) {
        return hasPower(entity, 9);
    });

    // Energy Form — azure body glow
    energyFormGlow = renderer.createEffect("fiskheroes:glowerlay");
    energyFormGlow.color.set(0x44DDFF);

    // Energy Absorption — orange charge aura (intensity tied to charge level)
    chargeGlow = renderer.createEffect("fiskheroes:glowerlay");
    chargeGlow.color.set(0xFF6622);

    // Lightning Storm — electric flicker aura (3rd person) + glow (1st person)
    utils.bindTrail(renderer, "worm:eidolon_lightning").setCondition(function (entity) {
        return hasPower(entity, 2);
    });
    lightningGlow = renderer.createEffect("fiskheroes:glowerlay");
    lightningGlow.color.set(0xAABBFF);

    // Crystal Armor — aquamarine overlay with health-based cracks
    crystalOverlay = renderer.createEffect("fiskheroes:overlay");

    // Flicker Regen — bright white flash when healing
    flickerGlow = renderer.createEffect("fiskheroes:glowerlay");
    flickerGlow.color.set(0xFFFFFF);

    // Danger Sense (13) — 4 directional expanding pulse forcefields
    // Sectors: 0=front, 1=left, 2=right, 3=above
    // Pulse starts small+far, expands and approaches, then fades
    var pulsePeriods = [70, 83, 79, 91]; // staggered periods in ticks

    for (var i = 0; i < 4; i++) {
        (function (idx) {
            var p = renderer.bindProperty("fiskheroes:forcefield");
            dangerPulses.push(p);
            p.color.set(0x44FF44);
            p.setShape(17, 7);
            p.setCondition(function (entity) {
                // Offset/scale driven in render(), just keep condition alive
                return true;
            });
        })(i);
    }
}

function render(entity, renderLayer, isFirstPersonArm) {
    // Energy Form (9) glow
    energyFormGlow.opacity = hasPower(entity, 9) ? 0.3 : 0.0;
    energyFormGlow.render();

    // Energy Absorption (1) charge glow — brightens as charge fills
    var charge = hasPower(entity, 1) ? entity.getInterpolatedData("worm:dyn/eidolon_charge") : 0.0;
    chargeGlow.opacity = charge * 0.5;
    chargeGlow.render();

    // Lightning Storm (2) glow (visible in 1st person where trail isn't)
    lightningGlow.opacity = hasPower(entity, 2) ? 0.2 : 0.0;
    lightningGlow.render();

    // Flicker Regen (12) — sharp white flash when healing
    flickerGlow.opacity = (hasPower(entity, 12) && entity.getData("worm:dyn/eidolon_flicker")) ? 0.8 : 0.0;
    flickerGlow.render();

    // Danger Sense (13) — visuals disabled, using chat messages for now
    for (var i = 0; i < 4; i++) {
        dangerPulses[i].opacity = 0;
    }

    // Crystal Armor (10) overlay — aquamarine with health-based cracks
    if (hasPower(entity, 10)) {
        var hp = entity.getHealth() / entity.getMaxHealth();
        if (hp > 0.75) {
            crystalOverlay.texture.set("crystal", null);
        } else if (hp > 0.5) {
            crystalOverlay.texture.set("crystal_cracked1", null);
        } else if (hp > 0.25) {
            crystalOverlay.texture.set("crystal_cracked2", null);
        } else {
            crystalOverlay.texture.set("crystal_cracked3", null);
        }
        crystalOverlay.opacity = 0.6;
        crystalOverlay.render();
    }
}
