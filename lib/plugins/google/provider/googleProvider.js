'use strict';

const BbPromise = require('bluebird');
const _ = require('lodash');
const google = require('googleapis');

const constants = {
  providerName: 'google',
};

class GoogleProvider {
  static getProviderName() {
    return constants.providerName;
  }

  constructor(serverless) {
    this.serverless = serverless;
    this.provider = this; // only load plugin in a Google service context
    this.serverless.setProvider(constants.providerName, this);
  }

  request(service, namespace, method, params) {
    const key = require(this.serverless.service.provider.credentials); //eslint-disable-line

    this.authClient = new google.auth.JWT(
      key.client_email,
      null,
      key.private_key,
      ['https://www.googleapis.com/auth/cloud-platform'],
      null
    );

    this.sdk = {
      deploymentmanager: google.deploymentmanager('v2'),
      storage: google.storage('v1'),
    };

    return new BbPromise((resolve, reject) => {
      if (!Object.keys(this.sdk).includes(service)) {
        const errorMessage = [
          'Unsupported service... ',
          `Supported services are: ${Object.keys(this.sdk).join(',')}`,
        ].join('');

        reject(new this.serverless.classes.Error(errorMessage));
      }

      this.authClient.authorize(() => {
        const auth = this.authClient;
        const requestParams = {
          auth,
          project: this.serverless.service.provider.project, // automagically reference the project
        };

        // merge the params from the request call into the base functionParams
        _.merge(requestParams, params);

        this.sdk[service][namespace][method](requestParams, (error, response) => {
          if (error) reject(new this.serverless.classes.Error(error));
          return resolve(response);
        });
      });
    });
  }
}

module.exports = GoogleProvider;
