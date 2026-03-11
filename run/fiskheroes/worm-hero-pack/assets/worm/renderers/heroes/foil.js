extend("fiskheroes:hero_basic");

loadTextures({
    "layer1": "worm:foil_layer1_noarms",
    "layer2": "worm:foil_layer1_noarms",
    "helmet": "worm:foil_helmet",
    "chest": "worm:foil_chest",
    "leggings": "worm:foil_leggings",
    "boots": "worm:foil_boots",
    "arm_tex": "worm:foil_layer1"
});

var utils = implement("fiskheroes:external/utils");
var alexArmR;
var alexArmL;

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

function initAnimations(renderer) {
    parent.initAnimations(renderer);
    utils.addFlightAnimation(renderer, "foil.WALL_CRAWL", "worm:wall_crawl");
}

function render(entity, renderLayer, isFirstPersonArm) {
    if (renderLayer == "CHESTPLATE" && entity.isWearingFullSuit()) {
        alexArmR.render();
        alexArmL.render();
    }
}
