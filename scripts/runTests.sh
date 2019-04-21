#!/usr/bin/env bash
resultsDir=".test_results"

tapFile="${resultsDir}/results.tap"
junitFile="${resultsDir}/results.xml"
reportFile="${resultsDir}/results.html"
codeCoverageReportFile="coverage/index.html"

exitCode=0

printReportSummary() {
    echo
    echo "TAP File: $(readlink -f ${tapFile})"

    if [ -f "${reportFile}" ]; then
        echo "HTML Test Report: $(readlink -f ${reportFile})"
    fi

    echo "Code Coverage Report: $(readlink -f ${codeCoverageReportFile})"
    echo
}

generateTestReport() {
    if ! [ -x "$(command -v pipenv)" ]; then
        echo "pipenv not found, skipping HTML test report generation"

        return
    fi

    pipenv install
    pipenv run junit2html "${junitFile}" "${reportFile}"
}

determineExitCode() {
    exitCodes="$1"
    nonZeroExitCodes=${exitCodes//0/}

    if ! [ -z "${nonZeroExitCodes}" ]; then
        exitCode=1
    fi
}

runTestsWithCoverage() {
    # let the framework know it is under test, see: src/util/Environment.ts
    export UNDER_TEST=1

    nyc --reporter=lcov --reporter=html alsatian --tap "./tests/js/**/*Tests.js" 2>&1 | \
        tee "${tapFile}" |
        tap-spec

    determineExitCode "$(printf "%s" "${PIPESTATUS[@]}")"
}

runTests() {
    mkdir -p "${resultsDir}"

    runTestsWithCoverage

    cat "${tapFile}" | junit-bark > "${junitFile}"
}

cleanupOldResults() {
    rm -rf ".nyc_output"
    rm -rf "coverage"

    rm -rf "${resultsDir}"
}

main() {
    cat "tests/banner.txt"

    cleanupOldResults
    runTests
    generateTestReport

    printReportSummary

    exit ${exitCode}
}

main
