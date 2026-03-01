extend("fiskheroes:hero_basic");
loadTextures({
    "layer1": "worm:legend_layer1",
    "layer2": "worm:legend_layer1"
});

var utils = implement("fiskheroes:external/utils");

function init(renderer) {
    parent.init(renderer);
}

function initAnimations(renderer) {
    parent.initAnimations(renderer);
    utils.addFlightAnimationWithLanding(renderer, "legend.FLIGHT", "fiskheroes:flight/default.anim.json");
    utils.addHoverAnimation(renderer, "legend.HOVER", "fiskheroes:flight/idle/default");
}

function initEffects(renderer) {
    // Mode 0: Laser Beam — standard focused beam
    utils.bindBeam(renderer, "fiskheroes:charged_beam", "fiskheroes:charged_beam", "head", 0x4488FF, [
        { "firstPerson": [0.0, 6.0, 0.0], "offset": [0.0, -3.0, -4.0], "size": [2.0, 2.0] }
    ]).setCondition(function (entity) {
        return entity.getData("worm:dyn/laser_mode") == 0;
    }).setParticles(renderer.createResource("PARTICLE_EMITTER", "fiskheroes:impact_charged_beam"));

    // Mode 1: Ice Laser — same blue beam look, frost on impact
    utils.bindBeam(renderer, "fiskheroes:charged_beam", "fiskheroes:charged_beam", "head", 0x4488FF, [
        { "firstPerson": [0.0, 6.0, 0.0], "offset": [0.0, -3.0, -4.0], "size": [2.0, 2.0] }
    ]).setCondition(function (entity) {
        return entity.getData("worm:dyn/laser_mode") == 1;
    }).setParticles(renderer.createResource("PARTICLE_EMITTER", "worm:ice_impact"));

    // Mode 2: AoE Blast — wide beam
    utils.bindBeam(renderer, "fiskheroes:charged_beam", "fiskheroes:charged_beam", "head", 0x4488FF, [
        { "firstPerson": [0.0, 6.0, 0.0], "offset": [0.0, -3.0, -4.0], "size": [6.0, 6.0] }
    ]).setCondition(function (entity) {
        return entity.getData("worm:dyn/laser_mode") == 2;
    }).setParticles(renderer.createResource("PARTICLE_EMITTER", "fiskheroes:impact_charged_beam"));

    // Mode 3: Concussive Bolt — thin fast beam, no impact particles
    utils.bindBeam(renderer, "fiskheroes:charged_beam", "fiskheroes:charged_beam", "head", 0x4488FF, [
        { "firstPerson": [0.0, 6.0, 0.0], "offset": [0.0, -3.0, -4.0], "size": [1.0, 1.0] }
    ]).setCondition(function (entity) {
        return entity.getData("worm:dyn/laser_mode") == 3;
    });

    // Mode 4: Laser Swarm — wide spread beam
    utils.bindBeam(renderer, "fiskheroes:charged_beam", "fiskheroes:charged_beam", "head", 0x4488FF, [
        { "firstPerson": [0.0, 6.0, 0.0], "offset": [0.0, -3.0, -4.0], "size": [4.0, 4.0] }
    ]).setCondition(function (entity) {
        return entity.getData("worm:dyn/laser_mode") == 4;
    }).setParticles(renderer.createResource("PARTICLE_EMITTER", "fiskheroes:impact_charged_beam"));

    // Camera shake on beam firing
    var shake = renderer.bindProperty("fiskheroes:camera_shake").setCondition(function (entity) {
        return entity.getInterpolatedData("fiskheroes:beam_shooting_timer") > 0;
    });
    shake.factor = 0.4;
}

function render(entity, renderLayer, isFirstPersonArm) {
}
