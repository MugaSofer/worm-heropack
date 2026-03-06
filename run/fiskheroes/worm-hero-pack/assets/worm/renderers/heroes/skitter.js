extend("fiskheroes:hero_basic");

loadTextures({
    "layer1": "worm:skitter_layer1_noarms",
    "layer2": "worm:skitter_layer1_noarms",
    "arm_tex": "worm:skitter_layer1"
});

var utils = implement("fiskheroes:external/utils");

var alexArmR;
var alexArmL;
var senseField1;
var swarmPulses = [];
var sonarRing;

function init(renderer) {
    parent.init(renderer);
}

function initEffects(renderer) {
    // Opacity < 1 enables transparency rendering so blank arm regions become invisible
    renderer.bindProperty("fiskheroes:opacity").setOpacity(function (entity, renderLayer) {
        return 0.9999;
    });

    // Swarm particles
    utils.bindParticles(renderer, "worm:skitter_swarm");

    // Swarm summon beam — invisible (no visible beam while charging/firing)
    utils.bindBeam(renderer, "fiskheroes:charged_beam", "worm:invisible", "body", 0x000000, [
        { "firstPerson": [0.0, 0.0, 0.0], "offset": [0.0, 0.0, 0.0], "size": [0.1, 0.1] }
    ]);

    // Targeted swarm beam — invisible beam with bug particles at impact
    var swarmImpact = renderer.createResource("PARTICLE_EMITTER", "worm:swarm_impact");
    utils.bindBeam(renderer, "fiskheroes:heat_vision", "worm:invisible", "head", 0x000000, [
        { "firstPerson": [0.0, 0.0, 0.0], "offset": [0.0, 0.0, 0.0], "size": [0.1, 0.1] }
    ]).setParticles(swarmImpact);

    // Swarm Sense — night vision
    renderer.bindProperty("fiskheroes:night_vision").setCondition(function (entity) {
        return entity.getInterpolatedData("worm:dyn/swarm_sense_timer") > 0.1;
    });

    // Swarm Sense — FP close-up overlay
    senseField1 = renderer.bindProperty("fiskheroes:forcefield");
    senseField1.color.set(0x999999);
    senseField1.setShape(20, 10).setOffset(0.0, 6.0, 0.0);

    // Swarm Sense — wandering pulses from swarm (4 instances at different positions)
    var pulseColors = [0x777777, 0x888888, 0x666666, 0x999999];
    for (var i = 0; i < 4; i++) {
        var p = renderer.bindProperty("fiskheroes:forcefield");
        p.color.set(pulseColors[i]);
        p.setShape(17, 7).setScale(10 + i * 3);
        swarmPulses.push(p);
    }

    // Swarm Sense — expanding sonar ring (also wanders)
    sonarRing = renderer.bindProperty("fiskheroes:forcefield");
    sonarRing.color.set(0xBBBBBB);
    sonarRing.setShape(17, 7);

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
    var senseTimer = entity.getInterpolatedData("worm:dyn/swarm_sense_timer");

    // Pulse cycle lengths (primes) and position seeds (irrational-ish multipliers)
    var pulsePeriods = [31, 43, 53, 67];
    var posSeeds = [2.399, 3.761, 5.183, 7.529];
    var wanderRadius = 250;

    if (senseTimer > 0) {
        var pulse = Math.sin(Math.PI * entity.loop(20));

        // Close-up overlay — FP only
        senseField1.opacity = isFirstPersonArm ? senseTimer * (0.15 + 0.08 * pulse) : 0;

        // Swarm pulses — expand from random points, like the sonar ring
        for (var i = 0; i < swarmPulses.length; i++) {
            var t = entity.loop(pulsePeriods[i]);
            var totalCycles = pulsePeriods[i] * 11;
            var cycle = Math.floor(entity.loop(totalCycles) * 11);
            var seed = (cycle + i) * posSeeds[i];
            var px = wanderRadius * Math.sin(seed);
            var pz = wanderRadius * Math.cos(seed * 1.347);
            swarmPulses[i].setOffset(px, 6.0, pz);
            swarmPulses[i].opacity = senseTimer * 0.25 * (1 - t);
            swarmPulses[i].setScale(30 * t);
        }

        // Sonar ring — snaps to new origin each cycle, expands from there
        var ring = entity.loop(60);
        var ringCycles = 60 * 7;
        var ringCycle = Math.floor(entity.loop(ringCycles) * 7);
        var rx = wanderRadius * 0.7 * Math.sin(ringCycle * 4.159);
        var rz = wanderRadius * 0.7 * Math.cos(ringCycle * 2.871);
        sonarRing.setOffset(rx, 6.0, rz);
        sonarRing.opacity = senseTimer * 0.25 * (1 - ring);
        sonarRing.setScale(30 * ring);
    } else {
        senseField1.opacity = 0;
        for (var i = 0; i < swarmPulses.length; i++) {
            swarmPulses[i].opacity = 0;
        }
        sonarRing.opacity = 0;
    }

    if (renderLayer == "CHESTPLATE") {
        alexArmR.render();
        alexArmL.render();
    }
}
