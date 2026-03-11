extend("fiskheroes:hero_basic");

loadTextures({
    "layer1": "worm:parian_layer1_noarms",
    "layer2": "worm:parian_layer1_noarms",
    "mask": "worm:parian_helmet",
    "chest": "worm:parian_chest",
    "leggings": "worm:parian_leggings",
    "boots": "worm:parian_boots",
    "arm_tex": "worm:parian_layer1",
    "dress_tex": "worm:parian_dress"
});

var alexArmR;
var alexArmL;
var dress;
var dressBack;

function init(renderer) {
    parent.init(renderer);
    renderer.setTexture(function (entity, renderLayer) {
        if (entity.isWearingFullSuit()) return "layer1";
        if (renderLayer == "SKIN") return "layer1";
        if (renderLayer == "HELMET") return "mask";
        if (renderLayer == "LEGGINGS") return "leggings";
        if (renderLayer == "BOOTS") return "boots";
        return "chest";
    });
}

function initEffects(renderer) {
    renderer.bindProperty("fiskheroes:opacity").setOpacity(function (entity, renderLayer) {
        return 0.9999;
    });

    var armRModel = renderer.createResource("MODEL", "worm:alex_arm_r");
    armRModel.texture.set("arm_tex");
    alexArmR = renderer.createEffect("fiskheroes:model").setModel(armRModel);
    alexArmR.anchor.set("rightArm");
    alexArmR.setOffset(-6.0, -2.05, 0.0);

    var armLModel = renderer.createResource("MODEL", "worm:alex_arm_l");
    armLModel.texture.set("arm_tex");
    alexArmL = renderer.createEffect("fiskheroes:model").setModel(armLModel);
    alexArmL.anchor.set("leftArm");
    alexArmL.setOffset(5.0, -2.05, 0.0);

    var dressModel = renderer.createResource("MODEL", "worm:parian_skirt");
    dressModel.texture.set("dress_tex");
    dress = renderer.createEffect("fiskheroes:model").setModel(dressModel);
    dress.anchor.set("body");
    dress.mirror = false;

    var backModel = renderer.createResource("MODEL", "worm:parian_skirt_back");
    backModel.texture.set("dress_tex");
    dressBack = renderer.createEffect("fiskheroes:model").setModel(backModel);
    dressBack.anchor.set("body");
    dressBack.setOffset(0.0, 10.0, 0.0);
    dressBack.mirror = false;
}

function render(entity, renderLayer, isFirstPersonArm) {
    if (renderLayer == "CHESTPLATE" && entity.isWearingFullSuit()) {
        alexArmR.render();
        alexArmL.render();
    }
    if (renderLayer == "LEGGINGS") {
        dress.render();
        var mx = entity.motionX();
        var mz = entity.motionZ();
        var speed = Math.sqrt(mx * mx + mz * mz);
        var tilt = 6.0 + Math.min(speed * 150, 25);
        dressBack.setRotation(tilt, 0.0, 0.0);
        dressBack.render();
    }
}
