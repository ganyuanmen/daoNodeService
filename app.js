
const Web3 = require('web3')
const Daoapi = require("daoapi")
var mysql = require('mysql');
var fs = require("fs");



var web3 = new Web3('wss://ropsten.infura.io/ws/v3/63aa34e959614d01a9a65d3f93b70e66')
var selectAcouunt = '0x75EFcbeC4961D6FD3B77F271ce9e5cb7458cb69E'

const daoapi = new Daoapi(web3, selectAcouunt);
console.log("daoapi version:" + daoapi.version)

var data = fs.readFileSync('./sn.txt', 'utf8');
let _json = JSON.parse(data)
console.log(data);

var connection = mysql.createConnection({
    host: _json.host,
    user: _json.user,
    password: _json.password,
    database: _json.database
});

var maxData = [];
connection.connect();
//"t_dao","t_setlogo","t_changelogo","t_os","t_token","t_u2t","t_t2u","t_t2t"
let sql = 'SELECT IFNULL(MAX(block_num),0) s FROM t_dao UNION ALL SELECT IFNULL(MAX(block_num),0) FROM t_setlogo UNION ALL SELECT IFNULL(MAX(block_num),0) FROM t_changelogo UNION ALL SELECT IFNULL(MAX(block_num),0) FROM t_os UNION ALL SELECT IFNULL(MAX(block_num),0) FROM t_token UNION ALL SELECT IFNULL(MAX(block_num),0) FROM t_u2t UNION ALL SELECT IFNULL(MAX(block_num),0) FROM t_t2u UNION ALL SELECT IFNULL(MAX(block_num),0) FROM t_t2t';
connection.query(sql, function (error, results, fields) {
    console.log(results)
    if (error) throw error;
    results.forEach(element => {
        maxData.push(element.s)
    });
    console.log(maxData);

    daoapi.register.createDaoEvent(maxData[0], data => {
        console.log(data);
        let sql = "INSERT INTO t_dao(dao_id,block_num,dao_name,dao_symbol,dao_dsc,dao_manager,dao_time) VALUES(?,?,?,?,?,?,?)";
        let params = [data.data.daoId, data.blockNumber, data.data.name, data.data.symbol, data.data.describe, data.data.managerAddress, data.data.daoTime];
        insertO(sql, params);
        maxData[0] = data.blockNumber;
    })

    daoapi.logo.setLogoEvent(maxData[1], data => {
        console.log(data);
        let sql = "INSERT INTO t_setlogo(dao_id,block_num,dao_time,dao_logo) VALUES(?,?,?,?)";
        let params = [data.data.daoId, data.blockNumber, data.data.timestamp, data.data.src];
        insertO(sql, params);
        maxData[1] = data.blockNumber;
    })

    daoapi.logo.changeLogoEvent(maxData[2], data => {
        console.log(data);
        let sql = "INSERT INTO t_changelogo (dao_id,block_num,dao_time,dao_logo) VALUES(?,?,?,?)";
        let params = [data.data.daoId, data.blockNumber, data.data.timestamp, data.data.src];
        insertO(sql, params);
        maxData[2] = data.blockNumber;
    })
    daoapi.register.createOsEvent(maxData[3], data => {
        console.log(data);
        let sql = "INSERT INTO t_os(dao_id,block_num,os_address) VALUES(?,?,?)";
        let params = [data.data.daoId, data.blockNumber, data.data.osAddress];
        insertO(sql, params);
        maxData[3] = data.blockNumber;
    })
    daoapi.tokens.publishTokenEvent(maxData[4], data => {
        console.log(data);
        let sql = "INSERT INTO t_token(dao_id,block_num,dao_time,token_id) VALUES(?,?,?,?)";
        let params = [data.data.daoId, data.blockNumber, data.data.timestamp, data.data.tokenId];
        console.log(sql);
        console.log(params);
        insertO(sql, params);
        maxData[4] = data.blockNumber;
    })

    daoapi.iadd.utokenTotokenEvent(maxData[5], async data => {
        console.log(data);
        let sql = "INSERT INTO t_u2t(block_num,to_token_id,utoken_cost) VALUES(?,?,?)";
        let cost = await daoapi.iadd.getPool(data.data.tokenId);
        let params = [data.blockNumber, data.data.tokenId, cost.utoken];
        insertO(sql, params);
        maxData[5] = data.blockNumber;
    })

    daoapi.iadd.tokenToUtokenEvent(maxData[6], async data => {
        console.log(data);
        let sql = "INSERT INTO t_t2u(block_num,from_token_id,utoken_cost)  VALUES(?,?,?)";
        let cost = await daoapi.iadd.getPool(data.data.tokenId);
        let params = [data.blockNumber, data.data.tokenId, cost.utoken];
        insertO(sql, params);
        maxData[6] = data.blockNumber;
    })
    daoapi.iadd.tokenTotokenEvent(maxData[7], async data => {
        console.log(data);
        let sql = "INSERT INTO t_t2t (block_num,from_token_id,to_token_id,from_utoken_cost,to_utoken_cost) VALUES(?,?,?,?,?)";
        let cost1 = await daoapi.iadd.getPool(data.data.fromTokenId);
        let cost2 = await daoapi.iadd.getPool(data.data.toTokenId);
        let params = [data.blockNumber, data.data.fromTokenId, data.data.toTokenId, cost1.utoken, cost2.utoken];
        insertO(sql, params);
        maxData[7] = data.blockNumber;
    })

});


//connection.end();

function insertO(addSql, addSqlParams) {
    connection.query(addSql, addSqlParams, function (err, result) {
        if (err) {
            console.log('[INSERT ERROR] - ', err.message);
            return;
        }

    });
}