const manifest = require("../pri-content-usage-counts.json");
const newManifest = {}
Object.keys(manifest).forEach(function(key) {
    let found = false;
    if ((key.match(/ -> /g) || []).length > 4) {
        Object.keys(newManifest).some(function(newKey) {
            if (key.startsWith(newKey)) {
                newManifest[newKey] = Math.max(manifest[key], newManifest[newKey]);
                found = true;
                return true;
            }
            return false;
        });
    }
    if (!found) {
        newManifest[key] = manifest[key];
    }
});
console.log(newManifest);