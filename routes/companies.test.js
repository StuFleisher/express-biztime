"use strict";


const request = require("supertest");

const app = require("../app");
const db = require("../db");

let testCompany;

beforeEach(async function () {
  await db.query("DELETE FROM companies");
  let result = await db.query(`
    INSERT INTO companies (code, name, description)
    VALUES ('Rithm', 'Rithm', 'bootcamp')
    RETURNING code, name, description`);
  testCompany = result.rows[0];
});

/** Test GET /companies
 * returns {companies: [{code, name}, ...]}
 */

describe("GET /companies", function () {
  test("Gets all companies", async function () {
    const resp = await request(app).get(`/companies`);
    expect(resp.body).toEqual({ companies: [{ code: "Rithm", name: "Rithm" }] });
    expect(resp.statusCode).toEqual(200);
  });
});

/** Test GET /companies/[code]
 * returns {company: {code, name, description, invoices}} or 404
 */

describe("GET /companies/:code", function () {
  test("Gets a single company", async function () {
    const resp = await request(app).get(`/companies/${testCompany.code}`);
    expect(resp.body).toEqual({
      company: {
        "code": "Rithm",
        "name": "Rithm",
        "description": "bootcamp",
        "invoices": []
      }
    });
  });

  test("404 if not found", async function () {
    const resp = await request(app).get(`/companies/apple`);
    expect(resp.statusCode).toEqual(404);
  });
});

/** Test POST /companies/[code]
 * creates new company on database
 * returns {company: {code, name, description}} with 201 or BadRequestError
 */

describe("POST /companies", function () {
  test("Create new company", async function () {
    const resp = await request(app)
      .post(`/companies`)
      .send({ code: "Microsoft", name: "Microsoft", description: "Windows" });
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      company: { code: "Microsoft", name: "Microsoft", description: "Windows" },
    });

    // test db
    const result = await db.query(
      `SELECT *
        FROM companies`
    );
    expect(result.rows.length).toEqual(2);
  });
  // end

  test("400 if empty request body", async function () {
    const resp = await request(app)
      .post(`/companies`)
      .send();
    expect(resp.statusCode).toEqual(400);
  });
});

/** Test PUT /companies/[code]
 * updates a company on database
 * returns {company: {code, name, description}} or BadRequestError or 404
 */

describe("PUT /companies/:code", function () {
  test("Update single company", async function () {
    const resp = await request(app)
      .put(`/companies/${testCompany.code}`)
      .send({ name: "Rithm", description: "Great bootcamp!" });
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      company: { code: "Rithm", name: "Rithm", description: "Great bootcamp!" },
    });

    // test db
    console.log("company code", testCompany.code)
    const result = await db.query(
      `SELECT code, name, description
        FROM companies
        WHERE code = $1`, [testCompany.code]);
    expect(result.rows.length).toEqual(1);

    expect(result.rows[0].description).toEqual("Great bootcamp!");
  });
  // end

  test("PUT 404 if not found", async function () {
    const resp = await request(app)
      .put(`/companies/oracle`)
      .send({ name: "Oracle" });
    expect(resp.statusCode).toEqual(404);
  });

  test("PUT 400 if empty request body", async function () {
    const resp = await request(app)
      .put(`/companies/${testCompany.code}`)
      .send();
    expect(resp.statusCode).toEqual(400);
  });
});

/** Test DELETE /companies/[code]
 * deletes a company from database
 * returns {status: "deleted"} or 404
 */

describe("DELETE /companies/:code", function () {
  test("Delete single company", async function () {
    const resp = await request(app)
        .delete(`/companies/${testCompany.code}`);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({ status: "deleted" });

    // test db
    const result = await db.query(
      `SELECT * FROM companies`);
    expect(result.rows.length).toEqual(0);
  });
});
// end


afterAll(async function () {
  // close db connection
  await db.end();
});





