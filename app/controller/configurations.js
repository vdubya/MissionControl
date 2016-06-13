var mongoose = require('mongoose'),

Configuration = mongoose.model('Configuration');

ConfigurationService = {

  findAll : function(req, res){
    Configuration.find({},function(err, results) {
      return res.send(results);
    });
  },

  findById : function(req, res){
    var id = req.params.id;
    Configuration.findOne({'_id':id},function(err, result) {
      return res.send(result);
    });
  },

  findByFilePath : function(req, res){
    var id = req.params.filepath;
    Configuration.find({'files.centralPath':id},function(err, result) {
      return res.send(result);
    });
  },
  
  findByUpdaterId : function(req, res){
    var id = req.params.id;
	var updaterid = req.params.updaterid;
    Configuration.find({'_id':id,'updaters.updaterId':updaterid},function(err, result) {
      return res.send(result);
    });
  },
  
   add : function(req, res) {
    Configuration.create(req.body, function (err, result) {
      if (err) return console.log(err);
      return res.send(result);
    });
  },
  

  update : function(req, res) {
    var id = req.params.id;
    //console.log(req.body);
    console.log('Updating ' + id);
    Configuration.update({"_id":id}, req.body, {upsert:true},
      function (err, numberAffected) {
        if (err) return console.log(err);
        console.log('Updated %s instances', numberAffected.toString());
        return res.sendStatus(202);
    });
  },

  delete : function(req, res){
    var id = req.params.id;
    Configuration.remove({'_id':id},function(result) {
      return res.send(result);
    });
  }

  };

module.exports = ConfigurationService;