const { assert } = require('chai');
const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const CertificateRegistryV2 = artifacts.require('CertificateRegistryV2');

contract('Contract migrations — proxy deployment', (accounts) => {
  const admin = accounts[0];

  it('should deploy proxy via deployProxy and initialize roles', async () => {
    const instance = await deployProxy(CertificateRegistryV2, [admin], {
      initializer: 'initialize'
    });

    const DEFAULT_ADMIN_ROLE = await instance.DEFAULT_ADMIN_ROLE();
    const ADMIN_ROLE = await instance.ADMIN_ROLE();
    const ISSUER_ROLE = await instance.ISSUER_ROLE();

    assert.isTrue(await instance.hasRole(DEFAULT_ADMIN_ROLE, admin));
    assert.isTrue(await instance.hasRole(ADMIN_ROLE, admin));
    assert.isFalse(await instance.paused());

    await instance.grantRole(ISSUER_ROLE, admin, { from: admin });
    await instance.registerIssuer('Migration Test U', 'migration.test', { from: admin });

    const issuer = await instance.getIssuer(admin);
    assert.strictEqual(issuer.name, 'Migration Test U');
    assert.isTrue(issuer.active);
  });
});
