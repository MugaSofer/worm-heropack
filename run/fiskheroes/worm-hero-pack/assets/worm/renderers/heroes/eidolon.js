extend("fiskheroes:hero_basic");
loadTextures({
    "layer1": "worm:eidolon_layer1",
    "layer2": "worm:eidolon_layer1"
});

var utils = implement("fiskheroes:external/utils");

var glow;
var ffGlow;

function init(renderer) {
    parent.init(renderer);
}

function initAnimations(renderer) {
    parent.initAnimations(renderer);
    utils.addFlightAnimationWithLanding(renderer, "eidolon.FLIGHT", "fiskheroes:flight/default.anim.json");
    utils.addHoverAnimation(renderer, "eidolon.HOVER", "fiskheroes:flight/idle/default");
}

function initEffects(renderer) {
    // Heat vision — dual eye beams, green-tinted (Energy Absorption only)
    utils.bindBeam(renderer, "fiskheroes:heat_vision", "fiskheroes:heat_vision", "head", 0x44FF66, [
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
    renderer.bindProperty("fiskheroes:gravity_manipulation");

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

    // Forcefield — green body glow when forcefield mode is active
    ffGlow = renderer.createEffect("fiskheroes:glowerlay");
    ffGlow.color.set(0x44FF66);

    // Energy Form — green particle cloud when in shadowform
    utils.bindCloud(renderer, "fiskheroes:particle_cloud", "worm:eidolon_energy").setCondition(function (entity) {
        return entity.getData("worm:dyn/slot3") == 1;
    });

    // Energy Form — green body glow
    glow = renderer.createEffect("fiskheroes:glowerlay");
    glow.color.set(0x44FF66);
}

function render(entity, renderLayer, isFirstPersonArm) {
    var s2 = entity.getData("worm:dyn/slot2");
    var s3 = entity.getData("worm:dyn/slot3");

    // Energy Form glow
    glow.opacity = s3 == 1 ? 0.3 : 0.0;
    glow.render();

    // Forcefield mode glow — subtle when selected, brighter when actively blocking
    var blocking = entity.getInterpolatedData("fiskheroes:shield_blocking_timer");
    ffGlow.opacity = s2 == 2 ? (0.1 + blocking * 0.3) : 0.0;
    ffGlow.render();
}
