require('dotenv').config()
const request = require('request')
const util = require('util')
const cron = require('cron')
const Sequelize = require('sequelize')
        , sequelize = new Sequelize(process.env.APP_DB_NAME, process.env.APP_DB_USERNAME, process.env.APP_DB_PASSWORD, {dialect: 'mysql', host: process.env.APP_DB_HOST, logging: false});



const queryCampaigns = `select activa, id_user, id_campania, servidor from campania where date(fecha)=date(now())`
const queryActives = `select * from inbox where id_user=$id_user and id_campania=$id_campania and servidor=$servidor and status=-1 and id_modem=15001 and semilla=0 and (cod_operador_original=2 or transaction_number=2) limit $limit`
//const queryActives = `select * from inbox where id_user=$id_user and id_campania=$id_campania and servidor=$servidor and status=-1 and id_modem=15002 and semilla=1 limit $limit`
const queryNoActives = `select * from inbox where id_user=$id_user and id_campania=$id_campania and servidor=$servidor and status=-1 and prioridad=100 and id_modem=15001 and semilla=0`

const queryUpdate = `update inbox set status=$status, tries=tries+1, response=$response where id_inbox=$id_inbox`

const MSG_PRE= 1
const MSG_SENT= 2
const MSG_SENT_ERROR= 4

//const queryUpdatError = `update inbox set status=4, tries=tries+1, response='$response' where id_inbox=$id_inbox`

 let xml = 
`<order>
	<auth>
		<usuario>MICROVOZ</usuario>
		<password>Mic.321</password>
	</auth>
	<service>
		<provision>CMPSMS</provision>
		<operacion>SubmitSMS</operacion>
	</service>
	<parameters>
		<message>
			<destAddress>%s</destAddress>
			<shortMessage>%s</shortMessage>
			<sourceAddress>1234</sourceAddress>
			<prioridad>1</prioridad>
			<consultaEstado>0</consultaEstado>
		</message>
	</parameters>
</order>
`

const options = {
  url: 'http://wsfrontera2.sondeosglobal.com/?wsdl=',
  //url: 'https://www.google.com',
  //method: 'GET',
  method: 'POST',
  //body: xml,
  headers: {
    //'Content-Type':'text/xml;charset=utf-8',
    //'Accept-Encoding': 'gzip,deflate',
    //'Content-Length':xml.length,
    //'SOAPAction':"http://Main.Service/AUserService/GetUsers"
  }
}

//let callback = (error, response, body) => {
function callback(error, responseObject, response) {
	if (!error && responseObject.statusCode == 200) {
		console.log("Message sent to provider")
		sequelize.query(queryUpdate,
		 { bind: { id_inbox: this.id_inbox, response, status: MSG_SENT }, type: sequelize.QueryTypes.UPDATE })
	}else{
		console.log("Message provider error request")
		sequelize.query(queryUpdate,
		 { bind: { id_inbox: this.id_inbox, response, status: MSG_SENT_ERROR }, type: sequelize.QueryTypes.UPDATE })
	}
	//console.log('E', response.statusCode, response.statusMessage);  
}


var limit = 200

const tickMessages = new cron.CronJob({
  cronTime: '* * * * *',
  onTick: function() {
    console.log('new job check');
	main()

  },
  start: false//,
  //timeZone: 'America/Los_Angeles'
})

//tickMessages.start()





function main(){
	sequelize.query(queryCampaigns, { type: sequelize.QueryTypes.SELECT }) //.done(function(err, campaigns){
	  .then(campaigns => {
		campaigns.map(function(InfoCampaign, index){

			/*sequelize.query("select * from inbox limit 1",
			 {bind: {...InfoCampaign, limit: 200 }, type: sequelize.QueryTypes.SELECT }).then((messages)=>{
				messages.map(function(message){
					options.body = util.format(xml, "1158274772", "hola mundo")
					request(options, callback.bind({in_box: -1}))
				 })
			 })*/
			


			if(InfoCampaign.activa == 1){
delete InfoCampaign.activa
//console.log("en uno", InfoCampaign.id_campania)
//console.log(InfoCampaign)
				sequelize.query(queryActives,
				 {bind: {...InfoCampaign, limit: 200 }, type: sequelize.QueryTypes.SELECT }).then((messages)=>{
				 //{bind: { id_user: 21, id_campania:0, servidor: '186.22.223.37', limit: 200 }, type: sequelize.QueryTypes.SELECT }).then((messages)=>{
//console.log("Total messages found campaign and total", InfoCampaign.id_campania , messages.length)
console.log(InfoCampaign)
console.log("Total messages found campaign and total", InfoCampaign.id_campania , messages.length)
					messages.map(function(message){
//console.log("Message to send", message.destination_number, message.text)
						sequelize.query(queryUpdate,
						 { bind: { id_inbox: message.id_inbox, response: null, status: MSG_PRE }, type: sequelize.QueryTypes.UPDATE })

						options.body = util.format(xml, message.destination_number, message.text)
						request(options, callback.bind(message))
					 })
				 })
			}else if(InfoCampaign.activa == 0){
delete InfoCampaign.activa
//InfoCampaign.servidor = '186.22.223.37'
//console.log("en cero", InfoCampaign.id_campania)
//console.log(InfoCampaign)
				sequelize.query(queryNoActives,
				 {bind: InfoCampaign, type: sequelize.QueryTypes.SELECT }).then((messages)=>{
console.log(InfoCampaign)
console.log("Total messages found campaign and total", InfoCampaign.id_campania , messages.length)
					messages.map(function(message){
						sequelize.query(queryUpdate,
						 { bind: { id_inbox: message.id_inbox, response: null, status: MSG_PRE }, type: sequelize.QueryTypes.UPDATE })
//console.log("Message to send", message.destination_number, message.text)
						options.body = util.format(xml, message.destination_number, message.text)
						request(options, callback.bind(message));
					 })
				 });
			}
		})
	})

}


main()



/*				sequelize.query("select * from inbox where id_user=$user_id",
				 {bind: {user_id: 21}, type: sequelize.QueryTypes.SELECT }).then((user)=>{
					user.map(function(user){
console.log(user)
					 })
				 });*/


