/* First before the starting of operator you must consider the C++ basic concepts just like what is C++
language and take information of C++ language, what is programming and history of programming,
Here we study the operator of C++ where there are the six types of operator that is.
Arithmetic Operators
Relational Operators
Logical Operators
Bitwise Operators
Assignment Operators
Ternary or Conditional Operators.
here the link and see the operators in symbol.
https://media.geeksforgeeks.org/wp-content/uploads/20220527101351/OperatorsinCPP.png, */

#include <iostream>
using namespace std;
int main()
{
     int n, m, z;
     cout << "Enter the first number: ";
     cin >> n;
     cout << "Enter the second number: ";
     cin >> m;

     // Arithmatic Operators
     cout << "Addition: " << n + m << endl;
     cout << "Subtraction: " << n - m << endl;
     cout << "Multiplication: " << n * m << endl;
     cout << "Division: " << n / m << endl;
     cout << "Modulus: " << n % m << endl;

     // here the some demostration or we say that use of arithmatic operators.
     int mark1, mark2, mark3;
     cout << endl << "Enter the mark1 of student: ";
     cin >> mark1;
     cout << endl << "Enter the mark2 of student: ";
     cin >> mark2;
     cout << endl << "Enter the mark3 of student: ";
     cin >> mark3;

     int total = mark1 + mark2 + mark3;
     cout << "The total mark of student is: " << total << endl;

     float percent;
     percent = (total / 300) * 100;
     cout << "The percentage of student is: " << percent << "%" << endl;

     return 0;
}

// here the demostration of Relational operator
#include <iostream>
using namespace std;
int main()
{
     int a = 6, b = 4;

     // Equal to operator
     cout << "a == b is " << (a == b) << endl;

     // Greater than operator
     cout << "a > b is " << (a > b) << endl;

     // Greater than or Equal to operator
     cout << "a >= b is " << (a >= b) << endl;

     //  Lesser than operator
     cout << "a < b is " << (a < b) << endl;

     // Lesser than or Equal to operator
     cout << "a <= b is " << (a <= b) << endl;

     // true
     cout << "a != b is " << (a != b) << endl;

     return 0;
}

// Here the demoastration of logical operator
#include <iostream>
using namespace std;

int main()
{
    int a = 6, b = 4;

    // Logical AND operator
    cout << "a && b is " << (a && b) << endl;
  
    // Logical OR operator
    cout << "a || b is " << (a || b) << endl;
  
    // Logical NOT operator
    cout << "!b is " << (!b) << endl;

    return 0;
}

// here the demonstration of bitwise operator
#include <iostream>
using namespace std;

int main()
{
    int a = 6, b = 4;

    // Binary AND operator
    cout << "a & b is " << (a & b) << endl;

    // Binary OR operator
    cout << "a | b is " << (a | b) << endl;

    // Binary XOR operator
    cout << "a ^ b is " << (a ^ b) << endl;

    // Left Shift operator
    cout << "a<<1 is " << (a << 1) << endl;

    // Right Shift operator
    cout << "a>>1 is " << (a >> 1) << endl;

    // One’s Complement operator
    cout << "~(a) is " << ~(a) << endl;

    return 0;
}

// here the demonstration of assignment operator
#include <iostream>
using namespace std;

int main()
{
    int a = 6, b = 4;

    // Assignment Operator
    cout << "a = " << a << endl;
  
    //  Add and Assignment Operator
    cout << "a += b is " << (a += b) << endl;
  
    // Subtract and Assignment Operator
    cout << "a -= b is " << (a -= b) << endl;
  
    //  Multiply and Assignment Operator
    cout << "a *= b is " << (a *= b) << endl;
  
    //  Divide and Assignment Operator
    cout << "a /= b is " << (a /= b) << endl;

    return 0;
}

// here the demonstration of ternary or conditional operator
#include <iostream>
using namespace std;

int main()
{
    int a = 3, b = 4;

    // Conditional Operator
    int result = (a < b) ? b : a;
    cout << "The greatest number is " << result << endl;

    return 0;
}

/* here the overall concept of operator
https://www.geeksforgeeks.org/operators-in-cpp/?ref=lbp
 */