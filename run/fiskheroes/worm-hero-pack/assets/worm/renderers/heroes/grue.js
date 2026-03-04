extend("fiskheroes:hero_basic");
loadTextures({
    "layer1": "worm:grue_layer1",
    "layer2": "worm:grue_layer2",
    "darkness_overlay": "worm:grue_darkness_overlay",
    "shadowdome": "worm:grue_shadowdome"
});

var utils = implement("fiskheroes:external/utils");

var darknessOverlay;

function init(renderer) {
    parent.init(renderer);
}

function initAnimations(renderer) {
    parent.initAnimations(renderer);

    // Roundhouse kick animation (shared with Alexandria)
    addAnimationWithData(renderer, "grue.KICK", "worm:roundhouse_kick", "worm:dyn/kick_timer")
        .setCondition(function (entity) {
            return entity.getData("worm:dyn/kick");
        });
}

function initEffects(renderer) {
    // Night vision - only activates when shadowdome is deployed, lets Grue see through his own darkness
    var nightVision = renderer.bindProperty("fiskheroes:night_vision");
    nightVision.setCondition(function (entity) {
        var domeId = entity.getData("fiskheroes:lightsout_id");
        var dome = domeId ? entity.world().getEntityById(domeId) : null;
        var active = dome != null && dome.exists();
        nightVision.factor = active ? (entity.world().isDaytime() ? 1.0 : 0.05) : 0.0;
        return true;
    });

    // Shadowdome - pure black dome texture
    var shadowdome = renderer.bindProperty("fiskheroes:shadowdome");
    shadowdome.texture.set("shadowdome", "shadowdome");

    // Darkness blast beam - black fire-style beam with dark impact particles
    utils.bindBeam(renderer, "fiskheroes:energy_projection", "worm:darkness_blast", "rightArm", 0x000000, [
        { "firstPerson": [-1, 3.0, -8.0], "offset": [-0.5, 12.0, 0.0], "size": [3.5, 3.5] }
    ]).setParticles(renderer.createResource("PARTICLE_EMITTER", "worm:darkness_impact"));

    // Darkness aura - pure black cloud around body when toggled on (visible in 1st person - disabled for now)
    // utils.bindCloud(renderer, "fiskheroes:particle_cloud", "worm:darkness")
    //     .setCondition(function (entity) {
    //         return entity.getData("worm:dyn/darkness_aura");
    //     });

    // Darkness aura - black body overlay (face stays clear)
    darknessOverlay = renderer.createEffect("fiskheroes:overlay");
    darknessOverlay.texture.set("darkness_overlay", null);

    // Darkness aura - black reddust particles on body parts, hidden in 1st person
    renderer.bindProperty("fiskheroes:particles")
        .setParticles(renderer.createResource("PARTICLE_EMITTER", "worm:darkness_aura"))
        .setCondition(function (entity) {
            return entity.getData("worm:dyn/darkness_aura");
        });
}

function render(entity, renderLayer, isFirstPersonArm) {
    // Darkness aura overlay — fades in/out with aura timer (hidden in 1st person so arm stays visible)
    if (!isFirstPersonArm) {
        darknessOverlay.opacity = entity.getInterpolatedData("worm:dyn/darkness_aura_timer");
        darknessOverlay.render();
    }
}
