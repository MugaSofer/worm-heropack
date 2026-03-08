extend("fiskheroes:hero_basic");

loadTextures({
    "layer1": "worm:imp_costume_noscarf",
    "layer2": "worm:imp_costume_noscarf",
    "costume": "worm:imp_costume",
    "costume_nomask": "worm:imp_costume_nomask",
    "costume_notop": "worm:imp_costume_notop",
    "costume_noscarf": "worm:imp_costume_noscarf",
    "body": "worm:imp_body"
});

var costumeOverlay;

function init(renderer) {
    parent.init(renderer);
    renderer.setTexture(function (entity, renderLayer) {
        var fullSuit = entity.isWearingFullSuit();
        if (fullSuit) return "body";
        // Partial suit: helmet shows mask+scarf, others show costume without scarf
        if (renderLayer == "HELMET") return "costume_notop";
        return "costume_noscarf";
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
    // Costume overlay — renders costume texture on top of body base
    costumeOverlay = renderer.createEffect("fiskheroes:overlay");
    costumeOverlay.texture.set("costume", null);

    // Opacity: invisible when full suit, normal when partial
    // Three visibility sources: reveal keybind, punching, electronic detection
    renderer.bindProperty("fiskheroes:opacity").setOpacity(function (entity, renderLayer) {
        if (!entity.isWearingFullSuit()) return 1.0;
        var reveal = entity.getInterpolatedData("fiskheroes:heat_vision_timer");
        var punching = entity.isPunching() ? 1.0 : 0.0;
        var detected = entity.getInterpolatedData("worm:dyn/imp_visible_timer");
        return Math.max(reveal, punching, detected) * 0.995 + 0.005;
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
        costumeOverlay.texture.set(maskOff ? "costume_nomask" : "costume", null);
        costumeOverlay.render();
    }
}
