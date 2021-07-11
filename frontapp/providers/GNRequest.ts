import axios from 'axios'
import fs from 'fs'
import path from 'path'
import https from 'https'
import { GNConfig } from 'Config/app'
import { GNEnvType } from '@ioc:Adonis/Core/GNType'

export default class GNRequest {

  private cert: Buffer
  private agent: https.Agent
  private gnEnv: GNEnvType = GNConfig.sandbox == true ? GNConfig.hmg : GNConfig.prd

  constructor () {
    this.cert = fs.readFileSync(
        path.resolve(`${this.gnEnv.cert}`)
    )

    this.agent = new https.Agent({
        pfx: this.cert,
        passphrase: ''
    })
  }

  public async create () {
    const authResponse = await this.authenticate()
    const accessToken = authResponse.data?.access_token;
    
    return axios.create({
        baseURL: this.gnEnv.endPoint,
        httpsAgent: this.agent,
        headers: {
        Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    })
  }

  private authenticate() {
    const credentials = Buffer.from(
      `${this.gnEnv.clientId}:${this.gnEnv.clientSecret}`
    ).toString('base64')
  
    return axios({
      method: 'POST',
      url: `${this.gnEnv.endPoint}/oauth/token`,
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json'
      },
      httpsAgent: this.agent,
      data: {
        grant_type: 'client_credentials'
      }
    })
  } 
}