'use strict';

const path = require('path');

const BbPromise = require('bluebird');

module.exports = {
  compileFunctions() {
    const artifactFilePath = this.serverless.service.package.artifact;
    const fileName = artifactFilePath.split(path.sep).pop();

    this.serverless.service.package
      .artifactFilePath = `${this.serverless.service.package.artifactDirectoryName}/${fileName}`;

    this.serverless.service.getAllFunctions().forEach((functionName) => {
      const funcObject = this.serverless.service.getFunction(functionName);

      this.serverless.cli
        .log(`Compiling function "${functionName}"...`);

      if (!funcObject.events) {
        const errorMessage = [
          `Missing "event" property for function "${functionName}".`,
          ' Your function needs at least one "event".',
          ' Please check the docs for more info.',
        ].join('');
        throw new this.serverless.classes.Error(errorMessage);
      }
      if (funcObject.events.length > 1) {
        const errorMessage = [
          `The function "${functionName}" has more than one event.`,
          ' Only one event per function is supported.',
          ' Please check the docs for more info.',
        ].join('');
        throw new this.serverless.classes.Error(errorMessage);
      }

      const eventType = Object.keys(funcObject.events[0])[0];

      const funcTemplate = {
        type: 'cloudfunctions.v1beta2.function',
        name: functionName,
        properties: {
          location: this.options.region,
          function: funcObject.handler,
          sourceArchiveUrl: `gs://sls-${
            this.serverless.service.service
          }-${this.options.stage}/${this.serverless.service.package.artifactFilePath}`,
        },
      };

      if (eventType === 'http') {
        funcTemplate.properties.httpsTrigger = {
          url: funcObject.events[0].http,
        };
      }

      this.serverless.service.provider.compiledConfigurationTemplate.resources.push(funcTemplate);
    });

    return BbPromise.resolve();
  },
};
