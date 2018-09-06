/**
 * Created by konrad.sobon on 2018-09-06.
 */
var mongoose = require('mongoose');
var OpenTimes = mongoose.model('OpenTimes');

module.exports = {
    /**
     *
     * @param req
     * @param res
     */
    add: function(req, res){
        OpenTimes
            .create(req.body, function (err, response){
                var result = {
                    status: 201,
                    message: response
                };
                if (err){
                    result.status = 500;
                    result.message = err;
                } else if (!response){
                    result.status = 404;
                    result.message = err;
                }
                res.status(result.status).json(result.message);
            })
    },

    /**
     *
     * @param req
     * @param res
     */
    getAll: function(req, res) {
        OpenTimes
            .find({'centralPath': {$in: req.body}}, function (err, response) {
                var result = {
                    status: 201,
                    message: response
                };
                if (err) {
                    result.status = 500;
                    result.message = err;
                } else if (!response) {
                    result.status = 404;
                    result.message = err;
                }
                res.status(result.status).json(result.message);
            })
    },

    /**
     *
     * @param req
     * @param res
     */
    getByDate: function(req, res) {
        var from = new Date(req.body.from);
        var to = new Date(req.body.to);
        OpenTimes
            .find({
                'centralPath': {$in: req.body.centralPaths},
                'createdOn': {$gte: from, $lte: to}}, function (err, response) {
                    var result = {
                        status: 201,
                        message: response
                    };
                    if (err) {
                        result.status = 500;
                        result.message = err;
                    } else if (!response) {
                        result.status = 404;
                        result.message = err;
                    }
                    res.status(result.status).json(result.message);
            })
    }
};