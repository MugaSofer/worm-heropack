extend("fiskheroes:hero_basic");
loadTextures({
    "layer1": "worm:legend_layer1",
    "layer2": "worm:legend_layer1"
});

var utils = implement("fiskheroes:external/utils");

function init(renderer) {
    parent.init(renderer);
}

function initAnimations(renderer) {
    parent.initAnimations(renderer);
    utils.addFlightAnimationWithLanding(renderer, "legend.FLIGHT", "fiskheroes:flight/default.anim.json");
    utils.addHoverAnimation(renderer, "legend.HOVER", "fiskheroes:flight/idle/default");
}

function initEffects(renderer) {
    // Single beam binding for all laser modes — renders for whichever charged_beam variant is active
    // Color is white/gold; per-mode colors can be added later once we confirm piped bindBeam works
    utils.bindBeam(renderer, "fiskheroes:charged_beam", "fiskheroes:charged_beam", "head", 0xFFFFAA, [
        { "firstPerson": [0.0, 6.0, 0.0], "offset": [0.0, -3.0, -4.0], "size": [2.5, 2.5] }
    ]);

    // Camera shake on beam firing
    var shake = renderer.bindProperty("fiskheroes:camera_shake").setCondition(function (entity) {
        return entity.getInterpolatedData("fiskheroes:beam_shooting_timer") > 0;
    });
    shake.factor = 0.4;
}

function render(entity, renderLayer, isFirstPersonArm) {
}
