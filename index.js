const puppeteer = require("puppeteer");

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

  departments.forEach((department) => {
    console.log(department);
  });

  // Fill form
  await page.select("[id='formTurma:inputNivel']", "G");
  await page.select("[id='formTurma:inputDepto']", "673");
  await page.type("[id='formTurma:inputAno']", "2020");
  await page.select("[id='formTurma:inputPeriodo']", "2");

  // Click on search button
  await page.click("[value='Buscar']");

  // Get courses data

  await browser.close();
})();
