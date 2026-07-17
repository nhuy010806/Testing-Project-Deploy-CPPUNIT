#include "TestPrimeCheck.h"
#include <fstream>
#include <sstream>
#include <stdexcept>
#include <iostream>
using namespace std;

void TestPrimeCheck::setUp() {}
void TestPrimeCheck::tearDown() {}

vector<TestCase> TestPrimeCheck::loadCSV(const string& filename) {
    vector<TestCase> tests;
    ifstream file(filename);
    if (!file.is_open()) {
        cerr << "ERROR: Cannot open CSV file: " << filename << endl;
        return tests;
    }
    string line;
    getline(file, line); // skip header
    while (getline(file, line)) {
        if (line.empty()) continue;
        TestCase tc;
        stringstream ss(line);
        string token;
        getline(ss, token, ','); tc.id = stoi(token);
        getline(ss, token, ','); tc.num = stoi(token);
        getline(ss, token, ','); tc.expected = token;
        getline(ss, token, ','); tc.type = token;
        getline(ss, token, ','); tc.note = token;
        tests.push_back(tc);
    }
    cout << "Loaded " << tests.size() << " test cases from " << filename << endl;
    return tests;
}

void TestPrimeCheck::testAll() {
    vector<TestCase> tests = loadCSV("Data/test_data.csv");
    CPPUNIT_ASSERT_MESSAGE("CSV file not found or empty: Data/test_data.csv", !tests.empty());
    int failedCount = 0;
    for (const auto& tc : tests) {
        string msg = "UTCID" + to_string(tc.id) + " (num=" + to_string(tc.num) + ")";
        try {
            if (tc.expected == "TRUE") {
                bool result = primeCheck(tc.num);
                if (result) {
                    cout << "[PASS] " << msg << ": Expected TRUE, got TRUE" << endl;
                } else {
                    cout << "[FAIL] " << msg << ": Expected TRUE, but got FALSE" << endl;
                    failedCount++;
                }
            } else if (tc.expected == "FALSE") {
                bool result = primeCheck(tc.num);
                if (!result) {
                    cout << "[PASS] " << msg << ": Expected FALSE, got FALSE" << endl;
                } else {
                    cout << "[FAIL] " << msg << ": Expected FALSE, but got TRUE" << endl;
                    failedCount++;
                }
            } else if (tc.expected == "Exception" || tc.expected == "EXCEPTION") {
                try {
                    primeCheck(tc.num);
                    cout << "[FAIL] " << msg << ": Expected invalid_argument exception, but no exception was thrown" << endl;
                    failedCount++;
                } catch (const invalid_argument&) {
                    cout << "[PASS] " << msg << ": Expected Exception, successfully caught invalid_argument" << endl;
                } catch (const exception& e) {
                    cout << "[FAIL] " << msg << ": Expected invalid_argument exception, but got: " << e.what() << endl;
                    failedCount++;
                } catch (...) {
                    cout << "[FAIL] " << msg << ": Expected invalid_argument exception, but got an unknown exception" << endl;
                    failedCount++;
                }
            }
        } catch (const exception& e) {
            cout << "[FAIL] " << msg << ": Unexpected exception occurred: " << e.what() << endl;
            failedCount++;
        } catch (...) {
            cout << "[FAIL] " << msg << ": Unexpected unknown exception occurred" << endl;
            failedCount++;
        }
    }
    CPPUNIT_ASSERT_EQUAL_MESSAGE("Some CSV test cases failed.", 0, failedCount);
}