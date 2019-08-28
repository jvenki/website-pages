const BaseOptimizer = require("./BaseOptimizer");
const AccordionOptimizer = require("./AccordionOptimizer");

class OptimizerFactory {
    static forElementOfType(type) {
        switch (type) {
            case "accordion": return new AccordionOptimizer();
            default: return new BaseOptimizer();
        }
    }
}

module.exports = OptimizerFactory;