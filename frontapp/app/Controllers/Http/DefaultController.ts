import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Env from '@ioc:Adonis/Core/Env'
import GNRequest from '../../../providers/GNRequest'
import CreateChargeValidator from 'App/Validators/CreateChargeValidator'
import axios from 'axios'

export default class DefaultController {

    private GNR = new GNRequest()

    public async index(ctx: HttpContextContract) {
        return ctx.response.send("ROTA Payment API")
    }

    public async create(ctx: HttpContextContract) {

        const gn = await this.GNR.create()
        const payload = await ctx.request.validate(CreateChargeValidator)
        
        try {
            let charge = await gn.post('/v2/cob', {
                calendario: {
                    expiracao: 3600
                },
                valor: {
                    original: payload.valor.toFixed(2).toString()
                },
                /* devedor: {
                    cpf: payload.cpf,
                    nome: payload.nome
                }, */
                infoAdicionais: [
                    { nome: "Pagamento", valor: "ROTAM recarga" }
                ],
                chave: Env.get('ROTA_CHAVE_PIX')
            })
            
            const qrcode = await gn.get(`/v2/loc/${charge.data.loc.id}/qrcode`)

            return ctx.response.send({
                message: "Cobrança com sucesso",
                data: {
                    charge: charge.data, 
                    qrcode: qrcode.data
                }
            })
        }
        catch(err) {
            console.error(err.response.data || err.message)
            return ctx.response.badRequest(err.response.data || err.message)
        }
    }

    public async show(ctx: HttpContextContract) {        
        try {
            const gn = await this.GNR.create()
            const res = await gn.get(`/v2/cob/${ctx.params.txid}`)
            return ctx.response.send(res.data)
        } 
        catch (err) {
            console.error(err.response.data || err.message)
            return ctx.response.send(err.response.data || err.message)
        }
    }

    public async list(ctx: HttpContextContract) {
        try {
            const { inicio, fim } = ctx.request.qs()
            const gn = await this.GNR.create()
            const res = await gn.get(`/v2/cob?inicio=${inicio}&fim=${fim}`)
            return ctx.response.send(res.data)
        } 
        catch (err) {
            console.error(err.response.data || err.message)
            return ctx.response.send(err.response.data || err.message)
        }
    }

    public validateWebhook(ctx: HttpContextContract) {
        return ctx.response.send("200")
    }

    public async configWebhook(ctx: HttpContextContract) {
        try {
            const gn = await this.GNR.create()
            const res = await gn.put(`/v2/webhook/${Env.get('ROTA_CHAVE_PIX')}`, {
                webhookUrl: Env.get('GN_WEBHOOK_URL')
            })
            return ctx.response.send(res.data)
        }
        catch(err) {
            console.error(err.response.data || err.message)
            return ctx.response.badRequest(err.response.data || err.message)
        }
    }

    public async listenWebhook(ctx: HttpContextContract) {
        const data = ctx.request.body()
        const pix = data.pix[0]

        try {
            const res = await axios.post(Env.get('PIX_CALLBACK_URL'), {
                txid: pix.txid,
                valor: pix.valor
            })

            console.log(pix)
            return ctx.response.status(res.status).send(res.data)
        }
        catch(err) {
            console.log(err.response.data || err.message)
            return ctx.response.badRequest(err.response.data || err.message)
        }
    }
}
