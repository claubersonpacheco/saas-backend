import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePlanModules } from '../auth/decorators/require-plan-modules.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlanModulesGuard } from '../auth/guards/plan-modules.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { BudgetService } from './budget.service';

type Payload = Record<string, unknown>;

@Controller()
@UseGuards(JwtAuthGuard, PlanModulesGuard, PermissionsGuard)
@RequirePlanModules('budget')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Get('categories')
  @RequirePermissions('categories.read')
  categories(@CurrentUser() user: AuthenticatedUser) { return this.budgetService.findMain('categories', user.tenantId); }
  @Get('categories/:id')
  @RequirePermissions('categories.read')
  category(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.findOneMain('categories', id, user.tenantId); }
  @Post('categories')
  @RequirePermissions('categories.create')
  createCategory(@Body() body: Payload, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.createMain('categories', body, user.tenantId, user.sub); }
  @Patch('categories/:id')
  @RequirePermissions('categories.update')
  updateCategory(@Param('id', ParseIntPipe) id: number, @Body() body: Payload, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.updateMain('categories', id, body, user.tenantId); }
  @Delete('categories/:id')
  @RequirePermissions('categories.delete')
  deleteCategory(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.removeMain('categories', id, user.tenantId); }

  @Get('products')
  @RequirePermissions('products.read')
  products(@CurrentUser() user: AuthenticatedUser) { return this.budgetService.findMain('products', user.tenantId); }
  @Get('products/:id')
  @RequirePermissions('products.read')
  product(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.findOneMain('products', id, user.tenantId); }
  @Post('products')
  @RequirePermissions('products.create')
  createProduct(@Body() body: Payload, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.createMain('products', body, user.tenantId, user.sub); }
  @Patch('products/:id')
  @RequirePermissions('products.update')
  updateProduct(@Param('id', ParseIntPipe) id: number, @Body() body: Payload, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.updateMain('products', id, body, user.tenantId); }
  @Delete('products/:id')
  @RequirePermissions('products.delete')
  deleteProduct(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.removeMain('products', id, user.tenantId); }

  @Get('customers')
  @RequirePermissions('customers.read')
  customers(@CurrentUser() user: AuthenticatedUser) { return this.budgetService.findMain('customers', user.tenantId); }
  @Get('customers/:id')
  @RequirePermissions('customers.read')
  customer(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.findOneMain('customers', id, user.tenantId); }
  @Post('customers')
  @RequirePermissions('customers.create')
  createCustomer(@Body() body: Payload, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.createMain('customers', body, user.tenantId, user.sub); }
  @Patch('customers/:id')
  @RequirePermissions('customers.update')
  updateCustomer(@Param('id', ParseIntPipe) id: number, @Body() body: Payload, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.updateMain('customers', id, body, user.tenantId); }
  @Delete('customers/:id')
  @RequirePermissions('customers.delete')
  deleteCustomer(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.removeMain('customers', id, user.tenantId); }

  @Get('budgets')
  @RequirePermissions('budgets.read')
  budgets(@CurrentUser() user: AuthenticatedUser) { return this.budgetService.findMain('budgets', user.tenantId); }
  @Get('budgets/:id')
  @RequirePermissions('budgets.read')
  budget(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.findOneMain('budgets', id, user.tenantId); }
  @Post('budgets')
  @RequirePermissions('budgets.create')
  createBudget(@Body() body: Payload, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.createMain('budgets', body, user.tenantId, user.sub); }
  @Patch('budgets/:id')
  @RequirePermissions('budgets.update')
  updateBudget(@Param('id', ParseIntPipe) id: number, @Body() body: Payload, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.updateMain('budgets', id, body, user.tenantId); }
  @Delete('budgets/:id')
  @RequirePermissions('budgets.delete')
  deleteBudget(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.removeMain('budgets', id, user.tenantId); }

  @Get('freelancers')
  @RequirePermissions('freelancers.read')
  freelancers(@CurrentUser() user: AuthenticatedUser) { return this.budgetService.findMain('freelancers', user.tenantId); }
  @Get('freelancers/:id')
  @RequirePermissions('freelancers.read')
  freelancer(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.findOneMain('freelancers', id, user.tenantId); }
  @Post('freelancers')
  @RequirePermissions('freelancers.create')
  createFreelancer(@Body() body: Payload, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.createMain('freelancers', body, user.tenantId, user.sub); }
  @Patch('freelancers/:id')
  @RequirePermissions('freelancers.update')
  updateFreelancer(@Param('id', ParseIntPipe) id: number, @Body() body: Payload, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.updateMain('freelancers', id, body, user.tenantId); }
  @Delete('freelancers/:id')
  @RequirePermissions('freelancers.delete')
  deleteFreelancer(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.removeMain('freelancers', id, user.tenantId); }

  @Get('suppliers')
  @RequirePermissions('suppliers.read')
  suppliers(@CurrentUser() user: AuthenticatedUser) { return this.budgetService.findMain('suppliers', user.tenantId); }
  @Get('suppliers/:id')
  @RequirePermissions('suppliers.read')
  supplier(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.findOneMain('suppliers', id, user.tenantId); }
  @Post('suppliers')
  @RequirePermissions('suppliers.create')
  createSupplier(@Body() body: Payload, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.createMain('suppliers', body, user.tenantId, user.sub); }
  @Patch('suppliers/:id')
  @RequirePermissions('suppliers.update')
  updateSupplier(@Param('id', ParseIntPipe) id: number, @Body() body: Payload, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.updateMain('suppliers', id, body, user.tenantId); }
  @Delete('suppliers/:id')
  @RequirePermissions('suppliers.delete')
  deleteSupplier(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.removeMain('suppliers', id, user.tenantId); }

  @Get('budget-items')
  @RequirePermissions('budget-items.read')
  budgetItems(@CurrentUser() user: AuthenticatedUser) { return this.budgetService.findChild('budgetItems', user.tenantId); }
  @Get('budget-items/:id')
  @RequirePermissions('budget-items.read')
  budgetItem(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.findOneChild('budgetItems', id, user.tenantId); }
  @Post('budget-items')
  @RequirePermissions('budget-items.create')
  createBudgetItem(@Body() body: Payload, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.createChild('budgetItems', body, user.tenantId, user.sub); }
  @Patch('budget-items/:id')
  @RequirePermissions('budget-items.update')
  updateBudgetItem(@Param('id', ParseIntPipe) id: number, @Body() body: Payload, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.updateChild('budgetItems', id, body, user.tenantId, user.sub); }
  @Delete('budget-items/:id')
  @RequirePermissions('budget-items.delete')
  deleteBudgetItem(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.removeChild('budgetItems', id, user.tenantId); }

  @Get('budget-statuses')
  @RequirePermissions('budget-statuses.read')
  budgetStatuses(@CurrentUser() user: AuthenticatedUser) { return this.budgetService.findChild('budgetStatuses', user.tenantId); }
  @Get('budget-statuses/:id')
  @RequirePermissions('budget-statuses.read')
  budgetStatus(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.findOneChild('budgetStatuses', id, user.tenantId); }
  @Post('budget-statuses')
  @RequirePermissions('budget-statuses.create')
  createBudgetStatus(@Body() body: Payload, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.createChild('budgetStatuses', body, user.tenantId, user.sub); }
  @Patch('budget-statuses/:id')
  @RequirePermissions('budget-statuses.update')
  updateBudgetStatus(@Param('id', ParseIntPipe) id: number, @Body() body: Payload, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.updateChild('budgetStatuses', id, body, user.tenantId, user.sub); }
  @Delete('budget-statuses/:id')
  @RequirePermissions('budget-statuses.delete')
  deleteBudgetStatus(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.removeChild('budgetStatuses', id, user.tenantId); }

  @Get('invoices')
  @RequirePermissions('invoices.read')
  invoices(@CurrentUser() user: AuthenticatedUser) { return this.budgetService.findChild('invoices', user.tenantId); }
  @Get('invoices/:id')
  @RequirePermissions('invoices.read')
  invoice(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.findOneChild('invoices', id, user.tenantId); }
  @Post('invoices')
  @RequirePermissions('invoices.create')
  createInvoice(@Body() body: Payload, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.createChild('invoices', body, user.tenantId, user.sub); }
  @Patch('invoices/:id')
  @RequirePermissions('invoices.update')
  updateInvoice(@Param('id', ParseIntPipe) id: number, @Body() body: Payload, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.updateChild('invoices', id, body, user.tenantId, user.sub); }
  @Delete('invoices/:id')
  @RequirePermissions('invoices.delete')
  deleteInvoice(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.removeChild('invoices', id, user.tenantId); }

  @Get('emails')
  @RequirePermissions('emails.read')
  emails(@CurrentUser() user: AuthenticatedUser) { return this.budgetService.findChild('emails', user.tenantId); }
  @Get('emails/:id')
  @RequirePermissions('emails.read')
  email(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.findOneChild('emails', id, user.tenantId); }
  @Post('emails')
  @RequirePermissions('emails.create')
  createEmail(@Body() body: Payload, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.createChild('emails', body, user.tenantId, user.sub); }
  @Patch('emails/:id')
  @RequirePermissions('emails.update')
  updateEmail(@Param('id', ParseIntPipe) id: number, @Body() body: Payload, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.updateChild('emails', id, body, user.tenantId, user.sub); }
  @Delete('emails/:id')
  @RequirePermissions('emails.delete')
  deleteEmail(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.removeChild('emails', id, user.tenantId); }

  @Get('expenses')
  @RequirePermissions('expenses.read')
  expenses(@CurrentUser() user: AuthenticatedUser) { return this.budgetService.findChild('expenses', user.tenantId); }
  @Get('expenses/:id')
  @RequirePermissions('expenses.read')
  expense(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.findOneChild('expenses', id, user.tenantId); }
  @Post('expenses')
  @RequirePermissions('expenses.create')
  createExpense(@Body() body: Payload, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.createChild('expenses', body, user.tenantId, user.sub); }
  @Patch('expenses/:id')
  @RequirePermissions('expenses.update')
  updateExpense(@Param('id', ParseIntPipe) id: number, @Body() body: Payload, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.updateChild('expenses', id, body, user.tenantId, user.sub); }
  @Delete('expenses/:id')
  @RequirePermissions('expenses.delete')
  deleteExpense(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.removeChild('expenses', id, user.tenantId); }

  @Get('entries')
  @RequirePermissions('entries.read')
  entries(@CurrentUser() user: AuthenticatedUser) { return this.budgetService.findChild('entries', user.tenantId); }
  @Get('entries/:id')
  @RequirePermissions('entries.read')
  entry(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.findOneChild('entries', id, user.tenantId); }
  @Post('entries')
  @RequirePermissions('entries.create')
  createEntry(@Body() body: Payload, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.createChild('entries', body, user.tenantId, user.sub); }
  @Patch('entries/:id')
  @RequirePermissions('entries.update')
  updateEntry(@Param('id', ParseIntPipe) id: number, @Body() body: Payload, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.updateChild('entries', id, body, user.tenantId, user.sub); }
  @Delete('entries/:id')
  @RequirePermissions('entries.delete')
  deleteEntry(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.removeChild('entries', id, user.tenantId); }

  @Get('budget-totals')
  @RequirePermissions('budget-totals.read')
  budgetTotals(@CurrentUser() user: AuthenticatedUser) { return this.budgetService.findChild('budgetTotals', user.tenantId); }
  @Get('budget-totals/:id')
  @RequirePermissions('budget-totals.read')
  budgetTotal(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.findOneChild('budgetTotals', id, user.tenantId); }
  @Post('budget-totals')
  @RequirePermissions('budget-totals.create')
  createBudgetTotal(@Body() body: Payload, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.createChild('budgetTotals', body, user.tenantId, user.sub); }
  @Patch('budget-totals/:id')
  @RequirePermissions('budget-totals.update')
  updateBudgetTotal(@Param('id', ParseIntPipe) id: number, @Body() body: Payload, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.updateChild('budgetTotals', id, body, user.tenantId, user.sub); }
  @Delete('budget-totals/:id')
  @RequirePermissions('budget-totals.delete')
  deleteBudgetTotal(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.removeChild('budgetTotals', id, user.tenantId); }

  @Get('budget-filters')
  @RequirePermissions('budget-filters.read')
  budgetFilters(@CurrentUser() user: AuthenticatedUser) { return this.budgetService.findChild('budgetFilters', user.tenantId); }
  @Get('budget-filters/:id')
  @RequirePermissions('budget-filters.read')
  budgetFilter(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.findOneChild('budgetFilters', id, user.tenantId); }
  @Post('budget-filters')
  @RequirePermissions('budget-filters.create')
  createBudgetFilter(@Body() body: Payload, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.createChild('budgetFilters', body, user.tenantId, user.sub); }
  @Patch('budget-filters/:id')
  @RequirePermissions('budget-filters.update')
  updateBudgetFilter(@Param('id', ParseIntPipe) id: number, @Body() body: Payload, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.updateChild('budgetFilters', id, body, user.tenantId, user.sub); }
  @Delete('budget-filters/:id')
  @RequirePermissions('budget-filters.delete')
  deleteBudgetFilter(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) { return this.budgetService.removeChild('budgetFilters', id, user.tenantId); }
}
