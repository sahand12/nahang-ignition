// Test Requirements
const {expect} = require('chai');
const sinon = require('sinon');
const {join} = require('path');

const initConfig = require('../lib/config');

const sandbox = sinon.sandbox.create();

describe('Config', function () {
  let processCWDStub;

  afterEach(function () {
    sandbox.restore();
  });

  function fixturePath(path) {
    return join(__dirname, 'config-fixtures', path || '');
  }
  
  it('Ignition does NOT have config', function () {
    processCWDStub = sandbox.spy(process, 'cwd');
    const config = initConfig(true);

    expect(processCWDStub.firstCall.returnValue)
      .to.match(/nahang-ignition$/);
    expect(config.get('test')).to.be.undefined;
    expect(config.get('should-be-used')).to.be.undefined;
  });

  it('loads root config when called by root JS file', function () {
    processCWDStub = sandbox.stub(process, 'cwd').returns(fixturePath());
    const config = initConfig(true);

    expect(config.stores.file.file)
      .to.match(/nahang-ignition\/test\/config-fixtures\/config\.development\.json$/);
    expect(config.get('test')).to.equal('root-config');
    expect(config.get('should-be-used')).to.be.true;
  });

  it('loads root config when called from a script in a subdirectory', function () {
    processCWDStub = sandbox.stub(process, 'cwd').returns(fixturePath('scripts'));
    const config = initConfig(true);

    expect(config.stores.file.file).match(/nahang-ignition\/test\/config-fixtures\/config\.development\.json$/);
    expect(config.get('test')).to.equal('root-config');
    expect(config.get('should-be-used')).to.be.true;
  });
});