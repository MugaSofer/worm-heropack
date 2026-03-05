extend("fiskheroes:hero_basic");
loadTextures({
    "layer1": "worm:imp_layer1",
    "layer2": "worm:imp_layer1"
});

function init(renderer) {
    parent.init(renderer);
}

function initEffects(renderer) {
    // Opacity: invisible by default, fades in when revealed or punching
    renderer.bindProperty("fiskheroes:opacity").setOpacity(function (entity, renderLayer) {
        var reveal = entity.getInterpolatedData("worm:dyn/imp_visible_timer");
        var punching = entity.isPunching() ? 1.0 : 0.0;
        return Math.max(reveal, punching) * 0.995 + 0.005;
    });
}
