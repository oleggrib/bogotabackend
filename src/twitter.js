const { JsonDB } = require('node-json-db');
const { Config } = require('node-json-db/dist/lib/JsonDBConfig');

const {TwitterClient} = require('twitter-api-client');

const dbTimeout = 1000 * 60 * 60 * 12; // 12 hours
const db = new JsonDB(new Config("myDataBase", true, false, '/'));
const dbQuery = new JsonDB(new Config("myQueryDataBase", true, false, '/'));
const dbUsers = new JsonDB(new Config("myUsersDataBase", true, false, '/'));

async function getTwitterUsers(name){
    name = name.toLowerCase();
    try {
        var data = db.getData("/"+name);
        // console.log(data);
        // console.log(!!data);
        if (data) {
            if (data.time < (Date.now() - dbTimeout)) {
                // console.log('cache data expired ... remove');
                db.delete("/" + name);
            } else {
                // console.log('return cached data for: '+name);
                // console.log(data.json);
                // response.json( data.json );
                return data.users;
            }
        }
    } catch (e) {
        // console.log('cant find data in DB');
        // console.log(e);
    }


    // console.log(request.query);

    try {
        let twitterClient = new TwitterClient({
            apiKey: 'bw3IB3AkhFtVgp6vCNhQVLY1k',
            apiSecret: 'AGBRs8whTEZiEmCapBNqPpOgnvsNGtwgDDYrlB7sf3Lt105FhH',
            accessToken: '14190486-tHT8DhDFmpbJSJqPRV6HUQiT2Hu9jhafcpkt07YNz',
            accessTokenSecret: 'yTFNDOVKebSt8w7H43JXUms8GUxP6YBAisVfcJfX5qhom',
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

        // let raw = await fetch('https://api.twitter.com/2/users/by/username/' + name + '?user.fields=id,name,description,profile_image_url,url,username',
        // {
        //     headers: { 'authorization': 'Bearer ' + bearer },
        // });
        // let json = await raw.json();

        // console.log('save db recored for '+name + ' , used time: ' + (Date.now() - time));
        db.push("/"+name, {time: Date.now(), users});

        // Save the data (useful if you disable the saveOnPush)
        // db.save();

        // In case you have a exterior change to the databse file and want to reload it
        // use this method
        // db.reload();
        return users;

    } catch (e){
        console.log(e);
        console.log('something wrong with twitter request');
        return [];
    }

}

module.exports = {db, getTwitterUsers};
