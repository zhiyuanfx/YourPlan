/*
 * Name: Zhiyuan Jia, Yuekai Xu
 * Date: 12/01/2023
 * Section: CSE 154 AF
 * TA: Rasmus
 * This is the Node.js to implement our YourPlan API. It provides services for
 * course registration, browsing, sign-in/log-out, updating course carts, retrieving past
 * course history, viewing course details, and degree audition. It takes in inputs
 * as body parameters and path and query parameters in post and get requests. It
 * requires log-in for some services such as registration and degree auditing.
 */

"use strict";

const express = require("express");
const app = express();
const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');
const multer = require("multer");
const DAY_IN_WEEK = ["M", "T", "W", "TH", "F"];
const MINUTE_CHECK = 10;
const HOUR = 60;
const INF = -1;
const CREDIT_BOUND = 18;
const HASH_MULTIPLY = 31;
const LAST_YEAR = 2023;
const YEAR_BEFORE_LAST_YEAR = 2022;
const SERVER_SIDE_ERROR_MESSAGE = "An error occurred on the server. Try again later.";
const INVALID_USER_INPUT_ERROR_STATUS = 400;
const SERVER_SIDE_ERROR_STATUS = 500;
const PORT_NUM = 8000;

// for application/x-www-form-urlencoded
app.use(express.urlencoded({extended: true})); // built-in middleware
// for application/json
app.use(express.json()); // built-in middleware
// for multipart/form-data (required with FormData)
app.use(multer().none()); // requires the "multer" module

/*
 * Returns the list of all the courses the school offers next quarter with their
 * basic information: credit, title, name, and category. Filters the results based
 * on the searched item and filters provided by the user, if any.
 */
app.get("/yourplan/allcourses", async (req, res) => {
  try {
    let db = await getDBConnection();
    let sql = "SELECT DISTINCT c.course_name, c.credit, c.title, m.category " +
              "FROM lectures l, courses c, majors m " +
              "WHERE l.course = c.courseid AND c.major = m.majorid ";
    let params = [];
    if (req.query.keyword) {
      sql += "AND (c.course_name LIKE ? OR c.course_description LIKE ?) ";
      params.push(`%${req.query.keyword}%`, `%${req.query.keyword}%`);
    }
    if (req.query.category) {
      sql += "AND m.category = ? ";
      params.push(req.query.category);
    }
    if (req.query.credit) {
      sql += "AND c.credit = ? ";
      params.push(parseInt(req.query.credit));
    }
    sql += "ORDER BY c.course_name";
    let result = await db.all(sql, params);
    await db.close();
    res.json({
      "courses": result
    });
  } catch (err) {
    res.status(SERVER_SIDE_ERROR_STATUS).type("text");
    res.send(SERVER_SIDE_ERROR_MESSAGE);
  }
});

/*
 * Logs in the current user given netid and password. Responses with the result
 * or the issue happened in the process such as wrong password.
 */
app.post("/yourplan/signin", async (req, res) => {
  try {
    if (req.body.netid && req.body.password && /^\d+$/.test(req.body.netid)) {
      let db = await getDBConnection();
      let info = await db.get(
        "SELECT netid FROM students WHERE netid = ? AND log_in_password = ?",
        [req.body.netid, req.body.password]
      );
      if (info) {
        let alreadySignedIn = await isAlreadySignedIn(req.body.netid);
        if (!alreadySignedIn) {
          await db.run("INSERT INTO signin (student_id) VALUES (?)", req.body.netid);
        }
        await db.close();
        res.json({"ifSuccess": true});
      } else {
        await db.close();
        res.status(INVALID_USER_INPUT_ERROR_STATUS).type("text");
        res.send("netid or password incorrect");
      }
    } else {
      res.status(INVALID_USER_INPUT_ERROR_STATUS).type("text");
      res.send("Enter both netid and password");
    }
  } catch (err) {
    res.status(SERVER_SIDE_ERROR_STATUS).type("text");
    res.send(SERVER_SIDE_ERROR_MESSAGE);
  }
});

/*
 * Logs out the current user given netid. Responses with the result or the issue
 * happened in the process such as wrong netid.
 */
app.post("/yourplan/logout", async (req, res) => {
  try {
    if (req.body.netid && /^\d+$/.test(req.body.netid)) {
      let db = await getDBConnection();
      await db.run("DELETE FROM signin WHERE student_id = ?", req.body.netid);
      await db.close();
      res.json({"ifSuccess": true});
    } else {
      res.status(INVALID_USER_INPUT_ERROR_STATUS).type("text");
      res.send("Please Enter valid netid to log out");
    }
  } catch (err) {
    res.status(SERVER_SIDE_ERROR_STATUS).type("text");
    res.send(SERVER_SIDE_ERROR_MESSAGE);
  }
});

/*
 * Returns the log-in status of the current user.
 */
app.get("/yourplan/checksignin/:netid", async (req, res) => {
  try {
    let db = await getDBConnection();
    let alreadySignedIn = await isAlreadySignedIn(req.params.netid);
    await db.close();
    res.json({"isAlreadySignedIn": alreadySignedIn});
  } catch (err) {
    res.status(SERVER_SIDE_ERROR_STATUS).type("text");
    res.send(SERVER_SIDE_ERROR_MESSAGE);
  }
});

/*
 * Returns the detailed information of the indicated course, such as its department,
 * description, and next quarter's lecture and quiz sections.
 */
app.get("/yourplan/coursedetail/:coursename", async (req, res) => {
  try {
    let coursename = req.params.coursename.replace("-", " ");
    let db = await getDBConnection();
    let data = await db.get(
      "SELECT c.course_name AS courseName, c.course_description AS description, " +
      "m.major_name AS department, c.credit FROM courses c, majors m " +
      "WHERE m.majorid = c.major AND c.course_name = ?",
      coursename
    );
    if (data) {
      let id = await db.get("SELECT courseid FROM courses WHERE course_name = ?", coursename);
      data.preRequisites = await db.all(
        "SELECT c.course_name FROM courses c, prerequisites p " +
        "WHERE p.pre_course_id = c.courseid AND p.course_id = ?",
        id.courseid
      );
      await db.close();
      data.sections = await getLectures(id.courseid);
      res.json(data);
    } else {
      await db.close();
      res.status(INVALID_USER_INPUT_ERROR_STATUS).type("text");
      res.send("Course Does Not Exist");
    }
  } catch (err) {
    res.status(SERVER_SIDE_ERROR_STATUS).type("text");
    res.send(SERVER_SIDE_ERROR_MESSAGE);
  }
});

/*
 * This endpoint updates the course cart of the current user, which either adds or
 * removes the given course (both its lecture and quiz section).
 */
app.post("/yourplan/updatecart/:isadd", async (req, res) => {
  try {
    if (req.body.netid && /^\d+$/.test(req.body.netid) && req.body.courseName && req.body.quiz &&
        req.body.lecture && (req.params.isadd === "true" || req.params.isadd === "false")) {
      let db = await getDBConnection();
      let id = parseInt(req.body.netid);
      if (await isAlreadySignedIn(id)) {
        let result = true;
        if (req.params.isadd === "true") {
          result = await addToCart(id, req.body.courseName, req.body.lecture, req.body.quiz);
        } else {
          await removeFromCart(id, req.body.courseName, req.body.lecture, req.body.quiz);
        }
        let isFull = await isSectionFull(req.body.courseName, req.body.lecture, req.body.quiz);
        await db.close();
        res.json({"ifSuccess": result, "isSectionFull": isFull});
      } else {
        await db.close();
        res.status(INVALID_USER_INPUT_ERROR_STATUS).type("text");
        res.send("Please Sign-In First");
      }
    } else {
      res.status(INVALID_USER_INPUT_ERROR_STATUS).type("text");
      res.send("Invalid netid/Course Info");
    }
  } catch (err) {
    res.status(SERVER_SIDE_ERROR_STATUS).type("text");
    res.send(SERVER_SIDE_ERROR_MESSAGE);
  }
});

/*
 * This endpoint allows the user to audit degree for this specific student given the
 * indicated major/minor. Gives information about degree completion status.
 */
app.get("/yourplan/degreeaudit/:netid/:majorname/:ismajor", async (req, res) => {
  try {
    if ((req.params.ismajor === "true" || req.params.ismajor === "false") &&
      await isValidMajor(req.params.majorname) && /^\d+$/.test(req.params.netid) &&
      await isAlreadySignedIn(parseInt(req.params.netid))) {
      let id = parseInt(req.params.netid);
      let db = await getDBConnection();
      let data = await db.get("SELECT netid, full_name FROM students WHERE netid = ?", id);
      let majorid = (await db.get(
        "SELECT majorid FROM majors WHERE major_name = ?",
        req.params.majorname
      )).majorid;
      data = await getDegreeInfo(data, majorid, req.params.ismajor === "true");
      res.json(data);
    } else {
      res.status(INVALID_USER_INPUT_ERROR_STATUS).type("text");
      res.send("Invalid Major, ID, or Action Attempted");
    }
  } catch (err) {
    res.status(SERVER_SIDE_ERROR_STATUS).type("text");
    res.send(SERVER_SIDE_ERROR_MESSAGE);
  }
});

/*
 * This endpoint sends all the courses in the given user's cart to registration. Any
 * time conflicts, missing pre-requisites, lack of available seats, not logged in, or
 * not being in the major while the course being not parts of major requirements will
 * result in failed enrollment of all courses. User netid is taken in as body parameter.
 */
app.post("/yourplan/register", async (req, res) => {
  try {
    if (req.body.netid && /^\d+$/.test(req.body.netid) &&
      await isAlreadySignedIn(parseInt(req.body.netid))) {
      let id = parseInt(req.body.netid);
      let db = await getDBConnection();
      let sections = await db.all(
        "SELECT lecture, quiz FROM nextquarter WHERE netid = ? AND registration_status = ?",
        [id, "added"]
      );
      let [isPossible, note] = await registerCheck(id, sections);
      let code = null;
      if (isPossible) {
        code = hashCode(JSON.stringify(sections));
        await register(id, code, sections);
      }
      await db.close();
      res.json({"ifSuccess": isPossible, "confirmationCode": code, "note": note});
    } else {
      res.status(INVALID_USER_INPUT_ERROR_STATUS).type("text");
      res.send("Invalid netid Or Is Not Signed In");
    }
  } catch (err) {
    res.status(SERVER_SIDE_ERROR_STATUS).type("text");
    res.send(SERVER_SIDE_ERROR_MESSAGE);
  }
});

/*
 * This endpoint returns all the contents in the given students cart for next quarter. It also
 * returns the registration history for next quarter's courses. Requires log-in.
 */
app.get("/yourplan/cart/:netid", async (req, res) => {
  try {
    if (/^\d+$/.test(req.params.netid) && await isAlreadySignedIn(parseInt(req.params.netid))) {
      let db = await getDBConnection();
      let data = {};
      let id = parseInt(req.params.netid);
      let sql = "SELECT lecture, quiz, confirmation_code FROM nextquarter " +
                "WHERE netid = ? AND registration_status = ?";
      data.added = await db.all(sql, [id, "added"]);
      data.registered = await db.all(sql, [id, "registered"]);
      data.added = await processCartData(data.added);
      data.registered = await processCartData(data.registered);
      data.added.forEach(course => {
        delete course["confirmation_code"];
      });
      await db.close();
      res.json(data);
    } else {
      res.status(INVALID_USER_INPUT_ERROR_STATUS).type("text");
      res.send("Invalid netid Or Is Not Signed In");
    }
  } catch (err) {
    res.status(SERVER_SIDE_ERROR_STATUS).type("text");
    res.send(SERVER_SIDE_ERROR_MESSAGE);
  }
});

/*
 * This endpoint returns all the past classes taken by the given student in the past
 * two years with the grades received and credits earned.
 */
app.get("/yourplan/history/:netid", async (req, res) => {
  try {
    if (/^\d+$/.test(req.params.netid) && await isAlreadySignedIn(parseInt(req.params.netid))) {
      let db = await getDBConnection();
      let id = parseInt(req.params.netid);
      let data = {};
      let sql = "SELECT c.course_name AS courseName, c.credit, h.grade " +
                "FROM history h, courses c WHERE h.course_id = c.courseid " +
                "AND h.student_id = ? AND h.school_year = ? AND h.school_quarter = ?";
      let lastYear = LAST_YEAR.toString();
      let yearBeforeLast = YEAR_BEFORE_LAST_YEAR.toString();
      data[lastYear] = {};
      data[yearBeforeLast] = {};
      data[lastYear]["winter"] = await db.all(sql, [id, LAST_YEAR, "winter"]);
      data[lastYear]["autumn"] = await db.all(sql, [id, LAST_YEAR, "autumn"]);
      data[lastYear]["spring"] = await db.all(sql, [id, LAST_YEAR, "spring"]);
      data[yearBeforeLast]["winter"] = await db.all(sql, [id, YEAR_BEFORE_LAST_YEAR, "winter"]);
      data[yearBeforeLast]["autumn"] = await db.all(sql, [id, YEAR_BEFORE_LAST_YEAR, "autumn"]);
      data[yearBeforeLast]["spring"] = await db.all(sql, [id, YEAR_BEFORE_LAST_YEAR, "spring"]);
      await db.close();
      res.json(data);
    } else {
      res.status(INVALID_USER_INPUT_ERROR_STATUS).type("text");
      res.send("Invalid netid Or Is Not Signed In");
    }
  } catch (err) {
    res.status(SERVER_SIDE_ERROR_STATUS).type("text");
    res.send(SERVER_SIDE_ERROR_MESSAGE);
  }
});

/**
 * Returns the result of checking all the requirements for registration for the given student
 * and his intended sections next quarter.
 * @param {number} id - The netid of the indicated student.
 * @param {array} sections - The list of sections to be checked.
 * @returns {Promise<array>} - The checking result in the form of [isPossible, note] in which
 * the isPossible is true if there is not problem and false otherwise, and the later indicates
 * which problem occured.
 */
async function registerCheck(id, sections) {
  if (await isTimeConflict(id)) {
    return [false, "Time Conflict Exists"];
  } else if (!(await ifCanTake(id, sections))) {
    return [false, "Not in the major or major requirements"];
  } else if (await isAnySectionFull(sections)) {
    return [false, "No Section Added to Cart/Cannot Enroll in Full Sections"];
  } else if (!(await isPrerequisiteMet(id, sections))) {
    return [false, "Prerequisites Not Met"];
  } else if (await ifDuplicate(id)) {
    return [false, "Cannot Enroll in the Same Course Multiple Times"];
  } else if (!(await checkCreditBound(id))) {
    return [false, "Credits Exceeding 18 in Total"];
  }
  return [true, "Everything Seems Great!"];
}

/**
 * Returns a list of all the lectures of the indicated course that the school offers
 * next quarter.
 * @param {number} id - The course id of the indicated course.
 * @returns {Promise<array>} - The database object for the connection.
 */
async function getLectures(id) {
  let db = await getDBConnection();
  let sections = await db.all(
    "SELECT l.section_name AS lecture, i.name AS instructor, l.start_time, l.end_time, " +
    "l.day_in_week, l.capacity, l.current_enroll AS currentEnroll, l.lectureid " +
    "FROM lectures l, courses c, instructors i " +
    "WHERE l.course = c.courseid AND i.id = l.instructor AND c.courseid = ? " +
    "ORDER BY l.section_name",
    id
  );
  for (let i = 0; i < sections.length; i++) {
    sections[i] = processSectionData(sections[i]);
    sections[i].quizzes = await getQuizzes(sections[i].lectureid);
    delete sections[i].lectureid;
  }
  await db.close();
  return sections;
}

/**
 * Returns if the given user is already signed in or not.
 * @param {number} netid - The netid of the indicated user.
 * @returns {boolean} - True if already signed in, false otherwise.
 */
async function isAlreadySignedIn(netid) {
  let db = await getDBConnection();
  let result = await db.get("SELECT * FROM signin WHERE student_id = ?", netid);
  await db.close();
  return result !== undefined;
}

/**
 * Returns a string representation of weekdays given the "integer" representation.
 * @param {string} days - The original "integer" representation of weekdays.
 * @returns {string} - The converted string representation of weekdays.
 */
function convertDay(days) {
  let result = "";
  for (let i = 0; i < days.length; i++) {
    result += DAY_IN_WEEK[parseInt(days.charAt(i)) - 1];
  }
  return result;
}

/**
 * Returns a string representation of the section time schedule given the original
 * time written in minutes counting from midnight that day.
 * @param {number} startTime - The starting minute of this section.
 * @param {number} endTime - The ending minute of this section.
 * @returns {string} - The converted string representation of schedule time.
 */
function convertTime(startTime, endTime) {
  let hour1 = Math.floor(startTime / HOUR);
  let hour2 = Math.floor(endTime / HOUR);
  let minute1 = startTime % HOUR;
  let minute2 = endTime % HOUR;
  minute1 = minute1 < MINUTE_CHECK ? "0" + minute1 : minute1;
  minute2 = minute2 < MINUTE_CHECK ? "0" + minute2 : minute2;
  let result = hour1 + ":" + minute1 + " - " + hour2 + ":" + minute2;
  return result;
}

/**
 * Returns a list of all the quiz sections of the indicated lecture that the school offers
 * next quarter.
 * @param {number} id - The lecture id of the indicated course.
 * @returns {Promise<array>} - The database object for the connection.
 */
async function getQuizzes(id) {
  let db = await getDBConnection();
  let quizzes = await db.all(
    "SELECT q.section_name AS quiz, t.name AS instructor, q.start_time, q.end_time, " +
    "q.day_in_week, q.capacity, q.current_enroll AS currentEnroll " +
    "FROM quizzes q, lectures l, tas t " +
    "WHERE q.lecture = l.lectureid AND t.id = q.instructor AND l.lectureid = ? " +
    "ORDER BY q.section_name",
    id
  );
  for (let i = 0; i < quizzes.length; i++) {
    quizzes[i] = processSectionData(quizzes[i]);
  }
  await db.close();
  return quizzes;
}

/**
 * Returns section data whose schedule and capacities are processed given original data.
 * @param {JSON} section - The original section data.
 * @returns {JSON} - The processed data.
 */
function processSectionData(section) {
  let scheduleDay = convertDay(section["day_in_week"]);
  let scheduleTime = convertTime(section["start_time"], section["end_time"]);
  section.scheduleDay = scheduleDay;
  section.scheduleTime = scheduleTime;
  if (section.capacity === INF) {
    section.capacity = "unlimited capacity";
  }
  delete section["day_in_week"];
  delete section["start_time"];
  delete section["end_time"];
  return section;
}

/**
 * Adds the given section to the cart of the indicated user. Returns whether or not
 * the adding was successful.
 * @param {number} netid - The netid of the user.
 * @param {string} course - The course name.
 * @param {string} lecture - The lecture section.
 * @param {string} quiz - The quiz section.
 * @returns {Promise<boolean>} - True if the adding was successful, false otherwise (e.g.,
 * when the section does not exist). Also true if these sections are already added.
 */
async function addToCart(netid, course, lecture, quiz) {
  if (!(await isSectionValid(course, lecture, quiz))) {
    return false;
  }
  let db = await getDBConnection();
  course = (await db.get("SELECT courseid FROM courses WHERE course_name = ?", course)).courseid;
  let alreadyExist = await db.get(
    "SELECT * FROM nextquarter n, lectures l, courses c, students s WHERE s.netid = n.netid " +
    "AND l.course = c.courseid AND n.lecture = l.lectureid AND n.netid = ? AND c.courseid = ?",
    [netid, course]
  );
  if (alreadyExist) {
    await db.close();
    return false;
  }
  lecture = (await db.get(
    "SELECT lectureid FROM lectures WHERE section_name = ? AND course = ?",
    [lecture, course]
  )).lectureid;
  quiz = (await db.get(
    "SELECT quizid FROM quizzes WHERE section_name = ? AND lecture = ?",
    [quiz, lecture]
  )).quizid;
  await db.run(
    "INSERT INTO nextquarter (netid, lecture, quiz, registration_status) VALUES (?, ?, ?, ?)",
    [netid, lecture, quiz, "added"]
  );
  await db.close();
  return true;
}

/**
 * Removes the given section from the cart of the indicated user. Does nothing
 * if provided user or section does not exist.
 * @param {number} netid - The netid of the user.
 * @param {string} course - The course name.
 * @param {string} lecture - The lecture section.
 * @param {string} quiz - The quiz section.
 */
async function removeFromCart(netid, course, lecture, quiz) {
  if (await isSectionValid(course, lecture, quiz)) {
    let db = await getDBConnection();
    course = await db.get("SELECT courseid FROM courses WHERE course_name = ?", course);
    lecture = await db.get(
      "SELECT lectureid FROM lectures WHERE section_name = ? AND course = ?",
      [lecture, course.courseid]
    );
    quiz = await db.get(
      "SELECT quizid FROM quizzes WHERE section_name = ? AND lecture = ?",
      [quiz, lecture.lectureid]
    );
    await db.run(
      "DELETE FROM nextquarter WHERE netid = ? " +
      "AND lecture = ? AND quiz = ? AND registration_status = ?",
      [netid, lecture.lectureid, quiz.quizid, "added"]
    );
    await db.close();
  }
}

/**
 * Returns whether or not the current lecture-quiz pair is already full.
 * @param {string} course - The course name.
 * @param {string} lecture - The lecture section.
 * @param {string} quiz - The quiz section.
 * @returns {Promise<boolean>} - True if the section is already full, false otherwise.
 * Also True if the provided course or section does not exist.
 */
async function isSectionFull(course, lecture, quiz) {
  if (!(await isSectionValid(course, lecture, quiz))) {
    return true;
  }
  let db = await getDBConnection();
  let lectureData = await db.get(
    "SELECT l.lectureid, l.capacity, l.current_enroll FROM lectures l, courses c " +
    "WHERE c.courseid = l.course AND l.section_name = ? AND c.course_name = ?",
    [lecture, course]
  );
  let quizData = await db.get(
    "SELECT q.capacity, q.current_enroll FROM quizzes q " +
    "WHERE q.lecture = ? AND q.section_name = ?",
    [lectureData.lectureid, quiz]
  );
  let isLectureFull = lectureData.capacity !== INF &&
                      lectureData["current_enroll"] >= lectureData.capacity;
  let isQuizFull = quizData.capacity !== INF &&
                   quizData["current_enroll"] >= quizData.capacity;
  await db.close();
  return isLectureFull || isQuizFull;
}

/**
 * Returns whether or not the given lecture-quiz pair is an existing one.
 * @param {string} course - The course name.
 * @param {string} lecture - The lecture section.
 * @param {string} quiz - The quiz section.
 * @returns {Promise<boolean>} - True if the section exists, false otherwise.
 */
async function isSectionValid(course, lecture, quiz) {
  let db = await getDBConnection();
  let lectureData = await db.get(
    "SELECT l.lectureid FROM lectures l, courses c " +
    "WHERE c.courseid = l.course AND l.section_name = ? AND c.course_name = ?",
    [lecture, course]
  );
  if (!lectureData) {
    await db.close();
    return false;
  }
  let quizData = await db.get(
    "SELECT q.quizid FROM quizzes q " +
    "WHERE q.lecture = ? AND q.section_name = ?",
    [lectureData.lectureid, quiz]
  );
  await db.close();
  return quizData !== undefined;
}

/**
 * Returns whether or not the given major exists.
 * @param {string} major - The major name.
 * @returns {Promise<boolean>} - True if the major exists, false otherwise.
 */
async function isValidMajor(major) {
  let db = await getDBConnection();
  let majorData = await db.get("SELECT * FROM majors WHERE major_name LIKE ?", major);
  await db.close();
  return majorData !== undefined;
}

/**
 * Returns the degree audition result of the given student per the indicated major.
 * The user can indicate whether its the major or minor.
 * @param {JSON} data - The student data to store the audition result to.
 * @param {number} major - The major id of the indicated major/minor.
 * @param {boolean} isMajor - True if it is major, false if it is minor.
 * @returns {Promise<JSON>} - The resultant degree audition data.
 */
async function getDegreeInfo(data, major, isMajor) {
  let db = await getDBConnection();
  let degree = isMajor ? "majorrequirements" : "minorrequirements";
  let baseSql = "SELECT c.course_name AS courseName, c.title, c.credit " +
                "FROM courses c, students s, majors m, " + degree + " r, ";
  let gradeSql = baseSql + "history h WHERE c.courseid = r.course_id AND r.major_id = m.majorid " +
                "AND s.netid = h.student_id AND h.course_id = c.courseid " +
                "AND s.netid = ? AND r.major_id = ? AND h.grade ";
  data.finished = await db.all(
    gradeSql + "> 2.0 ORDER BY c.course_name DESC",
    [data.netid, major]
  );
  data.inProgress = await db.all(
    baseSql + "nextquarter n, lectures l WHERE c.courseid = r.course_id " +
    "AND r.major_id = m.majorid AND s.netid = n.netid AND n.lecture = l.lectureid " +
    "AND l.course = c.courseid AND n.registration_status = ? AND s.netid = ? " +
    "AND r.major_id = ? ORDER BY c.course_name DESC",
    ["registered", data.netid, major]
  );
  data.failed = await db.all(
    gradeSql + "<= 2.0 ORDER BY c.course_name DESC",
    [data.netid, major]
  );
  data = await getMissingCourse(data, degree, major);
  await db.close();
  return data;
}

/**
 * Adds the missing courses needed to complete the given degree to the given student's
 * degree audition info. Also adds additional info about credits earned and missed.
 * Returns the result data.
 * @param {JSON} data - The student data to store the audition result to.
 * @param {string} degreeTable - The name of the table storing degree requirements.
 * @param {number} major - The id of the given major.
 * @returns {Promise<JSON>} - The resultant degree audition data.
 */
async function getMissingCourse(data, degreeTable, major) {
  let db = await getDBConnection();
  let needed = await db.all(
    "SELECT c.course_name AS courseName, c.title, c.credit " +
    "FROM courses c, majors m, " + degreeTable + " r " +
    "WHERE c.courseid = r.course_id AND r.major_id = m.majorid AND r.major_id = ?",
    major
  );
  needed = difference(needed, data.inProgress);
  needed = difference(needed, data.finished);
  data.stillNeeded = needed;
  await db.close();
  data.creditEarned = 0;
  data.creditNeeded = 0;
  data.creditInProgress = 0;
  data.stillNeeded.forEach(course => {
    data.creditNeeded += course.credit;
  });
  data.finished.forEach(course => {
    data.creditEarned += course.credit;
  });
  data.inProgress.forEach(course => {
    data.creditInProgress += course.credit;
  });
  return data;
}

/**
 * Returns a list of courses that appear in first array but not in second array. Both arrays
 * must be arrays of json representation of courses.
 * @param {array} arr1 - The first array.
 * @param {array} arr2 - The second array.
 * @returns {array} - The resultant difference between arr1 and arr2.
 */
function difference(arr1, arr2) {
  let diff = [];
  for (let i = 0; i < arr2.length; i++) {
    arr2[i] = JSON.stringify(arr2[i]);
  }
  for (let i = 0; i < arr1.length; i++) {
    if (!arr2.includes(JSON.stringify(arr1[i]))) {
      diff.push(arr1[i]);
    }
  }
  for (let i = 0; i < arr2.length; i++) {
    arr2[i] = JSON.parse(arr2[i]);
  }
  return diff;
}

/**
 * Returns whether or not the given student can take all the sections in the given list.
 * This is determined by the student's current major.
 * @param {number} id - The student's netid.
 * @param {array} sections - The sections to be checked.
 * @returns {Promise<boolean>} - True if the student can take all the sections, false otherwise.
 */
async function ifCanTake(id, sections) {
  let db = await getDBConnection();
  let major = (await db.get("SELECT major FROM students WHERE netid = ?", id)).major;
  for (let i = 0; i < sections.length; i++) {
    let courseID = (await db.get(
      "SELECT c.courseid FROM courses c, lectures l " +
      "WHERE l.lectureid = ? AND l.course = c.courseid",
      sections[i].lecture
    )).courseid;
    let courseMajor = await db.get("SELECT major FROM courses WHERE courseid = ?", courseID);
    courseMajor = courseMajor.major;
    let requirements = await db.all(
      "SELECT course_id FROM majorrequirements WHERE major_id = ?",
      major
    );
    let taken = await db.get(
      "SELECT * FROM history WHERE student_id = ? AND course_id = ?",
      [id, courseID]
    );
    for (let j = 0; j < requirements.length; j++) {
      requirements[j] = requirements[j]["course_id"];
    }
    if (taken || (courseMajor !== major && !requirements.includes(courseID))) {
      await db.close();
      return false;
    }
  }
  await db.close();
  return true;
}

/**
 * Returns whether or not any of the given list of sections are full.
 * @param {array} sections - The sections to be checked.
 * @returns {Promise<boolean>} - True if the any section is full, false otherwise.
 * Also true if the given list of sections is empty.
 */
async function isAnySectionFull(sections) {
  if (sections.length <= 0) {
    return true;
  }
  let db = await getDBConnection();
  for (let i = 0; i < sections.length; i++) {
    let section = sections[i];
    let lectureData = await db.get(
      "SELECT capacity, current_enroll FROM lectures " +
      "WHERE lectureid = ?",
      section.lecture
    );
    let quizData = await db.get(
      "SELECT capacity, current_enroll FROM quizzes " +
      "WHERE quizid = ?",
      section.quiz
    );
    if ((lectureData.capacity !== INF && lectureData.capacity <= lectureData["current_enroll"]) ||
        (quizData.capacity !== INF && quizData.capacity <= quizData["current_enroll"])) {
      await db.close();
      return true;
    }
  }
  await db.close();
  return false;
}

/**
 * Returns whether or not the given student has completed all the prerequisites for all the
 * courses given.
 * @param {number} id - The student's netid.
 * @param {array} sections - The sections to be checked.
 * @returns {Promise<boolean>} - True if all prerequisites met, false otherwise.
 */
async function isPrerequisiteMet(id, sections) {
  let db = await getDBConnection();
  let completed = await db.all(
    "SELECT course_id FROM history WHERE student_id = ? AND grade > 2.0",
    id
  );
  for (let i = 0; i < completed.length; i++) {
    completed[i] = completed[i]["course_id"];
  }
  for (let i = 0; i < sections.length; i++) {
    let courseId = (await db.get(
      "SELECT course FROM lectures WHERE lectureid = ?",
      sections[i].lecture
    )).course;
    let pres = await db.all(
      "SELECT pre_course_id FROM prerequisites WHERE pre_course_id IS NOT NULL " +
      "AND course_id = ?",
      courseId
    );
    for (let j = 0; j < pres.length; j++) {
      if (!completed.includes(pres[j]["pre_course_id"])) {
        await db.close();
        return false;
      }
    }
  }
  await db.close();
  return true;
}

/**
 * Returns whether or not there are any time conflicts in the list of intended sections of
 * the given student.
 * @param {number} id - The netid of the indicated student.
 * @returns {Promise<boolean>} - True if there are any time conflicts, false otherwise.
 */
async function isTimeConflict(id) {
  let db = await getDBConnection();
  let sections = await db.all("SELECT lecture, quiz FROM nextquarter WHERE netid = ?", id);
  let lSql = "SELECT start_time, end_time, day_in_week FROM lectures WHERE lectureid = ?";
  let qSql = "SELECT start_time, end_time, day_in_week FROM quizzes WHERE quizid = ?";
  for (let i = 0; i < sections.length; i++) {
    for (let j = i + 1; j < sections.length; j++) {
      let aLecture = await db.get(lSql, sections[i].lecture);
      let aQuiz = await db.get(qSql, sections[i].quiz);
      let bLecture = await db.get(lSql, sections[j].lecture);
      let bQuiz = await db.get(qSql, sections[j].quiz);
      let result = checkHelper(aLecture, aQuiz, bLecture, bQuiz);
      if (!result) {
        await db.close();
        return true;
      }
    }
  }
  await db.close();
  return false;
}

/**
 * Helper function for checking time conflicts between two lecture-quiz pairs.
 * @param {JSON} aLecture - The first lecture section.
 * @param {JSON} aQuiz - The first quiz section.
 * @param {JSON} bLecture - The second lecture section.
 * @param {JSON} bQuiz - The second quiz section.
 * @returns {boolean} - False if there are any time conflicts, true otherwise.
 */
function checkHelper(aLecture, aQuiz, bLecture, bQuiz) {
  let als = aLecture["start_time"];
  let ale = aLecture["end_time"];
  let ald = aLecture["day_in_week"];
  let aqs = aQuiz["start_time"];
  let aqe = aQuiz["end_time"];
  let aqd = aQuiz["day_in_week"];
  let bls = bLecture["start_time"];
  let ble = bLecture["end_time"];
  let bld = bLecture["day_in_week"];
  let bqs = bQuiz["start_time"];
  let bqe = bQuiz["end_time"];
  let bqd = bQuiz["day_in_week"];
  return checkTime(als, ale, ald, bls, ble, bld) && checkTime(als, ale, ald, bqs, bqe, bqd) &&
         checkTime(aqs, aqe, aqd, bls, ble, bld) && checkTime(aqs, aqe, aqd, bqs, bqe, bqd);
}

/**
 * Returns whether or not there are any duplicated courses in the list of intended sections of
 * the given student.
 * @param {number} id - The netid of the indicated student.
 * @returns {Promise<boolean>} - True if there are any duplicates, false otherwise.
 */
async function ifDuplicate(id) {
  let db = await getDBConnection();
  let courses = await db.all(
    "SELECT c.courseid FROM courses c, nextquarter n, lectures l " +
    "WHERE n.lecture = l.lectureid AND l.course = c.courseid AND n.netid = ?",
    id
  );
  let check = [];
  for (let i = 0; i < courses.length; i++) {
    let courseID = courses[i].courseid;
    if (!check.includes(courseID)) {
      check.push(courseID);
    } else {
      return true;
    }
  }
  await db.close();
  return false;
}

/**
 * Returns whether or not the credit upperbound for each quarter is satisfied by the indicated
 * user next quarter.
 * @param {number} id - The netid of the indicated student.
 * @returns {Promise<boolean>} - True if bound not exceeded, false otherwise.
 */
async function checkCreditBound(id) {
  let db = await getDBConnection();
  let courses = await db.all(
    "SELECT c.credit FROM courses c, nextquarter n, lectures l " +
    "WHERE n.lecture = l.lectureid AND l.course = c.courseid AND n.netid = ?",
    id
  );
  let sum = 0;
  for (let i = 0; i < courses.length; i++) {
    sum += courses[i].credit;
  }
  await db.close();
  return sum <= CREDIT_BOUND;
}

/**
 * Returns whether or not the given two sections have time conflicts.
 * @param {number} aStart - The start time of the first section.
 * @param {number} aEnd - The end time of the first section.
 * @param {string} aDay - The day in week of the first section.
 * @param {number} bStart - The start time of the second section.
 * @param {number} bEnd - The end time of the second section.
 * @param {string} bDay - The day in week of the second section.
 * @returns {boolean} - True if no conflicts, false otherwise.
 */
function checkTime(aStart, aEnd, aDay, bStart, bEnd, bDay) {
  aDay = parseInt(aDay);
  bDay = parseInt(bDay);
  if (aDay % 2 !== bDay % 2) {
    return true;
  }
  return !((aStart >= bStart && aStart <= bEnd) || (aStart <= bStart && aEnd >= bStart));
}

/**
 * Sends all the courses in the indicated student's cart to registration, using the given
 * confirmation_code. The registered courses are given as well to facilitate capacity change.
 * @param {number} netid - The start time of the first section.
 * @param {number} code - The end time of the first section.
 * @param {array} sections - The list of sections to be registered.
 */
async function register(netid, code, sections) {
  let db = await getDBConnection();
  await db.run(
    "UPDATE nextquarter SET registration_status = ?, confirmation_code = ? " +
    "WHERE netid = ? AND registration_status = ?",
    ["registered", code, netid, "added"]
  );
  for (let i = 0; i < sections.length; i++) {
    let lecture = sections[i].lecture;
    let quiz = sections[i].quiz;
    await db.run(
      "UPDATE lectures SET current_enroll = current_enroll + 1 WHERE lectureid = ?",
      lecture
    );
    await db.run("UPDATE quizzes SET current_enroll = current_enroll + 1 WHERE quizid = ?", quiz);
  }
  await db.close();
}

/**
 * Processes the given cart history data. Returns the modified data list in expected format.
 * @param {array} data - The given list of classes in the cart histiry.
 * @returns {Promise<array>} - The modified data list;
 */
async function processCartData(data) {
  let db = await getDBConnection();
  for (let i = 0; i < data.length; i++) {
    let course = data[i];
    let lectureid = course.lecture;
    let quizid = course.quiz;
    course.courseName = (await db.get(
      "SELECT c.course_name FROM courses c, lectures l WHERE l.course = c.courseid " +
      "AND l.lectureid = ?",
      lectureid
    ))["course_name"];
    course.lecture = await db.get(
      "SELECT l.section_name, i.name AS instructor, l.start_time, l.end_time, l.day_in_week " +
      "FROM lectures l, instructors i WHERE l.instructor = i.id AND l.lectureid = ?",
      lectureid
    );
    course.quiz = await db.get(
      "SELECT q.section_name, t.name AS instructor, q.start_time, q.end_time, q.day_in_week " +
      "FROM quizzes q, tas t WHERE q.instructor = t.id AND q.quizid = ?",
      quizid
    );
    course.lecture = processSectionData(course.lecture);
    course.quiz = processSectionData(course.quiz);
  }
  await db.close();
  return data;
}

/**
 * Returns the hash of the given string.
 * @param {string} str - The given string.
 * @returns {number} - The hash code of the given string.
 */
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = HASH_MULTIPLY * hash + str.charCodeAt(i);
  }
  return hash;
}

/**
 * Establishes a database connection to the database and returns the database object.
 * Any errors that occur should be caught in the function that calls this one.
 * @returns {Promise<sqlite3.Database>} - The database object for the connection.
 */
async function getDBConnection() {
  const db = await sqlite.open({
    filename: "yourplan.db",
    driver: sqlite3.Database
  });
  return db;
}

app.use(express.static("public"));
const PORT = process.env.PORT || PORT_NUM;
app.listen(PORT);