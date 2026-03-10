extend("fiskheroes:hero_basic");

loadTextures({
    "layer1": "worm:tattletale_layer1_noarms",
    "layer2": "worm:tattletale_layer1_noarms",
    "mask": "worm:tattletale_mask",
    "chest": "worm:tattletale_chest",
    "leggings": "worm:tattletale_leggings",
    "boots": "worm:tattletale_boots",
    "arm_tex": "worm:tattletale_layer1"
});

var alexArmR;
var alexArmL;

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
    // Opacity for slim arm transparency
    renderer.bindProperty("fiskheroes:opacity").setOpacity(function (entity, renderLayer) {
        return 0.9999;
    });

    // Slim right arm
    var armRModel = renderer.createResource("MODEL", "worm:alex_arm_r");
    armRModel.texture.set("arm_tex");
    alexArmR = renderer.createEffect("fiskheroes:model").setModel(armRModel);
    alexArmR.anchor.set("rightArm");
    alexArmR.setOffset(-6.0, -2.05, 0.0);

    // Slim left arm
    var armLModel = renderer.createResource("MODEL", "worm:alex_arm_l");
    armLModel.texture.set("arm_tex");
    alexArmL = renderer.createEffect("fiskheroes:model").setModel(armLModel);
    alexArmL.anchor.set("leftArm");
    alexArmL.setOffset(5.0, -2.05, 0.0);

    // Night vision — gated on Thinker Power
    renderer.bindProperty("fiskheroes:night_vision").setCondition(function (entity) {
        return entity.getInterpolatedData("worm:dyn/tt_active_timer") > 0.1;
    });
}

function initAnimations(renderer) {
    var flightAnim = renderer.createResource("ANIMATION", "fiskheroes:flight_lean");
    renderer.addCustomAnimation("basic.PROP_FLIGHT", flightAnim);
    flightAnim.setData(function (entity, data) { data.load(entity.getData("fiskheroes:flight_animation")); });
    flightAnim.priority = -10;
}

function render(entity, renderLayer, isFirstPersonArm) {
    // Slim alex arms only when full suit hides the real arms
    if (renderLayer == "CHESTPLATE" && entity.isWearingFullSuit()) {
        alexArmR.render();
        alexArmL.render();
    }
}
