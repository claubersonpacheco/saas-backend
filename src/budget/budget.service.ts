import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';
import { User } from '../user/user.entity';
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
  ProductType,
  Supplier,
} from './entities';

type Payload = Record<string, unknown>;
type MainEntity = Category | Product | Customer | Budget | Freelancer | Supplier;
type ChildEntity =
  | BudgetItem
  | BudgetStatus
  | Invoice
  | Email
  | Expense
  | Entry
  | BudgetTotal
  | BudgetFilter;
type RepositoryMap = {
  categories: Repository<Category>;
  products: Repository<Product>;
  customers: Repository<Customer>;
  budgets: Repository<Budget>;
  freelancers: Repository<Freelancer>;
  suppliers: Repository<Supplier>;
  budgetItems: Repository<BudgetItem>;
  budgetStatuses: Repository<BudgetStatus>;
  invoices: Repository<Invoice>;
  emails: Repository<Email>;
  expenses: Repository<Expense>;
  entries: Repository<Entry>;
  budgetTotals: Repository<BudgetTotal>;
  budgetFilters: Repository<BudgetFilter>;
};

type MainCodeResource = Extract<
  keyof RepositoryMap,
  'products' | 'customers' | 'budgets' | 'freelancers' | 'suppliers'
>;
type ChildCodeResource = Extract<keyof RepositoryMap, 'expenses' | 'entries'>;

const TEXT_FIELDS = [
  'name',
  'code',
  'description',
  'email',
  'phone',
  'document',
  'address',
  'productType',
  'city',
  'state',
  'zip',
  'role',
  'accountBank',
  'accountNumber',
  'serviceType',
  'codeClient',
  'comments',
  'serie',
  'numero',
  'hashRegistro',
  'hashRegistroAnterior',
  'estadoAeat',
  'pdfUrl',
  'xmlUrl',
  'subject',
  'recipientEmail',
  'additionalEmails',
  'message',
  'errorMessage',
  'file',
  'method',
  'invoiceNumber',
  'filename',
  'filePath',
  'receivedBy',
  'receiptNumber',
] as const;

const PRODUCT_TYPES = new Set<string>(Object.values(ProductType));
const BUDGET_ITEM_VISIBILITY_FIELDS = [
  'showService',
  'showDescription',
  'showQtd',
  'showPrice',
  'showTax',
  'showTotal',
  'showTaxValue',
  'showSubTotal',
] as const;

@Injectable()
export class BudgetService {
  constructor(
    @InjectRepository(Category) private readonly categories: Repository<Category>,
    @InjectRepository(Product) private readonly products: Repository<Product>,
    @InjectRepository(Customer) private readonly customers: Repository<Customer>,
    @InjectRepository(Budget) private readonly budgets: Repository<Budget>,
    @InjectRepository(Freelancer) private readonly freelancers: Repository<Freelancer>,
    @InjectRepository(Supplier) private readonly suppliers: Repository<Supplier>,
    @InjectRepository(BudgetItem) private readonly budgetItems: Repository<BudgetItem>,
    @InjectRepository(BudgetStatus) private readonly budgetStatuses: Repository<BudgetStatus>,
    @InjectRepository(Invoice) private readonly invoices: Repository<Invoice>,
    @InjectRepository(Email) private readonly emails: Repository<Email>,
    @InjectRepository(Expense) private readonly expenses: Repository<Expense>,
    @InjectRepository(Entry) private readonly entries: Repository<Entry>,
    @InjectRepository(BudgetTotal) private readonly budgetTotals: Repository<BudgetTotal>,
    @InjectRepository(BudgetFilter) private readonly budgetFilters: Repository<BudgetFilter>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  private get repos(): RepositoryMap {
    return {
      categories: this.categories,
      products: this.products,
      customers: this.customers,
      budgets: this.budgets,
      freelancers: this.freelancers,
      suppliers: this.suppliers,
      budgetItems: this.budgetItems,
      budgetStatuses: this.budgetStatuses,
      invoices: this.invoices,
      emails: this.emails,
      expenses: this.expenses,
      entries: this.entries,
      budgetTotals: this.budgetTotals,
      budgetFilters: this.budgetFilters,
    };
  }

  private repo(resource: keyof RepositoryMap): Repository<ObjectLiteral> {
    return this.repos[resource] as Repository<ObjectLiteral>;
  }

  findMain(resource: keyof Pick<RepositoryMap, 'categories' | 'products' | 'customers' | 'budgets' | 'freelancers' | 'suppliers'>, tenantId: number): Promise<MainEntity[]> {
    return this.repo(resource).find({ where: { tenantId }, order: { id: 'ASC' } }) as Promise<MainEntity[]>;
  }

  async findOneMain(resource: keyof Pick<RepositoryMap, 'categories' | 'products' | 'customers' | 'budgets' | 'freelancers' | 'suppliers'>, id: number, tenantId: number): Promise<MainEntity> {
    const item = await this.repo(resource).findOne({ where: { id, tenantId } });

    if (!item) {
      throw new NotFoundException(`Registro ${id} no encontrado.`);
    }

    return item as MainEntity;
  }

  async createMain(resource: keyof Pick<RepositoryMap, 'categories' | 'products' | 'customers' | 'budgets' | 'freelancers' | 'suppliers'>, payload: Payload, tenantId: number, currentUserId: number): Promise<MainEntity> {
    const data = this.normalize(payload);

    if (this.hasMainCode(resource)) {
      await this.ensureMainCodeAvailable(resource, data.code as string | undefined, tenantId);
    }

    if (resource === 'products') {
      this.ensureProductType(data.productType as string | undefined);
      await this.ensureOptionalCategory(data.categoryId as number | undefined, tenantId);
    }

    if (resource === 'budgets') {
      data.userId = data.userId ?? currentUserId;
      BUDGET_ITEM_VISIBILITY_FIELDS.forEach((field) => {
        data[field] = false;
      });
      await this.ensureUser(data.userId as number, tenantId);
      await this.ensureCustomer(data.customerId as number, tenantId);
    }

    const repo = this.repo(resource);
    const entity = repo.create({ ...data, tenantId });
    return repo.save(entity) as Promise<MainEntity>;
  }

  async updateMain(resource: keyof Pick<RepositoryMap, 'categories' | 'products' | 'customers' | 'budgets' | 'freelancers' | 'suppliers'>, id: number, payload: Payload, tenantId: number): Promise<MainEntity> {
    const item = await this.findOneMain(resource, id, tenantId);
    const data = this.normalize(payload);

    if (this.hasMainCode(resource) && 'code' in data) {
      await this.ensureMainCodeAvailable(resource, data.code as string | undefined, tenantId, id);
    }

    if (resource === 'products' && 'categoryId' in data) {
      await this.ensureOptionalCategory(data.categoryId as number | null, tenantId);
    }

    if (resource === 'products' && 'productType' in data) {
      this.ensureProductType(data.productType as string | undefined);
    }

    if (resource === 'budgets') {
      if ('userId' in data) {
        await this.ensureUser(data.userId as number, tenantId);
      }
      if ('customerId' in data) {
        await this.ensureCustomer(data.customerId as number, tenantId);
      }
    }

    const repo = this.repo(resource);
    const updated = repo.merge(item as ObjectLiteral, data);
    return repo.save(updated) as Promise<MainEntity>;
  }

  async removeMain(resource: keyof Pick<RepositoryMap, 'categories' | 'products' | 'customers' | 'budgets' | 'freelancers' | 'suppliers'>, id: number, tenantId: number): Promise<{ message: string }> {
    const item = await this.findOneMain(resource, id, tenantId);
    await this.repo(resource).remove(item as ObjectLiteral);
    return { message: 'Registro eliminado correctamente.' };
  }

  findChild(resource: keyof Pick<RepositoryMap, 'budgetItems' | 'budgetStatuses' | 'invoices' | 'emails' | 'expenses' | 'entries' | 'budgetTotals' | 'budgetFilters'>, tenantId: number): Promise<ChildEntity[]> {
    const query = this.repo(resource)
      .createQueryBuilder(resource)
      .innerJoinAndSelect(`${resource}.budget`, 'budget')
      .where('budget.tenant_id = :tenantId', { tenantId });

    this.selectChildRelations(query, resource);

    return query.orderBy(`${resource}.id`, 'ASC').getMany() as Promise<ChildEntity[]>;
  }

  async findOneChild(resource: keyof Pick<RepositoryMap, 'budgetItems' | 'budgetStatuses' | 'invoices' | 'emails' | 'expenses' | 'entries' | 'budgetTotals' | 'budgetFilters'>, id: number, tenantId: number): Promise<ChildEntity> {
    const query = this.repo(resource)
      .createQueryBuilder(resource)
      .innerJoinAndSelect(`${resource}.budget`, 'budget')
      .where(`${resource}.id = :id`, { id })
      .andWhere('budget.tenant_id = :tenantId', { tenantId });

    this.selectChildRelations(query, resource);

    const item = await query.getOne();

    if (!item) {
      throw new NotFoundException(`Registro ${id} no encontrado.`);
    }

    return item as ChildEntity;
  }

  async createChild(resource: keyof Pick<RepositoryMap, 'budgetItems' | 'budgetStatuses' | 'invoices' | 'emails' | 'expenses' | 'entries' | 'budgetTotals' | 'budgetFilters'>, payload: Payload, tenantId: number, currentUserId: number): Promise<ChildEntity> {
    const data = this.normalize(payload);
    await this.ensureChildRelations(resource, data, tenantId, currentUserId);
    if (this.hasChildCode(resource)) {
      await this.ensureChildCodeAvailable(resource, data.code as string | undefined, tenantId);
    }
    const repo = this.repo(resource);
    const entity = repo.create(data);
    return repo.save(entity) as Promise<ChildEntity>;
  }

  async updateChild(resource: keyof Pick<RepositoryMap, 'budgetItems' | 'budgetStatuses' | 'invoices' | 'emails' | 'expenses' | 'entries' | 'budgetTotals' | 'budgetFilters'>, id: number, payload: Payload, tenantId: number, currentUserId: number): Promise<ChildEntity> {
    const item = await this.findOneChild(resource, id, tenantId);
    const data = this.normalize(payload);
    await this.ensureChildRelations(resource, data, tenantId, currentUserId, true);
    if (this.hasChildCode(resource) && 'code' in data) {
      await this.ensureChildCodeAvailable(resource, data.code as string | undefined, tenantId, id);
    }
    const repo = this.repo(resource);
    const updated = repo.merge(item as ObjectLiteral, data);
    return repo.save(updated) as Promise<ChildEntity>;
  }

  async removeChild(resource: keyof Pick<RepositoryMap, 'budgetItems' | 'budgetStatuses' | 'invoices' | 'emails' | 'expenses' | 'entries' | 'budgetTotals' | 'budgetFilters'>, id: number, tenantId: number): Promise<{ message: string }> {
    const item = await this.findOneChild(resource, id, tenantId);
    await this.repo(resource).remove(item as ObjectLiteral);
    return { message: 'Registro eliminado correctamente.' };
  }

  private normalize(payload: Payload): Payload {
    const data = { ...payload };

    TEXT_FIELDS.forEach((field) => {
      if (field in data) {
        data[field] = typeof data[field] === 'string' ? data[field].trim() || null : data[field];
      }
    });

    return data;
  }

  private hasMainCode(resource: keyof RepositoryMap): resource is MainCodeResource {
    return ['products', 'customers', 'budgets', 'freelancers', 'suppliers'].includes(resource);
  }

  private hasChildCode(resource: keyof RepositoryMap): resource is ChildCodeResource {
    return ['expenses', 'entries'].includes(resource);
  }

  private async ensureMainCodeAvailable(
    resource: MainCodeResource,
    code: string | undefined,
    tenantId: number,
    ignoreId?: number,
  ): Promise<void> {
    if (!code) {
      throw new BadRequestException('Código é obrigatório.');
    }

    const query = this.repo(resource)
      .createQueryBuilder(resource)
      .where(`${resource}.tenant_id = :tenantId`, { tenantId })
      .andWhere(`${resource}.code = :code`, { code });

    if (ignoreId) {
      query.andWhere(`${resource}.id != :ignoreId`, { ignoreId });
    }

    if (await query.getExists()) {
      throw new ConflictException('Código já está em uso.');
    }
  }

  private async ensureChildCodeAvailable(
    resource: ChildCodeResource,
    code: string | undefined,
    tenantId: number,
    ignoreId?: number,
  ): Promise<void> {
    if (!code) {
      throw new BadRequestException('Código é obrigatório.');
    }

    const query = this.repo(resource)
      .createQueryBuilder(resource)
      .innerJoin(`${resource}.budget`, 'budget')
      .where('budget.tenant_id = :tenantId', { tenantId })
      .andWhere(`${resource}.code = :code`, { code });

    if (ignoreId) {
      query.andWhere(`${resource}.id != :ignoreId`, { ignoreId });
    }

    if (await query.getExists()) {
      throw new ConflictException('Código já está em uso.');
    }
  }

  private selectChildRelations(query: ReturnType<Repository<ObjectLiteral>['createQueryBuilder']>, resource: keyof RepositoryMap): void {
    if (resource === 'budgetItems') {
      query.leftJoinAndSelect(`${resource}.product`, 'product');
    }

    if (resource === 'budgetStatuses') {
      query.leftJoinAndSelect(`${resource}.changedByUser`, 'changedByUser');
    }

    if (resource === 'invoices' || resource === 'emails') {
      query.leftJoinAndSelect(`${resource}.customer`, 'customer');
      query.leftJoinAndSelect(`${resource}.user`, 'user');
    }

    if (resource === 'expenses') {
      query.leftJoinAndSelect(`${resource}.supplier`, 'supplier');
      query.leftJoinAndSelect(`${resource}.category`, 'category');
    }

    if (resource === 'entries') {
      query.leftJoinAndSelect(`${resource}.category`, 'category');
    }
  }

  private async ensureChildRelations(resource: string, data: Payload, tenantId: number, currentUserId: number, partial = false): Promise<void> {
    if (!partial || 'budgetId' in data) {
      await this.ensureBudget(data.budgetId as number, tenantId);
    }

    if (resource === 'budgetItems' && (!partial || 'productId' in data)) {
      await this.ensureProduct(data.productId as number, tenantId);
    }

    if ((resource === 'expenses' || resource === 'entries') && 'categoryId' in data) {
      await this.ensureOptionalCategory(data.categoryId as number | null, tenantId);
    }

    if (resource === 'expenses' && 'supplierId' in data) {
      await this.ensureOptionalSupplier(data.supplierId as number | null, tenantId);
    }

    if (resource === 'budgetStatuses' && 'changedBy' in data && data.changedBy) {
      await this.ensureUser(data.changedBy as number, tenantId);
    }

    if ((resource === 'invoices' || resource === 'emails') && (!partial || 'customerId' in data)) {
      await this.ensureCustomer(data.customerId as number, tenantId);
    }

    if ((resource === 'invoices' || resource === 'emails') && (!partial || 'userId' in data)) {
      data.userId = data.userId ?? currentUserId;
      await this.ensureUser(data.userId as number, tenantId);
    }
  }

  private async ensureBudget(id: number, tenantId: number): Promise<void> {
    if (!id || !(await this.budgets.existsBy({ id, tenantId }))) {
      throw new BadRequestException('Orçamento inválido para este tenant.');
    }
  }

  private async ensureProduct(id: number, tenantId: number): Promise<void> {
    if (!id || !(await this.products.existsBy({ id, tenantId }))) {
      throw new BadRequestException('Produto inválido para este tenant.');
    }
  }

  private ensureProductType(productType: string | undefined): void {
    if (!productType || !PRODUCT_TYPES.has(productType)) {
      throw new BadRequestException('Tipo de produto inválido.');
    }
  }

  private async ensureCustomer(id: number, tenantId: number): Promise<void> {
    if (!id || !(await this.customers.existsBy({ id, tenantId }))) {
      throw new BadRequestException('Cliente inválido para este tenant.');
    }
  }

  private async ensureUser(id: number, tenantId: number): Promise<void> {
    if (!id || !(await this.users.existsBy({ id, tenantId }))) {
      throw new BadRequestException('Usuário inválido para este tenant.');
    }
  }

  private async ensureOptionalCategory(id: number | null | undefined, tenantId: number): Promise<void> {
    if (id != null && !(await this.categories.existsBy({ id, tenantId }))) {
      throw new BadRequestException('Categoria inválida para este tenant.');
    }
  }

  private async ensureOptionalSupplier(id: number | null | undefined, tenantId: number): Promise<void> {
    if (id != null && !(await this.suppliers.existsBy({ id, tenantId }))) {
      throw new BadRequestException('Fornecedor inválido para este tenant.');
    }
  }
}
