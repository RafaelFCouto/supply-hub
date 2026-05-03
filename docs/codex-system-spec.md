# Technical Specification — Modular Monolith Inventory System

## 1. Overview

Build a full-stack inventory management system using a **modular monolith architecture**, with clear module boundaries to allow future extraction into microservices.

The application must be implemented with:

- **Back-end:** NestJS with TypeScript
- **Front-end:** React with TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Tests:** Endpoint tests per module
- **Deploy:** Docker Compose
- **Architecture:** Modular Monolith
- **Multi-tenancy:** Required from the beginning
- **Future evolution:** Gradual extraction of selected modules into microservices

All source code, file names, classes, methods, DTOs, entities, services and variables must be written in **English**.

Comments are allowed in **pt-BR**, especially when explaining business rules or non-obvious decisions.

---

## 2. Main Goal

Create a maintainable **multi-tenant** system with independent business modules, organized in a way that reduces coupling between domains and prepares the codebase for a future migration from modular monolith to microservices.

The system must support multiple tenants in the same application instance, ensuring logical data isolation between companies, organizations or clients.

The initial modules are:

1. Users and Permissions
2. Products
3. Suppliers
4. Materials
5. Reports

---

## 3. Architectural Decision

The system must start as a **single deployable back-end application**, but internally organized as independent modules.

Each module must contain its own:

- Controller
- Service
- Repository
- DTOs
- Tests
- Module definition

Recommended folder structure:

```txt
project-root/
  backend/
    src/
      app.module.ts
      main.ts

      common/
        filters/
        guards/
        interceptors/
        decorators/
        exceptions/
        pagination/
        utils/

      config/
        env.validation.ts
        app.config.ts
        database.config.ts

      database/
        prisma.service.ts
        prisma.module.ts

      modules/
        tenants/
          tenants.module.ts
          tenants.controller.ts
          tenants.service.ts
          tenants.repository.ts
          dto/
            create-tenant.dto.ts
            update-tenant.dto.ts
          tests/
            tenants.test.ts

        auth/
          auth.module.ts
          auth.controller.ts
          auth.service.ts
          dto/
            login.dto.ts
          tests/
            auth.test.ts

        users/
          users.module.ts
          users.controller.ts
          users.service.ts
          users.repository.ts
          dto/
            create-user.dto.ts
            update-user.dto.ts
          tests/
            users.test.ts

        permissions/
          permissions.module.ts
          permissions.controller.ts
          permissions.service.ts
          permissions.repository.ts
          dto/
            create-role.dto.ts
            update-role.dto.ts
          tests/
            permissions.test.ts

        products/
          products.module.ts
          products.controller.ts
          products.service.ts
          products.repository.ts
          dto/
            create-product.dto.ts
            update-product.dto.ts
          tests/
            products.test.ts

        suppliers/
          suppliers.module.ts
          suppliers.controller.ts
          suppliers.service.ts
          suppliers.repository.ts
          dto/
            create-supplier.dto.ts
            update-supplier.dto.ts
          tests/
            suppliers.test.ts

        materials/
          materials.module.ts
          materials.controller.ts
          materials.service.ts
          materials.repository.ts
          dto/
            create-material.dto.ts
            update-material.dto.ts
          tests/
            materials.test.ts

        reports/
          reports.module.ts
          reports.controller.ts
          reports.service.ts
          tests/
            reports.test.ts

  frontend/
    src/
      app/
      components/
      pages/
      routes/
      services/
      hooks/
      types/
      modules/
        users/
        permissions/
        products/
        suppliers/
        materials/
        reports/

  docker-compose.yml
  README.md
```

---

## 4. Back-end Requirements

### 4.1 Framework

Use **NestJS with TypeScript**.

The API must follow RESTful principles and expose JSON responses.

### 4.2 API Versioning

All routes must be prefixed with `/api/v1`.

Example:

```txt
GET /api/v1/products
POST /api/v1/products
GET /api/v1/products/:id
PATCH /api/v1/products/:id
DELETE /api/v1/products/:id
```

### 4.3 Code Language

All code must be written in English:

```ts
class ProductsService {}
class CreateProductDto {}
const productName = 'Example';
```

Comments may be written in pt-BR:

```ts
// Regra de negócio: produtos inativos não devem aparecer na listagem padrão.
```

---

## 5. Database and ORM

### 5.1 Database

Use **PostgreSQL**.

### 5.2 ORM

Use **Prisma**.

The Prisma schema must be located at:

```txt
backend/prisma/schema.prisma
```

Migrations must be managed through Prisma commands:

```bash
npx prisma migrate dev --name migration_name
npx prisma migrate deploy
npx prisma generate
```

### 5.3 Prisma Service

Create a reusable Prisma module and service:

```txt
src/database/prisma.module.ts
src/database/prisma.service.ts
```

All repositories must access the database through `PrismaService`.

Controllers must not access Prisma directly.
Services should preferably not access Prisma directly.
Database access should be isolated in repositories.

---

## 6. Multi-Tenant Architecture

The system must be designed as a **multi-tenant application**.

A tenant represents a company, organization or client using the system. Each tenant must only access its own data.

### 6.1 Tenant Identification

Each authenticated user must be associated with one tenant.

The tenant context must be resolved from the authenticated user, preferably through the JWT payload.

Suggested JWT payload:

```json
{
  "sub": 1,
  "email": "admin@example.com",
  "tenantId": 1,
  "roleIds": [1]
}
```

The API must not trust `tenantId` sent directly in request bodies for protected business operations.

The tenant must be resolved from the authenticated request context.

### 6.2 Tenant Data Isolation

All tenant-owned business entities must include a `tenantId` field.

Examples:

```txt
User
Product
Supplier
Material
MaterialMovement
Role
Permission assignments
```

Every database query for tenant-owned data must filter by `tenantId`.

Example:

```ts
const product = await this.prisma.product.findFirst({
  where: {
    id: productId,
    tenantId: currentUser.tenantId,
  },
});
```

Avoid using `findUnique` for tenant-scoped resources when the query only filters by `id`, because it can bypass tenant isolation.

Prefer `findFirst` with both `id` and `tenantId`, or define compound unique constraints when appropriate.

### 6.3 Tenant Model

Suggested fields:

```txt
Tenant
- id
- name
- document
- status
- createdAt
- updatedAt
```

Suggested status values:

```txt
ACTIVE
INACTIVE
SUSPENDED
```

### 6.4 Tenant-Aware Repositories

Repositories must receive tenant context explicitly for all tenant-scoped operations.

Example:

```ts
findAll(params: { tenantId: number; page: number; limit: number })
findById(params: { tenantId: number; id: number })
create(params: { tenantId: number; data: CreateProductDto })
update(params: { tenantId: number; id: number; data: UpdateProductDto })
deactivate(params: { tenantId: number; id: number })
```

Controllers should extract the authenticated user context and pass `tenantId` to services.

Services should pass `tenantId` to repositories.

### 6.5 Tenant-Aware Permissions

Roles and permissions must be tenant-aware.

A role created for one tenant must not be visible or usable by another tenant.

Global system-level roles may exist in the future, but the initial implementation should assume tenant-scoped roles.

### 6.6 Tenant-Aware Reports

Reports must always filter data by `tenantId`.

A tenant must never generate reports using data from another tenant.

### 6.7 Database Constraints

Use indexes and constraints that support tenant isolation and query performance.

Examples:

```txt
Product: index tenantId
Supplier: index tenantId
Material: index tenantId
MaterialMovement: index tenantId
User: unique tenantId + email
Product: unique tenantId + sku
Supplier: unique tenantId + document
```

### 6.8 Prisma Multi-Tenant Modeling

All tenant-owned models must include a relation with `Tenant`.

Example:

```prisma
model Tenant {
  id        Int       @id @default(autoincrement())
  name      String
  document  String?
  status    String    @default("ACTIVE")
  users     User[]
  products  Product[]
  suppliers Supplier[]
  materials Material[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Product {
  id          Int      @id @default(autoincrement())
  tenantId    Int
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  name        String
  description String?
  sku         String
  status      String   @default("ACTIVE")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([tenantId, sku])
  @@index([tenantId])
}
```

### 6.9 Testing Multi-Tenant Behavior

Endpoint tests must include tenant isolation scenarios.

Minimum required scenarios:

```txt
A user from tenant A must not access tenant B products
A user from tenant A must not update tenant B suppliers
A user from tenant A must not list tenant B materials
Reports must only include data from the authenticated user's tenant
Duplicate SKU should be blocked within the same tenant
The same SKU may exist in different tenants
```

---

## 7. Core Modules

## 7.1 Tenants Module

Responsible for tenant registration and management.

### Main Responsibilities

- Create tenants
- List tenants
- Get tenant by ID
- Update tenant
- Suspend or deactivate tenant

### Suggested Fields

```txt
Tenant
- id
- name
- document
- status
- createdAt
- updatedAt
```

### Suggested Endpoints

```txt
POST   /api/v1/tenants
GET    /api/v1/tenants
GET    /api/v1/tenants/:id
PATCH  /api/v1/tenants/:id
DELETE /api/v1/tenants/:id
```

Tenant management endpoints may be restricted to system-level administrators.

---

## 7.2 Users Module

Responsible for user management and authentication-related user data.

### Main Responsibilities

- Create users
- List users
- Get user by ID
- Update user
- Deactivate user
- Associate users with roles
- Store login credentials securely

### Suggested Fields

```txt
User
- id
- tenantId
- name
- email
- passwordHash
- status
- createdAt
- updatedAt
```

### Suggested Endpoints

```txt
POST   /api/v1/users
GET    /api/v1/users
GET    /api/v1/users/:id
PATCH  /api/v1/users/:id
DELETE /api/v1/users/:id
```

The `DELETE` operation should preferably be a soft delete or status update instead of a hard delete.

---

## 7.3 Permissions Module

Responsible for roles, permissions and access control.

### Main Responsibilities

- Create roles
- List roles
- Update roles
- Define permissions per role
- Validate user access to protected routes

### Suggested Concepts

```txt
Role
- id
- tenantId
- name
- description
- createdAt
- updatedAt

Permission
- id
- resource
- action
- createdAt
- updatedAt

RolePermission
- roleId
- permissionId
```

### Permission Examples

```txt
products:create
products:read
products:update
products:delete
suppliers:create
suppliers:read
materials:create
reports:read
```

### Suggested Endpoints

```txt
POST   /api/v1/roles
GET    /api/v1/roles
GET    /api/v1/roles/:id
PATCH  /api/v1/roles/:id
DELETE /api/v1/roles/:id

POST   /api/v1/permissions
GET    /api/v1/permissions
```

---

## 7.4 Products Module

Responsible for product catalog management.

### Main Responsibilities

- Create products
- List products
- Get product details
- Update products
- Deactivate products
- Associate products with suppliers or materials when needed

### Suggested Fields

```txt
Product
- id
- tenantId
- name
- description
- sku
- status
- createdAt
- updatedAt
```

### Suggested Endpoints

```txt
POST   /api/v1/products
GET    /api/v1/products
GET    /api/v1/products/:id
PATCH  /api/v1/products/:id
DELETE /api/v1/products/:id
```

---

## 7.5 Suppliers Module

Responsible for supplier registration and management.

### Main Responsibilities

- Create suppliers
- List suppliers
- Get supplier details
- Update suppliers
- Deactivate suppliers
- Link suppliers to products or materials when needed

### Suggested Fields

```txt
Supplier
- id
- tenantId
- name
- document
- email
- phone
- status
- createdAt
- updatedAt
```

### Suggested Endpoints

```txt
POST   /api/v1/suppliers
GET    /api/v1/suppliers
GET    /api/v1/suppliers/:id
PATCH  /api/v1/suppliers/:id
DELETE /api/v1/suppliers/:id
```

---

## 7.6 Materials Module

Responsible for material inventory and stock movement.

### Main Responsibilities

- Create materials
- List materials
- Get material details
- Update materials
- Deactivate materials
- Register stock movements
- Track current quantity

### Suggested Fields

```txt
Material
- id
- tenantId
- name
- description
- unit
- currentQuantity
- minimumQuantity
- status
- supplierId
- createdAt
- updatedAt
```

### Suggested Stock Movement Fields

```txt
MaterialMovement
- id
- tenantId
- materialId
- type
- quantity
- reason
- createdByUserId
- createdAt
```

Movement types:

```txt
IN
OUT
ADJUSTMENT
```

### Suggested Endpoints

```txt
POST   /api/v1/materials
GET    /api/v1/materials
GET    /api/v1/materials/:id
PATCH  /api/v1/materials/:id
DELETE /api/v1/materials/:id

POST   /api/v1/materials/:id/movements
GET    /api/v1/materials/:id/movements
```

---

## 7.7 Reports Module

Responsible for generating operational reports based on data from other modules.

### Main Responsibilities

- Inventory report
- Low stock report
- Supplier report
- Product report
- Material movement report

### Important Architectural Rule

The Reports module must avoid direct ownership of business data from other modules.

Reports may read aggregated data, but business rules must remain inside their original modules whenever possible.

Reports must always respect tenant isolation.

### Suggested Endpoints

```txt
GET /api/v1/reports/inventory
GET /api/v1/reports/low-stock
GET /api/v1/reports/suppliers
GET /api/v1/reports/products
GET /api/v1/reports/material-movements
```

---

## 8. Testing Requirements

Each module must have its own endpoint test file.

Examples:

```txt
src/modules/products/tests/products.test.ts
src/modules/suppliers/tests/suppliers.test.ts
src/modules/materials/tests/materials.test.ts
src/modules/users/tests/users.test.ts
src/modules/permissions/tests/permissions.test.ts
src/modules/reports/tests/reports.test.ts
```

Tests must validate the module endpoints, including success and error scenarios.

Recommended toolset:

- Jest
- Supertest

### Minimum Test Scenarios Per CRUD Module

For each CRUD module, add tests for:

```txt
POST create resource successfully
POST return validation error when body is invalid
GET list resources successfully
GET return resource by ID successfully
GET return 404 when resource does not exist
PATCH update resource successfully
DELETE deactivate resource successfully
Tenant A must not access Tenant B data
```

### Test Naming Pattern

Use descriptive test names in English:

```ts
describe('Products endpoints', () => {
  it('should create a product successfully', async () => {});
  it('should return validation error when name is missing', async () => {});
  it('should not allow a user from another tenant to access the product', async () => {});
});
```

---

## 9. Front-end Requirements

### 9.1 Framework

Use **React with TypeScript**.

### 9.2 Suggested Structure

```txt
frontend/
  src/
    app/
    components/
    pages/
    routes/
    services/
    hooks/
    types/
    modules/
      users/
      permissions/
      products/
      suppliers/
      materials/
      reports/
```

### 9.3 Main Screens

Initial screens:

```txt
Login
Dashboard
Users management
Roles and permissions management
Products management
Suppliers management
Materials management
Reports
```

### 9.4 API Communication

Create a centralized API client:

```txt
src/services/api.ts
```

Use environment variable for the API base URL:

```txt
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

---

## 10. Authentication and Authorization

The system should implement JWT-based authentication.

Authentication must be tenant-aware. After login, the generated token must include the authenticated user's `tenantId`.

### Suggested Auth Flow

```txt
POST /api/v1/auth/login
```

Request:

```json
{
  "email": "admin@example.com",
  "password": "password"
}
```

Response:

```json
{
  "accessToken": "jwt_token",
  "user": {
    "id": 1,
    "tenantId": 1,
    "name": "Admin",
    "email": "admin@example.com"
  }
}
```

Protected routes must validate the JWT token.

Permissions should be checked using guards or decorators.

Example:

```ts
@RequirePermissions('products:create')
@Post()
create(@Body() dto: CreateProductDto) {}
```

---

## 11. API Response Pattern

Use a consistent response format.

### Success Response

```json
{
  "data": {},
  "message": "Operation completed successfully"
}
```

### Paginated Response

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 100,
    "totalPages": 10
  }
}
```

### Error Response

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    "name should not be empty"
  ]
}
```

---

## 12. Validation

Use DTO validation with:

- class-validator
- class-transformer

Example:

```ts
export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
```

---

## 13. Docker Compose

The project must run locally with Docker Compose.

Minimum services:

```txt
backend
frontend
postgres
```

Optional services:

```txt
pgadmin
```

Suggested root structure:

```txt
project-root/
  backend/
  frontend/
  docker-compose.yml
  README.md
```

The Docker Compose setup must allow developers to run the full system locally.

Suggested command:

```bash
docker compose up --build
```

---

## 14. Environment Variables

### Back-end

```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/inventory_db
JWT_SECRET=change_me
JWT_EXPIRES_IN=1d
PORT=3000
NODE_ENV=development
```

### Front-end

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

---

## 15. Future Microservices Preparation

Although the first version is a modular monolith, the implementation must consider future module extraction.

### Rules

- Avoid circular dependencies between modules.
- Do not access another module repository directly.
- Prefer communication through services or defined interfaces.
- Keep DTOs and business rules inside their own modules.
- Avoid shared business logic in `common/` unless it is truly generic.
- Keep database access isolated by repository.
- Keep tenant isolation as a core rule in every extracted service.

### Possible Future Extraction Order

Suggested order for future microservices:

```txt
1. Reports service
2. Materials service
3. Products service
4. Suppliers service
5. Users and permissions service
```

Reports are usually easier to extract first because they are more read-oriented and less transactional.

---

## 16. Development Guidelines for Codex

When generating code, follow these rules:

1. Use English for all code artifacts.
2. Implement the system as multi-tenant from the beginning.
3. Add `tenantId` to every tenant-owned entity.
4. Always filter tenant-owned queries by `tenantId`.
5. Never trust `tenantId` from request body for protected operations.
6. Resolve tenant context from the authenticated user/JWT.
7. Add endpoint tests for tenant isolation scenarios.
8. Use pt-BR comments only when useful to explain business decisions.
9. Keep each module isolated.
10. Create endpoint tests for every module.
11. Use Prisma for database models and migrations.
12. Do not put business logic in controllers.
13. Controllers should only handle HTTP concerns.
14. Services should handle business rules.
15. Repositories should handle database access.
16. Use DTOs for request validation.
17. Use consistent API response patterns.
18. Use Docker Compose for local development.
19. Keep the architecture ready for future microservice extraction.

---

## 17. Initial Implementation Order

Recommended implementation sequence:

```txt
1. Create project structure
2. Configure Docker Compose
3. Configure PostgreSQL
4. Configure Prisma
5. Create Prisma schema and initial migration
6. Create Tenant model and tenant-aware base structure
7. Configure authentication with tenant context
8. Configure NestJS modules
9. Implement Users module
10. Implement Auth and Permissions
11. Implement Products module
12. Implement Suppliers module
13. Implement Materials module
14. Implement Reports module
15. Implement endpoint tests per module
16. Implement tenant isolation tests
17. Create React app structure
18. Implement login and dashboard
19. Implement CRUD screens
20. Implement reports screens
```

---

## 18. Definition of Done

The implementation is considered complete when:

- The back-end runs with Docker Compose.
- The front-end runs with Docker Compose.
- PostgreSQL runs with Docker Compose.
- Prisma migrations are configured.
- The system is multi-tenant.
- Tenant-owned data is isolated by `tenantId`.
- All modules are implemented with controllers, services, repositories and DTOs.
- Each module has its own endpoint test file.
- Endpoint tests include tenant isolation scenarios.
- All main endpoints follow RESTful conventions.
- Authentication and permissions are implemented.
- The code is written in English.
- Comments, when needed, may be written in pt-BR.
- The architecture is modular and prepared for gradual microservice extraction.
