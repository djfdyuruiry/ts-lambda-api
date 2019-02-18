# typescript-lambda-api

Build REST API's using Typescript & AWS Lambda. 

Framework Features:

- Decorator based routing for API controllers and endpoint methods
- Decorator based parameter binding for endpoint methods (from body, path & query parameters and headers)
- Built in support for applying JSON patch operations
- API controller dependency injection using [InversifyJS](https://github.com/inversify/InversifyJS)
- Supports invoking your API from both `Amazon API Gateway` and `Amazon Load Balancer`

This project is built on top of the wonderful [lambda-api](https://github.com/jeremydaly/lambda-api) framework.

---

## Creating a new API

---

This is a short guide to creating your first API using `typescript-lambda-api`. It is somewhat opinionated about project structure, but most of this can be easily customised. 

**Note: Node.js v8 & Typescript v3 or newer are required to use this package.**

- Create a directory for your project and run `npm init` to create your `package.json`

- Install required packages:

**Ensure the `@types/node` package you install matches your version of Node.js**

```shell
npm install typescript-lambda-api
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

import { AppConfig, ApiLambdaApp } from "typescript-lambda-api"

let appConfig = new AppConfig()

appConfig.base = "api/v1"
appConfig.version = "v1"

let controllersPath = path.join(__dirname, "controllers")
let app = new ApiLambdaApp(controllersPath, appConfig)

exports.handler = app.run
```

- Add a `src/controllers` directory

- Create a new file in `controllers` named `HelloWorldController.ts`, add the following:

```typescript
import { injectable } from "inversify"
import { apiController, Controller, GET } from "typescript-lambda-api"

@injectable() // all controller classes must be decorated with injectable
@apiController("/hello-world")
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
    public get() {
        return {
            "hello": "world"
        }
    }
}
```

- Compile the application by running:

```
npm run tsc
```

---

## Deploy to AWS Lambda

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

### Invoke Lambda

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

## Routing

----

Routing is configured using decorators on both controller classes and endpoint methods. You can also define a global base path (e.x. `/api/v1`) for your API by configuring the `base` property when passing your app configuration to the `ApiLambdaApp` class. (See the `Creating a new API` section)

### Controller Routes

You can declare a root path for all methods in a controller using the `apiController` decorator.

```typescript
import { injectable } from "inversify"

import { apiController, GET } from "typescript-lambda-api"

@injectable()
@apiController("/hello-world")
export class HelloWorldController {
    @GET()
    public get() {
        // handle get /hello-world requests
    }

    @POST()
    public get() {
        // handle post /hello-world requests
    }
}
```

### Endpoint Routes

You can declare a path for any given method in a controller when using the endpoint decorators. The `apiController` decorator is not required on the class to use this form of routing. 

```typescript
import { injectable } from "inversify"

import { apiController, GET } from "typescript-lambda-api"

@injectable()
@apiController("/store")
export class StoreController {
    @GET("/items")
    public getItems() {
        // handle get /store/items requests
    }
}
```

---

### Path Parameters

You can include parameters as part of your routes, when you need to capture parts of the URL.

```typescript
import { injectable } from "inversify"

import { apiController, pathParam, GET } from "typescript-lambda-api"

@injectable()
@apiController("/store")
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

import { apiController, pathParam, GET } from "typescript-lambda-api"

@injectable()
@apiController("/store/:storeId")
export class StoreController {
    @GET("/item/:id")
    public getItem(@pathParam("storeId") storeId: string, @pathParam("id") id: string) {
        // do something with storeId and id
    }
}
```

**Note all path parameters are passed in as strings, you will need to cast these if required**

----

## Request Parameter Binding

----

Different parts of the HTTP request can be bound to endpoint method parameters using decorators.

- `queryParam` - Query string parameter
- `header` - HTTP header value
- `fromBody` - Entity from request body, this will be an object if the request contains JSON, otherwise it will simply be a string


```typescript
import { injectable } from "inversify"

import { apiController, fromBody, header, queryParam, GET, POST } from "typescript-lambda-api"

import { Thing } "./Thing"

@injectable()
@apiController("/hello-world")
export class HelloWorldController {
    @GET()
    public getThings(@queryParam("id") id: string) {
        // do something with id
    }

    @GET("/some/other/route")
    public getThings(@header("content-type") contentType: string) {
        // do something with contentType
    }
    
    @POST("/thing")
    public getThings(@fromBody thing: Thing) {
        // do something with thing
    }
}
```

----

## Sending Responses

----

There are two ways to respond to requests:

- Return a value from your endpoint method
- Use the response context to send a response (see `Request / Response Context` section below - the context has convience methods for html, json etc.)

By default all return values are serialised to JSON in the response body and the `content-type` response header is set to `application/json`. To change this you can use the `produces` and `controllerProduces` decorators.

Only JSON content types are serialised automatically, all other types simply convert the return value to a string.

To set the response content type for all methods, use `controllerProduces` on a class.

```typescript
import { injectable } from "inversify"

import { apiController, controllerProduces, pathParam, produces, GET } from "typescript-lambda-api"

import { Item } from "./Item"

@injectable()
@apiController("/store/:storeId")
@controllerProduces("application/xml")
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

import { apiController, produces, GET } from "typescript-lambda-api"

import { Item } from "./Item"

@injectable()
@apiController("/motd")
export class MessageOfTheDayController {
    @GET()
    @produces("text/plain")
    public get(){
        return "Message of the Day!"
    }
}
```

----

## JSON Patch Requests

----

This library supports [JSON Patch](http://jsonpatch.com/) format for updating entities without having to upload the entire entity. To use it in your endpoints, ensure your controller extends the `Controller` class, an example is below:

```typescript
import { injectable } from "inversify"

import { apiController, produces, JsonPatch, PATCH } from "typescript-lambda-api"

import { Item } from "./Item"

@injectable()
@apiController("/store")
export class StoreController extends Controller {
    @PATCH("/item/:id")
    public modifyItem(@queryParam("id") id: string, @fromBody jsonPatch: JsonPatch) {
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

## Request / Response Context

----

If you want to read request bodies or write to the response, there are several supported approaches.

### Extending Controller Class

If you extend the controller class, you get access to the request and response context.

```typescript
import { injectable } from "inversify"

import { apiController, Controller, GET } from "typescript-lambda-api"

@injectable()
@apiController("/hello-world")
export class HelloWorldController extends Controller {
    @GET()
    public get() {
        let queryStringParam = this.request.query["someField"]

        // ... do some logic ...

        this.response.html("<h1>Hello World</h1>");
    }
}
```

### Using Decorators

You can use parameter decorators to inject the request and response context.

```typescript
import { injectable } from "inversify"
import { Request, Response } from "lambda-api"

import { apiController, request, response, GET } from "typescript-lambda-api"

@injectable()
@apiController("/hello-world")
export class HelloWorldController {
    @GET()
    public get(@request request: Request, @response response: Response) {
        let queryStringParam = request.query["someField"]

        // ... do some logic ...

        response.html("<h1>Hello World</h1>");
    }
}
```

**The `Request` and `Response` classes are documented in the [lambda-api](https://github.com/jeremydaly/lambda-api) package.**

----

## Configuration

----

The `AppConfig` class supports all the configuration fields documented in the [lambda-api](https://github.com/jeremydaly/lambda-api) package. (See the `Creating a new API` section)

### IOC Container

Configuring the IOC container to enable dependency injection into your controllers is easy. Once you build a `ApiLambdaApp` instance you can call the `configureApp` method like below:

```typescript
// build config and controllers path...
let app = new ApiLambdaApp(controllersPath, appConfig)

app.configureApp(container => {
    // bind interface to implementation class, for example
    container.bind<IMyService>(IMyService)
        .to(MyServiceImplementation)
})

// export handler
```

See the [InversifyJS](https://github.com/inversify/InversifyJS) package documentation for guidance how to use the `Container` class to manage dependencies.

### lambda-api

Configuring `lambda-api` directly can be done by calling the `configureApi` method like below:

```typescript
// build config and controllers path...
let app = new ApiLambdaApp(controllersPath, appConfig)

app.configureApi(api => {
    // add middleware handler, for example
    api.use((req,res,next) => {
        if (req.headers.authorization !== "secretToken") {
            res.error(401, "Not Authorized")
            return
        }

        req.authorized = true
        next()
    })
})

// export handler
```

See the [lambda-api](https://github.com/jeremydaly/lambda-api) package documentation for guidance how to use the `API` class.

---

## Testing

---

For local dev testing and integration with functional tests see the [typescript-lambda-api-local](https://www.npmjs.com/package/typescript-lambda-api-local) package which enables hosting your API using express as a local HTTP server.

Also check out this project's dev dependencies to see what you need to test API code. Also, and the `tests` directory of this repo contains some acceptance tests which will help you.

---

## Useful links

---

https://blog.risingstack.com/building-a-node-js-app-with-typescript-tutorial/

https://github.com/jeremydaly/lambda-api

https://codeburst.io/typescript-node-starter-simplified-60c7b7d99e27

https://www.typescriptlang.org/docs/handbook/decorators.html

https://medium.com/@samueleresca/inversion-of-control-and-dependency-injection-in-typescript-3040d568aabe

https://github.com/inversify/InversifyJS

https://www.npmjs.com/package/marky

https://www.meziantou.net/2018/01/11/aspect-oriented-programming-in-typescript
