#include "primeCheck.h"
#include <cmath>
#include <stdexcept>
#include <iostream>
using namespace std;

bool primeCheck(int num) {
    if (num < 0 || num > 1000)
        throw invalid_argument("num phải nằm trong [0, 1000]");
    if (num <= 1) return false;
    for (int i = 2; i <= sqrt(num); i++)
        if (num % i == 0) return false;
    return true;
}