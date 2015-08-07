#!/usr/bin/env node

var request = require('request'),
    amqp = require('amqp');

module.exports = Stocks;

function Stocks() {
    var self = this;
}

Stocks.prototype.lookupByArray = function(stocks, cb) {
    var csv_stocks = '"' + stocks.join('","') + '"';

    var url = 'https://query.yahooapis.com/v1/public/yql';
    var data = encodeURIComponent('select * from yahoo.finance.quotes where symbol in (' + csv_stocks + ')');
    var data_url = url + '?q=' + data + '&env=http%3A%2F%2Fdatatables.org%2Falltables.env&format=json';

    request.get({url: data_url,
        json: true},
        function (error, response, body) {
            var stocksResult = [];
            if (!error && response.statusCode == 200) {
                var totalReturned = body.query.count;
                for (var i = 0; i < totalReturned; ++i) {
                    var stock = body.query.results.quote[i];

                    var stockReturn = {
                        'symbol': stock.symbol,
                        'price': stock.Ask
                    };
                    stocksResult.push(stockReturn);
                }

                cb(stocksResult);
            } else {
                console.log(error);
            }
        });
};


var fakeStocks = {
    AAPL: 95.0,
    MSFT: 50.0,
    AMZN: 300.0,
    GOOG: 550.0,
    YHOO: 35.0,
    FB: 75.0
};

function randomInterval(min, max) {
    return Math.floor(Math.random()*(max-min+1)+min);
}

Stocks.prototype.fakeLookupByArray = function(stocks, cb) {
    var stocksResult = [];
    for(var i=0; i<stocks.length; i++) {
        var symbol = stocks[i];
        var stockReturn = {};
        stockReturn['symbol'] = symbol;
        var randomizedChange = randomInterval(-150, 150);
        var floatChange = randomizedChange / 100;
        fakeStocks[symbol] += floatChange;
        stockReturn['price'] = fakeStocks[symbol];
        stockReturn['changeRealTime'] = '';

        stocksResult.push(stockReturn);
    }
    cb(stocksResult);
};

var main = function() {

    var connection = amqp.createConnection({
        host: 'localhost',
        login: 'websockets',
        password: 'rabbitmq'
    });

    var stocks = new Stocks();
    connection.on('ready', function() {
        connection.queue('stocks.work', {autoDelete: false, durable: true}, function(q) {
            q.subscribe(function(message) {
                var json_data = message.data.toString('utf8');
                var data;
                console.log(json_data);
                try {
                    data = JSON.parse(json_data);
                } catch(err) {
                    console.log(err);
                }
                stocks.fakeLookupByArray(data.stocks, function(stocks_ret) {
                    var data_str = JSON.stringify(stocks_ret);
                    console.log(data_str);
                    connection.publish('stocks.result', data_str, {deliveryMode: 2});
                });

            });
        });
    });

};

if(require.main === module) {
    main();
}