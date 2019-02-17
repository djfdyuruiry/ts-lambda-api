# typescript-lambda-api

Build REST API's using Typescript & AWS Lambda. Features:

- Decorator based routing for API controllers and endpoint methods
- API controller dependency injection using [InversifyJS](https://github.com/inversify/InversifyJS)

This project is built on top of the wonderful [lambda-api](https://github.com/jeremydaly/lambda-api) npm package.

---

## Creating a new API

---

This is a short guide to creating your first API using `typescript-lambda-api`. It is somewhat opinionated about project structure, but most of this can be easily customised. 

**Note: Node.js v8 & Typescript v3 or newer are required to use this package.**

- Create a directory for your project and run `npm init` to create your `package.json`

- Install required packages:

```shell
npm install -D typescript
npm install -D @types/node
npm install typescript-lambda-api
```

- Open `package.json` and add a script to enable access to the Typescript compiler:

```json
{
    // rest of package.json settings
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
import path from "path"

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

@injectable()
@apiController("/hello-world")
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

----

## Request / Response Model

----

If you want to read request bodies or write to the response object, you can add them as parameters to your endpoint methods:

```typescript
import { injectable } from "inversify"
import { Request, Response } from "lambda-api"
import { apiController, Controller, GET } from "typescript-lambda-api"

@injectable()
@apiController("/hello-world")
export class HelloWorldController extends Controller {
    @GET()
    public get(request: Request, response: Response) {
        let queryStringParam = request.query["someField"]

        // ... do some logic ...

        response.html("<h1>Hello World</h1>");
    }
}
```

The `Request` and `Response` classes are documented in the [lambda-api](https://github.com/jeremydaly/lambda-api) package.

----

## Configuration

----

The `AppConfig` class supports all the configuration fields documented in the [lambda-api](https://github.com/jeremydaly/lambda-api) package.

**IOC Container**

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

**lambda-api**

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

---

## Testing

---

For local dev testing and integration with functional tests see the [typescript-lambda-api-local](https://www.npmjs.com/package/typescript-lambda-api-local) package which enables hosting your API using express as a local HTTP server.

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
