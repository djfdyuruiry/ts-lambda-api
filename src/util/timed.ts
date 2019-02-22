import { mark, stop } from "marky"

import { ProfilingEnabled } from "./Environment"

export function timed(_: any, propertyKey: string, descriptor: PropertyDescriptor) {
    let functionToMeasure: Function = descriptor.value

    descriptor.value = async function (this: void, ...args: any[]) {
        if (ProfilingEnabled) {
            mark(propertyKey)
        }

        let result = await functionToMeasure.apply(this, args)

        if (ProfilingEnabled) {
            let measurement = stop(propertyKey)

            console.log(`method '${measurement.name}' took ${measurement.duration.toFixed(2)} ms`)
        }

        return result
    }
}
