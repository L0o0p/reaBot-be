import { DataSource } from 'typeorm';
import { Global, Module } from '@nestjs/common';
import * as dotenv from 'dotenv';

dotenv.config(); // Loads the environment variables from .env file

@Global() // makes the module available globally for other modules once imported in the app modules
@Module({
  imports: [],
  providers: [
    {
      provide: DataSource, // add the datasource as a provider
      inject: [],
      useFactory: async () => {
        // using the factory function to create the datasource instance
        try {
          const dataSource = new DataSource({
            type: 'postgres',
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT, 10),
            username: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            extra: {
              max: 20, // 连接池最大连接数
              idleTimeoutMillis: 30000, // 空闲连接超时
              connectionTimeoutMillis: 2000
            },
            logging: true,
            logger: 'advanced-console',
            // entities: [User],
            synchronize: true,
            entities: [`${__dirname}/../**/**.entity{.ts,.js}`], // this will automatically load all entity file in the src folder
          });
          await dataSource.initialize(); // initialize the data source
          console.log('Database connected successfully');
          return dataSource;
        } catch (error) {
          console.log('Error connecting to database');
          throw error;
        }
      },
    },
  ],
  exports: [DataSource],
})
export class Database {}