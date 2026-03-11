extend("fiskheroes:hero_basic");
loadTextures({
    "layer1": "worm:legend_layer1",
    "layer2": "worm:legend_layer1",
    "helmet": "worm:legend_helmet",
    "chest": "worm:legend_chest",
    "leggings": "worm:legend_leggings",
    "boots": "worm:legend_boots"
});

var utils = implement("fiskheroes:external/utils");

var handChargeMirrored;
var handChargeSingle;
var energyFormGlow;

function init(renderer) {
    parent.init(renderer);
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
    utils.addFlightAnimationWithLanding(renderer, "legend.FLIGHT", "fiskheroes:flight/default.anim.json");
    utils.addHoverAnimation(renderer, "legend.HOVER", "fiskheroes:flight/idle/default");

    // Single-arm aim tracking — right arm follows where player is looking while firing
    // High priority to override energy_projection's built-in two-handed pose
    addAnimation(renderer, "legend.BEAM_AIM", "worm:beam_aim")
        .setData(function (entity, data) {
            data.load(entity.getInterpolatedData("fiskheroes:beam_shooting_timer"));
        }).setCondition(function (entity) {
            return entity.getInterpolatedData("fiskheroes:beam_shooting_timer") > 0;
        }).priority = 50;

    // Bombardment channeling — arms forward, palms together
    addAnimation(renderer, "legend.BOMBARDMENT_CHARGE", "worm:bombardment_charge")
        .setData(function (entity, data) {
            data.load(entity.getData("worm:dyn/bombardment_held") ? 1.0 : 0.0);
        }).setCondition(function (entity) {
            return entity.getData("worm:dyn/bombardment_held");
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
function bindMethodBeam(renderer, modifierName, model, size, methodIndex, impactDefault, impactHeat, impactIce, fpOverride) {
    var fp = fpOverride || [0.0, 6.0, 0.0];
    // Default particles (concussive, disintegration)
    utils.bindBeam(renderer, modifierName, model, "rightArm", 0x4488FF, [
        { "firstPerson": fp, "offset": [-0.6, 10.8, 0.0], "size": size }
    ]).setCondition(function (entity) {
        var e = entity.getData("worm:dyn/laser_effect");
        return entity.getData("worm:dyn/laser_method") == methodIndex && e != 1 && e != 2 && e != 3;
    }).setParticles(impactDefault);

    // Cutting — no particles
    utils.bindBeam(renderer, modifierName, model, "rightArm", 0x4488FF, [
        { "firstPerson": fp, "offset": [-0.6, 10.8, 0.0], "size": size }
    ]).setCondition(function (entity) {
        return entity.getData("worm:dyn/laser_method") == methodIndex && entity.getData("worm:dyn/laser_effect") == 1;
    });

    // Heat particles (sparks)
    utils.bindBeam(renderer, modifierName, model, "rightArm", 0x4488FF, [
        { "firstPerson": fp, "offset": [-0.6, 10.8, 0.0], "size": size }
    ]).setCondition(function (entity) {
        return entity.getData("worm:dyn/laser_method") == methodIndex && entity.getData("worm:dyn/laser_effect") == 2;
    }).setParticles(impactHeat);

    // Cold particles (cryo smoke)
    utils.bindBeam(renderer, modifierName, model, "rightArm", 0x4488FF, [
        { "firstPerson": fp, "offset": [-0.6, 10.8, 0.0], "size": size }
    ]).setCondition(function (entity) {
        return entity.getData("worm:dyn/laser_method") == methodIndex && entity.getData("worm:dyn/laser_effect") == 3;
    }).setParticles(impactIce);
}

function initEffects(renderer) {
    var impactDefault = renderer.createResource("PARTICLE_EMITTER", "worm:laser_impact");
    var impactHeat = renderer.createResource("PARTICLE_EMITTER", "worm:heat_impact");
    var impactIce = renderer.createResource("PARTICLE_EMITTER", "worm:ice_impact");

    // Method 0: Basic — standard focused beam
    bindMethodBeam(renderer, "fiskheroes:charged_beam", "fiskheroes:charged_beam", [2.0, 2.0], 0, impactDefault, impactHeat, impactIce);

    // Method 1: Fat AoE — wide beam
    bindMethodBeam(renderer, "fiskheroes:charged_beam", "fiskheroes:charged_beam", [6.0, 6.0], 1, impactDefault, impactHeat, impactIce);

    // Method 2: Staccato — continuous pulsing beam (energy_projection, hand stays on screen in 1st person)
    bindMethodBeam(renderer, "fiskheroes:energy_projection", "worm:legend_staccato", [1.5, 1.5], 2, impactDefault, impactHeat, impactIce, [-2.0, 5.0, -5.0]);

    // Method 3: Invisible — no visible beam, but still has impact particles
    bindMethodBeam(renderer, "fiskheroes:charged_beam", "worm:invisible", [2.0, 2.0], 3, impactDefault, impactHeat, impactIce);

    // Method 4: Swarm — zig-zagging lightning branches
    bindMethodBeam(renderer, "fiskheroes:charged_beam", "worm:laser_swarm", [30.0, 30.0], 4, impactDefault, impactHeat, impactIce);

    // Bombardment beam — medium beam, continuous during burst, flickers when mining
    utils.bindBeam(renderer, "fiskheroes:heat_vision", "fiskheroes:charged_beam", "rightArm", 0x4488FF, [
        { "firstPerson": [0.0, 6.0, 0.0], "offset": [-0.6, 10.8, 0.0], "size": [3.0, 3.0] }
    ]).setParticles(impactDefault);

    // Bombardment hand charge glow
    var blueFireIcon = renderer.createResource("ICON", "fiskheroes:blue_fire_layer_%s");

    handChargeMirrored = createHandCharge(renderer, blueFireIcon, "rightArm", true);
    handChargeSingle = createHandCharge(renderer, blueFireIcon, "rightArm", false);

    // Night vision — on except on the moon (causes black blocks)
    renderer.bindProperty("fiskheroes:night_vision").setCondition(function (entity) {
        return entity.world().getDimension() != 2595;
    });

    // Energy Form — blue glow while flight boosting
    energyFormGlow = renderer.createEffect("fiskheroes:glowerlay");
    energyFormGlow.color.set(0xAABBFF);

    // Camera shake on beam firing
    var shake = renderer.bindProperty("fiskheroes:camera_shake").setCondition(function (entity) {
        return entity.getInterpolatedData("fiskheroes:beam_shooting_timer") > 0;
    });
    shake.factor = 0.4;
}

function render(entity, renderLayer, isFirstPersonArm) {
    // Energy Form glow — fades in with flight boost
    var boostTimer = entity.getInterpolatedData("fiskheroes:flight_boost_timer");
    energyFormGlow.opacity = boostTimer * 0.9;
    energyFormGlow.render();

    if (renderLayer == "CHESTPLATE") {
        // Bombardment mode: mirrored glow while holding key 4
        var groundSmashTimer = entity.getInterpolatedData("worm:dyn/bombardment_held_timer");
        if (groundSmashTimer > 0) {
            // Dim if on cooldown, full if ready
            var cooldown = entity.getData("worm:dyn/bombardment_cooldown");
            var bombardmentGlow = groundSmashTimer * (cooldown > 0 ? (1 - cooldown / 60.0) : 1.0);
            if (bombardmentGlow > 0) {
                handChargeMirrored.render(bombardmentGlow);
            }
        }

        // Beam charge glow for slow-charging methods only (AoE, Swarm)
        var method = entity.getData("worm:dyn/laser_method");
        if (method == 1 || method == 4) {
            var beamCharge = entity.getInterpolatedData("fiskheroes:beam_charge");
            var isCharging = entity.getData("fiskheroes:beam_charging");
            if (isCharging && beamCharge > 0 && beamCharge < 1) {
                handChargeSingle.render(beamCharge);
            }
        }
    }
}
