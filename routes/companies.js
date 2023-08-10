"use strict";
const express = require("express");

const {
  NotFoundError,
  BadRequestError,
} = require("../expressError");

const db = require("../db");
const router = new express.Router();


/** Returns JSON of all companies:
 * {companies: [{code, name}, ...]}
 */

router.get("/", async function (req, res) {
  const results = await db.query(
    `SELECT code, name
      FROM companies`
  );

  const companies = results.rows;
  return res.json({ companies });
});


/** GET /companies/[code]
 * Return obj of company: {company: {code, name, description, invoices}}
 *
 * If the company given cannot be found, this should return a 404 status response.
*/
router.get("/:code", async function (req, res) {
  const code = req.params.code;

  const companiesResults = await db.query(
    `SELECT code, name, description
      FROM companies
      WHERE code = $1`, [code]
  );
  const company = companiesResults.rows[0];
  if (!company) throw new NotFoundError(`No matching company: ${code}`);

  const invoicesResults = await db.query(
    `SELECT id
    FROM invoices
    JOIN companies ON invoices.comp_code = companies.code
    WHERE companies.code = $1`,
    [code]
    );
    const invoices = invoicesResults.rows.map(invoice => invoice.id);

    company.invoices = invoices;

  return res.json({ company });
});



/** POST /companies
 * Adds a company.
 * Needs to be given JSON like: {code, name, description}
 * Returns obj of new company: {company: {code, name, description}}
*/

router.post("/", async function (req, res) {
  if (req.body === undefined) throw new BadRequestError();

  const results = await db.query(
    `INSERT INTO companies(code, name, description)
      VALUES($1,$2,$3)
      RETURNING code, name, description`,
    [req.body.code, req.body.name, req.body.description]
  );
  console.log("results are", results);

  const company = results.rows[0];
  return res.status(201).json({ company });
});

/** PUT /companies/[code]
 * Edit existing company.

Should return 404 if company cannot be found.

Needs to be given JSON like: {name, description}

Returns update company object: {company: {code, name, description}}
*/
router.put("/:code", async function (req, res) {
  if (req.body === undefined) throw new BadRequestError("Input required");
  if ("code" in req.body) throw new BadRequestError("Not Allowed");

  const code = req.params.code;
  const results = await db.query(
    `UPDATE companies
    SET name=$1, description=$2
    WHERE code = $3
    RETURNING code,name, description
  `, [req.body.name, req.body.description, code]
  );

  console.log("results are", results);

  const company = results.rows[0];

  if (!company) throw new NotFoundError(`No matching company: ${code}`);
  return res.json({ company });
});





/**DELETE /companies/[code]
 * Deletes company.

Should return 404 if company cannot be found.

Returns {status: "deleted"}
*/

router.delete("/:code", async function (req, res) {

  const code = req.params.code;
  const results = await db.query(
    `DELETE FROM companies WHERE code = $1
    RETURNING code`, [code]
  );
  console.log("results are", results);

  const company = results.rows[0];

  if (!company) throw new NotFoundError(`No matching company: ${code}`);
  return res.json({ status: "deleted" });
});



module.exports = router;