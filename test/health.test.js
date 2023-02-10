/* eslint-disable node/no-unpublished-require */
'use strict';

const Lab = require('@hapi/lab');
const {expect} = require('@hapi/code');
const {afterEach, beforeEach, describe, it} = (exports.lab = Lab.script());
const {service, stop} = require('../build/service');

describe('GET /', () => {
  beforeEach(async () => {
    await service.initialize();
  });

  afterEach(async () => {
    await stop();
  });

  it('responds with 200', async () => {
    const res = await service.inject({
      method: 'get',
      url: '/',
    });
    expect(res.statusCode).to.equal(200);
  });
});
