import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveCpfCnpjFromUsers1782100000000 implements MigrationInterface {
  name = 'RemoveCpfCnpjFromUsers1782100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN IF EXISTS "cpf_cnpj"');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "users" ADD COLUMN "cpf_cnpj" character varying(14)');
  }
}
