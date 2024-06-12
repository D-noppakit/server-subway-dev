const express = require("express");
const app = express.Router();
const _ = require("lodash");
const db = require("../../dbconfig.js");

app.post("/allproduct", async (req, res) => {
  // res.send('Welcome, ' + req.user.displayName + '! ' + req.user.id + '!');
  // select  'S001' as shop_code,itemcode,th_name,en_name,th_des,en_des,depcode,catcode,price_eat_in,price_drive_thru,price_take_away,subset,itemflag,img from master_product
  let result = await db.any(`select * from master_product`);
  return res.status(200).json({ resCode: "00", result: result });
});

app.post("/allproductbyshop", async (req, res) => {
  const body = _.get(req, ["body"]);
  // console.log(body)
  try {
    let checkshopcode = await db.any(
      "SELECT shopcode FROM master_shop where shopcode = $1",
      [body.shopcode]
    );
    if (checkshopcode.length == 1) {
      checkshopcode = checkshopcode[0];
      let result = await db.any(
        `select '${checkshopcode.shopcode}' as shopcode,itemcode,th_name,en_name,th_des,en_des,depcode,catcode,price_eat_in,price_drive_thru,price_take_away,subset,itemflag,img from master_product`
      );
      let resultConditionByShop = await db.any(
        `select * from master_condition_product_by_shop where shopcode = $1`,
        [checkshopcode.shopcode]
      );
      let uniqueProductByShop = await db.any(
        `select * from master_condition_product_by_shop where shopcode = $1`,
        [checkshopcode.shopcode]
      );
      resultConditionByShop.forEach(element => {
        // console.log(element);
        let indexItem = result.findIndex(
          master => master.itemcode === element.itemcode
        );

        result[indexItem].itemflag = element.itemflag;
        result[indexItem].price_eat_in = element.price_eat_in;
        result[indexItem].price_drive_thru = element.price_drive_thru;
        result[indexItem].price_take_away = element.price_take_away;
      });
      let resultItemSet = await db.any(`select * from master_set_product`);
      // console.log("resultItemSet",resultItemSet)

      const groupedResult = resultItemSet.reduce((acc, item) => {
        if (!acc[item.itemcode]) {
          acc[item.itemcode] = {};
        }
        const groupKey = `group${item.suborder}`;
        if (!acc[item.itemcode][groupKey]) {
          acc[item.itemcode][groupKey] = {
            listitem: [],
            min: item.min,
            max: item.max,
            need: item.need
          };
        }
        acc[item.itemcode][groupKey].listitem.push({
          subitemcode: item.subitemcode,
          addon: item.addon
        });
        return acc;
      }, {});
      // console.log("resultConditionByShop",resultConditionByShop)
      return res.status(200).json({ code: "200", result, groupedResult });
    } else {
      return res.status(400).json({ code: "400", ms: "not found" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ code: "500" });
  }
});

module.exports = app;
