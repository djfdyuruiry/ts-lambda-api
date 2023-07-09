import { mark, stop } from "marky"

import { ProfilingEnabled } from "./Environment"

/**
 * Decorator that can be applied to a method or function to
 * profile it's execution time in milliseconds. Timing info
 * is output to the console.
 *
 * The environment variable `PROFILE_API` must be set to `1` for
 * profiling information to be recorded and output.
 */
export function timed(_: any, propertyKey: string, descriptor: PropertyDescriptor) {
    let functionToMeasure: Function = descriptor.value

    descriptor.value = async function(this: void, ...args: any[]) {
        if (ProfilingEnabled) {
            mark(propertyKey)
        }

        let result = await functionToMeasure.apply(this, args)

        if (ProfilingEnabled) {
            let measurement = stop(propertyKey)

            if (measurement != null) {
                let name = measurement.name as string
                let duration = measurement.duration.toFixed(2) as string

                console.log(`method '${name}' took ${duration} ms`)
            }
        }

        return result
    }
}
