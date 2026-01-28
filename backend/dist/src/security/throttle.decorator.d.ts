export declare const CustomThrottle: (options: {
    short?: {
        limit: number;
        ttl: number;
    };
    medium?: {
        limit: number;
        ttl: number;
    };
    long?: {
        limit: number;
        ttl: number;
    };
}) => <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
export declare const StrictThrottle: () => MethodDecorator & ClassDecorator;
export declare const ModerateThrottle: () => MethodDecorator & ClassDecorator;
export declare const LenientThrottle: () => MethodDecorator & ClassDecorator;
