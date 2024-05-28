const pgp = require("pg-promise")(/*options*/);
pgp.pg.defaults.ssl = {
    rejectUnauthorized: false,
};
const cn = process.env.DB_STRING_CONNECTION;
const configx = {
    connectionString: cn,
    max: 30,
    ssl: { rejectUnauthorized: false },
};
const db = pgp(configx);

module.exports = db;