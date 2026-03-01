extend("fiskheroes:hero_basic");
loadTextures({
    "layer1": "worm:eidolon_layer1",
    "layer2": "worm:eidolon_layer1"
});

var utils = implement("fiskheroes:external/utils");

var glow;

function init(renderer) {
    parent.init(renderer);
}

function initAnimations(renderer) {
    parent.initAnimations(renderer);
    utils.addFlightAnimationWithLanding(renderer, "eidolon.FLIGHT", "fiskheroes:flight/default.anim.json");
    utils.addHoverAnimation(renderer, "eidolon.HOVER", "fiskheroes:flight/idle/default");
}

function initEffects(renderer) {
    // Heat vision — dual eye beams, green-tinted for Eidolon
    utils.bindBeam(renderer, "fiskheroes:heat_vision", "fiskheroes:heat_vision", "head", 0x44FF66, [
        { "firstPerson": [2.2, 0.0, 2.0], "offset": [2.2, -3.3, -4.0], "size": [1.0, 0.5] },
        { "firstPerson": [-2.2, 0.0, 2.0], "offset": [-2.2, -3.3, -4.0], "size": [1.0, 0.5] }
    ]).setParticles(renderer.createResource("PARTICLE_EMITTER", "fiskheroes:impact_heat_vision"));

    // Gravity manipulation — AoE visual effect (default color)
    renderer.bindProperty("fiskheroes:gravity_manipulation");

    // Telekinesis — cloud visual around grabbed targets (green)
    utils.bindCloud(renderer, "fiskheroes:telekinesis", "worm:eidolon_telekinesis");

    // Energy Form — green particle cloud when in shadowform
    utils.bindCloud(renderer, "fiskheroes:particle_cloud", "worm:eidolon_energy").setCondition(function (entity) {
        return entity.getData("worm:dyn/slot3") == 1;
    });

    // Energy Form — green body glow
    glow = renderer.createEffect("fiskheroes:glowerlay");
    glow.color.set(0x44FF66);
}

function render(entity, renderLayer, isFirstPersonArm) {
    var s3 = entity.getData("worm:dyn/slot3");
    glow.opacity = s3 == 1 ? 0.3 : 0.0;
    glow.render();
}
