const express = require("express"); // responsible for handling http requests
const sqlite = require("sqlite");
const bodyParser = require("body-parser");

const path = require("path");

const app = express(); // new express application

const dbConnection = sqlite.open(
  path.resolve(__dirname, "db", "banco.sqlite"),
  { Promise }
);
const port = process.env.PORT || 3000; // port being listened, 80:http, 443:https

app.use("/admin", (req, res, next) => {
  if (req.hostname === "localhost") next();
  else res.send("Not Allowed");
});

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public"))); // use public if route not defined
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
  const db = await dbConnection;
  const categoriasDb = await db.all("select * from categorias;");
  const vagas = await db.all("select * from vagas;");
  const categorias = categoriasDb.map(c => {
    return {
      ...c,
      vagas: vagas.filter(v => v.categoria === c.id)
    };
  });
  res.render("home", { categorias });
});
app.get("/vaga/:id", async (req, res) => {
  const db = await dbConnection;
  const vaga = await db.get(
    `select * from vagas where id = '${req.params.id}'`
  );
  res.render("vaga", { vaga });
});

app.get("/admin", (req, res) => {
  res.render("admin/home");
});

app.get("/admin/vagas", async (req, res) => {
  const db = await dbConnection;
  const vagas = await db.all("select * from vagas;");
  res.render("admin/vagas", { vagas });
});

app.get("/admin/vagas/delete/:id", async (req, res) => {
  const db = await dbConnection;
  await db.run(`delete from vagas where id = '${req.params.id}';`);
  res.redirect("/admin/vagas");
});

app.get("/admin/vagas/nova", async (req, res) => {
  const db = await dbConnection;
  const categorias = await db.all("select * from categorias;");
  res.render("admin/nova-vaga", { categorias });
});

app.post("/admin/vagas/nova", async (req, res) => {
  const db = await dbConnection;
  const { titulo, descricao, categoria } = req.body;
  await db.run(
    `insert into vagas(categoria, titulo, descricao) values(${categoria}, '${titulo}', '${descricao}');`
  );
  res.redirect("/admin/vagas");
});

app.get("/admin/vagas/editar/:id", async (req, res) => {
  const db = await dbConnection;
  const categorias = await db.all("select * from categorias;");
  const vaga = await db.get(`select * from vagas where id=${req.params.id}`);
  res.render("admin/editar-vaga", { categorias, vaga });
});

app.post("/admin/vagas/editar/:id", async (req, res) => {
  const db = await dbConnection;
  const { titulo, descricao, categoria } = req.body;
  const { id } = req.params;
  await db.run(
    `update vagas set categoria=${categoria}, titulo='${titulo}', descricao='${descricao}' where id = ${id};`
  );
  res.redirect("/admin/vagas");
});

const init = async _ => {
  const db = await dbConnection;
  await db.run(
    "create table if not exists categorias (id INTEGER PRIMARY KEY, categoria TEXT);"
  );
  await db.run(
    "create table if not exists vagas (id INTEGER PRIMARY KEY, categoria INTEGER, titulo TEXT, descricao TEXT);"
  );
  // const categoria = "Engineering team";
  // const categoria = "Marketing team";
  // await db.run(`insert into categorias(categoria) values('${categoria}');`);

  // const vaga = "Frontend Developer (Remote)";
  // const descricao = "Vaga para Frontend Developer";
  // const vaga = "Marketing Digital (San Francisco)";
  // const descricao = "Vaga para Marketing Digital em San Francisco";
  // await db.run(
  // `insert into vagas(categoria, titulo, descricao) values(1, '${vaga}', '${descricao}');`
  // );
};

init();

app.listen(port, err => {
  if (err) console.log("Unable to start Jobify server");
  else console.log(`Jobify server running at port: ${port}`);
});
