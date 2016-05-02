var Stremio  = require("stremio-addons"),
    Q = require("q"),
    cloudscraper = require('cloudscraper'),
    cheerio = require('cheerio');


var manifest = {
    "name": "Cpasbien",
    "description": "Sample addon providing a few public domain movies",
    "icon": "URL to 256x256 monochrome png icon",
    "background": "URL to 1366x756 png background",
    "id": "org.stremio.cpasbien",
    "version": "1.0.0",
    "types": ["movie"],

    // filter: when the client calls all add-ons, the order will depend on how many of those conditions are matched in the call arguments for every add-on
    "filter": { "query.imdb_id": { "$exists": true }, "query.type": { "$in":["series","movie"] } }
};




var methods = { };
var addon = new Stremio.Server(methods, { stremioget: true }, manifest);


var getByLink = function (link) {
    var deferred = Q.defer();
    cloudscraper.get(link, function (error, response, body) {
        if (error) {
            console.log('Error occurred');
            console.log(error);

            return deferred.reject(error);
        }

        var $ = cheerio.load(body);

        var movie = {
            id: "filmon_id:" + Math.floor((Math.random() * 10) + 1),
            type: "movie",
            name: $('#textefiche p').text(),
            genre: ["test"],
            poster: $('#bigcover').find('img').attr('src')
            //logo: x.big_logo || x.logo,
            // posterShape: "square", backgroundShape: "contain", logoShape: "hidden",
            // banner: $('#bigcover').find('img').attr('src'),
            // isFree: parseInt(x.is_free) || parseInt(x.is_free_sd_mode),
            // popularity: pop, // hehe
            // popularities: {filmon: pop},
            //certification: x.content_rating,
            // is_free, is_free_sd_mode, type, has_tvguide, seekable,  upnp_enabled

        };

        return deferred.resolve(movie);
    });

    return deferred.promise;
};

var getAll = function(host) {
    var deferred = Q.defer();
    cloudscraper.get(host, function (error, response, body) {
        if (error) {
            console.log('Error occurred');
            console.log(error);

            return deferred.reject(error);
        }

        var movies = [];
        var $ = cheerio.load(body);

        $('.ligne0, .ligne1').each(function (index, element) {
            var link = $(element).find('a').attr('href');

            getByLink(link).then(function (response) {
                movies.push(response);
            }, function (err) {
                console.log(err);
            });
        });

        console.log(movies);


        return deferred.resolve(movies);
    });

    return deferred.promise;
};





methods["meta.find"] = function(args, callback) {
    if (! args.query) return callback();

    // fetch some HTML...

    var host = 'http://www.cpasbien.cm/films/action-aventures/';
    getAll(host).then(function (response) {
        console.log('good!');
        console.log(response);
        callback({}, response);
    }, function (err) {
        console.log(err);
        return;
    });
};


var dataset = {
    // For p2p streams, you can provide availability property, from 0 to 3, to indicate stability of the stream; if not passed, 1 will be assumed
    // mapIdx is the index of the file within the torrent ; if not passed, the largest file will be selected
    "tt0032138": { infoHash: "24c8802e2624e17d46cd555f364debd949f2c81e", mapIdx: 0, availability: 2 }, // the wizard of oz 1939
    "tt0017136": { infoHash: "dca926c0328bb54d209d82dc8a2f391617b47d7a", mapIdx: 1, availability: 2 }, // metropolis, 1927

    // night of the living dead, example from magnet
    "tt0051744": { infoHash: "9f86563ce2ed86bbfedd5d3e9f4e55aedd660960" }, // house on haunted hill 1959

    "tt1254207": { url: "http://clips.vorwaerts-gmbh.de/big_buck_bunny.mp4", availability: 1 }, // big buck bunny, HTTP stream
    "tt0031051": { yt_id: "gLKA7wxqtfM", availability: 2 }, // The Arizona Kid, 1939; YouTube stream

    "tt0137523": { externalUrl: "https://www.netflix.com/watch/26004747" }, // Fight Club, 1999; redirect to Netflix

    "tt1748166 1 1": { infoHash: "07a9de9750158471c3302e4e95edb1107f980fa6" }, // Pioneer One
};
/*var client = new Stremio.Client();
client.add("http://cinemeta.strem.io/stremioget");
methods["meta.find"] = function(args, callback) {
    var ourImdbIds = Object.keys(dataset).map(function(x) { return x.split(" ")[0] });
    console.log(ourImdbIds);
    args.query = args.query || { };
    args.query.imdb_id = args.query.imdb_id || { $in: ourImdbIds };
    client.meta.find(args, function(err, res) {
        console.log(res);
        callback(err, res ? res.map(function(r) {
            r.popularities = { helloWorld: 10000 }; // we sort by popularities.helloWorld, so we should have a value
            return r;
        }) : null);
    });
}*/

var server = require("http").createServer(function (req, res) {
    addon.middleware(req, res, function() { res.end() }); // wire the middleware - also compatible with connect / express
}).on("listening", function()
{
    console.log("Sample Stremio Addon listening on "+server.address().port);
}).listen(process.env.PORT || 7000);
