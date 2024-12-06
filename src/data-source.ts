import { DataSource } from "typeorm"
import { config } from 'dotenv'

config()

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    synchronize: false,
    logging: true,
    entities: [`${__dirname}/../**/**.entity{.ts,.js}`],
    subscribers: [],
})