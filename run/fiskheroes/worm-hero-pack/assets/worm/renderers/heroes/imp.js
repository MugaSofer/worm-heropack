extend("fiskheroes:hero_basic");

loadTextures({
    "costume": "worm:imp_costume",
    "costume_nomask": "worm:imp_costume_nomask",
    "body": "worm:imp_body"
});

function init(renderer) {
    parent.init(renderer);
    renderer.setTexture(function (entity, renderLayer) {
        var fullSuit = entity.isWearingFullSuit();
        var maskOff = entity.is("DISPLAY") && entity.as("DISPLAY").isStatic()
            ? entity.getData("fiskheroes:mask_open")
            : entity.getData("fiskheroes:mask_open_timer2") > 0.35;

        if (renderLayer == "LEGGINGS") {
            // Layer2 slot: body underneath (only when full suit)
            return fullSuit ? "body" : "costume";
        }
        if (renderLayer == "HELMET" && maskOff) {
            return fullSuit ? "costume_nomask" : "costume";
        }
        return fullSuit && maskOff ? "costume_nomask" : "costume";
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
    // Opacity: invisible by default, fades in when holding reveal or punching
    renderer.bindProperty("fiskheroes:opacity").setOpacity(function (entity, renderLayer) {
        var reveal = entity.getInterpolatedData("fiskheroes:heat_vision_timer");
        var punching = entity.isPunching() ? 1.0 : 0.0;
        return Math.max(reveal, punching) * 0.995 + 0.005;
    });

    // Suppress default heat vision beam by binding an invisible beam renderer
    var prop = renderer.bindProperty("fiskheroes:heat_vision").setAnchor("head");
    var beam = renderer.createResource("BEAM_RENDERER", "worm:invisible");
    var constln = renderer.createResource("BEAM_CONSTELLATION", null);
    constln.bindBeam({ "offset": [0, 0, 0], "size": [0, 0] });
    prop.setConstellation(constln);
    prop.setRenderer(beam);
}
