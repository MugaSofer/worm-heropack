extend("fiskheroes:hero_basic");
loadTextures({
    "layer1": "worm:legend_layer1",
    "layer2": "worm:legend_layer1"
});

var utils = implement("fiskheroes:external/utils");

var handCharge;

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

// Helper: create a hand charge glow effect (3 boosters around the hand)
function createHandCharge(renderer, icon, anchor, mirror) {
    var front = renderer.createEffect("fiskheroes:booster").setIcon(icon);
    front.setOffset(1.2, 10.0, 0.15).setRotation(-12.0, 5.0, 173.0).setSize(6.0, 2.0);
    front.anchor.set(anchor);

    var back = renderer.createEffect("fiskheroes:booster").setIcon(icon);
    back.setOffset(1.2, 10.0, -0.15).setRotation(12.0, -5.0, 173.0).setSize(6.0, 2.0);
    back.anchor.set(anchor);

    var bottom = renderer.createEffect("fiskheroes:booster").setIcon(icon);
    bottom.setOffset(-1.0, 8.4, 0.0).setRotation(0.0, 0.0, 83.0).setSize(4.0, 1.5);
    bottom.anchor.set(anchor);

    front.opacity = back.opacity = bottom.opacity = 0.5;
    front.flutter = back.flutter = bottom.flutter = 0.5;
    front.speedScale = back.speedScale = bottom.speedScale = 0;
    front.mirror = back.mirror = bottom.mirror = mirror;

    return {
        render: function (progress) {
            front.progress = back.progress = bottom.progress = progress;
            front.render();
            back.render();
            bottom.render();
        }
    };
}

// Helper: bind a beam with 4 particle variants (default, cutting, heat, cold)
function bindMethodBeam(renderer, model, size, methodIndex, impactDefault, impactHeat, impactIce) {
    // Default particles (concussive, disintegration)
    utils.bindBeam(renderer, "fiskheroes:charged_beam", model, "rightArm", 0x4488FF, [
        { "firstPerson": [0.0, 6.0, 0.0], "offset": [-0.6, 10.8, -2.5], "size": size }
    ]).setCondition(function (entity) {
        var e = entity.getData("worm:dyn/laser_effect");
        return entity.getData("worm:dyn/laser_method") == methodIndex && e != 1 && e != 2 && e != 3;
    }).setParticles(impactDefault);

    // Cutting — no particles
    utils.bindBeam(renderer, "fiskheroes:charged_beam", model, "rightArm", 0x4488FF, [
        { "firstPerson": [0.0, 6.0, 0.0], "offset": [-0.6, 10.8, -2.5], "size": size }
    ]).setCondition(function (entity) {
        return entity.getData("worm:dyn/laser_method") == methodIndex && entity.getData("worm:dyn/laser_effect") == 1;
    });

    // Heat particles (sparks)
    utils.bindBeam(renderer, "fiskheroes:charged_beam", model, "rightArm", 0x4488FF, [
        { "firstPerson": [0.0, 6.0, 0.0], "offset": [-0.6, 10.8, -2.5], "size": size }
    ]).setCondition(function (entity) {
        return entity.getData("worm:dyn/laser_method") == methodIndex && entity.getData("worm:dyn/laser_effect") == 2;
    }).setParticles(impactHeat);

    // Cold particles (cryo smoke)
    utils.bindBeam(renderer, "fiskheroes:charged_beam", model, "rightArm", 0x4488FF, [
        { "firstPerson": [0.0, 6.0, 0.0], "offset": [-0.6, 10.8, -2.5], "size": size }
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

    // Bombardment beam — wide beam from hands
    utils.bindBeam(renderer, "fiskheroes:energy_projection", "fiskheroes:charged_beam", "rightArm", 0x4488FF, [
        { "firstPerson": [0.0, 6.0, 0.0], "offset": [-0.6, 10.8, -2.5], "size": [6.0, 6.0] }
    ]).setParticles(impactDefault);

    // Bombardment hand charge glow
    var blueFireIcon = renderer.createResource("ICON", "fiskheroes:blue_fire_layer_%s");

    handCharge = createHandCharge(renderer, blueFireIcon, "rightArm", true);

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
    if (renderLayer == "CHESTPLATE") {
        var chargeTimer = entity.getInterpolatedData("worm:dyn/ground_smash_timer");
        if (chargeTimer > 0) {
            handCharge.render(chargeTimer);
        }
    }
}
