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

var ngCore = require('@angular/core');
var $ = require('jquery');
var ngMoment = require('angular2-moment');
var NfRegistryRoutes = require('nifi-registry/nf-registry.routes.js');
var NfRegistry = require('nifi-registry/nf-registry.js');
var NfRegistryApi = require('nifi-registry/services/nf-registry.api.js');
var NfRegistryService = require('nifi-registry/services/nf-registry.service.js');
var NfPageNotFoundComponent = require('nifi-registry/components/page-not-found/nf-registry-page-not-found.js');
var NfLoginComponent = require('nifi-registry/components/login/nf-registry-login.js');
var NfUserLoginComponent = require('nifi-registry/components/login/dialogs/nf-registry-user-login.js');
var NfRegistryExplorer = require('nifi-registry/components/explorer/nf-registry-explorer.js');
var NfRegistryAdministration = require('nifi-registry/components/administration/nf-registry-administration.js');
var NfRegistryUsersAdministration = require('nifi-registry/components/administration/users/nf-registry-users-administration.js');
var NfRegistryAddUser = require('nifi-registry/components/administration/users/dialogs/add-user/nf-registry-add-user.js');
var NfRegistryCreateNewGroup = require('nifi-registry/components/administration/users/dialogs/create-new-group/nf-registry-create-new-group.js');
var NfRegistryEditBucketPolicy = require('nifi-registry/components/administration/workflow/dialogs/edit-bucket-policy/nf-registry-edit-bucket-policy.js');
var NfRegistryAddPolicyToBucket = require('nifi-registry/components/administration/workflow/dialogs/add-policy-to-bucket/nf-registry-add-policy-to-bucket.js');
var NfRegistryAddUserToGroups = require('nifi-registry/components/administration/users/dialogs/add-user-to-groups/nf-registry-add-user-to-groups.js');
var NfRegistryAddUsersToGroup = require('nifi-registry/components/administration/users/dialogs/add-users-to-group/nf-registry-add-users-to-group.js');
var NfRegistryManageUser = require('nifi-registry/components/administration/users/sidenav/manage-user/nf-registry-manage-user.js');
var NfRegistryManageGroup = require('nifi-registry/components/administration/users/sidenav/manage-group/nf-registry-manage-group.js');
var NfRegistryManageBucket = require('nifi-registry/components/administration/workflow/sidenav/manage-bucket/nf-registry-manage-bucket.js');
var NfRegistryWorkflowAdministration = require('nifi-registry/components/administration/workflow/nf-registry-workflow-administration.js');
var NfRegistryCreateBucket = require('nifi-registry/components/administration/workflow/dialogs/create-bucket/nf-registry-create-bucket.js');
var NfRegistryGridListViewer = require('nifi-registry/components/explorer/grid-list/registry/nf-registry-grid-list-viewer.js');
var fdsCore = require('@fluid-design-system/core');
var ngCommonHttp = require('@angular/common/http');
var NfRegistryTokenInterceptor = require('nifi-registry/services/nf-registry.token.interceptor.js');
var NfRegistryAuthService = require('nifi-registry/services/nf-registry.auth.service.js');
var nfRegistryAuthGuardService = require('nifi-registry/services/nf-registry.auth-guard.service.js');
var NfStorage = require('nifi-registry/services/nf-storage.service.js');
var NfRegistryUser = require('nifi-registry/components/explorer/user/nf-registry-user.js');
var NfRegistryRenameBucket = require('nifi-registry/components/explorer/grid-list/dialog/rename-bucket/nf-registry-rename-bucket.js');
var NfEnableSecurityComponent = require('nifi-registry/components/login/nf-enable-secure-login.js');
var NfEnableUserComponent = require('nifi-registry/components/login/dialogs/nf-enable-user-login.js');
var NfRegistryHttpLogin = require('nifi-registry/components/login/nf-registry-http-login.js');
var NfRegistryHttpsLogout = require('nifi-registry/components/login/nf-registry-https-logout.js');
//var NfRegistryAddUsersToSelectedGroup = require('nifi-registry/components/user/sidenav/add-users-to-group/nf-registry-add-user-to-group.js');
//var NfRegistryAddToGroup =  require('nifi-registry/components/administration/users/sidenav/manage-group/nf-registry-manage-group.js');
var NfRegistryChangePassword = require('nifi-registry/components/login/dialogs/nf-change-password-dialog.js');
function NfRegistryModule() {
};

NfRegistryModule.prototype = {
    constructor: NfRegistryModule
};

NfRegistryModule.annotations = [
    new ngCore.NgModule({
        imports: [
            ngMoment.MomentModule,
            fdsCore,
            ngCommonHttp.HttpClientModule,
            NfRegistryRoutes
        ],
        declarations: [
            NfRegistry,
            NfRegistryExplorer,
            NfRegistryAdministration,
            NfRegistryUsersAdministration,
            NfRegistryManageUser,
            NfRegistryManageGroup,
            NfRegistryManageBucket,
            NfRegistryWorkflowAdministration,
            NfRegistryAddUser,
            NfRegistryCreateBucket,
            NfRegistryCreateNewGroup,
            NfRegistryAddUserToGroups,
            NfRegistryAddUsersToGroup,
            NfRegistryAddPolicyToBucket,
            NfRegistryEditBucketPolicy,
            NfRegistryGridListViewer,
            NfPageNotFoundComponent,
            NfLoginComponent,
            NfRegistryUser,
            NfRegistryRenameBucket,
            NfEnableSecurityComponent,
            NfEnableUserComponent,
//            NfRegistryAddUsersToSelectedGroup,
  //          NfRegistryAddToGroup,
            NfUserLoginComponent,
            NfRegistryHttpLogin,
            NfRegistryHttpsLogout,
            NfRegistryChangePassword
        ],
        entryComponents: [
            NfRegistryAddUser,
            NfRegistryCreateBucket,
            NfRegistryCreateNewGroup,
            NfRegistryAddUserToGroups,
            NfRegistryAddUsersToGroup,
            NfRegistryAddPolicyToBucket,
            NfRegistryEditBucketPolicy,
            NfUserLoginComponent,
            NfRegistryRenameBucket,
            NfEnableUserComponent,
            NfRegistryHttpsLogout,
            NfRegistryChangePassword
        ],
        providers: [
            NfRegistryService,
            NfRegistryAuthService,
            nfRegistryAuthGuardService.NfRegistryUsersAdministrationAuthGuard,
            nfRegistryAuthGuardService.NfRegistryWorkflowsAdministrationAuthGuard,
            nfRegistryAuthGuardService.NfRegistryLoginAuthGuard,
            nfRegistryAuthGuardService.NfRegistryResourcesAuthGuard,
            nfRegistryAuthGuardService.NfEnableSecurity,
            nfRegistryAuthGuardService.NfRegistryWithoutUMSLogin,
            NfRegistryApi,
            NfStorage,
            {
                provide: ngCommonHttp.HTTP_INTERCEPTORS,
                useClass: NfRegistryTokenInterceptor,
                multi: true
            }
        ],
        bootstrap: [NfRegistry]
    })
];

module.exports = NfRegistryModule;