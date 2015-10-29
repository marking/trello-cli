var _ = require("underscore"),
async = require("async"),
fs = require("fs");

var __ = function(program, output, logger, config, trello, translator){

  program
  .command("refresh")
  .help("Refresh all your board/list names")
  .callback(function(type){

    // Defaults!
    if (typeof type !== "string"){
      type = "all";
    }

    var cachePath = config.get("configPath") + config.get("translationCache");
    var cacheFile = {};
    try {
      cacheFile = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
    } catch (e){
      // Nothing! 
    }

    cacheFile.translations = cacheFile.translations || {};
    cacheFile.translations.orgs = cacheFile.translations.orgs || {};
    cacheFile.translations.boards = cacheFile.translations.boards || {};
    cacheFile.translations.lists = cacheFile.translations.lists || {};

    if (type === 'orgs' || type === 'all'){
      trello.get("/1/members/me/organizations", function(err, data) {
        if (err) throw err;
        _.each(data, function(item){
          cacheFile.translations.orgs[item.id] = item.name;
        });

        // Write it back to the cache file
        fs.writeFileSync(cachePath, JSON.stringify(cacheFile));
      });
    }

    if (type === 'lists' || type === 'boards' || type === 'all'){
      trello.get("/1/members/me/boards", function(err, data) {
        if (err) throw err;
        _.each(data, function(item){
          cacheFile.translations.boards[item.id] = [item.idOrganization, item.name]
        });

        // Write it back to the cache file
        fs.writeFileSync(cachePath, JSON.stringify(cacheFile));
      });
    }

    if (type === 'lists' || type === 'all'){
      async.each(Object.keys(cacheFile.translations.boards), function(board, callback){
        trello.get("/1/boards/"+board+"/lists", function(err, data) {
          if (err) throw err;
          _.each(data, function(item){
            cacheFile.translations.lists[item.id] = [item.idBoard, item.name]
          });

          callback();

        });
      }.bind(this), function(err, all){
        // Write it back to the cache file
        fs.writeFileSync(cachePath, JSON.stringify(cacheFile));
      });

      output.normal("Data refreshed");

    }
  });
};
module.exports = __;
