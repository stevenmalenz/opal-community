import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new pg.Client({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
});

async function run() {
    try {
        await client.connect();
        const filename = process.argv[2];
        if (!filename) {
            console.error('Please provide a SQL file path argument.');
            process.exit(1);
        }

        // Resolve path: if absolute, use as is; if relative, join with cwd
        const sqlPath = path.isAbsolute(filename)
            ? filename
            : path.join(process.cwd(), filename);

        console.log(`Reading SQL from: ${sqlPath}`);
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('Running SQL...');
        await client.query(sql);
        console.log('SQL executed successfully.');
    } catch (err) {
        console.error('Error executing SQL:', err);
    } finally {
        await client.end();
    }
}

run();
