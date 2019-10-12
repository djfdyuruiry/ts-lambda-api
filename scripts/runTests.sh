#!/usr/bin/env bash
resultsDir=".test_results"

tapFile="${resultsDir}/results.tap"
junitFile="${resultsDir}/results.xml"
reportFile="${resultsDir}/results.html"
codeCoverageReportFile="coverage/index.html"

exitCode=0

# polyfill for realpath command using python
command -v realpath &> /dev/null || realpath() {
    python -c "import os; print os.path.abspath('$1')"
}

printReportSummary() {
    echo
    echo "TAP File: $(realpath ${tapFile})"

    if [ -f "${reportFile}" ]; then
        echo "HTML Test Report: $(realpath ${reportFile})"
    fi

    echo "Code Coverage Report: $(realpath ${codeCoverageReportFile})"
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

    if [ -n "${nonZeroExitCodes}" ]; then
        exitCode=1
    fi
}

runTestsWithCoverage() {
    # let the framework know it is under test, see: src/util/Environment.ts
    export TLA_UNDER_TEST=1

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
