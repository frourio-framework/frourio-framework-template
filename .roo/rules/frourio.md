This project is based on InterfaceX original web framework `frourio-framework`(just `f-f` for shorthand).
The `f-f` includes a variety of composable functions and several best practices found in InterfaceX projects. Here defines several characteristics and concept on `f-f`. Given this instruction, the generated code needs to be created aligning with this `f-f` concept.

## Basic concept of `f-f`

- this uses `frourio.js`
- official doc: https://frourio.com/docs
- repo: https://github.com/frouriojs/frourio

## @frouvel/kaname - Core Framework Modules

`@frouvel/kaname` is the core module collection for frourio-framework, inspired by Laravel's Illuminate namespace. It provides:

- **HTTP Response Handling**: RFC9457-compliant error responses via [`ApiResponse`](backend-api/@frouvel/kaname/http/ApiResponse.ts) facade
- **Response Builder**: Fluent API for validation and response creation via [`ResponseBuilder`](backend-api/@frouvel/kaname/http/ResponseBuilder.ts)
- **Error Handling**: Structured error classes in [`@frouvel/kaname/error`](backend-api/@frouvel/kaname/error/)
- **Validation**: Zod-based validation utilities via [`Validator`](backend-api/@frouvel/kaname/validation/Validator.ts)
- **Pagination**: Pagination utilities in [`@frouvel/kaname/paginator`](backend-api/@frouvel/kaname/paginator/)

### Key Modules

#### HTTP Response Module (`@frouvel/kaname/http`)

The [`ApiResponse`](backend-api/@frouvel/kaname/http/ApiResponse.ts:284) facade provides a unified API for creating HTTP responses:

```ts
import { ApiResponse } from "$/@frouvel/kaname/http/ApiResponse";

// Success response
ApiResponse.success({ id: 1, name: "John" });

// Error responses
ApiResponse.notFound("User not found", { userId: "123" });
ApiResponse.badRequest("Invalid input", { field: "email" });
ApiResponse.unauthorized("Invalid token");
ApiResponse.forbidden("Insufficient permissions");
ApiResponse.conflict("User already exists");
ApiResponse.internalServerError("Database error");

// Method-specific error handlers
ApiResponse.method.get(error); // 404 default
ApiResponse.method.post(error); // 500 default
ApiResponse.method.put(error); // 500 default
ApiResponse.method.patch(error); // 403 default
ApiResponse.method.delete(error); // 500 default
```

#### Response Builder (`@frouvel/kaname/http/ResponseBuilder`)

The [`ResponseBuilder`](backend-api/@frouvel/kaname/http/ResponseBuilder.ts:28) provides a fluent API for validation and response creation:

```ts
import { ResponseBuilder } from "$/@frouvel/kaname/http/ApiResponse";
import { z } from "zod";

// Pattern 1: .handle() - Full control over response
ResponseBuilder.create()
  .withZodValidation(body, userSchema)
  .handle((data) => {
    if (data.age < 18) {
      return ApiResponse.forbidden("未成年は登録できません");
    }
    return ApiResponse.success(data);
  });

// Pattern 2: .then() - Alias for .handle()
ResponseBuilder.create()
  .withZodValidation(body, userSchema)
  .then((data) => {
    // Same as .handle()
    return ApiResponse.success(data);
  });

// Pattern 3: .executeWithSuccess() - Auto-wraps in success response
ResponseBuilder.create()
  .withZodValidation(body, userSchema)
  .executeWithSuccess((data) => {
    if (data.age < 18) {
      return ApiResponse.forbidden("未成年です");
    }
    // No need to return ApiResponse.success(), it's automatic
    return { message: "Success", data };
  });
```

#### Error Classes (`@frouvel/kaname/error`)

Structured error classes that automatically convert to RFC9457 Problem Details:

```ts
import {
  NotFoundError,
  ValidationError,
  UnauthorizedError,
} from "$/@frouvel/kaname/error/CommonErrors";

// Throw structured errors
throw NotFoundError.create("User not found", { userId: "123" });
throw ValidationError.create("Invalid input", {
  errors: [{ field: "email", message: "Invalid format" }],
});
throw UnauthorizedError.create("Invalid token", { reason: "Expired" });
```

### `f-f` file structure

#### backend-api/api

- file based routing
- controller uses UseCase classes and handles returned promises
- **MUST** use [`ApiResponse`](backend-api/@frouvel/kaname/http/ApiResponse.ts:284) facade for all responses
- **SHOULD** use [`ResponseBuilder`](backend-api/@frouvel/kaname/http/ResponseBuilder.ts:28) for validation-heavy endpoints

##### controller.ts

Modern controller patterns using `@frouvel/kaname`:

**Pattern 1: Simple UseCase with error handling**

```ts
import { ApiResponse } from "$/@frouvel/kaname/http/ApiResponse";
import { FindUserUseCase } from "$/domain/user/usecase/FindUser.usecase";
import { defineController } from "./$relay";

export default defineController(() => ({
  get: ({ params }) =>
    FindUserUseCase.create()
      .handleById({ id: params.id })
      .then(ApiResponse.success)
      .catch(ApiResponse.method.get),
}));
```

**Pattern 2: With validation using ResponseBuilder**

```ts
import {
  ApiResponse,
  ResponseBuilder,
} from "$/@frouvel/kaname/http/ApiResponse";
import { CreateUserUseCase } from "$/domain/user/usecase/CreateUser.usecase";
import { defineController } from "./$relay";
import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().int().positive(),
});

export default defineController(() => ({
  post: ({ body }) =>
    ResponseBuilder.create()
      .withZodValidation(body, createUserSchema)
      .handle((data) => {
        if (data.age < 18) {
          return ApiResponse.forbidden("未成年は登録できません", {
            minAge: 18,
            providedAge: data.age,
          });
        }

        return CreateUserUseCase.create()
          .handle(data)
          .then(ApiResponse.success)
          .catch(ApiResponse.method.post);
      }),
}));
```

**Pattern 3: Multiple operations with pagination**

```ts
import { ApiResponse } from "$/@frouvel/kaname/http/ApiResponse";
import { PaginateUsersUseCase } from "$/domain/user/usecase/PaginateUsers.usecase";
import { CreateUserUseCase } from "$/domain/user/usecase/CreateUser.usecase";
import { defineController } from "./$relay";

export default defineController(() => ({
  get: ({ query }) =>
    PaginateUsersUseCase.create()
      .handle({
        page: query.page,
        limit: query.limit,
        search: query.searchValue ? { value: query.searchValue } : undefined,
      })
      .then(ApiResponse.success)
      .catch(ApiResponse.method.get),

  post: ({ body }) =>
    CreateUserUseCase.create()
      .handle({
        name: body.name,
        email: body.email,
        age: body.age,
      })
      .then(ApiResponse.success)
      .catch(ApiResponse.method.post),
}));
```

**Pattern 4: Direct response without UseCase**

```ts
import { ApiResponse } from "$/@frouvel/kaname/http/ApiResponse";
import { defineController } from "./$relay";

export default defineController(() => ({
  get: () => ApiResponse.success({ message: "Health check OK" }),

  delete: ({ params }) => {
    // Direct business logic
    if (!canDelete(params.id)) {
      return ApiResponse.forbidden("Cannot delete this resource");
    }

    deleteResource(params.id);
    return ApiResponse.success({ deleted: true });
  },
}));
```

##### index.ts

- this is aspida type definition basically
- since it needs to pass type to frontend API client, it requires importing common types shared with frontend, import from `backend-api/commonTypesWithClient`. The `backend-api/commonTypesWithClient` is also imported as type in `frontend-web` and frontend can import mutual common type definitions.
- **MUST** use [`ProblemDetails`](backend-api/commonTypesWithClient/ProblemDetails.types.ts) type for error responses
- typical index.ts example given below

```ts
import type { DefineMethods } from "aspida";
import type { ProblemDetails } from "commonTypesWithClient";

export type Methods = DefineMethods<{
  get: {
    resBody: string | ProblemDetails;
  };
  delete: {
    resBody: void | ProblemDetails;
  };
}>;
```

```ts
import { UserModelDto } from "commonTypesWithClient";
import type { DefineMethods } from "aspida";
import type { ProblemDetails } from "commonTypesWithClient";

export type Methods = DefineMethods<{
  get: {
    resBody:
      | {
          user: UserModelDto;
        }
      | ProblemDetails;
  };
}>;
```

```ts
import {
  PaginationMeta,
  UserModelDto,
  ProblemDetails,
} from "commonTypesWithClient";
import type { DefineMethods } from "aspida";

export type Methods = DefineMethods<{
  get: {
    query: {
      page: number;
      limit: number;
      searchValue?: string;
    };
    resBody:
      | {
          data: UserModelDto[];
          meta: PaginationMeta;
        }
      | ProblemDetails;
  };
  post: {
    reqBody: {
      name: string;
      email: string;
      age: number;
    };
    resBody: UserModelDto | ProblemDetails;
  };
}>;
```

#### backend-api/domain

- aspect oriented file structure
- example structure is below
  - typically includes several mutual directory
    - model
    - repository
    - usecase
    - service
- dependency flow
  - usecase can import another usecase, service, repository, model
  - service can import another service, repository, model
  - repository can import model/prisma client
  - model can't import aforementioned layers(usecase, service, repository)

```
/home/mikana0918/Code/interfacex/torrent-watcher/backend-api/domain
├── admin
│   ├── model
│   │   └── Admin.model.ts
│   ├── repository
│   │   └── Admin.repository.ts
│   └── usecase
│       ├── InitAdmin.usecase.ts
│       └── SignInAdmin.usecase.ts
├── user
│   ├── model
│   │   └── User.model.ts
│   ├── repository
│   │   └── User.repository.ts
│   ├── service
│   │   └── ValidateUserAge.service.ts
│   └── usecase
│       ├── CreateUser.usecase.ts
│       ├── FindUser.usecase.ts
│       └── PaginateUsers.usecase.ts
```

##### backend-api/domain/model

- model directory
- typically automatically generated by prisma generator `frourio-framework-prisma-generators`
  - without autogenerated model or don't use, need to define original model here
  - with autogenerated model, typically the code just can import the model/DTO type definition in `prisma/__generated__/models/XXXX.model.ts`. (XXX is what you want)
- example model look like this

```ts
import { Prisma, User as PrismaUser } from "@prisma/client";

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type UserModelDto = {
  id: number;
  name: string;
  email: string;
  age: number;
  createdAt: string;
  updatedAt: string;
};

export type UserModelConstructorArgs = {
  id: number;
  name: string;
  email: string;
  age: number;
  createdAt: Date;
  updatedAt: Date;
};

export type UserModelFromPrismaValueArgs = {
  self: PrismaUser;
};

export class UserModel {
  private readonly _id: number;
  private readonly _name: string;
  private readonly _email: string;
  private readonly _age: number;
  private readonly _createdAt: Date;
  private readonly _updatedAt: Date;

  constructor(args: UserModelConstructorArgs) {
    this._id = args.id;
    this._name = args.name;
    this._email = args.email;
    this._age = args.age;
    this._createdAt = args.createdAt;
    this._updatedAt = args.updatedAt;
  }

  static fromPrismaValue(args: UserModelFromPrismaValueArgs) {
    return new UserModel({
      id: args.self.id,
      name: args.self.name,
      email: args.self.email,
      age: args.self.age,
      createdAt: args.self.createdAt,
      updatedAt: args.self.updatedAt,
    });
  }

  toDto(): UserModelDto {
    return {
      id: this._id,
      name: this._name,
      email: this._email,
      age: this._age,
      createdAt: this._createdAt?.toISOString() ?? null,
      updatedAt: this._updatedAt?.toISOString() ?? null,
    };
  }

  get id() {
    return this._id;
  }

  get name() {
    return this._name;
  }

  get email() {
    return this._email;
  }

  get age() {
    return this._age;
  }

  get createdAt() {
    return this._createdAt;
  }

  get updatedAt() {
    return this._updatedAt;
  }
}
```

##### backend-api/domain/repository

- repository class defined
- basically 1:1 associated with prisma model
  - DDD wise, it can be okay to used in the context of aggregation
    - but sometimes confusing with aggregate model
  - let's write more code maybe, create many repository and try to make things work well
- should export interface
- constructor needs to be public since prisma transaction client might be passing
- method name are preferred to have identifier suffixed
  - XXXXById
  - XXXXByUserId
- requires consistent name for method between same directories
  - paginate, create, updateById, count...
- don't return DTO here. just return Model
  - upper layers want to manipulate as Model not DTO
- **MUST** use [`createPaginationMeta`](backend-api/@frouvel/kaname/paginator/createPaginationMeta.ts:3) from `@frouvel/kaname/paginator` for pagination

```ts
import { createPaginationMeta } from "$/@frouvel/kaname/paginator/createPaginationMeta";
import { PaginationMeta } from "commonTypesWithClient";
import { UserModel } from "$/prisma/__generated__/models/User.model";
import { PrismaClient } from "@prisma/client";

export interface IUserRepository {
  create(args: {
    name: string;
    email: string;
    age: number;
  }): Promise<UserModel>;
  findById(args: { id: number }): Promise<UserModel | null>;
  updateById(args: {
    id: number;
    payload: {
      name?: string;
      email?: string;
      age?: number;
    };
  }): Promise<UserModel>;
  paginate(args: {
    limit: number;
    page: number;
    search?: { value: string };
  }): Promise<{ data: UserModel[]; meta: PaginationMeta }>;
  count(): Promise<number>;
}

export class UserRepository implements IUserRepository {
  constructor(private readonly _prisma: PrismaClient) {}

  async create(args: { name: string; email: string; age: number }) {
    const data = await this._prisma.user.create({
      data: {
        name: args.name,
        email: args.email,
        age: args.age,
      },
    });

    return UserModel.fromPrismaValue({ self: data });
  }

  async findById(args: { id: number }) {
    const data = await this._prisma.user.findUnique({
      where: { id: args.id },
    });

    if (!data) return null;

    return UserModel.fromPrismaValue({ self: data });
  }

  async updateById(args: {
    id: number;
    payload: {
      name?: string;
      email?: string;
      age?: number;
    };
  }) {
    const data = await this._prisma.user.update({
      where: { id: args.id },
      data: args.payload,
    });

    return UserModel.fromPrismaValue({ self: data });
  }

  async paginate(args: {
    limit: number;
    page: number;
    search?: { value: string };
  }) {
    const where = args.search
      ? {
          OR: [
            { name: { contains: args.search.value } },
            { email: { contains: args.search.value } },
          ],
        }
      : {};

    const data = await this._prisma.user.findMany({
      where,
      take: args.limit,
      skip: args.limit * (args.page - 1),
      orderBy: { createdAt: "desc" },
    });

    return {
      data: data.map((d) => UserModel.fromPrismaValue({ self: d })),
      meta: createPaginationMeta({
        totalCount: await this._prisma.user.count({ where }),
        perPage: args.limit,
      }),
    };
  }

  async count() {
    return this._prisma.user.count();
  }
}
```

##### backend-api/domain/service

- encapsulates common business logics seen in usecase
- declare its own interface and implement this
- follows `f-f` class coding rule
  - private fields starts with `_` and look like `private readonly _fields: FieldA`
  - constructor should be private
  - create factory method called `create` and initialize the class there
  - setup execution public method
    - sometimes several method can be used
      - handleById(args: {id: string})
      - handleByUserId(args: {userId: string})

```ts
import { IUserRepository, UserRepository } from "../repository/User.repository";
import { getPrismaClient } from "$/@frouvel/kaname/database";

export interface IValidateUserAgeService {
  handleByAge: (args: { age: number }) => Promise<boolean>;
}

export class ValidateUserAgeService implements IValidateUserAgeService {
  private readonly _userRepository: IUserRepository;
  private readonly _minAge: number = 18;

  private constructor(args: {
    userRepository: IUserRepository;
    minAge?: number;
  }) {
    this._userRepository = args.userRepository;
    if (args.minAge !== undefined) {
      this._minAge = args.minAge;
    }
  }

  static create(args?: { minAge?: number }) {
    return new ValidateUserAgeService({
      userRepository: new UserRepository(getPrismaClient()),
      minAge: args?.minAge,
    });
  }

  async handleByAge(args: { age: number }) {
    return args.age >= this._minAge;
  }
}
```

##### backend-api/domain/usecase

- mostly looks similar to service however it is the core of our backend business logic
- all the logic flows are here together
- unlike service, it won't export its interface
  - unlike service, it will be just used in api directly thus don't need interface definition
- **SHOULD** throw structured errors from `@frouvel/kaname/error` instead of generic Error
- follows same class coding rules as service

```ts
import { NotFoundError } from "$/@frouvel/kaname/error/CommonErrors";
import { getPrismaClient } from "$/@frouvel/kaname/database";
import { IUserRepository, UserRepository } from "../repository/User.repository";

export class FindUserUseCase {
  private readonly _userRepository: IUserRepository;

  private constructor(args: { userRepository: IUserRepository }) {
    this._userRepository = args.userRepository;
  }

  static create() {
    return new FindUserUseCase({
      userRepository: new UserRepository(getPrismaClient()),
    });
  }

  async handleById(args: { id: number }) {
    const user = await this._userRepository.findById({ id: args.id });

    if (!user) {
      throw NotFoundError.create(`User with ID ${args.id} not found`, {
        userId: args.id,
      });
    }

    return user.toDto();
  }
}
```

```ts
import { ValidationError } from "$/@frouvel/kaname/error/CommonErrors";
import { getPrismaClient } from "$/@frouvel/kaname/database";
import { IUserRepository, UserRepository } from "../repository/User.repository";
import {
  IValidateUserAgeService,
  ValidateUserAgeService,
} from "../service/ValidateUserAge.service";

export class CreateUserUseCase {
  private readonly _userRepository: IUserRepository;
  private readonly _validateUserAgeService: IValidateUserAgeService;

  private constructor(args: {
    userRepository: IUserRepository;
    validateUserAgeService: IValidateUserAgeService;
  }) {
    this._userRepository = args.userRepository;
    this._validateUserAgeService = args.validateUserAgeService;
  }

  static create() {
    return new CreateUserUseCase({
      userRepository: new UserRepository(getPrismaClient()),
      validateUserAgeService: ValidateUserAgeService.create(),
    });
  }

  async handle(args: { name: string; email: string; age: number }) {
    // Business validation using service
    const isValidAge = await this._validateUserAgeService.handleByAge({
      age: args.age,
    });

    if (!isValidAge) {
      throw ValidationError.create("User age is below minimum requirement", {
        minAge: 18,
        providedAge: args.age,
      });
    }

    const user = await this._userRepository.create({
      name: args.name,
      email: args.email,
      age: args.age,
    });

    return user.toDto();
  }
}
```

## Dependency Injection with Application Container

The framework provides a Laravel-style Application container for proper dependency injection. This is the **recommended approach** for accessing Prisma and other services.

### Accessing Application in Controllers

Controllers can access the Application container through the Fastify instance using helper functions:

```ts
import { ApiResponse } from "$/@frouvel/kaname/http/ApiResponse";
import { getApp, getPrisma } from "$/@frouvel/kaname/foundation";
import { FindUserUseCase } from "$/domain/user/usecase/FindUser.usecase";
import { defineController } from "./$relay";

export default defineController((fastify) => ({
  get: ({ params }) => {
    const app = getApp(fastify); // Get Application container

    return FindUserUseCase.create(app)
      .handleById({ id: params.id })
      .then(ApiResponse.success)
      .catch(ApiResponse.method.get);
  },
}));
```

**Alternative: Direct Prisma access**

```ts
import { getPrisma } from "$/@frouvel/kaname/foundation";
import { defineController } from "./$relay";

export default defineController((fastify) => ({
  get: () => {
    const prisma = getPrisma(fastify); // Direct Prisma access
    // Use for simple queries without UseCase
  },
}));
```

### Container-Based UseCase Pattern

UseCases should receive the Application instance to access container-registered services:

```ts
import { NotFoundError } from "$/@frouvel/kaname/error/CommonErrors";
import type { Application } from "$/@frouvel/kaname/foundation";
import type { PrismaClient } from "@prisma/client";
import { IUserRepository, UserRepository } from "../repository/User.repository";

export class FindUserUseCase {
  private readonly _userRepository: IUserRepository;

  private constructor(args: { userRepository: IUserRepository }) {
    this._userRepository = args.userRepository;
  }

  static create(app: Application) {
    const prisma = app.make<PrismaClient>("prisma");
    return new FindUserUseCase({
      userRepository: new UserRepository(prisma),
    });
  }

  async handleById(args: { id: number }) {
    const user = await this._userRepository.findById({ id: args.id });

    if (!user) {
      throw NotFoundError.create(`User with ID ${args.id} not found`, {
        userId: args.id,
      });
    }

    return user.toDto();
  }
}
```

### Legacy Pattern (Not Recommended)

The old pattern using `getPrismaClient()` directly still works but bypasses the container:

```ts
import { getPrismaClient } from '$/@frouvel/kaname/database';

// ❌ Bypasses container - avoid in new code
static create() {
  return new FindUserUseCase({
    userRepository: new UserRepository(getPrismaClient()),
  });
}
```

**Why avoid this?**

- Bypasses the Application container
- Harder to test (can't mock via container)
- Inconsistent with framework architecture
- Breaks the dependency injection pattern

### Container-Registered Services

The following services are available via the container:

- `prisma` - [`PrismaClient`](backend-api/@frouvel/kaname/database/PrismaClientManager.ts) instance
- `app` - Application instance itself
- `HttpKernel` - HTTP request handler
- `ConsoleKernel` - Console command handler
- `fastify` - Fastify instance (when running HTTP server)
- `config` - Configuration object (after LoadConfiguration bootstrapper)

Example:

```ts
const app = getApp(fastify);
const prisma = app.make<PrismaClient>("prisma");
const config = app.make<Record<string, any>>("config");
```

## Best Practices Summary

### Response Handling

- **MUST** use [`ApiResponse`](backend-api/@frouvel/kaname/http/ApiResponse.ts:284) facade for all controller responses
- **SHOULD** use [`ResponseBuilder`](backend-api/@frouvel/kaname/http/ResponseBuilder.ts:28) for endpoints with complex validation
- **MUST** use method-specific error handlers: `ApiResponse.method.get()`, `ApiResponse.method.post()`, etc.

### Error Handling

- **SHOULD** throw structured errors from [`@frouvel/kaname/error`](backend-api/@frouvel/kaname/error/) in UseCases
- **MUST** include relevant context in error details
- All errors automatically convert to RFC9457 Problem Details format

### Type Definitions

- **MUST** include [`ProblemDetails`](backend-api/commonTypesWithClient/ProblemDetails.types.ts) union type in all response types
- **MUST** import shared types from `commonTypesWithClient`

### Pagination

- **MUST** use [`createPaginationMeta`](backend-api/@frouvel/kaname/paginator/createPaginationMeta.ts:3) from `@frouvel/kaname/paginator`
- **MUST** return `{ data: T[]; meta: PaginationMeta }` structure

### Class Patterns

- Private fields: `private readonly _fieldName`
- Private constructor with static `create()` factory method
- Public execution methods: `handle()`, `handleById()`, `handleByUserId()`, etc.

## @frouvel/kaname Framework Additions

### Database Module (`@frouvel/kaname/database`)

The framework now includes a comprehensive database management module for Prisma:

**Location**: [`@frouvel/kaname/database/`](backend-api/@frouvel/kaname/database/)

**Features**:

- Connection pool management with configurable parameters
- Automatic retry logic with exponential backoff
- Graceful shutdown handling
- Health check functionality
- Connection reset capabilities

**Usage**:

```ts
import { getPrismaClient } from "$/@frouvel/kaname/database";

const prisma = getPrismaClient();
// Prisma client ready to use with connection pooling
```

**Environment Variables**:

- `DATABASE_CONNECTION_POOL_SIZE`: Max connections (default: 10)
- `DATABASE_CONNECTION_TIMEOUT`: Timeout in seconds (default: 30)
- `DATABASE_POOL_TIMEOUT`: Pool timeout in seconds (default: 2)

### Framework Service Providers (`@frouvel/kaname/foundation/providers`)

The framework provides built-in service providers that handle core functionality:

**Location**: [`@frouvel/kaname/foundation/providers/`](backend-api/@frouvel/kaname/foundation/providers/)

**Available Providers**:

1. **DatabaseServiceProvider**: Manages Prisma client lifecycle
   - Auto-registers `prisma` singleton in the application container
   - Handles database connection on boot
   - Implements graceful disconnection

2. **ConsoleServiceProvider**: Registers built-in console commands
   - `config:cache` - Cache configuration for production
   - `config:clear` - Clear configuration cache
   - `generate:config-types` - Generate type-safe config types
   - `inspire` - Display inspiring quote
   - `greet` - Example command with arguments
   - `tinker` - Interactive REPL with app context

**Registration** ([`bootstrap/app.ts`](backend-api/bootstrap/app.ts)):

```ts
import {
  Application,
  DatabaseServiceProvider,
  ConsoleServiceProvider,
} from "$/@frouvel/kaname/foundation";

const providers = [
  DatabaseServiceProvider,
  ConsoleServiceProvider,
  // Application providers here
];
```

### Artisan Console System

**Unified CLI**: All console commands are now managed through a single `npm run artisan` interface.

**Available Commands**:

```bash
npm run artisan                    # List all commands
npm run artisan config:cache       # Cache config
npm run artisan generate:config-types  # Generate types
npm run artisan tinker             # Interactive REPL
npm run artisan {your-command}     # Run custom command
```

### Application Structure

The framework enforces a clean separation between framework and application code:

```
backend-api/
├── @frouvel/kaname/              # FRAMEWORK code
│   ├── database/                 # Database utilities
│   ├── foundation/               # Application foundation
│   │   └── providers/            # Framework service providers
│   ├── docs/                     # Framework documentation
│   ├── scripts/                  # Standalone build scripts
│   │   └── generate-config-types.ts  # Fast config generation for CI
│   └── ...                       # Other framework modules
│
├── app/                          # APPLICATION code
│   ├── console/                  # Custom console commands
│   │   └── ExampleCommand.ts    # Example custom command
│   └── providers/                # Application service providers
│       └── AppServiceProvider.ts # Main app provider
│
├── config/                       # Configuration files
│   ├── *.ts                      # Config files
│   └── $types.ts                 # Auto-generated types
│
└── bootstrap/
    └── app.ts                    # Application bootstrap
```

### Creating Custom Commands

**3-Step Process**:

1. **Create command** in `app/console/YourCommand.ts`:

```ts
import { Command } from "$/@frouvel/kaname/console/Command";
import type { Application } from "$/@frouvel/kaname/foundation";

export class YourCommand extends Command {
  constructor(app: Application) {
    super(app);
  }

  protected signature() {
    return {
      name: "your:command",
      description: "Your command description",
      arguments: [{ name: "arg", description: "An argument", required: true }],
      options: [{ flags: "-o, --option <value>", description: "An option" }],
    };
  }

  async handle(arg: string, options: { option?: string }) {
    this.info(`Running command with: ${arg}`);
    if (options.option) {
      this.line(`Option value: ${options.option}`);
    }
    this.success("Done!");
  }
}
```

2. **Import** in `app/providers/AppServiceProvider.ts`:

```ts
import { YourCommand } from "$/app/console/YourCommand";
```

3. **Register** in `AppServiceProvider.boot()`:

```ts
async boot(app: Application): Promise<void> {
  const kernel = app.make<ConsoleKernel>('ConsoleKernel');

  kernel.registerCommands([
    new YourCommand(app),
    // More commands...
  ]);
}
```

### Build & CI Integration

The framework includes standalone scripts for fast CI/CD builds:

**Config Generation** ([`@frouvel/kaname/scripts/generate-config-types.ts`](backend-api/@frouvel/kaname/scripts/generate-config-types.ts)):

- Generates `config/$types.ts` without app bootstrap
- No database connection required
- Fast execution (<1s)

**NPM Scripts** ([`package.json`](backend-api/package.json)):

```json
{
  "scripts": {
    "generate": "concurrently ... \"npm run generate:config\"",
    "generate:config": "tsx @frouvel/kaname/scripts/generate-config-types.ts",
    "typecheck": "tsc --noEmit"
  }
}
```

**CI Workflow**:

```bash
npm run generate    # Generates aspida, frourio, prisma, AND config types
npm run typecheck   # All types available, no errors
```

### Best Practices

1. **Service Providers**:
   - Framework providers in `@frouvel/kaname/foundation/providers/`
   - Application providers in `app/providers/`
   - Register framework providers first, then app providers

2. **Database Access**:
   - Import from `@frouvel/kaname/database`, not `service/getPrismaClient`
   - Use the singleton from container: `app.make<PrismaClient>('prisma')`

3. **Console Commands**:
   - Framework commands in `@frouvel/kaname/console/commands/`
   - Application commands in `app/console/`
   - Always register through service providers

4. **Configuration**:
   - Config files in `config/*.ts`
   - Auto-generated types in `config/$types.ts` (git-ignore this)
   - Run `npm run generate:config` before type checking in CI
