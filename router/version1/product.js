const express = require("express");
const app = express.Router();
const _ = require("lodash");
const db = require("../../dbconfig.js");
var masterItem;

const getMasterItem = async () => {
  masterItem = await db.any(`select * from master_product`);
}

getMasterItem();
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
      // let uniqueProductByShop = await db.any(
      //   `select * from master_condition_product_by_shop where shopcode = $1`,
      //   [checkshopcode.shopcode]
      // );
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

app.post("/byshop/promotionhotdeal", async (req, res) => {
  const body = _.get(req, ["body"]);
  try {
    let shopcode = body.shopcode

    let resultproduct = await db.any(`SELECT * FROM master_container where order_row = 1 or order_row = 2`, [])

    let result = masterItem.map(obj => ({
      ...obj,
      shop: shopcode
    }));
    // let result = await db.any(
    //   `select '${shopcode}' as shopcode,itemcode,th_name,en_name,th_des,en_des,depcode,catcode,price_eat_in,price_drive_thru,price_take_away,subset,itemflag,img from master_product`
    // );
    let resultConditionByShop = await db.any(
      `select * from master_condition_product_by_shop where shopcode = $1`,
      [shopcode]
    );
    // let uniqueProductByShop = await db.any(
    //   `select * from master_condition_product_by_shop where shopcode = $1`,
    //   [shopcode]
    // );
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
          need: item.need,
          selectType: item.min == 1 && item.min == item.max ? 'radiobox' : 'checkbox'
        };
      }
      let detailItem = result.find(master => item.subitemcode == master.itemcode)
      acc[item.itemcode][groupKey].listitem.push({
        subitemcode: item.subitemcode,
        addon: item.addon,
        price: detailItem.price_eat_in,
        nameth: detailItem.th_name,
        nameen: detailItem.en_name,
      });
      return acc;
    }, {});

    let fresult = {
      promo: [],
      hotdeal: []
    }
    for (let index = 0; index < resultproduct.length; index++) {
      const element = resultproduct[index];
      for (let index2 = 0; index2 < element.list_data.length; index2++) {
        const element2 = element.list_data[index2];

        let detailItem = result.find(
          master => master.itemcode === element2.sku
        );
        if (detailItem.subset === true && groupedResult.hasOwnProperty(element2.sku)) {
          detailItem.listitem = groupedResult[element2.sku]

        }
        if (element.order_row == 1) {
          fresult.promo.push(detailItem)
        } else {
          fresult.hotdeal.push(detailItem)

        }

      }

    }

    // let fresult = {
    //   promo: [{
    //     sku: "P1000001",
    //     img: "https://food-cms.grab.com/compressed_webp/items/THITE20240607080025016805/detail/82c26e861b79475cb74190bbaf4bea4c_1717747218967453958.webp",
    //   },
    //   {
    //     sku: "P1000002",
    //     img: "https://food-cms.grab.com/compressed_webp/items/THITE20240607075930013388/detail/9172713af7374cb097114934449e8b3c_1717747164249709620.webp",
    //   },
    //   {
    //     sku: "P1000003",
    //     img: "https://food-cms.grab.com/compressed_webp/items/THITE20240607075825018924/detail/45a779cbd587486aaef1d9241362a05a_1717747072851149451.webp",
    //   },
    //   {
    //     sku: "P1000004",
    //     img: "https://food-cms.grab.com/compressed_webp/items/THITE20240128035142011235/detail/0b34a8a4007449f7b717fac451e69c7d_1706855210155914822.webp",
    //   }],
    //   hotdeal: [
    //     {
    //       sku: "P1000004",
    //       img: "https://food-cms.grab.com/compressed_webp/items/THITE20240128035142011235/detail/0b34a8a4007449f7b717fac451e69c7d_1706855210155914822.webp",
    //       title: "Tuna Sandwich Box Set GrabBox 🍱",
    //       des: "ทูน่าบ็อกเซต ประกอบด้วย แซนด์วิชทูน่า 6 นิ้ว 1 ชิ้น,วาฟเฟิลฟรายส์ 1 ถุง และเครื่องดื่ม 22 ออนซ์ 1 แก้ว",
    //       price: 239.00,
    //       full_price: 265.00
    //     },
    //     {
    //       sku: "P1000004",
    //       img: "https://food-cms.grab.com/compressed_webp/items/THITE20240128035041010045/detail/689cf24eb22b4a2794ba46446644ebb5_1706855230751714235.webp",
    //       title: "Subway Melt Sandwich Box Set GrabBox 🍱",
    //       des: "ซับเวย์เม้ลท์บ็อกเซต ประกอบด้วย ซับเวย์เม้ล 6 นิ้ว 1 ชิ้น,วาฟเฟิลฟรายส์ 1 ถุง และเครื่องดื่ม 22 ออนซ์ 1 แก้ว",
    //       price: 279.00,
    //       full_price: 315.00
    //     }
    //   ]
    // }

    return res.status(200).json({ ms: "good", result: fresult });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ code: "500" });
  }
})

app.post("/byshop/getList", async (req, res) => {
  const body = _.get(req, ["body"]);
  try {
    let shopcode = body.shopcode
    let result = masterItem.map(obj => ({
      ...obj,
      shop: shopcode
    }));
    const { DateTime } = require('luxon');
    var dt = DateTime.now().setZone("Asia/Bangkok");
    // console.log("date", dt.toFormat('yyyy-MM-dd'))
    // console.log("time", dt.toFormat('HH:mm:ss'))
    let resultConditionByShop = await db.any(
      `select * from master_condition_product_by_shop where shopcode = $1`,
      [shopcode]
    );
    resultConditionByShop.forEach(element => {
      let indexItem = result.findIndex(
        master => master.itemcode === element.itemcode
      );
      result[indexItem].itemflag = element.itemflag;
      result[indexItem].price_eat_in = element.price_eat_in;
      result[indexItem].price_drive_thru = element.price_drive_thru;
      result[indexItem].price_take_away = element.price_take_away;
    });

    result = result.filter((x) => x.itemflag == true)
    let resultGroup = await db.any(`select container_name_th,container_name_en,list_data,icon,text_color,con_type
      from master_container 
      where start_date < $1 and end_date > $1 and time_start < $2 and end_time > $2
      order by order_row
    `, [dt.toFormat('yyyy-MM-dd'), dt.toFormat('HH:mm:ss')])
    for (let index = 0; index < resultGroup.length; index++) {
      const element = resultGroup[index];
      for (let index2 = 0; index2 < element.list_data.length; index2++) {
        const element2 = element.list_data[index2];
        let item = masterItem.find(x => element2.sku == x.itemcode)

        resultGroup[index].list_data[index2].price = item.price_eat_in
        resultGroup[index].list_data[index2].img = item.img
        resultGroup[index].list_data[index2].th_name = item.th_name
        resultGroup[index].list_data[index2].en_name = item.en_name
      }
    }
    // console.log("result",result)
    return res.status(200).json({ ms: "good", result: resultGroup });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ code: "500" });
  }
})

app.post("/byshop/itemdetail", async (req, res) => {
  const body = _.get(req, ["body"]);
  try {
    let shopcode = body.shopcode
    let result = masterItem.map(obj => ({
      ...obj,
      shop: shopcode
    }));
    let item = result.find((e) => (body.item == e.itemcode))
    let resultConditionByShop = await db.any(
      `select * from master_condition_product_by_shop where shopcode = $1`,
      [shopcode]
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


    if (item.subset == true) {
      let resultItemSet = await db.any(`select * from master_set_product where itemcode = $1`, [item.itemcode]);
      // old version
      // const groupedResult = resultItemSet.reduce((acc, item) => {
      //   if (!acc[item.itemcode]) {
      //     acc[item.itemcode] = {};
      //   }
      //   const groupKey = `group${item.suborder}`;
      //   if (!acc[item.itemcode][groupKey]) {
      //     acc[item.itemcode][groupKey] = {
      //       listitem: [],
      //       min: item.min,
      //       max: item.max,
      //       need: item.need,
      //       type: parseInt(item.min) == 1 && parseInt(item.max) == parseInt(item.min) ? 'radio' : 'checkbox',
      //       gropname:  `group${item.suborder}`
      //     };
      //   }
      //   let detail = result.find((e)=>e.itemcode == item.subitemcode)
      //   acc[item.itemcode][groupKey].listitem.push({
      //     subitemcode: item.subitemcode,
      //     addon: item.addon,
      //     recommend: item.recommend,
      //     price: detail.price_eat_in,
      //     th_name: detail.th_name,
      //     en_name: detail.en_name
      //   });
      //   return acc;
      // }, {});
      // const sortedData = Object.keys(groupedResult[item.itemcode])
      //   .filter(key => key.startsWith('group'))
      //   .sort((a, b) => parseInt(a.slice(5)) - parseInt(b.slice(5)))
      //   .reduce((result, key) => {
      //     result[key] = groupedResult[item.itemcode][key];
      //     return result;
      //   }, {});
      // item.subitem = sortedData

      // new version
      const groupedResult = resultItemSet.reduce((acc, item) => {
        if (!acc[item.itemcode]) {
          acc[item.itemcode] = [];
        }
        let groupname = `group${item.suborder}`

        if (!acc[item.itemcode].find(x=>x.groupname == groupname) ) {
          let obj = {
            groupname: `group${item.suborder}`,
            listitem: [],
            min: item.min,
            max: item.max,
            need: item.need,
            type: parseInt(item.min) == 1 && parseInt(item.max) == parseInt(item.min) ? 'radio' : 'checkbox',
          }
          acc[item.itemcode].push(obj)
        }
        let detail = result.find((e)=>e.itemcode == item.subitemcode)
        let curIndex = acc[item.itemcode].findIndex(x=>x.groupname == groupname)
        acc[item.itemcode][curIndex].listitem.push({
          subitemcode: item.subitemcode,
          addon: item.addon,
          recommend: item.recommend,
          price: detail.price_eat_in,
          th_name: detail.th_name,
          en_name: detail.en_name
        });
        return acc;
      }, {});

      const sortedData = groupedResult[item.itemcode].sort((a, b) => {
        if (a.groupname < b.groupname) {
          return -1;
        }
        if (a.groupname > b.groupname) {
          return 1;
        }
        return 0;
      });
      
      // console.log(sortedData);
      // console.log("groupedResult",groupedResult)
      item.subitem = sortedData

      return res.status(200).json({ ms: "good", result: item });

    }




  } catch (error) {
    console.log(error);
    return res.status(500).json({ code: "500" });
  }
})

app.post("/byshop/getcat", async (req, res) => {
  const body = _.get(req, ["body"]);
  try {
    const { DateTime } = require('luxon');
    var dt = DateTime.now().setZone("Asia/Bangkok");
    // console.log("date", dt.toFormat('yyyy-MM-dd'))
    // console.log("time", dt.toFormat('HH:mm:ss'))
    let resultGroup = await db.any(`select container_name_th,container_name_en,list_data,icon,text_color,con_type
      from master_container 
      where start_date < $1 and end_date > $1 and time_start < $2 and end_time > $2
      order by order_row
    `, [dt.toFormat('yyyy-MM-dd'), dt.toFormat('HH:mm:ss')])

    return res.status(200).json({ ms: "good", result: resultGroup });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ code: "500" });
  }
})

module.exports = app;
