extend("fiskheroes:hero_basic");

loadTextures({
    "layer1": "worm:foil_layer1_noarms",
    "layer2": "worm:foil_layer1_noarms",
    "helmet": "worm:foil_helmet",
    "chest": "worm:foil_chest",
    "leggings": "worm:foil_leggings",
    "boots": "worm:foil_boots",
    "arm_tex": "worm:foil_layer1",
    "crossbow_tex": "worm:crossbow"
});

var utils = implement("fiskheroes:external/utils");
var alexArmR;
var alexArmL;
var crossbow;

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

    // Crossbow model
    var crossbowModel = renderer.createResource("MODEL", "worm:crossbow");
    crossbowModel.texture.set("crossbow_tex");
    crossbow = renderer.createEffect("fiskheroes:model").setModel(crossbowModel);
    crossbow.anchor.set("rightArm");
    crossbow.setScale(1.0);

    // Bolt beam visual for repulsor_blast
    utils.bindBeam(renderer, "fiskheroes:repulsor_blast", "worm:bolt", "rightArm", 0x000000, [
        { "firstPerson": [-5.5, 1.0, -15.0], "offset": [-0.5, 9.0, -4.0], "size": [1.0, 1.0] }
    ]);
}

function initAnimations(renderer) {
    parent.initAnimations(renderer);
    utils.addFlightAnimation(renderer, "foil.WALL_CRAWL", "worm:wall_crawl");

    // Replace default aiming with single-arm aim (crossbow)
    renderer.removeCustomAnimation("basic.AIMING");
    addAnimationWithData(renderer, "basic.AIMING", "fiskheroes:aiming_fpcorr", "fiskheroes:aiming_timer");
}

function render(entity, renderLayer, isFirstPersonArm) {
    if (renderLayer == "CHESTPLATE" && entity.isWearingFullSuit()) {
        alexArmR.render();
        alexArmL.render();
    }

    if (renderLayer == "CHESTPLATE") {
        var aiming = entity.getInterpolatedData("fiskheroes:aiming_timer");
        if (aiming > 0.4) {
            // Held in hand when aiming
            crossbow.anchor.set("rightArm");
            crossbow.setOffset(0.5, 12.0, -9.0);
            crossbow.setRotation(90, 0, 0);
            crossbow.render();
        } else {
            // Stowed on back
            crossbow.anchor.set("body");
            crossbow.setOffset(4.0, 6.0, 8.0);
            crossbow.setRotation(120, 0, 180);
            crossbow.render();
        }
    }
}
