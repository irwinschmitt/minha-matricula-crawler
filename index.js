const puppeteer = require("puppeteer");

async function goToDepartment(page, departmentId) {
  console.log(departmentId);

  await page.select("[id='formTurma:inputNivel']", "G");
  await page.select("[id='formTurma:inputDepto']", departmentId);
  await page.type("[id='formTurma:inputAno']", "2020");
  await page.select("[id='formTurma:inputPeriodo']", "2");

  await page.click("[value='Buscar']");

  await page.waitForTimeout(3000);

  const courses = await page.evaluate(() => {
    const linesArray = Array.from(document.querySelectorAll("tr"));

    return linesArray.map(({ className, innerText }) => {
      if (className === "agrupador") {
        return {
          parent: true,
          id: innerText.split(" ")[1],
          title: innerText.split(" - ")[1],
        };
      } else if (className.includes("linha")) {
        return {
          parent: false,
          id: innerText.split("\t")[0],
          period: innerText.split("\t")[1],
          professor: innerText.split("\t")[2].split(" (")[0],
          timeLoad: innerText.split("\t")[2].split("(").pop().split("h)")[0],
          hourCode: innerText.split("\t")[3].replace(" \n", ""),
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
        hourCode: element.hourCode,
      });
    }
  });

  coursesFormatted.forEach((element) => {
    console.log(element);
  });
}

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://sig.unb.br/sigaa/public/turmas/listar.jsf");

  // Get array of departments with value and label
  const departmentsSelector = "[id='formTurma:inputDepto'] option";

  const departments = await page.$$eval(departmentsSelector, (e) =>
    e.map(({ value, label }) => ({
      value,
      label,
    }))
  );

  // for (let i = 1; i < departments.length; i++) {
  for (let i = 4; i < 5; i++) {
    await goToDepartment(page, departments[i].value);
  }

  await browser.close();
})();
