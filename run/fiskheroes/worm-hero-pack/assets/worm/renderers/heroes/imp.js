extend("fiskheroes:hero_basic");

loadTextures({
    "layer1": "worm:imp_layer1",
    "layer2": "worm:imp_layer1"
});

function init(renderer) {
    parent.init(renderer);
}

function initAnimations(renderer) {
    // Manually add only the animations we need, skipping HEAT_VISION
    var flightAnim = renderer.createResource("ANIMATION", "fiskheroes:flight_lean");
    renderer.addCustomAnimation("basic.PROP_FLIGHT", flightAnim);
    flightAnim.setData(function (entity, data) { data.load(entity.getData("fiskheroes:flight_animation")); });
    flightAnim.priority = -10;
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
