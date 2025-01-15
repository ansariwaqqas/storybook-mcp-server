#include <iostream>
using namespace std;

class Student 
{
    private:
    string name;
    int roll_no, marks[4];
    
public:
    
    void set_data() 
    {
        cout << "Enter the student name: ";
        cin.ignore();  
        getline(cin, name);
        cout << "Enter the student roll no: ";
        cin >> roll_no;
        cout << "Enter the student marks: ";
        for (int i = 0; i < 4; i++) 
        { 
            cout << "Enter marks " << i + 1 << ": ";
            cin >> marks[i];
        }
    }

    void display_data() 
    {
        cout << "Name of student is: " << name << endl;
        cout << "Roll no of student is: " << roll_no << endl;
        cout << "Student marks are: ";
        for (int i = 0; i < 4; i++) 
        {
            cout << "Marks " << i + 1 << ": " << marks[i] << endl;
        }
    }

    void display_data(int roll_no) 
    {
        cout << "Name of student is: " << name << endl;
        cout << "Roll no of student is: " << roll_no << endl;
        cout << "Student marks are: ";
        for (int i = 0; i < 4; i++) 
        {
            cout << "Marks " << i + 1 << ": " << marks[i] << endl;
        }
    }

    string get_name() 
    {
        return name;
    }

    int get_roll_no() {
        return roll_no;
    }

    void update_data() 
    {
        cout << "Enter new name: ";
        cin.ignore();
        getline(cin, name);
        cout << "Enter new marks: ";
        for (int i = 0; i < 4; i++) 
        {
            cout << "Enter marks " << i + 1 << ": ";
            cin >> marks[i];
        }
    }
    
    void delete_data() {
        name = "";
        roll_no = 0;
        for (int i = 0; i < 4; i++) {
            marks[i] = 0;
        }
    }
};

int main() 
{
    int num;
    cout << "Enter the number of students to add: ";
    cin >> num;

    Student s[num]; 

    int choice;
    bool running = true;
    while (running)
    {
        cout << "\n1. Add student data"<<endl;
        cout << "2. Display all student data"<<endl;
        cout << "3. Display student data by roll number"<<endl;
        cout << "4. Update the existing student data"<<endl;
        cout << "5. Delete the student data if necessary"<<endl;
        cout << "6. Exit program"<<endl;
        cout << "Enter your choice: ";
        cin >> choice;

        switch (choice) 
        {
            case 1:
                for (int i = 0; i < num; i++) 
                {
                    cout << "Enter data for student " << i + 1 << ": ";
                    s[i].set_data();  
                }
                break;

            case 2:
                for (int i = 0; i < num; i++) 
                {
                    cout << "Displaying data for student " << i + 1 << ":\n";
                    s[i].display_data();  
                }
                break;

            case 3: 
            {
                int roll_no;
                cout << "Enter roll number to search for: ";
                cin >> roll_no;
                bool found = false;
                for (int i = 0; i < num; i++) 
                {
                    if (s[i].get_roll_no() == roll_no) 
                    { 
                        s[i].display_data(roll_no);
                        found = true;
                        break;
                    }
                }
                if (!found) 
                {
                    cout << "No student found with roll number " << roll_no << endl;
                }
                break;
            }

            case 4: 
            {
                int roll_no;
                cout << "Enter roll number to update: ";
                cin >> roll_no;
                bool found = false;
                for (int i = 0; i < num; i++) 
                {
                    if (s[i].get_roll_no() == roll_no) 
                    { 
                        s[i].update_data();
                        cout << "Student data updated successfully.\n";
                        found = true;
                        break;
                    }
                }
                if (!found) 
                {
                    cout << "No student found with roll number " << roll_no << endl;
                }
                break;
            }

            case 5: 
            {
                int roll_no;
                cout << "Enter roll number to delete: ";
                cin >> roll_no;
                bool found = false;
                for (int i = 0; i < num; i++) 
                {
                    if (s[i].get_roll_no() == roll_no) 
                    { 
                        s[i].delete_data();
                        cout << "Student data deleted successfully.\n";

                        // Shift remaining students
                        for (int j = i; j < num - 1; j++) 
                        {
                            s[j] = s[j + 1];
                        }
                        num--;  // Reduce the number of students
                        found = true;
                        break;
                    }
                }
                if (!found)
                {
                    cout << "No student found with roll number " << roll_no << endl;
                }
                break;
            }

            case 6:
                cout << "Exiting program...\n";
                running = false;
                break;

            default:
                cout << "Invalid choice! Please try again.\n";
                break;
        }
    }

    return 0;
}
