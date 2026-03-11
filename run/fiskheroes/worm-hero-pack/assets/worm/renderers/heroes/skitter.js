extend("fiskheroes:hero_basic");

loadTextures({
    "layer1": "worm:skitter_layer1_noarms",
    "layer2": "worm:skitter_layer1_noarms",
    "helmet": "worm:skitter_helmet",
    "chest": "worm:skitter_chest",
    "leggings": "worm:skitter_leggings",
    "boots": "worm:skitter_boots",
    "arm_tex": "worm:skitter_layer1"
});

var utils = implement("fiskheroes:external/utils");

var alexArmR;
var alexArmL;
var sensePulses = [];
var sonarRing;
var pulsePeriods = [31, 43, 53, 67];
var wanderRadius = 250;

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

function initEffects(renderer) {
    renderer.bindProperty("fiskheroes:opacity").setOpacity(function (entity, renderLayer) {
        return 0.9999;
    });

    utils.bindParticles(renderer, "worm:skitter_swarm");

    utils.bindBeam(renderer, "fiskheroes:charged_beam", "worm:invisible", "body", 0x000000, [
        { "firstPerson": [0.0, 0.0, 0.0], "offset": [0.0, 0.0, 0.0], "size": [0.1, 0.1] }
    ]);

    var swarmImpact = renderer.createResource("PARTICLE_EMITTER", "worm:swarm_impact");
    utils.bindBeam(renderer, "fiskheroes:heat_vision", "worm:invisible", "head", 0x000000, [
        { "firstPerson": [0.0, 0.0, 0.0], "offset": [0.0, 0.0, 0.0], "size": [0.1, 0.1] }
    ]).setParticles(swarmImpact);

    renderer.bindProperty("fiskheroes:night_vision").setCondition(function (entity) {
        return entity.getInterpolatedData("worm:dyn/swarm_sense_timer") > 0.1;
    });

    // Swarm Sense — wandering pulses (opacity controlled in render() for 1P-only)
    var posSeeds = [2.399, 3.761, 5.183, 7.529];
    var pulseColors = [0x777777, 0x888888, 0x666666, 0x999999];

    for (var i = 0; i < 4; i++) {
        (function (idx) {
            var p = renderer.bindProperty("fiskheroes:forcefield");
            sensePulses.push(p);
            p.color.set(pulseColors[idx]);
            p.setShape(17, 7);
            p.setCondition(function (entity) {
                var senseTimer = entity.getInterpolatedData("worm:dyn/swarm_sense_timer");
                if (senseTimer > 0) {
                    var t = entity.loop(pulsePeriods[idx]);
                    var totalCycles = pulsePeriods[idx] * 11;
                    var cycle = Math.floor(entity.loop(totalCycles) * 11);
                    var seed = (cycle + idx) * posSeeds[idx];
                    p.setOffset(wanderRadius * Math.sin(seed), 6.0, wanderRadius * Math.cos(seed * 1.347));
                    p.setScale(30 * t);
                }
                return true;
            });
        })(i);
    }

    // Sonar ring (opacity controlled in render() for 1P-only)
    sonarRing = renderer.bindProperty("fiskheroes:forcefield");
    sonarRing.color.set(0xBBBBBB);
    sonarRing.setShape(17, 7);
    sonarRing.setCondition(function (entity) {
        var senseTimer = entity.getInterpolatedData("worm:dyn/swarm_sense_timer");
        if (senseTimer > 0) {
            var ring = entity.loop(60);
            var ringCycles = 60 * 7;
            var ringCycle = Math.floor(entity.loop(ringCycles) * 7);
            sonarRing.setOffset(wanderRadius * 0.7 * Math.sin(ringCycle * 4.159), 6.0, wanderRadius * 0.7 * Math.cos(ringCycle * 2.871));
            sonarRing.setScale(30 * ring);
        }
        return true;
    });

    // Slim right arm model
    var armRModel = renderer.createResource("MODEL", "worm:alex_arm_r");
    armRModel.texture.set("arm_tex");
    alexArmR = renderer.createEffect("fiskheroes:model").setModel(armRModel);
    alexArmR.anchor.set("rightArm");
    alexArmR.setOffset(-6.0, -2.05, 0.0);

    // Slim left arm model
    var armLModel = renderer.createResource("MODEL", "worm:alex_arm_l");
    armLModel.texture.set("arm_tex");
    alexArmL = renderer.createEffect("fiskheroes:model").setModel(armLModel);
    alexArmL.anchor.set("leftArm");
    alexArmL.setOffset(5.0, -2.05, 0.0);
}

function render(entity, renderLayer, isFirstPersonArm) {
    if (renderLayer == "CHESTPLATE" && entity.isWearingFullSuit()) {
        alexArmR.render();
        alexArmL.render();
    }
    // Swarm sense forcefields: 1st person only
    if (isFirstPersonArm) {
        var senseTimer = entity.getInterpolatedData("worm:dyn/swarm_sense_timer");
        for (var i = 0; i < sensePulses.length; i++) {
            var t = entity.loop(pulsePeriods[i]);
            sensePulses[i].opacity = senseTimer > 0 ? senseTimer * 0.15 * (1 - t) : 0;
        }
        var ring = entity.loop(60);
        sonarRing.opacity = senseTimer > 0 ? senseTimer * 0.15 * (1 - ring) : 0;
    } else {
        for (var i = 0; i < sensePulses.length; i++) {
            sensePulses[i].opacity = 0;
        }
        sonarRing.opacity = 0;
    }
}
