# YourPlan Course Enrollment System API Documentation
*This API provides services used in YourPlan Course Enrollment System, including
course registration, sign-in/log-out, updating course carts, retrieving past
course history, viewing course details, and degree audition.*

## *All Courses Next Quarter*
**Request Format:** */yourplan/allcourses?keyword=value1&category=value2&credit=value3*

**Request Type:** *Get*

**Returned Data Format**: JSON

**Description:** *This endpoint gives all the courses that the school offers
next quarter, including their names, credits, title, and academic catogory.
The user could further filter/search for specific results using the query parameters*

**Example Request:** */yourplan/allcourses?credit=4&keyword=computer&category=Science*

**Example Response:**

```json
{
  "courses": [
    {
      "course_name": "CSE 121",
      "credit": 4,
      "title": "Introduction to Computer Programming I",
      "category": "Science"
    },
    {
      "course_name": "CSE 122",
      "credit": 4,
      "title": "Introduction to Computer Programming II",
      "category": "Science"
    },
    {
      "course_name": "CSE 123",
      "credit": 4,
      "title": "Introduction to Computer Programming III",
      "category": "Science"
    }
  ]
}
```

**Example Request:** */yourplan/allcourses*

**Example Response:**

```json
{
  "courses": [
    {
      "course_name": "ACCTG 215",
      "credit": 4,
      "title": "Introduction to Accounting and Financial Reporting",
      "category": "Business"
    },
    {
      "course_name": "ACCTG 225",
      "credit": 4,
      "title": "Fundamentals of Managerial Accounting",
      "category": "Business"
    }
    ...
  ]
}
```

**Error Handling:**
500 Internal Server Error: Plain Text returned if there's an unexpected server-side issue.

## *Sign-In*
**Request Format:** */yourplan/signin*

**Request Type:** *Post*

**Returned Data Format**: JSON

**Description:** *This endpoint allows the user to either sign in to course
enrollment system. Requires netid and password as body parameters for sign in.*


**Example Request:** */yourplan/signin (body parameter: "netid": "1", "password": "12345678")*

**Example Response:**

```json
{
  "ifSuccess": true
}
```

**Error Handling:**
400 Bad Request: Plain Text returned if the password or netid is not valid. Example:

```
"Enter both netid and password"
```

500 Internal Server Error: Plain Text returned if there's an unexpected server-side issue.

## *Log-Out*
**Request Format:** */yourplan/logout*

**Request Type:** *Post*

**Returned Data Format**: JSON

**Description:** *This endpoint allows the user to log out from course
enrollment system. Requires netid as body parameter.*

**Example Request:** */yourplan/logout (body parameter: "netid": "1")*

**Example Response:**

```json
{
  "ifSuccess": true
}
```

**Error Handling:**
400 Bad Request: Plain Text returned if netid is not valid. Example:

```
"Please Enter valid netid to log out"
```

500 Internal Server Error: Plain Text returned if there's an unexpected server-side issue.

## *Sign-In-Status*
**Request Format:** */yourplan/checksignin/:netid*

**Request Type:** *Get*

**Returned Data Format**: JSON

**Description:** *This endpoint returns whether or not the current user is signed in*

**Example Request:** /yourplan/checksignin/1

**Example Response:**

```json
{
  "isAlreadySignedIn": true
}
```

**Error Handling:**
500 Internal Server Error: Plain Text returned if there's an unexpected server-side issue.

## *Update Course Cart*
**Request Format:** */yourplan/updatecart/:isadd*

**Request Type:** *Post*

**Returned Data Format**: JSON

**Description:** *This endpoint updates the course cart of the current user, which
either adds or removes the given course. It takes in a boolean path paramter indicating whether it
is adding or removing. The netid, courseName, lecture section, and quiz section are taken
in as body parameters. Checks if the user is already logged in. The "isSectionFull" return
value indicates whether or not the section is currently full (adding a course to cart does not
mean the user is registered for it or considered a current enrolled member). Note that
isSectionFull will be true when the provided sections do not exist. Cannot add sections when
that course is already added.*

**Example Request:** */yourplan/updatecard/true
(body parameter: "courseName": "CSE 154", "netid": "5", "lecture": "A", "quiz": "AA")*

**Example Response:**

```json
{
  "ifSuccess": true,
  "isSectionFull": false
}
```

**Error Handling:**
400 Bad Request: Plain Text returned if the given user is not logged in yet. Example:

```
"Please Sign-In First"
```

500 Internal Server Error: Plain Text returned if there's an unexpected server-side issue.

## *Course Detail*
**Request Format:** */yourplan/coursedetail/:coursename*

**Request Type:** *GET*

**Returned Data Format**: JSON

**Description:** *This endpoint provides the detailed information of a course. It
takes in the course name as a path parameter
(Note that the middle white space in course name should be replaced with '-').
For classes with infinite capacity, the "capacity" will be returned as string
"unlimited capacity"*

**Example Request:** */yourplan/coursedetail/CSE-122*

**Example Response:**

```json
{
  "courseName": "CSE 122",
  "description": "Computer programming for students with some previous programming experience...",
  "department": "CSE",
  "credit": 4,
  "preRequisites": [
    {
      "course_name": "CSE 121"
    }
  ],
  "sections": [
    {
      "lecture": "A",
      "instructor": "Ryan Huang",
      "capacity": 10,
      "currentEnroll": 0,
      "scheduleDay": "MWF",
      "scheduleTime": "12:30 - 13:20",
      "quizzes": [
        {
          "quiz": "AA",
          "instructor": "Liam O'Sullivan",
          "capacity": 10,
          "currentEnroll": 0,
          "scheduleDay": "TH",
          "scheduleTime": "8:30 - 9:20"
        }
      ]
    },
    {
      "lecture": "B",
      "instructor": "Sean Smith",
      "capacity": 10,
      "currentEnroll": 1,
      "scheduleDay": "MWF",
      "scheduleTime": "13:30 - 14:20",
      "quizzes": [
        {
          "quiz": "BA",
          "instructor": "Sofia Rodriguez",
          "capacity": 10,
          "currentEnroll": 1,
          "scheduleDay": "TH",
          "scheduleTime": "14:00 - 14:50"
        }
      ]
    }
  ]
}

```

**Error Handling:**
400 Bad Request: Plain Text returned if the given course name is invalid. Example:

```
"Course Does Not Exist"
```

500 Internal Server Error: JSON returned if there's an unexpected server-side issue.


## *Send To Registration*
**Request Format:** */yourplan/register*

**Request Type:** *Post*

**Returned Data Format**: JSON

**Description:** *This endpoint Attempts to send all courses in the cart of the given user
to registration. Returns a confirmation code back if succeeded. All courses sent at the
same time will be given the same code. Netid of the given user is given as body parameter.
Requirements must be satisfied for successful registration, including no time conflicts, no
duplcate courses, no courses already taken, no full courses, no missing prerequisites, and
no larger than 18 credist next quarter.*

**Example Request:** */yourplan/register (body: {"netid": 1})*

**Example Response:**

```json
{
  "ifSuccess": true,
  "confirmationCode": 3.6569268119728465e+73,
  "note": "Everything Seems Great!"
}
```

**Example Request:** */yourplan/register (body: {"netid": 2})*

**Example Response:**

```json
{
  "ifSuccess": false,
  "confirmationCode": null,
  "note": "Prerequisites Not Met"
}
```

**Error Handling:**
400 Bad Request: Plain text returned if the netid does not exist or is not signed in. Example:

```
"Invalid netid"
```

500 Internal Server Error: Plain Text returned if there's an unexpected server-side issue.

## *Cart/Registration History*
**Request Format:** */yourplan/cart/:netid*

**Request Type:** *GET*

**Returned Data Format**: JSON

**Description:** *This endpoint returns the current content in the user's cart and the user's
registration history for next quarter. The user's netid is taken in as path parameter.
Confirmation code for successful registrations are also given.*

**Example Request:** */yourplan/cart/1*

**Example Response:**

```json
{
  "added": [
    {
      "lecture": {
        "section_name": "A",
        "instructor": "Ryan Huang",
        "scheduleDay": "MWF",
        "scheduleTime": "8:30 - 9:20"
      },
      "quiz": {
        "section_name": "AA",
        "instructor": "Ryan Huang",
        "scheduleDay": "TTH",
        "scheduleTime": "10:30 - 11:20"
      },
      "courseName": "CSE 121"
    },
    {
      "lecture": {
        "section_name": "A",
        "instructor": "Brian Happy",
        "scheduleDay": "WF",
        "scheduleTime": "8:30 - 9:20"
      },
      "quiz": {
        "section_name": "AA",
        "instructor": "Mary Bill",
        "scheduleDay": "TH",
        "scheduleTime": "13:10 - 14:00"
      },
      "courseName": "MATH 125"
    }
  ],
  "registered": [
    {
      "lecture": {
        "section_name": "A",
        "instructor": "Brian Happy",
        "scheduleDay": "MWF",
        "scheduleTime": "8:30 - 9:20"
      },
      "quiz": {
        "section_name": "AA",
        "instructor": "Mary Bill",
        "scheduleDay": "TTH",
        "scheduleTime": "10:00 - 10:50"
      },
      "confirmation_code": "2.84842693695185e+73",
      "courseName": "MATH 394"
    }
  ]
}
```

**Error Handling:**
400 Bad Request: Plain text returned if the user indicated does not exist or is not signed in.
Example:

```
"Invalid netid Or Is Not Signed In"
```

500 Internal Server Error: Plain Text returned if there's an unexpected server-side issue.

## *All Past Histroy*
**Request Format:** */yourplan/history/:netid*

**Request Type:** *GET*

**Returned Data Format**: JSON

**Description:** *This endpoint returns all the courses the student has taken in
the past two years with their scores and credits. The user's netid is taken in as
path parameter.*

**Example Request:** */yourplan/history/1*

**Example Response:**

```json
{
  "2022": {
    "winter": [
      {
        "courseName": "CSE 121",
        "credit": 4,
        "grade": 3.5
      },
      {
        "courseName": "MATH 124",
        "credit": 5,
        "grade": 3.8
      }
    ],
    "autumn": [],
    "spring": []
  },
  "2023": {
    "winter": [
      {
        "courseName": "AMATH 352",
        "credit": 3,
        "grade": 3
      }
    ],
    "autumn": [
      {
        "courseName": "AMATH 351",
        "credit": 3,
        "grade": 3.3
      },
      {
        "courseName": "ACCTG 225",
        "credit": 4,
        "grade": 4
      }
    ],
    "spring": [
      {
        "courseName": "ACCTG 215",
        "credit": 4,
        "grade": 2.9
      },
      {
        "courseName": "MATH 126",
        "credit": 5,
        "grade": 3.2
      }
    ]
  }
}
```

**Error Handling:**
400 Bad Request: Plain text returned if the user indicated does not exist or is not signed in.
Example:

```
"Invalid netid Or Is Not Signed In"
```

500 Internal Server Error: Plain Text returned if there's an unexpected server-side issue.

## *Degree Audition*
**Request Format:** */yourplan/degreeaudit/:netid/:majorname/:ismajor*

**Request Type:** *GET*

**Returned Data Format**: JSON

**Description:** *This endpoint provide user's degree audit to what courses are needed for
graduation. The audit will show courses that are complete, inprogress, and incomplete. Only courses related to the major/minor is displayed here. The path parameter ismajor should be true when
auditing for the major, false if for the minor.*

**Example Request:** */yourplan/degreeaudit/1/MATH/false*

**Example Response:**

```json
{
  "netid": 1,
  "full_name": "Zhiyuan Jia",
  "finished": [
    {
      "courseName": "MATH 126",
      "title": "Calculus with Analytic Geometry III",
      "credit": 5
    },
    {
      "courseName": "MATH 125",
      "title": "Calculus with Analytic Geometry II",
      "credit": 5
    },
    {
      "courseName": "MATH 124",
      "title": "Calculus with Analytic Geometry I",
      "credit": 5
    }
  ],
  "inProgress": [
    {
      "courseName": "MATH 394",
      "title": "Probability I",
      "credit": 3
    }
  ],
  "failed": [],
  "stillNeeded": [
    {
      "courseName": "MATH 395",
      "title": "Probability II",
      "credit": 3
    }
  ],
  "creditEarned": 15,
  "creditNeeded": 3,
  "creditInProgress": 3
}
```

**Error Handling:**
400 Bad Request: Plain Text returned if the user is not logged in or ismajor is not given as
boolean. Example:

```
Invalid Major, ID, or Action Attempted
```

500 Internal Server Error: Plain Text returned if there's an unexpected server-side issue.