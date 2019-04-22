import { TestFixture, Test, TestCase, Expect } from "alsatian"

import { LogFactory, LogFormat, LogLevel } from "../../dist/ts-lambda-api"

@TestFixture()
export class LogFactoryTests {
    @Test()
    public when_logfactory_called_to_build_logger_then_no_exceptions_occur() {
        LogFactory.getDefaultLogger(LogFactoryTests)
    }

    @Test()
    public when_logfactory_called_to_build_default_logger_then_no_exceptions_occur() {
        LogFactory.getDefaultLogger(LogFactoryTests)
    }

    @Test()
    public when_logfactory_called_to_build_custom_logger_then_no_exceptions_occur() {
        LogFactory.getCustomLogger(LogFactoryTests, LogLevel.trace)
    }

    @Test()
    @TestCase(LogLevel.trace, ["traceEnabled", "debugEnabled", "infoEnabled", "warnEnabled", "errorEnabled", "fatalEnabled"])
    @TestCase(LogLevel.debug, ["debugEnabled", "infoEnabled", "warnEnabled", "errorEnabled", "fatalEnabled"])
    @TestCase(LogLevel.info,  ["infoEnabled", "warnEnabled", "errorEnabled", "fatalEnabled"])
    @TestCase(LogLevel.warn,  ["warnEnabled", "errorEnabled", "fatalEnabled"])
    @TestCase(LogLevel.error, ["errorEnabled", "fatalEnabled"])
    @TestCase(LogLevel.fatal, ["fatalEnabled"])
    @TestCase(LogLevel.off, ["isOff"])
    public when_level_set_then_all_levels_above_the_current_level_report_enabled(level: LogLevel, methods: string[]) {
        let logger = LogFactory.getCustomLogger(LogFactoryTests, level)

        methods.map(m =>
            Expect(logger[m]()).toBe(true)
        )
    }

    @Test()
    @TestCase(LogLevel.debug, ["traceEnabled"])
    @TestCase(LogLevel.info,  ["traceEnabled", "debugEnabled"])
    @TestCase(LogLevel.warn,  ["traceEnabled", "debugEnabled", "infoEnabled"])
    @TestCase(LogLevel.error, ["traceEnabled", "debugEnabled", "infoEnabled", "warnEnabled"])
    @TestCase(LogLevel.fatal, ["traceEnabled", "debugEnabled", "infoEnabled", "warnEnabled", "errorEnabled"])
    @TestCase(LogLevel.off, ["traceEnabled", "debugEnabled", "infoEnabled", "warnEnabled", "errorEnabled", "fatalEnabled"])
    public when_level_set_then_all_levels_below_the_current_level_report_disabled(level: LogLevel, methods: string[]) {
        let logger = LogFactory.getCustomLogger(LogFactoryTests, level)

        methods.map(m =>
            Expect(logger[m]()).toBe(false)
        )
    }

    @Test()
    @TestCase("trace", "string")
    @TestCase("trace", "json")
    @TestCase("debug", "string")
    @TestCase("debug", "json")
    @TestCase("info", "string")
    @TestCase("info", "json")
    @TestCase("warn", "string")
    @TestCase("warn", "json")
    @TestCase("error", "string")
    @TestCase("error", "json")
    @TestCase("fatal", "string")
    @TestCase("fatal", "json")
    public when_logger_called_for_level_then_no_exceptions_occur(levelMethod: string, format: LogFormat) {
        let logger = LogFactory.getCustomLogger(LogFactoryTests, LogLevel.trace, format)

        logger[levelMethod]("I am %s: %j", levelMethod, {some: "value"})
    }

    @Test()
    public when_logger_called_with_circular_array_then_no_exceptions_occur() {
        let logger = LogFactory.getCustomLogger(LogFactoryTests, LogLevel.trace)

        var circularArray = [];
        circularArray[0] = circularArray;

        logger.info("not going to work: %j", circularArray)
    }

    @Test()
    public when_logger_called_with_circular_object_then_no_exceptions_occur() {
        let logger = LogFactory.getCustomLogger(LogFactoryTests, LogLevel.trace)

        function CircularBoy() {
            this.circular = this
        }

        var oneCircularBoy = new CircularBoy();

        logger.info("not going to work: %j", oneCircularBoy)
    }
}
