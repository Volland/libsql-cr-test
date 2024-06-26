"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runOnce = runOnce;
function runOnce(task) {
    let promise = null;
    return function runOnceImpl(...args) {
        if (promise) {
            return promise;
        }
        promise = task(...args)
            .then((result) => {
            promise = null;
            return result;
        })
            .catch((error) => {
            promise = null;
            throw error;
        });
        return promise;
    };
}
