extend("fiskheroes:hero_basic");

loadTextures({
    "layer1": "worm:imp_costume_noscarf_noarms",
    "layer2": "worm:imp_layer2",
    "body_noarms": "worm:imp_body_noarms",
    "costume_noarms": "worm:imp_costume_noarms",
    "costume_nomask_noarms": "worm:imp_costume_nomask_noarms",
    "mask": "worm:imp_mask",
    "chest": "worm:imp_chest",
    "leggings": "worm:imp_leggings",
    "boots": "worm:imp_boots",
    "arm_tex": "worm:imp_costume"
});

var costumeOverlay;
var alexArmR;
var alexArmL;

function init(renderer) {
    parent.init(renderer);
    renderer.showModel("HELMET", "head", "headwear", "body");
    renderer.setTexture(function (entity, renderLayer) {
        if (entity.isWearingFullSuit()) return "body_noarms";
        if (renderLayer == "SKIN") return "layer1";
        if (renderLayer == "HELMET") return "mask";
        if (renderLayer == "LEGGINGS") return "leggings";
        if (renderLayer == "BOOTS") return "boots";
        return "chest";
    });
}

function initAnimations(renderer) {
    var flightAnim = renderer.createResource("ANIMATION", "fiskheroes:flight_lean");
    renderer.addCustomAnimation("basic.PROP_FLIGHT", flightAnim);
    flightAnim.setData(function (entity, data) { data.load(entity.getData("fiskheroes:flight_animation")); });
    flightAnim.priority = -10;

    addAnimation(renderer, "imp.MASK", "fiskheroes:remove_cowl")
        .setData(function (entity, data) {
            var f = entity.getInterpolatedData("fiskheroes:mask_open_timer2");
            data.load(f < 1 ? f : 0);
        });
}

function initEffects(renderer) {
    // Costume overlay — renders costume texture on top of body base (full suit)
    costumeOverlay = renderer.createEffect("fiskheroes:overlay");
    costumeOverlay.texture.set("costume_noarms", null);

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

    // Opacity: invisible when full suit, slim-arm transparency when partial
    // Visible on costume stands; fades in on equip then goes invisible
    renderer.bindProperty("fiskheroes:opacity").setOpacity(function (entity, renderLayer) {
        if (!entity.isWearingFullSuit()) return 0.9999;
        // Costume stands — always visible
        if (entity.is("DISPLAY")) return 0.9999;
        // Fade-in on equip (0→1 over ~2s), then normal invisibility
        var fadeIn = entity.getInterpolatedData("worm:dyn/imp_fade_in");
        var reveal = entity.getInterpolatedData("fiskheroes:heat_vision_timer");
        var punching = entity.isPunching() ? 1.0 : 0.0;
        var detected = entity.getInterpolatedData("worm:dyn/imp_visible_timer");
        var visible = Math.max(reveal, punching, detected, 1.0 - fadeIn);
        return Math.min(visible * 0.995 + 0.005, 0.9999);
    });

    // Suppress default heat vision beam by binding an invisible beam renderer
    var prop = renderer.bindProperty("fiskheroes:heat_vision").setAnchor("head");
    var beam = renderer.createResource("BEAM_RENDERER", "worm:invisible");
    var constln = renderer.createResource("BEAM_CONSTELLATION", null);
    constln.bindBeam({ "offset": [0, 0, 0], "size": [0, 0] });
    prop.setConstellation(constln);
    prop.setRenderer(beam);
}

function render(entity, renderLayer, isFirstPersonArm) {
    var fullSuit = entity.isWearingFullSuit();
    if (fullSuit) {
        var maskOff = entity.is("DISPLAY") && entity.as("DISPLAY").isStatic()
            ? entity.getData("fiskheroes:mask_open")
            : entity.getData("fiskheroes:mask_open_timer2") > 0.35;
        costumeOverlay.texture.set(maskOff ? "costume_nomask_noarms" : "costume_noarms", null);
        costumeOverlay.render();
    }

    // Slim alex arms only when full suit hides the real arms
    if (renderLayer == "CHESTPLATE" && fullSuit) {
        var fadeIn = entity.getInterpolatedData("worm:dyn/imp_fade_in");
        var reveal = entity.getInterpolatedData("fiskheroes:heat_vision_timer");
        var punching = entity.isPunching() ? 1.0 : 0.0;
        var detected = entity.getInterpolatedData("worm:dyn/imp_visible_timer");
        var armOpacity = Math.max(reveal, punching, detected, 1.0 - fadeIn) * 0.995 + 0.005;
        alexArmR.opacity = armOpacity;
        alexArmL.opacity = armOpacity;
        alexArmR.render();
        alexArmL.render();
    }
}
