extend("fiskheroes:hero_basic");

loadTextures({
    "layer1": "worm:parian_gorilla_layer1",
    "layer2": "worm:parian_gorilla_layer1"
});

function init(renderer) {
    parent.init(renderer);
    renderer.showModel("CHESTPLATE", "head", "headwear", "body", "rightArm", "leftArm", "rightLeg", "leftLeg");
    renderer.fixHatLayer("CHESTPLATE");
    renderer.setTexture(function (entity, renderLayer) {
        return "layer1";
    });
}

function initAnimations(renderer) {
    parent.initAnimations(renderer);

    // Suppress aiming animations — stuffed animals don't aim guns
    addAnimationWithData(renderer, "basic.AIMING", "fiskheroes:aiming", "fiskheroes:aiming_timer")
        .setCondition(function (entity) { return false; });
    addAnimationWithData(renderer, "basic.DUAL_AIMING", "fiskheroes:dual_aiming", "fiskheroes:aiming_timer")
        .setCondition(function (entity) { return false; });

    var leftPunch = addAnimationWithData(renderer, "parian.LEFT_PUNCH", "worm:sentry_left_punch", "worm:dyn/parian_punch_timer");
    leftPunch.setCondition(function (entity) {
        return entity.getData("worm:dyn/parian_punch") && Number(entity.getData("worm:dyn/parian_attack_type")) == 0;
    });
    leftPunch.priority = -10;

    var kick = addAnimationWithData(renderer, "parian.KICK", "worm:roundhouse_kick", "worm:dyn/parian_punch_timer");
    kick.setCondition(function (entity) {
        return entity.getData("worm:dyn/parian_punch") && Number(entity.getData("worm:dyn/parian_attack_type")) == 1;
    });
    kick.priority = -10;

    var hook = addAnimationWithData(renderer, "parian.HOOK", "worm:sentry_left_hook", "worm:dyn/parian_punch_timer");
    hook.setCondition(function (entity) {
        return entity.getData("worm:dyn/parian_punch") && Number(entity.getData("worm:dyn/parian_attack_type")) == 2;
    });
    hook.priority = -10;
}

function initEffects(renderer) {
    renderer.bindProperty("fiskheroes:opacity").setOpacity(function (entity, renderLayer) {
        return 0.9999;
    });
}

function render(entity, renderLayer, isFirstPersonArm) {
}
