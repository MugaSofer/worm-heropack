loadTextures({
    "base": "worm:rapier"
});

var utils = implement("fisktag:external/utils");

var model;

function init(renderer) {
    model = utils.createModel(renderer, "worm:rapier", "base");
    renderer.setModel(model);
}

function render(renderer, entity, glProxy, renderType, scopeTimer, recoil, isLeftSide) {
    glProxy.translate(-0.05, -0.1, -0.1);
    glProxy.scale(0.9);
}
