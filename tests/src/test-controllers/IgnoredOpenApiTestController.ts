import { injectable } from 'inversify';
import { apiController, apiIgnoreController, apiIgnore, Controller, GET, header, api} from '../../../dist/ts-lambda-api';

@injectable()
@apiController("/test/internal")
@apiIgnoreController()
export class IgnoredController extends Controller {

    @GET('/header')
    public privateApi(
        @header("x-test-header", { description: "test header param" }) test: string,
    ) {
        this.response.status(200).send("")
    }
}

@injectable()
@apiController("/test/part-internal")
export class IgnoredEndpointController extends Controller {

    @GET('/public')
    public publicApi(
      @header("x-test-header", { description: "test header param" }) test: string,
    ) {
        this.response.status(200).send("")
    }

    @GET('/private')
    @apiIgnore()
    public privateApi(
      @header("x-test-header", { description: "test header param" }) test: string,
    ) {
        this.response.status(200).send("")
    }
}