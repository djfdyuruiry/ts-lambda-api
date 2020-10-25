import { injectable } from 'inversify';
import { apiController, apiIgnore, header, Controller, GET} from '../../../dist/ts-lambda-api';

@apiController("/test/part-internal")
@injectable()
export class OpenApiTestIgnoredEndpointController extends Controller {
    @GET('/public')
    public publicApi(
      @header("x-test-header", { description: "test header param" }) test: string,
    ) {
        this.response.status(200).send("")
    }

    @apiIgnore()
    @GET('/private')
    public privateApi(
      @header("x-test-header", { description: "test header param" }) test: string,
    ) {
        this.response.status(200).send("")
    }
}
