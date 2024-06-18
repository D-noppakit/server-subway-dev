const express = require('express');
const app = express.Router();

const db = require('../../dbconfig.js');

const _ = require("lodash");
const e = require('express');
const axios = require('axios');
const crypto = require('crypto');

var CryptoJS = require("crypto-js");


app.post('/subway/checkphone', (req, res) => {
    try {
        var phoneno = _.get(req, ["body", "phoneno"]);

        if(phoneno)
        {
            let data = JSON.stringify({
            "CardNo": "",
            "CitizenId": "",
            "PhoneNo": phoneno
            });
        
            var config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: 'https://crm-apim-services.pt.co.th/prd-mloyalty/api/Card/ListInfo',
                headers: { 
                    'req-key': '9b86bc9f9e46498c9b3ac3fe89ffac03', 
                    'Content-Type': 'application/json', 
                    'Cookie': 'ApplicationGatewayAffinity=876b491d42740456397805a2f74698fc; ApplicationGatewayAffinityCORS=876b491d42740456397805a2f74698fc'
                },
                data : data
            };
              
        
            axios.request(config)
            .then((response) => {
                console.log('response',response.data)
                if(response.data.responseCode == '00')
                {
                    var listinfo = response.data.resultModel.cardIdInfo;
                    var obj = {};
                    for (let i = 0; i < listinfo.length; i++) {
                        const element = listinfo[i];
                        if(element.cardStatus  == "I" ) {
                          obj = element;
                          break;
                        }
                    }
                    var maxmeWallet = obj.maxmeWallet;
                    var cardNo_pdpa = obj.cardNo_pdpa;

                    return res.status(200).json({
                        RespCode: 200,
                        RespMessage: "Success",
                        flag_maxcard : 'Y',
                        flag_maxme : maxmeWallet ,
                        cardNo_pdpa : cardNo_pdpa
                    });
                }
                else
                {
                    return res.status(200).json({
                        RespCode: 200,
                        RespMessage: "Success",
                        flag_maxcard : 'N',
                        flag_maxme : 'N'
                    });
                }
            })
            .catch((error) => {
                console.log(error)
                return res.status(200).json({
                    RespCode: 500,
                    RespMessage: "system error",
                });
            });
        }
    } catch (error) {
        return res.status(200).json({
            RespCode: 500,
            RespMessage: "system error",
        });    
    }
});

app.post('/subway/sendotp', (req, res) => {
    try {

        Date.prototype.addHours = function (h) {
            this.setHours(this.getHours() + h);
            return this;
        };

        var phoneno = _.get(req, ["body", "phoneno"]);

        if(phoneno && phoneno.length == 10)
        {

            db.any(` select * from subway_temp_login where phoneno = $1 order by id desc limit 1 ` , [phoneno])
            .then((datacheck)=>{
                var check_flag = true;
                if(datacheck && datacheck[0])
                {
                    check_flag = false;
                    var house_pre = datacheck[0].doingtime;
        
                    var d1 = house_pre.split(' ');
                    var d2 = d1[0].split('/')
                    var d3 = d2[2] + '-' + d2[1] + '-' + d2[0]
                    var d4 = d1[1].split(':')
        
                    // var date_now = new Date().addHours(7);
                    var date_now = new Date();
        
                    var date_check = new Date(d3);
                    date_check.setHours(d4[0]);
                    date_check.setMinutes(d4[1]);
                    date_check.setSeconds(d4[2]);
                    
                    date_check.setMinutes(date_check.getMinutes() + 5);
                    
        
                    if (date_now.getTime() > date_check.getTime()) {
                        check_flag = true;
                    }
                }

                if(check_flag)
                {
                    var dataphone = JSON.stringify({
                        PHONE_NO:  phoneno ,
                        sourceData: 24,
                        SOURCE_DATA: 24,
                        sourceData: 24,
                        SOURCE_DATA: 24,
                        SOURCE_DATA: 24,
                    });
        
                    var configphone = {
                        method: "post",
                        url: 'https://dev-crm-apim-services.pt.co.th/api-mobile/checkexistingphoneno',
                        headers: {
                            "req-key": "7495bfa034924527bfd516ca0e881f4b",
                            "Content-Type": "application/json",
                            Cookie:
                                "ApplicationGatewayAffinityCORS=876b491d42740456397805a2f74698fc; ApplicationGatewayAffinity=876b491d42740456397805a2f74698fc",
                        },
                        data: dataphone,
                    };
        
                    axios(configphone)
                    .then(function (responsephone) {
                        if (responsephone && responsephone.data && responsephone.data.RESPONSE_INFO.RESCODE == "000") {
                            var unixTime = Date.now();
                            const URL_lineOTP = "https://crm-apim-services.pt.co.th/Line-api/LineBC.asmx/lineOTP";
        
                            var temp =`{"maxPhone":"` + phoneno + `", "unixTime":"` + unixTime +`"}`;
        
                            const key = CryptoJS.enc.Utf8.parse("A5lpsRpw0d@paAbT9sIqEmWslCxkrxaE"); 
                            const iv = CryptoJS.enc.Utf8.parse("eTxUr@qMSpfs0w+J"); 
        
                            function Encrypt(data) {
                                let srcs = CryptoJS.enc.Utf8.parse(data);
                                let encrypted = CryptoJS.AES.encrypt(srcs, key, {
                                iv: iv,
                                mode: CryptoJS.mode.CBC,
                                padding: CryptoJS.pad.Pkcs7,
                                });
                                return encrypted.toString();
                            }
        
                            var datax = Encrypt(temp);
                            var axios = require("axios");
                            var qs = require("qs");
                            var data = qs.stringify({
                                jsonReq: datax,
                                sourceData: 24,
                                SOURCE_DATA: 24,
                            });
        
                            var config = {
                                method: "post",
                                url: URL_lineOTP,
                                headers: {
                                    "req-key": "9b86bc9f9e46498c9b3ac3fe89ffac03",
                                    token: "M@xc@rD2@21",
                                    "Content-Type": "application/x-www-form-urlencoded",
                                    Cookie:
                                    "ApplicationGatewayAffinityCORS=876b491d42740456397805a2f74698fc; ApplicationGatewayAffinity=876b491d42740456397805a2f74698fc",
                                },
                                data: data,
                            };
                            axios(config).
                            then(response => {
                                if(response.data.response && response.data.response.resCode == '00')
                                {
                                    // var dt = new Date().addHours(7);
                                    var dt = new Date();
                                                        
                                    var tempa = dt.getDate() < 10 ? "0" + dt.getDate() : dt.getDate();
                                    var tempb = dt.getMonth() + 1 < 10 ? "0" + (dt.getMonth() + 1) : dt.getMonth() + 1;
                                    var tempc = dt.getFullYear();
                                    var tempd = dt.getHours() < 10 ? "0" + dt.getHours() : dt.getHours();
                                    var tempe = dt.getMinutes() < 10 ? "0" + dt.getMinutes() : dt.getMinutes();
                                    var tempf = dt.getSeconds() < 10 ? "0" + dt.getSeconds() : dt.getSeconds();
        
                                    var doingtime = tempa + "/" + tempb + "/" + tempc + " " + tempd + ":" + tempe + ":" + tempf;

                                    db.any(` insert into subway_temp_login (phoneno, doingtime, otp_ref , unixtime )
                                    values ($1,$2,$3,$4) ` , [phoneno , doingtime , response.data.data.OtpKey ,response.data.data.unixTime ])
                                    .then((dataA)=>{
                                        return res.status(200).json({
                                            RespCode: 200,
                                            RespMessage: "Success",
                                            result :response.data.data
                                        }); 
                                    }).catch((error)=>{
                                        console.log(error)
                                        return res.status(200).json({
                                            RespCode: 500,
                                            RespMessage: "system error 1",
                                        });    
                                    })
                                }
                                else
                                {
                                    return res.status(200).json({
                                        RespCode: 500,
                                        RespMessage: "system error 2",
                                    });    
                                }
                            }).catch(error => {
                                console.log(error)
                                return res.status(200).json({
                                    RespCode: 500,
                                    RespMessage: "system error 3",
                                });    
                            });
                        }
                        else
                        {
                            return res.status(200).json({
                                RespCode: 500,
                                RespMessage: "transaction not correct",
                            }); 
                        }
                    }).catch((error)=>{
                        console.log(error)
                        return res.status(200).json({
                            RespCode: 500,
                            RespMessage: "system error 5",
                        });    
                    })
                }
                else
                {
                    return res.status(200).json({
                        RespCode: 500,
                        RespMessage: "limit otp",
                    });  
                }
            }).catch((error)=>{
                console.log(error)
                return res.status(200).json({
                    RespCode: 500,
                    RespMessage: "system error 6",
                });    
            })
        }
    } catch (error) {
        console.log(error)
        return res.status(200).json({
            RespCode: 500,
            RespMessage: "system error 6",
        });    
    }
});

app.post('/subway/verrifyotp', (req, res) => {
    try {
        var unixTime = _.get(req, ["body", "unixTime"]);
        var maxPhone = _.get(req, ["body", "phoneno"]);
        var otpValue = _.get(req, ["body", "newotp"]);
        unixTime = Date.now();

        Date.prototype.addHours = function (h) {
            this.setHours(this.getHours() + h);
            return this;
        };

        if (unixTime && maxPhone && otpValue) {
            db.any(` select * from subway_temp_login where phoneno = $1 order by id desc ` , [maxPhone])
            .then((datacheck)=>{
                if(datacheck && datacheck[0])
                {
                    var datajson = datacheck[0].datajson;
                    var otpref = datacheck[0].otp_ref;
                    const key = CryptoJS.enc.Utf8.parse("A5lpsRpw0d@paAbT9sIqEmWslCxkrxaE"); 
                    const iv = CryptoJS.enc.Utf8.parse("eTxUr@qMSpfs0w+J"); 
                    function Encrypt(data) {
                        let srcs = CryptoJS.enc.Utf8.parse(data);
                        let encrypted = CryptoJS.AES.encrypt(srcs, key, {
                            iv: iv,
                            mode: CryptoJS.mode.CBC,
                            padding: CryptoJS.pad.Pkcs7,
                        });
                        return encrypted.toString();
                    }
        
                    var curcode = otpref;
                    var temp =`{"otpKey":"` + curcode + `", "otpValue":"` + otpValue + `", "maxPhone":"` + maxPhone + `", "unixTime":"` + unixTime +`"}`;
                    var datax = Encrypt(temp);
                    var axios = require("axios");
                    var qs = require("qs");
                    var data = qs.stringify({
                      jsonReq: datax,
                      SOURCE_DATA: 24,
                    });
        
                    var URL_line_verifyotp =  "https://crm-apim-services.pt.co.th/Line-api/LineBC.asmx/lineVerifyOTP";
        
                    var config = {
                        method: "post",
                        url: URL_line_verifyotp,
                        headers: {
                            "req-key": "9b86bc9f9e46498c9b3ac3fe89ffac03",
                            token: "M@xc@rD2@21",
                            "Content-Type": "application/x-www-form-urlencoded",
                            Cookie:
                            "ApplicationGatewayAffinityCORS=876b491d42740456397805a2f74698fc; ApplicationGatewayAffinity=876b491d42740456397805a2f74698fc",
                        },
                        data: data,
                    };
        
                    axios(config)
                    .then(function (responseotp) {
                        console.log('responseotp',responseotp.data);
                        if(responseotp.data.response.resCode == '00')
                        {
                            db.any(` delete from subway_temp_login where phoneno = $1  ` , [maxPhone])
                            .then((dataB)=>{
                                //insert member
                                db.any(` select * from subway_member where phoneno = $1 `,[maxPhone])
                                .then((dataM)=>{
                                    if(dataM && dataM[0])
                                    {

                                        var dt = new Date();
                                                        
                                        var tempa = dt.getDate() < 10 ? "0" + dt.getDate() : dt.getDate();
                                        var tempb = dt.getMonth() + 1 < 10 ? "0" + (dt.getMonth() + 1) : dt.getMonth() + 1;
                                        var tempc = dt.getFullYear();
                                        var tempd = dt.getHours() < 10 ? "0" + dt.getHours() : dt.getHours();
                                        var tempe = dt.getMinutes() < 10 ? "0" + dt.getMinutes() : dt.getMinutes();
                                        var tempf = dt.getSeconds() < 10 ? "0" + dt.getSeconds() : dt.getSeconds();
            
                                        var doingtime = tempa + "/" + tempb + "/" + tempc + " " + tempd + ":" + tempe + ":" + tempf;

                                        let data = JSON.stringify({
                                            "CardNo": "",
                                            "CitizenId": "",
                                            "PhoneNo": maxPhone
                                        });
                                    
                                        let config = {
                                            method: 'post',
                                            maxBodyLength: Infinity,
                                            url: 'https://crm-apim-services.pt.co.th/prd-mloyalty/api/Card/ListInfo',
                                            headers: { 
                                              'req-key': '9b86bc9f9e46498c9b3ac3fe89ffac03', 
                                              'Content-Type': 'application/json', 
                                              'Cookie': 'ApplicationGatewayAffinity=876b491d42740456397805a2f74698fc; ApplicationGatewayAffinityCORS=876b491d42740456397805a2f74698fc'
                                            },
                                            data : data
                                          };
                                    
                                        axios.request(config)
                                        .then((response) => {
                                            console.log(response.data)
                                            if(response.data.responseCode == '00')
                                            {
                                                var listinfo = response.data.resultModel.cardIdInfo;
                                                var obj = {};
                                                for (let i = 0; i < listinfo.length; i++) {
                                                    const element = listinfo[i];
                                                    if(element.cardStatus  == "I" ) {
                                                    obj = element;
                                                    break;
                                                    }
                                                }
                                                var maxmeWallet = obj.maxmeWallet;
                                                var maxmeApp = obj.maxmeApp;
                                                var cardNo = obj.cardNo;
                                                var customerName = obj.customerName;
                                                var customerBirthDate = obj.customerBirthDate;
                                                var cardNormalPoint = obj.cardNormalPoint;
                                                var cardSpecialPoint = obj.cardSpecialPoint;
                                                var cardEstampPoint = obj.cardEstampPoint;

                                                var dt = new Date();
                                                        
                                                var tempa = dt.getDate() < 10 ? "0" + dt.getDate() : dt.getDate();
                                                var tempb = dt.getMonth() + 1 < 10 ? "0" + (dt.getMonth() + 1) : dt.getMonth() + 1;
                                                var tempc = dt.getFullYear();
                                                var tempd = dt.getHours() < 10 ? "0" + dt.getHours() : dt.getHours();
                                                var tempe = dt.getMinutes() < 10 ? "0" + dt.getMinutes() : dt.getMinutes();
                                                var tempf = dt.getSeconds() < 10 ? "0" + dt.getSeconds() : dt.getSeconds();
                    
                                                var doingtime = tempa + "/" + tempb + "/" + tempc + " " + tempd + ":" + tempe + ":" + tempf;

                                                db.any(` update subway_member set updatedate = $1 where phoneno = $2 returning * ` , [doingtime , maxPhone])
                                                .then((daatC)=>{
                                                    return res.status(200).json({
                                                        RespCode: 200,
                                                        RespMessage: "Success",
                                                        cardNormalPoint : cardNormalPoint,
                                                        cardSpecialPoint : cardSpecialPoint ,
                                                        cardEstampPoint : cardEstampPoint ,
                                                        result : {
                                                            cardNo : cardNo ,
                                                            customerName : customerName ,
                                                            maxmeWallet : maxmeWallet
                                                        }
                                                    });  
                                                }).catch((error)=>{
                                                    console.log(error)
                                                    return res.status(200).json({
                                                        RespCode: 500,
                                                        RespMessage: "system error3",
                                                    });  
                                                })


                                             
                                            }
                                            else
                                            {
                                                return res.status(200).json({
                                                    RespCode: 500,
                                                    RespMessage: "system error3",
                                                });  
                                            }
                                        }).catch((error)=>{
                                            console.log(error)
                                            return res.status(200).json({
                                                RespCode: 500,
                                                RespMessage: "system error3",
                                            });  
                                        })
                                    }
                                    else
                                    {
                                        var dt = new Date();
                                                        
                                        var tempa = dt.getDate() < 10 ? "0" + dt.getDate() : dt.getDate();
                                        var tempb = dt.getMonth() + 1 < 10 ? "0" + (dt.getMonth() + 1) : dt.getMonth() + 1;
                                        var tempc = dt.getFullYear();
                                        var tempd = dt.getHours() < 10 ? "0" + dt.getHours() : dt.getHours();
                                        var tempe = dt.getMinutes() < 10 ? "0" + dt.getMinutes() : dt.getMinutes();
                                        var tempf = dt.getSeconds() < 10 ? "0" + dt.getSeconds() : dt.getSeconds();
            
                                        var doingtime = tempa + "/" + tempb + "/" + tempc + " " + tempd + ":" + tempe + ":" + tempf;

                                        let data = JSON.stringify({
                                            "CardNo": "",
                                            "CitizenId": "",
                                            "PhoneNo": maxPhone
                                        });
                                    
                                        let config = {
                                            method: 'post',
                                            maxBodyLength: Infinity,
                                            url: 'https://crm-apim-services.pt.co.th/prd-mloyalty/api/Card/ListInfo',
                                            headers: { 
                                              'req-key': '9b86bc9f9e46498c9b3ac3fe89ffac03', 
                                              'Content-Type': 'application/json', 
                                              'Cookie': 'ApplicationGatewayAffinity=876b491d42740456397805a2f74698fc; ApplicationGatewayAffinityCORS=876b491d42740456397805a2f74698fc'
                                            },
                                            data : data
                                          };
                                    
                                        axios.request(config)
                                        .then((response) => {
                                            if(response.data.responseCode == '00')
                                            {
                                                var listinfo = response.data.resultModel.cardIdInfo;
                                                var obj = {};
                                                for (let i = 0; i < listinfo.length; i++) {
                                                    const element = listinfo[i];
                                                    if(element.cardStatus  == "I" ) {
                                                    obj = element;
                                                    break;
                                                    }
                                                }
                                                var maxmeWallet = obj.maxmeWallet;
                                                var maxmeApp = obj.maxmeApp;
                                                var cardNo = obj.cardNo;
                                                var customerName = obj.customerName;
                                                var customerBirthDate = obj.customerBirthDate;
                                                var cardNormalPoint = obj.cardNormalPoint;
                                                var cardSpecialPoint = obj.cardSpecialPoint;
                                                var cardEstampPoint = obj.cardEstampPoint;
                                                var uuid = crypto.randomUUID();


                                                db.any(` insert into subway_member (custname, maxcardno, birthdate, phoneno, token, maxme_statutus, createdate , maxme_wallet , uuid)
                                                values ($1,$2,$3,$4,$5,$6,$7,$8,$9); ` , [customerName , cardNo ,customerBirthDate ,maxPhone , '' , maxmeApp , doingtime , maxmeWallet , uuid])
                                                .then((dataC)=>{
                                                    return res.status(200).json({
                                                        RespCode: 200,
                                                        RespMessage: "Success",
                                                        cardNormalPoint : cardNormalPoint,
                                                        cardSpecialPoint : cardSpecialPoint ,
                                                        cardEstampPoint : cardEstampPoint ,
                                                        result : {
                                                            cardNo : cardNo ,
                                                            customerName : customerName ,
                                                            maxmeWallet : maxmeWallet
                                                        }
                                                    });  
                                                }).catch((error)=>{
                                                    console.log(error)
                                                    return res.status(200).json({
                                                        RespCode: 500,
                                                        RespMessage: "system error3",
                                                    });  
                                                })
                                            }
                                            else
                                            {
                                                return res.status(200).json({
                                                    RespCode: 500,
                                                    RespMessage: "system error3",
                                                });  
                                            }
                                        }).catch((error)=>{
                                            console.log(error)
                                            return res.status(200).json({
                                                RespCode: 500,
                                                RespMessage: "system error3",
                                            });  
                                        })
                                    }
                                }).catch((error)=>{
                                    console.log(error)
                                    return res.status(200).json({
                                        RespCode: 500,
                                        RespMessage: "system error3",
                                    });  
                                }) 
                            }).catch((error)=>{
                                console.log(error)
                                return res.status(200).json({
                                    RespCode: 500,
                                    RespMessage: "system error3",
                                });  
                            })
                        }
                        else
                        {
                            return res.status(200).json({
                                RespCode: 500,
                                RespMessage: "system error3",
                            });  
                        }
                    }).catch((error)=>{
                        console.log(error)
                        return res.status(200).json({
                            RespCode: 500,
                            RespMessage: "system error3",
                        });   
                    })
                }
                else
                {
                    return res.status(200).json({
                        RespCode: 500,
                        RespMessage: "system error3",
                    });  
                }
            }).catch((error)=>{
                console.log(error)
                return res.status(200).json({
                    RespCode: 500,
                    RespMessage: "system error3",
                });  
            })
        }
        else
        {
            return res.status(200).json({
                RespCode: 500,
                RespMessage: "system error3",
            });  
        }
    } catch (error) {
        console.log(error)
        return res.status(200).json({
            RespCode: 500,
            RespMessage: "system error3",
        });    
    }
});


app.post('/subway/getprofilemember', (req, res) => {
    try {
        var phoneno = _.get(req, ["body", "phoneno"]);
        var token = _.get(req, ["body", "token"]);

        db.any(` select uuid , custname , birthdate , phoneno , maxme_statutus , maxme_wallet  from subway_member where phoneno = $1 ` , [phoneno])
        .then((dataA)=>{
            if(dataA && dataA[0])
            {
                return res.status(200).json({
                    RespCode: 200,
                    RespMessage: "not found customer",
                });  
            }
            else
            {
                return res.status(200).json({
                    RespCode: 401,
                    RespMessage: "not found customer",
                });  
            }
        }).catch((error)=>{
            return res.status(200).json({
                RespCode: 500,
                RespMessage: "system error3",
            });  
        })
    } catch (error) {
        console.log(error)
        return res.status(200).json({
            RespCode: 500,
            RespMessage: "system error3",
        });    
    }
});




module.exports = app;