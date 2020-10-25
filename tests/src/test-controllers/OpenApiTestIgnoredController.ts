import { injectable } from 'inversify';
import { apiController, apiIgnoreController, header, Controller, GET} from '../../../dist/ts-lambda-api';

@apiController("/test/internal")
@apiIgnoreController()
@injectable()
export class OpenApiTestIgnoredController extends Controller {
    @GET('/header')
    public privateApi(
        @header("x-test-header", { description: "test header param" }) test: string,
    ) {
        this.response.status(200).send("")
    }
}
