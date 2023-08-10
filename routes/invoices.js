"use strict";
const express = require("express");

const {
  NotFoundError,
  BadRequestError,
} = require("../expressError");

const db = require("../db");
const { route } = require("../app");
const router = new express.Router();


/**GET /invoices
Return info on invoices: like {invoices: [{id, comp_code}, ...]} */
router.get("/", async function (req, res) {
  const results = await db.query(
    `SELECT id, comp_code
      FROM invoices
      ORDER BY id`
  );

  const invoices = results.rows;
  return res.json({ invoices });
});


/**GET /invoices/[id]
Returns obj on given invoice.

If invoice cannot be found, returns 404.

Returns {invoice:
  {id, amt, paid, add_date, paid_date, company: {code, name, description}}  */
router.get("/:id", async function (req, res) {
  const id = req.params.id;

  const invoiceResults = await db.query(
    `SELECT id, amt, paid, add_date, paid_date, comp_code
      FROM invoices
      WHERE id = $1`, [id]
  );
  const invoice = invoiceResults.rows[0];
  if (!invoice) throw new NotFoundError(`No matching company: ${id}`);//todo company

  const companyResults = await db.query(
    `SELECT code, name, description
      FROM companies
      WHERE code = $1`, [invoice.comp_code]
  );
  const company = companyResults.rows[0];
  invoice.company = company;

  return res.json({ invoice });
});



/**POST /invoices
Adds an invoice.

Needs to be passed in JSON body of: {comp_code, amt}

Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}} */
router.post("/", async function (req, res) {
  if (req.body === undefined) throw new BadRequestError();

  const comp_code = req.body.comp_code;
  const amt = req.body.amt;

  const results = await db.query(
    `INSERT INTO invoices(comp_code, amt)
      VALUES($1,$2)
      RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [comp_code, amt]
  );

  const invoice = results.rows[0];
  return res.status(201).json({ invoice });
});



/** PUT /invoices/[id]
Updates an invoice.

If invoice cannot be found, returns a 404.

Needs to be passed in a JSON body of {amt}

Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}*/
router.put("/:id", async function (req, res) {
  if (req.body === undefined) throw new BadRequestError("Input required");
  if ("id" in req.body) throw new BadRequestError("Not Allowed");

  const id = req.params.id;
  const amt = req.body.amt;
  const results = await db.query(
    `UPDATE invoices
    SET amt=$1
    WHERE id = $2
    RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [amt, id]
  );

  const invoice = results.rows[0];

  if (!invoice) throw new NotFoundError(`No matching company: ${id}`);
  return res.json({ invoice });
});



/** DELETE /invoices/[id]
Deletes an invoice.

If invoice cannot be found, returns a 404.

Returns: {status: "deleted"} */
router.delete("/:id", async function (req, res) {

  const id = req.params.id;
  const results = await db.query(
    `DELETE FROM invoices WHERE id = $1
    RETURNING id`, [id]
  );
  console.log("results are", results.rows);

  const invoice = results.rows[0];

  if (!invoice) throw new NotFoundError(`No matching invoice: ${id}`);
  return res.json({ status: "deleted" });
});




module.exports = router;