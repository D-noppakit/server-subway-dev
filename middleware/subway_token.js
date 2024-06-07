var CryptoJS = require("crypto-js");

function encrypted(keys) {
    var key = process.env.AES_KEY;
    var iv = process.env.AES_IV;
    key = CryptoJS.enc.Hex.parse(key);
    iv = CryptoJS.enc.Hex.parse(iv);
    var encrypted = CryptoJS.AES.encrypt(keys, key, { iv: iv });
    return encrypted.toString();
}

function GenerateToken(db, uuid, CryptoJS) {
    return async function (req, res, next) {
        try {
            var citizenid = req.body.CID
            var referral_code = req.body.referral_code
            if (citizenid && citizenid.length == 13 && referral_code) {
                var dayplusone = new Date();
                dayplusone.setDate(dayplusone.getDate() + 1);
                var rawdata = `{"CID": "${citizenid}", "referral_code":"${referral_code}","uuid":"${uuid}","exp":"${dayplusone}"}`
                await db.any(`insert into maxbit_privilege_users (citizenid, campaign, token_exp) values ($1, $2, $3) returning id`, [citizenid, referral_code, dayplusone])
                var encryptdata = encrypted(rawdata)
                return res.status(200).json({ code: '200', message: 'Success', result: { enc: encryptdata } });
            } else {
                return res.status(400).json({ code: '400', message: 'Invalid parameter', result: {} });
            }
        } catch (error) {
            console.log(error);
            return res.status(500).json({ code: '500', message: 'System error', result: {} });
        }
    }
}

function AuthenticateToken(db, uuid, CryptoJS) {
    return async function (req, res, next) {
        try {
            function encrypted(keys) {
                var key = process.env.AES_KEY;
                var iv = process.env.AES_IV;
                key = CryptoJS.enc.Hex.parse(key);
                iv = CryptoJS.enc.Hex.parse(iv);
                var encrypted = CryptoJS.AES.encrypt(keys, key, { iv: iv });
                return encrypted.toString();
            }
            var citizenid = req.body.CID
            var referral_code = req.body.referral_code
            if (citizenid && citizenid.length == 13 && referral_code) {
                var dayplusone = new Date();
                dayplusone.setDate(dayplusone.getDate() + 1);
                var rawdata = `{"CID": "${citizenid}", "referral_code":"${referral_code}","uuid":"${uuid}","exp":"${dayplusone}"}`
                await db.any(`insert into maxbit_privilege_users (citizenid, campaign, token_exp) values ($1, $2, $3) returning id`, [citizenid, referral_code, dayplusone])
                var encryptdata = encrypted(rawdata)
                return res.status(200).json({ code: '200', message: 'Success', result: { enc: encryptdata } });
            } else {
                return res.status(400).json({ code: '400', message: 'Invalid parameter', result: {} });
            }
        } catch (error) {
            console.log(error);
            return res.status(500).json({ code: '500', message: 'System error', result: {} });
        }
    }
}

module.exports = {
    GenerateToken,
    AuthenticateToken
}