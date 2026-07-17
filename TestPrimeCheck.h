#ifndef TESTPRIMECHECK_H
#define TESTPRIMECHECK_H

#include <cppunit/extensions/HelperMacros.h>
#include <vector>
#include <string>
#include "primeCheck.h"

struct TestCase {
    int id;
    int num;
    std::string expected;
    std::string type;
    std::string note;
};

class TestPrimeCheck : public CPPUNIT_NS::TestFixture
{
    CPPUNIT_TEST_SUITE(TestPrimeCheck);
    CPPUNIT_TEST(testAll);
    CPPUNIT_TEST_SUITE_END();

public:
    void setUp();
    void tearDown();
    void testAll();

private:
    std::vector<TestCase> loadCSV(const std::string& filename);
};

#endif