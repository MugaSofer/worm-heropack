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
