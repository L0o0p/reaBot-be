// src/migrations/1733417644000-AddTimestampColumnsToAnswerSheet.ts
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTimestampColumnsToAnswerSheet1733417644000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumns('answer_sheet', [
            new TableColumn({
                name: 'articleAStartedAt',
                type: 'timestamp',
                isNullable: true
            }),
            new TableColumn({
                name: 'articleAFinishedAt',
                type: 'timestamp',
                isNullable: true
            }),
            new TableColumn({
                name: 'articleBStartedAt',
                type: 'timestamp',
                isNullable: true
            }),
            new TableColumn({
                name: 'articleBFinishedAt',
                type: 'timestamp',
                isNullable: true
            }),
            new TableColumn({
                name: 'articleATimeToken',
                type: 'int',
                default: 0
            }),
            new TableColumn({
                name: 'articleBTimeToken',
                type: 'int',
                default: 0
            })
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('answer_sheet', 'articleAStartedAt');
        await queryRunner.dropColumn('answer_sheet', 'articleAFinishedAt');
        await queryRunner.dropColumn('answer_sheet', 'articleBStartedAt');
        await queryRunner.dropColumn('answer_sheet', 'articleBFinishedAt');
        await queryRunner.dropColumn('answer_sheet', 'articleATimeToken');
        await queryRunner.dropColumn('answer_sheet', 'articleBTimeToken');
    }
}