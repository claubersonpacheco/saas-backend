import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameBusinessPlanModuleToBudget1782700000000
  implements MigrationInterface
{
  name = 'RenameBusinessPlanModuleToBudget1782700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "plans"
      SET "modules" = (
        SELECT jsonb_agg(DISTINCT module_value)
        FROM (
          SELECT CASE
            WHEN value = '"business"'::jsonb THEN '"budget"'::jsonb
            ELSE value
          END AS module_value
          FROM jsonb_array_elements("plans"."modules") AS value
        ) AS normalized_modules
      )
      WHERE "modules" ? 'business'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "plans"
      SET "modules" = (
        SELECT jsonb_agg(DISTINCT module_value)
        FROM (
          SELECT CASE
            WHEN value = '"budget"'::jsonb THEN '"business"'::jsonb
            ELSE value
          END AS module_value
          FROM jsonb_array_elements("plans"."modules") AS value
        ) AS normalized_modules
      )
      WHERE "modules" ? 'budget'
    `);
  }
}
