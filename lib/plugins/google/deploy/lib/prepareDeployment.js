'use strict';

const path = require('path');
const _ = require('lodash');

const BbPromise = require('bluebird');

module.exports = {
  prepareDeployment() {
    let deploymentTemplate = this.serverless.service.provider.compiledConfigurationTemplate;

    deploymentTemplate = this.serverless.utils.readFileSync(
      path.join(
        __dirname,
        '..',
        'templates',
        'core-configuration-template.yml')
    );

    const bucket = deploymentTemplate.resources.find(this.findDeploymentBucket);
    const name = `sls-${this.serverless.service.service}-${this.options.stage}`;
    const updatedBucket = this.updateBucketName(bucket, name);

    const bucketIndex = deploymentTemplate.resources.findIndex(this.findDeploymentBucket);

    deploymentTemplate.resources[bucketIndex] = updatedBucket;

    this.serverless.service.provider.compiledConfigurationTemplate = deploymentTemplate;

    return BbPromise.resolve();
  },

  // helper methods
  updateBucketName(bucket, name) {
    const newBucket = _.cloneDeep(bucket);
    newBucket.name = name;
    return newBucket;
  },

  findDeploymentBucket(resource) {
    const type = 'storage.v1.bucket';
    const name = 'will-be-replaced-by-serverless';

    return resource.type === type && resource.name === name;
  },
};
