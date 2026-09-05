/*
Loops in C++ are control structures that allow you to execute a block of code repeatedly.
Loops are fundamental for performing repetitive tasks without having to write the same code multiple times.
There are three primary types of loops in C++: for, while, and do-while.

1. For Loop
A for loop is used when you know beforehand how many times you want to repeat a block of code. 
It allows you to initialize a variable, set a condition to stop the loop, 
and define how to modify the loop variable after each iteration.
syntax:
for (initialization; condition; increment) 
{
    // code to be executed
}

i.Initialization: This step is executed only once at the beginning of the loop. 
It usually initializes a loop counter variable (e.g., int i = 0).
ii.Condition: Before each iteration, the condition is checked. 
If it evaluates to true, the loop body is executed. 
If it's false, the loop terminates.
iii.Increment/Decrement: This step is executed after each iteration. 
It modifies the loop counter to progress towards the end condition (e.g., i++).

Nested for Loops:
You can also nest for loops, meaning you can have one for loop inside another.
This is useful for working with multidimensional data structures like matrices.

2. While Loop
A while loop is used when you want to repeat a block of code an unknown number of times but as long as a certain condition is true. 
The condition is checked before the body of the loop is executed, so if the condition is false at the start, 
the loop might never run.

syntax: 
while (condition) 
{
    // code to be executed
}

Condition:Before each iteration, the condition is evaluated. If it's true, the loop continues; otherwise, it stops.

Infinite while Loop:
If you provide a condition that is always true (like true), the loop will run infinitely:

while (true) 
{
    cout << "This will run forever!" << endl;
}
To stop the loop, you can use the break statement.

3. Do-While Loop
A do-while loop is similar to a while loop, except the condition is checked after the loop body executes. 
This ensures that the body of the loop is executed at least once, even if the condition is initially false.

syntax:
do 
{
    // code to be executed
} while (condition);

Condition: The condition is checked after the body of the loop has executed. 
If it's true, the loop continues; otherwise, it terminates.

Infinite do-while Loop:
Like a while loop, you can create an infinite do-while loop if the condition always evaluates to true.

syntax:-
do 
{
    cout << "This will run forever!" << endl;
} while (true);

Loop Control Statements:

C++ provides several statements to control the flow within loops:
break: Exits the loop immediately, no matter where it is. Useful for stopping a loop based on a condition.
continue: Skips the remaining code in the current iteration and moves to the next iteration of the loop.
goto: Jumps to a labeled statement in the code. Not recommended for use in loops, as it can make the code harder to read and debug.
return: In a function, the return statement exits the function immediately. 
In a loop, this will terminate the entire function and stop any further loop execution.

Performance Considerations:
For loops tend to be more efficient than while or do-while loops when the number of iterations is known in advance.
While and do-while loops are better suited when the loop condition depends on dynamic or external factors.

Conclusion:
For Loop: Best for a known, fixed number of iterations.
While Loop: Ideal for an unknown number of iterations, where the loop condition is evaluated before each iteration.
Do-While Loop: Best when the loop body should always run at least once, regardless of the condition.

*/

#include<iostream>
using namespace std;
int main() 
{
    for (int i = 0; i < 5; i++) 
    {
        cout << i << endl;
    }
    return 0;
}
    
#include<iostream>
using namespace std;
int main()
{
    int i = 0;
    while (i < 5)
    {
        cout << i << endl;
        i++;
    }

    return 0;
}

#include<iostream>
using namespace std;
int main()
{
    int i = 0;
    do 
    {
        cout << i << endl;
        i++;
    }while (i < 5);

    return 0;
}

#include <iostream>
using namespace std;

int main() 
{
    for (int i = 0; i < 5; i++) 
    {
        cout << "Iteration " << i << endl;
    }
    return 0;
}

#include <iostream>
using namespace std;

int main()
 {
    int i = 0;
    while (i < 5) 
    {
        cout << "Iteration " << i << endl;
        i++;
    }
    return 0;
}


#include <iostream>
using namespace std;

int main() 
{
    int i = 0;
    do 
    {
        cout << "Iteration " << i << endl;
        i++;
    } while (i < 5);
    return 0;
}

#include<iostream>
using namespace std;
int main()
{
    do 
    {
        cout << "This will run forever!" << endl;
    } while (true);
    return 0;
}

#include<iostream>
using namespace std;
int main()
{
    for (int i = 0; i < 5; i++) 
    {
        if (i == 3) 
        {
            break;  // Exits the loop when i equals 3
        }
        cout << i << endl;
    }
    return 0;
}

#include<iostream>
using namespace std;
int main()
{
    for (int i = 0; i < 5; i++) 
    {
        if (i == 3) 
        {
            continue;  // Skips printing when i equals 3
        }
        cout << i << endl;
    }
    return 0;
}
