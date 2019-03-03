export class ApiBodyInfo {
    public contentType?: string
    public type?: symbol
    public clazz?: Function
    public description?: string

    public mergeInfo(apiBodyInfo: ApiBodyInfo) {
        if (apiBodyInfo.contentType) {
            this.contentType = apiBodyInfo.contentType
        }

        if (apiBodyInfo.type) {
            this.type = apiBodyInfo.type
        }

        if (apiBodyInfo.clazz) {
            this.clazz = apiBodyInfo.clazz
        }

        if (apiBodyInfo.description) {
            this.description = apiBodyInfo.description
        }
    }
}
