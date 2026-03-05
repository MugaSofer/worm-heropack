extend("fiskheroes:hero_basic");

loadTextures({
    "layer1": "worm:regent_layer1",
    "layer2": "worm:regent_layer1"
});

function init(renderer) {
    parent.init(renderer);
}

function initAnimations(renderer) {
    // Only add flight animation, skip heat_vision animation (used as invisible nerve attack)
    var flightAnim = renderer.createResource("ANIMATION", "fiskheroes:flight_lean");
    renderer.addCustomAnimation("basic.PROP_FLIGHT", flightAnim);
    flightAnim.setData(function (entity, data) { data.load(entity.getData("fiskheroes:flight_animation")); });
    flightAnim.priority = -10;
}

function initEffects(renderer) {
    // Suppress default heat vision beam visuals
    var prop = renderer.bindProperty("fiskheroes:heat_vision").setAnchor("head");
    var beam = renderer.createResource("BEAM_RENDERER", "worm:invisible");
    var constln = renderer.createResource("BEAM_CONSTELLATION", null);
    constln.bindBeam({ "offset": [0, 0, 0], "size": [0, 0] });
    prop.setConstellation(constln);
    prop.setRenderer(beam);
}
