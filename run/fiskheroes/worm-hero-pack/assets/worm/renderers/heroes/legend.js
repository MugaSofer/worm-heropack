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

    // Bombardment channeling — arms forward, palms together
    addAnimation(renderer, "legend.BOMBARDMENT_CHARGE", "worm:bombardment_charge")
        .setData(function (entity, data) {
            data.load(entity.getData("worm:dyn/ground_smash") ? 1.0 : 0.0);
        }).setCondition(function (entity) {
            return entity.getData("worm:dyn/ground_smash");
        }).priority = 100;
}

// Helper: bind a beam with 4 particle variants (default, cutting, heat, cold)
function bindMethodBeam(renderer, model, size, methodIndex, impactDefault, impactHeat, impactIce) {
    // Default particles (concussive, disintegration)
    utils.bindBeam(renderer, "fiskheroes:charged_beam", model, "head", 0x4488FF, [
        { "firstPerson": [0.0, 6.0, 0.0], "offset": [0.0, -3.0, -4.0], "size": size }
    ]).setCondition(function (entity) {
        var e = entity.getData("worm:dyn/laser_effect");
        return entity.getData("worm:dyn/laser_method") == methodIndex && e != 1 && e != 2 && e != 3;
    }).setParticles(impactDefault);

    // Cutting — no particles
    utils.bindBeam(renderer, "fiskheroes:charged_beam", model, "head", 0x4488FF, [
        { "firstPerson": [0.0, 6.0, 0.0], "offset": [0.0, -3.0, -4.0], "size": size }
    ]).setCondition(function (entity) {
        return entity.getData("worm:dyn/laser_method") == methodIndex && entity.getData("worm:dyn/laser_effect") == 1;
    });

    // Heat particles (sparks)
    utils.bindBeam(renderer, "fiskheroes:charged_beam", model, "head", 0x4488FF, [
        { "firstPerson": [0.0, 6.0, 0.0], "offset": [0.0, -3.0, -4.0], "size": size }
    ]).setCondition(function (entity) {
        return entity.getData("worm:dyn/laser_method") == methodIndex && entity.getData("worm:dyn/laser_effect") == 2;
    }).setParticles(impactHeat);

    // Cold particles (cryo smoke)
    utils.bindBeam(renderer, "fiskheroes:charged_beam", model, "head", 0x4488FF, [
        { "firstPerson": [0.0, 6.0, 0.0], "offset": [0.0, -3.0, -4.0], "size": size }
    ]).setCondition(function (entity) {
        return entity.getData("worm:dyn/laser_method") == methodIndex && entity.getData("worm:dyn/laser_effect") == 3;
    }).setParticles(impactIce);
}

function initEffects(renderer) {
    var impactDefault = renderer.createResource("PARTICLE_EMITTER", "worm:laser_impact");
    var impactHeat = renderer.createResource("PARTICLE_EMITTER", "worm:heat_impact");
    var impactIce = renderer.createResource("PARTICLE_EMITTER", "worm:ice_impact");

    // Method 0: Basic — standard focused beam
    bindMethodBeam(renderer, "fiskheroes:charged_beam", [2.0, 2.0], 0, impactDefault, impactHeat, impactIce);

    // Method 1: Fat AoE — wide beam
    bindMethodBeam(renderer, "fiskheroes:charged_beam", [6.0, 6.0], 1, impactDefault, impactHeat, impactIce);

    // Method 2: Staccato — slightly thinner beam
    bindMethodBeam(renderer, "fiskheroes:charged_beam", [1.5, 1.5], 2, impactDefault, impactHeat, impactIce);

    // Method 3: Invisible — no visible beam, but still has impact particles
    bindMethodBeam(renderer, "worm:invisible", [2.0, 2.0], 3, impactDefault, impactHeat, impactIce);

    // Method 4: Swarm — zig-zagging lightning branches
    bindMethodBeam(renderer, "worm:laser_swarm", [30.0, 30.0], 4, impactDefault, impactHeat, impactIce);

    // Bombardment beam — thick blue laser, fires on right-click with ground slam
    utils.bindBeam(renderer, "fiskheroes:energy_projection", "worm:legend_bombardment", "body", 0x4488FF, [
        { "firstPerson": [0.0, 0.0, 2.0], "offset": [0.0, -3.3, -4.0], "size": [8.0, 8.0] }
    ]).setParticles(impactDefault);

    // Night vision — always on
    var nightVision = renderer.bindProperty("fiskheroes:night_vision");
    nightVision.firstPersonOnly = true;

    // Camera shake on beam firing
    var shake = renderer.bindProperty("fiskheroes:camera_shake").setCondition(function (entity) {
        return entity.getInterpolatedData("fiskheroes:beam_shooting_timer") > 0;
    });
    shake.factor = 0.4;
}

function render(entity, renderLayer, isFirstPersonArm) {
}
