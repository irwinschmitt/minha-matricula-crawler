const puppeteer = require("puppeteer");
var fs = require("fs");

function formatHour(textContent) {}

async function goToDepartment(page, department) {
  console.log(department.id);
  console.log(department.title);

  await page.select("[id='formTurma:inputNivel']", "G");
  await page.select("[id='formTurma:inputDepto']", department.id);
  await page.type("[id='formTurma:inputAno']", "2020");
  await page.select("[id='formTurma:inputPeriodo']", "2");

  await page.click("[value='Buscar']");

  await page.waitForTimeout(3000);

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

  const coursesFormatted = [];
  var index = -1;
  courses.forEach((element) => {
    if (!element) return;

    if (element.parent) {
      index++;
      coursesFormatted.push({
        id: element.id,
        title: element.title,
        classes: [],
      });
    } else {
      coursesFormatted[index].classes.push({
        id: element.id,
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

  const departmentsFormatted = [];

  // for (let i = 1; i < departments.length; i++) {
  for (let i = 4; i < 5; i++) {
    // const departmentInfo = await goToDepartment(page, departments[i]);

    departmentsFormatted.push({
      id: departments[i].id,
      title: departments[i].title,
      courses: await goToDepartment(page, departments[i]),
    });
  }

  // courses.forEach((element) => {
  //   console.log(element);
  // });

  const jsonCourses = JSON.stringify(departmentsFormatted);
  fs.writeFile("data.json", jsonCourses, (error) => {
    if (error) {
      console.log(error);
    }
  });

  await browser.close();
})();
