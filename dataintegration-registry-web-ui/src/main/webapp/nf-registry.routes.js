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
var NfPageNotFoundComponent = require('nifi-registry/components/page-not-found/nf-registry-page-not-found.js');
var NfLoginComponent = require('nifi-registry/components/login/nf-registry-login.js');
var NfRegistryExplorer = require('nifi-registry/components/explorer/nf-registry-explorer.js');
var NfRegistryAdministration = require('nifi-registry/components/administration/nf-registry-administration.js');
var NfRegistryUsersAdministration = require('nifi-registry/components/administration/users/nf-registry-users-administration.js');
var NfRegistryManageUser = require('nifi-registry/components/administration/users/sidenav/manage-user/nf-registry-manage-user.js');
var NfRegistryManageGroup = require('nifi-registry/components/administration/users/sidenav/manage-group/nf-registry-manage-group.js');
var NfRegistryManageBucket = require('nifi-registry/components/administration/workflow/sidenav/manage-bucket/nf-registry-manage-bucket.js');
var NfRegistryWorkflowAdministration = require('nifi-registry/components/administration/workflow/nf-registry-workflow-administration.js');
var NfRegistryGridListViewer = require('nifi-registry/components/explorer/grid-list/registry/nf-registry-grid-list-viewer.js');
var nfRegistryAuthGuardService = require('nifi-registry/services/nf-registry.auth-guard.service.js');
var NfEnableSecurityComponent = require('nifi-registry/components/login/nf-enable-secure-login.js');
var NfEnableUserComponent = require('nifi-registry/components/login/dialogs/nf-enable-user-login.js');
var NfRegistryUser = require('nifi-registry/components/explorer/user/nf-registry-user.js');
var NfRegistryHttpLogin = require('nifi-registry/components/login/nf-registry-http-login.js');
var NfRegistryHttpsLogout = require('nifi-registry/components/login/nf-registry-https-logout.js');
var NfRegistryRoutes = new ngRouter.RouterModule.forRoot([{
    path: 'dataintegration-registry/explorer',
    component: NfRegistryExplorer,
    children: [
        {
            path: 'grid-list',
            component: NfRegistryGridListViewer,
            canActivate: [nfRegistryAuthGuardService.NfRegistryResourcesAuthGuard]
        }, 
          {
            path:'user',
            component: NfRegistryUser,
            canActivate: [nfRegistryAuthGuardService.NfRegistryResourcesAuthGuard]
          },
//        {
//            path: 'grid-list/buckets/:bucketId',
//            component: NfRegistryBucketGridListViewer,
//            canActivate: [nfRegistryAuthGuardService.NfRegistryResourcesAuthGuard]
//        },
//        {
//            path: 'grid-list/buckets/:bucketId/:dropletType/:dropletId',
//            component: NfRegistryDropletGridListViewer,
//            canActivate: [nfRegistryAuthGuardService.NfRegistryResourcesAuthGuard]
//        }
    ]
}, {
    path: 'dataintegration-registry/login',
    component: NfLoginComponent,
    canActivate: [nfRegistryAuthGuardService.NfRegistryLoginAuthGuard]
},
  {
    path: 'dataintegration-registry/login/enable-security',
    component: NfEnableSecurityComponent,
    canActivate: [nfRegistryAuthGuardService.NfEnableSecurity]
},
 {
    path: 'dataintegration-registry/login/dataintegration-login',
    component: NfRegistryHttpLogin,
    canActivate: [nfRegistryAuthGuardService.NfRegistryWithoutUMSLogin]
},
 {
    path: 'dataintegration-registry/logout',
    component: NfRegistryHttpsLogout,
    canActivate: [nfRegistryAuthGuardService.NfRegistryUMSLogout]
},
    {
    path: 'dataintegration-registry/administration',
    component: NfRegistryAdministration,
    children: [{
        path: '',
        redirectTo: 'workflow',
        pathMatch: 'full'
    }, {
        path: 'users',
        component: NfRegistryUsersAdministration,
        canActivate: [nfRegistryAuthGuardService.NfRegistryUsersAdministrationAuthGuard]
    }, {
        path: 'workflow',
        component: NfRegistryWorkflowAdministration,
        canActivate: [nfRegistryAuthGuardService.NfRegistryWorkflowsAdministrationAuthGuard]
    }]
}, {
    path: 'dataintegration-registry/explorer/grid-list/buckets',
    redirectTo: '/dataintegration-registry/explorer/grid-list',
    pathMatch: 'full'
}, {
    path: 'dataintegration-registry',
    redirectTo: '/dataintegration-registry/explorer/grid-list'
}, {
    path: 'dataintegration-registry/explorer',
    redirectTo: '/dataintegration-registry/explorer/grid-list',
    pathMatch: 'full'
},
 {
    path: '',
    redirectTo: '/dataintegration-registry/explorer/grid-list',
    pathMatch: 'full'
},
{
    path: '**',
    component: NfPageNotFoundComponent
}, {
    path: 'manage/user/:userId',
    component: NfRegistryManageUser,
    canActivate: [nfRegistryAuthGuardService.NfRegistryUsersAdministrationAuthGuard],
    outlet: 'sidenav'
}, {
    path: 'manage/group/:groupId',
    component: NfRegistryManageGroup,
    canActivate: [nfRegistryAuthGuardService.NfRegistryUsersAdministrationAuthGuard],
    outlet: 'sidenav'
}, {
    path: 'manage/bucket/:bucketId',
    component: NfRegistryManageBucket,
    canActivate: [nfRegistryAuthGuardService.NfRegistryWorkflowsAdministrationAuthGuard],
    outlet: 'sidenav'
}]);

module.exports = NfRegistryRoutes;