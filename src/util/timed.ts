import { mark, stop } from 'marky'

import { ProfilingEnabled } from './Environment'

export function timed(_: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const functionToMeasure: Function = descriptor.value;

    descriptor.value = function (this: void, ...args: any[]) {
        if (ProfilingEnabled) {
            mark(propertyKey)
        }

        var result = functionToMeasure.apply(this, args);

        if (ProfilingEnabled) {
            var measurement = stop(propertyKey)

            console.log(`method '${measurement.name}' took ${measurement.duration.toFixed(2)} ms`)
        }

        return result;
    }
}
