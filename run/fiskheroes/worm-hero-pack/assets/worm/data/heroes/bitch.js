var MIN_DOG_SIZE = 0.5;
var MAX_DOG_SIZE = 3.0;
var GROW_STEP = 0.25;
var ANIM_SPEED = 0.05;

function init(hero) {
    hero.setName("Bitch");
    hero.setTier(3);

    hero.setHelmet("Mask");
    hero.setChestplate("Coat");
    hero.setLeggings("Skirt");
    hero.setBoots("Boots");

    hero.setDefaultScale(1.75);

    hero.addAttribute("PUNCH_DAMAGE", 10.0, 0);
    hero.addAttribute("KNOCKBACK", 1.0, 0);
    hero.addAttribute("SPRINT_SPEED", 0.3, 1);
    hero.addAttribute("JUMP_HEIGHT", 3.0, 0);
    hero.addAttribute("FALL_RESISTANCE", 1.0, 1);
    hero.addAttribute("MAX_HEALTH", 20.0, 0);
    hero.addAttribute("STEP_HEIGHT", 0.5, 0);
    hero.addAttribute("SPRINT_JUMP_FACTOR", 1.5, 0);

    hero.addKeyBindFunc("GROW_DOG", function (entity, manager) {
        var size = entity.getData("worm:dyn/dog_size");
        if (size < MAX_DOG_SIZE) {
            manager.setData(entity, "worm:dyn/dog_size", Math.min(size + GROW_STEP, MAX_DOG_SIZE));
        }
        return true;
    }, "Grow Dog", 1);

    hero.addKeyBindFunc("SHRINK_DOG", function (entity, manager) {
        var size = entity.getData("worm:dyn/dog_size");
        if (size > MIN_DOG_SIZE) {
            manager.setData(entity, "worm:dyn/dog_size", Math.max(size - GROW_STEP, MIN_DOG_SIZE));
        }
        return true;
    }, "Shrink Dog", 2);

    hero.setTickHandler(function (entity, manager) {
        if (entity.getData("fiskheroes:scale") != 1.75) {
            manager.setData(entity, "fiskheroes:scale", 1.75);
        }

        // Initialize dog size on first equip
        var target = entity.getData("worm:dyn/dog_size");
        if (target == 0) {
            manager.setData(entity, "worm:dyn/dog_size", 1.0);
            manager.setData(entity, "worm:dyn/dog_size_timer", 1.0);
            return;
        }

        // Smoothly animate toward target size
        var current = entity.getData("worm:dyn/dog_size_timer");
        if (Math.abs(target - current) > ANIM_SPEED) {
            manager.setData(entity, "worm:dyn/dog_size_timer", current + (target > current ? ANIM_SPEED : -ANIM_SPEED));
        } else {
            manager.setData(entity, "worm:dyn/dog_size_timer", target);
        }
    });
}
