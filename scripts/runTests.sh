#!/usr/bin/env sh
resultsDir="tests"
resultsFileName="results.xml"
resultsFile="${resultsDir}/${resultsFileName}"
reportFile="${resultsDir}/results.html"

generateTestReport() {
    xunit-viewer --results="${resultsFile}" --output="${reportFile}"
}

runTestsWithCoverage() {
    # TODO: change shebang to bash and use the PIPESTATUS variable and `printf '%s,' "${PIPESTATUS[@]}"` to 
    #       return an exit code from this script to signal test or code coverage failure
    nyc --reporter=lcov --reporter=html alsatian --tap "./tests/js/**/*Tests.js" 2>&1 | \
        tee /dev/tty | \
        tee ./tests/results.log | \
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
