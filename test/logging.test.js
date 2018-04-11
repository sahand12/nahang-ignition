/* eslint no-unused-vars: 0 */
const PrettyStream = require('../lib/logging/PrettyStream');
const Logger = require('../lib/logging/Logger');
const colors = require('colors/safe');
const {inspect} = require('util');
const {Writable} = require('stream');
const sinon = require('sinon');
const should = require('should');
const Bunyan2Loggly = require('bunyan-loggly');
const errors = require('../lib/errors');

const sandbox = sinon.sandbox.create();

describe('Logging', () => {
  afterEach(() => sandbox.restore());

  // in Bunyan 1.8.3 they have changed this behavior
  // The are trying to find the err.message attribute and forward this
  // as msg property. Our PrettyStream implementation can't handle this case.
  it('ensure stdout write properties', done => {
    sandbox
      .stub(PrettyStream.prototype, 'write')
      .callsFake(data => {
        should.exist(data.req);
        should.exist(data.res);
        should.exist(data.err);
        data.msg.should.eql('message');
        done();
      });

    const logger = new Logger({});
    logger.info({
      err: new Error('message'),
      req: {body: {}},
      res: {headers: {}}
    });
  });

  it('removes sensitive data', done => {
    sandbox
      .stub(PrettyStream.prototype, 'write')
      .callsFake(data => {
        should.not.exist(data.req.body.password);
        should.not.exist(data.req.body.data.attributes.pin);
        should.exist(data.req.body.data.attributes.test);
        should.exist(data.err);
        should.exist(data.err.errorDetails);
        done();
      });

    const logger = new Logger({});

    logger.error({
      err: new errors.IncorrectUsageError({
        message: 'Hallo',
        errorDetails: [],
      }),
      req: {
        body: {
          password: '123432553',
          data: {
            attributes: {
              pin: '1234',
              test: 'js'
            }
          }
        }
      },
      res: {
        headers: {}
      },
    });
  });

  it('loggly does only stream certain errors', done => {
    sandbox
      .stub(Bunyan2Loggly.prototype, 'write')
      .callsFake(data => {
        should.exist(data.err);
        done();
      });

    const logger = new Logger({
      transports: ['loggly'],
      loggly: {
        token: 'invalid',
        subdomain: 'invalid',
        match: 'level:critical',
      },
    });

    logger.error(new errors.InternalServerError());
    Bunyan2Loggly.prototype.write.called.should.eql(true);
  });

  it('loggly does only stream certain errors', () => {
    sandbox.spy(Bunyan2Loggly.prototype, 'write');

    const logger = new Logger({
      transports: ['loggly'],
      loggly: {
        token: 'invalid',
        subdomain: 'invalid',
        match: 'level:critical',
      },
    });

    logger.error(new errors.NotFoundError());
    Bunyan2Loggly.prototype.write.called.should.eql(false);
  });

  it('loggly does only stream certain errors', () => {
    sandbox.spy(Bunyan2Loggly.prototype, 'write');

    const logger = new Logger({
      transports: ['loggly'],
      loggly: {
        token: 'invalid',
        subdomain: 'invalid',
        match: '^((?!statusCode:4\\d{2}).)*$',
      },
    });

    logger.error(new errors.NotFoundError());
    Bunyan2Loggly.prototype.write.called.should.eql(false);
  });

  it('loggly does only stream certain errors', () => {
    sandbox.spy(Bunyan2Loggly.prototype, 'write');

    const logger = new Logger({
      transports: ['loggly'],
      loggly: {
        token: 'invalid',
        subdomain: 'invalid',
        match: '^((?!statusCode:4\\d{2}).)*$',
      },
    });

    logger.error(new errors.NoPermissionError());
    Bunyan2Loggly.prototype.write.called.should.eql(false);
  });

  it('loggly does only stream certain errors', () => {
    sandbox.spy(Bunyan2Loggly.prototype, 'write');

    const logger = new Logger({
      transports: ['loggly'],
      loggly: {
        token: 'invalid',
        subdomain: 'invalid',
        match: '^((?!statusCode:4\\d{2}).)*$',
      },
    });

    logger.error(new errors.InternalServerError());
    Bunyan2Loggly.prototype.write.called.should.eql(true);
  });

  it('loggly does only stream certain errors', done => {
    sandbox
      .stub(Bunyan2Loggly.prototype, 'write')
      .callsFake(data => {
        should.exist(data.err);
        done();
      });

    const logger = new Logger({
      transports: ['loggly'],
      loggly: {
        token: 'invalid',
        subdomain: 'invalid',
        match: 'level:normal'
      },
    });

    logger.error(new errors.NotFoundError());
    Bunyan2Loggly.prototype.write.called.should.eql(true);
  });

  it('loggly does only stream certain errors', done => {
    sandbox.
      stub(Bunyan2Loggly.prototype, 'write')
      .callsFake(data => {
        should.exist(data.err);
        done();
      });

    const logger = new Logger({
      transports: ['loggly'],
      loggly: {
        token: 'invalid',
        subdomain: 'invalid',
        match: 'level:critical|statusCode:404',
      },
    });

    logger.error(new errors.NotFoundError());
    Bunyan2Loggly.prototype.write.called.should.eql(true);
  });

  it('loggly does only stream certain errors', done => {
    sandbox
      .stub(Bunyan2Loggly.prototype, 'write')
      .callsFake(data => {
        should.exist(data.err);
        should.exist(data.req);
        should.exist(data.res);
        done();
      });

    const logger = new Logger({
      transports: ['loggly'],
      loggly: {
        token: 'invalid',
        subdomain: 'invalid',
        match: 'statusCode:404',
      },
    });

    logger.error({
      err: new errors.NotFoundError(),
      req: {body: {password: '12314234', data: {attributes: {pin: '1234', test: 'ja'}}}},
      res: {headers: {}},
    });
    Bunyan2Loggly.prototype.write.called.should.eql(true);
  });

  it('loggly does only stream certain errors: match is not defined => log everything', done => {
    sandbox
      .stub(Bunyan2Loggly.prototype, 'write')
      .callsFake(data => {
        should.exist(data.err);
        done();
      });

    const logger = new Logger({
      transports: ['loggly'],
      loggly: {
        token: 'invalid',
        subdomain: 'invalid',
      },
    });

    logger.error(new errors.NotFoundError);
    Bunyan2Loggly.prototype.write.called.should.eql(true);
  });

  it('automatically adds stdout to transports if stderr transport is configured and stdout isn\'t', () => {
    const logger = new Logger({
      transports: ['stderr'],
    });

    should.equal(logger.transports.includes('stderr'), true, 'stderr transport should exist');
    should.equal(logger.transports.includes('stdout'), true, 'stdout transport should exist');
  });

  it('logs errors only to stderr if both stdout and stderr transports are defined', () => {
    const stderr = sandbox.spy(process.stderr, 'write');
    const stdout = sandbox.spy(process.stdout, 'write');

    const logger = new Logger({
      transports: ['stdout', 'stderr'],
    });

    logger.error('some error');
    stderr.calledOnce.should.be.true();
    stdout.called.should.be.false('stdout should not be written to');
  });

  describe('PrettyStream', () => {
    describe('short mode', () => {
      it('data.msg', done => {
        const prettyStream = new PrettyStream(({mode: 'short'}));
        const writeStream = new Writable();

        writeStream._write = function(data) {
          data = data.toString();
          data.should.eql('[2016-07-01 00:00:00] \u001b[36mINFO\u001b[39m Nahang starts now.\n');
          done();
        };

        prettyStream.pipe(writeStream);

        prettyStream.write(JSON.stringify({
          time: '2016-07-01 00:00:00',
          level: 30,
          msg: 'Nahang starts now.'
        }));
      });

      it('data.err', done => {
        const prettyStream = new PrettyStream({mode: 'short'});
        const writeStream = new Writable();

        writeStream._write = function(data) {
          data = data.toString();
          data.should.eql('[2016-07-01 00:00:00] \u001b[31mERROR\u001b[39m\n\u001b[31m\n\u001b[31mCODE: HEY_JUDE\u001b[39m\n\u001b[31mMESSAGE: Hey Jude!\u001b[39m\n\n\u001b[37mstack\u001b[39m\n\u001b[39m\n');
          done();
        };

        prettyStream.pipe(writeStream);

        prettyStream.write(JSON.stringify({
          time: '2016-07-01 00:00:00',
          level: 50,
          msg: 'message',
          err: {
            message: 'Hey Jude!',
            stack: 'stack',
            code: 'HEY_JUDE',
          },
        }));
      });

      it('data.req && data.res', done => {
        const prettyStream = new PrettyStream({mode: 'short'});
        const writeStream = new Writable();

        writeStream._write = function(data) {
          data = data.toString();
          data.should.eql('\u001b[36mINFO\u001b[39m [2016-07-01 00:00:00] "GET /test" \u001b[32m200\u001b[39m 39ms\n');
          done();
        };

        prettyStream.pipe(writeStream);

        prettyStream.write(JSON.stringify({
          time: '2016-07-01 00:00:00',
          level: 30,
          req: {
            originalUrl: '/test',
            method: 'GET',
            body: {
              a: 'b',
            },
          },
          res: {
            statusCode: 200,
            responseTime: '39ms',
          },
        }));
      });

      it('data.req && data.res && data.err', done => {
        const prettyStream = new PrettyStream({mode: 'short'});
        const writeStream = new Writable();

        writeStream._write = function(data) {
          data = data.toString();
          data.should.eql('\u001b[31mERROR\u001b[39m [2016-07-01 00:00:00] "GET /test" \u001b[33m400\u001b[39m 39ms\n\u001b[31m\n\u001b[31mMESSAGE: message\u001b[39m\n\n\u001b[37mstack\u001b[39m\n\u001b[39m\n');
          done();
        };

        prettyStream.pipe(writeStream);

        prettyStream.write(JSON.stringify({
          time: '2016-07-01 00:00:00',
          level: 50,
          req: {
            originalUrl: '/test',
            method: 'GET',
            body: {
              a: 'b',
            },
          },
          res: {
            statusCode: 400,
            responseTime: '39ms',
          },
          err: {
            message: 'message',
            stack: 'stack',
          }
        }));
      });
    });

    describe('long mode', () => {
      it('data.msg', done => {
        const prettyStream = new PrettyStream(({mode: 'long'}));
        const writeStream = new Writable();

        writeStream._write = function(data) {
          data = data.toString();
          data.should.eql('[2016-07-01 00:00:00] \u001b[36mINFO\u001b[39m Nahang starts now.\n');
          done();
        };

        prettyStream.pipe(writeStream);

        prettyStream.write(JSON.stringify({
          time: '2016-07-01 00:00:00',
          level: 30,
          msg: 'Nahang starts now.'
        }));
      });

      it('data.err', done => {
        const prettyStream = new PrettyStream({mode: 'long'});
        const writeStream = new Writable();

        writeStream._write = function(data) {
          data = data.toString();
          data.should.eql('[2016-07-01 00:00:00] \u001b[31mERROR\u001b[39m\n\u001b[31m\n\u001b[31mMESSAGE: Hey Jude!\u001b[39m\n\n\u001b[37mstack\u001b[39m\n\u001b[39m\n\u001b[90m\u001b[39m\n');
          done();
        };

        prettyStream.pipe(writeStream);

        prettyStream.write(JSON.stringify({
          time: '2016-07-01 00:00:00',
          level: 50,
          err: {
            message: 'Hey Jude!',
            stack: 'stack',
          },
        }));
      });

      it('data.req && data.res', done => {
        const prettyStream = new PrettyStream({mode: 'long'});
        const writeStream = new Writable();

        writeStream._write = function(data) {
          data = data.toString();
          data.should.eql('\u001b[36mINFO\u001b[39m [2016-07-01 00:00:00] "GET /test" \u001b[32m200\u001b[39m 39ms\n\u001b[90m\n\u001b[33mREQ\u001b[39m\n\u001b[32mip: \u001b[39m         127.0.0.1\n\u001b[32moriginalUrl: \u001b[39m/test\n\u001b[32mmethod: \u001b[39m     GET\n\u001b[32mbody: \u001b[39m\n  \u001b[32ma: \u001b[39mb\n\n\u001b[33mRES\u001b[39m\n\u001b[32mresponseTime: \u001b[39m39ms\n\u001b[39m\n');
          done();
        };

        prettyStream.pipe(writeStream);

        prettyStream.write(JSON.stringify({
          time: '2016-07-01 00:00:00',
          level: 30,
          req: {
            ip: '127.0.0.1',
            originalUrl: '/test',
            method: 'GET',
            body: {
              a: 'b',
            },
          },
          res: {
            statusCode: 200,
            responseTime: '39ms',
          },
        }));
      });

      it('data.req && data.res && data.err', done => {
        const prettyStream = new PrettyStream({mode: 'long'});
        const writeStream = new Writable();

        writeStream._write = function(data) {
          data = data.toString();
          data.should.eql('\u001b[31mERROR\u001b[39m [2016-07-01 00:00:00] "GET /test" \u001b[33m400\u001b[39m 39ms\n\u001b[31m\n\u001b[31mMESSAGE: Hey Jude!\u001b[39m\n\n\u001b[37mstack\u001b[39m\n\u001b[39m\n\u001b[90m\n\u001b[33mREQ\u001b[39m\n\u001b[32moriginalUrl: \u001b[39m/test\n\u001b[32mmethod: \u001b[39m     GET\n\u001b[32mbody: \u001b[39m\n  \u001b[32ma: \u001b[39mb\n\n\u001b[33mRES\u001b[39m\n\u001b[32mresponseTime: \u001b[39m39ms\n\u001b[39m\n');
          done();
        };

        prettyStream.pipe(writeStream);

        prettyStream.write(JSON.stringify({
          time: '2016-07-01 00:00:00',
          level: 50,
          req: {
            originalUrl: '/test',
            method: 'GET',
            body: {
              a: 'b',
            },
          },
          res: {
            statusCode: 400,
            responseTime: '39ms',
          },
          err: {
            message: 'Hey Jude!',
            stack: 'stack',
          }
        }));
      });

      it('data.err contains error details', done => {
        const prettyStream = new PrettyStream({mode: 'long'});
        const writeStream = new Writable();

        writeStream._write = data => {
          data = data.toString();
          data.should.eql('[2016-07-01 00:00:00] \u001b[31mERROR\u001b[39m\n\u001b[31m\n\u001b[31mMESSAGE: Hey Jude!\u001b[39m\n\n\u001b[31mERROR DETAILS:\n    level:    error\n    rule:     Templates must contain valid Handlebars.\n    failures: \n      - \n        ref:     default.hbs\n        message: Missing helper: "image"\n    code:     NG005-TPL-ERR\u001b[39m\n\n\u001b[37mstack\u001b[39m\n\u001b[39m\n\u001b[90m\u001b[39m\n');
          done();
        };

        prettyStream.pipe(writeStream);

        prettyStream.write(JSON.stringify({
          time: '2016-07-01 00:00:00',
          level: 50,
          err: {
            message: 'Hey Jude!',
            stack: 'stack',
            errorDetails: [{
              level: 'error',
              rule: 'Templates must contain valid Handlebars.',
              failures: [{
                ref: 'default.hbs',
                message: 'Missing helper: "image"'
              }],
              code: 'NG005-TPL-ERR'
            }],
          },
        }));
      });
    });
  });


});