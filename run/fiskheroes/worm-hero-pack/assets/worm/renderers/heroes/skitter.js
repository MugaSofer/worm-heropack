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
