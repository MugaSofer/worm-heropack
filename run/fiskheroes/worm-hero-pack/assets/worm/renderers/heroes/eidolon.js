extend("fiskheroes:hero_basic");
loadTextures({
    "layer1": "worm:eidolon_layer1",
    "layer2": "worm:eidolon_layer1"
});

var utils = implement("fiskheroes:external/utils");

function init(renderer) {
    parent.init(renderer);
}

function initAnimations(renderer) {
    parent.initAnimations(renderer);
    utils.addFlightAnimationWithLanding(renderer, "eidolon.FLIGHT", "fiskheroes:flight/default.anim.json");
    utils.addHoverAnimation(renderer, "eidolon.HOVER", "fiskheroes:flight/idle/default");
}

function initEffects(renderer) {
    // Heat vision beam — red/orange from eyes
    utils.bindBeam(renderer, "fiskheroes:energy_projection", "fiskheroes:energy_projection", "head", 0xFF4422, [
        { "firstPerson": [0.0, 6.0, 0.0], "offset": [0.0, -3.0, -4.0], "size": [1.5, 1.5] }
    ]);
}

function render(entity, renderLayer, isFirstPersonArm) {
}
