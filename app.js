'use strict';
// var i1=(new Date()).getTime();
// var i2=0;
// setInterval(() => {
//     i2=(new Date()).getTime();
//     console.log("------>"+(i2-i1))
//     i1=(new Date()).getTime();
    
// }, 1000);
// console.log('Hello world');


const Web3 = require('web3')
const Daoapi = require("daoapi")
var mysql = require('mysql');
var fs = require("fs");
const schedule =require("node-schedule");
var myListen = { isError: false, count: 0,timest:(new Date()).getTime() }

var web3; // = new Web3('wss://ropsten.infura.io/ws/v3/63aa34e959614d01a9a65d3f93b70e66')
var selectAcouunt = '0x75EFcbeC4961D6FD3B77F271ce9e5cb7458cb69E'
var daoapi; // = new Daoapi(web3, selectAcouunt,'Ropsten');;

async function cethonnect() {
    myListen.count = 0;
    myListen.timest=(new Date()).getTime();

    if (daoapi && daoapi.unsub) {
        daoapi.unsub()
    }

    web3 = await new Web3('wss://ropsten.infura.io/ws/v3/63aa34e959614d01a9a65d3f93b70e66');
    daoapi = new Daoapi(web3, selectAcouunt, 'Ropsten', myListen);
    try {
    lisitern();
    } catch(e)
    {
        console.log(e)
    }
}
var data = fs.readFileSync('./sn.txt', 'utf8');
var _json = JSON.parse(data)
console.log(data);

var conn;
var maxData = [];

function hand() {
    //  if(daoapi) daoapi.unsub();
    //  daoapi= new Daoapi(web3, selectAcouunt);
    conn = mysql.createConnection({
        host: _json.host,
        user: _json.user,
        password: _json.password,
        database: _json.database
    });

    conn.connect(function (err) {
        if (err) {
            console.log('error when connecting to db:', err);
            setTimeout(hand, 2000);
        }
    });

    conn.on('error', function (err) {
        console.log('db error', err);
        //  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        hand();
    });

    let sql = 'SELECT IFNULL(MAX(block_num),0) s FROM t_dao'  //0 
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0) FROM t_setlogo'  //1
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0) FROM t_changelogo' //2
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0) FROM t_org'  //3
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0) FROM t_token'  //4
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0) FROM t_u2t'  //5
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0) FROM t_t2u'  //6
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0) FROM t_t2t'  //7
        + ' UNION ALL select IFNULL(MAX(block_num),0) FROM t_os'  //8
        + ' union all SELECT IFNULL(MAX(block_num),0) FROM t_swap' //9
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0) FROM t_swapdeth'  //10
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0) FROM t_pro'  //11
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0) FROM t_provote'  //12
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0) FROM t_proexcu'  //13
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0) FROM t_app'  //14
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0) FROM t_application'  //15
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0) FROM t_appversion';  //16
    conn.query(sql, function (error, results, fields) {
        console.log(results)
        if (error) throw error;
        maxData = [];
        results.forEach(element => {
            maxData.push(element.s)
        });

        console.log("start...........")
        cethonnect();
        // setInterval(function () {
        //     if (myListen.isError) {
        //         p("ERROR restaet web3 listener!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        //         cethonnect();

        //     }
        //     if (myListen.count > 10) {
        //         p(" Time out restaet web3")
        //         cethonnect();
        //     }
        //     myListen.count++;
        //    p(myListen.count+"----------->");

        // }, 1000 * 60);

        
      schedule.scheduleJob("5 * * * * *",async() => {

                 if (myListen.isError) {
                    p("ERROR restaet web3 listener!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
                    cethonnect();
                }
                if (myListen.count > 10) {
                    p(" Time out restaet web3")
                    cethonnect();
                }
                if(((new Date()).getTime()-myListen.timest)>1000)
               { p(myListen.count+"----------->");
                myListen.count++;
                myListen.timest=(new Date()).getTime();
            }
        });
    });
}

hand();

function insertO(addSql, addSqlParams) {
    conn.query(addSql, addSqlParams, function (err, result) {
        if (err) {
            console.log('[INSERT ERROR] - ', err.message);
            return;
        }

    });
}

function p(k) {
    var myDate = new Date();
    console.log(myDate.getHours() + ":" + myDate.getMinutes() + ":" + myDate.getSeconds() + "-->" + k)
}
function lisitern() {



    p("daoapi version:" + daoapi.version)

    daoapi.os.daoCreateEvent(maxData[0], data => {
        console.log(data);
        let sql = "INSERT INTO t_dao(dao_id,block_num,dao_name,dao_symbol,dao_dsc,dao_manager,dao_time,org_id,is_token) VALUES(?,?,?,?,?,?,?,?,?)";
        let params = [data.data.daoId, data.blockNumber, data.data.name, data.data.symbol, data.data.describe, data.data.managerAddress, data.data.daoTime, data.data.orgId, (data.data.isToken ? 1 : 0)];
        maxData[0] = data.blockNumber
        insertO(sql, params);

    })

    //os
    daoapi.os.osCreateEvent(maxData[8], data => {
        console.log(data);
        let sql = "INSERT INTO t_os(dao_id,block_num,os_address) VALUES(?,?,?)";
        let params = [data.data.daoId, data.blockNumber, data.data.osAddress];
        maxData[8] = data.blockNumber
        insertO(sql, params);
    })
    // })


    //setlogo
    daoapi.logo.setLogoEvent(maxData[1], data => {
        console.log(data);
        let sql = "INSERT INTO t_setlogo(dao_id,block_num,dao_time,dao_logo) VALUES(?,?,?,?)";
        let params = [data.data.daoId, data.blockNumber, data.data.timestamp, data.data.src];
        maxData[1] = data.blockNumber
        insertO(sql, params);
    })

    //chanelogo
    daoapi.logo.changeLogoEvent(maxData[2], data => {
        console.log(data);
        let sql = "call excuteLogo(?,?,?,?)";
        // let sql = "INSERT INTO t_changelogo (dao_id,block_num,dao_time,dao_logo) VALUES(?,?,?,?)";
        let params = [data.data.daoId, data.blockNumber, data.data.timestamp, data.data.src];
        maxData[2] = data.blockNumber
        insertO(sql, params);
    })

    //org
    daoapi.org.orgCreateEvent(maxData[3], data => {
        console.log(data);
        daoapi.org.getInitData(data.data.id).then(obj => {
            let sql = "INSERT INTO t_org(org_id,block_num,org_address,org_name,org_manager,vote1,vote2,vote3) VALUES(?,?,?,?,?,?,?,?)";
            let params = [data.data.id, data.blockNumber, data.data.vote_address, data.data.name, data.data.org_manager, obj[3][0], obj[3][1], obj[3][2]];
            maxData[3] = data.blockNumber
            insertO(sql, params);
            for (let i = 0; i < obj[1].length; i++) {
                let sql1 = "INSERT INTO t_orgdetail(org_id,org_vote,org_address) VALUES(?,?,?)";
                let params1 = [data.data.id, obj[2][i], obj[1][i]];
                insertO(sql1, params1);
            }

        })
    })


    // publishtoken
    daoapi.tokens.publishTokenEvent(maxData[4], data => {
        console.log(data);
        let sql = "INSERT INTO t_token(dao_id,block_num,dao_time,token_id) VALUES(?,?,?,?)";
        let params = [data.data.daoId, data.blockNumber, data.data.timestamp, data.data.tokenId];
        maxData[4] = data.blockNumber
        insertO(sql, params);
    })

    //u2t
    daoapi.iadd.utokenTotokenEvent(maxData[5], async data => {
        console.log(data);
        let sql = "INSERT INTO t_u2t(block_num,to_token_id,utoken_cost,from_address,to_address,utoken_amount,token_amount,swap_time) VALUES(?,?,?,?,?,?,?,?)";
        let cost = await daoapi.iadd.getPool(data.data.tokenId);
        let params = [data.blockNumber, data.data.tokenId, cost.utoken, data.data.from, data.data.to, data.data.utoken, data.data.token, data.data.swap_time];
        maxData[5] = data.blockNumber
        insertO(sql, params);
        token_cost(data.data.tokenId, data.data.to);
    })


    //t2u
    daoapi.iadd.tokenToUtokenEvent(maxData[6], async data => {
        console.log(data);
        let sql = "INSERT INTO t_t2u(block_num,from_token_id,utoken_cost,from_address,to_address,utoken_amount,token_amount,swap_time)  VALUES(?,?,?,?,?,?,?,?)";
        let cost = await daoapi.iadd.getPool(data.data.tokenId);
        let params = [data.blockNumber, data.data.tokenId, cost.utoken, data.data.from, data.data.to, data.data.utoken, data.data.token, data.data.swap_time];
        maxData[6] = data.blockNumber
        insertO(sql, params);
        token_cost(data.data.tokenId, data.data.from);
    })

    //t2t
    daoapi.iadd.tokenTotokenEvent(maxData[7], async data => {
        console.log(data);
        let sql = "INSERT INTO t_t2t (block_num,from_token_id,to_token_id,from_utoken_cost,to_utoken_cost,from_address,to_address,from_token,to_token,swap_time) VALUES(?,?,?,?,?,?,?,?,?,?)";
        let cost1 = await daoapi.iadd.getPool(data.data.fromTokenId);
        let cost2 = await daoapi.iadd.getPool(data.data.toTokenId);
        let params = [data.blockNumber, data.data.fromTokenId, data.data.toTokenId, cost1.utoken, cost2.utoken, data.data.from, data.data.to, data.data.fromToken, data.data.toToken, data.data.swap_time];
        maxData[7] = data.blockNumber
        insertO(sql, params);
        token_cost(data.data.toTokenId, data.data.to);
        token_cost(data.data.fromTokenId, data.data.from);

    })
    //eth to utoken 
    daoapi.utoken.swapEvent(maxData[9], data => {
        console.log(data);
        let sql = "INSERT INTO t_swap(block_num,swap_address,swap_time,swap_eth,swap_utoken) VALUES(?,?,?,?,?)";
        let params = [data.blockNumber, data.data.address, data.data.swapTime, data.data.ethAmount, data.data.utokenAmount];
        maxData[9] = data.blockNumber
        insertO(sql, params);
    })

    //eth to utoken 
    daoapi.utoken.swapToEvent(maxData[9], data => {
        console.log(data);
        let sql = "INSERT INTO t_swap(block_num,swap_address,swap_time,swap_eth,swap_utoken) VALUES(?,?,?,?,?)";
        let params = [data.blockNumber, data.data.address, data.data.swapTime, data.data.ethAmount, data.data.utokenAmount];
        maxData[9] = data.blockNumber
        insertO(sql, params);
    })

    //DETH to utoken 
    daoapi.utoken.swapDethEvent(maxData[10], data => {
        console.log(data);
        let sql = "INSERT INTO t_swapdeth(block_num,from_address,swap_time,swap_eth,swap_utoken,to_address) VALUES(?,?,?,?,?,?)";
        let params = [data.blockNumber, data.data.fromAddress, data.data.swapTime, data.data.ethAmount, data.data.utokenAmount, data.data.toAddress];
        maxData[10] = data.blockNumber
        insertO(sql, params);
    })

    //addpro
    daoapi.eventSum.addProEvent(maxData[11], async data => {
        console.log(data);
        let _pro = await daoapi.vote.getPro(data.data.proIndex, data.data.voteDel);
        //  console.log("--------------------------------------")
        // console.log(_pro);
        let sql = "INSERT INTO t_pro(block_num,pro_index,pro_del,pro_address,pro_time,pro_name,dao_id,pro_app)  VALUES(?,?,?,?,?,?,?,?)";
        let params = [data.blockNumber, data.data.proIndex, data.data.voteDel, data.data.address, data.data.time, data.data.name, data.data.daoId, _pro['data'].substr(0, 10)];
        maxData[11] = data.blockNumber
        insertO(sql, params);
    })


    daoapi.eventSum.voteToEvent(maxData[12], data => {
        console.log(data);
        let sql = "INSERT INTO t_provote(block_num,pro_index,pro_del,vote_address,vote_power,vote_time) VALUES(?,?,?,?,?,?)";
        let params = [data.blockNumber, data.data.proIndex, data.data.voteDel, data.data.voter, data.data.power, data.data.time];
        maxData[12] = data.blockNumber
        insertO(sql, params);
    })


    daoapi.eventSum.execEvent(maxData[13],data => {
        console.log(data);
        let sql = "INSERT INTO t_proexcu(block_num,pro_index,pro_del,excu_address,excu_time)  VALUES(?,?,?,?,?)";
        let params = [data.blockNumber, data.data.proIndex, data.data.voteDel, data.data.address, data.data.time];
        maxData[13] = data.blockNumber
        insertO(sql, params);
    })

    //appadd
    daoapi.allapp.addAppEvent(maxData[14],async data => {
        console.log(data);
        let _data = await daoapi.allapp.getAppInfo(data.data.index);
        let _app = await daoapi.allapp.getVersionInfo(data.data.index,_data.versions);
     
        let sql = "INSERT INTO t_app(block_num,app_name,app_index,app_index_rec,app_desc,app_version,app_address,app_manager,app_time) VALUES(?,?,?,?,?,?,?,?,?)";
        let params = [data.blockNumber,_data.name, data.data.index, data.data.indexRec,_data.desc,_data.versions,_app.to,data.data.address,data.data.time];
        maxData[14] = data.blockNumber
        insertO(sql, params);
    })

     //appaddversion
     daoapi.allapp.addVersionEvent(maxData[16],async data => {
        console.log(data);
      
        let _app = await daoapi.allapp.getVersionInfo(data.data.appNum,data.data.version);
      
     
        let sql = "INSERT INTO t_appversion(block_num,app_index,app_index_rec,app_desc,app_version,app_address) VALUES(?,?,?,?,?,?)";
        let params = [data.blockNumber, data.data.appNum, data.data.rec, _app.desc,data.data.version,_app.to];
        console.log(params)
        maxData[16] = data.blockNumber
        insertO(sql, params);
    })
   

    daoapi.application.installEvent(maxData[15],data => {
        console.log(data);
        let sql = "INSERT INTO t_application(block_num,dao_id,app_id,app_version,app_del)  VALUES(?,?,?,?,?)";
        let params = [data.blockNumber, data.data.daoId, data.data.appsetId, data.data.appsetVersion, data.data.votedelAddress];
        maxData[15] = data.blockNumber
        insertO(sql, params);
    })

}


function token_cost(id, address) {
    daoapi.tokens.balanceOf(id, address).then(e => {
        let sql = "CALL excuteToken(?,?,?)";
        let params = [id, address, e.token];
        insertO(sql, params);
    })
}




    //org
    // daoapi.org.orgCreateEvent(maxData[3], data => {
    //     console.log(data);
    //   //  let sql = "INSERT INTO t_os(dao_id,block_num,os_address) VALUES(?,?,?)";
    //   let sql = "INSERT INTO t_org(org_id,block_num,org_address,org_name) VALUES(?,?,?,?)";
    //     let params = [data.data.id, data.blockNumber, data.data.vote_address, data.data.name];
    //     insertO(sql, params);
    //     maxData[3] = data.blockNumber;
    // })






    // daoapi.register.createDaoEvent(maxData[0], data => {
    //     console.log(data);
    //     let sql = "INSERT INTO t_dao(dao_id,block_num,dao_name,dao_symbol,dao_dsc,dao_manager,dao_time) VALUES(?,?,?,?,?,?,?)";
    //     let params = [data.data.daoId, data.blockNumber, data.data.name, data.data.symbol, data.data.describe, data.data.managerAddress, data.data.daoTime];
    //     insertO(sql, params);
    //     maxData[0] = data.blockNumber;
    // })

        // schedule.scheduleJob("5 * * * * *",async() => {
        //     await osEvents(maxData[0]);
        // })
      //  schedule.scheduleJob("5 * * * * *",async() => {
       //     await setLogoEvents(maxData[1]);
       // })
