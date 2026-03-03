extend("fiskheroes:hero_basic");
loadTextures({
    "layer1": "worm:eidolon_layer1",
    "layer2": "worm:eidolon_layer1",
    "crystal": "worm:eidolon_crystal",
    "crystal_cracked1": "worm:eidolon_crystal_cracked1",
    "crystal_cracked2": "worm:eidolon_crystal_cracked2",
    "crystal_cracked3": "worm:eidolon_crystal_cracked3"
});

var utils = implement("fiskheroes:external/utils");

var energyFormGlow;
var chargeGlow;
var lightningGlow;
var crystalOverlay;

function init(renderer) {
    parent.init(renderer);
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
        return entity.getData("worm:dyn/slot1") == 1;
    });

    // Lightning Storm — energy projection with lightning beam model
    utils.bindBeam(renderer, "fiskheroes:energy_projection", "worm:eidolon_lightning", "body", 0xAABBFF, [
        { "firstPerson": [0.0, 0.0, 2.0], "offset": [0.0, -3.3, -4.0], "size": [20.0, 20.0] }
    ]).setCondition(function (entity) {
        return entity.getData("worm:dyn/slot1") == 2;
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
        return entity.getData("worm:dyn/slot2") == 2;
    });

    // Energy Form — green particle cloud when in shadowform
    utils.bindCloud(renderer, "fiskheroes:particle_cloud", "worm:eidolon_energy").setCondition(function (entity) {
        return entity.getData("worm:dyn/slot3") == 1;
    });

    // Energy Form — green body glow
    energyFormGlow = renderer.createEffect("fiskheroes:glowerlay");
    energyFormGlow.color.set(0x44FF66);

    // Energy Absorption — orange charge aura (intensity tied to charge level)
    chargeGlow = renderer.createEffect("fiskheroes:glowerlay");
    chargeGlow.color.set(0xFF6622);

    // Lightning Storm — electric flicker aura (3rd person) + glow (1st person)
    utils.bindTrail(renderer, "worm:eidolon_lightning").setCondition(function (entity) {
        return entity.getData("worm:dyn/slot1") == 2;
    });
    lightningGlow = renderer.createEffect("fiskheroes:glowerlay");
    lightningGlow.color.set(0xAABBFF);

    // Crystal Armor — aquamarine overlay with health-based cracks
    crystalOverlay = renderer.createEffect("fiskheroes:overlay");
}

function render(entity, renderLayer, isFirstPersonArm) {
    var s1 = entity.getData("worm:dyn/slot1");
    var s3 = entity.getData("worm:dyn/slot3");

    // Energy Form glow
    energyFormGlow.opacity = s3 == 1 ? 0.3 : 0.0;
    energyFormGlow.render();

    // Energy Absorption charge glow — brightens as charge fills
    var charge = s1 == 1 ? entity.getInterpolatedData("worm:dyn/eidolon_charge") : 0.0;
    chargeGlow.opacity = charge * 0.5;
    chargeGlow.render();

    // Lightning Storm glow (visible in 1st person where trail isn't)
    lightningGlow.opacity = s1 == 2 ? 0.2 : 0.0;
    lightningGlow.render();

    // Crystal Armor overlay — aquamarine with health-based cracks
    if (s3 == 2) {
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
