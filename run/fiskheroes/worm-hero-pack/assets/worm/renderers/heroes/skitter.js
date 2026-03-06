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
var senseField2;
var senseField3;

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

    // Swarm Sense — FP vision overlay (3 layers, B&W, expanding circles)
    // Layer 1: static grey pulse
    senseField1 = renderer.bindProperty("fiskheroes:forcefield");
    senseField1.color.set(0x999999);
    senseField1.setShape(20, 10).setOffset(0.0, 6.0, 0.0);

    // Layer 2: mid-range grey pulse
    senseField2 = renderer.bindProperty("fiskheroes:forcefield");
    senseField2.color.set(0x777777);
    senseField2.setShape(17, 7).setOffset(0.0, 6.0, 0.0).setScale(16);

    // Layer 3: expanding sonar ring
    senseField3 = renderer.bindProperty("fiskheroes:forcefield");
    senseField3.color.set(0xBBBBBB);
    senseField3.setShape(17, 7).setOffset(0.0, 6.0, 0.0);

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

    if (isFirstPersonArm && senseTimer > 0) {
        var pulse = Math.sin(Math.PI * entity.loop(20));
        var ring = entity.loop(60);

        senseField1.opacity = senseTimer * (0.15 + 0.08 * pulse);
        senseField2.opacity = senseTimer * (0.2 - 0.1 * pulse);
        senseField3.opacity = senseTimer * 0.25 * (1 - ring);
        senseField3.setScale(30 * ring);
    } else {
        senseField1.opacity = 0;
        senseField2.opacity = 0;
        senseField3.opacity = 0;
    }

    if (renderLayer == "CHESTPLATE") {
        alexArmR.render();
        alexArmL.render();
    }
}
