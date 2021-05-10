const express = require('express')
const bodyParser = require('body-parser')
const fetch = require('node-fetch');
const app = express();
let port = process.env.PORT || 3000;
let bearer = "AAAAAAAAAAAAAAAAAAAAAMGxPQEAAAAAn2J6b%2BvyI8t8qKryhfZUisZE94Q%3DcfOS71mRCVynHctv4q910Emh4Ezh0409XQHgjZ4UwDDciQhJ78";

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

app.get('/twitter/', async (request, response) => {

    try {
        if (!request.query || !request.query.name || !request.query.name.length){
            throw new Error("please dont forget to send username");
        }

        let re = /^[a-zA-Z0-9_]{4,15}$/;
        let regTest = re.test(String(request.query.name));

        if (!regTest){
            throw new Error("wrong username");
        }

        // console.log(request.query);

    
        let raw = await fetch('https://api.twitter.com/2/users/by/username/' + request.query.name + '?user.fields=id,name,description,profile_image_url,url,username',
        {
            headers: { 'authorization': 'Bearer ' + bearer },
        });
        let json = await raw.json();

        // console.log(json);

        response.json( json );
    } catch(err) {
        // console.log(err);
        response.json( {res: "request failed. "+err} );
    }
});

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


