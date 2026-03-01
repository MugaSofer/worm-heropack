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
    var impactCharged = renderer.createResource("PARTICLE_EMITTER", "fiskheroes:impact_charged_beam");
    var impactIce = renderer.createResource("PARTICLE_EMITTER", "worm:ice_impact");

    // Method 0: Basic — standard focused beam
    utils.bindBeam(renderer, "fiskheroes:charged_beam", "fiskheroes:charged_beam", "head", 0x4488FF, [
        { "firstPerson": [0.0, 6.0, 0.0], "offset": [0.0, -3.0, -4.0], "size": [2.0, 2.0] }
    ]).setCondition(function (entity) {
        return entity.getData("worm:dyn/laser_method") == 0 && entity.getData("worm:dyn/laser_effect") != 3;
    }).setParticles(impactCharged);

    // Method 0 + Cold effect — same beam, ice particles
    utils.bindBeam(renderer, "fiskheroes:charged_beam", "fiskheroes:charged_beam", "head", 0x4488FF, [
        { "firstPerson": [0.0, 6.0, 0.0], "offset": [0.0, -3.0, -4.0], "size": [2.0, 2.0] }
    ]).setCondition(function (entity) {
        return entity.getData("worm:dyn/laser_method") == 0 && entity.getData("worm:dyn/laser_effect") == 3;
    }).setParticles(impactIce);

    // Method 1: Fat AoE — wide beam
    utils.bindBeam(renderer, "fiskheroes:charged_beam", "fiskheroes:charged_beam", "head", 0x4488FF, [
        { "firstPerson": [0.0, 6.0, 0.0], "offset": [0.0, -3.0, -4.0], "size": [6.0, 6.0] }
    ]).setCondition(function (entity) {
        return entity.getData("worm:dyn/laser_method") == 1 && entity.getData("worm:dyn/laser_effect") != 3;
    }).setParticles(impactCharged);

    // Method 1 + Cold
    utils.bindBeam(renderer, "fiskheroes:charged_beam", "fiskheroes:charged_beam", "head", 0x4488FF, [
        { "firstPerson": [0.0, 6.0, 0.0], "offset": [0.0, -3.0, -4.0], "size": [6.0, 6.0] }
    ]).setCondition(function (entity) {
        return entity.getData("worm:dyn/laser_method") == 1 && entity.getData("worm:dyn/laser_effect") == 3;
    }).setParticles(impactIce);

    // Method 2: Staccato — standard beam (rapid fire is in the stats)
    utils.bindBeam(renderer, "fiskheroes:charged_beam", "fiskheroes:charged_beam", "head", 0x4488FF, [
        { "firstPerson": [0.0, 6.0, 0.0], "offset": [0.0, -3.0, -4.0], "size": [1.5, 1.5] }
    ]).setCondition(function (entity) {
        return entity.getData("worm:dyn/laser_method") == 2 && entity.getData("worm:dyn/laser_effect") != 3;
    }).setParticles(impactCharged);

    // Method 2 + Cold
    utils.bindBeam(renderer, "fiskheroes:charged_beam", "fiskheroes:charged_beam", "head", 0x4488FF, [
        { "firstPerson": [0.0, 6.0, 0.0], "offset": [0.0, -3.0, -4.0], "size": [1.5, 1.5] }
    ]).setCondition(function (entity) {
        return entity.getData("worm:dyn/laser_method") == 2 && entity.getData("worm:dyn/laser_effect") == 3;
    }).setParticles(impactIce);

    // Method 3: Invisible — no visible beam, no particles
    utils.bindBeam(renderer, "fiskheroes:charged_beam", "worm:invisible", "head", 0x4488FF, [
        { "firstPerson": [0.0, 6.0, 0.0], "offset": [0.0, -3.0, -4.0], "size": [2.0, 2.0] }
    ]).setCondition(function (entity) {
        return entity.getData("worm:dyn/laser_method") == 3;
    });

    // Method 4: Swarm — zig-zagging lightning branches
    utils.bindBeam(renderer, "fiskheroes:charged_beam", "worm:laser_swarm", "head", 0x4488FF, [
        { "firstPerson": [0.0, 6.0, 0.0], "offset": [0.0, -3.0, -4.0], "size": [30.0, 30.0] }
    ]).setCondition(function (entity) {
        return entity.getData("worm:dyn/laser_method") == 4 && entity.getData("worm:dyn/laser_effect") != 3;
    }).setParticles(impactCharged);

    // Method 4 + Cold
    utils.bindBeam(renderer, "fiskheroes:charged_beam", "worm:laser_swarm", "head", 0x4488FF, [
        { "firstPerson": [0.0, 6.0, 0.0], "offset": [0.0, -3.0, -4.0], "size": [30.0, 30.0] }
    ]).setCondition(function (entity) {
        return entity.getData("worm:dyn/laser_method") == 4 && entity.getData("worm:dyn/laser_effect") == 3;
    }).setParticles(impactIce);

    // Camera shake on beam firing
    var shake = renderer.bindProperty("fiskheroes:camera_shake").setCondition(function (entity) {
        return entity.getInterpolatedData("fiskheroes:beam_shooting_timer") > 0;
    });
    shake.factor = 0.4;
}

function render(entity, renderLayer, isFirstPersonArm) {
}
