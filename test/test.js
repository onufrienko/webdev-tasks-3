'use strict';

const sinon = require('sinon');
const expect = require('chai').expect;
const lib = require('../lib/flow');


describe('Testing flow library', () => {
    describe('Map', () => {
        it('should directly return callback', () => {
            var func = sinon.spy();
            var cb = sinon.spy((err, result) => {
                expect(err).to.be.a('null');
                expect(result).to.be.a('array');
                expect(result.length === 0).is.true;
            });

            lib.map([], func, cb);
            expect(cb).to.be.calledOnce;
            expect(cb.calledWith(null, [])).is.true;
            expect(func.notCalled).is.true;
        });

        it('should return callback if got an error', () => {
            var err = 'Error!';
            var func = sinon.spy((value, next) => {
                next(err, null);
            });
            var cb = sinon.spy((err, result) => {
                expect(result).to.be.a('null');
                expect(err).to.be.deep.equal(err);
            });

            lib.map(['foo, bar'], func, cb);
            expect(cb).to.be.calledOnce;
            expect(func).to.be.calledOnce;
        });

        it('should return correct result', () => {
            var values = [1, 2];
            var func = sinon.spy((value, next) => {
                next(null, value);
            });
            var cb = sinon.spy((err, result) => {
                expect(err).to.be.a('null');
                expect(result).to.be.a('array');
                expect(result.length === 2).is.true;
                expect(result[0] === 1).is.true;
                expect(result[1] === 2);
            });

            lib.map(values, func, cb);
            expect(cb).to.be.calledOnce;
            expect(func.callCount === 2).is.true;
        });
    });
    describe('Parallel', () => {
        it('should directly return callback', () => {
            var cb = sinon.spy((err, result) => {
                expect(err).to.be.a('null');
                expect(result).to.be.a('array');
                expect(result.length === 0).is.true;
            });

            lib.parallel([], cb);
            expect(cb).to.be.calledOnce;
        });

        it('should call functions parallely', () => {
            var func1 = sinon.spy((next) => {
                setTimeout(next(null, 1), 2500);
            });
            var func2 = sinon.spy((next) => {
                setTimeout(next(null, 2), 2500);
            });
            var cb = sinon.spy((err, result) => {
                expect(Date.now() - startTime).to.be.below(3000);
            });
            var startTime = Date.now();
            lib.parallel([func1, func2], cb);
        });

        it('should call functions only once and return a correct result', () => {
            var func1 = sinon.spy((next) => {
                next(null, 1);
            });
            var func2 = sinon.spy((next) => {
                next(null, 2);
            });
            var cb = sinon.spy((err, result) => {
                expect(err).to.be.a('null');
                expect(result).to.deep.equal([1, 2]);
            });

            lib.parallel([func1, func2], cb);
            expect(func1).to.be.calledOnce;
            expect(func2).to.be.calledOnce;
            expect(cb).to.be.calledOnce;
        });
    });
    describe('Serial', () => {
        it('should directly return callback', () => {
            var cb = sinon.spy((err, result) => {
                expect(err).to.be.a('null');
                expect(result).to.be.a('array');
                expect(result.length === 0).is.true;
            });

            lib.serial([], cb);
            expect(cb).to.be.calledOnce;
            expect(cb.calledWith(null, [])).is.true;
        });

        it('should call functions serially and return a correct result', () => {
            var func1 = sinon.spy((next) => {
                next(null, 1);
            });
            var func2 = sinon.spy((data, next) => {
                next(null, 2 * data);
            });
            var func3 = sinon.spy((data, next) => {
                next(null, data + 3);
            });
            var cb = sinon.spy((err, result) => {});

            lib.serial([func1, func2, func3], cb);
            expect(cb).to.be.calledOnce;
            expect(cb.calledWith(null, 5)).is.true;
            expect(func1).to.be.calledOnce;
            expect(func2).to.be.calledOnce;
            expect(func2.calledAfter(func1)).is.true;
        });

        it('should return callback if got an error', () => {
            var err = 'Error!';
            var func1 = sinon.spy((next) => {
                next(err, 1);
            });
            var func2 = sinon.spy((data, next) => {
                next(null, 2);
            });
            var cb = sinon.spy((err, result) => {});

            lib.serial([func1, func2], cb);
            expect(cb).to.be.calledOnce;
            expect(cb.calledWith(err, 1)).is.true;
            expect(func1).to.be.calledOnce;
            expect(func2).not.to.be.calledOnce;
        });
    });
});
