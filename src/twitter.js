const { JsonDB } = require('node-json-db');
/*
create file .env at the root of the project and add twitter API data
TWITTER_API_KEY = 'Bfn...'
TWITTER_API_SECRET = 'n5k...'
TWITTER_ACCESS_TOKEN: '138...'
TWITTER_ACCESS_TOKEN_SECRET: '0cs...'
 */
require('dotenv').config();
const { Config } = require('node-json-db/dist/lib/JsonDBConfig');


const {TwitterClient} = require('twitter-api-client');

// TODO implement DB cleaning daily
const dbTimeout = 1000 * 60 * 60 * 12; // save users in DB for 12 hours
const db = new JsonDB(new Config("myDataBase", true, false, '/'));

async function getTwitterUsers(name){
    name = name.toLowerCase();
    try {
        var data = db.getData("/"+name);
        if (data) {
            if (data.time < (Date.now() - dbTimeout)) {
                // cache data expired ... remove
                db.delete("/" + name);
            } else {
                // return cached data
                return data.users;
            }
        }
    } catch (e) {
        // console.log('cant find data in DB', e);
    }

    try {
        const twitterClient = new TwitterClient({
            apiKey: process.env.TWITTER_API_KEY,
            apiSecret: process.env.TWITTER_API_SECRET,
            accessToken: process.env.TWITTER_ACCESS_TOKEN,
            accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET
        })
        const users = (
            await twitterClient.accountsAndUsers.usersSearch({
                q: name,
            })
        ).map((user) => {
            return {
                id: user['id_str'],
                name: user['name'],
                screenName: user['screen_name'],
                photoURL: user['profile_image_url_https'],
                followersCount: user['followers_count'],
                verified: user['verified'],
            };
        });

        // Twitter API 2.0 request for user lookup
        // let raw = await fetch('https://api.twitter.com/2/users/by/username/' + name + '?user.fields=id,name,description,profile_image_url,url,username',
        // {
        //     headers: { 'authorization': 'Bearer ' + bearer },
        // });
        // let json = await raw.json();

        db.push("/"+name, {time: Date.now(), users});

        return users;

    } catch (e){
        console.log('something wrong with twitter request.',e);
        return [];
    }

}

module.exports = {db, getTwitterUsers};
