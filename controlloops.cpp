/* there are three control loop structure
    for, while, dowhile, programs */

#include<iostream>
using namespace std;
int main() 
{
    int i,n;
    cout<<"Enter the number of terms: ";
    cin>>n;
    cout<<"Fibonacci Series: ";
    for(i=0;i<n;i++)
    {
        if(i==0)
        cout<<0;
        else if(i==1)
        cout<<1;
        else
        {
            int a=0,b=1;
            cout<<a<<" "<<b<<" ";
            for(int j=2;j<i;j++)
            {
                int temp=a+b;
                a=b;
                b=temp;
            }
        }
        cout<<endl;
    }

    return 0;
}
