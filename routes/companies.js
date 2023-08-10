"use strict";
const express = require("express");

const {
  ExpressError,
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
  ForbiddenError,
} = require("../expressError");

const db = require("../db");
const { request } = require("http");
const router = new express.Router();


/** Returns JSON of all companies:
 * {companies: [{code, name}, ...]}
 */

router.get("/", async function (req, res) {
  const results = await db.query(`
    SELECT code, name
    FROM companies
  `);

  const companies = results.rows;
  return res.json({ companies });
});


/** GET /companies/[code]
 * Return obj of company: {company: {code, name, description}}
 *
 * If the company given cannot be found, this should return a 404 status response.
*/
router.get("/:code", async function (req, res) {
  const code = req.params.code;

  const results = await db.query(`
    SELECT code, name, description
    FROM companies
    WHERE code = $1
  `, [code]);

  const company = results.rows[0];
  return res.json({ company });
});



/** POST /companies
 * Adds a company.
 * Needs to be given JSON like: {code, name, description}
 * Returns obj of new company: {company: {code, name, description}}
*/

router.post("/", async function (req, res) {
  if (req.body === undefined) throw new BadRequestError()

  const results = await db.querty(`
  INSERT INTO companies(code, name, description)
  VALUES($1,$2,$3)
  RETURN code, name, description
  `, [req.body.code, req.body.name, req.body.description]);

  const company = results.rows[0];
  return res.status(201).json({ company });
})

/** PUT /companies/[code]
 * Edit existing company.

Should return 404 if company cannot be found.

Needs to be given JSON like: {name, description}

Returns update company object: {company: {code, name, description}}
*/




/**DELETE /companies/[code]
 * Deletes company.

Should return 404 if company cannot be found.

Returns {status: "deleted"}
*/

module.exports = router;