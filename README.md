[![npm](https://img.shields.io/npm/v/ts-lambda-api.svg?style=flat-square)](https://www.npmjs.com/package/ts-lambda-api) [![downloads](https://img.shields.io/npm/dw/ts-lambda-api.svg?style=flat-square)](https://travis-ci.com/djfdyuruiry/ts-lambda-api)

[![build](https://img.shields.io/travis/com/djfdyuruiry/ts-lambda-api.svg?style=flat-square)](https://travis-ci.com/djfdyuruiry/ts-lambda-api) [![dependencies](https://img.shields.io/david/djfdyuruiry/ts-lambda-api.svg?style=flat-square)](https://github.com/djfdyuruiry/ts-lambda-api/network/dependencies)

# ts-lambda-api

Build REST API's using Typescript & AWS Lambda.

[GitHub Repo](https://github.com/djfdyuruiry/ts-lambda-api/)

[![NPM](https://nodei.co/npm/ts-lambda-api.png)](https://nodei.co/npm/ts-lambda-api/)

Read the full `typedoc` documentation: https://djfdyuruiry.github.io/ts-lambda-api/

Framework Features:

- Decorator based routing for API controllers and endpoint methods
- Decorator based parameter binding for endpoint methods (from body, path & query parameters and headers)
- API controller dependency injection using [InversifyJS](https://github.com/inversify/InversifyJS)
- Supports invoking your API from both `Amazon API Gateway` and `Amazon Load Balancer`
- Out of the box OpenAPI spec (v3) generation support
- Built in support for applying JSON patch operations

This project is built on top of the wonderful [lambda-api](https://github.com/jeremydaly/lambda-api) framework.

----

**Quickstart**

- [Creating a new API](#create-api)
- [Deploy to AWS Lambda](#aws-deploy)
    - [Invoke AWS Lambda](#invoke-lambda)


**Docs**

- [Routing](#routing)
    - [Controller Routes](#controller-routes)
    - [Endpoint Routes](#endpoint-routes)
    - [Path Parameters](#path-params)
    - [Manually Loading Controllers](#loading-controllers)
- [Request Parameter Binding](#request-binding)
- [Responses](#responses)
- [Authentication & Authorization](#auth-authorization)
    - [Authentication and Principals](#auth-princ)
    - [Basic Authentication](#basic-auth)
    - [Access Principal Context](#endpoint-princip)
    - [Unauthenticated Endpoints](#no-auth-endpoints)
    - [Custom Authentication](#custom-auth)
    - [Authorization](#authorization)
- [Error Handling](#errors)
    - [Error Interceptors](#error-interceptors)
    - [Manual Error Interceptors](#manual-error-interceptors)
    - [Catching Errors](#catching-errors)
    - [Framework Error Handling](#framework-errors)
- [JSON Patch Requests](#json-patch)
- [Request / Response Context](#req-res-context)
    - [Extending Controller Class](#extend-controller)
    - [Using Decorators](#use-decorators)
    - [Returning Files in a Response](#send-files)
- [Dependency Injection](#di)
- [Configuration](#config)
    - [lambda-api](#lambda-api-config)
    - [Reference](#config-reference)
- [Logging](#logging)
    - [Writing Logs](#logging-writing)
    - [API](#logging-api)
    - [lambda-api](#lambda-api-logging)
- [OpenAPI (Swagger)](#open-api)
    - [Decorators](#open-api-decorators)
    - [YAML Support](#open-api-yaml)
    - [Authentication](#open-api-auth)
- [Testing](#testing)

- [Useful Links](#useful-links)

---

## <a id="create-api"></a>Creating a new API

---

This is a short guide to creating your first API using `ts-lambda-api`. It is somewhat opinionated about project structure, but most of this can be easily customised.

**Note: Node.js v12.x & Typescript v3.x are recommended. Other versions may work perfectly fine, but have not been tested.**

- Create a directory for your project and run `npm init` to create your `package.json`

- Install required packages:

```shell
npm install ts-lambda-api
npm install -D typescript @types/node aws-sdk
```

- Open `package.json` and add a script to enable access to the Typescript compiler:

```json
{
    "scripts": {
        "tsc": "tsc"
    }
}
```

- Create a new file named `tsconfig.json`, add the following:

```json
{
    "compilerOptions": {
        "module": "commonjs",
        "moduleResolution": "node",
        "emitDecoratorMetadata": true,
        "experimentalDecorators": true,
        "strict": false,
        "baseUrl": ".",
        "outDir": "dist",
        "paths": {
            "*": [
                "node_modules/*"
            ]
        },
        "target": "es2017",
        "lib": [
            "es2017"
        ]
    },
    "include": [
        "src/**/*"
    ]
}
```

**Note: `emitDecoratorMetadata`, `experimentalDecorators` and `strict` flags are required to be set as shown above to compile your app**

- Create a new directory named `src`

- Create a new file named `src/api.ts`, add the following:

```typescript
import * as path from "path"

import { AppConfig, ApiLambdaApp } from "ts-lambda-api"

const appConfig = new AppConfig()

appConfig.base = "/api/v1"
appConfig.version = "v1"

const controllersPath = [path.join(__dirname, "controllers")]
const app = new ApiLambdaApp(controllersPath, appConfig)

export async function handler(event, context) {
    return await app.run(event, context)
}
```

- Add a `src/controllers` directory

- Create a new file in `controllers` named `HelloWorldController.ts`, add the following:

```typescript
import { injectable } from "inversify"
import { apiController, Controller, GET } from "ts-lambda-api"

@apiController("/hello-world")
@injectable() // all controller classes must be decorated with injectable
// extending Controller is optional, it provides convience methods
export class HelloWorldController extends Controller {
    // GET, POST, PUT, PATCH and DELETE are supported
    @GET()
    public get() {
        return {
            "hello": "world"
        }
    }

    // sub routes can be specifed in method decorators
    @GET("/sub-resource")
    public getSubResource() {
        return {
            "hello": "world",
            "sub": "resource"
        }
    }
}
```

- Compile the application by running:

```
npm run tsc
```

---

## <a id="aws-deploy"></a>Deploy to AWS Lambda

---

***Note**: AWS supplies the `aws-sdk` package at runtime when running your Lambda applications, so there is no need to include this in your deployment package.*

- Build your application

- Remove dev dependencies from your `node_modules` directory:

```
rm -rf node_modules
npm install --only=prod
```

*This will **massively** reduce the size of your deployment package*

- Run the following commands to package your app:

```shell
zip -r dist/lambda.zip node_modules
cd dist
zip -r lambda.zip ./
```

- Upload your lambda using the `dist/lambda.zip` file. Specify `app.handler` as the function handler. See: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-create-deployment-pkg.html

---

### <a id="invoke-lambda"></a>Invoke Lambda

---

- Create an AWS Load Balancer and point it to your new API Lambda. See: https://docs.aws.amazon.com/elasticloadbalancing/latest/application/lambda-functions.html

- You can now call your new ALB to see your API in action:

```shell
wget -qO - https://some.alb.dns.address/api/v1/hello-world/
```
- You should see:

```json
{"hello":"world"}
```

----

## <a id="routing"></a>Routing

----

Routing is configured using decorators on both controller classes and endpoint methods. You can also define a global base path (e.x. `/api/v1`) for your API by configuring the `base` property when passing your app configuration to the `ApiLambdaApp` class. (See the `Creating a new API` section)

### <a id="controller-routes"></a>Controller Routes

You can declare a root path for all methods in a controller using the `apiController` decorator.

```typescript
import { injectable } from "inversify"

import { apiController, GET, POST } from "ts-lambda-api"

@apiController("/hello-world")
@injectable()
export class HelloWorldController {
    @GET()
    public get() {
        // handle get /hello-world requests
    }

    @POST()
    public post() {
        // handle post /hello-world requests
    }
}
```

### <a id="endpoint-routes"></a>Endpoint Routes

You can declare a path for any given method in a controller when using the endpoint decorators. The `apiController` decorator is not required on the class to use this form of routing.

```typescript
import { injectable } from "inversify"

import { apiController, GET } from "ts-lambda-api"

@apiController("/store")
@injectable()
export class StoreController {
    @GET("/items")
    public getItems() {
        // handle get /store/items requests
    }
}
```

---

### <a id="path-params"></a>Path Parameters

You can include parameters as part of your routes, when you need to capture parts of the URL.

```typescript
import { injectable } from "inversify"

import { apiController, pathParam, GET } from "ts-lambda-api"

@apiController("/store")
@injectable()
export class StoreController {
    @GET("/item/:id")
    public getItems(@pathParam("id") id: string) {
        // do something with id
    }
}
```

---

You can also combine controller and endpoint path parameters.

---

```typescript
import { injectable } from "inversify"

import { apiController, pathParam, GET } from "ts-lambda-api"

@apiController("/store/:storeId")
@injectable()
export class StoreController {
    @GET("/item/:id")
    public getItem(@pathParam("storeId") storeId: string, @pathParam("id") id: string) {
        // do something with storeId and id
    }
}
```

**Note all path parameters are passed in as strings, you will need to cast these if required**

---

### <a id="loading-controllers"></a>Manually Loading Controllers

---

The default IOC app `Container` enables the `autoBindInjectable` option. Controllers decorated with
`@injectable` are dynamicallly loaded from the required `controllersPath` directory during 
initialisation. However, controllers can be explicity specified instead of relying on the `@injectable` 
decoration to dynamically load the controllers from a directory.

Create an IOC `Container` with the `autoBindInjectable` option disabled. Bind the desired controller 
classes to the container and pass the instance into the `ApiLambdaApp` constructor. The `controllersPath`
parameter is ignored when the custom container's `autoBindInjectable` option disabled.

```typescript
import { Container } from 'inversify';
import { ApiLambdaApp, ApiRequest, AppConfig } from 'ts-lambda-api';
import { AppController } from './controllers/AppController';

const appConfig = new AppConfig();
appConfig.base = '/api/v1';
appConfig.version = 'v1';

// Bind the controllers to a container instance with @injectable disabled
const appContainer = new Container({ autoBindInjectable: false });
const appController = new AppController();
appContainer.bind(AppController).toConstantValue(appController);

// Pass the customer container into the app - controllersPath is ignored
const app = new ApiLambdaApp(undefined, appConfig, appContainer);

export const lambdaHandler = async (event: ApiRequest, context: any) => {
	return await app.run(event, context);
};
```

**Note you do not need to decorate controller classes with @injectable when autoBindInjectable is disabled**

----

## <a id="request-binding"></a>Request Parameter Binding

----

Different parts of the HTTP request can be bound to endpoint method parameters using decorators.

- `queryParam` - Query string parameter
- `header` - HTTP header value
- `body` - Entity from request body, this will be an object if the request contains JSON, otherwise it will simply be a string
- `bodyTyped` - Entity from request body, that will be coerced to the specified class, which must have a default no-args constructor. If the `validate` option is set, the class will also be validated using [class-validator](https://github.com/typestack/class-validator). You may also pass other options as described in the [class-validator documentation](https://github.com/typestack/class-validator#passing-options).
- `rawBody` - Entity from request body as a Buffer, containing a string or binary data

```typescript
import { injectable } from "inversify"

import { apiController, body, bodyTyped, header, queryParam, rawBody, GET, POST } from "ts-lambda-api"

import { Thing } from "./Thing"

@apiController("/hello-world")
@injectable()
export class HelloWorldController {
    @GET()
    public getThingById(@queryParam("id") id: string) {
        // do something with id
    }

    @GET("/some/other/route")
    public getContentType(@header("content-type") contentType: string) {
        // do something with contentType
    }

    @POST("/thing")
    public addThing(@body thing: Thing) {
        // do something with thing
    }

    @POST("/validated-thing")
    public addThing(@bodyTyped(Thing, { validate: true }) thing: Thing) {
      // thing is a validated instance of Thing
    }

    @POST("/upload-file")
    public addThing(@rawBody file: Buffer) {
        // do something with file
    }

}
```

----

## <a id="responses"></a>Responses

----

There are two ways to respond to requests:

- Return a value from your endpoint method
- Use the response context to send a response (see `Request / Response Context` section below - the context has convience methods for html, json, files etc.)

By default all return values are serialised to JSON in the response body and the `content-type` response header is set to `application/json`. To change this you can use the `produces` and `controllerProduces` decorators.

Only JSON content types are serialised automatically, all other types simply convert the return value to a string.

To set the response content type for all methods, use `controllerProduces` on a class.

```typescript
import { injectable } from "inversify"

import { apiController, controllerProduces, pathParam, produces, GET } from "ts-lambda-api"

import { Item } from "./Item"

@apiController("/store/:storeId")
@controllerProduces("application/xml")
@injectable()
export class StoreController {
    @GET("/item/:id")
    public getItem(@pathParam("storeId") storeId: string, @pathParam("id") id: string) {
        let item = this.lookupItem(storeId, id)

        return this.serialiseToXml(item)
    }

    private lookupItem(storeId: string, id: string) {
        // go get the item from somewhere, db for example
    }

    private serialiseToXml(item: Item) {
        // use 3rd party library to serialise item
    }
}
```

For an individual method, use `produces`. This will override `controllerProduces` for that method, if present on the controller class.

```typescript
import { injectable } from "inversify"

import { apiController, produces, GET } from "ts-lambda-api"

@apiController("/motd")
@injectable()
export class MessageOfTheDayController {
    @GET()
    @produces("text/plain")
    public get(){
        return "Message of the Day!"
    }
}
```

----

## <a id="auth-authorization"></a>Authentication & Authorization

----

This framework supports authenticating requests and authorization for controllers and endpoints. It can be used to configure HTTP authentication, token based auth and role based access control (ACLs).

Implementation is heavily inspired by the Dropwizard framework for Java.

### <a id="auth-princ"></a>Authentication and Principals

Authentication is preformed by filter classes that are executed before invoking an endpoint; all filter classes implement the `IAuthFilter` interface.

Filters use information from the HTTP request to authenticate the request. If authentication is successful, a filter will return a principal. A principal is a simple class that contains information about the current user/entity that has been granted access to the endpoint.

To use authentication you must implement your own principal by extending the `Principal` class:

```typescript
import { Principal } from "ts-lambda-api"

export class StoreUser extends Principal {
    // we will use this later, see the Authorization section
    private roles: string[] = []

    // you can define your user model properties in this class

    public constructor(name: string) {
        super(name)
    }
}
```

### <a id="basic-auth"></a>Basic Authentication

HTTP Basic authentication is supported out of the box by the `BasicAuthFilter` filter abstract class. You extend this class to implement your authentication logic:

```typescript
import { BasicAuthFilter } from "ts-lambda-api"

import { StoreUser } from "./StoreUser"

export class StoreAuthFilter extends BasicAuthFilter<StoreUser> {
    public readonly name: string = StoreAuthFilter.name

    public async authenticate(basicAuth: BasicAuth): Promise<StoreUser | undefined> {
        let user = this.getUserFromDb(basicAuth.username)

        if (user && this.checkUserPasswordHash(user, basicAuth.password)) {
            // returning a principal signals that the request has been authorized
            return user
        }
    }

    private getUserFromDb(username: string): StoreUser {
        // get the user details from a database, if it exists, otherwise we return null/undefined
    }

    private checkUserPasswordHash(user: StoreUser, password: string): boolean {
        // get the user password hash from a database
    }
}
```

You register your authentication filter when setting up your application instance:

```typescript
// build config and controllers path...
const app = new ApiLambdaApp(controllersPath, appConfig)
const authFilter = new StoreAuthFilter()

// this will protect your endpoints using the auth filter to authenticate requests
app.middlewareRegistry.addAuthFilter(authFilter)
// export handler
```

### <a id="endpoint-princip"></a>Access Principal Context

Once a user has been authenticated you can pass the principal instance into the target endpoint. You can do this by adding a `principal` parameter decorator to your endpoint method.

```typescript
import { injectable } from "inversify"

import { apiController, pathParam, principal, GET } from "ts-lambda-api"

@apiController("/store")
@injectable()
export class StoreController {
    @GET("/item/:id")
    public getItem(@principal user: StoreUser, @pathParam("id") id: string) {
        // do something with the user context
    }
}
```

### <a id="no-auth-endpoints"></a>Unauthenticated Endpoints

There are several situations where you might want to disable authentication for a specific endpoint:

- Healthcheck / Status endpoint
- Login Endpoint
- Public API endpoints for unauthenticated users (browsing products without logging in)

To do this you need to use the `noAuth` and `controllerNoAuth` decorators.

For an endpoint:

```typescript
import { injectable } from "inversify"

import { apiController, body, noAuth, principal, GET, POST } from "ts-lambda-api"

import { LoginRequest } from "./LoginRequest"
import { StoreUser } from "./StoreUser"

@apiController("/user")
@injectable()
export class UserController {
    @POST("/login")
    @noAuth
    public login(@body loginRequest: LoginRequest) {
        // attempt to log in...
    }

    @GET("/profile")
    public login(@principal user: StoreUser) {
        // only authorised users can call this endpoint...
    }
}
```

For all endpoints in a controller:

```typescript
import { injectable } from "inversify"

import { apiController, controllerNoAuth, body, POST } from "ts-lambda-api"

import { SearchRequest } from "./SearchRequest"

@apiController("/public")
@controllerNoAuth
@injectable()
export class PublicController {
    @POST("/search/products")
    public searchProducts(@body searchRequest: SearchRequest) {
        // I can be called without authentication
    }

    // ...other declared endpoints are also be called without authentication...
}
```

### <a id="custom-auth"></a>Custom Authentication

If you wish to implement popular authentication mechanisms or make your own, you need to implement the `IAuthFilter` interface. It accepts two type parameters:

- `T` - The model class for your authentication data
- `U` - A principal class

Authentication data classes are free form, for example:

```typescript
export class TokenAuth {
    public token: string
}
```

Your auth filter implementation must provide a method for extracting your authentication data, and a method that uses that data to authenticate the current request.

```typescript
import { Request } from "lambda-api"

import { IAuthFilter, Principal } from "ts-lambda-api"

import { StoreUser } from "./StoreUser"
import { TokenAuth } from "./TokenAuth"

export class TokenAuthFilter<T extends Principal> implements IAuthFilter<TokenAuth, StoreUser> {
    // required to be defined for implementations, see:
    //   https://www.iana.org/assignments/http-authschemes/http-authschemes.xhtml
    public readonly authenticationSchemeName: string = "Bearer"
    public readonly name: string = TokenAuthFilter.name

    public async extractAuthData(request: Request): Promise<TokenAuth | undefined> {
        // extract the data if the auth header is present
        if (request.headers["Authorization"]) {
            return {
                token: request.headers["Authorization"]
            }
        }

        // if you don't return any auth data, the request will be marked as unauthorized
    }

    public async authenticate(tokenAuth: TokenAuth): Promise<StoreUser | undefined> {
        let user = this.getUserByTokenFromDb(tokenAuth.token)

        if (user) {
            return user
        }
    }

    private getUserByTokenFromDb(token: string) {
        // get the user for the token and return the user's details
    }
}
```

Tip: You can make your class abstract and then make the `authenticate` method abstract to enable your custom auth filter to be re-usable. This way, you simply extend your custom fiter and implement the authentication logic for your application.

### <a id="authorization"></a>Authorization

To implement role based authorization you implement the `IAuthorizer` interface.

```typescript
import { IAuthorizer } from "ts-lambda-api"

import { StoreUser } from "./StoreUser"

export class StoreAuthorizer implements IAuthorizer<StoreUser> {
    public readonly name: string = StoreAuthorizer.name

    public async authorize(user: StoreUser, role: string): Promise<boolean> {
        return user.roles.includes(role)
    }
}
```

When a user is successfully authenticated by an auth filter, this returns a principal which is passed to the configured authorizer if a resource is marked as restricted. To restrict all endpoints in a controller, use the `controllerRolesAllowed` decorator:

```typescript
import { injectable } from "inversify"

import { apiController, controllerRolesAllowed, GET } from "ts-lambda-api"

@apiController("/store")
@controllerRolesAllowed("STORE_GUEST", "STORE_MANAGER")
@injectable()
export class StoreController {
    @GET("/item/:id")
    public getItem(@pathParam("id") id: string) {
        // this endpoint can only be accessed with principles that are authorized with the STORE_MANAGER role
    }
}
```

You can restrict a single enpoint using the `rolesAllowed` decorator:

```typescript
import { injectable } from "inversify"

import { apiController, rolesAllowed, GET } from "ts-lambda-api"

@apiController("/store")
@injectable()
export class StoreController {
    @GET("/item/:id")
    @rolesAllowed("STORE_MANAGER")
    public getItem(@pathParam("id") id: string) {
        // this endpoint can only be accessed with principles that are authorized with the STORE_MANAGER role
    }
}
```

You can combine both the controller and endpoint decorators for roles. In this case, if endpoint roles are present, they override the controller role set.

You register your authentication filter when setting up your application instance:

```typescript
// build config and controllers path...
const app = new ApiLambdaApp(controllersPath, appConfig)
const authorizer = new StoreAuthorizer()

// this will protect your endpoints using the authorizer to check access roles
app.middlewareRegistry.addAuthorizer(authorizer)
// export handler
```
----

## <a id="errors"></a>Error Handling

----

When an unexpected error is thrown in one of your endpoints, you can choose how to handle this. There are three general techniques:

1. Use an error interceptor
1. Catch the error in your endpoint logic
1. Let the framework handle the error

### <a id="error-interceptors"></a>Error Interceptors

Error interceptors are classes that can be configured to be invoked when an error occurs when calling a given controller or endpoint. Interceptors extend the `ErrorInterceptor` class and provide an implementation for an `intercept` method.

Interceptor instances are built using the InversifyJS app container, so you can add any dependencies as constructor parameters if you configure the container correctly.

```typescript
import { injectable } from "inversify";

import { ApiError, ErrorInterceptor } from "ts-lambda-api"

@injectable()
export class StoreErrorInterceptor extends ErrorInterceptor {
    public async intercept(apiError: ApiError) {
        // endpointTarget and controllerTarget will set before this is called
        // (they are set to the controller and endpoint that threw the error)
        apiError.response.status(500)

        return {
            statusCode: 500,
            errorMessage: "Error getting items for store"
        }
    }
}
```

In your controller you can then use the `controllerErrorInterceptor` decorator to specify the error interceptor to use:


```typescript
import { injectable } from "inversify"

import { apiController, controllerErrorInterceptor, GET } from "ts-lambda-api"

import { StoreErrorInterceptor } from "./StoreErrorInterceptor"

@apiController("/store")
@controllerErrorInterceptor(StoreErrorInterceptor)
@injectable()
export class StoreController {
    @GET("/items")
    public getItems() {
        return this.getItemsFromDb()
    }

    private getItemsFromDb() {
        // get all the items from the DB, may error
    }
}
```

You can also use the `errorInterceptor` decorator on individual endpoints for more fine grained error control. Endpoint interceptors will override controller interceptors.

### <a id="manual-error-interceptors"></a>Manual Error Interceptors

You can manually register interceptors when setting up your application instance:

```typescript
// build config and controllers path...
const app = new ApiLambdaApp(controllersPath, appConfig)
const errorInterceptor = new StoreErrorInterceptor()

// this will intercept errors thrown by any endpoint
app.middlewareRegistry.addErrorInterceptor(errorInterceptor)
// export handler
```

You can intercept only the errors thrown by an endpoint by setting `endpointTarget`:

```typescript
// pattern for endpoints is {controller class name}::{endpoint method name}
errorInterceptor.endpointTarget = "StoreController::getItems"
```

You can intercept only the errors thrown by a controller by setting `controllerTarget`:

```typescript
// controllers are identified by class name
errorInterceptor.controllerTarget = "StoreController"
```

**Note: using this type of interceptor is overridden if the target controller or endpoint has an interceptor configured**

### <a id="catching-errors"></a>Catching Errors

You can use a try/catch block and the `Response` class to handle errors:

```typescript
import { injectable } from "inversify"

import { apiController, Controller, GET } from "ts-lambda-api"

@apiController("/store")
@injectable()
export class StoreController extends Controller {
    @GET("/items")
    public getItems() {
        try {
            return this.getItemsFromDb()
        } catch (ex) {
            // log ex...maybe?

            this.response.status(500).send({
                statusCode: 500,
                errorMessage: "Error occurred getting items from backend"
            })
        }
    }

    private getItemsFromDb() {
        // get all the items from the DB
    }
}
```

*Note: this can also be done by injecting the `Response` class instance using the `response` parameter decorator, instead of extending `Controller`.*

### <a id="framework-errors"></a>Framework Error Handling

If you simply preform your logic in your endpoint method without catching any errors yourself, the framework will catch the error and return a HTTP 500 response with error details. Below is a JSON snippet showing an example.

```json
{
    "error": "...some error that the framework caught when calling an endpoint...."
}
```

----

## <a id="json-patch"></a>JSON Patch Requests

----

This library supports [JSON Patch](http://jsonpatch.com/) format for updating entities without having to upload the entire entity. To use it in your endpoints, ensure your controller extends the `Controller` class, an example is below:

```typescript
import { injectable } from "inversify"

import { apiController, pathParam, produces, JsonPatch, PATCH } from "ts-lambda-api"

import { Item } from "./Item"

@apiController("/store")
@injectable()
export class StoreController extends Controller {
    @PATCH("/item/:id")
    public modifyItem(@pathParam("id") id: string, @body jsonPatch: JsonPatch) {
        let item = this.lookupItem(id)

        // apply the patch operation
        let modifiedItem = this.applyJsonPatch<Item>(jsonPatch, item)

        // do something with modifiedItem
    }

    private lookupItem(id: string) {
        // go get the item from somewhere, db for example
    }
}
```

**Under the hood, the API uses the [fast-json-patch](https://www.npmjs.com/package/fast-json-patch) package**

----

## <a id="req-res-context"></a>Request / Response Context

----

If you want to read request bodies or write to the response, there are several supported approaches.

### <a id="extend-controller"></a>Extending Controller Class

If you extend the controller class, you get access to the request and response context.

```typescript
import { injectable } from "inversify"

import { apiController, Controller, GET } from "ts-lambda-api"

@apiController("/hello-world")
@injectable()
export class HelloWorldController extends Controller {
    @GET()
    public get() {
        let queryStringParam = this.request.query["someField"]

        // ... do some logic ...

        this.response.html("<h1>Hello World</h1>");
    }
}
```

### <a id="use-decorators"></a>Using Decorators

You can use parameter decorators to inject the request and response context.

```typescript
import { injectable } from "inversify"
import { Request, Response } from "lambda-api"

import { apiController, request, response, GET } from "ts-lambda-api"

@apiController("/hello-world")
@injectable()
export class HelloWorldController {
    @GET()
    public get(@request request: Request, @response response: Response) {
        let queryStringParam = request.query["someField"]

        // ... do some logic ...

        response.html("<h1>Hello World</h1>");
    }
}
```

### <a id="send-files"></a>Returning Files in a Response

You can return files by using the `sendFile` method in the response context.

```typescript
import { injectable } from "inversify"

import { apiController, Controller, GET } from "ts-lambda-api"

@apiController("/files")
@injectable()
export class FilesController extends Controller {
    @GET()
    public get() {
        let file: Buffer = this.getFile()

        this.response.sendFile(file)
    }

    private getFile(): Buffer {
        // ... do some logic to get a file Buffer ...
    }
}
```

**The `Request` and `Response` classes are documented in the [lambda-api](https://github.com/jeremydaly/lambda-api) package.**

----

## <a id="di"></a> Dependency Injection

----

Configuring the IOC container to enable dependency injection for your controllers is easy. Once you build an `ApiLambdaApp` instance you can call the `configureApp` method like below:

```typescript
// build config and controllers path...
const app = new ApiLambdaApp(controllersPath, appConfig)

app.configureApp(container => {
    // bind interface to implementation class, for example
    container.bind(IMyService)
        .to(MyServiceImplementation)
})

// export handler
```

**Note: Any classes that you are going to inject need to be decorated with `injectable`, any subclasses are also required to be decorated**

In your controllers you can then use the registered types as constructor parameters:

```typescript
import { inject, injectable } from "inversify"

import { apiController, GET } from "ts-lambda-api"

import { IMyService } from "./IMyService"

@apiController("/hello-world")
@injectable()
export class MyController {
    public constructor(@inject(IMyService) private readonly service: IMyService) {
    }

    @GET()
    public get() {
        // use injected service to do cool stuff
    }
}
```

See the [InversifyJS](https://github.com/inversify/InversifyJS) package documentation for full guidance how to use the `Container` class to manage dependencies.

----

## <a id="config"></a>Configuration

----

When building an application instance you pass an `AppConfig` instance to the constructor. If you want to provide your own application config it is recommended to extend this class .

```typescript
import { injectable } from "inversify"

import { AppConfig } from "ts-lambda-api"

import { DatabaseConfig } from "./DatabaseConfig"

@injectable()
export class MyCustomConfig extends AppConfig {
    public databaseConfig: DatabaseConfig
}
```

You can then configure the IOC container to bind to your configuration instance.

```typescript
// build controllers path...
const appConfig: MyCustomConfig = buildConfig()
const app = new ApiLambdaApp(controllersPath, appConfig)

app.configureApp(container => {
    container.bind(MyCustomConfig)
        .toConstantValue(appConfig)
}

// export handler
```

After which, you can inject your config into your controllers or services.

```typescript
import { inject, injectable } from "inversify"

import { apiController, GET } from "ts-lambda-api"

import { MyCustomConfig } from "./MyCustomConfig"

@apiController("/hello-world")
@injectable()
export class MyController {
    public constructor(@inject(MyCustomConfig) private readonly config: MyCustomConfig) {
    }

    @GET()
    public get() {
        return this.getStuffFromDb()
    }

    private getStuffFromDb() {
        // use this.config to configure a database connection
    }
}
```

**Note: The `AppConfig` class supports all the configuration fields documented in the [lambda-api](https://github.com/jeremydaly/lambda-api) package.**

### <a id="config-reference"></a>Reference

For a complete reference see the [AppConfig](https://djfdyuruiry.github.io/ts-lambda-api/classes/appconfig.html) docs.

### <a id="lambda-api-config"></a>lambda-api

Configuring `lambda-api` directly can be done by calling the `configureApi` method like below:

```typescript
import { API } from "lambda-api"
import * as xmljs from "xml-js"

// build config and controllers path...
const app = new ApiLambdaApp(controllersPath, appConfig)

app.configureApi(api: API => {
    // add middleware handler, for example
    api.use((req,res,next) => {
        // parses any incoming XML data into an object
        if (req.headers["content-type"] === "application/xml") {
            req.body = xmljs.xml2json(req.body, {compact: true})
        }

        next()
    })
})
// export handler
```

**Note: any middleware handlers and manual routes will not apply auth filters, authorizers or error interceptors**

See the [lambda-api](https://github.com/jeremydaly/lambda-api) package documentation for guidance how to use the `API` class.

## <a id="logging"></a>Logging

A logger interface is provided that can write messages to standard out. You can configure this logger using the `serverLogging` key in the `AppConfig` class. See the [Config Reference](#config-reference) for details on options available. This complements the existing logging provided by `lambda-api`, which can be configured using the `logger` key.

By default, the logger is set to `info` and outputs messages as simple strings.

The format of the messages written out is:

```
level  class                   message
vvvvv vvvvvvvv   vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
INFO  Endpoint - Invoking endpoint: [GET] /open-api.yml
```

Below is some example output, include a stack trace from an `Error` instance:

```
INFO ApiLambdaApp - Received event, initialising controllers and processing event
INFO Server - Processing API request event for path: /test/
INFO Endpoint - [GET] /test - Authenticating request
ERROR Endpoint - [GET] /test - Error processing endpoint request
Error: authenticate failed
    at TestAuthFilter.authenticate (/home/matthew/src/ts/ts-lambda-api/tests/src/test-components/TestAuthFilter.ts:25:19)
    at Endpoint.authenticateRequest (/home/matthew/src/ts/ts-lambda-api/dist/api/Endpoint.js:15:2640)
    at processTicksAndRejections (internal/process/task_queues.js:86:5)
    at process.runNextTicks [as _tickCallback] (internal/process/task_queues.js:56:3)
    at Function.Module.runMain (internal/modules/cjs/loader.js:880:11)
    at runMain (/home/matthew/.node-spawn-wrap-13541-13c0098ec456/node:68:10)
    at Function.<anonymous> (/home/matthew/.node-spawn-wrap-13541-13c0098ec456/node:171:5)
    at Object.<anonymous> (/home/matthew/src/ts/ts-lambda-api/node_modules/nyc/bin/wrap.js:23:4)
    at Module._compile (internal/modules/cjs/loader.js:816:30)
    at Object.Module._extensions..js (internal/modules/cjs/loader.js:827:10)
```

If you set the `format` to `json` the log messages will look like this:

```json
 {
    "level": "INFO",
    "msg": "Endpoint - Invoking endpoint: [GET] /open-api.yml",
    "time": 1555865906882 // milliseconds since epoch
}
```

This format matches the keys used by the `lambda-api` framework in it's output.

### <a id="logging-writing"></a>Writing Logs

To write logs you will ned a logger instance. There are three ways to get one:

- Extend the `Controller` class in your controller:

```typescript
import { injectable } from "inversify"

import { apiController, Controller, GET } from "ts-lambda-api"

@apiController("/")
@injectable()
export class TestController extends Controller {
    @GET()
    public get() {
        this.logger.info("In GET method!")

        return "OK"
    }
}
```

- Use a `LogFactory` instance to build it:

```typescript
import { inject, injectable } from "inversify"
import { AppConfig, LogFactory } from "ts-lambda-api"

@injectable()
export class SomeServiceYouMightMake {
    // get your app config using dependency injection
    public constructor(@inject(AppConfig) private readonly appConfig: AppConfig)

    public doStuff() {
        let factory = new LogFactory(appConfig)
        let logger = factory.getLogger(SomeServiceYouMightMake)

        logger.debug("Inside doStuff!")
    }
}
```

- Use the `LogFactory` static methods to build it:

```typescript
import { LogFactory, LogLevel } from "ts-lambda-api"

export class SomeServiceYouMightMake {
    public doStuff() {
        // you can specify the level and format of the log
        let logger = LogFactory.getCustomLogger(SomeServiceYouMightMake, LogLevel.debug, "json")

        logger.debug("Inside doStuff!")
    }
}
```

### <a id="logging-api"></a> Server Logger API

The logging API supports formatting of messages using the [`sprintf-js`](https://www.npmjs.com/package/sprintf-js) npm module, simply pass in your arguments and put placeholders in your message string:

```typescript
logger.warn("Hello there %s, how are you?", "Roy")
logger.debug("Task status: %s. Task data: %j", "success", {event: "run batch"})
```

Using this will help to speed up your app if you do a lot of logging, because uneccessary work to convert values to strings and the JSON serialization of debug messages will not take place if a higher error level is set.

----

Below is an example of the methods available on logger instances:

```typescript
import { LogFactory, LogLevel } from "ts-lambda-api"

export class SomeServiceYouMightMake {
    public doStuff() {
        let logger = LogFactory.getCustomLogger(SomeServiceYouMightMake)

        // different levels
        logger.trace("trace")
        logger.fatal("fatal")
        logger.error("error")

        // log exceptions with stack traces, also supports formatting of message
        let exception = new Error("Bad stuff happened")

        logger.errorWithStack("An error occurred somewhere, error code: %d", exception, 20000)

        // check if a level is enabled
        if (logger.debugEnabled()) {
            logger.debug("Mode #%d", 355)
        }

        if (logger.traceEnabled()) {
            logger.trace("Sending data: %j", {some: {payload: 2345}})
        }

        // check if the logging is currenly off (i.e. level is set to `off`)
        if (logger.isOff()) {
            // react to the cruel reality....
        }

        // pass level in as parameter
        logger.log(LogLevel.info, "Manual call to the %s method", "log")

        // check level is enabled using aparameter
        if (logger.levelEnabled(LogLevel.info)) {
            logger.info("I am enabled!")
        }
    }
}
```

### <a id="lambda-api-logging"></a>lambda-api

Logging is also provided by the [lambda-api](https://github.com/jeremydaly/lambda-api) package, use the `AppConfig` instance passed to `ApiLambdaApp` to configure logging using the `logger` key. See the [Config Reference](#config-reference) for details on options available.

----

## <a id="open-api"></a>OpenAPI (Swagger)

----

The OpenAPI Specification (FKA Swagger) is supported out of the box. If you are not familar with it, check out https://github.com/OAI/OpenAPI-Specification

**This framework supports only OpenAPI v3**

The following features are supported:

- Generating of an OpenAPI Specification, which includes:
    - All endpoints with full path and HTTP method
    - Custom names and descriptions for endpoints
    - Grouping of endpoints together by API
    - Endpoint query, path and header parameters (set by parameter decorators)
    - Response content type headers (set by `produces` or `controllerProduces` decorators)
    - Request and Response bodies: class types, primitive values and files
    - Response HTTP status codes
    - HTTP Basic security scheme (when a basic auth filter is configured)
    - Custom auth filter security schemes
- Specification files can be generated in `JSON` or `YAML` format (see [YAML Support](#open-api-yaml))

To enable it, use the `openApi` property in the `AppConfig` class when building your app:

```typescript
// build controllers path...
const appConfig = new AppConfig()

appConfig.base = "/api/v1"
appConfig.version = "v1"
appConfig.openApi.enabled = true

const app = new ApiLambdaApp(controllersPath, appConfig)
// export handler
```

You can then request your specification using the paths:

- `/api/v1/open-api.json` - JSON format
- `/api/v1/open-api.yml` - YAML format

### <a id="open-api-decorators"></a>Decorators

To further document your API endpoints you can use OpenAPI decorators.

- Customize the names of APIs and endpoints using `api`:

    ```typescript
    import { injectable } from "inversify"
    import { api, apiController } from "ts-lambda-api"

    @apiController("/some")
    @api("Awesome API", "descripton of API for doing amazing things") // the second parameter is optional
    @injectable()
    export class SomeController {
        // ... endpoints ...
    }
    ```

*The same `@api` name can be used on multiple controllers, meaning you can group by API area rather than controller*

- Add descriptions to APIs and endpoints using `apiOperation`:

    ```typescript
    @GET()
    @apiOperation({ name: "get stuff", description: "go get some stuff"}) // description is optional
    public get() {
        return "OK"
    }
    ```

- Describe endpoint request and response content using `apiRequest` and `apiResponse`:

    ```typescript
    // using model classes
    @POST()
    @apiOperation({name: "add stuff", description: "go add some stuff"})
    @apiRequest({class: Person})
    @apiResponse(201, {class: Person}) // each response is associated with a HTTP status code
    @apiResponse(400, {class: ApiError})
    @apiResponse(500, {class: ApiError})
    public post(@body person: Person) {
        return person
    }

    // using primitive types ("boolean", "double", "int", "number", "object" or "string")
    @POST("/plain")
    @apiOperation({ name: "add some plain stuff", description: "plain stuff"})
    @apiRequest({type: "int"})
    @apiResponse(200, {type: "int"})
    public postNumber(@body stuff: number) {
        return stuff
    }

    // using array types ("array", "array-array", "boolean-array", "double-array", "int-array", "number-array", "object-array" or "string-array")
    @POST("/array")
    @apiOperation({ name: "add array", description: "array time"})
    @apiRequest({type: "string-array"})
    @apiResponse(200, {type: "string-array"})
    public postArray(@body stuff: string[]) {
        return stuff
    }

    // upload/download files
    @POST("/files")
    @apiOperation({ name: "add file", description: "give me a file"})
    @apiRequest({contentType: "application/octet-stream", type: "file"}) // contentType can be used in any request or response definition, inherits controller or endpoint type by default
    @apiResponse(201, {contentType: "application/octet-stream", type: "file"})
    public postFile(@rawBody file: Buffer) {
        this.response.sendFile(file)
    }

    // providing custom request/response body example
    @POST("/custom-info")
    @apiOperation({
        name: "add custom stuff",
        description: "go add some custom stuff"
    })
    @apiRequest({
        class: Person,
        example: `{"name": "some name", "age": 22}`,
        description: "Details for a person"
    })
    @apiResponse(201, {
        class: Person,
        example: `{"name": "another name", "age": 30}`,
        description: "Uploaded person information"
    })
    public postCustomInfo(@body person: Person) {
        return person
    }

    // no response content, only a status code
    @DELETE()
    @apiOperation({name: "delete stuff", description: "go delete some stuff"})
    @apiResponse(204)
    public delete() {
        this.response.status(204).send("")
    }
    ```

- Hide controllers or individual endpoints from the documentation with `apiIgnoreController` and `apiIgnore`:

    ```typescript
    import { injectable } from "inversify"
    import { api, apiController } from "ts-lambda-api"

    @apiController("/private")
    @api("Private API", "You can still annotate these")
    @apiIgnoreController()
    @injectable()
    export class PrivateController {
    
      @GET()
      @apiOperation({ name: "get stuff", description: "go get some stuff"})
      @apiIgnore() // if you didn't want to ignore the whole controller
      public get() {
          return "OK"
      }
    }
    ```

    The class `Person` is set as the request and response in several of the examples above. To help the framework provide meaningful request and response examples automatically, you must either:

    1. Provide a public static `example` method in your class, which will be called if found when generating an API spec. (recommended)

    ```typescript
    export class Person {
        public name: string
        public age: number
        public roles?: string[]

        public static example() {
            let person = new Person()

            person.name = "name"
            person.age = 18
            person.roles = ["role1", "role2", "roleN"]

            return person
        }
    }
    ```

    -OR-

    2. Populate your instance in it's constructor with some non null/undefined values.

    ```typescript
    export class Person {
        public name: string
        public age: number
        public roles?: string[]

        public constructor() {
            this.name = ""
            this.age = 0
            this.roles = []
        }
    }
    ```

    *This is required because object properties are not defined until a value is assigned, which makes any sort of reflection impossible.*

- Describe the path, query and header parameters consumed by your endpoints:

    ```typescript
    // the below uses the same options used to describe api requests and responses
    @GET()
    public get(
        @queryParam("param", { description: "whatever you like", type: "int" }) param: string
    ) {
        // remember, defining a type does not affect the parameter type, will always be a string
        return param
    }

    // You can mark query and header params as required or not,
    // path parameters are always set to required.
    @GET()
    public getAnotherThing(
        @header("x-param", { required: true }) param: string
    ) {
        // remember, defining required will not perform any validation, null/undefined will
        // still be passed if the parameter is missing from the request
        return param
    }

    // When expecting an object/array, you can pass in the
    // expected formatting style.
    //
    // For help with the `style` field, see: https://swagger.io/docs/specification/serialization/
    @GET()
    public getAnotherThing(
        @queryParam("param", { type: "int-array", style: "pipeDelimited", explode: false }) param: string
    ) {
        // we would expect param to be passed in the query string as 'param=1|2|3|4'
        return param
    }

    // you can specify a content type if the string is expected to be JSON etc.
    @GET()
    public getHeaderTest(
        @header("x-custom-header", { class: Person, contentType: "application/json" }) customHeader: string
    ) {
        let person: Person = JSON.parse(customHeader)

        return person
    }
    ```

    *Path parameters support the following styles: simple, label, matrix*

    *Header parameters only support the 'simple' style*

    *Note: Setting a content type for your parameter is supported, but due to an outstanding issue, these parameters will not display in Swagger UI / Editor, see: https://github.com/swagger-api/swagger-ui/issues/4442*

- Add security schemes to your specification (other than Basic auth, this is automatically detected) using an `apiSecurity` decorator on your authentication filter:

    ```typescript
    import { apiSecurity, IAuthFilter } from "ts-lambda-api"

    import { User } from "./User"

    @apiSecurity("bearerAuth", {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
    })
    export class CustomAuthFilter implements IAuthFilter<string, User> {
        // ... implementation ...
    }
    ```

    This decorator uses the `SecuritySchemeObject` class from the `openapi3-ts` library to describe the security scheme in place. See the source for more information on using this class: [SecuritySchemeObject source](https://github.com/metadevpro/openapi3-ts/blob/ab997f12a63fa215e3b0c08cc293429b97ce0a44/src/model/OpenApi.ts#L314)

### <a id="open-api-yaml"></a>YAML Support

For `YAML` specification support, you need to install the following packages in your project:

```bash
npm install js-yaml
npm install -D @types/js-yaml
```

### <a id="open-api-auth"></a>Authentication

By default the OpenAPI endpoints do not require authentication. If you wish to apply auth filters when a request is made for a spec, set the `useAuthentication` key in the `openApi` config:

```typescript
// build controllers path...
const appConfig = new AppConfig()

appConfig.base = "/api/v1"
appConfig.version = "v1"
appConfig.openApi.enabled = true
appConfig.openApi.useAuthentication = true

const app = new ApiLambdaApp(controllersPath, appConfig)
// export handler
```

---

## <a id="testing"></a>Testing

---

For local dev testing and integration with acceptance tests see the [ts-lambda-api-local](https://www.npmjs.com/package/ts-lambda-api-local) package which enables hosting your API using express as a local HTTP server.

Check out this project's dev dependencies to see what is required to test API code. The `tests` directory of this repo contains extensive acceptance tests which will show you how to build mock requests and invoke your API endpoints programmatically.
