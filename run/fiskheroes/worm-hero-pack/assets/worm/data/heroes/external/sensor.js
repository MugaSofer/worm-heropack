// Shared sensor framework for entity-detecting powers
// Used by: Skitter (swarm sense), Eidolon (danger sense, enhanced senses)
//
// Usage:
//   var sensor = implement("worm:external/sensor");
//   sensor.detect(entity, { range: 16, maxResults: 5, prefix: "[Danger Sense]" });

// Core scan: find nearby living entities, compute direction & distance
// config: { range, maxResults, filter(entity, other), score(entry), format(entry), prefix }
function scan(entity, config) {
    var nearby = entity.world().getEntitiesInRangeOf(entity.pos(), config.range);
    var look = entity.getLookVector();
    var results = [];
    for (var i = 0; i < nearby.length; i++) {
        var other = nearby[i];
        if (other.getUUID() == entity.getUUID()) continue;
        if (!other.isLivingEntity()) continue;
        if (config.filter && !config.filter(entity, other)) continue;

        var toOther = other.pos().subtract(entity.pos());
        var dist = other.pos().distanceTo(entity.pos());
        var dot = look.x() * toOther.x() + look.z() * toOther.z();
        var cross = look.x() * toOther.z() - look.z() * toOther.x();
        var dir;
        if (Math.abs(dot) > Math.abs(cross)) {
            dir = dot > 0 ? "ahead" : "behind";
        } else {
            dir = cross > 0 ? "left" : "right";
        }

        var entry = { name: other.getName(), dist: dist, dir: dir, entity: other };
        entry.score = config.score ? config.score(entry) : dist / Math.max(other.getMaxHealth(), 1);
        results.push(entry);
    }
    results.sort(function (a, b) { return a.score - b.score; });
    var max = config.maxResults || 5;
    if (results.length > max) results = results.slice(0, max);
    return results;
}

// Format and send scan results to player chat
// config: { prefix, format(entry) }
function report(entity, results, config) {
    if (results.length == 0) return;
    if (PackLoader.getSide() != "SERVER") return;
    var parts = [];
    for (var i = 0; i < results.length; i++) {
        var r = results[i];
        if (config.format) {
            parts.push(config.format(r));
        } else {
            parts.push("\u00A76" + r.name + " \u00A77" + Math.round(r.dist) + "m " + r.dir);
        }
    }
    entity.as("PLAYER").addChatMessage(config.prefix + parts.join("\u00A78, "));
}

// Convenience: scan + report in one call
function detect(entity, config) {
    var results = scan(entity, config);
    report(entity, results, config);
    return results;
}
