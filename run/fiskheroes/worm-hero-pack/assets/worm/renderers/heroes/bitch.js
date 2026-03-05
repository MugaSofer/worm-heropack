extend("fiskheroes:hero_basic");

loadTextures({
    "layer1": "worm:bitch_invisible",
    "layer2": "worm:bitch_invisible",
    "skin": "worm:bitch_layer1",
    "dog_tex": "worm:monster_dog"
});

var dogBody, dogLegFL, dogLegFR, dogLegBL, dogLegBR;
var riderTorso, riderHead, riderArmR, riderArmL;

// Compensate for getDefaultScale(1.8) so models stay the same visual size
var S = 1.75;
var DOG_SCALE = 1.7 / S;
var RIDER_SCALE = 1.0 / S;

function init(renderer) {
    parent.init(renderer);
}

function initAnimations(renderer) {
    // Hide real player arms (and held items)
    addAnimation(renderer, "bitch.REMOVE_ARM", "worm:remove_arm").setData(function (entity, data) {
        data.load(0, 1);
    });
}

function initEffects(renderer) {
    renderer.bindProperty("fiskheroes:opacity").setOpacity(function (entity, renderLayer) {
        return 0.9999;
    });

    // --- Monster dog (split: body + 4 legs) ---
    var dogBodyModel = renderer.createResource("MODEL", "worm:monster_dog_body");
    dogBodyModel.texture.set("dog_tex");
    dogBody = renderer.createEffect("fiskheroes:model").setModel(dogBodyModel);
    dogBody.anchor.set("body");
    dogBody.anchor.ignoreAnchor(true);
    dogBody.setScale(DOG_SCALE);
    dogBody.setOffset(0.0, 0.0, 0.0);

    var legNames = ["legfrontleft", "legfrontright", "legbackleft", "legbackright"];
    var legEffects = {};
    for (var i = 0; i < legNames.length; i++) {
        var legModel = renderer.createResource("MODEL", "worm:monster_dog_" + legNames[i]);
        legModel.texture.set("dog_tex");
        var leg = renderer.createEffect("fiskheroes:model").setModel(legModel);
        leg.anchor.set("body");
        leg.anchor.ignoreAnchor(true);
        leg.setScale(DOG_SCALE);
        leg.setOffset(0.0, 0.0, 0.0);
        legEffects[legNames[i]] = leg;
    }
    dogLegFL = legEffects["legfrontleft"];
    dogLegFR = legEffects["legfrontright"];
    dogLegBL = legEffects["legbackleft"];
    dogLegBR = legEffects["legbackright"];

    // --- Rachel rider (split: torso, head, arms) ---
    var torsoModel = renderer.createResource("MODEL", "worm:rachel_torso");
    torsoModel.texture.set("skin");
    riderTorso = renderer.createEffect("fiskheroes:model").setModel(torsoModel);
    riderTorso.anchor.set("body");
    riderTorso.anchor.ignoreAnchor(true);
    riderTorso.setScale(RIDER_SCALE);
    riderTorso.setOffset(0.0, -4.0, 0.0);

    var headModel = renderer.createResource("MODEL", "worm:rachel_head");
    headModel.texture.set("skin");
    riderHead = renderer.createEffect("fiskheroes:model").setModel(headModel);
    riderHead.anchor.set("body");
    riderHead.anchor.ignoreAnchor(true);
    riderHead.setScale(RIDER_SCALE);
    riderHead.setOffset(0.0, -4.0, 0.0);

    var armRModel = renderer.createResource("MODEL", "worm:rachel_right_arm");
    armRModel.texture.set("skin");
    riderArmR = renderer.createEffect("fiskheroes:model").setModel(armRModel);
    riderArmR.anchor.set("body");
    riderArmR.anchor.ignoreAnchor(true);
    riderArmR.setScale(RIDER_SCALE);
    riderArmR.setOffset(0.0, -4.0, 0.0);

    var armLModel = renderer.createResource("MODEL", "worm:rachel_left_arm");
    armLModel.texture.set("skin");
    riderArmL = renderer.createEffect("fiskheroes:model").setModel(armLModel);
    riderArmL.anchor.set("body");
    riderArmL.anchor.ignoreAnchor(true);
    riderArmL.setScale(RIDER_SCALE);
    riderArmL.setOffset(0.0, -4.0, 0.0);
}

function render(entity, renderLayer, isFirstPersonArm) {
    if (renderLayer == "CHESTPLATE" && !isFirstPersonArm) {
        var speed = Math.min(entity.motion().length() * 8.0, 1.0);
        var walkCycle = entity.loop(10) * Math.PI * 2;

        // Dog body (static)
        dogBody.render();

        // Dog legs (walk cycle: front/back pairs alternate)
        var frontSwing = Math.sin(walkCycle) * 25.0 * speed;
        var backSwing = Math.sin(walkCycle + Math.PI) * 25.0 * speed;
        dogLegFL.setRotation(frontSwing, 0.0, 0.0);
        dogLegFL.render();
        dogLegFR.setRotation(-frontSwing, 0.0, 0.0);
        dogLegFR.render();
        dogLegBL.setRotation(backSwing, 0.0, 0.0);
        dogLegBL.render();
        dogLegBR.setRotation(-backSwing, 0.0, 0.0);
        dogLegBR.render();

        // Rachel torso (static)
        riderTorso.render();

        // Rachel head (tracks look direction: pitch + yaw relative to body)
        var headYaw = entity.rotYaw() - entity.rotBodyYawInterpolated();
        riderHead.setRotation(entity.rotPitch(), headYaw, 0.0);
        riderHead.render();

        // Rachel arms (swing with movement)
        var armSwing = Math.sin(walkCycle) * 30.0 * speed;
        riderArmR.setRotation(armSwing, 0.0, 0.0);
        riderArmR.render();
        riderArmL.setRotation(-armSwing, 0.0, 0.0);
        riderArmL.render();
    }
}
