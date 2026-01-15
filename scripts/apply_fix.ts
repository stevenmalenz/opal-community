
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connection string from run_sql.ts
const connectionString = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

const client = new pg.Client({
    connectionString,
});

async function run() {
    try {
        await client.connect();
        const sqlPath = path.join(__dirname, '../fix_course_deletion.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('Running SQL from fix_course_deletion.sql...');
        await client.query(sql);
        console.log('SQL executed successfully.');
    } catch (err) {
        console.error('Error executing SQL:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

run();
