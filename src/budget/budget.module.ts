import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { BudgetController } from './budget.controller';
import { BudgetService } from './budget.service';
import {
  Budget,
  BudgetFilter,
  BudgetItem,
  BudgetStatus,
  BudgetTotal,
  Category,
  Customer,
  Email,
  Entry,
  Expense,
  Freelancer,
  Invoice,
  Product,
  Supplier,
} from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Category,
      Product,
      Customer,
      Budget,
      BudgetItem,
      Freelancer,
      Supplier,
      BudgetStatus,
      Invoice,
      Email,
      Expense,
      Entry,
      BudgetTotal,
      BudgetFilter,
      User,
    ]),
  ],
  controllers: [BudgetController],
  providers: [BudgetService],
})
export class BudgetModule {}
