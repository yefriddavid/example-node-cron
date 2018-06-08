require('dotenv').config()
const request = require('request')
const util = require('util')
const cron = require('cron')
const fs = require('fs')
const Sequelize = require('sequelize')
        , sequelize = new Sequelize(process.env.APP_DB_NAME, process.env.APP_DB_USERNAME, process.env.APP_DB_PASSWORD, {dialect: 'mysql', host: process.env.APP_DB_HOST, logging: false});




const tick = new cron.CronJob({
  cronTime: '* * * * *',
  onTick: function() {
    console.log('new job check');
    var sql = fs.readFileSync('reporte1.sql').toString();
    console.log(sql)



    /*sequelize.query(queryUpdate,
     *
     { bind: { id_inbox: this.id_inbox, response, status: MSG_SENT_ERROR }, type: sequelize.QueryTypes.UPDATE })*/
  },
  start: false
})

tick.start()
