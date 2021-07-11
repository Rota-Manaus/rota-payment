declare module '@ioc:Adonis/Core/GNType' {

    interface GNEnvType {
        endPoint: string,
        clientId: string,
        clientSecret: string,
        cert: string
    }

    interface GNType {
        sandbox: Boolean,
        prd: GNEnvType,
        hmg: GNEnvType,
        validateMtls: Boolean
    }
}