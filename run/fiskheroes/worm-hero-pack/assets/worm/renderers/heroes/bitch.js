extend("fiskheroes:hero_basic");

loadTextures({
    "layer1": "worm:bitch_invisible",
    "layer2": "worm:bitch_invisible",
    "skin": "worm:bitch_layer1",
    "helmet": "worm:bitch_helmet",
    "chest": "worm:bitch_chest",
    "leggings": "worm:bitch_leggings",
    "boots": "worm:bitch_boots",
    "dog_tex": "worm:monster_dog"
});

var utils = implement("fiskheroes:external/utils");

var dogBody, dogLegFL, dogLegFR, dogLegBL, dogLegBR;
var riderTorso, riderHead, riderArmR, riderArmL;

var S = 1.75;
var BASE_DOG_SCALE = 1.7 / S;
var RIDER_SCALE = 0.8;

// Model space Y values for offset math
var DOG_FEET_Y = 24.0;  // bottom of legs in model space (tuned)
var DOG_BACK_Y = 6.0;   // top of body in model space
// Rider offset at G=1 (calibrated by eye)
var BASE_RIDER_OFFSET = -7.0;
// How deep Rachel "sits" into the back
var SITTING_DEPTH = BASE_RIDER_OFFSET - DOG_BACK_Y * BASE_DOG_SCALE;

function init(renderer) {
    parent.init(renderer);
    renderer.setTexture(function (entity, renderLayer) {
        if (!entity.isWearingFullSuit()) {
            if (renderLayer == "SKIN") return "skin";
            if (renderLayer == "HELMET") return "helmet";
            if (renderLayer == "LEGGINGS") return "leggings";
            if (renderLayer == "BOOTS") return "boots";
            return "chest";
        }
        var dismount = entity.getInterpolatedData("worm:dyn/dog_dismounted_timer");
        if (dismount > 0.5) return "skin";
        if (renderLayer == "SKIN") return "layer1";
        return "layer2";
    });
}

function initAnimations(renderer) {
    // Hide real player arms (and held items)
    addAnimation(renderer, "bitch.REMOVE_ARM", "worm:remove_arm").setData(function (entity, data) {
        var dogCalled = entity.getData("worm:dyn/dog_mounted");
        var mounted = dogCalled ? 1.0 - entity.getInterpolatedData("worm:dyn/dog_dismounted_timer") : 0.0;
        data.load(0, mounted);
    });
}

function initEffects(renderer) {
    utils.bindParticles(renderer, "worm:dog_mount");

    renderer.bindProperty("fiskheroes:opacity").setOpacity(function (entity, renderLayer) {
        return 0.9999;
    });

    // --- Monster dog (split: body + 4 legs) ---
    var dogBodyModel = renderer.createResource("MODEL", "worm:monster_dog_body");
    dogBodyModel.texture.set("dog_tex");
    dogBody = renderer.createEffect("fiskheroes:model").setModel(dogBodyModel);
    dogBody.anchor.set("body");
    dogBody.anchor.ignoreAnchor(true);

    var legNames = ["legfrontleft", "legfrontright", "legbackleft", "legbackright"];
    var legEffects = {};
    for (var i = 0; i < legNames.length; i++) {
        var legModel = renderer.createResource("MODEL", "worm:monster_dog_" + legNames[i]);
        legModel.texture.set("dog_tex");
        var leg = renderer.createEffect("fiskheroes:model").setModel(legModel);
        leg.anchor.set("body");
        leg.anchor.ignoreAnchor(true);
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

    var headModel = renderer.createResource("MODEL", "worm:rachel_head");
    headModel.texture.set("skin");
    riderHead = renderer.createEffect("fiskheroes:model").setModel(headModel);
    riderHead.anchor.set("body");
    riderHead.anchor.ignoreAnchor(true);
    riderHead.setScale(RIDER_SCALE);

    var armRModel = renderer.createResource("MODEL", "worm:rachel_right_arm");
    armRModel.texture.set("skin");
    riderArmR = renderer.createEffect("fiskheroes:model").setModel(armRModel);
    riderArmR.anchor.set("body");
    riderArmR.anchor.ignoreAnchor(true);
    riderArmR.setScale(RIDER_SCALE);

    var armLModel = renderer.createResource("MODEL", "worm:rachel_left_arm");
    armLModel.texture.set("skin");
    riderArmL = renderer.createEffect("fiskheroes:model").setModel(armLModel);
    riderArmL.anchor.set("body");
    riderArmL.anchor.ignoreAnchor(true);
    riderArmL.setScale(RIDER_SCALE);

    // --- Companion dog (tentacle system) ---
    var companionModel = utils.createModel(renderer, "worm:monster_dog_companion", "dog_tex");
    companionModel.bindAnimation("worm:dog_walk").setData(function (entity, data) {
        var caster = entity.as("TENTACLE").getCaster();
        var dogSpeed = Math.min(entity.motion().length() * 8.0, 1.0);
        var casterSpeed = Math.min(caster.motion().length() * 8.0, 1.0);
        var speed = Math.max(dogSpeed, casterSpeed);
        var walkCycle = caster.loop(10) * Math.PI * 2;
        data.load(0, walkCycle);
        data.load(1, speed);
    });

    var tentacles = renderer.bindProperty("fiskheroes:tentacles").setTentacles([
        { "offset": [8.0, -4.5, -2.0], "direction": [10.0, 0.0, -12.0] }
    ]);
    tentacles.anchor.set("body");
    tentacles.setHeadModel(companionModel);
}

function render(entity, renderLayer, isFirstPersonArm) {
    if (renderLayer != "CHESTPLATE" || isFirstPersonArm || !entity.isWearingFullSuit()) return;

    var dismount = entity.getInterpolatedData("worm:dyn/dog_dismounted_timer");

    var dogCalled = entity.getData("worm:dyn/dog_mounted");
    if (dogCalled && dismount < 0.5) {
        // --- MOUNTED: dog + Rachel on back ---
        var G = entity.getInterpolatedData("worm:dyn/dog_size_timer");
        if (G <= 0) G = 1.0;

        var dogScale = BASE_DOG_SCALE * G;
        var dogOffsetY = -DOG_FEET_Y * BASE_DOG_SCALE * (G - 1);
        var riderOffsetY = dogOffsetY + DOG_BACK_Y * BASE_DOG_SCALE * G + SITTING_DEPTH;

        var crouch = entity.getInterpolatedData("worm:dyn/dog_crouch_timer");
        var crouchDrop = crouch * 4.0 * dogScale;
        dogOffsetY += crouchDrop;
        riderOffsetY += crouchDrop;

        var speed = Math.min(entity.motion().length() * 8.0, 1.0);
        var walkCycle = entity.loop(10) * Math.PI * 2;

        dogBody.setScale(dogScale);
        dogBody.setOffset(0.0, dogOffsetY, 0.0);
        dogBody.render();

        var frontSwing = Math.sin(walkCycle) * 25.0 * speed;
        var backSwing = Math.sin(walkCycle + Math.PI) * 25.0 * speed;
        var crouchSplay = crouch * 20.0;
        dogLegFL.setScale(dogScale);
        dogLegFL.setOffset(0.0, dogOffsetY - crouchDrop, 0.0);
        dogLegFL.setRotation(frontSwing - crouchSplay, 0.0, 0.0);
        dogLegFL.render();
        dogLegFR.setScale(dogScale);
        dogLegFR.setOffset(0.0, dogOffsetY - crouchDrop, 0.0);
        dogLegFR.setRotation(-frontSwing - crouchSplay, 0.0, 0.0);
        dogLegFR.render();
        dogLegBL.setScale(dogScale);
        dogLegBL.setOffset(0.0, dogOffsetY - crouchDrop, 0.0);
        dogLegBL.setRotation(backSwing - crouchSplay, 0.0, 0.0);
        dogLegBL.render();
        dogLegBR.setScale(dogScale);
        dogLegBR.setOffset(0.0, dogOffsetY - crouchDrop, 0.0);
        dogLegBR.setRotation(-backSwing - crouchSplay, 0.0, 0.0);
        dogLegBR.render();

        riderTorso.setScale(RIDER_SCALE);
        riderTorso.setOffset(0.0, riderOffsetY, 0.0);
        riderTorso.render();

        var headYaw = entity.rotYaw() - entity.rotBodyYawInterpolated();
        riderHead.setScale(RIDER_SCALE);
        riderHead.setOffset(0.0, riderOffsetY, 0.0);
        riderHead.setRotation(entity.rotPitch(), headYaw, 0.0);
        riderHead.render();

        var armSwing = Math.sin(walkCycle) * 30.0 * speed;
        riderArmR.setScale(RIDER_SCALE);
        riderArmR.setOffset(0.0, riderOffsetY, 0.0);
        riderArmR.setRotation(armSwing, 0.0, 0.0);
        riderArmR.render();
        riderArmL.setScale(RIDER_SCALE);
        riderArmL.setOffset(0.0, riderOffsetY, 0.0);
        riderArmL.setRotation(-armSwing, 0.0, 0.0);
        riderArmL.render();
    }
    // DISMOUNTED: real player model shows Rachel skin via setTexture()
}
