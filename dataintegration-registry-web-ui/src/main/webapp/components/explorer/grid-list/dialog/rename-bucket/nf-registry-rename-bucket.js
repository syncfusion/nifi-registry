/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var ngRouter = require('@angular/router');
var rxjs = require('rxjs/Observable');
var fdsSnackBarsModule = require('@fluid-design-system/snackbars');
var ngCore = require('@angular/core');
var NfRegistryService = require('nifi-registry/services/nf-registry.service.js');
var ngRouter = require('@angular/router');
var NfRegistryApi = require('nifi-registry/services/nf-registry.api.js');
var ngMaterial = require('@angular/material');
/**
 * NfRegistryRenameBucket constructor.
 *
 * @param nfRegistryApi         The api service.
 * @param fdsSnackBarService    The FDS snack bar service module.
 * @param nfRegistryService     The nf-registry.service module.
 * @param matDialogRef          The angular material dialog ref.
 * @constructor
 */
function NfRegistryRenameBucket(nfRegistryApi, fdsSnackBarService, nfRegistryService,activatedRoute, router, matDialogRef) {
    // Services
    this.snackBarService = fdsSnackBarService;
    this.nfRegistryService = nfRegistryService;
    this.nfRegistryApi = nfRegistryApi;
    this.dialogRef = matDialogRef;
    this.route = activatedRoute;
    this.router = router;
    this._bucketname = '';
    // local state
    this.keepDialogOpen = false;
};

NfRegistryRenameBucket.prototype = {
    constructor: NfRegistryRenameBucket,


    /**
     * Initialize the component.
     */
    ngOnInit: function () {
        var self = this;
            this.$subscription = this.route.params
            .switchMap(function (params) {
                return new rxjs.Observable.forkJoin(
                    self.nfRegistryApi.getBucket(self.nfRegistryService.bucket.identifier),
                    self.nfRegistryApi.getPolicies()
                );
            })
            .subscribe(function (response) {
                self.nfRegistryService.bucket = response[0];
                self._bucketname = response[0].name;
            });
    },
     /**
     * Update bucket name.
     *
     * @param username
     */
    updateBucketName: function (bucketname) {
        var self = this;
        this.nfRegistryApi.updateBucket(this.nfRegistryService.bucket.identifier, bucketname).subscribe(function (response) {
            if (!response.status || response.status === 200) {
                self.nfRegistryService.bucket = response;
                // update the bucket identity in the buckets table
                self.nfRegistryService.buckets.filter(function (bucket) {
                    if (self.nfRegistryService.bucket.identifier === bucket.identifier) {
                        bucket.name = response.name;
                    }
                });
                var snackBarRef = self.snackBarService.openCoaster({
                    title: 'Success',
                    message: 'This bucket name has been updated.',
                    verticalPosition: 'bottom',
                    horizontalPosition: 'right',
                    icon: 'success-toaster-icon',
                    color: '#1EB475',
                    duration: 3000
                });
                self.dialogRef.close();
            } else if (response.status === 409) {
                self._bucketname = self.nfRegistryService.bucket.name;
                self.dialogService.openConfirm({
                    title: 'Error',
                    message: 'This bucket already exists. Please enter a different identity/bucket name.',
                    acceptButton: 'Ok',
                    acceptButtonColor: 'fds-warn'
                });
            } else if (response.status === 400) {
                self._bucketname = self.nfRegistryService.bucket.name;
                self.dialogService.openConfirm({
                    title: 'Error',
                    message: response.error,
                    acceptButton: 'Ok',
                    acceptButtonColor: 'fds-warn'
                });
            }
        });
    },

    /**
     * Cancel creation of a new bucket and close dialog.
     */
    cancel: function () {
        this.dialogRef.close();
    }
};

NfRegistryRenameBucket.annotations = [
    new ngCore.Component({
        template: require('./nf-registry-rename-bucket.html!text')
    })
];

NfRegistryRenameBucket.parameters = [
    NfRegistryApi,
    fdsSnackBarsModule.FdsSnackBarService,
    NfRegistryService,
    ngRouter.ActivatedRoute,
    ngRouter.Router,
    ngMaterial.MatDialogRef
];

module.exports = NfRegistryRenameBucket;
