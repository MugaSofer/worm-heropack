extend("fiskheroes:hero_basic");

loadTextures({
    "layer1": "worm:skitter_layer1_noarms",
    "layer2": "worm:skitter_layer1_noarms",
    "arm_tex": "worm:skitter_layer1"
});

var utils = implement("fiskheroes:external/utils");

var alexArmR;
var alexArmL;

function init(renderer) {
    parent.init(renderer);
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

    // Swarm Sense — wandering pulses using setCondition pattern
    var pulsePeriods = [31, 43, 53, 67];
    var posSeeds = [2.399, 3.761, 5.183, 7.529];
    var wanderRadius = 250;
    var pulseColors = [0x777777, 0x888888, 0x666666, 0x999999];

    for (var i = 0; i < 4; i++) {
        (function (idx) {
            var p = renderer.bindProperty("fiskheroes:forcefield");
            p.color.set(pulseColors[idx]);
            p.setShape(17, 7);
            p.setCondition(function (entity) {
                var senseTimer = entity.getInterpolatedData("worm:dyn/swarm_sense_timer");
                if (senseTimer > 0) {
                    var t = entity.loop(pulsePeriods[idx]);
                    var totalCycles = pulsePeriods[idx] * 11;
                    var cycle = Math.floor(entity.loop(totalCycles) * 11);
                    var seed = (cycle + idx) * posSeeds[idx];
                    var px = wanderRadius * Math.sin(seed);
                    var pz = wanderRadius * Math.cos(seed * 1.347);
                    p.setOffset(px, 6.0, pz);
                    p.opacity = senseTimer * 0.15 * (1 - t);
                    p.setScale(30 * t);
                } else {
                    p.opacity = 0;
                }
                return true;
            });
        })(i);
    }

    // Sonar ring
    var sonar = renderer.bindProperty("fiskheroes:forcefield");
    sonar.color.set(0xBBBBBB);
    sonar.setShape(17, 7);
    sonar.setCondition(function (entity) {
        var senseTimer = entity.getInterpolatedData("worm:dyn/swarm_sense_timer");
        if (senseTimer > 0) {
            var ring = entity.loop(60);
            var ringCycles = 60 * 7;
            var ringCycle = Math.floor(entity.loop(ringCycles) * 7);
            var rx = wanderRadius * 0.7 * Math.sin(ringCycle * 4.159);
            var rz = wanderRadius * 0.7 * Math.cos(ringCycle * 2.871);
            sonar.setOffset(rx, 6.0, rz);
            sonar.opacity = senseTimer * 0.15 * (1 - ring);
            sonar.setScale(30 * ring);
        } else {
            sonar.opacity = 0;
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
    if (renderLayer == "CHESTPLATE") {
        alexArmR.render();
        alexArmL.render();
    }
}
