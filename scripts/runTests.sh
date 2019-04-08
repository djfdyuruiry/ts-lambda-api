#!/usr/bin/env sh
resultsDir="tests"
resultsFileName="results.xml"
resultsFile="${resultsDir}/${resultsFileName}"
reportFile="${resultsDir}/results.html"

generateTestReport() {
    xunit-viewer --results="${resultsFile}" --output="${reportFile}"
}

runTestsWithCoverage() {
    nyc --reporter=lcov --reporter=html alsatian --tap "./tests/js/**/*Tests.js" 2>&1 | \
        tee /dev/tty | \
        tap-junit -o "${resultsDir}" -n "${resultsFileName}"
}

cleanupOldResults() {
    rm -rf .nyc_output
    rm -rf coverage

    rm -f ${resultsDir}/*.xml
    rm -f ${resultsDir}/*.html
}

main() {
    cat tests/banner.txt

    cleanupOldResults
    runTestsWithCoverage
    generateTestReport

    echo
    echo "JUnit XML File: $(realpath ${resultsFile})"
    echo "HTML Test Report: $(realpath ${reportFile})"
    echo "Code Coverage Report: $(realpath coverage/index.html)"
    echo
}

main
