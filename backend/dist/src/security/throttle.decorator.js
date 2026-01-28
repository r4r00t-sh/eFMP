"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LenientThrottle = exports.ModerateThrottle = exports.StrictThrottle = exports.CustomThrottle = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const CustomThrottle = (options) => {
    const decorators = [];
    if (options.short) {
        decorators.push((0, throttler_1.Throttle)({ default: { limit: options.short.limit, ttl: options.short.ttl } }));
    }
    return (0, common_1.applyDecorators)(...decorators);
};
exports.CustomThrottle = CustomThrottle;
const StrictThrottle = () => (0, throttler_1.Throttle)({
    default: { limit: 5, ttl: 60000 },
});
exports.StrictThrottle = StrictThrottle;
const ModerateThrottle = () => (0, throttler_1.Throttle)({
    default: { limit: 50, ttl: 60000 },
});
exports.ModerateThrottle = ModerateThrottle;
const LenientThrottle = () => (0, throttler_1.Throttle)({
    default: { limit: 200, ttl: 60000 },
});
exports.LenientThrottle = LenientThrottle;
//# sourceMappingURL=throttle.decorator.js.map