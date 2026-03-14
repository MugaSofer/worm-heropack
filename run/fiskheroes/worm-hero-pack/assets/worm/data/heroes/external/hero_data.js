// hero_data.js — Shared module for querying hero capabilities via reflection.
// Bypasses the Fisk API sandbox to access the hero registry directly.
//
// Usage:
//   var heroData = implement("worm:external/hero_data");
//   heroData.setup(entity);  // call once with any entity to initialize
//
//   // Check modifiers (from powers JSON)
//   heroData.hasModifier("fiskheroes:iron_man", "fiskheroes:water_breathing")  // true
//   heroData.hasModifier("worm:regent", "fiskheroes:telekinesis")              // true
//
//   // Get all modifiers for a hero
//   heroData.getModifiers("fiskheroes:iron_man")  // ["fiskheroes:flight", "fiskheroes:repulsor_blast", ...]
//
//   // Check what hero an entity is wearing (from helmet NBT)
//   heroData.getHeroType(entity)  // "worm:regent" or null
//
//   // Combined: does the entity I'm looking at have water breathing?
//   heroData.entityHasModifier(entity, "fiskheroes:water_breathing")
//
// EXPERIMENTAL — uses Java reflection to escape the Fisk API sandbox.
// Performance: init() is expensive (reflection setup), queries are fast (cached).

var _cl = null;
var _registry = null;
var _modCache = {};  // heroFullName -> [modifierName, ...]
var _initialized = false;

// --- Internal helpers ---

function _getMCEntity(jsEntity) {
    var cls = jsEntity.getClass();
    while (cls != null) {
        var fields = cls.getDeclaredFields();
        for (var i = 0; i < fields.length; i++) {
            if (fields[i].getName() == "entity") {
                fields[i].setAccessible(true);
                return fields[i].get(jsEntity);
            }
        }
        cls = cls.getSuperclass();
    }
    return null;
}

function _getField(obj, name) {
    var cls = obj.getClass();
    while (cls != null) {
        try {
            var f = cls.getDeclaredField(name);
            f.setAccessible(true);
            return f.get(obj);
        } catch(e) {}
        cls = cls.getSuperclass();
    }
    return null;
}

// --- Public API ---

// Initialize the registry. Call once with any JS entity.
function setup(entity) {
    if (_initialized) return;
    try {
        var mc = _getMCEntity(entity);
        _cl = mc.getClass().getClassLoader();
        var heroIterClass = _cl.loadClass("com.fiskmods.heroes.common.hero.HeroIteration");
        var regField = heroIterClass.getDeclaredField("REGISTRY");
        regField.setAccessible(true);
        _registry = regField.get(null);
        _initialized = true;
    } catch (e) {
        // Silently fail — queries will return null/false
    }
}

// Get the hero type string from an entity's helmet NBT.
// Returns e.g. "fiskheroes:iron_man" or null.
function getHeroType(jsEntity) {
    try {
        var helm = jsEntity.getEquipmentInSlot(4);
        if (helm != null && !helm.isEmpty()) {
            var heroType = helm.nbt().getString("HeroType");
            if (heroType != null && heroType != "") return heroType;
        }
    } catch (e) {}
    return null;
}

// Get all modifier names for a hero (cached).
// Returns array of strings, or null if hero not found.
function getModifiers(heroFullName) {
    if (!_initialized) return null;
    if (_modCache[heroFullName] !== undefined) return _modCache[heroFullName];

    var result = null;
    try {
        // Find hero in registry
        var keys = _registry.keySet().iterator();
        var heroIter = null;
        while (keys.hasNext()) {
            var key = keys.next();
            var entry = _registry.get(key);
            var fn = _getField(entry, "fullName");
            if (fn != null && ("" + fn) == heroFullName) {
                heroIter = entry;
                break;
            }
        }
        if (heroIter == null) {
            _modCache[heroFullName] = null;
            return null;
        }

        var heroJS = _getField(heroIter, "hero");
        if (heroJS == null) {
            _modCache[heroFullName] = null;
            return null;
        }

        result = [];
        var powers = heroJS.getPowers();
        var iter = powers.iterator();
        while (iter.hasNext()) {
            var power = iter.next();
            var modifiers = _getField(power, "modifiers");
            if (modifiers != null && modifiers.size() > 0) {
                var modKeys = modifiers.keySet().iterator();
                while (modKeys.hasNext()) {
                    result.push("" + modKeys.next());
                }
            }
        }
    } catch (e) {
        result = null;
    }

    _modCache[heroFullName] = result;
    return result;
}

// Check if a hero has a specific modifier defined.
// Supports partial matching: hasModifier("x", "flight") matches "fiskheroes:flight"
function hasModifier(heroFullName, modifierName) {
    var mods = getModifiers(heroFullName);
    if (mods == null) return false;
    for (var i = 0; i < mods.length; i++) {
        if (mods[i] == modifierName || mods[i].indexOf(modifierName) >= 0) return true;
    }
    return false;
}

// Check if the entity currently wearing a hero suit has a specific modifier.
function entityHasModifier(jsEntity, modifierName) {
    var heroType = getHeroType(jsEntity);
    if (heroType == null) return false;
    return hasModifier(heroType, modifierName);
}

// Get the underlying MC entity (for direct method calls via SRG names).
// Returns the raw EntityPlayerMP/EntityLivingBase, or null.
// CACHE THE RESULT — reflection is expensive.
function getRawEntity(jsEntity) {
    try {
        return _getMCEntity(jsEntity);
    } catch(e) {
        return null;
    }
}

// Construct a PotionEffect via reflection.
// Returns a PotionEffect object, or null on failure.
function createPotionEffect(jsEntity, potionId, duration, amplifier) {
    try {
        var mc = _getMCEntity(jsEntity);
        var methods = mc.getClass().getMethods();
        var addMethod = null;
        for (var i = 0; i < methods.length; i++) {
            if (methods[i].getName() == "func_70690_d") { addMethod = methods[i]; break; }
        }
        if (addMethod == null) return null;

        var peClass = addMethod.getParameterTypes()[0];
        var intType = null;
        for (var j = 0; j < methods.length; j++) {
            if (methods[j].getName() == "func_145782_y") { intType = methods[j].getReturnType(); break; }
        }
        if (intType == null) return null;

        var constructor = peClass.getConstructor(intType, intType, intType);
        return constructor.newInstance(potionId, duration, amplifier);
    } catch(e) {
        return null;
    }
}

// Apply a potion effect to an entity's raw MC entity.
function addPotionEffect(jsEntity, potionId, duration, amplifier) {
    try {
        var mc = _getMCEntity(jsEntity);
        var effect = createPotionEffect(jsEntity, potionId, duration, amplifier);
        if (effect == null) return false;
        mc["func_70690_d"](effect);
        return true;
    } catch(e) {
        return false;
    }
}
