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

module.exports.makeAsync = function (func) {
    return function () {
        var args = [].slice.call(arguments);
        var syncFunc = args[args.length - 1];
        var data = args.slice(0, args.length - 1);

        var promise = new Promise((resolve) => {
            setTimeout(() => {
                resolve(func.apply(func, data));
            }, 0);
        });
        promise
            .then((result) => {
                syncFunc(null, result);
            })
            .catch((error) => {
                syncFunc(error, null);
            });
    };
};

module.exports.limitParallel = function (functions, limit, callback) {
    var count = functions.length;
    if (limit <= 0 || count === 0) {
        callback(null, []);
        return;
    }
    if (arguments.length === 2 || limit >= count) {
        module.exports.parallel(functions, callback);
        return;
    }

    var currentFunc = 0;
    var runningCount = 0;
    var error = null;
    var results = [];

    var runFunction = () => {
        while (currentFunc < count && runningCount < limit) {
            functions[currentFunc](next(currentFunc++));
            runningCount++;
        }
    };

    var next = () => {
        return (err, data) => {
            if (!err) {
                results.push(data);
                runningCount--;
            } else {
                //callback(err, null);
                error = err;
            }
            currentFunc === count ?
                callback(error, results) : runFunction();
        };
    };

    runFunction();
};
