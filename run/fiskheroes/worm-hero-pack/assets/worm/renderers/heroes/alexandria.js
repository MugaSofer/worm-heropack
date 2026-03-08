extend("fiskheroes:hero_basic");
loadTextures({
    "layer1": "worm:alexandria_layer1",
    "layer2": "worm:alexandria_layer2",
    "cape": "worm:alexandria_cape"
});

var utils = implement("fiskheroes:external/utils");
var capes = implement("fiskheroes:external/capes");

var cape;

function init(renderer) {
    parent.init(renderer);
}

function initAnimations(renderer) {
    parent.initAnimations(renderer);
    utils.addFlightAnimationWithLanding(renderer, "alexandria.FLIGHT", "fiskheroes:flight/default.anim.json");
    utils.addHoverAnimation(renderer, "alexandria.HOVER", "fiskheroes:flight/idle/default");
    addAnimationWithData(renderer, "alexandria.LAND", "fiskheroes:superhero_landing", "worm:dyn/superhero_landing_timer").priority = -8;

    addAnimation(renderer, "alexandria.THUNDERCLAP_CHARGE", "worm:thunder_clap_charge").setData(function (entity, data) {
        data.load(entity.getInterpolatedData("fiskheroes:beam_charge"));
    }).setCondition(function (entity) {
        return entity.getInterpolatedData("fiskheroes:beam_charge") > 0 && !entity.getData("fiskheroes:beam_shooting");
    }).priority = 100;

    addAnimation(renderer, "alexandria.THUNDERCLAP", "worm:thunder_clap").setData(function (entity, data) {
        data.load(entity.getInterpolatedData("fiskheroes:beam_shooting_timer"));
    }).setCondition(function (entity) {
        return entity.getData("fiskheroes:beam_shooting");
    }).priority = 101;

    // Roundhouse kick animation
    addAnimationWithData(renderer, "alexandria.KICK", "worm:roundhouse_kick", "worm:dyn/kick_timer")
        .setCondition(function (entity) {
            return entity.getData("worm:dyn/kick");
        });


}

function initEffects(renderer) {
    var physics = renderer.createResource("CAPE_PHYSICS", null);
    physics.weight = 1.5;
    physics.maxFlare = 0.5;
    physics.flareDegree = 1.5;
    physics.flareFactor = 1.0;
    physics.flareElasticity = 5;

    cape = capes.createDefault(renderer, 26, "fiskheroes:cape_default.mesh.json", physics);
    cape.effect.texture.set("cape");

    // Thunder clap beam effect
    utils.bindBeam(renderer, "fiskheroes:charged_beam", "worm:thunder_clap", "head", 0xF0F0F0, [
        { "firstPerson": [0.0, 6.0, 0.0], "offset": [0.0, -3.0, -4.0], "size": [2.0, 2.0] }
    ]);


    var shake = renderer.bindProperty("fiskheroes:camera_shake").setCondition(function (entity) {
        return entity.getInterpolatedData("fiskheroes:beam_shooting_timer") > 0;
    });
    shake.factor = 0.8;

    // Landing camera shake
    var landShake = renderer.bindProperty("fiskheroes:camera_shake").setCondition(function (entity) {
        return entity.getInterpolatedData("worm:dyn/superhero_landing_timer") > 0 && entity.getInterpolatedData("worm:dyn/superhero_landing_timer") < 0.3;
    });
    landShake.factor = 0.5;
}

function render(entity, renderLayer, isFirstPersonArm) {
    if (!isFirstPersonArm && renderLayer == "CHESTPLATE") {
        cape.render(entity);
    }
}
