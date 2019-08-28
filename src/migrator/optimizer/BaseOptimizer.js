class BaseOptimizer {
    optimize(element, walker) {
        // Do Nothing
    }

    shouldTransformToSections(element) {
        return false;
    }

    transformToSections(element, walker) {
        return element;
    }
}

module.exports = BaseOptimizer;