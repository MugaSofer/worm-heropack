var team = implement("worm:external/undersiders");

var MIN_DOG_SIZE = 0.5;
var MAX_DOG_SIZE = 3.0;
var BASELINE_SIZE = 1.25;
var GROW_STEP = 0.25;
var ANIM_SPEED = 0.05;

var BARK_RANGE = 16.0;
var BARK_COOLDOWN_MIN = 100; // 5 seconds minimum between barks
var BARK_COOLDOWN_MAX = 200; // 10 seconds max

function init(hero) {
    hero.setName("Bitch");
    hero.setTier(3);

    hero.setHelmet("Mask");
    hero.setChestplate("Coat");
    hero.setLeggings("Skirt");
    hero.setBoots("Boots");

    hero.setDefaultScale(1.0);
    hero.addPowers("worm:bitch_powers");
    hero.addPowers("worm:undersiders");

    hero.addAttribute("PUNCH_DAMAGE", 10.0, 0);
    hero.addAttribute("KNOCKBACK", 1.0, 0);
    hero.addAttribute("SPRINT_SPEED", 0.3, 1);
    hero.addAttribute("JUMP_HEIGHT", 1.5, 0);
    hero.addAttribute("FALL_RESISTANCE", 1.0, 1);
    hero.addAttribute("MAX_HEALTH", 20.0, 0);
    hero.addAttribute("STEP_HEIGHT", 0.5, 0);

    // Generate size profiles at each 0.25 step
    // Speed, damage, knockback all scale linearly with dog size
    for (var s = MIN_DOG_SIZE; s <= MAX_DOG_SIZE + 0.01; s += GROW_STEP) {
        var size = Math.round(s * 100) / 100;
        var name = "SIZE_" + Math.round(size * 100);
        (function (sz) {
            hero.addAttributeProfile(name, function (profile) {
                profile.inheritDefaults();
                profile.addAttribute("BASE_SPEED", (Math.pow(sz, 1.5) - 1) * 0.5, 1);
                profile.addAttribute("SPRINT_SPEED", (Math.pow(sz, 1.5) - 1) * 0.5, 1);
                profile.addAttribute("PUNCH_DAMAGE", 10.0 * sz, 0);
                profile.addAttribute("KNOCKBACK", 1.0 * sz, 0);
                profile.addAttribute("STEP_HEIGHT", 0.5 * sz, 0);
                profile.addAttribute("JUMP_HEIGHT", 1.0 * sz, 0);
            });
        })(size);
    }

    hero.addAttributeProfile("CROUCHING", function (profile) {
        profile.inheritDefaults();
        profile.addAttribute("JUMP_HEIGHT", 10.0, 0);
        profile.addAttribute("BASE_SPEED", 2.0, 1);
        profile.addAttribute("SPRINT_SPEED", 2.0, 1);
    });

    hero.setAttributeProfile(getProfile);
    hero.setDamageProfile(getProfile);

    // TENTACLES keybind drives mount/dismount
    // Two labels on same slot: "Call Dog" before first use, "Mount / Dismount Dog" after
    // TENTACLES registered first; DOG_CALL_LABEL registered last for display priority
    hero.addKeyBind("TENTACLES", "Mount / Dismount Dog", 1);
    hero.addKeyBind("DOG_CALL_LABEL", "Call Dog", 1);

    hero.addKeyBindFunc("GROW_DOG", function (entity, manager) {
        var size = entity.getData("worm:dyn/dog_size");
        if (size < MAX_DOG_SIZE) {
            manager.setData(entity, "worm:dyn/dog_size", Math.min(size + GROW_STEP, MAX_DOG_SIZE));
        }
        return true;
    }, "Grow Dog", 2);

    hero.addKeyBindFunc("SHRINK_DOG", function (entity, manager) {
        var size = entity.getData("worm:dyn/dog_size");
        if (size > MIN_DOG_SIZE) {
            manager.setData(entity, "worm:dyn/dog_size", Math.max(size - GROW_STEP, MIN_DOG_SIZE));
        }
        return true;
    }, "Shrink Dog", 3);

    hero.addKeyBindFunc("CROUCH_LEAP", function (entity, manager) {
        manager.setData(entity, "worm:dyn/dog_crouch", !entity.getData("worm:dyn/dog_crouch"));
        return true;
    }, "Crouch Leap", 4);

    hero.setKeyBindEnabled(function (entity, keyBind) {
        var dogCalled = entity.getData("worm:dyn/dog_mounted");
        var mounted = dogCalled && entity.getData("fiskheroes:tentacle_extend_timer") == 0;
        var size = entity.getData("worm:dyn/dog_size");
        // DOG_CALL_LABEL shows before dog is called, then hides so TENTACLES label shows
        if (keyBind == "DOG_CALL_LABEL") return !dogCalled;
        if (keyBind == "GROW_DOG") return mounted && size < MAX_DOG_SIZE;
        if (keyBind == "SHRINK_DOG") return mounted && size > MIN_DOG_SIZE;
        if (keyBind == "CROUCH_LEAP") return mounted;
        return true;
    });
    hero.setHasPermission(function (entity, permission) {
        return team.hasPermission(entity, permission);
    });
    hero.addKeyBind("AIM", "Aim", -1);
    hero.supplyFunction("canAim", function (entity) {
        return entity.getData("worm:dyn/tt_nearby") && !entity.getHeldItem().isEmpty();
    });

    var heroRef = hero;
    hero.setTickHandler(function (entity, manager) {
        team.tick(entity, manager, heroRef);
        // Three states: no dog (initial) / companion following / mounted
        // Tentacles OUT = companion dog following (dismounted)
        // Tentacles IN + dog_called = mounted on big dog
        // Tentacles IN + !dog_called = no dog (costume stand default)
        var tentaclesOut = entity.getData("fiskheroes:tentacle_extend_timer") > 0;
        var dogCalled = entity.getData("worm:dyn/dog_mounted");

        // First time tentacles extend = dog has been called
        if (!dogCalled && tentaclesOut) {
            manager.setData(entity, "worm:dyn/dog_mounted", true);
            dogCalled = true;
        }

        var mounted = dogCalled && !tentaclesOut;
        var dismounted = !mounted;
        if (entity.getData("worm:dyn/dog_dismounted") != dismounted) {
            manager.setData(entity, "worm:dyn/dog_dismounted", dismounted);
        }

        var targetScale = dismounted ? 1.0 : 1.75;
        if (entity.getData("fiskheroes:scale") != targetScale) {
            manager.setData(entity, "fiskheroes:scale", targetScale);
        }

        // Animate dismount timer
        manager.incrementData(entity, "worm:dyn/dog_dismounted_timer", 3, dismounted);

        // Initialize dog size on first equip
        var target = entity.getData("worm:dyn/dog_size");
        if (target == 0) {
            manager.setData(entity, "worm:dyn/dog_size", BASELINE_SIZE);
            manager.setData(entity, "worm:dyn/dog_size_timer", BASELINE_SIZE);
            return;
        }

        // Smoothly animate toward target size
        var current = entity.getData("worm:dyn/dog_size_timer");
        if (Math.abs(target - current) > ANIM_SPEED) {
            manager.setData(entity, "worm:dyn/dog_size_timer", current + (target > current ? ANIM_SPEED : -ANIM_SPEED));
        } else {
            manager.setData(entity, "worm:dyn/dog_size_timer", target);
        }

        // Auto-clear crouch if moving or airborne
        if (entity.getData("worm:dyn/dog_crouch")) {
            var moving = entity.motion().length() > 0.05;
            if (!entity.isOnGround()) {
                var airTicks = entity.getData("worm:dyn/dog_crouch_air") + 1;
                manager.setData(entity, "worm:dyn/dog_crouch_air", airTicks);
                if (airTicks > 3) {
                    manager.setData(entity, "worm:dyn/dog_crouch", false);
                    manager.setData(entity, "worm:dyn/dog_crouch_air", 0);
                    manager.setData(entity, "worm:dyn/dog_crouch_charged", 0);
                }
            } else if (moving) {
                // Movement cancels crouch; only grant boost if fully charged
                manager.setData(entity, "worm:dyn/dog_crouch", false);
                if (entity.getData("worm:dyn/dog_crouch_timer") >= 0.9) {
                    manager.setData(entity, "worm:dyn/dog_crouch_charged", 20);
                }
            } else {
                manager.setData(entity, "worm:dyn/dog_crouch_air", 0);
            }
        }

        // Tick down charged window
        var charged = entity.getData("worm:dyn/dog_crouch_charged");
        if (charged > 0) {
            if (!entity.isOnGround()) {
                // Used the leap, clear immediately
                manager.setData(entity, "worm:dyn/dog_crouch_charged", 0);
            } else {
                manager.setData(entity, "worm:dyn/dog_crouch_charged", charged - 1);
            }
        }

        // Animate crouch timer
        manager.incrementData(entity, "worm:dyn/dog_crouch_timer", 60, entity.getData("worm:dyn/dog_crouch"));

        // Dog bark warning — bark when hostile mobs are nearby
        var barkCd = entity.getData("worm:dyn/dog_bark_cooldown");
        if (barkCd > 0) {
            manager.setData(entity, "worm:dyn/dog_bark_cooldown", barkCd - 1);
        } else if (entity.ticksExisted() % 20 == 0) {
            // Check for hostiles every second
            var hostileNearby = false;
            entity.world().getEntitiesInRangeOf(entity.pos(), BARK_RANGE).forEach(function (other) {
                if (!entity.equals(other) && other.isLivingEntity() && other.as("PLAYER") == null) {
                    hostileNearby = true;
                }
            });
            if (hostileNearby) {
                // Deeper bark when bigger: size 0.5 → pitch ~1.1, size 3.0 → pitch ~0.6
                var dogSize = entity.getData("worm:dyn/dog_size");
                if (dogSize <= 0) dogSize = BASELINE_SIZE;
                var basePitch = 1.3 - (dogSize / MAX_DOG_SIZE) * 0.7;
                entity.playSound("worm:suit.bitch.bark", 1.0, basePitch + Math.random() * 0.1);
                // Deterministic-ish cooldown based on ticks to avoid desync issues
                var cd = BARK_COOLDOWN_MIN + (entity.ticksExisted() % 5) * 20;
                manager.setData(entity, "worm:dyn/dog_bark_cooldown", cd);
            }
        }
    });
}

function getProfile(entity) {
    // No combat profile unless mounted (dogCalled + tentacles retracted)
    var mounted = entity.getData("worm:dyn/dog_mounted") && entity.getData("fiskheroes:tentacle_extend_timer") == 0;
    if (!mounted) return null;
    if (entity.getData("worm:dyn/dog_crouch") || entity.getData("worm:dyn/dog_crouch_charged") > 0) {
        return "CROUCHING";
    }
    var size = entity.getData("worm:dyn/dog_size");
    if (size <= 0) size = 1.0;
    var rounded = Math.round(size * 4) / 4; // snap to nearest 0.25
    rounded = Math.max(MIN_DOG_SIZE, Math.min(MAX_DOG_SIZE, rounded));
    var name = "SIZE_" + Math.round(rounded * 100);
    return rounded == 1.0 ? null : name;
}
