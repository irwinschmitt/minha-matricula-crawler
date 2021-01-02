const puppeteer = require("puppeteer");
var fs = require("fs");

async function goToDepartment(page, department) {
  console.log(`(${department.id}) ${department.title}`);

  await page.evaluate(
    ({ id }) => {
      document.getElementById("formTurma:inputNivel").value = "G";
      document.getElementById("formTurma:inputDepto").value = id;
      document.getElementById("formTurma:inputAno").value = "2020";
      document.getElementById("formTurma:inputPeriodo").value = "2";
    },
    { id: department.id }
  );

  await Promise.all([page.click("[value='Buscar']"), page.waitForNavigation()]);

  const courses = await page.evaluate(() => {
    const linesArray = Array.from(document.querySelectorAll("tr"));

    return linesArray.map(({ className, innerText, textContent }) => {
      if (className === "agrupador") {
        return {
          parent: true,
          id: innerText.split(" ")[1],
          title: innerText.split(" - ")[1],
        };
      } else if (className.includes("linha")) {
        var hour = textContent
          .split(
            "\n\t\t\t\t\t\t\t\t\t\t\t\n\n\t\n\t\t\n\n\t\t\t\t\t\t\t\t\t\t\t"
          )[1]
          .split(
            "  \n\t\t\t\t\t\t\t\t\t\t\t\n\n\n\t\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\t \n\t\t\t\t\t\t\t\t\t"
          )[0];

        var re = new RegExp("([A-Z]+)", "g");
        hour = hour.replace(re, " $ $1");
        var mapObj = {
          " às ": "–",
          ":00": "h",
          ":": "h",
          "Segunda-feira": "seg",
          "Terça-feira": "ter",
          "Quarta-feira": "qua",
          "Quinta-feira": "qui",
          "Sexta-feira": "sex",
          Sábado: "sáb",
          Domingo: "dom",
        };

        var re = new RegExp(Object.keys(mapObj).join("|"), "gi");

        hour = hour.replace(re, (matched) => mapObj[matched]);
        hour = hour.split(" $ ").slice(1).join(", ");

        return {
          parent: false,
          id: innerText.split("\t")[0],
          period: innerText.split("\t")[1],
          professor: innerText.split("\t")[2].split(" (")[0],
          timeLoad: innerText.split("\t")[2].split("(").pop().split("h)")[0],
          hour,
        };
      }
    });
  });

  const coursesFormatted = {
    courses: [],
    classes: [],
  };
  var index = -1;
  courses.forEach((element) => {
    if (!element) return;

    if (element.parent) {
      index++;
      coursesFormatted.courses.push({
        courseId: element.id,
        title: element.title,
        departmentId: department.id,
        departmentTitle: department.title,
      });
    } else {
      coursesFormatted.classes.push({
        classId: element.id,
        courseId: coursesFormatted.courses[index].courseId,
        period: element.period,
        professor: element.professor,
        timeLoad: element.timeLoad,
        hour: element.hour,
      });
    }
  });

  return coursesFormatted;
}

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://sig.unb.br/sigaa/public/turmas/listar.jsf");

  // Get array of departments with value and label
  const departmentsSelector = "[id='formTurma:inputDepto'] option";

  const departments = await page.$$eval(departmentsSelector, (e) =>
    e.map(({ value, label }) => ({
      id: value,
      title: label,
    }))
  );

  var allCourses = [];
  var allClasses = [];
  // for (let i = 1; i < departments.length; i++) {
  for (let i = 4; i < 7; i++) {
    var { courses, classes } = await goToDepartment(page, departments[i]);
    allCourses = allCourses.concat(courses);
    allClasses = allClasses.concat(classes);
  }

  const jsonCourses = JSON.stringify(allCourses);
  fs.writeFile(
    "courses.json",
    jsonCourses,
    (error) => !error ?? console.log(error)
  );

  const jsonClasses = JSON.stringify(allClasses);
  fs.writeFile(
    "classes.json",
    jsonClasses,
    (error) => !error ?? console.log(error)
  );

  await browser.close();
})();
