#!/usr/bin/env bash
resultsDir=".test_results"
resultsFileName="results.xml"

tapFile="${resultsDir}/results.tap"
jsonFile="${resultsDir}/results.json"
resultsFile="${resultsDir}/${resultsFileName}"
reportFile="${resultsDir}/results.html"
codeCoverageReportFile="coverage/index.html"

exitCode=0

generateTestReport() {
    if ! [ -x "$(command -v pipenv)" ]; then
        echo "pipenv not found, skipping HTML test report generation"

        return
    fi

    pipenv install
    pipenv run junit2html "${resultsFile}" "${reportFile}"
}

runTestsWithCoverage() {
    nyc --reporter=lcov --reporter=html alsatian --tap "./tests/js/**/*Tests.js" 2>&1 | \
        tee "${tapFile}" |
        tap-spec

    exitCodes="$(printf "%s" "${PIPESTATUS[@]}")"
    nonZeroExitCodes=${exitCodes//0/}

    if ! [ -z "${nonZeroExitCodes}" ]; then
        exitCode=1
    fi
}

runTests() {
    mkdir -p "${resultsDir}"

    # let the framework know it is under test
    #   see: src/util/Environment.ts
    export UNDER_TEST=1

    runTestsWithCoverage

    # export to JUnit XML
    cat "${tapFile}" | junit-bark > "${resultsFile}"
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

    echo
    echo "TAP File: $(readlink -f ${tapFile})"

    if [ -f "${reportFile}" ]; then
        echo "HTML Test Report: $(readlink -f ${reportFile})"
    fi

    echo "Code Coverage Report: $(readlink -f ${codeCoverageReportFile})"
    echo

    exit ${exitCode}
}

main
