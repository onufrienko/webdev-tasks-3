'use strict';

const lib = require('../lib/flow');
const mock = require('mock-fs');
const fs = require('fs');
const expect = require('chai').expect;
const sinon = require('sinon');

var err = 'fatal error';
var directory = './cats/';

describe('Testing flow library', () => {
    before(() => {
        mock({
            './cats': {
                'barsik.json': JSON.stringify({
                    name: 'barsik',
                    price: 5000
                }),
                'batonchik.json': JSON.stringify({
                    name: 'batonchik',
                    price: 99000
                }),
                'murzic.json': JSON.stringify({
                    name: 'murzik',
                    price: 7000
                }),
                'graf.json': ''
            }
        });
    });
    describe('Serial', () => {
        it('should call functions serially', (done) => {
            lib.serial([
                function (next) {
                    fs.readdir(directory, (error, data) => {
                        next(error, data);
                    });
                },
                function (data, next) {
                    next(null, data.length);
                }
            ], function (error, result) {
                expect(typeof result).to.be.equal('number');
                expect(result).to.be.equal(4);
                expect(error).to.be.equal(null);
                done();
            });
        });
        it('should not call second function if first function got an error', (done) => {
            var secFunc = sinon.spy((data, next) => {
                next(null, 'hola');
            });
            lib.serial([
                function (next) {
                    next(err, null);
                },
                secFunc
            ], (error, result) => {
                expect(secFunc).not.to.be.called;
                expect(error).to.be.deep.equal(err);
                expect(result).to.be.equal(null);
                done();
            });
        });
        it('should return callback if got no functions', (done) => {
            lib.serial([], (error, result) => {
                expect(error).to.be.equal(null);
                expect(result)
                    .to.be.a('array')
                    .and.to.have.lengthOf(0);
                done();
            });
        });
    });
    describe('Parallel', () => {
        it('should run functions concurrently', (done) => {
            var delay = 300;
            var limit = delay + 200;
            var startTime = Date.now();
            lib.parallel([
                function (next) {
                    fs.readFile('./cats/barsik.json', (error, data) => {
                        var parsedData = JSON.parse(data);
                        setTimeout(() => {
                            next(null, parsedData.name);
                        }, delay);
                    });
                },
                function (next) {
                    fs.readFile('./cats/batonchik.json', (error, data) => {
                        var parsedData = JSON.parse(data);
                        setTimeout(() => {
                            next(null, parsedData.name);
                        }, delay);
                    });
                }
            ], (error, result) => {
                expect(Date.now() - startTime)
                    .to.be.below(limit)
                    .and.to.be.above(delay);
                done();
            });
        });
        it('should return correct result', (done) => {
            lib.parallel([
                function (next) {
                    fs.readFile('./cats/barsik.json', (error, data) => {
                        next(null, JSON.parse(data).price);
                    });
                },
                function (next) {
                    fs.readFile('./cats/batonchik.json', (error, data) => {
                        next(null, JSON.parse(data).price);
                    });
                }
            ], (error, result) => {
                expect(error).to.be.equal(null);
                expect(result)
                    .to.be.a('array')
                    .and.to.have.members([99000, 5000]);
                done();
            });
        });
        it('should return error if any function got an error', (done) => {
            lib.parallel([
                function (next) {
                    fs.readFile('./cats/barsik.json', (error, data) => {
                        next(error, data);
                    });
                },
                function (next) {
                    next(err, null);
                }
            ], (error, result) => {
                expect(error).to.be.deep.equal(err);
                expect(result).to.be.equal(null);
                done();
            });
        });
        it('should return callback if got no functions', (done) => {
            lib.parallel([], (error, result) => {
                expect(error).to.be.equal(null);
                expect(result)
                    .to.be.a('array')
                    .and.to.have.lengthOf(0);
                done();
            });
        });
    });
    describe('Map', () => {
        it('should return callback if got no values', (done) => {
            var func = sinon.spy(() => {});
            lib.map([], func, (error, result) => {
                expect(error).to.be.equal(null);
                expect(result)
                    .to.be.a('array')
                    .and.to.have.lengthOf(0);
                done();
            });
        });
        it('should return correct result', (done) => {
            var files = fs.readdirSync(directory);
            var func = function (name, next) {
                var fileName = directory + name;
                fs.readFile(fileName, (error, data) => {
                    data.length != 0 ?
                        next(null, JSON.parse(data).name) : next(null, '');
                });
            };
            lib.map(files, func, (error, result) => {
                expect(error).to.be.equal(null);
                expect(result)
                    .to.be.a('array')
                    .and.to.have.lengthOf(4)
                    .and.to.have.members(['barsik', 'batonchik', '', 'murzik']);
                done();
            });
        });
        it('should call function 4 times', (done) => {
            var files = fs.readdirSync(directory);
            var func = sinon.spy((name, next) => {
                var fileName = directory + name;
                fs.readFile(fileName, (error, data) => {
                    next(null, String(data));
                });
            });
            lib.map(files, func, (error, result) => {
                expect(func.callCount === files.length).is.true;
                done();
            });
        });
        it('should return error if got an error', (done) => {
            var func = sinon.spy((value, next) => {
                next(err, null);
            });
            lib.map([1, 2, 3], func, (error, result) => {
                expect(error).to.be.deep.equal(err);
                expect(result).to.be.equal(null);
                done();
            });
        });
    });
    after(() => {
        mock.restore();
    });
});
