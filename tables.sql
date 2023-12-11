CREATE TABLE majors(
  majorid INTEGER PRIMARY KEY AUTOINCREMENT,
  major_name TEXT
)

CREATE TABLE students(
  netid INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  log_in_password TEXT NOT NULL,
  major INTEGER,
  gpa REAL,
  FOREIGN KEY (major) REFERENCES majors(majorid)
);

CREATE TABLE courses(
  courseid INTEGER PRIMARY KEY AUTOINCREMENT,
  course_name TEXT NOT NULL,
  credit INTEGER,
  general_education TEXT,
  major INTEGER,
  course_description TEXT,
  title TEXT,
  FOREIGN KEY (major) REFERENCES majors(majorid)
);

CREATE TABLE lectures(
  lectureid INTEGER PRIMARY KEY AUTOINCREMENT,
  course INTEGER,
  start_time INTEGER,
  end_time INTEGER,
  instructor INTEGER,
  section_name TEXT,
  capacity INTEGER,
  current_enroll INTEGER,
  day_in_week TEXT,
  FOREIGN KEY (course) REFERENCES courses(courseid),
  FOREIGN KEY (instructor) REFERENCES instructors(id)
);

CREATE TABLE quizzes(
  quizid INTEGER PRIMARY KEY AUTOINCREMENT,
  lecture INTEGER,
  start_time INTEGER,
  end_time INTEGER,
  instructor INTEGER,
  section_name TEXT,
  capacity INTEGER,
  current_enroll INTEGER,
  day_in_week TEXT,
  FOREIGN KEY (lecture) REFERENCES lectures(lectureid),
  FOREIGN KEY (instructor) REFERENCES tas(id)
);

CREATE TABLE nextquarter(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  netid INTEGER,
  lecture INTEGER,
  quiz INTEGER,
  registration_status TEXT,
  confirmation_code TEXT,
  FOREIGN KEY (netid) REFERENCES students(netid),
  FOREIGN KEY (lecture) REFERENCES lectures(lectureid),
  FOREIGN KEY (quiz) REFERENCES quizzes(quizid)
);

CREATE TABLE instructors(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT
);

CREATE TABLE tas(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT
);

CREATE TABLE prerequisites(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER,
  pre_course_id INTEGER,
  FOREIGN KEY (course_id) REFERENCES courses(courseid),
  FOREIGN KEY (pre_course_id) REFERENCES courses(courseid)
);

CREATE TABLE majorrequirements(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  major_id INTEGER,
  course_id INTEGER,
  FOREIGN KEY (course_id) REFERENCES courses(courseid),
  FOREIGN KEY (major_id) REFERENCES majors(majorid)
);

CREATE TABLE minorrequirements(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  major_id INTEGER,
  course_id INTEGER,
  FOREIGN KEY (course_id) REFERENCES courses(courseid),
  FOREIGN KEY (major_id) REFERENCES majors(majorid)
);

CREATE TABLE history(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  course_id INTEGER,
  school_year INTEGER,
  school_quarter TEXT,
  grade REAL,
  FOREIGN KEY (course_id) REFERENCES courses(courseid),
  FOREIGN KEY (student_id) REFERENCES students(netid)
);

CREATE TABLE signin(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  FOREIGN KEY (student_id) REFERENCES students(netid)
);