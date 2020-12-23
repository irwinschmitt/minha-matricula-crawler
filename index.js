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

  await browser.close();
})();
