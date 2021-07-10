import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Env from '@ioc:Adonis/Core/Env'
import GerenciaNet from 'gn-api-sdk-node'
import { GNCredentials } from 'Config/app'
import CreateChargeValidator from 'App/Validators/CreateChargeValidator'

export default class DefaultController {

    private GN = new GerenciaNet(GNCredentials)

    public async index(ctx: HttpContextContract) {
        return ctx.response.send("Payment API xa")
    }

    public async create(ctx: HttpContextContract) {

        const payload = await ctx.request.validate(CreateChargeValidator)
        
        try {
            const charge = await this.GN.pixCreateImmediateCharge({}, {
                calendario: {
                    expiracao: 3600
                },
                valor: {
                    original: payload.valor.toFixed(2).toString()
                },
                devedor: {
                    cpf: payload.cpf,
                    nome: payload.nome
                },
                infoAdicionais: [
                    { nome: "Pagamento", valor: "ROTAM recarga" }
                ],
                chave: Env.get('ROTA_CHAVE_PIX')
            })
            
            const params = { id: charge.loc.id }
            const qrcode = await this.GN.pixGenerateQRCode(params)

            return ctx.response.send({
                message: "Pagamento gerado com sucesso",
                data: { charge, qrcode }
            })
        }
        catch(err) {
            console.error(err)
            return ctx.response.badRequest(err)
        }
    }

    public async show(ctx: HttpContextContract) {
        
        const params = { txid: ctx.params.txid }
        
        try {
            const res = await this.GN.pixDetailCharge(params)
            return ctx.response.send(res)
        } 
        catch (err) {
            console.error(err)
            return ctx.response.send(err)
        }
    }

    public async configWebhook(ctx: HttpContextContract) {

        const body = {
            webhookUrl: Env.get('WEBHOOK_URL')
        }

        const params = {
            chave: Env.get('ROTA_CHAVE_PIX')
        }
        console.log('body', body)
        console.log('params', params)
        try {
            const res = await this.GN.pixConfigWebhook(params, body)
            return ctx.response.send(res)
        }
        catch(err) {
            console.error(err)
            return ctx.response.badRequest(err)
        }
    }

    public async listenWebhook(ctx: HttpContextContract) {
        const data = ctx.request.body()
        console.log(data)
        return ctx.response.send(data)
    }
}
