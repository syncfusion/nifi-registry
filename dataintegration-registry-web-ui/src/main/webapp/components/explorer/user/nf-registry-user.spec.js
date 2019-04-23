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

var NfRegistryRoutes = require('nifi-registry/nf-registry.routes.js');
var ngCoreTesting = require('@angular/core/testing');
var ngCommon = require('@angular/common');
var ngCommonHttp = require('@angular/common/http');
var NfRegistryTokenInterceptor = require('nifi-registry/services/nf-registry.token.interceptor.js');
var NfRegistryAuthService = require('nifi-registry/services/nf-registry.auth.service.js');
var NfStorage = require('nifi-registry/services/nf-storage.service.js');
var ngPlatformBrowser = require('@angular/platform-browser');
var NfRegistry = require('nifi-registry/nf-registry.js');
var NfRegistryApi = require('nifi-registry/services/nf-registry.api.js');
var NfRegistryService = require('nifi-registry/services/nf-registry.service.js');
var NfPageNotFoundComponent = require('nifi-registry/components/page-not-found/nf-registry-page-not-found.js');
var NfRegistryExplorer = require('nifi-registry/components/explorer/nf-registry-explorer.js');
var NfRegistryUser = require('nifi-registry/components/explorer/user/nf-registry-user.js');
var NfRegistryUsersAdministration = require('nifi-registry/components/administration/users/nf-registry-users-administration.js');
var NfRegistryManageUser = require('nifi-registry/components/administration/users/sidenav/manage-user/nf-registry-manage-user.js');
//var NfRegistryManageGroup = require('nifi-registry/components/administration/users/sidenav/manage-group/nf-registry-manage-group.js');
var NfRegistryManageBucket = require('nifi-registry/components/administration/workflow/sidenav/manage-bucket/nf-registry-manage-bucket.js');
var NfRegistryWorkflowAdministration = require('nifi-registry/components/administration/workflow/nf-registry-workflow-administration.js');
var NfRegistryGridListViewer = require('nifi-registry/components/explorer/grid-list/registry/nf-registry-grid-list-viewer.js');
var fdsCore = require('@fluid-design-system/core');
var ngMoment = require('angular2-moment');
var rxjs = require('rxjs/Rx');
var NfLoginComponent = require('nifi-registry/components/login/nf-registry-login.js');
var NfUserLoginComponent = require('nifi-registry/components/login/dialogs/nf-registry-user-login.js');
var NfRegistryRenameBucket = require('nifi-registry/components/explorer/grid-list/dialog/rename-bucket/nf-registry-rename-bucket.js');
var NfEnableSecurityComponent = require('nifi-registry/components/login/nf-enable-secure-login.js');
var NfEnableUserComponent = require('nifi-registry/components/login/dialogs/nf-enable-user-login.js');
//var NfRegistryAddUsersToSelectedGroup = require('nifi-registry/components/user/sidenav/add-users-to-group/nf-registry-add-user-to-group.js');
var NfRegistryAddToGroup =  require('nifi-registry/components/administration/users/sidenav/manage-group/nf-registry-manage-group.js');
var NfRegistryHttpLogin = require('nifi-registry/components/login/nf-registry-http-login.js');
var NfRegistryHttpsLogout = require('nifi-registry/components/login/nf-registry-https-logout.js');
describe('NfRegistryUser Component', function () {
    var comp;
    var fixture;
    var de;
    var el;
    var nfRegistryService;
    var nfRegistryApi;

    beforeEach(function () {
        ngCoreTesting.TestBed.configureTestingModule({
            imports: [
                ngMoment.MomentModule,
                ngCommonHttp.HttpClientModule,
                fdsCore,
                NfRegistryRoutes
            ],
            declarations: [
                NfRegistry,
                NfRegistryExplorer,
                NfRegistryUser,
                NfRegistryUsersAdministration,
                NfRegistryManageUser,
                NfRegistryManageBucket,
                NfRegistryWorkflowAdministration,
                NfRegistryGridListViewer,
                NfPageNotFoundComponent,
                NfLoginComponent,
                NfRegistryRenameBucket,
                NfRegistryAddToGroup,
                NfUserLoginComponent,
                NfEnableSecurityComponent,
                NfEnableUserComponent,
                NfRegistryHttpLogin,
                NfRegistryHttpsLogout
            ],
            providers: [
                NfRegistryService,
                NfRegistryAuthService,
                NfRegistryApi,
                NfStorage,
                {
                    provide: ngCommonHttp.HTTP_INTERCEPTORS,
                    useClass: NfRegistryTokenInterceptor,
                    multi: true
                },
                {
                    provide: ngCommon.APP_BASE_HREF,
                    useValue: '/'
                }
            ]
        });

        fixture = ngCoreTesting.TestBed.createComponent(NfRegistryUser);

        // test instance
        comp = fixture.componentInstance;

        // from the root injector
        nfRegistryService = ngCoreTesting.TestBed.get(NfRegistryService);
        nfRegistryApi = ngCoreTesting.TestBed.get(NfRegistryApi);
        de = fixture.debugElement.query(ngPlatformBrowser.By.css('#nifi-registry-user-perspective'));
        el = de.nativeElement;

        // Spy
        spyOn(nfRegistryApi, 'getDroplets').and.callFake(function () {
        }).and.returnValue(rxjs.Observable.of([{
            "identifier": "2e04b4fb-9513-47bb-aa74-1ae34616bfdc",
            "name": "Flow #1",
            "description": "This is flow #1",
            "bucketIdentifier": "2f7f9e54-dc09-4ceb-aa58-9fe581319cdc",
            "createdTimestamp": 1505931890999,
            "modifiedTimestamp": 1505931890999,
            "type": "FLOW",
            "snapshotMetadata": null,
            "link": {
                "params": {
                    "rel": "self"
                },
                "href": "flows/2e04b4fb-9513-47bb-aa74-1ae34616bfdc"
            }
        }]));
    });

    it('should have a defined component', function () {
        fixture.detectChanges();

        //assertions
        expect(comp).toBeDefined();
        expect(nfRegistryService.perspective).toBe('user');
        expect(nfRegistryService.breadCrumbState).toBe('in');
        expect(de).toBeDefined();
    });

    it('should destroy the component', function () {
        fixture.detectChanges();

        // The function to test
        comp.ngOnDestroy();

        //assertions
        expect(nfRegistryService.perspective).toBe('');
        expect(nfRegistryService.breadCrumbState).toBe('out');
    });
});