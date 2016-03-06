'use strict';

module.exports.serial = function (functions, callback) {
    if (functions.length === 0) {
        callback(null, []);
        return;
    }
    var index = 0;
    var next = function (error, data) {
        index++;
        if (error || index === functions.length) {
            callback(error, data);
        } else {
            functions[index](data, next);
        }
    };
    functions[0](next);
};

module.exports.parallel = function (functions, callback) {
    if (functions.length === 0) {
        callback(null, []);
        return;
    }

    var promises = functions.map((func) => {
        return new Promise((resolve, reject) => {
            var next = function (error, data) {
                error ? reject(error) : resolve(data);
            };
            func(next);
        });
    });
    Promise
        .all(promises)
        .then((data) => {
            callback(null, data);
        })
        .catch((error) => {
            callback(error, null);
        });
};

module.exports.map = function (values, func, callback) {
    if (values.length === 0) {
        callback(null, []);
        return;
    }
    var functions = values.map((value) => {
        return function (callback) {
            func(value, callback);
        };
    });
    module.exports.parallel(functions, callback);
};
