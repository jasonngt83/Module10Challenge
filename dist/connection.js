import pkg from 'pg';
const { Pool } = pkg;
import dotenv from "dotenv";
dotenv.config();
const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: 'localhost',
    database: 'employee_tracker',
    //port: 5432,
});
export default pool;
