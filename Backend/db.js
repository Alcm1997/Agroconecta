const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'agroconecta',
  password: '171297',
  port: 5432,
});

module.exports = pool;