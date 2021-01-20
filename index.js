const express = require('express')
const bodyParser = require('body-parser')
const app = express();
let port = process.env.PORT || 3000;

let rooms = [
    {
        "type": "Deluxe Room",
        "price": 110.3,
        "frequency": "per night",
        // "discountPrice": "1",
        "image": "./hotel_3.jpg"
    },
    {
        "type": "King Suite",
        "price": 89.3,
        "frequency": "per night",
        // "discountPrice": "1.5",
        "image": "./hotel_2.png"
    },
    {
        "type": "Superior Deluxe Suite",
        "price": 55.1,
        "frequency": "per night",
        // "discountPrice": "4",
        "image": "./hotel_1.jpg"
    },
    {
        "type": "Super Econom",
        "price": 11,
        "frequency": "per night",
        // "discountPrice": "4",
        "members_only": 1,
        "image": "./hotel_4.jpg"
    }
];

function useTokens(initProducts, tokens){
    let hasDiscount = 0;
    let hasFreeShiping = 0;
    let showExtraProducts = 0;

    tokens.forEach(ticket=>{
        if (token.hasOwnProperty('ticketClass')) {
            switch (token.ticketClass) {
                case "0n":
                    hasDiscount++;
                    break;
                case "1n":
                    hasFreeShiping++;
                    break;
                case "2n":
                    showExtraProducts++;
                    break;
            }
        }
    })

    let activeRooms = [];
    initProducts.forEach(room=>{
        showExtraProducts && (room.members_only = 0);
        hasFreeShiping && (room.free_shipping = 1);
        hasDiscount && (room.discountPrice = parseFloat(room.price) - 2);

        room.members_only || activeRooms.push(room)
    });
    return activeRooms;
}

// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    // res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8888');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    // res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.use(bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

app.get('/', (request, response) => {
// response.send('Service works with POST only.');
    // response.json(rooms);
    // const params = new URLSearchParams('foo=bar&foo=baz');
    // for (const name of params.keys()) {
    //     console.log(name);
    // }
    response.json(useTokens(rooms, []) );
});

app.post('/', function (request, response) {
    if (!request.body || !request.body.tickets || !request.body.tickets.length){
        response.json(rooms);
    } else {
        let tickets = JSON.parse(request.body.tickets);
        response.json(useTokens(rooms, tickets) );
    }
});

app.listen(port, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }
    console.log(`server is listening on ${port}`)
})


